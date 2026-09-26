/**
 * Intelligence Engine API Routes
 * New comprehensive API for the Growth Intelligence Engine
 */

import { Router, Request, Response, NextFunction } from 'express';
import { GrowthIntelligenceService } from '../services/intelligence/growth-intelligence.service';
import { getPool } from '../config/database';
import { authenticateAndSetWorkspace, requireWorkspaceAccess } from '../middleware/workspace.middleware';
import { validate } from '../middleware/validation.middleware';
import { z } from 'zod';
import { NotFoundError } from '../middleware/error.middleware';

const router = Router();
const pool = getPool();
const intelligenceService = new GrowthIntelligenceService(pool);

// Apply authentication to all routes
router.use(authenticateAndSetWorkspace);
router.use(requireWorkspaceAccess);

// Validation schemas
const ingestSourceSchema = z.object({
  url: z.string().url(),
});

const batchIngestSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(50),
});

// ============ SOURCE MANAGEMENT ============

/**
 * @route POST /api/v1/intelligence-engine/sources/ingest
 * @desc Ingest a single source URL
 */
router.post('/sources/ingest', validate(ingestSourceSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const source = await intelligenceService.getSourceIngestionService().ingestSource(
      req.workspaceId!,
      req.body.url
    );
    res.status(201).json(source);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/intelligence-engine/sources/batch-ingest
 * @desc Ingest multiple source URLs
 */
router.post('/sources/batch-ingest', validate(batchIngestSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await intelligenceService.getSourceIngestionService().batchIngest(
      req.workspaceId!,
      req.body.urls
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/intelligence-engine/sources
 * @desc List all sources for workspace
 */
router.get('/sources', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const sources = await intelligenceService.getRepository().getSourcesByWorkspace(
      req.workspaceId!,
      limit,
      offset
    );
    res.json(sources);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/intelligence-engine/sources/:id
 * @desc Get source details with full analysis
 */
router.get('/sources/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const details = await intelligenceService.getSourceDetails(req.workspaceId!, req.params.id);
    res.json(details);
  } catch (error) {
    if (error instanceof Error && error.message === 'Source not found') {
      throw new NotFoundError('Source not found');
    }
    next(error);
  }
});

/**
 * @route POST /api/v1/intelligence-engine/sources/:id/process
 * @desc Process a source (normalize, understand, extract claims/topics)
 */
router.post('/sources/:id/process', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const source = await intelligenceService.getRepository().getSource(req.workspaceId!, req.params.id);
    if (!source) {
      throw new NotFoundError('Source not found');
    }

    // Normalize
    const document = await intelligenceService.getSourceNormalizationService().normalizeSource(
      req.workspaceId!,
      source
    );

    // Understand
    const analysis = await intelligenceService.getSourceUnderstandingService().analyzeSource(
      req.workspaceId!,
      source.id,
      document.id
    );

    res.json({
      document,
      understanding: analysis.understanding,
      claims: analysis.claims,
      topics: analysis.topics.map(t => t.topic),
    });
  } catch (error) {
    next(error);
  }
});

// ============ TOPICS ============

/**
 * @route GET /api/v1/intelligence-engine/topics
 * @desc List all topics for workspace
 */
router.get('/topics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const topics = await intelligenceService.getRepository().getTopicsByWorkspace(
      req.workspaceId!,
      limit
    );
    res.json(topics);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/intelligence-engine/topics/:id
 * @desc Get topic details
 */
router.get('/topics/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const topic = await intelligenceService.getRepository().getTopic(req.workspaceId!, req.params.id);
    if (!topic) {
      throw new NotFoundError('Topic not found');
    }

    const mentions = await intelligenceService.getRepository().getMentionsByTopic(
      req.workspaceId!,
      topic.id
    );
    const trends = await intelligenceService.getRepository().getTrendSignalsByTopic(
      req.workspaceId!,
      topic.id
    );
    const gaps = await intelligenceService.getRepository().getGapsByTopic(
      req.workspaceId!,
      topic.id
    );

    res.json({ topic, mentions, trends, gaps });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/intelligence-engine/topics/cluster
 * @desc Cluster topics
 */
router.post('/topics/cluster', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clusters = await intelligenceService.getTopicClusteringService().clusterTopics(req.workspaceId!);
    res.json(clusters);
  } catch (error) {
    next(error);
  }
});

// ============ TRENDS ============

/**
 * @route GET /api/v1/intelligence-engine/trends
 * @desc List trend signals
 */
router.get('/trends', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const trends = await intelligenceService.getRepository().getTrendSignalsByWorkspace(
      req.workspaceId!,
      limit
    );
    res.json(trends);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/intelligence-engine/trends/detect
 * @desc Detect trends for all topics
 */
router.post('/trends/detect', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trends = await intelligenceService.getTrendSignalService().detectTrends(req.workspaceId!);
    res.json(trends);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/intelligence-engine/trends/trending
 * @desc Get trending topics
 */
router.get('/trends/trending', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trending = await intelligenceService.getTrendSignalService().getTrendingTopics(req.workspaceId!);
    res.json(trending);
  } catch (error) {
    next(error);
  }
});

// ============ OPPORTUNITIES ============

/**
 * @route GET /api/v1/intelligence-engine/opportunities
 * @desc List content opportunities
 */
router.get('/opportunities', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const opportunities = await intelligenceService.getRepository().getOpportunitiesByWorkspace(
      req.workspaceId!,
      status,
      limit
    );
    res.json(opportunities);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/intelligence-engine/opportunities/:id
 * @desc Get opportunity details
 */
router.get('/opportunities/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const details = await intelligenceService.getOpportunityDetails(req.workspaceId!, req.params.id);
    res.json(details);
  } catch (error) {
    if (error instanceof Error && error.message === 'Opportunity not found') {
      throw new NotFoundError('Opportunity not found');
    }
    next(error);
  }
});

/**
 * @route POST /api/v1/intelligence-engine/opportunities/generate
 * @desc Generate opportunities from current intelligence
 */
router.post('/opportunities/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const opportunities = await intelligenceService.getContentOpportunityService().generateOpportunities(
      req.workspaceId!,
      req.body.profile,
      req.body.icp
    );
    res.json(opportunities);
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/v1/intelligence-engine/opportunities/:id/status
 * @desc Update opportunity status
 */
router.put('/opportunities/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const opportunity = await intelligenceService.getRepository().updateOpportunity(
      req.workspaceId!,
      req.params.id,
      { status }
    );
    if (!opportunity) {
      throw new NotFoundError('Opportunity not found');
    }
    res.json(opportunity);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/intelligence-engine/opportunities/:id/convert
 * @desc Convert opportunity to content idea
 */
router.post('/opportunities/:id/convert', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await intelligenceService.convertOpportunityToIdea(req.workspaceId!, req.params.id, req.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ============ GAPS ============

/**
 * @route GET /api/v1/intelligence-engine/gaps
 * @desc List content gaps
 */
router.get('/gaps', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const gaps = await intelligenceService.getRepository().getGapsByWorkspace(req.workspaceId!, limit);
    res.json(gaps);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/intelligence-engine/gaps/detect
 * @desc Detect content gaps
 */
router.post('/gaps/detect', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gaps = await intelligenceService.getContentGapService().detectGaps(req.workspaceId!);
    res.json(gaps);
  } catch (error) {
    next(error);
  }
});

// ============ SUMMARY ============

/**
 * @route GET /api/v1/intelligence-engine/summary
 * @desc Get intelligence summary
 */
router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await intelligenceService.getIntelligenceSummary(req.workspaceId!);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/intelligence-engine/process
 * @desc Full pipeline: ingest → normalize → understand → cluster → detect → generate
 */
router.post('/process', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url } = req.body;
    if (!url) {
      throw new Error('URL is required');
    }

    const result = await intelligenceService.processSource(
      req.workspaceId!,
      url,
      req.body.profile,
      req.body.icp
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/intelligence-engine/batch-process
 * @desc Batch process multiple sources
 */
router.post('/batch-process', validate(batchIngestSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await intelligenceService.batchProcessSources(
      req.workspaceId!,
      req.body.urls,
      req.body.profile,
      req.body.icp
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
