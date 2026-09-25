/**
 * Authentication Service
 * Handles user authentication with JWT tokens
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  workspaceId?: string;
}

export class AuthService {
  constructor(private pool: Pool) {}

  /**
   * Register a new user
   */
  async register(email: string, password: string, name: string): Promise<{ user: AuthUser; token: string }> {
    // Check if user exists
    const existing = await this.pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await this.pool.query(
      `INSERT INTO users (email, name, password_hash) 
       VALUES ($1, $2, $3) 
       RETURNING id, email, name`,
      [email, name, hashedPassword]
    );

    const user = result.rows[0];

    // Generate token
    const token = this.generateToken(user.id, user.email);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      token
    };
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
    // Find user
    const result = await this.pool.query(
      'SELECT id, email, name, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = result.rows[0];

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new Error('Invalid email or password');
    }

    // Generate token
    const token = this.generateToken(user.id, user.email);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      token
    };
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): JWTPayload {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
      return payload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken(userId: string, email: string): string {
    return jwt.sign(
      { userId, email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  /**
   * Get user's workspaces
   */
  async getUserWorkspaces(userId: string): Promise<Array<{ id: string; name: string; role: string }>> {
    const result = await this.pool.query(
      `SELECT w.id, w.name, wm.role 
       FROM workspaces w
       JOIN workspace_members wm ON wm.workspace_id = w.id
       WHERE wm.user_id = $1`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Check if user has access to workspace
   */
  async hasWorkspaceAccess(userId: string, workspaceId: string): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT id FROM workspace_members 
       WHERE user_id = $1 AND workspace_id = $2`,
      [userId, workspaceId]
    );

    return result.rows.length > 0;
  }

  /**
   * Get user's role in workspace
   */
  async getWorkspaceRole(userId: string, workspaceId: string): Promise<string | null> {
    const result = await this.pool.query(
      `SELECT role FROM workspace_members 
       WHERE user_id = $1 AND workspace_id = $2`,
      [userId, workspaceId]
    );

    return result.rows[0]?.role || null;
  }
}
