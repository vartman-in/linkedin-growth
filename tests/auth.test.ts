/**
 * Authentication and Authorization Tests
 * Tests JWT validation, workspace isolation, and cross-workspace security
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { Pool } from 'pg';
import app from '../server/app';
import { AuthService } from '../server/services/auth.service';
import { testPool, runMigrations, cleanup } from './setup';

describe('Authentication and Authorization', () => {
  let authService: AuthService;
  let userAToken: string;
  let userBToken: string;
  let workspaceAId: string;
  let workspaceBId: string;
  let userAId: string;
  let userBId: string;

  beforeAll(async () => {
    // Run migrations
    await runMigrations();
    authService = new AuthService(testPool);
  });

  beforeEach(async () => {
    // Clean up test data
    await cleanup();
    await runMigrations();

    // Create User A and Workspace A
    const userAResult = await authService.register('userA@test.com', 'password123', 'User A');
    userAId = userAResult.user.id;
    userAToken = userAResult.token;

    const workspaceAResult = await testPool.query(
      'INSERT INTO workspaces (name) VALUES ($1) RETURNING id',
      ['Workspace A']
    );
    workspaceAId = workspaceAResult.rows[0].id;

    await testPool.query(
      'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)',
      [workspaceAId, userAId, 'OWNER']
    );

    // Create User B and Workspace B
    const userBResult = await authService.register('userB@test.com', 'password123', 'User B');
    userBId = userBResult.user.id;
    userBToken = userBResult.token;

    const workspaceBResult = await testPool.query(
      'INSERT INTO workspaces (name) VALUES ($1) RETURNING id',
      ['Workspace B']
    );
    workspaceBId = workspaceBResult.rows[0].id;

    await testPool.query(
      'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)',
      [workspaceBId, userBId, 'OWNER']
    );
  });

  afterAll(async () => {
    await testPool.end();
  });

  describe('JWT Token Validation', () => {
    it('should reject requests without JWT token', async () => {
      const response = await request(app)
        .get('/api/v1/content/ideas')
        .expect(401);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject requests with invalid JWT token', async () => {
      const response = await request(app)
        .get('/api/v1/content/ideas')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject requests with malformed JWT token', async () => {
      const response = await request(app)
        .get('/api/v1/content/ideas')
        .set('Authorization', 'Bearer')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should accept requests with valid JWT token', async () => {
      const response = await request(app)
        .get('/api/v1/content/ideas')
        .set('Authorization', `Bearer ${userAToken}`)
        .set('X-Workspace-Id', workspaceAId)
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('Workspace Isolation', () => {
    it('should allow user to access their own workspace content', async () => {
      // Create content in Workspace A
      const contentResult = await testPool.query(
        `INSERT INTO content_ideas (workspace_id, title, status) 
         VALUES ($1, $2, $3) RETURNING id`,
        [workspaceAId, 'Test Idea', 'NEW']
      );
      const contentId = contentResult.rows[0].id;

      // User A should be able to access it
      const response = await request(app)
        .get(`/api/v1/content/ideas/${contentId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .set('X-Workspace-Id', workspaceAId)
        .expect(200);

      expect(response.body.id).toBe(contentId);
      expect(response.body.title).toBe('Test Idea');
    });

    it('should prevent user from accessing another workspace content', async () => {
      // Create content in Workspace A
      const contentResult = await testPool.query(
        `INSERT INTO content_ideas (workspace_id, title, status) 
         VALUES ($1, $2, $3) RETURNING id`,
        [workspaceAId, 'Secret Idea', 'NEW']
      );
      const contentId = contentResult.rows[0].id;

      // User B should NOT be able to access Workspace A content
      const response = await request(app)
        .get(`/api/v1/content/ideas/${contentId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .set('X-Workspace-Id', workspaceAId)
        .expect(403);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should prevent cross-workspace content creation', async () => {
      // User B tries to create content in Workspace A
      const response = await request(app)
        .post('/api/v1/content/ideas')
        .set('Authorization', `Bearer ${userBToken}`)
        .set('X-Workspace-Id', workspaceAId)
        .send({ title: 'Malicious Content' })
        .expect(403);

      expect(response.body.error).toBeDefined();

      // Verify content was not created
      const checkResult = await testPool.query(
        'SELECT * FROM content_ideas WHERE title = $1',
        ['Malicious Content']
      );
      expect(checkResult.rows.length).toBe(0);
    });

    it('should prevent cross-workspace content updates', async () => {
      // Create content in Workspace A
      const contentResult = await testPool.query(
        `INSERT INTO content_ideas (workspace_id, title, status) 
         VALUES ($1, $2, $3) RETURNING id`,
        [workspaceAId, 'Original Title', 'NEW']
      );
      const contentId = contentResult.rows[0].id;

      // User B tries to update Workspace A content
      const response = await request(app)
        .put(`/api/v1/content/ideas/${contentId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .set('X-Workspace-Id', workspaceAId)
        .send({ title: 'Hacked Title' })
        .expect(403);

      expect(response.body.error).toBeDefined();

      // Verify content was not updated
      const checkResult = await testPool.query(
        'SELECT title FROM content_ideas WHERE id = $1',
        [contentId]
      );
      expect(checkResult.rows[0].title).toBe('Original Title');
    });

    it('should prevent cross-workspace content deletion', async () => {
      // Create content in Workspace A
      const contentResult = await testPool.query(
        `INSERT INTO content_ideas (workspace_id, title, status) 
         VALUES ($1, $2, $3) RETURNING id`,
        [workspaceAId, 'Delete Me', 'NEW']
      );
      const contentId = contentResult.rows[0].id;

      // User B tries to delete Workspace A content
      const response = await request(app)
        .delete(`/api/v1/content/ideas/${contentId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .set('X-Workspace-Id', workspaceAId)
        .expect(403);

      expect(response.body.error).toBeDefined();

      // Verify content was not deleted
      const checkResult = await testPool.query(
        'SELECT * FROM content_ideas WHERE id = $1',
        [contentId]
      );
      expect(checkResult.rows.length).toBe(1);
    });
  });

  describe('Lead Isolation', () => {
    it('should prevent cross-workspace lead access', async () => {
      // Create lead in Workspace A
      const leadResult = await testPool.query(
        `INSERT INTO leads (workspace_id, name, company, status) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [workspaceAId, 'Secret Lead', 'Secret Corp', 'NEW']
      );
      const leadId = leadResult.rows[0].id;

      // User B should NOT be able to access Workspace A lead
      const response = await request(app)
        .get(`/api/v1/sales/leads/${leadId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .set('X-Workspace-Id', workspaceAId)
        .expect(403);

      expect(response.body.error).toBeDefined();
    });

    it('should prevent cross-workspace lead creation', async () => {
      // User B tries to create lead in Workspace A
      const response = await request(app)
        .post('/api/v1/sales/leads')
        .set('Authorization', `Bearer ${userBToken}`)
        .set('X-Workspace-Id', workspaceAId)
        .send({ name: 'Malicious Lead', company: 'Evil Corp' })
        .expect(403);

      expect(response.body.error).toBeDefined();

      // Verify lead was not created
      const checkResult = await testPool.query(
        'SELECT * FROM leads WHERE name = $1',
        ['Malicious Lead']
      );
      expect(checkResult.rows.length).toBe(0);
    });
  });

  describe('Profile Isolation', () => {
    it('should prevent cross-workspace profile access', async () => {
      // Create profile in Workspace A
      const profileResult = await testPool.query(
        `INSERT INTO profiles (workspace_id, user_id, display_name) 
         VALUES ($1, $2, $3) RETURNING id`,
        [workspaceAId, userAId, 'User A Profile']
      );
      const profileId = profileResult.rows[0].id;

      // User B should NOT be able to access Workspace A profile
      const response = await request(app)
        .get(`/api/v1/profiles/${profileId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .set('X-Workspace-Id', workspaceAId)
        .expect(403);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('ICP Isolation', () => {
    it('should prevent cross-workspace ICP access', async () => {
      // Create ICP in Workspace A
      const icpResult = await testPool.query(
        `INSERT INTO icps (workspace_id, name) 
         VALUES ($1, $2) RETURNING id`,
        [workspaceAId, 'Secret ICP']
      );
      const icpId = icpResult.rows[0].id;

      // User B should NOT be able to access Workspace A ICP
      const response = await request(app)
        .get(`/api/v1/icps/${icpId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .set('X-Workspace-Id', workspaceAId)
        .expect(403);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Workspace Management Authorization', () => {
    it('should only allow owners to update workspace', async () => {
      // Add User B as MEMBER to Workspace A
      await testPool.query(
        'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)',
        [workspaceAId, userBId, 'MEMBER']
      );

      // User B (MEMBER) tries to update Workspace A
      const response = await request(app)
        .put(`/api/v1/workspaces/${workspaceAId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .set('X-Workspace-Id', workspaceAId)
        .send({ name: 'Hacked Workspace' })
        .expect(403);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('owners');
    });

    it('should only allow owners to delete workspace', async () => {
      // Add User B as MEMBER to Workspace A
      await testPool.query(
        'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)',
        [workspaceAId, userBId, 'MEMBER']
      );

      // User B (MEMBER) tries to delete Workspace A
      const response = await request(app)
        .delete(`/api/v1/workspaces/${workspaceAId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .set('X-Workspace-Id', workspaceAId)
        .expect(403);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('owners');
    });

    it('should only allow owners to add members', async () => {
      // Add User B as MEMBER to Workspace A
      await testPool.query(
        'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)',
        [workspaceAId, userBId, 'MEMBER']
      );

      // Create a new user to add
      const newUserResult = await authService.register('newuser@test.com', 'password123', 'New User');
      const newUserId = newUserResult.user.id;

      // User B (MEMBER) tries to add member to Workspace A
      const response = await request(app)
        .post(`/api/v1/workspaces/${workspaceAId}/members`)
        .set('Authorization', `Bearer ${userBToken}`)
        .set('X-Workspace-Id', workspaceAId)
        .send({ userId: newUserId, role: 'MEMBER' })
        .expect(403);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('owners');
    });
  });

  describe('Client-Supplied Workspace ID Attack', () => {
    it('should ignore client-supplied workspaceId in request body', async () => {
      // Create content in Workspace A
      const contentResult = await testPool.query(
        `INSERT INTO content_ideas (workspace_id, title, status) 
         VALUES ($1, $2, $3) RETURNING id`,
        [workspaceAId, 'Test Idea', 'NEW']
      );

      // User B tries to create content with workspaceId in body pointing to Workspace A
      const response = await request(app)
        .post('/api/v1/content/ideas')
        .set('Authorization', `Bearer ${userBToken}`)
        .set('X-Workspace-Id', workspaceBId) // User B's workspace
        .send({ 
          title: 'Malicious Content',
          workspaceId: workspaceAId // Try to override with Workspace A
        })
        .expect(201);

      // Verify content was created in User B's workspace, not Workspace A
      const checkResult = await testPool.query(
        'SELECT workspace_id FROM content_ideas WHERE title = $1',
        ['Malicious Content']
      );
      expect(checkResult.rows[0].workspace_id).toBe(workspaceBId);
      expect(checkResult.rows[0].workspace_id).not.toBe(workspaceAId);
    });

    it('should ignore client-supplied workspaceId in URL params', async () => {
      // Create content in Workspace A
      const contentResult = await testPool.query(
        `INSERT INTO content_ideas (workspace_id, title, status) 
         VALUES ($1, $2, $3) RETURNING id`,
        [workspaceAId, 'Test Idea', 'NEW']
      );
      const contentId = contentResult.rows[0].id;

      // User B tries to access content with workspaceId in URL
      const response = await request(app)
        .get(`/api/v1/content/ideas/${contentId}`)
        .query({ workspaceId: workspaceAId }) // Try to override
        .set('Authorization', `Bearer ${userBToken}`)
        .set('X-Workspace-Id', workspaceBId)
        .expect(403); // Should fail because content is in Workspace A

      expect(response.body.error).toBeDefined();
    });
  });
});
