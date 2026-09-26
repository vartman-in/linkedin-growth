/**
 * Closed-Loop Intelligence API Routes
 * Handles feedback recording, performance tracking, pattern detection, and insights
 */

import { Router, Request, Response, NextFunction } from 'express';
import { IntelligenceFeedbackService } from '../services/intelligence/feedback.service';
import { EnhancedLearningService } from '../services/intelligence/enhanced-learning.service';
import { ClosedLoopRepository } from '../repositories/closed-loop.repository';
import { getPool } from '../config/database';
import { authenticateAndSetWorkspace, requireWorkspaceAccess } from '../middleware/workspace.middleware';
import { validate } from '../middleware/validation.middleware';
import { z } from 'zod';
import { NotFoundError } from '../middleware/error.middleware';

const router = Router();
const pool = getPool();
const feedbackService = new IntelligenceFeedbackService(pool);
const learningService = new EnhancedLearningService(pool);
const closedLoopRepo = new ClosedLoopRepository(pool);

// Apply authentication to all routes
router.use(authenticateAndSetWorkspace);
router.use(requireWorkspaceAccess);

// Validation schemas
const feedbackSchema = z.object({
  entityType: z.enum(['opportunity', 'idea', 'draft', 'content', 'topic']),
  entityId: z.string().uuid(),
  feedbackType: z.enum(['accepted', 'dismissed', 'edited', 'converted', 'published', 'rejected']),
  feedbackData: z.record(z.any()).optional(),
});

const performanceSchema = z.object({
  contentId: z.string().uuid(),
  platform: z.string(),
  publishedAt: z.string().datetime(),
  metrics: z.record(z.number()),
  provenance: z.enum(['VERIFIED_PLATFORM', 'USER_ENTERED', 'IMPORTED', 'SYSTEM_CALCULATED']),
  sourceReference: z.string().optional(),
});

const jobSchema = z.object({
  jobType: z.enum(['source_refresh', 'trend_recalc', 'opportunity_recalc', 'learning_recalc', 'analytics_aggregate']),
  scheduledAt: z.string().datetime(),
});

// ============ FEEDBACK ENDPOINTS ============

/**
 * @route POST /api/v1/closed-loop/feedback
 * @desc Record user feedback
 */
router.post('/feedback', validate(feedbackSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { entityType, entityId, feedbackType, feedbackData } = req.body;
    
    // Use appropriate method based on feedback type
    let feedback;
    switch (feedbackType) {
      case 'accepted':
        if (entityType === 'opportunity') {
          await feedbackService.recordOpportunityAccepted(req.workspaceId!, entityId, req.userId);
        } else if (entityType === 'idea') {
          await feedbackService.recordIdeaAccepted(req.workspaceId!, entityId, req.userId);
        } else if (entityType === 'draft') {
          await feedbackService.recordDraftApproved(req.workspaceId!, entityId, req.userId);
        }
        break;
      case 'dismissed':
        if (entityType === 'opportunity') {
          await feedbackService.recordOpportunityDismissed(req.workspaceId!, entityId, req.userId, feedbackData?.reason);
        } else if (entityType === 'idea') {
          await feedbackService.recordIdeaRejected(req.workspaceId!, entityId, req.userId, feedbackData?.reason);
        }
        break;
      case 'edited':
        if (entityType === 'opportunity') {
          await feedbackService.recordOpportunityEdited(req.workspaceId!, entityId, feedbackData?.edits || {}, req.userId);
        } else if (entityType === 'draft') {
          await feedbackService.recordDraftEdited(req.workspaceId!, entityId, feedbackData?.edits || {}, req.userId);
        }
        break;
      case 'converted':
        if (entityType === 'opportunity') {
          await feedbackService.recordOpportunityConverted(req.workspaceId!, entityId, feedbackData?.contentIdeaId, req.userId);
        }
        break;
      case 'published':
        if (entityType === 'content') {
          await feedbackService.recordContentPublished(req.workspaceId!, entityId, feedbackData?.platform || 'unknown', req.userId);
        }
        break;
      case 'rejected':
        if (entityType === 'draft') {
          await feedbackService.recordDraftBlocked(req.workspaceId!, entityId, feedbackData?.qualityIssues || [], req.userId);
        }
        break;
    }
    
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/closed-loop/feedback
 * @desc Get feedback summary
 */
router.get('/feedback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await feedbackService.getFeedbackSummary(req.workspaceId!);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/closed-loop/feedback/recent
 * @desc Get recent feedback
 */
router.get('/feedback/recent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const feedback = await closedLoopRepo.getRecentFeedback(req.workspaceId!, limit);
    res.json(feedback);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/closed-loop/feedback/:entityType/:entityId
 * @desc Get feedback for specific entity
 */
router.get('/feedback/:entityType/:entityId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const feedback = await feedbackService.getEntityFeedback(
      req.workspaceId!,
      req.params.entityType as any,
      req.params.entityId as string
    );
    res.json(feedback);
  } catch (error) {
    next(error);
  }
});

// ============ PERFORMANCE ENDPOINTS ============

/**
 * @route POST /api/v1/closed-loop/performance
 * @desc Record content performance
 */
router.post('/performance', validate(performanceSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contentId, platform, publishedAt, metrics, provenance, sourceReference } = req.body;
    
    const performance = await closedLoopRepo.recordPerformance(
      req.workspaceId!,
      contentId,
      platform,
      new Date(publishedAt),
      metrics,
      provenance,
      sourceReference
    );
    
    res.status(201).json(performance);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/closed-loop/performance
 * @desc Get recent performance
 */
router.get('/performance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const performance = await closedLoopRepo.getRecentPerformance(req.workspaceId!, limit);
    res.json(performance);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/closed-loop/performance/:contentId
 * @desc Get performance for specific content
 */
router.get('/performance/:contentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const performance = await closedLoopRepo.getPerformanceByContent(
      req.workspaceId!,
      req.params.contentId as string
    );
    res.json(performance);
  } catch (error) {
    next(error);
  }
});

// ============ PATTERN ENDPOINTS ============

/**
 * @route POST /api/v1/closed-loop/patterns/detect
 * @desc Trigger pattern detection
 */
router.post('/patterns/detect', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patterns = await learningService.detectAllPatterns(req.workspaceId!);
    res.json({ detected: patterns.length, patterns });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/closed-loop/patterns
 * @desc Get active patterns
 */
router.get('/patterns', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patternType = req.query.patternType as any;
    const patterns = await learningService.getPatterns(req.workspaceId!, patternType);
    res.json(patterns);
  } catch (error) {
    next(error);
  }
});

// ============ INSIGHT ENDPOINTS ============

/**
 * @route POST /api/v1/closed-loop/insights/generate
 * @desc Trigger insight generation
 */
router.post('/insights/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const insights = await learningService.generateInsights(req.workspaceId!);
    res.json({ generated: insights.length, insights });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/closed-loop/insights
 * @desc Get active insights
 */
router.get('/insights', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const insightType = req.query.insightType as any;
    const limit = parseInt(req.query.limit as string) || 50;
    const insights = await learningService.getInsights(req.workspaceId!, insightType, limit);
    res.json(insights);
  } catch (error) {
    next(error);
  }
});

// ============ JOB ENDPOINTS ============

/**
 * @route POST /api/v1/closed-loop/jobs/schedule
 * @desc Schedule background job
 */
router.post('/jobs/schedule', validate(jobSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobType, scheduledAt } = req.body;
    
    // Note: This creates a job record but doesn't execute it
    // Actual execution requires external scheduler
    const job = await closedLoopRepo.createJob(
      req.workspaceId!,
      jobType,
      new Date(scheduledAt)
    );
    
    res.status(201).json(job);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/closed-loop/jobs
 * @desc Get recent jobs
 */
router.get('/jobs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const jobs = await closedLoopRepo.getRecentJobs(req.workspaceId!, limit);
    res.json(jobs);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/closed-loop/jobs/execute
 * @desc Execute all pending jobs for workspace
 */
router.post('/jobs/execute', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { JobExecutor } = await import('../services/job-executor.service');
    const jobExecutor = new JobExecutor(pool);
    
    const result = await jobExecutor.processPendingJobs(req.workspaceId!);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/closed-loop/jobs/:id/execute
 * @desc Execute a specific job
 */
router.post('/jobs/:id/execute', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { JobExecutor } = await import('../services/job-executor.service');
    const jobExecutor = new JobExecutor(pool);
    
    await jobExecutor.executeJob(req.params.id as string);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
