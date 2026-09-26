import type { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(migrations: MigrationBuilder): Promise<void> {
  // Enable UUID generation
  await migrations.createExtension('pgcrypto');

  // Workspaces table
  await migrations.createTable('workspaces', {
    id: { type: 'uuid', primaryKey: true, default: migrations.func('gen_random_uuid') },
    name: { type: 'varchar(255)', notNull: true },
    created_at: { type: 'timestamp', default: migrations.func('now()'), notNull: true },
    updated_at: { type: 'timestamp', default: migrations.func('now()'), notNull: true },
  });

  // Users table
  await migrations.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: migrations.func('gen_random_uuid') },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    name: { type: 'varchar(255)', notNull: true },
    created_at: { type: 'timestamp', default: migrations.func('now()'), notNull: true },
    updated_at: { type: 'timestamp', default: migrations.func('now()'), notNull: true },
  });

  // Workspace members table
  await migrations.createTable('workspace_members', {
    id: { type: 'uuid', primaryKey: true, default: migrations.func('gen_random_uuid') },
    workspace_id: { type: 'uuid', notNull: true, references: '"workspaces"', onDelete: 'CASCADE' },
    user_id: { type: 'uuid', notNull: true, references: '"users"', onDelete: 'CASCADE' },
    role: { type: 'varchar(50)', notNull: true, default: "'MEMBER'" },
    created_at: { type: 'timestamp', default: migrations.func('now()'), notNull: true },
  });

  // Add unique constraint for workspace membership
  await migrations.addConstraint('workspace_members', 'unique_workspace_user', {
    unique: ['workspace_id', 'user_id'],
  });

  // Profiles table (workspace-scoped)
  await migrations.createTable('profiles', {
    id: { type: 'uuid', primaryKey: true, default: migrations.func('gen_random_uuid') },
    workspace_id: { type: 'uuid', notNull: true, references: '"workspaces"', onDelete: 'CASCADE' },
    user_id: { type: 'uuid', notNull: true, references: '"users"', onDelete: 'CASCADE' },
    display_name: { type: 'varchar(255)' },
    headline: { type: 'text' },
    role: { type: 'varchar(255)' },
    company: { type: 'varchar(255)' },
    bio: { type: 'text' },
    voice_tone: { type: 'text' },
    banned_words: { type: 'text[]', default: "'{}'" },
    proof_points: { type: 'text[]', default: "'{}'" },
    created_at: { type: 'timestamp', default: migrations.func('now()'), notNull: true },
    updated_at: { type: 'timestamp', default: migrations.func('now()'), notNull: true },
  });

  // Add unique constraint for profile per workspace/user
  await migrations.addConstraint('profiles', 'unique_profile_workspace_user', {
    unique: ['workspace_id', 'user_id'],
  });

  // ICP table (workspace-scoped)
  await migrations.createTable('icps', {
    id: { type: 'uuid', primaryKey: true, default: migrations.pgFunc('gen_random_uuid') },
    workspace_id: { type: 'uuid', notNull: true, references: '"workspaces"', onDelete: 'CASCADE' },
    name: { type: 'varchar(255)', notNull: true },
    target_roles: { type: 'text[]', default: "'{}'" },
    industries: { type: 'text[]', default: "'{}'" },
    company_sizes: { type: 'text[]', default: "'{}'" },
    geography: { type: 'text[]', default: "'{}'" },
    seniority: { type: 'text[]', default: "'{}'" },
    problems: { type: 'text[]', default: "'{}'" },
    buying_signals: { type: 'text[]', default: "'{}'" },
    exclusions: { type: 'text[]', default: "'{}'" },
    created_at: { type: 'timestamp', default: migrations.func('now()'), notNull: true },
    updated_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
  });

  // Content ideas table (workspace-scoped)
  await migrations.createTable('content_ideas', {
    id: { type: 'uuid', primaryKey: true, default: migrations.pgFunc('gen_random_uuid') },
    workspace_id: { type: 'uuid', notNull: true, references: '"workspaces"', onDelete: 'CASCADE' },
    title: { type: 'text', notNull: true },
    source_reference: { type: 'text' },
    pillar: { type: 'varchar(255)' },
    audience: { type: 'text' },
    angle: { type: 'text' },
    status: { type: 'varchar(50)', notNull: true, default: "'NEW'" },
    created_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
    updated_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
  });

  // Content drafts table (workspace-scoped)
  await migrations.createTable('content_drafts', {
    id: { type: 'uuid', primaryKey: true, default: migrations.pgFunc('gen_random_uuid') },
    workspace_id: { type: 'uuid', notNull: true, references: '"workspaces"', onDelete: 'CASCADE' },
    idea_id: { type: 'uuid', references: '"content_ideas"', onDelete: 'SET NULL' },
    title: { type: 'text', notNull: true },
    body: { type: 'text', notNull: true },
    content_type: { type: 'varchar(50)', notNull: true },
    status: { type: 'varchar(50)', notNull: true, default: "'DRAFT'" },
    version: { type: 'integer', notNull: true, default: 1 },
    created_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
    updated_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
  });

  // Leads/Prospects table (workspace-scoped)
  await migrations.createTable('leads', {
    id: { type: 'uuid', primaryKey: true, default: migrations.pgFunc('gen_random_uuid') },
    workspace_id: { type: 'uuid', notNull: true, references: '"workspaces"', onDelete: 'CASCADE' },
    name: { type: 'varchar(255)', notNull: true },
    profile_url: { type: 'text' },
    company: { type: 'varchar(255)' },
    title: { type: 'varchar(255)' },
    status: { type: 'varchar(50)', notNull: true, default: "'NEW'" },
    source: { type: 'varchar(255)' },
    created_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
    updated_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
  });

  // Conversations table (workspace-scoped)
  await migrations.createTable('conversations', {
    id: { type: 'uuid', primaryKey: true, default: migrations.pgFunc('gen_random_uuid') },
    workspace_id: { type: 'uuid', notNull: true, references: '"workspaces"', onDelete: 'CASCADE' },
    lead_id: { type: 'uuid', references: '"leads"', onDelete: 'SET NULL' },
    channel: { type: 'varchar(50)', notNull: true },
    status: { type: 'varchar(50)', notNull: true, default: "'ACTIVE'" },
    created_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
    updated_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
  });

  // Messages table
  await migrations.createTable('messages', {
    id: { type: 'uuid', primaryKey: true, default: migrations.pgFunc('gen_random_uuid') },
    conversation_id: { type: 'uuid', notNull: true, references: '"conversations"', onDelete: 'CASCADE' },
    direction: { type: 'varchar(50)', notNull: true },
    body: { type: 'text', notNull: true },
    created_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
  });

  // Pipeline opportunities table (workspace-scoped)
  await migrations.createTable('pipeline_opportunities', {
    id: { type: 'uuid', primaryKey: true, default: migrations.pgFunc('gen_random_uuid') },
    workspace_id: { type: 'uuid', notNull: true, references: '"workspaces"', onDelete: 'CASCADE' },
    lead_id: { type: 'uuid', references: '"leads"', onDelete: 'SET NULL' },
    stage: { type: 'varchar(50)', notNull: true, default: "'DISCOVERED'" },
    value: { type: 'decimal(10,2)' },
    source: { type: 'varchar(255)' },
    created_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
    updated_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
  });

  // Analytics events table (workspace-scoped)
  await migrations.createTable('analytics_events', {
    id: { type: 'uuid', primaryKey: true, default: migrations.pgFunc('gen_random_uuid') },
    workspace_id: { type: 'uuid', notNull: true, references: '"workspaces"', onDelete: 'CASCADE' },
    event_type: { type: 'varchar(100)', notNull: true },
    provenance: { type: 'varchar(50)', notNull: true },
    metrics: { type: 'jsonb', notNull: true },
    created_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
  });

  // Learning signals table (workspace-scoped)
  await migrations.createTable('learning_signals', {
    id: { type: 'uuid', primaryKey: true, default: migrations.pgFunc('gen_random_uuid') },
    workspace_id: { type: 'uuid', notNull: true, references: '"workspaces"', onDelete: 'CASCADE' },
    signal_type: { type: 'varchar(100)', notNull: true },
    source: { type: 'varchar(255)', notNull: true },
    evidence: { type: 'jsonb', notNull: true },
    created_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
  });

  // Audit log table
  await migrations.createTable('audit_log', {
    id: { type: 'uuid', primaryKey: true, default: migrations.pgFunc('gen_random_uuid') },
    workspace_id: { type: 'uuid', references: '"workspaces"', onDelete: 'CASCADE' },
    user_id: { type: 'uuid', references: '"users"', onDelete: 'SET NULL' },
    action: { type: 'varchar(100)', notNull: true },
    entity_type: { type: 'varchar(100)', notNull: true },
    entity_id: { type: 'uuid' },
    details: { type: 'jsonb' },
    created_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
  });

  // Create indexes for common queries
  await migrations.createIndex('workspace_members', ['workspace_id']);
  await migrations.createIndex('workspace_members', ['user_id']);
  await migrations.createIndex('profiles', ['workspace_id']);
  await migrations.createIndex('icps', ['workspace_id']);
  await migrations.createIndex('content_ideas', ['workspace_id']);
  await migrations.createIndex('content_ideas', ['status']);
  await migrations.createIndex('content_drafts', ['workspace_id']);
  await migrations.createIndex('content_drafts', ['idea_id']);
  await migrations.createIndex('content_drafts', ['status']);
  await migrations.createIndex('leads', ['workspace_id']);
  await migrations.createIndex('leads', ['status']);
  await migrations.createIndex('conversations', ['workspace_id']);
  await migrations.createIndex('conversations', ['lead_id']);
  await migrations.createIndex('messages', ['conversation_id']);
  await migrations.createIndex('pipeline_opportunities', ['workspace_id']);
  await migrations.createIndex('pipeline_opportunities', ['lead_id']);
  await migrations.createIndex('pipeline_opportunities', ['stage']);
  await migrations.createIndex('analytics_events', ['workspace_id']);
  await migrations.createIndex('analytics_events', ['event_type']);
  await migrations.createIndex('learning_signals', ['workspace_id']);
  await migrations.createIndex('audit_log', ['workspace_id']);
  await migrations.createIndex('audit_log', ['user_id']);
  await migrations.createIndex('audit_log', ['entity_type', 'entity_id']);
}

export async function down(migrations: MigrationBuilder): Promise<void> {
  await migrations.dropTable('audit_log');
  await migrations.dropTable('learning_signals');
  await migrations.dropTable('analytics_events');
  await migrations.dropTable('pipeline_opportunities');
  await migrations.dropTable('messages');
  await migrations.dropTable('conversations');
  await migrations.dropTable('leads');
  await migrations.dropTable('content_drafts');
  await migrations.dropTable('content_ideas');
  await migrations.dropTable('icps');
  await migrations.dropTable('profiles');
  await migrations.dropTable('workspace_members');
  await migrations.dropTable('users');
  await migrations.dropTable('workspaces');
  await migrations.dropExtension('pgcrypto');
}
