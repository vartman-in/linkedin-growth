import { Router, Request, Response, NextFunction } from 'express';
import { ProfileRepository } from '../repositories/profile.repository';
import { getPool } from '../config/database';
import { validate } from '../middleware/validation.middleware';
import { createProfileSchema, updateProfileSchema } from '../middleware/validation.middleware';
import { authenticateAndSetWorkspace, requireWorkspaceAccess } from '../middleware/workspace.middleware';
import { NotFoundError } from '../middleware/error.middleware';

const router = Router();
const pool = getPool();
const profileRepo = new ProfileRepository(pool);

// Apply secure authentication to all routes
router.use(authenticateAndSetWorkspace);
router.use(requireWorkspaceAccess);

/**
 * @route GET /api/v1/profiles
 * @desc Get all profiles in workspace
 * @access Workspace members
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profiles = await profileRepo.findByWorkspace(req.workspaceId!);
    res.json(profiles);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/profiles/me
 * @desc Get current user's profile
 * @access Workspace members
 */
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await profileRepo.findByWorkspaceAndUser(req.workspaceId!, req.userId!);
    if (!profile) {
      throw new NotFoundError('Profile not found');
    }
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/profiles
 * @desc Create a new profile
 * @access Workspace members
 */
router.post('/', validate(createProfileSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await profileRepo.create(req.workspaceId!, req.body.userId, {
      display_name: req.body.displayName,
      headline: req.body.headline,
      role: req.body.role,
      company: req.body.company,
      bio: req.body.bio,
      voice_tone: req.body.voiceTone,
      banned_words: req.body.bannedWords,
      proof_points: req.body.proofPoints,
    });
    res.status(201).json(profile);
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/v1/profiles/me
 * @desc Update current user's profile
 * @access Workspace members
 */
router.put('/me', validate(updateProfileSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await profileRepo.update(req.workspaceId!, req.userId!, {
      display_name: req.body.displayName,
      headline: req.body.headline,
      role: req.body.role,
      company: req.body.company,
      bio: req.body.bio,
      voice_tone: req.body.voiceTone,
      banned_words: req.body.bannedWords,
      proof_points: req.body.proofPoints,
    });
    if (!profile) {
      throw new NotFoundError('Profile not found');
    }
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/v1/profiles/me
 * @desc Delete current user's profile
 * @access Workspace members
 */
router.delete('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await profileRepo.delete(req.workspaceId!, req.userId!);
    if (!deleted) {
      throw new NotFoundError('Profile not found');
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
