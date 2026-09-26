import { Router, Request, Response, NextFunction } from 'express';
import { ContentIdeaRepository } from '../repositories/content-idea.repository';
import { ContentDraftRepository } from '../repositories/content-draft.repository';
import { getPool } from '../config/database';
import { validate } from '../middleware/validation.middleware';
import { createContentIdeaSchema, updateContentIdeaSchema, createContentDraftSchema, updateContentDraftSchema, uuidParamSchema } from '../middleware/validation.middleware';
import { authenticateAndSetWorkspace, requireWorkspaceAccess } from '../middleware/workspace.middleware';
import { NotFoundError } from '../middleware/error.middleware';

const router = Router();
const pool = getPool();
const ideaRepo = new ContentIdeaRepository(pool);
const draftRepo = new ContentDraftRepository(pool);

// Apply secure authentication to all routes
router.use(authenticateAndSetWorkspace);
router.use(requireWorkspaceAccess);

// ============ IDEAS ============

/**
 * @route GET /api/v1/content/ideas
 * @desc Get all content ideas in workspace
 * @access Workspace members
 */
router.get('/ideas', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as any;
    const ideas = await ideaRepo.findByWorkspace(req.workspaceId!, status);
    res.json(ideas);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/content/ideas/:id
 * @desc Get content idea by ID
 * @access Workspace members
 */
router.get('/ideas/:id', validateParams(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idea = await ideaRepo.findById(req.workspaceId!, req.params.id as string);
    if (!idea) {
      throw new NotFoundError('Content idea not found');
    }
    res.json(idea);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/content/ideas
 * @desc Create a new content idea
 * @access Workspace members
 */
router.post('/ideas', validate(createContentIdeaSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idea = await ideaRepo.create(req.workspaceId!, req.body.title, {
      source_reference: req.body.sourceReference,
      pillar: req.body.pillar,
      audience: req.body.audience,
      angle: req.body.angle,
      status: req.body.status,
    });
    res.status(201).json(idea);
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/v1/content/ideas/:id
 * @desc Update content idea
 * @access Workspace members
 */
router.put('/ideas/:id', validateParams(uuidParamSchema), validate(updateContentIdeaSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idea = await ideaRepo.update(req.workspaceId!, req.params.id as string, {
      title: req.body.title,
      source_reference: req.body.sourceReference,
      pillar: req.body.pillar,
      audience: req.body.audience,
      angle: req.body.angle,
      status: req.body.status,
    });
    if (!idea) {
      throw new NotFoundError('Content idea not found');
    }
    res.json(idea);
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/v1/content/ideas/:id
 * @desc Delete content idea
 * @access Workspace members
 */
router.delete('/ideas/:id', validateParams(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await ideaRepo.delete(req.workspaceId!, req.params.id as string);
    if (!deleted) {
      throw new NotFoundError('Content idea not found');
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// ============ DRAFTS ============

/**
 * @route GET /api/v1/content/drafts
 * @desc Get all content drafts in workspace
 * @access Workspace members
 */
router.get('/drafts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as any;
    const drafts = await draftRepo.findByWorkspace(req.workspaceId!, status);
    res.json(drafts);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/content/drafts/:id
 * @desc Get content draft by ID
 * @access Workspace members
 */
router.get('/drafts/:id', validateParams(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const draft = await draftRepo.findById(req.workspaceId!, req.params.id as string);
    if (!draft) {
      throw new NotFoundError('Content draft not found');
    }
    res.json(draft);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/content/drafts
 * @desc Create a new content draft
 * @access Workspace members
 */
router.post('/drafts', validate(createContentDraftSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const draft = await draftRepo.create(
      req.workspaceId!,
      req.body.title,
      req.body.body,
      req.body.contentType,
      {
        idea_id: req.body.ideaId,
        status: req.body.status,
        version: req.body.version,
      }
    );
    res.status(201).json(draft);
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/v1/content/drafts/:id
 * @desc Update content draft
 * @access Workspace members
 */
router.put('/drafts/:id', validateParams(uuidParamSchema), validate(updateContentDraftSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const draft = await draftRepo.update(req.workspaceId!, req.params.id as string, {
      idea_id: req.body.ideaId,
      title: req.body.title,
      body: req.body.body,
      content_type: req.body.contentType,
      status: req.body.status,
      version: req.body.version,
    });
    if (!draft) {
      throw new NotFoundError('Content draft not found');
    }
    res.json(draft);
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/v1/content/drafts/:id
 * @desc Delete content draft
 * @access Workspace members
 */
router.delete('/drafts/:id', validateParams(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await draftRepo.delete(req.workspaceId!, req.params.id as string);
    if (!deleted) {
      throw new NotFoundError('Content draft not found');
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
