import { Pool } from 'pg';
import { Profile } from '../models/types';

export class ProfileRepository {
  constructor(private pool: Pool) {}

  async create(
    workspaceId: string,
    userId: string,
    data: Partial<Omit<Profile, 'id' | 'workspace_id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<Profile> {
    const result = await this.pool.query(
      `INSERT INTO profiles (
        workspace_id, user_id, display_name, headline, role, company, bio, 
        voice_tone, banned_words, proof_points
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        workspaceId,
        userId,
        data.display_name || null,
        data.headline || null,
        data.role || null,
        data.company || null,
        data.bio || null,
        data.voice_tone || null,
        data.banned_words || [],
        data.proof_points || [],
      ]
    );
    return result.rows[0];
  }

  async findByWorkspaceAndUser(workspaceId: string, userId: string): Promise<Profile | null> {
    const result = await this.pool.query(
      'SELECT * FROM profiles WHERE workspace_id = $1 AND user_id = $2',
      [workspaceId, userId]
    );
    return result.rows[0] || null;
  }

  async findByWorkspace(workspaceId: string): Promise<Profile[]> {
    const result = await this.pool.query(
      'SELECT * FROM profiles WHERE workspace_id = $1 ORDER BY created_at',
      [workspaceId]
    );
    return result.rows;
  }

  async update(
    workspaceId: string,
    userId: string,
    data: Partial<Omit<Profile, 'id' | 'workspace_id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<Profile | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.display_name !== undefined) {
      updates.push(`display_name = $${paramCount++}`);
      values.push(data.display_name);
    }
    if (data.headline !== undefined) {
      updates.push(`headline = $${paramCount++}`);
      values.push(data.headline);
    }
    if (data.role !== undefined) {
      updates.push(`role = $${paramCount++}`);
      values.push(data.role);
    }
    if (data.company !== undefined) {
      updates.push(`company = $${paramCount++}`);
      values.push(data.company);
    }
    if (data.bio !== undefined) {
      updates.push(`bio = $${paramCount++}`);
      values.push(data.bio);
    }
    if (data.voice_tone !== undefined) {
      updates.push(`voice_tone = $${paramCount++}`);
      values.push(data.voice_tone);
    }
    if (data.banned_words !== undefined) {
      updates.push(`banned_words = $${paramCount++}`);
      values.push(data.banned_words);
    }
    if (data.proof_points !== undefined) {
      updates.push(`proof_points = $${paramCount++}`);
      values.push(data.proof_points);
    }

    if (updates.length === 0) {
      return this.findByWorkspaceAndUser(workspaceId, userId);
    }

    updates.push('updated_at = NOW()');
    values.push(workspaceId, userId);

    const result = await this.pool.query(
      `UPDATE profiles SET ${updates.join(', ')} WHERE workspace_id = $${paramCount++} AND user_id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async delete(workspaceId: string, userId: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM profiles WHERE workspace_id = $1 AND user_id = $2',
      [workspaceId, userId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }
}
