import { Router, Request, Response, NextFunction } from 'express';
import { ICPRepository } from '../repositories/icp.repository';
import { getPool } from '../config/database';
import { validate, validateParams } from '../middleware/validation.middleware';
import { createICPSchema, updateICPSchema, uuidParamSchema } from '../middleware/validation.middleware';
import { devWorkspaceContext, requireWorkspaceAccess } from '../middleware/workspace.middleware';
import { NotFoundError } from '../middleware/error.middleware';

const router = Router();
const pool = getPool();
const icpRepo = new ICPRepository(pool);

// Apply dev workspace context to all routes
router.use(devWorkspaceContext);
router.use(requireWorkspaceAccess);

/**
 * @route GET /api/v1/icps
 * @desc Get all ICPs in workspace
 * @access Workspace members
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const icps = await icpRepo.findByWorkspace(req.workspaceId!);
    res.json(icps);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/icps/:id
 * @desc Get ICP by ID
 * @access Workspace members
 */
router.get('/:id', validateParams(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const icp = await icpRepo.findById(req.workspaceId!, req.params.id);
    if (!icp) {
      throw new NotFoundError('ICP not found');
    }
    res.json(icp);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/icps
 * @desc Create a new ICP
 * @access Workspace members
 */
router.post('/', validate(createICPSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const icp = await icpRepo.create(req.workspaceId!, req.body.name, {
      target_roles: req.body.targetRoles,
      industries: req.body.industries,
      company_sizes: req.body.companySizes,
      geography: req.body.geography,
      seniority: req.body.seniority,
      problems: req.body.problems,
      buying_signals: req.body.buyingSignals,
      exclusions: req.body.exclusions,
    });
    res.status(201).json(icp);
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/v1/icps/:id
 * @desc Update ICP
 * @access Workspace members
 */
router.put('/:id', validateParams(uuidParamSchema), validate(updateICPSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const icp = await icpRepo.update(req.workspaceId!, req.params.id, {
      name: req.body.name,
      target_roles: req.body.targetRoles,
      industries: req.body.industries,
      company_sizes: req.body.companySizes,
      geography: req.body.geography,
      seniority: req.body.seniority,
      problems: req.body.problems,
      buying_signals: req.body.buyingSignals,
      exclusions: req.body.exclusions,
    });
    if (!icp) {
      throw new NotFoundError('ICP not found');
    }
    res.json(icp);
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/v1/icps/:id
 * @desc Delete ICP
 * @access Workspace members
 */
router.delete('/:id', validateParams(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await icpRepo.delete(req.workspaceId!, req.params.id);
    if (!deleted) {
      throw new NotFoundError('ICP not found');
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
