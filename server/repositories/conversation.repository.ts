import { Pool } from 'pg';
import { Conversation, Message, ConversationStatus, MessageDirection } from '../models/types';

export class ConversationRepository {
  constructor(private pool: Pool) {}

  async create(
    workspaceId: string,
    channel: string,
    data: Partial<Omit<Conversation, 'id' | 'workspace_id' | 'channel' | 'status' | 'created_at' | 'updated_at'>> = {}
  ): Promise<Conversation> {
    const result = await this.pool.query(
      `INSERT INTO conversations (workspace_id, lead_id, channel, status)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [workspaceId, data.lead_id || null, channel, data.status || 'ACTIVE']
    );
    return result.rows[0];
  }

  async findById(workspaceId: string, id: string): Promise<Conversation | null> {
    const result = await this.pool.query(
      'SELECT * FROM conversations WHERE workspace_id = $1 AND id = $2',
      [workspaceId, id]
    );
    return result.rows[0] || null;
  }

  async findByWorkspace(workspaceId: string, status?: ConversationStatus): Promise<Conversation[]> {
    let query = 'SELECT * FROM conversations WHERE workspace_id = $1';
    const params: any[] = [workspaceId];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async findByLead(workspaceId: string, leadId: string): Promise<Conversation[]> {
    const result = await this.pool.query(
      'SELECT * FROM conversations WHERE workspace_id = $1 AND lead_id = $2 ORDER BY created_at DESC',
      [workspaceId, leadId]
    );
    return result.rows;
  }

  async update(
    workspaceId: string,
    id: string,
    data: Partial<Pick<Conversation, 'lead_id' | 'status'>>
  ): Promise<Conversation | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if ((data as any).lead_id !== undefined) {
      updates.push(`lead_id = $${paramCount++}`);
      values.push((data as any).lead_id);
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
      `UPDATE conversations SET ${updates.join(', ')} WHERE workspace_id = $${paramCount++} AND id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async delete(workspaceId: string, id: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM conversations WHERE workspace_id = $1 AND id = $2',
      [workspaceId, id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export class MessageRepository {
  constructor(private pool: Pool) {}

  async create(
    conversationId: string,
    direction: MessageDirection,
    body: string
  ): Promise<Message> {
    const result = await this.pool.query(
      `INSERT INTO messages (conversation_id, direction, body)
       VALUES ($1, $2, $3) RETURNING *`,
      [conversationId, direction, body]
    );
    return result.rows[0];
  }

  async findById(id: string): Promise<Message | null> {
    const result = await this.pool.query(
      'SELECT * FROM messages WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByConversation(conversationId: string): Promise<Message[]> {
    const result = await this.pool.query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [conversationId]
    );
    return result.rows;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM messages WHERE id = $1',
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }
}
