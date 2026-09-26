import { Pool } from 'pg';
import { 
  IntelligenceFeedback, 
  ContentPerformance, 
  LearningPattern, 
  LearningInsight, 
  BackgroundJob,
  FeedbackEntityType,
  FeedbackType,
  PatternType,
  InsightType,
  JobType,
  JobStatus
} from '../models/types';

export class ClosedLoopRepository {
  constructor(private pool: Pool) {}

  // ============ INTELLIGENCE FEEDBACK ============

  async recordFeedback(
    workspaceId: string,
    entityType: FeedbackEntityType,
    entityId: string,
    feedbackType: FeedbackType,
    userId?: string,
    feedbackData: Record<string, any> = {},
    provenance: 'USER_ACTION' | 'SYSTEM_DETECTED' | 'IMPORTED' = 'USER_ACTION'
  ): Promise<IntelligenceFeedback> {
    const result = await this.pool.query(
      `INSERT INTO intelligence_feedback (
        workspace_id, user_id, entity_type, entity_id, feedback_type, feedback_data, provenance
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        workspaceId,
        userId || null,
        entityType,
        entityId,
        feedbackType,
        JSON.stringify(feedbackData),
        provenance
      ]
    );
    return result.rows[0];
  }

  async getFeedbackByEntity(workspaceId: string, entityType: FeedbackEntityType, entityId: string): Promise<IntelligenceFeedback[]> {
    const result = await this.pool.query(
      'SELECT * FROM intelligence_feedback WHERE workspace_id = $1 AND entity_type = $2 AND entity_id = $3 ORDER BY created_at DESC',
      [workspaceId, entityType, entityId]
    );
    return result.rows;
  }

  async getFeedbackByType(workspaceId: string, feedbackType: FeedbackType, limit: number = 100): Promise<IntelligenceFeedback[]> {
    const result = await this.pool.query(
      'SELECT * FROM intelligence_feedback WHERE workspace_id = $1 AND feedback_type = $2 ORDER BY created_at DESC LIMIT $3',
      [workspaceId, feedbackType, limit]
    );
    return result.rows;
  }

  async getRecentFeedback(workspaceId: string, limit: number = 100): Promise<IntelligenceFeedback[]> {
    const result = await this.pool.query(
      'SELECT * FROM intelligence_feedback WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT $2',
      [workspaceId, limit]
    );
    return result.rows;
  }

  // ============ CONTENT PERFORMANCE ============

  async recordPerformance(
    workspaceId: string,
    contentId: string,
    platform: string,
    publishedAt: Date,
    metrics: Record<string, any>,
    provenance: 'VERIFIED_PLATFORM' | 'USER_ENTERED' | 'IMPORTED' | 'SYSTEM_CALCULATED',
    sourceReference?: string
  ): Promise<ContentPerformance> {
    const result = await this.pool.query(
      `INSERT INTO content_performance (
        workspace_id, content_id, platform, published_at, metrics, provenance, source_reference
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        workspaceId,
        contentId,
        platform,
        publishedAt,
        JSON.stringify(metrics),
        provenance,
        sourceReference || null
      ]
    );
    return result.rows[0];
  }

  async updatePerformance(
    workspaceId: string,
    performanceId: string,
    metrics: Record<string, any>
  ): Promise<ContentPerformance | null> {
    const result = await this.pool.query(
      `UPDATE content_performance 
       SET metrics = $1, last_updated_at = NOW()
       WHERE workspace_id = $2 AND id = $3
       RETURNING *`,
      [JSON.stringify(metrics), workspaceId, performanceId]
    );
    return result.rows[0] || null;
  }

  async getPerformanceByContent(workspaceId: string, contentId: string): Promise<ContentPerformance[]> {
    const result = await this.pool.query(
      'SELECT * FROM content_performance WHERE workspace_id = $1 AND content_id = $2 ORDER BY published_at DESC',
      [workspaceId, contentId]
    );
    return result.rows;
  }

  async getRecentPerformance(workspaceId: string, limit: number = 50): Promise<ContentPerformance[]> {
    const result = await this.pool.query(
      'SELECT * FROM content_performance WHERE workspace_id = $1 ORDER BY published_at DESC LIMIT $2',
      [workspaceId, limit]
    );
    return result.rows;
  }

  // ============ LEARNING PATTERNS ============

  async createPattern(
    workspaceId: string,
    patternType: PatternType,
    patternData: Record<string, any>,
    confidence: number,
    observationCount: number,
    evidenceIds: string[],
    timeRangeStart?: Date,
    timeRangeEnd?: Date,
    generatedBy: 'AI' | 'DETERMINISTIC' | 'HYBRID' = 'DETERMINISTIC',
    expiresAt?: Date
  ): Promise<LearningPattern> {
    const result = await this.pool.query(
      `INSERT INTO learning_patterns (
        workspace_id, pattern_type, pattern_data, confidence, observation_count,
        evidence_ids, time_range_start, time_range_end, generated_by, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        workspaceId,
        patternType,
        JSON.stringify(patternData),
        confidence,
        observationCount,
        evidenceIds,
        timeRangeStart || null,
        timeRangeEnd || null,
        generatedBy,
        expiresAt || null
      ]
    );
    return result.rows[0];
  }

  async updatePattern(
    workspaceId: string,
    patternId: string,
    updates: Partial<LearningPattern>
  ): Promise<LearningPattern | null> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.confidence !== undefined) {
      setClauses.push(`confidence = $${paramCount++}`);
      values.push(updates.confidence);
    }
    if (updates.observation_count !== undefined) {
      setClauses.push(`observation_count = $${paramCount++}`);
      values.push(updates.observation_count);
    }
    if (updates.evidence_ids !== undefined) {
      setClauses.push(`evidence_ids = $${paramCount++}`);
      values.push(updates.evidence_ids);
    }
    if (updates.is_active !== undefined) {
      setClauses.push(`is_active = $${paramCount++}`);
      values.push(updates.is_active);
    }

    if (setClauses.length === 0) {
      return this.getPattern(workspaceId, patternId);
    }

    setClauses.push('updated_at = NOW()');
    values.push(workspaceId, patternId);

    const result = await this.pool.query(
      `UPDATE learning_patterns SET ${setClauses.join(', ')} WHERE workspace_id = $${paramCount++} AND id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async getPattern(workspaceId: string, patternId: string): Promise<LearningPattern | null> {
    const result = await this.pool.query(
      'SELECT * FROM learning_patterns WHERE workspace_id = $1 AND id = $2',
      [workspaceId, patternId]
    );
    return result.rows[0] || null;
  }

  async getActivePatterns(workspaceId: string, patternType?: PatternType): Promise<LearningPattern[]> {
    let query = 'SELECT * FROM learning_patterns WHERE workspace_id = $1 AND is_active = true';
    const params: any[] = [workspaceId];

    if (patternType) {
      query += ' AND pattern_type = $2';
      params.push(patternType);
    }

    query += ' ORDER BY confidence DESC, observation_count DESC';

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async getExpiredPatterns(workspaceId: string): Promise<LearningPattern[]> {
    const result = await this.pool.query(
      `SELECT * FROM learning_patterns 
       WHERE workspace_id = $1 
       AND expires_at IS NOT NULL 
       AND expires_at < NOW()
       AND is_active = true`,
      [workspaceId]
    );
    return result.rows;
  }

  // ============ LEARNING INSIGHTS ============

  async createInsight(
    workspaceId: string,
    insightType: InsightType,
    title: string,
    description: string,
    confidence: number,
    observationCount: number,
    generatedBy: 'AI' | 'DETERMINISTIC' | 'HYBRID',
    patternId?: string,
    evidenceSummary?: string,
    timeRangeStart?: Date,
    timeRangeEnd?: Date,
    isActionable: boolean = false,
    actionSuggestion?: string,
    expiresAt?: Date
  ): Promise<LearningInsight> {
    const result = await this.pool.query(
      `INSERT INTO learning_insights (
        workspace_id, pattern_id, insight_type, title, description, evidence_summary,
        confidence, observation_count, time_range_start, time_range_end, generated_by,
        is_actionable, action_suggestion, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        workspaceId,
        patternId || null,
        insightType,
        title,
        description,
        evidenceSummary || null,
        confidence,
        observationCount,
        timeRangeStart || null,
        timeRangeEnd || null,
        generatedBy,
        isActionable,
        actionSuggestion || null,
        expiresAt || null
      ]
    );
    return result.rows[0];
  }

  async getInsight(workspaceId: string, insightId: string): Promise<LearningInsight | null> {
    const result = await this.pool.query(
      'SELECT * FROM learning_insights WHERE workspace_id = $1 AND id = $2',
      [workspaceId, insightId]
    );
    return result.rows[0] || null;
  }

  async getActiveInsights(workspaceId: string, insightType?: InsightType, limit: number = 50): Promise<LearningInsight[]> {
    let query = 'SELECT * FROM learning_insights WHERE workspace_id = $1 AND is_active = true';
    const params: any[] = [workspaceId];

    if (insightType) {
      query += ' AND insight_type = $2';
      params.push(insightType);
    }

    query += ' ORDER BY confidence DESC, observation_count DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async updateInsight(
    workspaceId: string,
    insightId: string,
    updates: Partial<LearningInsight>
  ): Promise<LearningInsight | null> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.is_active !== undefined) {
      setClauses.push(`is_active = $${paramCount++}`);
      values.push(updates.is_active);
    }
    if (updates.confidence !== undefined) {
      setClauses.push(`confidence = $${paramCount++}`);
      values.push(updates.confidence);
    }

    if (setClauses.length === 0) {
      return this.getInsight(workspaceId, insightId);
    }

    setClauses.push('updated_at = NOW()');
    values.push(workspaceId, insightId);

    const result = await this.pool.query(
      `UPDATE learning_insights SET ${setClauses.join(', ')} WHERE workspace_id = $${paramCount++} AND id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  // ============ BACKGROUND JOBS ============

  async createJob(
    workspaceId: string,
    jobType: JobType,
    scheduledAt: Date
  ): Promise<BackgroundJob> {
    const result = await this.pool.query(
      `INSERT INTO background_jobs (workspace_id, job_type, scheduled_at, status)
       VALUES ($1, $2, $3, 'PENDING')
       RETURNING *`,
      [workspaceId, jobType, scheduledAt]
    );
    return result.rows[0];
  }

  async updateJobStatus(
    jobId: string,
    status: JobStatus,
    errorMessage?: string,
    resultData?: Record<string, any>
  ): Promise<BackgroundJob | null> {
    const result = await this.pool.query(
      `UPDATE background_jobs 
       SET status = $1, 
           error_message = $2, 
           result_data = $3,
           ${status === 'RUNNING' ? 'started_at = NOW()' : ''}
           ${status === 'COMPLETED' || status === 'FAILED' ? ', completed_at = NOW()' : ''}
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, errorMessage || null, resultData ? JSON.stringify(resultData) : null, jobId]
    );
    return result.rows[0] || null;
  }

  async getPendingJobs(workspaceId?: string): Promise<BackgroundJob[]> {
    let query = "SELECT * FROM background_jobs WHERE status = 'PENDING'";
    const params: any[] = [];

    if (workspaceId) {
      query += ' AND workspace_id = $1';
      params.push(workspaceId);
    }

    query += ' ORDER BY scheduled_at ASC';

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async getRecentJobs(workspaceId: string, limit: number = 20): Promise<BackgroundJob[]> {
    const result = await this.pool.query(
      'SELECT * FROM background_jobs WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT $2',
      [workspaceId, limit]
    );
    return result.rows;
  }

  async getJob(jobId: string): Promise<BackgroundJob | null> {
    const result = await this.pool.query(
      'SELECT * FROM background_jobs WHERE id = $1',
      [jobId]
    );
    return result.rows[0] || null;
  }
}
