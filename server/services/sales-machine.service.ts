/**
 * Sales Machine Service
 * Handles lead management, outreach, and sales intelligence
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export class SalesMachineService {
  constructor(private pool: Pool) {}

  /**
   * Create a new lead
   */
  async createLead(
    workspaceId: string,
    data: {
      name: string;
      profile_url?: string;
      company?: string;
      title?: string;
      source?: string;
    }
  ): Promise<any> {
    const result = await this.pool.query(
      `INSERT INTO leads (workspace_id, name, profile_url, company, title, status, source)
       VALUES ($1, $2, $3, $4, $5, 'NEW', $6)
       RETURNING *`,
      [
        workspaceId,
        data.name,
        data.profile_url || null,
        data.company || null,
        data.title || null,
        data.source || null
      ]
    );
    return result.rows[0];
  }

  /**
   * Get lead by ID
   */
  async getLead(workspaceId: string, leadId: string): Promise<any> {
    const result = await this.pool.query(
      'SELECT * FROM leads WHERE workspace_id = $1 AND id = $2',
      [workspaceId, leadId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get all leads for workspace
   */
  async getLeads(workspaceId: string, status?: string): Promise<any[]> {
    let query = 'SELECT * FROM leads WHERE workspace_id = $1';
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
   * Update lead
   */
  async updateLead(
    workspaceId: string,
    leadId: string,
    data: Partial<{
      name: string;
      profile_url: string;
      company: string;
      title: string;
      status: string;
      source: string;
    }>
  ): Promise<any> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.profile_url !== undefined) {
      updates.push(`profile_url = $${paramCount++}`);
      values.push(data.profile_url);
    }
    if (data.company !== undefined) {
      updates.push(`company = $${paramCount++}`);
      values.push(data.company);
    }
    if (data.title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(data.title);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(data.status);
    }
    if (data.source !== undefined) {
      updates.push(`source = $${paramCount++}`);
      values.push(data.source);
    }

    if (updates.length === 0) {
      return this.getLead(workspaceId, leadId);
    }

    updates.push('updated_at = NOW()');
    values.push(workspaceId, leadId);

    const result = await this.pool.query(
      `UPDATE leads SET ${updates.join(', ')} WHERE workspace_id = $${paramCount++} AND id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Delete lead
   */
  async deleteLead(workspaceId: string, leadId: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM leads WHERE workspace_id = $1 AND id = $2',
      [workspaceId, leadId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Qualify lead
   */
  async qualifyLead(workspaceId: string, leadId: string): Promise<any> {
    return this.updateLead(workspaceId, leadId, { status: 'QUALIFIED' });
  }

  /**
   * Create conversation
   */
  async createConversation(
    workspaceId: string,
    leadId: string,
    channel: string
  ): Promise<any> {
    const result = await this.pool.query(
      `INSERT INTO conversations (workspace_id, lead_id, channel, status)
       VALUES ($1, $2, $3, 'ACTIVE')
       RETURNING *`,
      [workspaceId, leadId, channel]
    );
    return result.rows[0];
  }

  /**
   * Get conversation by ID
   */
  async getConversation(workspaceId: string, conversationId: string): Promise<any> {
    const result = await this.pool.query(
      'SELECT * FROM conversations WHERE workspace_id = $1 AND id = $2',
      [workspaceId, conversationId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get conversations for lead
   */
  async getConversationsForLead(workspaceId: string, leadId: string): Promise<any[]> {
    const result = await this.pool.query(
      'SELECT * FROM conversations WHERE workspace_id = $1 AND lead_id = $2 ORDER BY created_at DESC',
      [workspaceId, leadId]
    );
    return result.rows;
  }

  /**
   * Add message to conversation
   */
  async addMessage(
    conversationId: string,
    direction: 'INBOUND' | 'OUTBOUND',
    body: string
  ): Promise<any> {
    const result = await this.pool.query(
      `INSERT INTO messages (conversation_id, direction, body)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [conversationId, direction, body]
    );
    return result.rows[0];
  }

  /**
   * Get messages for conversation
   */
  async getMessages(conversationId: string): Promise<any[]> {
    const result = await this.pool.query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [conversationId]
    );
    return result.rows;
  }

  /**
   * Create pipeline opportunity
   */
  async createOpportunity(
    workspaceId: string,
    leadId: string,
    data: {
      stage?: string;
      value?: number;
      source?: string;
    }
  ): Promise<any> {
    const result = await this.pool.query(
      `INSERT INTO pipeline_opportunities (workspace_id, lead_id, stage, value, source)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        workspaceId,
        leadId,
        data.stage || 'DISCOVERED',
        data.value || null,
        data.source || null
      ]
    );
    return result.rows[0];
  }

  /**
   * Get opportunity by ID
   */
  async getOpportunity(workspaceId: string, opportunityId: string): Promise<any> {
    const result = await this.pool.query(
      'SELECT * FROM pipeline_opportunities WHERE workspace_id = $1 AND id = $2',
      [workspaceId, opportunityId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get opportunities for workspace
   */
  async getOpportunities(workspaceId: string, stage?: string): Promise<any[]> {
    let query = 'SELECT * FROM pipeline_opportunities WHERE workspace_id = $1';
    const params: any[] = [workspaceId];

    if (stage) {
      query += ' AND stage = $2';
      params.push(stage);
    }

    query += ' ORDER BY created_at DESC';
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Update opportunity stage
   */
  async updateOpportunityStage(
    workspaceId: string,
    opportunityId: string,
    stage: string
  ): Promise<any> {
    const result = await this.pool.query(
      `UPDATE pipeline_opportunities SET stage = $1, updated_at = NOW()
       WHERE workspace_id = $2 AND id = $3
       RETURNING *`,
      [stage, workspaceId, opportunityId]
    );
    return result.rows[0] || null;
  }

  /**
   * Generate outreach message
   */
  async generateOutreach(
    workspaceId: string,
    leadId: string,
    context: any
  ): Promise<string> {
    // Placeholder - will integrate with AI provider
    // Will use lead data, ICP, and context to generate personalized outreach
    const lead = await this.getLead(workspaceId, leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    return `Hi ${lead.name}, I noticed your work at ${lead.company}. I'd love to connect and learn more about what you're building.`;
  }

  /**
   * Classify inbound message
   */
  async classifyMessage(message: string): Promise<{
    intent: 'interested' | 'question' | 'objection' | 'not_interested' | 'meeting_request' | 'unknown';
    confidence: number;
  }> {
    // Placeholder - will integrate with AI provider
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes('interested') || messageLower.includes('learn more')) {
      return { intent: 'interested', confidence: 0.8 };
    }
    if (messageLower.includes('?')) {
      return { intent: 'question', confidence: 0.7 };
    }
    if (messageLower.includes('not interested') || messageLower.includes('no thanks')) {
      return { intent: 'not_interested', confidence: 0.9 };
    }
    if (messageLower.includes('meeting') || messageLower.includes('call')) {
      return { intent: 'meeting_request', confidence: 0.8 };
    }
    
    return { intent: 'unknown', confidence: 0.5 };
  }
}
