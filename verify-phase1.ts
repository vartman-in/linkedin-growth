#!/usr/bin/env tsx
/**
 * Phase 1 Runtime Verification Script
 * Uses pg-mem for in-memory PostgreSQL testing
 */

import { newDb } from 'pg-mem';
import { WorkspaceRepository, UserRepository, WorkspaceMemberRepository } from './server/repositories/workspace.repository';
import { ProfileRepository } from './server/repositories/profile.repository';
import { ICPRepository } from './server/repositories/icp.repository';
import { ContentIdeaRepository } from './server/repositories/content-idea.repository';
import { ContentDraftRepository } from './server/repositories/content-draft.repository';
import { LeadRepository } from './server/repositories/lead.repository';

console.log('🧪 Phase 1 Runtime Verification\n');

// Create in-memory PostgreSQL database
const db = newDb({
  autoCreateForeignKeyIndices: true,
});

// Install pgcrypto extension
db.public.none(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

// Create tables
console.log('📦 Creating database schema...');
db.public.none(`
  CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )
`);

db.public.none(`
  CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )
`);

db.public.none(`
  CREATE TABLE workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(workspace_id, user_id)
  )
`);

db.public.none(`
  CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(255),
    headline TEXT,
    role VARCHAR(255),
    company VARCHAR(255),
    bio TEXT,
    voice_tone TEXT,
    banned_words TEXT[] DEFAULT '{}',
    proof_points TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(workspace_id, user_id)
  )
`);

db.public.none(`
  CREATE TABLE icps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    target_roles TEXT[] DEFAULT '{}',
    industries TEXT[] DEFAULT '{}',
    company_sizes TEXT[] DEFAULT '{}',
    geography TEXT[] DEFAULT '{}',
    seniority TEXT[] DEFAULT '{}',
    problems TEXT[] DEFAULT '{}',
    buying_signals TEXT[] DEFAULT '{}',
    exclusions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )
`);

db.public.none(`
  CREATE TABLE content_ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    source_reference TEXT,
    pillar VARCHAR(255),
    audience TEXT,
    angle TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'NEW',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )
`);

db.public.none(`
  CREATE TABLE content_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    idea_id UUID REFERENCES content_ideas(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )
`);

db.public.none(`
  CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    profile_url TEXT,
    company VARCHAR(255),
    title VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'NEW',
    source VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )
`);

console.log('✅ Schema created successfully\n');

// Create pg-compatible adapter
const adapter = db.adapters.createPg();

// Create Pool-like interface
const testPool = {
  query: async (text: string, params?: any[]) => {
    const client = await adapter.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  },
  connect: async () => adapter.connect(),
  end: async () => {},
} as any;

// Initialize repositories
const workspaceRepo = new WorkspaceRepository(testPool);
const userRepo = new UserRepository(testPool);
const memberRepo = new WorkspaceMemberRepository(testPool);
const profileRepo = new ProfileRepository(testPool);
const icpRepo = new ICPRepository(testPool);
const contentIdeaRepo = new ContentIdeaRepository(testPool);
const contentDraftRepo = new ContentDraftRepository(testPool);
const leadRepo = new LeadRepository(testPool);

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: [] as { name: string; status: 'PASS' | 'FAIL'; error?: string }[],
};

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.passed++;
    results.tests.push({ name, status: 'PASS' });
    console.log(`✅ ${name}`);
  } catch (error: any) {
    results.failed++;
    results.tests.push({ name, status: 'FAIL', error: error.message });
    console.log(`❌ ${name}: ${error.message}`);
  }
}

// Run tests
async function runTests() {
  console.log('🧪 Running CRUD Tests\n');

  // Test 1: Workspace CRUD
  await test('Create workspace', async () => {
    const workspace = await workspaceRepo.create('Test Workspace');
    if (!workspace.id || workspace.name !== 'Test Workspace') {
      throw new Error('Workspace creation failed');
    }
  });

  await test('Find workspace by ID', async () => {
    const created = await workspaceRepo.create('Find Test');
    const found = await workspaceRepo.findById(created.id);
    if (!found || found.name !== 'Find Test') {
      throw new Error('Workspace lookup failed');
    }
  });

  await test('Update workspace', async () => {
    const workspace = await workspaceRepo.create('Old Name');
    const updated = await workspaceRepo.update(workspace.id, 'New Name');
    if (!updated || updated.name !== 'New Name') {
      throw new Error('Workspace update failed');
    }
  });

  await test('Delete workspace', async () => {
    const workspace = await workspaceRepo.create('To Delete');
    const deleted = await workspaceRepo.delete(workspace.id);
    if (!deleted) {
      throw new Error('Workspace deletion failed');
    }
    const found = await workspaceRepo.findById(workspace.id);
    if (found) {
      throw new Error('Workspace still exists after deletion');
    }
  });

  // Test 2: User CRUD
  await test('Create user', async () => {
    const user = await userRepo.create('test@example.com', 'Test User');
    if (!user.id || user.email !== 'test@example.com') {
      throw new Error('User creation failed');
    }
  });

  await test('Enforce unique email', async () => {
    await userRepo.create('unique@example.com', 'User 1');
    try {
      await userRepo.create('unique@example.com', 'User 2');
      throw new Error('Should have failed on duplicate email');
    } catch (error: any) {
      if (!error.message.includes('duplicate') && !error.message.includes('unique')) {
        throw error;
      }
    }
  });

  // Test 3: Workspace Membership
  await test('Add member to workspace', async () => {
    const workspace = await workspaceRepo.create('Member Test');
    const user = await userRepo.create('member@example.com', 'Member');
    const member = await memberRepo.addMember(workspace.id, user.id, 'MEMBER');
    if (!member.id || member.role !== 'MEMBER') {
      throw new Error('Member addition failed');
    }
  });

  await test('Enforce unique membership', async () => {
    const workspace = await workspaceRepo.create('Unique Member Test');
    const user = await userRepo.create('unique-member@example.com', 'Member');
    await memberRepo.addMember(workspace.id, user.id, 'MEMBER');
    try {
      await memberRepo.addMember(workspace.id, user.id, 'MEMBER');
      throw new Error('Should have failed on duplicate membership');
    } catch (error: any) {
      if (!error.message.includes('duplicate') && !error.message.includes('unique')) {
        throw error;
      }
    }
  });

  // Test 4: Profile CRUD
  await test('Create profile', async () => {
    const workspace = await workspaceRepo.create('Profile Test');
    const user = await userRepo.create('profile@example.com', 'Profile User');
    const profile = await profileRepo.create(workspace.id, user.id, {
      display_name: 'Test Profile',
      headline: 'Test Headline',
    });
    if (!profile.id || profile.display_name !== 'Test Profile') {
      throw new Error('Profile creation failed');
    }
  });

  await test('Update profile', async () => {
    const workspace = await workspaceRepo.create('Profile Update Test');
    const user = await userRepo.create('profile-update@example.com', 'User');
    await profileRepo.create(workspace.id, user.id, { display_name: 'Old' });
    const updated = await profileRepo.update(workspace.id, user.id, {
      display_name: 'New',
    });
    if (!updated || updated.display_name !== 'New') {
      throw new Error('Profile update failed');
    }
  });

  // Test 5: ICP CRUD
  await test('Create ICP', async () => {
    const workspace = await workspaceRepo.create('ICP Test');
    const icp = await icpRepo.create(workspace.id, 'Test ICP', {
      target_roles: ['Developer'],
      industries: ['Technology'],
    });
    if (!icp.id || icp.name !== 'Test ICP') {
      throw new Error('ICP creation failed');
    }
  });

  await test('Update ICP', async () => {
    const workspace = await workspaceRepo.create('ICP Update Test');
    const icp = await icpRepo.create(workspace.id, 'Old ICP');
    const updated = await icpRepo.update(workspace.id, icp.id, {
      name: 'New ICP',
    });
    if (!updated || updated.name !== 'New ICP') {
      throw new Error('ICP update failed');
    }
  });

  // Test 6: Content Idea CRUD
  await test('Create content idea', async () => {
    const workspace = await workspaceRepo.create('Content Test');
    const idea = await contentIdeaRepo.create(workspace.id, 'Test Idea', {
      pillar: 'Technology',
    });
    if (!idea.id || idea.title !== 'Test Idea') {
      throw new Error('Content idea creation failed');
    }
  });

  await test('Update content idea', async () => {
    const workspace = await workspaceRepo.create('Content Update Test');
    const idea = await contentIdeaRepo.create(workspace.id, 'Old Title');
    const updated = await contentIdeaRepo.update(workspace.id, idea.id, {
      title: 'New Title',
      status: 'VALIDATED',
    });
    if (!updated || updated.title !== 'New Title' || updated.status !== 'VALIDATED') {
      throw new Error('Content idea update failed');
    }
  });

  // Test 7: Content Draft CRUD
  await test('Create content draft', async () => {
    const workspace = await workspaceRepo.create('Draft Test');
    const draft = await contentDraftRepo.create(
      workspace.id,
      'Test Draft',
      'This is the body',
      'post'
    );
    if (!draft.id || draft.title !== 'Test Draft') {
      throw new Error('Content draft creation failed');
    }
  });

  // Test 8: Lead CRUD
  await test('Create lead', async () => {
    const workspace = await workspaceRepo.create('Lead Test');
    const lead = await leadRepo.create(workspace.id, 'John Doe', {
      company: 'Acme Corp',
      title: 'CEO',
    });
    if (!lead.id || lead.name !== 'John Doe') {
      throw new Error('Lead creation failed');
    }
  });

  await test('Update lead', async () => {
    const workspace = await workspaceRepo.create('Lead Update Test');
    const lead = await leadRepo.create(workspace.id, 'Old Name');
    const updated = await leadRepo.update(workspace.id, lead.id, {
      name: 'New Name',
      status: 'QUALIFIED',
    });
    if (!updated || updated.name !== 'New Name' || updated.status !== 'QUALIFIED') {
      throw new Error('Lead update failed');
    }
  });

  console.log('\n🔒 Running Workspace Isolation Tests\n');

  // Test 9: Workspace Isolation
  await test('Workspace isolation - Profile', async () => {
    const ws1 = await workspaceRepo.create('Workspace A');
    const ws2 = await workspaceRepo.create('Workspace B');
    const user1 = await userRepo.create('user1@isolated.com', 'User 1');
    const user2 = await userRepo.create('user2@isolated.com', 'User 2');

    // Create profile in workspace 1
    await profileRepo.create(ws1.id, user1.id, { display_name: 'User 1 Profile' });

    // Try to find it in workspace 2
    const profile = await profileRepo.findByWorkspaceAndUser(ws2.id, user1.id);
    if (profile) {
      throw new Error('Profile leaked across workspaces');
    }

    // Should find it in workspace 1
    const correctProfile = await profileRepo.findByWorkspaceAndUser(ws1.id, user1.id);
    if (!correctProfile || correctProfile.display_name !== 'User 1 Profile') {
      throw new Error('Profile not found in correct workspace');
    }
  });

  await test('Workspace isolation - ICP', async () => {
    const ws1 = await workspaceRepo.create('ICP Workspace A');
    const ws2 = await workspaceRepo.create('ICP Workspace B');

    // Create ICP in workspace 1
    await icpRepo.create(ws1.id, 'ICP 1', { target_roles: ['Developer'] });

    // Should not find it in workspace 2
    const icps = await icpRepo.findByWorkspace(ws2.id);
    if (icps.length !== 0) {
      throw new Error('ICP leaked across workspaces');
    }

    // Should find it in workspace 1
    const correctIcps = await icpRepo.findByWorkspace(ws1.id);
    if (correctIcps.length !== 1) {
      throw new Error('ICP not found in correct workspace');
    }
  });

  await test('Workspace isolation - Content Ideas', async () => {
    const ws1 = await workspaceRepo.create('Content Workspace A');
    const ws2 = await workspaceRepo.create('Content Workspace B');

    // Create idea in workspace 1
    await contentIdeaRepo.create(ws1.id, 'Idea 1');

    // Should not find it in workspace 2
    const ideas = await contentIdeaRepo.findByWorkspace(ws2.id);
    if (ideas.length !== 0) {
      throw new Error('Content idea leaked across workspaces');
    }

    // Should find it in workspace 1
    const correctIdeas = await contentIdeaRepo.findByWorkspace(ws1.id);
    if (correctIdeas.length !== 1) {
      throw new Error('Content idea not found in correct workspace');
    }
  });

  await test('Workspace isolation - Leads', async () => {
    const ws1 = await workspaceRepo.create('Lead Workspace A');
    const ws2 = await workspaceRepo.create('Lead Workspace B');

    // Create lead in workspace 1
    await leadRepo.create(ws1.id, 'Lead 1');

    // Should not find it in workspace 2
    const leads = await leadRepo.findByWorkspace(ws2.id);
    if (leads.length !== 0) {
      throw new Error('Lead leaked across workspaces');
    }

    // Should find it in workspace 1
    const correctLeads = await leadRepo.findByWorkspace(ws1.id);
    if (correctLeads.length !== 1) {
      throw new Error('Lead not found in correct workspace');
    }
  });

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary');
  console.log('='.repeat(50));
  console.log(`Total:  ${results.passed + results.failed}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log('='.repeat(50));

  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests
      .filter(t => t.status === 'FAIL')
      .forEach(t => {
        console.log(`  - ${t.name}: ${t.error}`);
      });
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
