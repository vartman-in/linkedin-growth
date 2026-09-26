import { Pool } from 'pg';
import { ContentDraft, ContentDraftStatus } from '../models/types';

export class ContentDraftRepository {
  constructor(private pool: Pool) {}

  async create(
    workspaceId: string,
    title: string,
    body: string,
    contentType: string,
    data: Partial<Omit<ContentDraft, 'id' | 'workspace_id' | 'title' | 'body' | 'content_type' | 'status' | 'version' | 'created_at' | 'updated_at'>> = {}
  ): Promise<ContentDraft> {
    const result = await this.pool.query(
      `INSERT INTO content_drafts (
        workspace_id, idea_id, title, body, content_type, status, version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        workspaceId,
        data.idea_id || null,
        title,
        body,
        contentType,
        data.status || 'DRAFT',
        data.version || 1,
      ]
    );
    return result.rows[0];
  }

  async findById(workspaceId: string, id: string): Promise<ContentDraft | null> {
    const result = await this.pool.query(
      'SELECT * FROM content_drafts WHERE workspace_id = $1 AND id = $2',
      [workspaceId, id]
    );
    return result.rows[0] || null;
  }

  async findByWorkspace(workspaceId: string, status?: ContentDraftStatus): Promise<ContentDraft[]> {
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

  async findByIdea(workspaceId: string, ideaId: string): Promise<ContentDraft[]> {
    const result = await this.pool.query(
      'SELECT * FROM content_drafts WHERE workspace_id = $1 AND idea_id = $2 ORDER BY version DESC',
      [workspaceId, ideaId]
    );
    return result.rows;
  }

  async update(
    workspaceId: string,
    id: string,
    data: Partial<Omit<ContentDraft, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>>
  ): Promise<ContentDraft | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.idea_id !== undefined) {
      updates.push(`idea_id = $${paramCount++}`);
      values.push(data.idea_id);
    }
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
    if ((data as any).status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push((data as any).status);
    }
    if ((data as any).version !== undefined) {
      updates.push(`version = $${paramCount++}`);
      values.push((data as any).version);
    }

    if (updates.length === 0) {
      return this.findById(workspaceId, id);
    }

    updates.push('updated_at = NOW()');
    values.push(workspaceId, id);

    const result = await this.pool.query(
      `UPDATE content_drafts SET ${updates.join(', ')} WHERE workspace_id = $${paramCount++} AND id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async delete(workspaceId: string, id: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM content_drafts WHERE workspace_id = $1 AND id = $2',
      [workspaceId, id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }
}
