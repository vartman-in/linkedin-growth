/**
 * Content Ideas Routes
 * Handles content idea creation, research, and AI-powered generation
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ContentIdeasService } from '../services/content-ideas.service';
import { getPool } from '../config/database';
import { validate } from '../middleware/validation.middleware';
import { createContentIdeaSchema, updateContentIdeaSchema, uuidParamSchema } from '../middleware/validation.middleware';
import { authenticateAndSetWorkspace, requireWorkspaceAccess } from '../middleware/workspace.middleware';
import { NotFoundError } from '../middleware/error.middleware';

const router = Router();
const pool = getPool();
const contentIdeasService = new ContentIdeasService(pool);

// Apply secure authentication to all routes
router.use(authenticateAndSetWorkspace);
router.use(requireWorkspaceAccess);

/**
 * @route GET /api/v1/content/ideas
 * @desc Get all content ideas in workspace
 */
router.get('/ideas', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string;
    const ideas = await contentIdeasService.getIdeas(req.workspaceId!, status);
    res.json(ideas);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/content/ideas/:id
 * @desc Get content idea by ID
 */
router.get('/ideas/:id', validate(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idea = await contentIdeasService.getIdea(req.workspaceId!, req.params.id as string);
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
 */
router.post('/ideas', validate(createContentIdeaSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idea = await contentIdeasService.createIdea(req.workspaceId!, {
      title: req.body.title,
      source_reference: req.body.sourceReference,
      pillar: req.body.pillar,
      audience: req.body.audience,
      angle: req.body.angle
    });
    res.status(201).json(idea);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/content/ideas/:id/generate
 * @desc Generate AI-powered draft from idea
 */
router.post('/ideas/:id/generate', validate(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const context = {
      workspaceId: req.workspaceId!,
      userId: req.userId,
      profile: req.body.profile,
      voice: req.body.voice,
      icp: req.body.icp
    };
    
    const draft = await contentIdeasService.generateDraft(req.workspaceId!, req.params.id as string, context);
    res.status(201).json(draft);
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/v1/content/ideas/:id
 * @desc Update content idea
 */
router.put('/ideas/:id', validate(uuidParamSchema), validate(updateContentIdeaSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idea = await contentIdeasService.updateIdea(req.workspaceId!, req.params.id as string, {
      title: req.body.title,
      source_reference: req.body.sourceReference,
      pillar: req.body.pillar,
      audience: req.body.audience,
      angle: req.body.angle,
      status: req.body.status
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
 */
router.delete('/ideas/:id', validate(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await contentIdeasService.deleteIdea(req.workspaceId!, req.params.id as string);
    if (!deleted) {
      throw new NotFoundError('Content idea not found');
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/content/drafts
 * @desc Get all content drafts in workspace
 */
router.get('/drafts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string;
    const drafts = await contentIdeasService.getDrafts(req.workspaceId!, status);
    res.json(drafts);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/content/drafts/:id
 * @desc Get content draft by ID
 */
router.get('/drafts/:id', validate(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const draft = await contentIdeasService.getDraft(req.workspaceId!, req.params.id as string);
    if (!draft) {
      throw new NotFoundError('Content draft not found');
    }
    res.json(draft);
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/v1/content/drafts/:id
 * @desc Update content draft
 */
router.put('/drafts/:id', validate(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const draft = await contentIdeasService.updateDraft(req.workspaceId!, req.params.id as string, {
      title: req.body.title,
      body: req.body.body,
      content_type: req.body.contentType,
      status: req.body.status,
      version: req.body.version
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
 * @route POST /api/v1/content/drafts/:id/approve
 * @desc Approve content draft
 */
router.post('/drafts/:id/approve', validate(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const draft = await contentIdeasService.approveDraft(req.workspaceId!, req.params.id as string, req.userId);
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
 */
router.delete('/drafts/:id', validate(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await contentIdeasService.deleteDraft(req.workspaceId!, req.params.id);
    if (!deleted) {
      throw new NotFoundError('Content draft not found');
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
