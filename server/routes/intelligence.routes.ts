/**
 * Shared Intelligence Routes
 * Handles content-sales bridge and knowledge graph
 */

import { Router, Request, Response, NextFunction } from 'express';
import { SharedIntelligenceService } from '../services/shared-intelligence.service';
import { devWorkspaceContext, requireWorkspaceAccess } from '../middleware/workspace.middleware';

const router = Router();
const sharedIntelligenceService = new SharedIntelligenceService(null as any);

// Apply dev workspace context to all routes
router.use(devWorkspaceContext);
router.use(requireWorkspaceAccess);

/**
 * @route GET /api/v1/intelligence/content-insights
 * @desc Get content insights from sales data
 */
router.get('/content-insights', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const insights = await sharedIntelligenceService.getContentInsightsFromSales(req.workspaceId!);
    res.json(insights);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/intelligence/sales-insights
 * @desc Get sales insights from content performance
 */
router.get('/sales-insights', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const insights = await sharedIntelligenceService.getSalesInsightsFromContent(req.workspaceId!);
    res.json(insights);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/intelligence/knowledge-graph
 * @desc Get knowledge graph for workspace
 */
router.get('/knowledge-graph', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const graph = await sharedIntelligenceService.getKnowledgeGraph(req.workspaceId!);
    res.json(graph);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/intelligence/content-recommendations
 * @desc Get content recommendations based on sales intelligence
 */
router.get('/content-recommendations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recommendations = await sharedIntelligenceService.getContentRecommendations(req.workspaceId!);
    res.json(recommendations);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/intelligence/lead-recommendations
 * @desc Get lead recommendations based on content engagement
 */
router.get('/lead-recommendations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recommendations = await sharedIntelligenceService.getLeadRecommendations(req.workspaceId!);
    res.json(recommendations);
  } catch (error) {
    next(error);
  }
});

export default router;
