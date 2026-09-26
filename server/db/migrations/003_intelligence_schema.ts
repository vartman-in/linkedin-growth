import type { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(migrations: MigrationBuilder): Promise<void> {
  // Intelligence Sources table
  await migrations.createTable('intelligence_sources', {
    id: { type: 'uuid', primaryKey: true, default: migrations.func('gen_random_uuid') },
    workspace_id: { type: 'uuid', notNull: true, references: '"workspaces"', onDelete: 'CASCADE' },
    url: { type: 'text', notNull: true },
    source_type: { type: 'varchar(50)', notNull: true }, // web, rss, atom, sitemap
    title: { type: 'text' },
    publisher: { type: 'varchar(255)' },
    domain: { type: 'varchar(255)' },
    discovered_at: { type: 'timestamp', default: migrations.func('now()'), notNull: true },
    fetched_at: { type: 'timestamp' },
    published_at: { type: 'timestamp' },
    content_hash: { type: 'varchar(64)' },
    status: { type: 'varchar(50)', notNull: true, default: "'DISCOVERED'" }, // DISCOVERED, FETCHED, PROCESSED, FAILED
    reliability_score: { type: 'decimal(3,2)' }, // 0.00 to 1.00
    error_message: { type: 'text' },
    metadata: { type: 'jsonb', default: "'{}'" },
    created_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
    updated_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
  });

  await migrations.addConstraint('intelligence_sources', 'unique_source_url_workspace', {
    unique: ['workspace_id', 'url'],
  });

  // Source Documents table (normalized content)
  await migrations.createTable('source_documents', {
    id: { type: 'uuid', primaryKey: true, default: migrations.pgFunc('gen_random_uuid') },
    source_id: { type: 'uuid', notNull: true, references: '"intelligence_sources"', onDelete: 'CASCADE' },
    workspace_id: { type: 'uuid', notNull: true, references: '"workspaces"', onDelete: 'CASCADE' },
    title: { type: 'text' },
    author: { type: 'varchar(255)' },
    publisher: { type: 'varchar(255)' },
    publication_date: { type: 'timestamp' },
    canonical_url: { type: 'text' },
    language: { type: 'varchar(10)' },
    cleaned_body: { type: 'text' },
    headings: { type: 'text[]', default: "'{}'" },
    paragraphs: { type: 'text[]', default: "'{}'" },
    content_hash: { type: 'varchar(64)' },
    extraction_confidence: { type: 'decimal(3,2)' },
    provenance: { type: 'varchar(50)' }, // VERIFIED, EXTRACTED, INFERRED
    metadata: { type: 'jsonb', default: "'{}'" },
    created_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
    updated_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
  });

  // Source Claims table
  await migrations.createTable('source_claims', {
    id: { type: 'uuid', primaryKey: true, default: migrations.pgFunc('gen_random_uuid') },
    source_id: { type: 'uuid', notNull: true, references: '"intelligence_sources"', onDelete: 'CASCADE' },
    document_id: { type: 'uuid', references: '"source_documents"', onDelete: 'SET NULL' },
    workspace_id: { type: 'uuid', notNull: true, references: '"workspaces"', onDelete: 'CASCADE' },
    claim_text: { type: 'text', notNull: true },
    evidence_location: { type: 'text' }, // paragraph index or quote
    claim_type: { type: 'varchar(50)' }, // fact, opinion, statistic, prediction
    confidence: { type: 'decimal(3,2)' }, // 0.00 to 1.00
    status: { type: 'varchar(50)', notNull: true, default: "'UNCERTAIN'" }, // SUPPORTED, PARTIALLY_SUPPORTED, CONTRADICTED, UNCERTAIN, UNAVAILABLE
    contradiction_group_id: { type: 'uuid' }, // links contradictory claims
    extracted_by: { type: 'varchar(50)' }, // ai, human, hybrid
    metadata: { type: 'jsonb', default: "'{}'" },
    created_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
    updated_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
  });

  // Topics table
  await migrations.createTable('topics', {
    id: { type: 'uuid', primaryKey: true, default: migrations.pgFunc('gen_random_uuid') },
    workspace_id: { type: 'uuid', notNull: true, references: '"workspaces"', onDelete: 'CASCADE' },
    canonical_name: { type: 'text', notNull: true },
    aliases: { type: 'text[]', default: "'{}'" },
    category: { type: 'varchar(100)' },
    description: { type: 'text' },
    metadata: { type: 'jsonb', default: "'{}'" },
    created_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
    updated_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
  });

  await migrations.addConstraint('topics', 'unique_topic_workspace', {
    unique: ['workspace_id', 'canonical_name'],
  });

  // Topic Mentions table
  await migrations.createTable('topic_mentions', {
    id: { type: 'uuid', primaryKey: true, default: migrations.pgFunc('gen_random_uuid') },
    topic_id: { type: 'uuid', notNull: true, references: '"topics"', onDelete: 'CASCADE' },
    source_id: { type: 'uuid', notNull: true, references: '"intelligence_sources"', onDelete: 'CASCADE' },
    workspace_id: { type: 'uuid', notNull: true, references: '"workspaces"', onDelete: 'CASCADE' },
    relevance_score: { type: 'decimal(3,2)' }, // 0.00 to 1.00
    context: { type: 'text' }, // surrounding text
    mentioned_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
    metadata: { type: 'jsonb', default: "'{}'" },
    created_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
  });

  // Trend Signals table
  await migrations.createTable('trend_signals', {
    id: { type: 'uuid', primaryKey: true, default: migrations.pgFunc('gen_random_uuid') },
    topic_id: { type: 'uuid', notNull: true, references: '"topics"', onDelete: 'CASCADE' },
    workspace_id: { type: 'uuid', notNull: true, references: '"workspaces"', onDelete: 'CASCADE' },
    signal_type: { type: 'varchar(50)', notNull: true }, // mention_frequency, source_diversity, new_source, cross_domain
    observed_at: { type: 'timestamp', notNull: true },
    time_window_hours: { type: 'integer' },
    volume: { type: 'integer' },
    velocity: { type: 'decimal(10,2)' }, // mentions per hour
    source_diversity: { type: 'integer' }, // number of unique sources
    confidence: { type: 'decimal(3,2)' }, // 0.00 to 1.00
    status: { type: 'varchar(50)', notNull: true, default: "'NEW'" }, // NEW, RISING, SUSTAINED, STABLE, DECLINING, INSUFFICIENT_DATA
    provenance: { type: 'varchar(50)' }, // OBSERVED, CALCULATED, INFERRED
    metadata: { type: 'jsonb', default: "'{}'" },
    created_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
    updated_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
  });

  // Content Opportunities table
  await migrations.createTable('content_opportunities', {
    id: { type: 'uuid', primaryKey: true, default: migrations.pgFunc('gen_random_uuid') },
    workspace_id: { type: 'uuid', notNull: true, references: '"workspaces"', onDelete: 'CASCADE' },
    topic_id: { type: 'uuid', references: '"topics"', onDelete: 'SET NULL' },
    topic_name: { type: 'text', notNull: true },
    thesis: { type: 'text' },
    why_now: { type: 'text' },
    audience_relevance: { type: 'text' },
    user_relevance: { type: 'text' },
    evidence_strength: { type: 'varchar(50)' }, // HIGH, MEDIUM, LOW
    novelty_score: { type: 'decimal(3,2)' }, // 0.00 to 1.00
    conversation_potential: { type: 'decimal(3,2)' }, // 0.00 to 1.00
    source_ids: { type: 'uuid[]', default: "'{}'" },
    supporting_claim_ids: { type: 'uuid[]', default: "'{}'" },
    contradiction_ids: { type: 'uuid[]', default: "'{}'" },
    recommended_angle: { type: 'text' },
    recommended_objective: { type: 'varchar(50)' },
    recommended_format: { type: 'varchar(50)' },
    confidence: { type: 'decimal(3,2)' }, // 0.00 to 1.00
    status: { type: 'varchar(50)', notNull: true, default: "'DISCOVERED'" }, // DISCOVERED, REVIEWED, SAVED, DISMISSED, CONVERTED
    overall_score: { type: 'decimal(5,2)' }, // 0.00 to 100.00
    scoring_breakdown: { type: 'jsonb', default: "'{}'" }, // detailed scoring explanation
    metadata: { type: 'jsonb', default: "'{}'" },
    created_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
    updated_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
  });

  // Content Gaps table
  await migrations.createTable('content_gaps', {
    id: { type: 'uuid', primaryKey: true, default: migrations.pgFunc('gen_random_uuid') },
    workspace_id: { type: 'uuid', notNull: true, references: '"workspaces"', onDelete: 'CASCADE' },
    topic_id: { type: 'uuid', references: '"topics"', onDelete: 'SET NULL' },
    topic_name: { type: 'text', notNull: true },
    gap_type: { type: 'varchar(50)' }, // unanswered_question, missing_explanation, contradictory_narrative, overused_perspective, underrepresented_perspective, evidence_gap, implementation_gap
    observed_narrative: { type: 'text' },
    unanswered_question: { type: 'text' },
    missing_perspective: { type: 'text' },
    evidence: { type: 'jsonb', default: "'{}'" },
    opportunity_description: { type: 'text' },
    confidence: { type: 'decimal(3,2)' }, // 0.00 to 1.00
    source_ids: { type: 'uuid[]', default: "'{}'" },
    metadata: { type: 'jsonb', default: "'{}'" },
    created_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
    updated_at: { type: 'timestamp', default: migrations.pgFunc('now()'), notNull: true },
  });

  // Create indexes for performance
  await migrations.createIndex('intelligence_sources', ['workspace_id']);
  await migrations.createIndex('intelligence_sources', ['status']);
  await migrations.createIndex('intelligence_sources', ['discovered_at']);
  
  await migrations.createIndex('source_documents', ['source_id']);
  await migrations.createIndex('source_documents', ['workspace_id']);
  
  await migrations.createIndex('source_claims', ['source_id']);
  await migrations.createIndex('source_claims', ['workspace_id']);
  await migrations.createIndex('source_claims', ['status']);
  await migrations.createIndex('source_claims', ['contradiction_group_id']);
  
  await migrations.createIndex('topics', ['workspace_id']);
  await migrations.createIndex('topics', ['category']);
  
  await migrations.createIndex('topic_mentions', ['topic_id']);
  await migrations.createIndex('topic_mentions', ['source_id']);
  await migrations.createIndex('topic_mentions', ['workspace_id']);
  await migrations.createIndex('topic_mentions', ['mentioned_at']);
  
  await migrations.createIndex('trend_signals', ['topic_id']);
  await migrations.createIndex('trend_signals', ['workspace_id']);
  await migrations.createIndex('trend_signals', ['observed_at']);
  await migrations.createIndex('trend_signals', ['status']);
  
  await migrations.createIndex('content_opportunities', ['workspace_id']);
  await migrations.createIndex('content_opportunities', ['topic_id']);
  await migrations.createIndex('content_opportunities', ['status']);
  await migrations.createIndex('content_opportunities', ['overall_score']);
  await migrations.createIndex('content_opportunities', ['created_at']);
  
  await migrations.createIndex('content_gaps', ['workspace_id']);
  await migrations.createIndex('content_gaps', ['topic_id']);
  await migrations.createIndex('content_gaps', ['gap_type']);
}

export async function down(migrations: MigrationBuilder): Promise<void> {
  await migrations.dropTable('content_gaps');
  await migrations.dropTable('content_opportunities');
  await migrations.dropTable('trend_signals');
  await migrations.dropTable('topic_mentions');
  await migrations.dropTable('topics');
  await migrations.dropTable('source_claims');
  await migrations.dropTable('source_documents');
  await migrations.dropTable('intelligence_sources');
}
