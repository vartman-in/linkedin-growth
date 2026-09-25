import { Pool } from 'pg';
import { Lead, LeadStatus } from '../models/types';

export class LeadRepository {
  constructor(private pool: Pool) {}

  async create(
    workspaceId: string,
    name: string,
    data: Partial<Omit<Lead, 'id' | 'workspace_id' | 'name' | 'status' | 'created_at' | 'updated_at'>> = {}
  ): Promise<Lead> {
    const result = await this.pool.query(
      `INSERT INTO leads (
        workspace_id, name, profile_url, company, title, status, source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        workspaceId,
        name,
        data.profile_url || null,
        data.company || null,
        data.title || null,
        data.status || 'NEW',
        data.source || null,
      ]
    );
    return result.rows[0];
  }

  async findById(workspaceId: string, id: string): Promise<Lead | null> {
    const result = await this.pool.query(
      'SELECT * FROM leads WHERE workspace_id = $1 AND id = $2',
      [workspaceId, id]
    );
    return result.rows[0] || null;
  }

  async findByWorkspace(workspaceId: string, status?: LeadStatus): Promise<Lead[]> {
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

  async update(
    workspaceId: string,
    id: string,
    data: Partial<Omit<Lead, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>>
  ): Promise<Lead | null> {
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
      return this.findById(workspaceId, id);
    }

    updates.push('updated_at = NOW()');
    values.push(workspaceId, id);

    const result = await this.pool.query(
      `UPDATE leads SET ${updates.join(', ')} WHERE workspace_id = $${paramCount++} AND id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async delete(workspaceId: string, id: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM leads WHERE workspace_id = $1 AND id = $2',
      [workspaceId, id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }
}
