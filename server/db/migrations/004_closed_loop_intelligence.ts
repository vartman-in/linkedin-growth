import type { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(migrations: MigrationBuilder): Promise<void> {
  // Intelligence Feedback table - tracks all user interactions with intelligence
  await migrations.createTable('intelligence_feedback', {
    id: { type: 'uuid', primaryKey: true, default: migrations.pgFunc('gen_random_uuid') },
    workspace_id: { type: 'uuid', notNull: true, references: '"workspaces"', onDelete: 'CASCADE' },
    user_id: { type: 'uuid', references: '"users"', onDelete: 'SET NULL' },
    entity_type: { type: 'varchar(50)', notNull: true }, // opportunity, idea, draft, content, topic
    entity_id: { type: 'uuid', notNull: true },
    feedback_type: { type: 'varchar(50)', notNull: true }, // accepted, dismissed, edited, converted, published, rejected
    feedback_data: { type: 'jsonb', default: "'{}'" }, // additional context about the feedback
    provenance: { type: 'varchar(50)', notNull: true, default: "'USER_ACTION'" }, // USER_ACTION, SYSTEM_DETECTED, IMPORTED
    created_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
  });

  await migrations.createIndex('intelligence_feedback', ['workspace_id']);
  await migrations.createIndex('intelligence_feedback', ['entity_type', 'entity_id']);
  await migrations.createIndex('intelligence_feedback', ['feedback_type']);
  await migrations.createIndex('intelligence_feedback', ['created_at']);

  // Content Performance table - tracks published content performance
  await migrations.createTable('content_performance', {
    id: { type: 'uuid', primaryKey: true, default: migrations.pgFunc('gen_random_uuid') },
    workspace_id: { type: 'uuid', notNull: true, references: '"workspaces"', onDelete: 'CASCADE' },
    content_id: { type: 'uuid', notNull: true, references: '"content_drafts"', onDelete: 'CASCADE' },
    platform: { type: 'varchar(50)', notNull: true }, // linkedin, twitter, internal
    published_at: { type: 'timestamp', notNull: true },
    metrics: { type: 'jsonb', notNull: true, default: "'{}'" }, // impressions, views, likes, comments, shares, etc.
    provenance: { type: 'varchar(50)', notNull: true }, // VERIFIED_PLATFORM, USER_ENTERED, IMPORTED, SYSTEM_CALCULATED
    source_reference: { type: 'text' }, // URL or reference to where metrics came from
    last_updated_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
    created_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
  });

  await migrations.createIndex('content_performance', ['workspace_id']);
  await migrations.createIndex('content_performance', ['content_id']);
  await migrations.createIndex('content_performance', ['platform']);
  await migrations.createIndex('content_performance', ['published_at']);

  // Learning Patterns table - stores detected patterns from signals
  await migrations.createTable('learning_patterns', {
    id: { type: 'uuid', primaryKey: true, default: migrations.pgFunc('gen_random_uuid') },
    workspace_id: { type: 'uuid', notNull: true, references: '"workspaces"', onDelete: 'CASCADE' },
    pattern_type: { type: 'varchar(50)', notNull: true }, // topic_preference, format_preference, time_preference, audience_response, etc.
    pattern_data: { type: 'jsonb', notNull: true }, // the actual pattern details
    confidence: { type: 'decimal(3,2)', notNull: true }, // 0.00 to 1.00
    observation_count: { type: 'integer', notNull: true, default: 0 },
    evidence_ids: { type: 'uuid[]', default: "'{}'" }, // IDs of signals that support this pattern
    time_range_start: { type: 'timestamp' },
    time_range_end: { type: 'timestamp' },
    generated_by: { type: 'varchar(50)', notNull: true }, // AI, DETERMINISTIC, HYBRID
    expires_at: { type: 'timestamp' }, // when this pattern should be reconsidered
    is_active: { type: 'boolean', notNull: true, default: true },
    created_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
    updated_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
  });

  await migrations.createIndex('learning_patterns', ['workspace_id']);
  await migrations.createIndex('learning_patterns', ['pattern_type']);
  await migrations.createIndex('learning_patterns', ['is_active']);
  await migrations.createIndex('learning_patterns', ['confidence']);

  // Learning Insights table - human-readable insights generated from patterns
  await migrations.createTable('learning_insights', {
    id: { type: 'uuid', primaryKey: true, default: migrations.pgFunc('gen_random_uuid') },
    workspace_id: { type: 'uuid', notNull: true, references: '"workspaces"', onDelete: 'CASCADE' },
    pattern_id: { type: 'uuid', references: '"learning_patterns"', onDelete: 'SET NULL' },
    insight_type: { type: 'varchar(50)', notNull: true }, // recommendation, observation, warning, opportunity
    title: { type: 'text', notNull: true },
    description: { type: 'text', notNull: true },
    evidence_summary: { type: 'text' }, // human-readable summary of evidence
    confidence: { type: 'decimal(3,2)', notNull: true },
    observation_count: { type: 'integer', notNull: true },
    time_range_start: { type: 'timestamp' },
    time_range_end: { type: 'timestamp' },
    generated_by: { type: 'varchar(50)', notNull: true }, // AI, DETERMINISTIC, HYBRID
    is_actionable: { type: 'boolean', notNull: true, default: false },
    action_suggestion: { type: 'text' }, // what the user should do
    expires_at: { type: 'timestamp' },
    is_active: { type: 'boolean', notNull: true, default: true },
    created_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
    updated_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
  });

  await migrations.createIndex('learning_insights', ['workspace_id']);
  await migrations.createIndex('learning_insights', ['insight_type']);
  await migrations.createIndex('learning_insights', ['is_active']);
  await migrations.createIndex('learning_insights', ['confidence']);

  // Background Jobs table - tracks scheduled intelligence jobs
  await migrations.createTable('background_jobs', {
    id: { type: 'uuid', primaryKey: true, default: migrations.pgFunc('gen_random_uuid') },
    workspace_id: { type: 'uuid', notNull: true, references: '"workspaces"', onDelete: 'CASCADE' },
    job_type: { type: 'varchar(50)', notNull: true }, // source_refresh, trend_recalc, opportunity_recalc, learning_recalc, analytics_aggregate
    status: { type: 'varchar(50)', notNull: true, default: "'PENDING'" }, // PENDING, RUNNING, COMPLETED, FAILED
    scheduled_at: { type: 'timestamp', notNull: true },
    started_at: { type: 'timestamp' },
    completed_at: { type: 'timestamp' },
    error_message: { type: 'text' },
    result_data: { type: 'jsonb' },
    created_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
    updated_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
  });

  await migrations.createIndex('background_jobs', ['workspace_id']);
  await migrations.createIndex('background_jobs', ['job_type']);
  await migrations.createIndex('background_jobs', ['status']);
  await migrations.createIndex('background_jobs', ['scheduled_at']);

  // Enhanced learning_signals table with additional fields
  // Note: We're adding columns to the existing table
  await migrations.addColumns('learning_signals', {
    user_id: { type: 'uuid', references: '"users"', onDelete: 'SET NULL' },
    entity_type: { type: 'varchar(50)' },
    entity_id: { type: 'uuid' },
    provenance: { type: 'varchar(50)', default: "'SYSTEM_DETECTED'" },
  });

  await migrations.createIndex('learning_signals', ['user_id']);
  await migrations.createIndex('learning_signals', ['entity_type', 'entity_id']);
  await migrations.createIndex('learning_signals', ['signal_type']);
}

export async function down(migrations: MigrationBuilder): Promise<void> {
  await migrations.dropTable('background_jobs');
  await migrations.dropTable('learning_insights');
  await migrations.dropTable('learning_patterns');
  await migrations.dropTable('content_performance');
  await migrations.dropTable('intelligence_feedback');
  
  // Remove added columns from learning_signals
  await migrations.dropColumns('learning_signals', 'user_id', 'entity_type', 'entity_id', 'provenance');
}
