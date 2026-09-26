/**
 * Content Ideas Service
 * Handles content idea creation, research, and AI-powered generation
 */

import { Pool } from 'pg';
import { researchService, strategyService, writingService, qualityService } from '../services/ai';
import { AIContext, ContentDraft } from '../services/ai';
import { v4 as uuidv4 } from 'uuid';
import { IntelligenceFeedbackService } from './intelligence/feedback.service';

export class ContentIdeasService {
  private feedbackService: IntelligenceFeedbackService;

  constructor(private pool: Pool) {
    this.feedbackService = new IntelligenceFeedbackService(pool);
  }

  /**
   * Create a new content idea
   */
  async createIdea(
    workspaceId: string,
    data: {
      title: string;
      source_reference?: string;
      pillar?: string;
      audience?: string;
      angle?: string;
    }
  ): Promise<any> {
    const result = await this.pool.query(
      `INSERT INTO content_ideas (workspace_id, title, source_reference, pillar, audience, angle, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'NEW')
       RETURNING *`,
      [
        workspaceId,
        data.title,
        data.source_reference || null,
        data.pillar || null,
        data.audience || null,
        data.angle || null
      ]
    );
    return result.rows[0];
  }

  /**
   * Get idea by ID
   */
  async getIdea(workspaceId: string, ideaId: string): Promise<any> {
    const result = await this.pool.query(
      'SELECT * FROM content_ideas WHERE workspace_id = $1 AND id = $2',
      [workspaceId, ideaId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get all ideas for workspace
   */
  async getIdeas(workspaceId: string, status?: string): Promise<any[]> {
    let query = 'SELECT * FROM content_ideas WHERE workspace_id = $1';
    const params: any[] = [workspaceId];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Update idea
   */
  async updateIdea(
    workspaceId: string,
    ideaId: string,
    data: Partial<{
      title: string;
      source_reference: string;
      pillar: string;
      audience: string;
      angle: string;
      status: string;
    }>
  ): Promise<any> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(data.title);
    }
    if (data.source_reference !== undefined) {
      updates.push(`source_reference = $${paramCount++}`);
      values.push(data.source_reference);
    }
    if (data.pillar !== undefined) {
      updates.push(`pillar = $${paramCount++}`);
      values.push(data.pillar);
    }
    if (data.audience !== undefined) {
      updates.push(`audience = $${paramCount++}`);
      values.push(data.audience);
    }
    if (data.angle !== undefined) {
      updates.push(`angle = $${paramCount++}`);
      values.push(data.angle);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(data.status);
    }

    if (updates.length === 0) {
      return this.getIdea(workspaceId, ideaId);
    }

    updates.push('updated_at = NOW()');
    values.push(workspaceId, ideaId);

    const result = await this.pool.query(
      `UPDATE content_ideas SET ${updates.join(', ')} WHERE workspace_id = $${paramCount++} AND id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Delete idea
   */
  async deleteIdea(workspaceId: string, ideaId: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM content_ideas WHERE workspace_id = $1 AND id = $2',
      [workspaceId, ideaId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Generate AI-powered draft from idea
   */
  async generateDraft(
    workspaceId: string,
    ideaId: string,
    context: AIContext
  ): Promise<ContentDraft> {
    // Get the idea
    const idea = await this.getIdea(workspaceId, ideaId);
    if (!idea) {
      throw new Error('Idea not found');
    }

    // Research the topic
    const research = await researchService.research(idea.title, context);

    // Determine strategy
    const strategy = await strategyService.determineStrategy(idea.title, research, context);

    // Generate hook
    strategy.hook = await strategyService.generateHook(strategy, context);

    // Generate draft
    const draft = await writingService.generateDraft(strategy, research, context);

    // Validate quality
    const validation = await qualityService.validateDraft(draft, context);
    draft.metadata.qualityScore = validation.score;
    draft.metadata.qualityStatus = validation.status;
    draft.metadata.qualityIssues = validation.issues;

    // Save draft to database
    const savedDraft = await this.saveDraft(workspaceId, ideaId, draft);

    // Update idea status
    await this.updateIdea(workspaceId, ideaId, { status: 'DRAFTING' });

    return savedDraft;
  }

  /**
   * Save draft to database
   */
  private async saveDraft(
    workspaceId: string,
    ideaId: string,
    draft: ContentDraft
  ): Promise<ContentDraft> {
    const result = await this.pool.query(
      `INSERT INTO content_drafts (workspace_id, idea_id, title, body, content_type, status, version)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        workspaceId,
        ideaId,
        draft.title,
        draft.content,
        draft.format,
        draft.metadata.qualityStatus === 'pass' ? 'IN_REVIEW' : 'DRAFT',
        1
      ]
    );

    return {
      ...draft,
      id: result.rows[0].id
    };
  }

  /**
   * Get draft by ID
   */
  async getDraft(workspaceId: string, draftId: string): Promise<any> {
    const result = await this.pool.query(
      'SELECT * FROM content_drafts WHERE workspace_id = $1 AND id = $2',
      [workspaceId, draftId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get all drafts for workspace
   */
  async getDrafts(workspaceId: string, status?: string): Promise<any[]> {
    let query = 'SELECT * FROM content_drafts WHERE workspace_id = $1';
    const params: any[] = [workspaceId];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Update draft
   */
  async updateDraft(
    workspaceId: string,
    draftId: string,
    data: Partial<{
      title: string;
      body: string;
      content_type: string;
      status: string;
      version: number;
    }>
  ): Promise<any> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(data.title);
    }
    if (data.body !== undefined) {
      updates.push(`body = $${paramCount++}`);
      values.push(data.body);
    }
    if (data.content_type !== undefined) {
      updates.push(`content_type = $${paramCount++}`);
      values.push(data.content_type);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(data.status);
    }
    if (data.version !== undefined) {
      updates.push(`version = $${paramCount++}`);
      values.push(data.version);
    }

    if (updates.length === 0) {
      return this.getDraft(workspaceId, draftId);
    }

    updates.push('updated_at = NOW()');
    values.push(workspaceId, draftId);

    const result = await this.pool.query(
      `UPDATE content_drafts SET ${updates.join(', ')} WHERE workspace_id = $${paramCount++} AND id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Delete draft
   */
  async deleteDraft(workspaceId: string, draftId: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM content_drafts WHERE workspace_id = $1 AND id = $2',
      [workspaceId, draftId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Approve draft
   */
  async approveDraft(workspaceId: string, draftId: string, userId?: string): Promise<any> {
    const draft = await this.updateDraft(workspaceId, draftId, { status: 'APPROVED' });
    
    // Record feedback for closed-loop learning
    if (draft) {
      await this.feedbackService.recordDraftApproved(workspaceId, draftId, userId);
    }
    
    return draft;
  }

  /**
   * Schedule draft
   */
  async scheduleDraft(workspaceId: string, draftId: string): Promise<any> {
    return this.updateDraft(workspaceId, draftId, { status: 'SCHEDULED' });
  }
}
