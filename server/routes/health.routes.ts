import { Router, Request, Response } from 'express';

const router = Router();

/**
 * @route GET /api/v1/health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

export default router;
