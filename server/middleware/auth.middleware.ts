/**
 * Authentication Middleware
 * Validates JWT tokens and sets user context
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService, JWTPayload } from '../services/auth.service';
import { getPool } from '../config/database';
import { UnauthorizedError, ForbiddenError } from './error.middleware';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      workspaceId?: string;
      userRole?: string;
    }
  }
}

const pool = getPool();
const authService = new AuthService(pool);

/**
 * Authenticate request using JWT token
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authentication required');
  }

  const token = authHeader.substring(7);

  try {
    const payload = authService.verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

/**
 * Optional authentication (doesn't fail if no token)
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const payload = authService.verifyToken(token);
      req.user = payload;
    } catch (error) {
      // Ignore invalid tokens for optional auth
    }
  }

  next();
}

/**
 * Require workspace access
 * Must be used after authenticate middleware
 */
export async function requireWorkspaceAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const workspaceId = req.params.workspaceId || req.body.workspaceId || req.headers['x-workspace-id'];

  if (!workspaceId) {
    throw new ForbiddenError('Workspace ID required');
  }

  try {
    const hasAccess = await authService.hasWorkspaceAccess(req.user.userId, workspaceId);
    
    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to this workspace');
    }

    const role = await authService.getWorkspaceRole(req.user.userId, workspaceId);
    
    req.workspaceId = workspaceId;
    req.userRole = role;
    
    next();
  } catch (error) {
    if (error instanceof ForbiddenError) {
      throw error;
    }
    throw new ForbiddenError('Workspace access check failed');
  }
}

/**
 * Require owner role
 */
export function requireOwner(req: Request, res: Response, next: NextFunction): void {
  if (req.userRole !== 'OWNER') {
    throw new ForbiddenError('Owner role required');
  }
  next();
}

/**
 * Require at least member role
 */
export function requireMember(req: Request, res: Response, next: NextFunction): void {
  if (!req.userRole || (req.userRole !== 'OWNER' && req.userRole !== 'MEMBER')) {
    throw new ForbiddenError('Workspace membership required');
  }
  next();
}
