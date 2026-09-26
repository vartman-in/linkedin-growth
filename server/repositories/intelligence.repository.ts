import { Pool } from 'pg';
import { IntelligenceSource, SourceDocument, SourceClaim, Topic, TopicMention, TrendSignal, ContentOpportunity, ContentGap } from '../models/types';

export class IntelligenceRepository {
  constructor(private pool: Pool) {}

  // ============ INTELLIGENCE SOURCES ============

  async createSource(workspaceId: string, url: string, sourceType: string): Promise<IntelligenceSource> {
    const result = await this.pool.query(
      `INSERT INTO intelligence_sources (workspace_id, url, source_type, status)
       VALUES ($1, $2, $3, 'DISCOVERED')
       ON CONFLICT (workspace_id, url) DO UPDATE SET updated_at = NOW()
       RETURNING *`,
      [workspaceId, url, sourceType]
    );
    return result.rows[0];
  }

  async getSource(workspaceId: string, sourceId: string): Promise<IntelligenceSource | null> {
    const result = await this.pool.query(
      'SELECT * FROM intelligence_sources WHERE workspace_id = $1 AND id = $2',
      [workspaceId, sourceId]
    );
    return result.rows[0] || null;
  }

  async getSourcesByWorkspace(workspaceId: string, limit: number = 50, offset: number = 0): Promise<IntelligenceSource[]> {
    const result = await this.pool.query(
      'SELECT * FROM intelligence_sources WHERE workspace_id = $1 ORDER BY discovered_at DESC LIMIT $2 OFFSET $3',
      [workspaceId, limit, offset]
    );
    return result.rows;
  }

  async updateSource(workspaceId: string, sourceId: string, data: Partial<IntelligenceSource>): Promise<IntelligenceSource | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(data.title);
    }
    if (data.publisher !== undefined) {
      updates.push(`publisher = $${paramCount++}`);
      values.push(data.publisher);
    }
    if (data.domain !== undefined) {
      updates.push(`domain = $${paramCount++}`);
      values.push(data.domain);
    }
    if (data.fetched_at !== undefined) {
      updates.push(`fetched_at = $${paramCount++}`);
      values.push(data.fetched_at);
    }
    if (data.published_at !== undefined) {
      updates.push(`published_at = $${paramCount++}`);
      values.push(data.published_at);
    }
    if (data.content_hash !== undefined) {
      updates.push(`content_hash = $${paramCount++}`);
      values.push(data.content_hash);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(data.status);
    }
    if (data.reliability_score !== undefined) {
      updates.push(`reliability_score = $${paramCount++}`);
      values.push(data.reliability_score);
    }
    if (data.error_message !== undefined) {
      updates.push(`error_message = $${paramCount++}`);
      values.push(data.error_message);
    }
    if (data.metadata !== undefined) {
      updates.push(`metadata = $${paramCount++}`);
      values.push(JSON.stringify(data.metadata));
    }

    if (updates.length === 0) {
      return this.getSource(workspaceId, sourceId);
    }

    updates.push('updated_at = NOW()');
    values.push(workspaceId, sourceId);

    const result = await this.pool.query(
      `UPDATE intelligence_sources SET ${updates.join(', ')} WHERE workspace_id = $${paramCount++} AND id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async deleteSource(workspaceId: string, sourceId: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM intelligence_sources WHERE workspace_id = $1 AND id = $2',
      [workspaceId, sourceId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  // ============ SOURCE DOCUMENTS ============

  async createDocument(sourceId: string, workspaceId: string, data: Partial<SourceDocument>): Promise<SourceDocument> {
    const result = await this.pool.query(
      `INSERT INTO source_documents (
        source_id, workspace_id, title, author, publisher, publication_date,
        canonical_url, language, cleaned_body, headings, paragraphs,
        content_hash, extraction_confidence, provenance, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        sourceId,
        workspaceId,
        data.title || null,
        data.author || null,
        data.publisher || null,
        data.publication_date || null,
        data.canonical_url || null,
        data.language || null,
        data.cleaned_body || null,
        data.headings || [],
        data.paragraphs || [],
        data.content_hash || null,
        data.extraction_confidence || null,
        data.provenance || null,
        JSON.stringify(data.metadata || {}),
      ]
    );
    return result.rows[0];
  }

  async getDocument(workspaceId: string, documentId: string): Promise<SourceDocument | null> {
    const result = await this.pool.query(
      'SELECT * FROM source_documents WHERE workspace_id = $1 AND id = $2',
      [workspaceId, documentId]
    );
    return result.rows[0] || null;
  }

  async getDocumentsBySource(workspaceId: string, sourceId: string): Promise<SourceDocument[]> {
    const result = await this.pool.query(
      'SELECT * FROM source_documents WHERE workspace_id = $1 AND source_id = $2 ORDER BY created_at DESC',
      [workspaceId, sourceId]
    );
    return result.rows;
  }

  // ============ SOURCE CLAIMS ============

  async createClaim(workspaceId: string, sourceId: string, data: Partial<SourceClaim>): Promise<SourceClaim> {
    const result = await this.pool.query(
      `INSERT INTO source_claims (
        source_id, document_id, workspace_id, claim_text, evidence_location,
        claim_type, confidence, status, contradiction_group_id, extracted_by, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        sourceId,
        data.document_id || null,
        workspaceId,
        data.claim_text,
        data.evidence_location || null,
        data.claim_type || null,
        data.confidence || null,
        data.status || 'UNCERTAIN',
        data.contradiction_group_id || null,
        data.extracted_by || null,
        JSON.stringify(data.metadata || {}),
      ]
    );
    return result.rows[0];
  }

  async getClaimsBySource(workspaceId: string, sourceId: string): Promise<SourceClaim[]> {
    const result = await this.pool.query(
      'SELECT * FROM source_claims WHERE workspace_id = $1 AND source_id = $2 ORDER BY created_at DESC',
      [workspaceId, sourceId]
    );
    return result.rows;
  }

  async getClaimsByWorkspace(workspaceId: string, limit: number = 100): Promise<SourceClaim[]> {
    const result = await this.pool.query(
      'SELECT * FROM source_claims WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT $2',
      [workspaceId, limit]
    );
    return result.rows;
  }

  async updateClaim(workspaceId: string, claimId: string, data: Partial<SourceClaim>): Promise<SourceClaim | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.claim_text !== undefined) {
      updates.push(`claim_text = $${paramCount++}`);
      values.push(data.claim_text);
    }
    if (data.confidence !== undefined) {
      updates.push(`confidence = $${paramCount++}`);
      values.push(data.confidence);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(data.status);
    }
    if (data.contradiction_group_id !== undefined) {
      updates.push(`contradiction_group_id = $${paramCount++}`);
      values.push(data.contradiction_group_id);
    }

    if (updates.length === 0) {
      return null;
    }

    updates.push('updated_at = NOW()');
    values.push(workspaceId, claimId);

    const result = await this.pool.query(
      `UPDATE source_claims SET ${updates.join(', ')} WHERE workspace_id = $${paramCount++} AND id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  // ============ TOPICS ============

  async createTopic(workspaceId: string, canonicalName: string, aliases: string[] = []): Promise<Topic> {
    const result = await this.pool.query(
      `INSERT INTO topics (workspace_id, canonical_name, aliases)
       VALUES ($1, $2, $3)
       ON CONFLICT (workspace_id, canonical_name) DO UPDATE SET updated_at = NOW()
       RETURNING *`,
      [workspaceId, canonicalName, aliases]
    );
    return result.rows[0];
  }

  async getTopic(workspaceId: string, topicId: string): Promise<Topic | null> {
    const result = await this.pool.query(
      'SELECT * FROM topics WHERE workspace_id = $1 AND id = $2',
      [workspaceId, topicId]
    );
    return result.rows[0] || null;
  }

  async getTopicsByWorkspace(workspaceId: string, limit: number = 100): Promise<Topic[]> {
    const result = await this.pool.query(
      'SELECT * FROM topics WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT $2',
      [workspaceId, limit]
    );
    return result.rows;
  }

  async findTopicByName(workspaceId: string, name: string): Promise<Topic | null> {
    const result = await this.pool.query(
      `SELECT * FROM topics 
       WHERE workspace_id = $1 
       AND (canonical_name = $2 OR $2 = ANY(aliases))
       LIMIT 1`,
      [workspaceId, name]
    );
    return result.rows[0] || null;
  }

  // ============ TOPIC MENTIONS ============

  async createTopicMention(workspaceId: string, topicId: string, sourceId: string, data: Partial<TopicMention>): Promise<TopicMention> {
    const result = await this.pool.query(
      `INSERT INTO topic_mentions (topic_id, source_id, workspace_id, relevance_score, context, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        topicId,
        sourceId,
        workspaceId,
        data.relevance_score || null,
        data.context || null,
        JSON.stringify(data.metadata || {}),
      ]
    );
    return result.rows[0];
  }

  async getMentionsByTopic(workspaceId: string, topicId: string): Promise<TopicMention[]> {
    const result = await this.pool.query(
      'SELECT * FROM topic_mentions WHERE workspace_id = $1 AND topic_id = $2 ORDER BY mentioned_at DESC',
      [workspaceId, topicId]
    );
    return result.rows;
  }

  async getMentionsBySource(workspaceId: string, sourceId: string): Promise<TopicMention[]> {
    const result = await this.pool.query(
      'SELECT * FROM topic_mentions WHERE workspace_id = $1 AND source_id = $2 ORDER BY mentioned_at DESC',
      [workspaceId, sourceId]
    );
    return result.rows;
  }

  // ============ TREND SIGNALS ============

  async createTrendSignal(workspaceId: string, topicId: string, data: Partial<TrendSignal>): Promise<TrendSignal> {
    const result = await this.pool.query(
      `INSERT INTO trend_signals (
        topic_id, workspace_id, signal_type, observed_at, time_window_hours,
        volume, velocity, source_diversity, confidence, status, provenance, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        topicId,
        workspaceId,
        data.signal_type,
        data.observed_at || new Date(),
        data.time_window_hours || null,
        data.volume || null,
        data.velocity || null,
        data.source_diversity || null,
        data.confidence || null,
        data.status || 'NEW',
        data.provenance || null,
        JSON.stringify(data.metadata || {}),
      ]
    );
    return result.rows[0];
  }

  async getTrendSignalsByTopic(workspaceId: string, topicId: string): Promise<TrendSignal[]> {
    const result = await this.pool.query(
      'SELECT * FROM trend_signals WHERE workspace_id = $1 AND topic_id = $2 ORDER BY observed_at DESC',
      [workspaceId, topicId]
    );
    return result.rows;
  }

  async getTrendSignalsByWorkspace(workspaceId: string, limit: number = 50): Promise<TrendSignal[]> {
    const result = await this.pool.query(
      'SELECT * FROM trend_signals WHERE workspace_id = $1 ORDER BY observed_at DESC LIMIT $2',
      [workspaceId, limit]
    );
    return result.rows;
  }

  // ============ CONTENT OPPORTUNITIES ============

  async createOpportunity(workspaceId: string, data: Partial<ContentOpportunity>): Promise<ContentOpportunity> {
    const result = await this.pool.query(
      `INSERT INTO content_opportunities (
        workspace_id, topic_id, topic_name, thesis, why_now, audience_relevance,
        user_relevance, evidence_strength, novelty_score, conversation_potential,
        source_ids, supporting_claim_ids, contradiction_ids, recommended_angle,
        recommended_objective, recommended_format, confidence, status, overall_score,
        scoring_breakdown, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *`,
      [
        workspaceId,
        data.topic_id || null,
        data.topic_name,
        data.thesis || null,
        data.why_now || null,
        data.audience_relevance || null,
        data.user_relevance || null,
        data.evidence_strength || null,
        data.novelty_score || null,
        data.conversation_potential || null,
        data.source_ids || [],
        data.supporting_claim_ids || [],
        data.contradiction_ids || [],
        data.recommended_angle || null,
        data.recommended_objective || null,
        data.recommended_format || null,
        data.confidence || null,
        data.status || 'DISCOVERED',
        data.overall_score || null,
        JSON.stringify(data.scoring_breakdown || {}),
        JSON.stringify(data.metadata || {}),
      ]
    );
    return result.rows[0];
  }

  async getOpportunity(workspaceId: string, opportunityId: string): Promise<ContentOpportunity | null> {
    const result = await this.pool.query(
      'SELECT * FROM content_opportunities WHERE workspace_id = $1 AND id = $2',
      [workspaceId, opportunityId]
    );
    return result.rows[0] || null;
  }

  async getOpportunitiesByWorkspace(workspaceId: string, status?: string, limit: number = 50): Promise<ContentOpportunity[]> {
    let query = 'SELECT * FROM content_opportunities WHERE workspace_id = $1';
    const params: any[] = [workspaceId];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }

    query += ' ORDER BY overall_score DESC NULLS LAST, created_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async updateOpportunity(workspaceId: string, opportunityId: string, data: Partial<ContentOpportunity>): Promise<ContentOpportunity | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.thesis !== undefined) {
      updates.push(`thesis = $${paramCount++}`);
      values.push(data.thesis);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(data.status);
    }
    if (data.overall_score !== undefined) {
      updates.push(`overall_score = $${paramCount++}`);
      values.push(data.overall_score);
    }
    if (data.scoring_breakdown !== undefined) {
      updates.push(`scoring_breakdown = $${paramCount++}`);
      values.push(JSON.stringify(data.scoring_breakdown));
    }

    if (updates.length === 0) {
      return this.getOpportunity(workspaceId, opportunityId);
    }

    updates.push('updated_at = NOW()');
    values.push(workspaceId, opportunityId);

    const result = await this.pool.query(
      `UPDATE content_opportunities SET ${updates.join(', ')} WHERE workspace_id = $${paramCount++} AND id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async deleteOpportunity(workspaceId: string, opportunityId: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM content_opportunities WHERE workspace_id = $1 AND id = $2',
      [workspaceId, opportunityId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  // ============ CONTENT GAPS ============

  async createGap(workspaceId: string, data: Partial<ContentGap>): Promise<ContentGap> {
    const result = await this.pool.query(
      `INSERT INTO content_gaps (
        workspace_id, topic_id, topic_name, gap_type, observed_narrative,
        unanswered_question, missing_perspective, evidence, opportunity_description,
        confidence, source_ids, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        workspaceId,
        data.topic_id || null,
        data.topic_name,
        data.gap_type || null,
        data.observed_narrative || null,
        data.unanswered_question || null,
        data.missing_perspective || null,
        JSON.stringify(data.evidence || {}),
        data.opportunity_description || null,
        data.confidence || null,
        data.source_ids || [],
        JSON.stringify(data.metadata || {}),
      ]
    );
    return result.rows[0];
  }

  async getGap(workspaceId: string, gapId: string): Promise<ContentGap | null> {
    const result = await this.pool.query(
      'SELECT * FROM content_gaps WHERE workspace_id = $1 AND id = $2',
      [workspaceId, gapId]
    );
    return result.rows[0] || null;
  }

  async getGapsByWorkspace(workspaceId: string, limit: number = 50): Promise<ContentGap[]> {
    const result = await this.pool.query(
      'SELECT * FROM content_gaps WHERE workspace_id = $1 ORDER BY confidence DESC NULLS LAST, created_at DESC LIMIT $2',
      [workspaceId, limit]
    );
    return result.rows;
  }

  async getGapsByTopic(workspaceId: string, topicId: string): Promise<ContentGap[]> {
    const result = await this.pool.query(
      'SELECT * FROM content_gaps WHERE workspace_id = $1 AND topic_id = $2 ORDER BY confidence DESC NULLS LAST',
      [workspaceId, topicId]
    );
    return result.rows;
  }
}
