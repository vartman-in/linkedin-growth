/**
 * Authentication Routes
 * Handles user registration, login, and workspace management
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { getPool } from '../config/database';
import { validate, registerSchema, loginSchema, createWorkspaceSchema } from '../middleware/validation.middleware';
import { authenticate, requireWorkspaceAccess } from '../middleware/auth.middleware';

const router = Router();
const pool = getPool();
const authService = new AuthService(pool);

/**
 * @route POST /api/v1/auth/register
 * @desc Register a new user
 */
router.post('/register', validate(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body;
    const result = await authService.register(email, password, name);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/auth/login
 * @desc Login user
 */
router.post('/login', validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/auth/me
 * @desc Get current user info
 */
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [req.user!.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/auth/workspaces
 * @desc Get user's workspaces
 */
router.get('/workspaces', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaces = await authService.getUserWorkspaces(req.user!.userId);
    res.json(workspaces);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/auth/workspaces
 * @desc Create a new workspace
 */
router.post('/workspaces', authenticate, validate(createWorkspaceSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    const userId = req.user!.userId;

    // Create workspace
    const workspaceResult = await pool.query(
      'INSERT INTO workspaces (name) VALUES ($1) RETURNING id, name, created_at',
      [name]
    );

    const workspace = workspaceResult.rows[0];

    // Add user as owner
    await pool.query(
      'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)',
      [workspace.id, userId, 'OWNER']
    );

    res.status(201).json(workspace);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/auth/workspaces/:workspaceId
 * @desc Get workspace details (with access check)
 */
router.get('/workspaces/:workspaceId', authenticate, requireWorkspaceAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      'SELECT id, name, created_at FROM workspaces WHERE id = $1',
      [req.params.workspaceId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
