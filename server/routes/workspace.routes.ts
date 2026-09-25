import { Router, Request, Response, NextFunction } from 'express';
import { WorkspaceRepository, UserRepository, WorkspaceMemberRepository } from '../repositories/workspace.repository';
import { getPool } from '../config/database';
import { validate, validateParams } from '../middleware/validation.middleware';
import { createWorkspaceSchema, updateWorkspaceSchema, uuidParamSchema, addWorkspaceMemberSchema, updateWorkspaceMemberSchema } from '../middleware/validation.middleware';
import { authenticateAndSetWorkspace, requireWorkspaceAccess, requireOwner } from '../middleware/workspace.middleware';
import { NotFoundError, ForbiddenError } from '../middleware/error.middleware';
import { AuthService } from '../services/auth.service';

const router = Router();
const pool = getPool();
const workspaceRepo = new WorkspaceRepository(pool);
const userRepo = new UserRepository(pool);
const memberRepo = new WorkspaceMemberRepository(pool);
const authService = new AuthService(pool);

// Apply secure authentication to all workspace routes
router.use(authenticateAndSetWorkspace);

/**
 * @route GET /api/v1/workspaces
 * @desc Get workspaces the authenticated user has access to
 * @access Authenticated users
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only return workspaces the user has access to
    const workspaces = await authService.getUserWorkspaces(req.userId!);
    res.json(workspaces);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/workspaces
 * @desc Create a new workspace and add the authenticated user as owner
 * @access Authenticated users
 */
router.post('/', validate(createWorkspaceSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspace = await workspaceRepo.create(req.body.name);
    
    // Add the creating user as an OWNER of the new workspace
    await memberRepo.addMember(workspace.id, req.userId!, 'OWNER');
    
    res.status(201).json(workspace);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/workspaces/:id
 * @desc Get workspace by ID (only if user has access)
 * @access Authenticated users with workspace access
 */
router.get('/:id', validateParams(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verify user has access to this workspace
    const hasAccess = await authService.hasWorkspaceAccess(req.userId!, req.params.id);
    if (!hasAccess) {
      throw new ForbiddenError('Access denied to workspace');
    }

    const workspace = await workspaceRepo.findById(req.params.id);
    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }
    res.json(workspace);
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/v1/workspaces/:id
 * @desc Update workspace (only for owners)
 * @access Authenticated workspace owners
 */
router.put('/:id', validateParams(uuidParamSchema), validate(updateWorkspaceSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verify user has access to this workspace
    const hasAccess = await authService.hasWorkspaceAccess(req.userId!, req.params.id);
    if (!hasAccess) {
      throw new ForbiddenError('Access denied to workspace');
    }

    // Verify user is an owner
    const role = await authService.getWorkspaceRole(req.userId!, req.params.id);
    if (role !== 'OWNER') {
      throw new ForbiddenError('Only workspace owners can update workspace settings');
    }

    const workspace = await workspaceRepo.update(req.params.id, req.body.name);
    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }
    res.json(workspace);
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/v1/workspaces/:id
 * @desc Delete workspace (only for owners)
 * @access Authenticated workspace owners
 */
router.delete('/:id', validateParams(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verify user has access to this workspace
    const hasAccess = await authService.hasWorkspaceAccess(req.userId!, req.params.id);
    if (!hasAccess) {
      throw new ForbiddenError('Access denied to workspace');
    }

    // Verify user is an owner
    const role = await authService.getWorkspaceRole(req.userId!, req.params.id);
    if (role !== 'OWNER') {
      throw new ForbiddenError('Only workspace owners can delete workspaces');
    }

    const deleted = await workspaceRepo.delete(req.params.id);
    if (!deleted) {
      throw new NotFoundError('Workspace not found');
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/workspaces/:id/members
 * @desc Add member to workspace (only for owners)
 * @access Authenticated workspace owners
 */
router.post('/:id/members', validateParams(uuidParamSchema), validate(addWorkspaceMemberSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verify user has access to this workspace
    const hasAccess = await authService.hasWorkspaceAccess(req.userId!, req.params.id);
    if (!hasAccess) {
      throw new ForbiddenError('Access denied to workspace');
    }

    // Verify user is an owner
    const role = await authService.getWorkspaceRole(req.userId!, req.params.id);
    if (role !== 'OWNER') {
      throw new ForbiddenError('Only workspace owners can add members');
    }

    const member = await memberRepo.addMember(req.params.id, req.body.userId, req.body.role);
    res.status(201).json(member);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/workspaces/:id/members
 * @desc Get workspace members (only if user has access)
 * @access Authenticated users with workspace access
 */
router.get('/:id/members', validateParams(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verify user has access to this workspace
    const hasAccess = await authService.hasWorkspaceAccess(req.userId!, req.params.id);
    if (!hasAccess) {
      throw new ForbiddenError('Access denied to workspace');
    }

    const members = await memberRepo.findByWorkspace(req.params.id);
    res.json(members);
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/v1/workspaces/:workspaceId/members/:userId
 * @desc Update member role (only for owners)
 * @access Authenticated workspace owners
 */
router.put('/:workspaceId/members/:userId', validate(updateWorkspaceMemberSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verify user has access to this workspace
    const hasAccess = await authService.hasWorkspaceAccess(req.userId!, req.params.workspaceId);
    if (!hasAccess) {
      throw new ForbiddenError('Access denied to workspace');
    }

    // Verify user is an owner
    const role = await authService.getWorkspaceRole(req.userId!, req.params.workspaceId);
    if (role !== 'OWNER') {
      throw new ForbiddenError('Only workspace owners can update member roles');
    }

    const member = await memberRepo.updateRole(req.params.workspaceId, req.params.userId, req.body.role);
    if (!member) {
      throw new NotFoundError('Member not found');
    }
    res.json(member);
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/v1/workspaces/:workspaceId/members/:userId
 * @desc Remove member from workspace (only for owners)
 * @access Authenticated workspace owners
 */
router.delete('/:workspaceId/members/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verify user has access to this workspace
    const hasAccess = await authService.hasWorkspaceAccess(req.userId!, req.params.workspaceId);
    if (!hasAccess) {
      throw new ForbiddenError('Access denied to workspace');
    }

    // Verify user is an owner
    const role = await authService.getWorkspaceRole(req.userId!, req.params.workspaceId);
    if (role !== 'OWNER') {
      throw new ForbiddenError('Only workspace owners can remove members');
    }

    const deleted = await memberRepo.removeMember(req.params.workspaceId, req.params.userId);
    if (!deleted) {
      throw new NotFoundError('Member not found');
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
