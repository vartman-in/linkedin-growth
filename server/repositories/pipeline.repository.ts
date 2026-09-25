import { Pool } from 'pg';
import { PipelineOpportunity, OpportunityStage } from '../models/types';

export class PipelineOpportunityRepository {
  constructor(private pool: Pool) {}

  async create(
    workspaceId: string,
    data: Partial<Omit<PipelineOpportunity, 'id' | 'workspace_id' | 'stage' | 'created_at' | 'updated_at'>> = {}
  ): Promise<PipelineOpportunity> {
    const result = await this.pool.query(
      `INSERT INTO pipeline_opportunities (workspace_id, lead_id, stage, value, source)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        workspaceId,
        data.lead_id || null,
        data.stage || 'DISCOVERED',
        data.value || null,
        data.source || null,
      ]
    );
    return result.rows[0];
  }

  async findById(workspaceId: string, id: string): Promise<PipelineOpportunity | null> {
    const result = await this.pool.query(
      'SELECT * FROM pipeline_opportunities WHERE workspace_id = $1 AND id = $2',
      [workspaceId, id]
    );
    return result.rows[0] || null;
  }

  async findByWorkspace(workspaceId: string, stage?: OpportunityStage): Promise<PipelineOpportunity[]> {
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

  async findByLead(workspaceId: string, leadId: string): Promise<PipelineOpportunity[]> {
    const result = await this.pool.query(
      'SELECT * FROM pipeline_opportunities WHERE workspace_id = $1 AND lead_id = $2 ORDER BY created_at DESC',
      [workspaceId, leadId]
    );
    return result.rows;
  }

  async update(
    workspaceId: string,
    id: string,
    data: Partial<Omit<PipelineOpportunity, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>>
  ): Promise<PipelineOpportunity | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.lead_id !== undefined) {
      updates.push(`lead_id = $${paramCount++}`);
      values.push(data.lead_id);
    }
    if (data.stage !== undefined) {
      updates.push(`stage = $${paramCount++}`);
      values.push(data.stage);
    }
    if (data.value !== undefined) {
      updates.push(`value = $${paramCount++}`);
      values.push(data.value);
    }
    if (data.source !== undefined) {
      updates.push(`source = $${paramCount++}`);
      values.push(data.source);
    }

    if (updates.length === 0) {
      return this.findById(workspaceId, id);
    }

    updates.push('updated_at = NOW()');
    values.push(workspaceId, id);

    const result = await this.pool.query(
      `UPDATE pipeline_opportunities SET ${updates.join(', ')} WHERE workspace_id = $${paramCount++} AND id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async delete(workspaceId: string, id: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM pipeline_opportunities WHERE workspace_id = $1 AND id = $2',
      [workspaceId, id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }
}
