import { Pool } from 'pg';
import { ContentIdea, ContentIdeaStatus } from '../models/types';

export class ContentIdeaRepository {
  constructor(private pool: Pool) {}

  async create(
    workspaceId: string,
    title: string,
    data: Partial<Omit<ContentIdea, 'id' | 'workspace_id' | 'title' | 'status' | 'created_at' | 'updated_at'>> = {}
  ): Promise<ContentIdea> {
    const result = await this.pool.query(
      `INSERT INTO content_ideas (
        workspace_id, title, source_reference, pillar, audience, angle, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        workspaceId,
        title,
        data.source_reference || null,
        data.pillar || null,
        data.audience || null,
        data.angle || null,
        data.status || 'NEW',
      ]
    );
    return result.rows[0];
  }

  async findById(workspaceId: string, id: string): Promise<ContentIdea | null> {
    const result = await this.pool.query(
      'SELECT * FROM content_ideas WHERE workspace_id = $1 AND id = $2',
      [workspaceId, id]
    );
    return result.rows[0] || null;
  }

  async findByWorkspace(workspaceId: string, status?: ContentIdeaStatus): Promise<ContentIdea[]> {
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

  async update(
    workspaceId: string,
    id: string,
    data: Partial<Omit<ContentIdea, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>>
  ): Promise<ContentIdea | null> {
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
    if ((data as any).status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push((data as any).status);
    }

    if (updates.length === 0) {
      return this.findById(workspaceId, id);
    }

    updates.push('updated_at = NOW()');
    values.push(workspaceId, id);

    const result = await this.pool.query(
      `UPDATE content_ideas SET ${updates.join(', ')} WHERE workspace_id = $${paramCount++} AND id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async delete(workspaceId: string, id: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM content_ideas WHERE workspace_id = $1 AND id = $2',
      [workspaceId, id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }
}
