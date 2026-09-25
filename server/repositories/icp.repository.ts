import { Pool } from 'pg';
import { ICP } from '../models/types';

export class ICPRepository {
  constructor(private pool: Pool) {}

  async create(
    workspaceId: string,
    name: string,
    data: Partial<Omit<ICP, 'id' | 'workspace_id' | 'name' | 'created_at' | 'updated_at'>>
  ): Promise<ICP> {
    const result = await this.pool.query(
      `INSERT INTO icps (
        workspace_id, name, target_roles, industries, company_sizes, 
        geography, seniority, problems, buying_signals, exclusions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        workspaceId,
        name,
        data.target_roles || [],
        data.industries || [],
        data.company_sizes || [],
        data.geography || [],
        data.seniority || [],
        data.problems || [],
        data.buying_signals || [],
        data.exclusions || [],
      ]
    );
    return result.rows[0];
  }

  async findById(workspaceId: string, id: string): Promise<ICP | null> {
    const result = await this.pool.query(
      'SELECT * FROM icps WHERE workspace_id = $1 AND id = $2',
      [workspaceId, id]
    );
    return result.rows[0] || null;
  }

  async findByWorkspace(workspaceId: string): Promise<ICP[]> {
    const result = await this.pool.query(
      'SELECT * FROM icps WHERE workspace_id = $1 ORDER BY created_at DESC',
      [workspaceId]
    );
    return result.rows;
  }

  async update(
    workspaceId: string,
    id: string,
    data: Partial<Omit<ICP, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>>
  ): Promise<ICP | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.target_roles !== undefined) {
      updates.push(`target_roles = $${paramCount++}`);
      values.push(data.target_roles);
    }
    if (data.industries !== undefined) {
      updates.push(`industries = $${paramCount++}`);
      values.push(data.industries);
    }
    if (data.company_sizes !== undefined) {
      updates.push(`company_sizes = $${paramCount++}`);
      values.push(data.company_sizes);
    }
    if (data.geography !== undefined) {
      updates.push(`geography = $${paramCount++}`);
      values.push(data.geography);
    }
    if (data.seniority !== undefined) {
      updates.push(`seniority = $${paramCount++}`);
      values.push(data.seniority);
    }
    if (data.problems !== undefined) {
      updates.push(`problems = $${paramCount++}`);
      values.push(data.problems);
    }
    if (data.buying_signals !== undefined) {
      updates.push(`buying_signals = $${paramCount++}`);
      values.push(data.buying_signals);
    }
    if (data.exclusions !== undefined) {
      updates.push(`exclusions = $${paramCount++}`);
      values.push(data.exclusions);
    }

    if (updates.length === 0) {
      return this.findById(workspaceId, id);
    }

    updates.push('updated_at = NOW()');
    values.push(workspaceId, id);

    const result = await this.pool.query(
      `UPDATE icps SET ${updates.join(', ')} WHERE workspace_id = $${paramCount++} AND id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async delete(workspaceId: string, id: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM icps WHERE workspace_id = $1 AND id = $2',
      [workspaceId, id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }
}
