import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../server/app';
import { Pool } from 'pg';
import { AuthService } from '../server/services/auth.service';

describe('Authentication and Authorization Security Tests', () => {
  let pool: Pool;
  let authService: AuthService;
  let userAToken: string;
  let userBToken: string;
  let workspaceAId: string;
  let workspaceBId: string;
  let userAId: string;
  let userBId: string;
  let contentIdeaAId: string;
  let leadAId: string;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL_TEST || 'postgresql://postgres:postgres@localhost:5432/growth_operator_test'
    });
    authService = new AuthService(pool);

    // Clean up test data
    await pool.query('DELETE FROM audit_log');
    await pool.query('DELETE FROM learning_signals');
    await pool.query('DELETE FROM analytics_events');
    await pool.query('DELETE FROM pipeline_opportunities');
    await pool.query('DELETE FROM messages');
    await pool.query('DELETE FROM conversations');
    await pool.query('DELETE FROM leads');
    await pool.query('DELETE FROM content_drafts');
    await pool.query('DELETE FROM content_ideas');
    await pool.query('DELETE FROM icps');
    await pool.query('DELETE FROM profiles');
    await pool.query('DELETE FROM workspace_members');
    await pool.query('DELETE FROM users');
    await pool.query('DELETE FROM workspaces');

    // Create User A and Workspace A
    const userAResult = await authService.register('userA@test.com', 'password123', 'User A');
    userAId = userAResult.user.id;
    userAToken = userAResult.token;

    const workspaceAResult = await pool.query(
      'INSERT INTO workspaces (name) VALUES ($1) RETURNING id',
      ['Workspace A']
    );
    workspaceAId = workspaceAResult.rows[0].id;

    await pool.query(
      'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)',
      [workspaceAId, userAId, 'OWNER']
    );

    // Create User B and Workspace B
    const userBResult = await authService.register('userB@test.com', 'password123', 'User B');
    userBId = userBResult.user.id;
    userBToken = userBResult.token;

    const workspaceBResult = await pool.query(
      'INSERT INTO workspaces (name) VALUES ($1) RETURNING id',
      ['Workspace B']
    );
    workspaceBId = workspaceBResult.rows[0].id;

    await pool.query(
      'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)',
      [workspaceBId, userBId, 'OWNER']
    );

    // Create test data in Workspace A
    const contentIdeaResult = await pool.query(
      `INSERT INTO content_ideas (workspace_id, title, status) 
       VALUES ($1, $2, $3) RETURNING id`,
      [workspaceAId, 'Test Idea A', 'NEW']
    );
    contentIdeaAId = contentIdeaResult.rows[0].id;

    const leadResult = await pool.query(
      `INSERT INTO leads (workspace_id, name, company, status) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [workspaceAId, 'Lead A', 'Company A', 'NEW']
    );
    leadAId = leadResult.rows[0].id;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('TEST 1: Missing JWT', () => {
    it('should return 401 when no JWT is provided', async () => {
      const response = await request(app)
        .get('/api/v1/content/ideas')
        .expect(401);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('TEST 2: Invalid JWT', () => {
    it('should return 401 when invalid JWT is provided', async () => {
      const response = await request(app)
        .get('/api/v1/content/ideas')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('TEST 3: Expired JWT', () => {
    it('should return 401 when expired JWT is provided', async () => {
      // Create an expired token (this is a simplified test - in reality you'd need to create a token with past expiration)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJleHBpcmVkIiwiZXhwIjoxfQ.invalid';
      
      const response = await request(app)
        .get('/api/v1/content/ideas')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('TEST 4: Valid JWT', () => {
    it('should allow access with valid JWT', async () => {
      const response = await request(app)
        .get('/api/v1/content/ideas')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('TEST 5: User B GETs User A lead', () => {
    it('should return 403/404 when User B tries to access User A lead', async () => {
      const response = await request(app)
        .get(`/api/v1/sales/leads/${leadAId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .expect((res) => {
          // Should be either 403 or 404
          expect([403, 404]).toContain(res.status);
        });

      expect(response.body.error).toBeDefined();
    });
  });

  describe('TEST 6: User B updates User A lead', () => {
    it('should return 403/404 when User B tries to update User A lead', async () => {
      const response = await request(app)
        .put(`/api/v1/sales/leads/${leadAId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ name: 'Hacked Lead' })
        .expect((res) => {
          expect([403, 404]).toContain(res.status);
        });

      expect(response.body.error).toBeDefined();

      // Verify lead was not updated
      const checkResult = await pool.query(
        'SELECT name FROM leads WHERE id = $1',
        [leadAId]
      );
      expect(checkResult.rows[0].name).toBe('Lead A');
    });
  });

  describe('TEST 7: User B deletes User A lead', () => {
    it('should return 403/404 when User B tries to delete User A lead', async () => {
      const response = await request(app)
        .delete(`/api/v1/sales/leads/${leadAId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .expect((res) => {
          expect([403, 404]).toContain(res.status);
        });

      expect(response.body.error).toBeDefined();

      // Verify lead was not deleted
      const checkResult = await pool.query(
        'SELECT * FROM leads WHERE id = $1',
        [leadAId]
      );
      expect(checkResult.rows.length).toBe(1);
    });
  });

  describe('TEST 8: User B accesses User A content draft', () => {
    it('should return 403/404 when User B tries to access User A content idea', async () => {
      const response = await request(app)
        .get(`/api/v1/content/ideas/${contentIdeaAId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .expect((res) => {
          expect([403, 404]).toContain(res.status);
        });

      expect(response.body.error).toBeDefined();
    });
  });

  describe('TEST 9: User B attempts to approve User A draft', () => {
    it('should return 403/404 when User B tries to approve User A content', async () => {
      // First create a draft in Workspace A
      const draftResult = await pool.query(
        `INSERT INTO content_drafts (workspace_id, idea_id, title, body, content_type, status) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [workspaceAId, contentIdeaAId, 'Draft A', 'Body A', 'text', 'IN_REVIEW']
      );
      const draftAId = draftResult.rows[0].id;

      const response = await request(app)
        .post(`/api/v1/content-ideas/drafts/${draftAId}/approve`)
        .set('Authorization', `Bearer ${userBToken}`)
        .expect((res) => {
          expect([403, 404]).toContain(res.status);
        });

      expect(response.body.error).toBeDefined();

      // Verify draft was not approved
      const checkResult = await pool.query(
        'SELECT status FROM content_drafts WHERE id = $1',
        [draftAId]
      );
      expect(checkResult.rows[0].status).toBe('IN_REVIEW');
    });
  });

  describe('TEST 10: Client-supplied workspaceId cannot override authenticated workspace', () => {
    it('should ignore workspaceId in request body', async () => {
      const response = await request(app)
        .post('/api/v1/content/ideas')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ 
          title: 'Test Idea',
          workspaceId: workspaceAId // Try to override with Workspace A
        })
        .expect(201);

      // Verify content was created in User B's workspace, not Workspace A
      const checkResult = await pool.query(
        'SELECT workspace_id FROM content_ideas WHERE id = $1',
        [response.body.id]
      );
      expect(checkResult.rows[0].workspace_id).toBe(workspaceBId);
      expect(checkResult.rows[0].workspace_id).not.toBe(workspaceAId);
    });

    it('should ignore workspaceId in query parameters', async () => {
      const response = await request(app)
        .get('/api/v1/content/ideas')
        .query({ workspaceId: workspaceAId }) // Try to override
        .set('Authorization', `Bearer ${userBToken}`)
        .expect(200);

      // Should only return User B's content ideas
      expect(response.body.length).toBe(0); // User B has no content ideas
    });
  });

  describe('TEST 11: Manipulated JWT', () => {
    it('should return 401 when JWT signature is manipulated', async () => {
      // Take a valid token and modify the payload
      const parts = userAToken.split('.');
      const manipulatedToken = `${parts[0]}.${parts[1]}modified.${parts[2]}`;
      
      const response = await request(app)
        .get('/api/v1/content/ideas')
        .set('Authorization', `Bearer ${manipulatedToken}`)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('TEST 12: Valid JWT + authorized workspace', () => {
    it('should allow access to own workspace resources', async () => {
      // User A should be able to access their own content
      const response = await request(app)
        .get(`/api/v1/content/ideas/${contentIdeaAId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(response.body.id).toBe(contentIdeaAId);
      expect(response.body.title).toBe('Test Idea A');
    });

    it('should allow User B to access their own workspace resources', async () => {
      // Create content in Workspace B
      const contentResult = await pool.query(
        `INSERT INTO content_ideas (workspace_id, title, status) 
         VALUES ($1, $2, $3) RETURNING id`,
        [workspaceBId, 'Test Idea B', 'NEW']
      );
      const contentBId = contentResult.rows[0].id;

      // User B should be able to access their own content
      const response = await request(app)
        .get(`/api/v1/content/ideas/${contentBId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .expect(200);

      expect(response.body.id).toBe(contentBId);
      expect(response.body.title).toBe('Test Idea B');
    });
  });

  describe('Additional Security Tests', () => {
    it('should prevent cross-workspace profile access', async () => {
      // Create profile in Workspace A
      const profileResult = await pool.query(
        `INSERT INTO profiles (workspace_id, user_id, display_name) 
         VALUES ($1, $2, $3) RETURNING id`,
        [workspaceAId, userAId, 'User A Profile']
      );
      const profileAId = profileResult.rows[0].id;

      // User B should NOT be able to access Workspace A profile
      const response = await request(app)
        .get(`/api/v1/profiles/${profileAId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .expect((res) => {
          expect([403, 404]).toContain(res.status);
        });

      expect(response.body.error).toBeDefined();
    });

    it('should prevent cross-workspace ICP access', async () => {
      // Create ICP in Workspace A
      const icpResult = await pool.query(
        `INSERT INTO icps (workspace_id, name) 
         VALUES ($1, $2) RETURNING id`,
        [workspaceAId, 'ICP A']
      );
      const icpAId = icpResult.rows[0].id;

      // User B should NOT be able to access Workspace A ICP
      const response = await request(app)
        .get(`/api/v1/icps/${icpAId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .expect((res) => {
          expect([403, 404]).toContain(res.status);
        });

      expect(response.body.error).toBeDefined();
    });

    it('should only allow owners to update workspace', async () => {
      // Add User B as MEMBER to Workspace A
      await pool.query(
        'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)',
        [workspaceAId, userBId, 'MEMBER']
      );

      // User B (MEMBER) tries to update Workspace A
      const response = await request(app)
        .put(`/api/v1/workspaces/${workspaceAId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ name: 'Hacked Workspace' })
        .expect(403);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('owners');
    });
  });
});
