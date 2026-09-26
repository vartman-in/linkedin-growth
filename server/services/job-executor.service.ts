/**
 * Background Job Executor
 * Executes scheduled intelligence jobs
 */

import { Pool } from 'pg';
import { ClosedLoopRepository } from '../repositories/closed-loop.repository';
import { EnhancedLearningService } from './intelligence/enhanced-learning.service';
import { GrowthIntelligenceService } from './intelligence/growth-intelligence.service';
import { JobType, JobStatus } from '../models/types';

export class JobExecutor {
  private closedLoopRepo: ClosedLoopRepository;
  private learningService: EnhancedLearningService;
  private intelligenceService: GrowthIntelligenceService;

  constructor(private pool: Pool) {
    this.closedLoopRepo = new ClosedLoopRepository(pool);
    this.learningService = new EnhancedLearningService(pool);
    this.intelligenceService = new GrowthIntelligenceService(pool);
  }

  /**
   * Execute a specific job
   */
  async executeJob(jobId: string): Promise<void> {
    const job = await this.closedLoopRepo.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.status !== 'PENDING') {
      throw new Error(`Job ${jobId} is not in PENDING status`);
    }

    // Update job status to RUNNING
    await this.closedLoopRepo.updateJobStatus(jobId, 'RUNNING');

    try {
      let result: any;

      switch (job.job_type) {
        case 'learning_recalc':
          result = await this.executeLearningRecalc(job.workspace_id);
          break;
        case 'trend_recalc':
          result = await this.executeTrendRecalc(job.workspace_id);
          break;
        case 'opportunity_recalc':
          result = await this.executeOpportunityRecalc(job.workspace_id);
          break;
        case 'source_refresh':
          result = await this.executeSourceRefresh(job.workspace_id);
          break;
        case 'analytics_aggregate':
          result = await this.executeAnalyticsAggregate(job.workspace_id);
          break;
        default:
          throw new Error(`Unknown job type: ${job.job_type}`);
      }

      // Update job status to COMPLETED
      await this.closedLoopRepo.updateJobStatus(jobId, 'COMPLETED', undefined, result);
    } catch (error) {
      // Update job status to FAILED
      await this.closedLoopRepo.updateJobStatus(
        jobId,
        'FAILED',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  /**
   * Execute learning recalculation job
   */
  private async executeLearningRecalc(workspaceId: string): Promise<any> {
    // Detect patterns from feedback and performance data
    const patterns = await this.learningService.detectAllPatterns(workspaceId);
    
    // Generate insights from patterns
    const insights = await this.learningService.generateInsights(workspaceId);
    
    // Expire old patterns
    const expiredCount = await this.learningService.expireOldPatterns(workspaceId);

    return {
      patternsDetected: patterns.length,
      insightsGenerated: insights.length,
      patternsExpired: expiredCount,
    };
  }

  /**
   * Execute trend recalculation job
   */
  private async executeTrendRecalc(workspaceId: string): Promise<any> {
    const trends = await this.intelligenceService.getTrendSignalService().detectTrends(workspaceId);
    
    return {
      trendsDetected: trends.length,
    };
  }

  /**
   * Execute opportunity recalculation job
   */
  private async executeOpportunityRecalc(workspaceId: string): Promise<any> {
    const opportunities = await this.intelligenceService.getContentOpportunityService().generateOpportunities(workspaceId);
    
    return {
      opportunitiesGenerated: opportunities.length,
    };
  }

  /**
   * Execute source refresh job
   */
  private async executeSourceRefresh(workspaceId: string): Promise<any> {
    // Get all sources that need refreshing
    const sources = await this.intelligenceService.getRepository().getSourcesByWorkspace(workspaceId, 100);
    
    let refreshed = 0;
    let failed = 0;

    for (const source of sources) {
      try {
        // Re-fetch and process the source
        await this.intelligenceService.getSourceIngestionService().ingestSource(workspaceId, source.url);
        refreshed++;
      } catch (error) {
        failed++;
        console.error(`Failed to refresh source ${source.id}:`, error);
      }
    }

    return {
      sourcesRefreshed: refreshed,
      sourcesFailed: failed,
    };
  }

  /**
   * Execute analytics aggregation job
   */
  private async executeAnalyticsAggregate(workspaceId: string): Promise<any> {
    // Aggregate performance metrics
    const performance = await this.closedLoopRepo.getRecentPerformance(workspaceId, 1000);
    
    // Calculate aggregate metrics
    const totalContent = performance.length;
    const platforms = new Set(performance.map(p => p.platform));
    
    return {
      totalContentAnalyzed: totalContent,
      platformsAnalyzed: platforms.size,
    };
  }

  /**
   * Process all pending jobs for a workspace
   */
  async processPendingJobs(workspaceId?: string): Promise<{
    processed: number;
    failed: number;
  }> {
    const pendingJobs = await this.closedLoopRepo.getPendingJobs(workspaceId);
    
    let processed = 0;
    let failed = 0;

    for (const job of pendingJobs) {
      try {
        await this.executeJob(job.id);
        processed++;
      } catch (error) {
        failed++;
        console.error(`Failed to execute job ${job.id}:`, error);
      }
    }

    return { processed, failed };
  }

  /**
   * Schedule a recurring job
   */
  async scheduleRecurringJob(
    workspaceId: string,
    jobType: JobType,
    intervalHours: number
  ): Promise<void> {
    const scheduledAt = new Date(Date.now() + intervalHours * 60 * 60 * 1000);
    await this.closedLoopRepo.createJob(workspaceId, jobType, scheduledAt);
  }
}
