import { newDb } from 'pg-mem';
import { Pool } from 'pg';
import { setPool } from '../server/config/database';

// Create in-memory PostgreSQL database
const db = newDb({
  autoCreateForeignKeyIndices: true,
});

// Install pgcrypto extension (required by migrations)
db.public.none(`
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";
`);

// Get a pg-compatible pool interface
const adapter = db.adapters.createPg();

// Create a Pool-like object that uses the in-memory database
export const testPool = {
  query: async (text: string, params?: any[]) => {
    const client = await adapter.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  },
  connect: async () => {
    return adapter.connect();
  },
  end: async () => {
    // No-op for in-memory database
  },
} as unknown as Pool;

// Inject the test pool into the server's database configuration
setPool(testPool);

// Function to run migrations against the in-memory database
export async function runMigrations() {
  // Create tables manually using SQL (pg-mem compatible)
  db.public.none(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  db.public.none(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  db.public.none(`
    CREATE TABLE IF NOT EXISTS workspace_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      UNIQUE(workspace_id, user_id)
    )
  `);

  db.public.none(`
    CREATE TABLE IF NOT EXISTS profiles (
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
    CREATE TABLE IF NOT EXISTS icps (
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
    CREATE TABLE IF NOT EXISTS content_ideas (
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
    CREATE TABLE IF NOT EXISTS content_drafts (
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
    CREATE TABLE IF NOT EXISTS leads (
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

  db.public.none(`
    CREATE TABLE IF NOT EXISTS conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
      channel VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  db.public.none(`
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      direction VARCHAR(50) NOT NULL,
      body TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  db.public.none(`
    CREATE TABLE IF NOT EXISTS pipeline_opportunities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
      stage VARCHAR(50) NOT NULL DEFAULT 'DISCOVERED',
      value DECIMAL(10,2),
      source VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  db.public.none(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      event_type VARCHAR(100) NOT NULL,
      provenance VARCHAR(50) NOT NULL,
      metrics JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  db.public.none(`
    CREATE TABLE IF NOT EXISTS learning_signals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      signal_type VARCHAR(100) NOT NULL,
      source VARCHAR(255) NOT NULL,
      evidence JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  db.public.none(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(100) NOT NULL,
      entity_id UUID,
      details JSONB,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
}

// Clean up function
export async function cleanup() {
  // Drop all tables
  const tables = [
    'audit_log',
    'learning_signals',
    'analytics_events',
    'pipeline_opportunities',
    'messages',
    'conversations',
    'leads',
    'content_drafts',
    'content_ideas',
    'icps',
    'profiles',
    'workspace_members',
    'users',
    'workspaces',
  ];
  
  for (const table of tables) {
    try {
      db.public.none(`DROP TABLE IF EXISTS ${table} CASCADE`);
    } catch (e) {
      // Ignore errors
    }
  }
}
