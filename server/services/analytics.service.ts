/**
 * Analytics Service
 * Collects and tracks analytics events with provenance
 */

import { Pool } from 'pg';

export type AnalyticsProvenance = 
  | 'VERIFIED_PLATFORM_DATA'
  | 'VERIFIED_INTERNAL_DATA'
  | 'USER_ENTERED'
  | 'ESTIMATED'
  | 'UNAVAILABLE';

export type AnalyticsEventType =
  | 'content_created'
  | 'content_edited'
  | 'content_approved'
  | 'content_published'
  | 'content_engagement'
  | 'lead_created'
  | 'lead_qualified'
  | 'message_received'
  | 'message_sent'
  | 'conversation_stage'
  | 'opportunity_created'
  | 'opportunity_stage_changed';

export interface AnalyticsEvent {
  eventType: AnalyticsEventType;
  provenance: AnalyticsProvenance;
  metrics: Record<string, any>;
  workspaceId: string;
  userId?: string;
  entityId?: string;
}

export class AnalyticsService {
  constructor(private pool: Pool) {}

  /**
   * Record an analytics event
   */
  async recordEvent(event: AnalyticsEvent): Promise<void> {
    await this.pool.query(
      `INSERT INTO analytics_events (workspace_id, event_type, provenance, metrics, entity_id, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        event.workspaceId,
        event.eventType,
        event.provenance,
        JSON.stringify(event.metrics),
        event.entityId || null
      ]
    );
  }

  /**
   * Record content created event
   */
  async recordContentCreated(
    workspaceId: string,
    contentId: string,
    userId?: string
  ): Promise<void> {
    await this.recordEvent({
      eventType: 'content_created',
      provenance: 'VERIFIED_INTERNAL_DATA',
      metrics: { contentId },
      workspaceId,
      userId,
      entityId: contentId
    });
  }

  /**
   * Record content published event
   */
  async recordContentPublished(
    workspaceId: string,
    contentId: string,
    platform?: string,
    userId?: string
  ): Promise<void> {
    await this.recordEvent({
      eventType: 'content_published',
      provenance: 'VERIFIED_INTERNAL_DATA',
      metrics: { contentId, platform: platform || 'unknown' },
      workspaceId,
      userId,
      entityId: contentId
    });
  }

  /**
   * Record content engagement (from platform analytics)
   */
  async recordContentEngagement(
    workspaceId: string,
    contentId: string,
    metrics: {
      impressions?: number;
      reach?: number;
      reactions?: number;
      comments?: number;
      shares?: number;
      clicks?: number;
    },
    provenance: AnalyticsProvenance = 'VERIFIED_PLATFORM_DATA'
  ): Promise<void> {
    await this.recordEvent({
      eventType: 'content_engagement',
      provenance,
      metrics: { contentId, ...metrics },
      workspaceId,
      entityId: contentId
    });
  }

  /**
   * Record lead created event
   */
  async recordLeadCreated(
    workspaceId: string,
    leadId: string,
    userId?: string
  ): Promise<void> {
    await this.recordEvent({
      eventType: 'lead_created',
      provenance: 'VERIFIED_INTERNAL_DATA',
      metrics: { leadId },
      workspaceId,
      userId,
      entityId: leadId
    });
  }

  /**
   * Record lead qualified event
   */
  async recordLeadQualified(
    workspaceId: string,
    leadId: string,
    userId?: string
  ): Promise<void> {
    await this.recordEvent({
      eventType: 'lead_qualified',
      provenance: 'VERIFIED_INTERNAL_DATA',
      metrics: { leadId },
      workspaceId,
      userId,
      entityId: leadId
    });
  }

  /**
   * Record message sent/received
   */
  async recordMessage(
    workspaceId: string,
    conversationId: string,
    direction: 'sent' | 'received',
    userId?: string
  ): Promise<void> {
    await this.recordEvent({
      eventType: direction === 'sent' ? 'message_sent' : 'message_received',
      provenance: 'VERIFIED_INTERNAL_DATA',
      metrics: { conversationId },
      workspaceId,
      userId,
      entityId: conversationId
    });
  }

  /**
   * Record opportunity stage change
   */
  async recordOpportunityStageChange(
    workspaceId: string,
    opportunityId: string,
    fromStage: string,
    toStage: string,
    userId?: string
  ): Promise<void> {
    await this.recordEvent({
      eventType: 'opportunity_stage_changed',
      provenance: 'VERIFIED_INTERNAL_DATA',
      metrics: { opportunityId, fromStage, toStage },
      workspaceId,
      userId,
      entityId: opportunityId
    });
  }

  /**
   * Get analytics summary for workspace
   */
  async getWorkspaceSummary(workspaceId: string, days: number = 30): Promise<any> {
    const result = await this.pool.query(
      `SELECT 
        event_type,
        COUNT(*) as count,
        JSON_AGG(metrics) as metrics_list
       FROM analytics_events
       WHERE workspace_id = $1 
         AND created_at >= NOW() - INTERVAL '$2 days'
       GROUP BY event_type`,
      [workspaceId, days]
    );

    const summary: any = {};
    for (const row of result.rows) {
      summary[row.event_type] = {
        count: parseInt(row.count),
        metrics: row.metrics_list
      };
    }

    return summary;
  }

  /**
   * Get content performance metrics
   */
  async getContentPerformance(workspaceId: string, contentId: string): Promise<any> {
    const result = await this.pool.query(
      `SELECT metrics, created_at
       FROM analytics_events
       WHERE workspace_id = $1 
         AND entity_id = $2
         AND event_type = 'content_engagement'
       ORDER BY created_at DESC
       LIMIT 1`,
      [workspaceId, contentId]
    );

    return result.rows[0]?.metrics || null;
  }
}

export const analyticsService = new AnalyticsService(null as any);
