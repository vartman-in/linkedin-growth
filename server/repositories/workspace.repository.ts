import { Pool } from 'pg';
import { Workspace, User, WorkspaceMember } from '../models/types';

export class WorkspaceRepository {
  constructor(private pool: Pool) {}

  async create(name: string): Promise<Workspace> {
    const result = await this.pool.query(
      'INSERT INTO workspaces (name) VALUES ($1) RETURNING *',
      [name]
    );
    return result.rows[0];
  }

  async findById(id: string): Promise<Workspace | null> {
    const result = await this.pool.query(
      'SELECT * FROM workspaces WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findAll(): Promise<Workspace[]> {
    const result = await this.pool.query('SELECT * FROM workspaces ORDER BY created_at DESC');
    return result.rows;
  }

  async update(id: string, name: string): Promise<Workspace | null> {
    const result = await this.pool.query(
      'UPDATE workspaces SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [name, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM workspaces WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export class UserRepository {
  constructor(private pool: Pool) {}

  async create(email: string, name: string): Promise<User> {
    const result = await this.pool.query(
      'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *',
      [email, name]
    );
    return result.rows[0];
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async findAll(): Promise<User[]> {
    const result = await this.pool.query('SELECT * FROM users ORDER BY created_at DESC');
    return result.rows;
  }
}

export class WorkspaceMemberRepository {
  constructor(private pool: Pool) {}

  async addMember(workspaceId: string, userId: string, role: 'OWNER' | 'MEMBER' = 'MEMBER'): Promise<WorkspaceMember> {
    const result = await this.pool.query(
      'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3) RETURNING *',
      [workspaceId, userId, role]
    );
    return result.rows[0];
  }

  async findByWorkspaceAndUser(workspaceId: string, userId: string): Promise<WorkspaceMember | null> {
    const result = await this.pool.query(
      'SELECT * FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
      [workspaceId, userId]
    );
    return result.rows[0] || null;
  }

  async findByWorkspace(workspaceId: string): Promise<WorkspaceMember[]> {
    const result = await this.pool.query(
      'SELECT * FROM workspace_members WHERE workspace_id = $1 ORDER BY created_at',
      [workspaceId]
    );
    return result.rows;
  }

  async findByUser(userId: string): Promise<WorkspaceMember[]> {
    const result = await this.pool.query(
      'SELECT * FROM workspace_members WHERE user_id = $1 ORDER BY created_at',
      [userId]
    );
    return result.rows;
  }

  async removeMember(workspaceId: string, userId: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
      [workspaceId, userId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  async updateRole(workspaceId: string, userId: string, role: 'OWNER' | 'MEMBER'): Promise<WorkspaceMember | null> {
    const result = await this.pool.query(
      'UPDATE workspace_members SET role = $3 WHERE workspace_id = $1 AND user_id = $2 RETURNING *',
      [workspaceId, userId, role]
    );
    return result.rows[0] || null;
  }
}
