import { Router, Request, Response, NextFunction } from 'express';
import { LeadRepository } from '../repositories/lead.repository';
import { getPool } from '../config/database';
import { validate, validateParams } from '../middleware/validation.middleware';
import { createLeadSchema, updateLeadSchema, uuidParamSchema } from '../middleware/validation.middleware';
import { authenticateAndSetWorkspace, requireWorkspaceAccess } from '../middleware/workspace.middleware';
import { NotFoundError } from '../middleware/error.middleware';

const router = Router();
const pool = getPool();
const leadRepo = new LeadRepository(pool);

// Apply secure authentication to all routes
router.use(authenticateAndSetWorkspace);
router.use(requireWorkspaceAccess);

/**
 * @route GET /api/v1/leads
 * @desc Get all leads in workspace
 * @access Workspace members
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as any;
    const leads = await leadRepo.findByWorkspace(req.workspaceId!, status);
    res.json(leads);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/leads/:id
 * @desc Get lead by ID
 * @access Workspace members
 */
router.get('/:id', validateParams(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lead = await leadRepo.findById(req.workspaceId!, req.params.id);
    if (!lead) {
      throw new NotFoundError('Lead not found');
    }
    res.json(lead);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/leads
 * @desc Create a new lead
 * @access Workspace members
 */
router.post('/', validate(createLeadSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lead = await leadRepo.create(req.workspaceId!, req.body.name, {
      profile_url: req.body.profileUrl,
      company: req.body.company,
      title: req.body.title,
      status: req.body.status,
      source: req.body.source,
    });
    res.status(201).json(lead);
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/v1/leads/:id
 * @desc Update lead
 * @access Workspace members
 */
router.put('/:id', validateParams(uuidParamSchema), validate(updateLeadSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lead = await leadRepo.update(req.workspaceId!, req.params.id, {
      name: req.body.name,
      profile_url: req.body.profileUrl,
      company: req.body.company,
      title: req.body.title,
      status: req.body.status,
      source: req.body.source,
    });
    if (!lead) {
      throw new NotFoundError('Lead not found');
    }
    res.json(lead);
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/v1/leads/:id
 * @desc Delete lead
 * @access Workspace members
 */
router.delete('/:id', validateParams(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await leadRepo.delete(req.workspaceId!, req.params.id);
    if (!deleted) {
      throw new NotFoundError('Lead not found');
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
