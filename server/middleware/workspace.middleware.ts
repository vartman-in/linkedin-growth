import { Request, Response, NextFunction } from 'express';
import { WorkspaceMemberRepository } from '../repositories/workspace.repository';
import { getPool } from '../config/database';
import { WorkspaceAccessError, UnauthorizedError } from './error.middleware';

// Extend Express Request type to include workspace context
declare global {
  namespace Express {
    interface Request {
      workspaceId?: string;
      userId?: string;
      userRole?: 'OWNER' | 'MEMBER';
    }
  }
}

const pool = getPool();
const workspaceMemberRepo = new WorkspaceMemberRepository(pool);

/**
 * Development-only middleware that sets workspace context from environment variables.
 * This should NOT be used in production - replace with proper authentication.
 */
export function devWorkspaceContext(req: Request, res: Response, next: NextFunction): void {
  const devWorkspaceId = process.env.DEV_WORKSPACE_ID;
  const devUserId = process.env.DEV_USER_ID;

  if (!devWorkspaceId || !devUserId) {
    throw new UnauthorizedError('Development workspace context not configured');
  }

  req.workspaceId = devWorkspaceId;
  req.userId = devUserId;
  req.userRole = 'OWNER'; // Dev context is always owner for simplicity

  next();
}

/**
 * Middleware to verify workspace access.
 * Must be used after workspace context is set.
 */
export function requireWorkspaceAccess(req: Request, res: Response, next: NextFunction): void {
  if (!req.workspaceId || !req.userId) {
    throw new UnauthorizedError('Workspace context not set');
  }

  // In a real implementation, verify the user has access to this workspace
  // For now, we trust the context set by devWorkspaceContext or auth middleware
  next();
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
