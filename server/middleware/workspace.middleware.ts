import { Request, Response, NextFunction } from 'express';
import { WorkspaceMemberRepository } from '../repositories/workspace.repository';
import { getPool } from '../config/database';
import { WorkspaceAccessError, UnauthorizedError, ForbiddenError } from './error.middleware';
import { AuthService } from '../services/auth.service';

// Extend Express Request type to include workspace context
declare global {
  namespace Express {
    interface Request {
      workspaceId?: string;
      userId?: string;
      userRole?: 'OWNER' | 'MEMBER';
      auth?: {
        userId: string;
        workspaceId: string;
        role: string;
      };
    }
  }
}

const pool = getPool();
const workspaceMemberRepo = new WorkspaceMemberRepository(pool);
const authService = new AuthService(pool);

/**
 * REMOVED: devWorkspaceContext has been removed for security.
 * All routes must use authenticateAndSetWorkspace instead.
 * This prevents any bypass of JWT authentication.
 */

/**
 * Secure authentication middleware that validates JWT and sets workspace context
 * This is the proper way to authenticate requests in production
 */
export async function authenticateAndSetWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // 1. Extract and validate JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication required');
    }

    const token = authHeader.substring(7);
    const payload = authService.verifyToken(token);

    // 2. Verify user exists
    const userResult = await pool.query(
      'SELECT id, email, name FROM users WHERE id = $1',
      [payload.userId]
    );

    if (userResult.rows.length === 0) {
      throw new UnauthorizedError('User not found');
    }

    const user = userResult.rows[0];

    // 3. Get user's authorized workspaces
    const workspaces = await authService.getUserWorkspaces(user.id);
    
    if (workspaces.length === 0) {
      throw new ForbiddenError('User has no workspace access');
    }
    
    // 4. Determine workspace from authenticated membership only
    // SECURITY: Never trust client-supplied workspace IDs for authorization
    // Use the first workspace if user has access to multiple
    // TODO: Implement workspace selection UI for users with multiple workspaces
    const workspaceId = workspaces[0].id;

    // 5. Verify user has access to this workspace (defense in depth)
    const hasAccess = await authService.hasWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) {
      throw new ForbiddenError('Access denied to workspace');
    }

    // 6. Get user's role in workspace
    const role = await authService.getWorkspaceRole(user.id, workspaceId);
    if (!role) {
      throw new ForbiddenError('No role assigned in workspace');
    }

    // 7. Set authenticated context
    req.userId = user.id;
    req.workspaceId = workspaceId;
    req.userRole = role;
    req.auth = {
      userId: user.id,
      workspaceId: workspaceId,
      role: role
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      next(error);
    } else {
      next(new UnauthorizedError('Authentication failed'));
    }
  }
}

/**
 * Middleware to verify workspace access.
 * Must be used after authentication middleware.
 * This performs an additional database check to ensure the user has access to the workspace.
 */
export async function requireWorkspaceAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.userId || !req.workspaceId) {
      throw new UnauthorizedError('Authentication context not set');
    }

    // Verify user has access to this workspace (defense in depth)
    const hasAccess = await authService.hasWorkspaceAccess(req.userId, req.workspaceId);
    
    if (!hasAccess) {
      throw new ForbiddenError('Access denied to workspace');
    }

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      next(error);
    } else {
      next(new UnauthorizedError('Workspace access verification failed'));
    }
  }
}

/**
 * Middleware to require OWNER role
 */
export function requireOwner(req: Request, res: Response, next: NextFunction): void {
  if (req.userRole !== 'OWNER') {
    throw new WorkspaceAccessError('Owner role required');
  }
  next();
}

/**
 * Middleware to require at least MEMBER role
 */
export function requireMember(req: Request, res: Response, next: NextFunction): void {
  if (!req.userRole || (req.userRole !== 'OWNER' && req.userRole !== 'MEMBER')) {
    throw new WorkspaceAccessError('Workspace membership required');
  }
  next();
}

/**
 * Helper to verify workspace isolation for a specific resource
 */
export async function verifyWorkspaceOwnership(
  workspaceId: string,
  resourceWorkspaceId: string
): Promise<void> {
  if (workspaceId !== resourceWorkspaceId) {
    throw new WorkspaceAccessError('Cannot access resources from another workspace');
  }
}
