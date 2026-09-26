/**
 * Enhanced Learning Service
 * Implements closed-loop learning with pattern detection, insights, and explainability
 */

import { Pool } from 'pg';
import { getAIProvider } from '../ai/provider';
import { ClosedLoopRepository } from '../../repositories/closed-loop.repository';
import { LearningPattern, LearningInsight, PatternType, InsightType } from '../../models/types';

export interface LearningConfig {
  minObservationsForPattern: number; // Minimum observations to detect a pattern
  minObservationsForWeakSignal: number; // Minimum for weak signal
  minObservationsForStrongPattern: number; // Minimum for strong pattern
  patternExpiryDays: number; // How long before a pattern expires
  confidenceThreshold: number; // Minimum confidence to create insight
}

const DEFAULT_CONFIG: LearningConfig = {
  minObservationsForPattern: 3,
  minObservationsForWeakSignal: 2,
  minObservationsForStrongPattern: 5,
  patternExpiryDays: 30,
  confidenceThreshold: 0.6
};

export class EnhancedLearningService {
  private closedLoopRepo: ClosedLoopRepository;
  private config: LearningConfig;

  constructor(private pool: Pool, config?: Partial<LearningConfig>) {
    this.closedLoopRepo = new ClosedLoopRepository(pool);
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Detect all patterns from feedback and performance data
   */
  async detectAllPatterns(workspaceId: string): Promise<LearningPattern[]> {
    const patterns: LearningPattern[] = [];

    // Detect topic preferences
    const topicPatterns = await this.detectTopicPreferences(workspaceId);
    patterns.push(...topicPatterns);

    // Detect format preferences
    const formatPatterns = await this.detectFormatPreferences(workspaceId);
    patterns.push(...formatPatterns);

    // Detect performance patterns
    const performancePatterns = await this.detectPerformancePatterns(workspaceId);
    patterns.push(...performancePatterns);

    // Detect engagement patterns
    const engagementPatterns = await this.detectEngagementPatterns(workspaceId);
    patterns.push(...engagementPatterns);

    // Persist patterns
    for (const pattern of patterns) {
      await this.closedLoopRepo.createPattern(
        workspaceId,
        pattern.pattern_type,
        pattern.pattern_data,
        pattern.confidence,
        pattern.observation_count,
        pattern.evidence_ids,
        pattern.time_range_start ?? undefined,
        pattern.time_range_end,
        pattern.generated_by,
        pattern.expires_at
      );
    }

    return patterns;
  }

  /**
   * Detect topic preferences from feedback
   */
  private async detectTopicPreferences(workspaceId: string): Promise<LearningPattern[]> {
    const patterns: LearningPattern[] = [];

    // Get accepted opportunities
    const acceptedFeedback = await this.closedLoopRepo.getFeedbackByType(workspaceId, 'accepted', 500);
    const dismissedFeedback = await this.closedLoopRepo.getFeedbackByType(workspaceId, 'dismissed', 500);

    // Group by topic (from feedback_data)
    const topicCounts = new Map<string, { accepted: number; dismissed: number; evidenceIds: string[] }>();

    for (const feedback of acceptedFeedback) {
      if (feedback.entity_type === 'opportunity' && feedback.feedback_data?.topic) {
        const topic = feedback.feedback_data.topic;
        if (!topicCounts.has(topic)) {
          topicCounts.set(topic, { accepted: 0, dismissed: 0, evidenceIds: [] });
        }
        topicCounts.get(topic)!.accepted++;
        topicCounts.get(topic)!.evidenceIds.push(feedback.id);
      }
    }

    for (const feedback of dismissedFeedback) {
      if (feedback.entity_type === 'opportunity' && feedback.feedback_data?.topic) {
        const topic = feedback.feedback_data.topic;
        if (!topicCounts.has(topic)) {
          topicCounts.set(topic, { accepted: 0, dismissed: 0, evidenceIds: [] });
        }
        topicCounts.get(topic)!.dismissed++;
        topicCounts.get(topic)!.evidenceIds.push(feedback.id);
      }
    }

    // Create patterns for topics with sufficient observations
    for (const [topic, counts] of topicCounts) {
      const total = counts.accepted + counts.dismissed;
      
      if (total >= this.config.minObservationsForPattern) {
        const acceptanceRate = counts.accepted / total;
        const confidence = Math.min(total / 10, 1.0) * acceptanceRate;

        if (confidence >= this.config.confidenceThreshold) {
          patterns.push({
            id: '', // Will be set by DB
            workspace_id: workspaceId,
            pattern_type: 'topic_preference',
            pattern_data: {
              topic,
              acceptance_rate: acceptanceRate,
              accepted_count: counts.accepted,
              dismissed_count: counts.dismissed,
              interpretation: acceptanceRate > 0.7 ? 'STRONGLY_PREFERRED' : acceptanceRate > 0.5 ? 'PREFERRED' : 'NEUTRAL'
            },
            confidence,
            observation_count: total,
            evidence_ids: counts.evidenceIds,
            time_range_start: null,
            time_range_end: null,
            generated_by: 'DETERMINISTIC',
            expires_at: new Date(Date.now() + this.config.patternExpiryDays * 24 * 60 * 60 * 1000),
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Detect format preferences from feedback
   */
  private async detectFormatPreferences(workspaceId: string): Promise<LearningPattern[]> {
    const patterns: LearningPattern[] = [];

    // Get converted opportunities (which became content)
    const convertedFeedback = await this.closedLoopRepo.getFeedbackByType(workspaceId, 'converted', 500);

    // Group by format
    const formatCounts = new Map<string, { count: number; evidenceIds: string[] }>();

    for (const feedback of convertedFeedback) {
      if (feedback.entity_type === 'opportunity' && feedback.feedback_data?.format) {
        const format = feedback.feedback_data.format;
        if (!formatCounts.has(format)) {
          formatCounts.set(format, { count: 0, evidenceIds: [] });
        }
        formatCounts.get(format)!.count++;
        formatCounts.get(format)!.evidenceIds.push(feedback.id);
      }
    }

    // Create patterns for formats with sufficient observations
    for (const [format, data] of formatCounts) {
      if (data.count >= this.config.minObservationsForPattern) {
        const confidence = Math.min(data.count / 10, 1.0);

        if (confidence >= this.config.confidenceThreshold) {
          patterns.push({
            id: '',
            workspace_id: workspaceId,
            pattern_type: 'format_preference',
            pattern_data: {
              format,
              usage_count: data.count,
              interpretation: 'PREFERRED_FORMAT'
            },
            confidence,
            observation_count: data.count,
            evidence_ids: data.evidenceIds,
            time_range_start: null,
            time_range_end: null,
            generated_by: 'DETERMINISTIC',
            expires_at: new Date(Date.now() + this.config.patternExpiryDays * 24 * 60 * 60 * 1000),
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Detect performance patterns from content performance data
   */
  private async detectPerformancePatterns(workspaceId: string): Promise<LearningPattern[]> {
    const patterns: LearningPattern[] = [];

    // Get recent performance data
    const performanceData = await this.closedLoopRepo.getRecentPerformance(workspaceId, 100);

    if (performanceData.length < this.config.minObservationsForPattern) {
      return patterns; // Not enough data
    }

    // Analyze performance by topic/format
    const topicPerformance = new Map<string, { totalEngagement: number; count: number; evidenceIds: string[] }>();

    for (const perf of performanceData) {
      const metrics = perf.metrics;
      const engagement = (metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0);
      
      // Extract topic from content (would need to join with content_drafts)
      // For now, use platform as a proxy
      const platform = perf.platform;
      
      if (!topicPerformance.has(platform)) {
        topicPerformance.set(platform, { totalEngagement: 0, count: 0, evidenceIds: [] });
      }
      
      topicPerformance.get(platform)!.totalEngagement += engagement;
      topicPerformance.get(platform)!.count++;
      topicPerformance.get(platform)!.evidenceIds.push(perf.id);
    }

    // Create patterns for platforms with good performance
    for (const [platform, data] of topicPerformance) {
      if (data.count >= this.config.minObservationsForPattern) {
        const avgEngagement = data.totalEngagement / data.count;
        const confidence = Math.min(data.count / 10, 1.0);

        if (avgEngagement > 10 && confidence >= this.config.confidenceThreshold) {
          patterns.push({
            id: '',
            workspace_id: workspaceId,
            pattern_type: 'content_performance',
            pattern_data: {
              platform,
              average_engagement: avgEngagement,
              total_posts: data.count,
              interpretation: 'HIGH_PERFORMING_PLATFORM'
            },
            confidence,
            observation_count: data.count,
            evidence_ids: data.evidenceIds,
            time_range_start: null,
            time_range_end: null,
            generated_by: 'DETERMINISTIC',
            expires_at: new Date(Date.now() + this.config.patternExpiryDays * 24 * 60 * 60 * 1000),
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Detect engagement patterns from feedback
   */
  private async detectEngagementPatterns(workspaceId: string): Promise<LearningPattern[]> {
    const patterns: LearningPattern[] = [];

    // Get all feedback
    const allFeedback = await this.closedLoopRepo.getRecentFeedback(workspaceId, 1000);

    // Analyze engagement over time
    const weeklyEngagement = new Map<string, { count: number; evidenceIds: string[] }>();

    for (const feedback of allFeedback) {
      const weekKey = feedback.created_at.toISOString().split('T')[0].substring(0, 7); // YYYY-MM
      if (!weeklyEngagement.has(weekKey)) {
        weeklyEngagement.set(weekKey, { count: 0, evidenceIds: [] });
      }
      weeklyEngagement.get(weekKey)!.count++;
      weeklyEngagement.get(weekKey)!.evidenceIds.push(feedback.id);
    }

    // Detect increasing/decreasing engagement
    const weeks = Array.from(weeklyEngagement.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    
    if (weeks.length >= 3) {
      const recentWeeks = weeks.slice(-3);
      const trend = recentWeeks[2][1].count - recentWeeks[0][1].count;
      
      if (Math.abs(trend) >= 2) {
        const allEvidenceIds = recentWeeks.flatMap(w => w[1].evidenceIds);
        
        patterns.push({
          id: '',
          workspace_id: workspaceId,
          pattern_type: 'engagement_pattern',
          pattern_data: {
            trend: trend > 0 ? 'INCREASING' : 'DECREASING',
            change: trend,
            recent_weeks: recentWeeks.map(w => ({ week: w[0], count: w[1].count })),
            interpretation: trend > 0 ? 'GROWING_ENGAGEMENT' : 'DECLINING_ENGAGEMENT'
          },
          confidence: Math.min(weeks.length / 10, 1.0),
          observation_count: allEvidenceIds.length,
          evidence_ids: allEvidenceIds,
          time_range_start: new Date(recentWeeks[0][0]),
          time_range_end: new Date(recentWeeks[2][0]),
          generated_by: 'DETERMINISTIC',
          expires_at: new Date(Date.now() + this.config.patternExpiryDays * 24 * 60 * 60 * 1000),
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }

    return patterns;
  }

  /**
   * Generate insights from patterns
   */
  async generateInsights(workspaceId: string): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    // Get active patterns
    const patterns = await this.closedLoopRepo.getActivePatterns(workspaceId);

    for (const pattern of patterns) {
      const insight = await this.generateInsightFromPattern(workspaceId, pattern);
      if (insight) {
        insights.push(insight);
      }
    }

    // Persist insights
    for (const insight of insights) {
      await this.closedLoopRepo.createInsight(
        workspaceId,
        insight.insight_type,
        insight.title,
        insight.description,
        insight.confidence,
        insight.observation_count,
        insight.generated_by,
        insight.pattern_id ?? undefined,
        insight.evidence_summary,
        insight.time_range_start,
        insight.time_range_end,
        insight.is_actionable,
        insight.action_suggestion,
        insight.expires_at
      );
    }

    return insights;
  }

  /**
   * Generate a single insight from a pattern
   */
  private async generateInsightFromPattern(
    workspaceId: string,
    pattern: LearningPattern
  ): Promise<LearningInsight | null> {
    const patternData = pattern.pattern_data;

    switch (pattern.pattern_type) {
      case 'topic_preference': {
        const topic = patternData.topic;
        const acceptanceRate = patternData.acceptance_rate;
        
        if (acceptanceRate > 0.7) {
          return {
            id: '',
            workspace_id: workspaceId,
            pattern_id: pattern.id,
            insight_type: 'recommendation',
            title: `Strong preference for ${topic} content`,
            description: `Your workspace shows a strong preference for content about ${topic}. ${patternData.accepted_count} out of ${patternData.observation_count} opportunities on this topic were accepted.`,
            evidence_summary: `Based on ${patternData.observation_count} observations with ${(acceptanceRate * 100).toFixed(0)}% acceptance rate.`,
            confidence: pattern.confidence,
            observation_count: pattern.observation_count,
            time_range_start: pattern.time_range_start,
            time_range_end: pattern.time_range_end,
            generated_by: pattern.generated_by,
            is_actionable: true,
            action_suggestion: `Consider creating more content about ${topic}.`,
            expires_at: pattern.expires_at,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          };
        }
        break;
      }

      case 'format_preference': {
        const format = patternData.format;
        
        return {
          id: '',
          workspace_id: workspaceId,
          pattern_id: pattern.id,
          insight_type: 'recommendation',
          title: `Preference for ${format} format`,
          description: `Your workspace frequently uses ${format} format for content. ${patternData.usage_count} pieces of content have been created in this format.`,
          evidence_summary: `Based on ${patternData.usage_count} observations.`,
          confidence: pattern.confidence,
          observation_count: pattern.observation_count,
          time_range_start: pattern.time_range_start,
          time_range_end: pattern.time_range_end,
          generated_by: pattern.generated_by,
          is_actionable: false,
          action_suggestion: null,
          expires_at: pattern.expires_at,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        };
      }

      case 'content_performance': {
        const platform = patternData.platform;
        const avgEngagement = patternData.average_engagement;
        
        if (avgEngagement > 20) {
          return {
            id: '',
            workspace_id: workspaceId,
            pattern_id: pattern.id,
            insight_type: 'observation',
            title: `High performance on ${platform}`,
            description: `Content published on ${platform} shows high engagement with an average of ${avgEngagement.toFixed(1)} interactions per post.`,
            evidence_summary: `Based on ${patternData.total_posts} posts with average engagement of ${avgEngagement.toFixed(1)}.`,
            confidence: pattern.confidence,
            observation_count: pattern.observation_count,
            time_range_start: pattern.time_range_start,
            time_range_end: pattern.time_range_end,
            generated_by: pattern.generated_by,
            is_actionable: true,
            action_suggestion: `Consider publishing more content on ${platform}.`,
            expires_at: pattern.expires_at,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          };
        }
        break;
      }

      case 'engagement_pattern': {
        const trend = patternData.trend;
        
        return {
          id: '',
          workspace_id: workspaceId,
          pattern_id: pattern.id,
          insight_type: trend === 'INCREASING' ? 'opportunity' : 'warning',
          title: trend === 'INCREASING' ? 'Growing engagement trend' : 'Declining engagement trend',
          description: `Workspace engagement is ${trend === 'INCREASING' ? 'increasing' : 'decreasing'} with a change of ${patternData.change} interactions over the recent period.`,
          evidence_summary: `Based on ${pattern.observation_count} feedback events over ${patternData.recent_weeks?.length || 0} weeks.`,
          confidence: pattern.confidence,
          observation_count: pattern.observation_count,
          time_range_start: pattern.time_range_start,
          time_range_end: pattern.time_range_end,
          generated_by: pattern.generated_by,
          is_actionable: true,
          action_suggestion: trend === 'INCREASING' 
            ? 'Continue current content strategy - engagement is growing.'
            : 'Review content strategy - engagement may be declining.',
          expires_at: pattern.expires_at,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        };
      }
    }

    return null;
  }

  /**
   * Get all insights for a workspace
   */
  async getInsights(workspaceId: string, insightType?: InsightType): Promise<LearningInsight[]> {
    return await this.closedLoopRepo.getActiveInsights(workspaceId, insightType);
  }

  /**
   * Get patterns for a workspace
   */
  async getPatterns(workspaceId: string, patternType?: PatternType): Promise<LearningPattern[]> {
    return await this.closedLoopRepo.getActivePatterns(workspaceId, patternType);
  }

  /**
   * Expire old patterns
   */
  async expireOldPatterns(workspaceId: string): Promise<number> {
    const expiredPatterns = await this.closedLoopRepo.getExpiredPatterns(workspaceId);
    
    for (const pattern of expiredPatterns) {
      await this.closedLoopRepo.updatePattern(workspaceId, pattern.id, { is_active: false });
    }

    return expiredPatterns.length;
  }
}
