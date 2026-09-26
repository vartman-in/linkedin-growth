/**
 * Intelligence Feedback Service
 * Records all user interactions with intelligence for closed-loop learning
 */

import { Pool } from 'pg';
import { ClosedLoopRepository } from '../../repositories/closed-loop.repository';
import { FeedbackEntityType, FeedbackType } from '../../models/types';

export class IntelligenceFeedbackService {
  private closedLoopRepo: ClosedLoopRepository;

  constructor(private pool: Pool) {
    this.closedLoopRepo = new ClosedLoopRepository(pool);
  }

  /**
   * Record opportunity accepted
   */
  async recordOpportunityAccepted(
    workspaceId: string,
    opportunityId: string,
    userId?: string
  ): Promise<void> {
    await this.closedLoopRepo.recordFeedback(
      workspaceId,
      'opportunity',
      opportunityId,
      'accepted',
      userId,
      {},
      'USER_ACTION'
    );
  }

  /**
   * Record opportunity dismissed
   */
  async recordOpportunityDismissed(
    workspaceId: string,
    opportunityId: string,
    userId?: string,
    reason?: string
  ): Promise<void> {
    await this.closedLoopRepo.recordFeedback(
      workspaceId,
      'opportunity',
      opportunityId,
      'dismissed',
      userId,
      { reason: reason || null },
      'USER_ACTION'
    );
  }

  /**
   * Record opportunity edited
   */
  async recordOpportunityEdited(
    workspaceId: string,
    opportunityId: string,
    edits: Record<string, any>,
    userId?: string
  ): Promise<void> {
    await this.closedLoopRepo.recordFeedback(
      workspaceId,
      'opportunity',
      opportunityId,
      'edited',
      userId,
      { edits },
      'USER_ACTION'
    );
  }

  /**
   * Record opportunity converted to content
   */
  async recordOpportunityConverted(
    workspaceId: string,
    opportunityId: string,
    contentIdeaId: string,
    userId?: string
  ): Promise<void> {
    await this.closedLoopRepo.recordFeedback(
      workspaceId,
      'opportunity',
      opportunityId,
      'converted',
      userId,
      { contentIdeaId },
      'USER_ACTION'
    );
  }

  /**
   * Record content idea accepted
   */
  async recordIdeaAccepted(
    workspaceId: string,
    ideaId: string,
    userId?: string
  ): Promise<void> {
    await this.closedLoopRepo.recordFeedback(
      workspaceId,
      'idea',
      ideaId,
      'accepted',
      userId,
      {},
      'USER_ACTION'
    );
  }

  /**
   * Record content idea rejected
   */
  async recordIdeaRejected(
    workspaceId: string,
    ideaId: string,
    userId?: string,
    reason?: string
  ): Promise<void> {
    await this.closedLoopRepo.recordFeedback(
      workspaceId,
      'idea',
      ideaId,
      'rejected',
      userId,
      { reason: reason || null },
      'USER_ACTION'
    );
  }

  /**
   * Record draft edited
   */
  async recordDraftEdited(
    workspaceId: string,
    draftId: string,
    edits: Record<string, any>,
    userId?: string
  ): Promise<void> {
    await this.closedLoopRepo.recordFeedback(
      workspaceId,
      'draft',
      draftId,
      'edited',
      userId,
      { edits },
      'USER_ACTION'
    );
  }

  /**
   * Record draft approved
   */
  async recordDraftApproved(
    workspaceId: string,
    draftId: string,
    userId?: string
  ): Promise<void> {
    await this.closedLoopRepo.recordFeedback(
      workspaceId,
      'draft',
      draftId,
      'accepted',
      userId,
      {},
      'USER_ACTION'
    );
  }

  /**
   * Record draft blocked by quality
   */
  async recordDraftBlocked(
    workspaceId: string,
    draftId: string,
    qualityIssues: any[],
    userId?: string
  ): Promise<void> {
    await this.closedLoopRepo.recordFeedback(
      workspaceId,
      'draft',
      draftId,
      'rejected',
      userId,
      { reason: 'quality_blocked', qualityIssues },
      'SYSTEM_DETECTED'
    );
  }

  /**
   * Record content published
   */
  async recordContentPublished(
    workspaceId: string,
    contentId: string,
    platform: string,
    userId?: string
  ): Promise<void> {
    await this.closedLoopRepo.recordFeedback(
      workspaceId,
      'content',
      contentId,
      'published',
      userId,
      { platform },
      'USER_ACTION'
    );
  }

  /**
   * Record content performance
   */
  async recordContentPerformance(
    workspaceId: string,
    contentId: string,
    platform: string,
    publishedAt: Date,
    metrics: Record<string, any>,
    provenance: 'VERIFIED_PLATFORM' | 'USER_ENTERED' | 'IMPORTED' | 'SYSTEM_CALCULATED',
    sourceReference?: string
  ): Promise<void> {
    await this.closedLoopRepo.recordPerformance(
      workspaceId,
      contentId,
      platform,
      publishedAt,
      metrics,
      provenance,
      sourceReference
    );

    // Also record as a learning signal
    await this.closedLoopRepo.recordFeedback(
      workspaceId,
      'content',
      contentId,
      'accepted', // Performance is positive feedback
      undefined,
      { metrics, platform, provenance },
      'SYSTEM_DETECTED'
    );
  }

  /**
   * Get feedback summary for a workspace
   */
  async getFeedbackSummary(workspaceId: string): Promise<{
    totalFeedback: number;
    byType: Record<FeedbackType, number>;
    byEntity: Record<FeedbackEntityType, number>;
    recentFeedback: any[];
  }> {
    const recentFeedback = await this.closedLoopRepo.getRecentFeedback(workspaceId, 100);
    
    const byType: Record<FeedbackType, number> = {
      accepted: 0,
      dismissed: 0,
      edited: 0,
      converted: 0,
      published: 0,
      rejected: 0
    };

    const byEntity: Record<FeedbackEntityType, number> = {
      opportunity: 0,
      idea: 0,
      draft: 0,
      content: 0,
      topic: 0
    };

    for (const feedback of recentFeedback) {
      byType[feedback.feedback_type as FeedbackType]++;
      byEntity[feedback.entity_type as FeedbackEntityType]++;
    }

    return {
      totalFeedback: recentFeedback.length,
      byType,
      byEntity,
      recentFeedback: recentFeedback.slice(0, 20)
    };
  }

  /**
   * Get feedback for a specific entity
   */
  async getEntityFeedback(workspaceId: string, entityType: FeedbackEntityType, entityId: string) {
    return await this.closedLoopRepo.getFeedbackByEntity(workspaceId, entityType, entityId);
  }
}
