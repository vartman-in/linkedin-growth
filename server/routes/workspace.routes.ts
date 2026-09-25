import { Router, Request, Response, NextFunction } from 'express';
import { WorkspaceRepository, UserRepository, WorkspaceMemberRepository } from '../repositories/workspace.repository';
import { getPool } from '../config/database';
import { validate, validateParams } from '../middleware/validation.middleware';
import { createWorkspaceSchema, updateWorkspaceSchema, uuidParamSchema, addWorkspaceMemberSchema, updateWorkspaceMemberSchema } from '../middleware/validation.middleware';
import { devWorkspaceContext, requireWorkspaceAccess, requireOwner } from '../middleware/workspace.middleware';
import { NotFoundError } from '../middleware/error.middleware';

const router = Router();
const pool = getPool();
const workspaceRepo = new WorkspaceRepository(pool);
const userRepo = new UserRepository(pool);
const memberRepo = new WorkspaceMemberRepository(pool);

/**
 * @route GET /api/v1/workspaces
 * @desc Get all workspaces (for development/testing)
 * @access Public (dev only)
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaces = await workspaceRepo.findAll();
    res.json(workspaces);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/workspaces
 * @desc Create a new workspace
 * @access Public (dev only)
 */
router.post('/', validate(createWorkspaceSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspace = await workspaceRepo.create(req.body.name);
    res.status(201).json(workspace);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/workspaces/:id
 * @desc Get workspace by ID
 * @access Public (dev only)
 */
router.get('/:id', validateParams(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
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
 * @desc Update workspace
 * @access Public (dev only)
 */
router.put('/:id', validateParams(uuidParamSchema), validate(updateWorkspaceSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
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
 * @desc Delete workspace
 * @access Public (dev only)
 */
router.delete('/:id', validateParams(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
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
 * @desc Add member to workspace
 * @access Public (dev only)
 */
router.post('/:id/members', validateParams(uuidParamSchema), validate(addWorkspaceMemberSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const member = await memberRepo.addMember(req.params.id, req.body.userId, req.body.role);
    res.status(201).json(member);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/workspaces/:id/members
 * @desc Get workspace members
 * @access Public (dev only)
 */
router.get('/:id/members', validateParams(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const members = await memberRepo.findByWorkspace(req.params.id);
    res.json(members);
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/v1/workspaces/:workspaceId/members/:userId
 * @desc Update member role
 * @access Public (dev only)
 */
router.put('/:workspaceId/members/:userId', validate(updateWorkspaceMemberSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
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
 * @desc Remove member from workspace
 * @access Public (dev only)
 */
router.delete('/:workspaceId/members/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
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
