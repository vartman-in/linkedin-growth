import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { WorkspaceRepository, UserRepository, WorkspaceMemberRepository } from '../server/repositories/workspace.repository';
import { ProfileRepository } from '../server/repositories/profile.repository';
import { ICPRepository } from '../server/repositories/icp.repository';
import { ContentIdeaRepository } from '../server/repositories/content-idea.repository';
import { ContentDraftRepository } from '../server/repositories/content-draft.repository';
import { LeadRepository } from '../server/repositories/lead.repository';
import { testPool, runMigrations, cleanup } from './setup';

describe('Phase 1 Backend Foundation', () => {
  let workspaceRepo: WorkspaceRepository;
  let userRepo: UserRepository;
  let memberRepo: WorkspaceMemberRepository;
  let profileRepo: ProfileRepository;
  let icpRepo: ICPRepository;
  let contentIdeaRepo: ContentIdeaRepository;
  let contentDraftRepo: ContentDraftRepository;
  let leadRepo: LeadRepository;

  let workspace1Id: string;
  let workspace2Id: string;
  let user1Id: string;
  let user2Id: string;

  beforeAll(async () => {
    // Run migrations against in-memory database
    await runMigrations();
    
    workspaceRepo = new WorkspaceRepository(testPool);
    userRepo = new UserRepository(testPool);
    memberRepo = new WorkspaceMemberRepository(testPool);
    profileRepo = new ProfileRepository(testPool);
    icpRepo = new ICPRepository(testPool);
    contentIdeaRepo = new ContentIdeaRepository(testPool);
    contentDraftRepo = new ContentDraftRepository(testPool);
    leadRepo = new LeadRepository(testPool);
  });

  beforeEach(async () => {
    // Clean up test data using in-memory database cleanup
    await cleanup();
    await runMigrations();
  });

  afterAll(async () => {
    // No cleanup needed for in-memory database
  });

  describe('Health Check', () => {
    it('should verify database connection', async () => {
      const result = await testPool.query('SELECT NOW()');
      expect(result.rows[0].now).toBeDefined();
    });
  });

  describe('Workspace Management', () => {
    it('should create a workspace', async () => {
      const workspace = await workspaceRepo.create('Test Workspace');
      expect(workspace.id).toBeDefined();
      expect(workspace.name).toBe('Test Workspace');
    });

    it('should find workspace by ID', async () => {
      const created = await workspaceRepo.create('Test Workspace');
      const found = await workspaceRepo.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.name).toBe('Test Workspace');
    });

    it('should update workspace', async () => {
      const workspace = await workspaceRepo.create('Old Name');
      const updated = await workspaceRepo.update(workspace.id, 'New Name');
      expect(updated?.name).toBe('New Name');
    });

    it('should delete workspace', async () => {
      const workspace = await workspaceRepo.create('To Delete');
      const deleted = await workspaceRepo.delete(workspace.id);
      expect(deleted).toBe(true);
      const found = await workspaceRepo.findById(workspace.id);
      expect(found).toBeNull();
    });
  });

  describe('User Management', () => {
    it('should create a user', async () => {
      const user = await userRepo.create('test@example.com', 'Test User');
      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
    });

    it('should enforce unique email', async () => {
      await userRepo.create('unique@example.com', 'User 1');
      await expect(userRepo.create('unique@example.com', 'User 2')).rejects.toThrow();
    });
  });

  describe('Workspace Membership', () => {
    it('should add member to workspace', async () => {
      const workspace = await workspaceRepo.create('Test Workspace');
      const user = await userRepo.create('member@example.com', 'Member');
      const member = await memberRepo.addMember(workspace.id, user.id, 'MEMBER');
      expect(member.workspace_id).toBe(workspace.id);
      expect(member.user_id).toBe(user.id);
      expect(member.role).toBe('MEMBER');
    });

    it('should enforce unique membership', async () => {
      const workspace = await workspaceRepo.create('Test Workspace');
      const user = await userRepo.create('member@example.com', 'Member');
      await memberRepo.addMember(workspace.id, user.id, 'MEMBER');
      await expect(memberRepo.addMember(workspace.id, user.id, 'MEMBER')).rejects.toThrow();
    });

    it('should find members by workspace', async () => {
      const workspace = await workspaceRepo.create('Test Workspace');
      const user1 = await userRepo.create('user1@example.com', 'User 1');
      const user2 = await userRepo.create('user2@example.com', 'User 2');
      await memberRepo.addMember(workspace.id, user1.id, 'OWNER');
      await memberRepo.addMember(workspace.id, user2.id, 'MEMBER');
      
      const members = await memberRepo.findByWorkspace(workspace.id);
      expect(members.length).toBe(2);
    });
  });

  describe('Workspace Isolation', () => {
    beforeEach(async () => {
      // Create two separate workspaces
      const ws1 = await workspaceRepo.create('Workspace 1');
      const ws2 = await workspaceRepo.create('Workspace 2');
      workspace1Id = ws1.id;
      workspace2Id = ws2.id;

      const u1 = await userRepo.create('user1@test.com', 'User 1');
      const u2 = await userRepo.create('user2@test.com', 'User 2');
      user1Id = u1.id;
      user2Id = u2.id;

      await memberRepo.addMember(workspace1Id, user1Id, 'OWNER');
      await memberRepo.addMember(workspace2Id, user2Id, 'OWNER');
    });

    it('should isolate profiles between workspaces', async () => {
      // Create profile in workspace 1
      await profileRepo.create(workspace1Id, user1Id, {
        display_name: 'User 1 Profile',
      });

      // Try to find it in workspace 2
      const profile = await profileRepo.findByWorkspaceAndUser(workspace2Id, user1Id);
      expect(profile).toBeNull();

      // Should find it in workspace 1
      const correctProfile = await profileRepo.findByWorkspaceAndUser(workspace1Id, user1Id);
      expect(correctProfile).toBeDefined();
      expect(correctProfile?.display_name).toBe('User 1 Profile');
    });

    it('should isolate ICPs between workspaces', async () => {
      // Create ICP in workspace 1
      await icpRepo.create(workspace1Id, 'ICP 1', {
        target_roles: ['Developer'],
      });

      // Should not find it in workspace 2
      const icps = await icpRepo.findByWorkspace(workspace2Id);
      expect(icps.length).toBe(0);

      // Should find it in workspace 1
      const correctIcps = await icpRepo.findByWorkspace(workspace1Id);
      expect(correctIcps.length).toBe(1);
    });

    it('should isolate content ideas between workspaces', async () => {
      // Create idea in workspace 1
      await contentIdeaRepo.create(workspace1Id, 'Idea 1');

      // Should not find it in workspace 2
      const ideas = await contentIdeaRepo.findByWorkspace(workspace2Id);
      expect(ideas.length).toBe(0);

      // Should find it in workspace 1
      const correctIdeas = await contentIdeaRepo.findByWorkspace(workspace1Id);
      expect(correctIdeas.length).toBe(1);
    });

    it('should isolate leads between workspaces', async () => {
      // Create lead in workspace 1
      await leadRepo.create(workspace1Id, 'Lead 1');

      // Should not find it in workspace 2
      const leads = await leadRepo.findByWorkspace(workspace2Id);
      expect(leads.length).toBe(0);

      // Should find it in workspace 1
      const correctLeads = await leadRepo.findByWorkspace(workspace1Id);
      expect(correctLeads.length).toBe(1);
    });
  });

  describe('Profile CRUD', () => {
    beforeEach(async () => {
      const ws = await workspaceRepo.create('Test Workspace');
      workspace1Id = ws.id;
      const u = await userRepo.create('user@test.com', 'User');
      user1Id = u.id;
      await memberRepo.addMember(workspace1Id, user1Id, 'OWNER');
    });

    it('should create profile', async () => {
      const profile = await profileRepo.create(workspace1Id, user1Id, {
        display_name: 'Test User',
        headline: 'Test Headline',
        role: 'Developer',
      });
      expect(profile.id).toBeDefined();
      expect(profile.display_name).toBe('Test User');
    });

    it('should update profile', async () => {
      await profileRepo.create(workspace1Id, user1Id, {
        display_name: 'Old Name',
      });
      const updated = await profileRepo.update(workspace1Id, user1Id, {
        display_name: 'New Name',
      });
      expect(updated?.display_name).toBe('New Name');
    });

    it('should delete profile', async () => {
      await profileRepo.create(workspace1Id, user1Id, {
        display_name: 'To Delete',
      });
      const deleted = await profileRepo.delete(workspace1Id, user1Id);
      expect(deleted).toBe(true);
    });
  });

  describe('ICP CRUD', () => {
    beforeEach(async () => {
      const ws = await workspaceRepo.create('Test Workspace');
      workspace1Id = ws.id;
    });

    it('should create ICP', async () => {
      const icp = await icpRepo.create(workspace1Id, 'Test ICP', {
        target_roles: ['Developer', 'Designer'],
        industries: ['Technology'],
      });
      expect(icp.id).toBeDefined();
      expect(icp.name).toBe('Test ICP');
      expect(icp.target_roles).toContain('Developer');
    });

    it('should update ICP', async () => {
      const icp = await icpRepo.create(workspace1Id, 'Old ICP');
      const updated = await icpRepo.update(workspace1Id, icp.id, {
        name: 'New ICP',
        target_roles: ['Manager'],
      });
      expect(updated?.name).toBe('New ICP');
      expect(updated?.target_roles).toContain('Manager');
    });

    it('should delete ICP', async () => {
      const icp = await icpRepo.create(workspace1Id, 'To Delete');
      const deleted = await icpRepo.delete(workspace1Id, icp.id);
      expect(deleted).toBe(true);
    });
  });

  describe('Content Idea CRUD', () => {
    beforeEach(async () => {
      const ws = await workspaceRepo.create('Test Workspace');
      workspace1Id = ws.id;
    });

    it('should create content idea', async () => {
      const idea = await contentIdeaRepo.create(workspace1Id, 'Test Idea', {
        pillar: 'Technology',
        audience: 'Developers',
      });
      expect(idea.id).toBeDefined();
      expect(idea.title).toBe('Test Idea');
      expect(idea.status).toBe('NEW');
    });

    it('should update content idea', async () => {
      const idea = await contentIdeaRepo.create(workspace1Id, 'Old Title');
      const updated = await contentIdeaRepo.update(workspace1Id, idea.id, {
        title: 'New Title',
        status: 'VALIDATED',
      });
      expect(updated?.title).toBe('New Title');
      expect(updated?.status).toBe('VALIDATED');
    });

    it('should delete content idea', async () => {
      const idea = await contentIdeaRepo.create(workspace1Id, 'To Delete');
      const deleted = await contentIdeaRepo.delete(workspace1Id, idea.id);
      expect(deleted).toBe(true);
    });
  });

  describe('Content Draft CRUD', () => {
    beforeEach(async () => {
      const ws = await workspaceRepo.create('Test Workspace');
      workspace1Id = ws.id;
    });

    it('should create content draft', async () => {
      const draft = await contentDraftRepo.create(
        workspace1Id,
        'Test Draft',
        'This is the body',
        'post'
      );
      expect(draft.id).toBeDefined();
      expect(draft.title).toBe('Test Draft');
      expect(draft.body).toBe('This is the body');
      expect(draft.status).toBe('DRAFT');
    });

    it('should update content draft', async () => {
      const draft = await contentDraftRepo.create(workspace1Id, 'Old', 'Body', 'post');
      const updated = await contentDraftRepo.update(workspace1Id, draft.id, {
        title: 'New',
        status: 'APPROVED',
      });
      expect(updated?.title).toBe('New');
      expect(updated?.status).toBe('APPROVED');
    });

    it('should delete content draft', async () => {
      const draft = await contentDraftRepo.create(workspace1Id, 'To Delete', 'Body', 'post');
      const deleted = await contentDraftRepo.delete(workspace1Id, draft.id);
      expect(deleted).toBe(true);
    });
  });

  describe('Lead CRUD', () => {
    beforeEach(async () => {
      const ws = await workspaceRepo.create('Test Workspace');
      workspace1Id = ws.id;
    });

    it('should create lead', async () => {
      const lead = await leadRepo.create(workspace1Id, 'John Doe', {
        company: 'Acme Corp',
        title: 'CEO',
      });
      expect(lead.id).toBeDefined();
      expect(lead.name).toBe('John Doe');
      expect(lead.company).toBe('Acme Corp');
    });

    it('should update lead', async () => {
      const lead = await leadRepo.create(workspace1Id, 'Old Name');
      const updated = await leadRepo.update(workspace1Id, lead.id, {
        name: 'New Name',
        status: 'QUALIFIED',
      });
      expect(updated?.name).toBe('New Name');
      expect(updated?.status).toBe('QUALIFIED');
    });

    it('should delete lead', async () => {
      const lead = await leadRepo.create(workspace1Id, 'To Delete');
      const deleted = await leadRepo.delete(workspace1Id, lead.id);
      expect(deleted).toBe(true);
    });
  });
});
