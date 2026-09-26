/**
 * Trend Signal Engine
 * Detects and analyzes trends from topic mentions and source activity
 */

import { Pool } from 'pg';
import { IntelligenceRepository } from '../../repositories/intelligence.repository';
import { Topic, TrendSignal, TopicMention } from '../../models/types';

export class TrendSignalService {
  private intelligenceRepo: IntelligenceRepository;

  constructor(private pool: Pool) {
    this.intelligenceRepo = new IntelligenceRepository(pool);
  }

  /**
   * Detect trend signals for all topics in a workspace
   */
  async detectTrends(workspaceId: string): Promise<TrendSignal[]> {
    const topics = await this.intelligenceRepo.getTopicsByWorkspace(workspaceId);
    const signals: TrendSignal[] = [];

    for (const topic of topics) {
      const topicSignals = await this.analyzeTopicTrend(workspaceId, topic);
      signals.push(...topicSignals);
    }

    return signals;
  }

  /**
   * Analyze trend for a specific topic
   */
  async analyzeTopicTrend(workspaceId: string, topic: Topic): Promise<TrendSignal[]> {
    const mentions = await this.intelligenceRepo.getMentionsByTopic(workspaceId, topic.id);
    
    if (mentions.length === 0) {
      return [];
    }

    const signals: TrendSignal[] = [];

    // 1. Mention frequency signal
    const frequencySignal = await this.calculateMentionFrequency(workspaceId, topic.id, mentions);
    if (frequencySignal) signals.push(frequencySignal);

    // 2. Source diversity signal
    const diversitySignal = await this.calculateSourceDiversity(workspaceId, topic.id, mentions);
    if (diversitySignal) signals.push(diversitySignal);

    // 3. Recency signal
    const recencySignal = await this.calculateRecency(workspaceId, topic.id, mentions);
    if (recencySignal) signals.push(recencySignal);

    // 4. Velocity signal (rate of change)
    const velocitySignal = await this.calculateVelocity(workspaceId, topic.id, mentions);
    if (velocitySignal) signals.push(velocitySignal);

    return signals;
  }

  /**
   * Calculate mention frequency signal
   */
  private async calculateMentionFrequency(
    workspaceId: string,
    topicId: string,
    mentions: TopicMention[]
  ): Promise<TrendSignal | null> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentMentions = mentions.filter(m => new Date(m.mentioned_at) >= oneDayAgo);
    const weeklyMentions = mentions.filter(m => new Date(m.mentioned_at) >= oneWeekAgo);

    if (mentions.length < 2) {
      // Insufficient data
      return await this.intelligenceRepo.createTrendSignal(workspaceId, topicId, {
        signal_type: 'mention_frequency',
        observed_at: now,
        time_window_hours: 24,
        volume: mentions.length,
        velocity: 0,
        source_diversity: new Set(mentions.map(m => m.source_id)).size,
        confidence: 0.2,
        status: 'INSUFFICIENT_DATA',
        provenance: 'CALCULATED',
        metadata: { reason: 'Insufficient mentions for trend analysis' },
      });
    }

    const volume = recentMentions.length;
    const weeklyVolume = weeklyMentions.length;
    const velocity = weeklyVolume > 0 ? (volume / weeklyVolume) * 7 : 0; // Daily velocity normalized to weekly

    let status: 'NEW' | 'RISING' | 'SUSTAINED' | 'STABLE' | 'DECLINING' = 'STABLE';
    
    if (weeklyMentions.length === 0) {
      status = 'NEW';
    } else if (velocity > 1.5) {
      status = 'RISING';
    } else if (velocity > 0.8 && velocity < 1.2) {
      status = 'STABLE';
    } else if (velocity < 0.5) {
      status = 'DECLINING';
    } else {
      status = 'SUSTAINED';
    }

    const confidence = Math.min(1.0, mentions.length / 10); // More mentions = higher confidence

    return await this.intelligenceRepo.createTrendSignal(workspaceId, topicId, {
      signal_type: 'mention_frequency',
      observed_at: now,
      time_window_hours: 24,
      volume,
      velocity,
      source_diversity: new Set(mentions.map(m => m.source_id)).size,
      confidence,
      status,
      provenance: 'CALCULATED',
      metadata: {
        totalMentions: mentions.length,
        dailyMentions: volume,
        weeklyMentions: weeklyVolume,
      },
    });
  }

  /**
   * Calculate source diversity signal
   */
  private async calculateSourceDiversity(
    workspaceId: string,
    topicId: string,
    mentions: TopicMention[]
  ): Promise<TrendSignal | null> {
    const uniqueSources = new Set(mentions.map(m => m.source_id));
    const diversity = uniqueSources.size;

    if (diversity === 0) {
      return null;
    }

    let status: 'NEW' | 'RISING' | 'SUSTAINED' | 'STABLE' | 'DECLINING' = 'STABLE';
    
    if (diversity === 1) {
      status = 'NEW';
    } else if (diversity >= 5) {
      status = 'RISING';
    } else if (diversity >= 3) {
      status = 'SUSTAINED';
    }

    const confidence = Math.min(1.0, diversity / 10);

    return await this.intelligenceRepo.createTrendSignal(workspaceId, topicId, {
      signal_type: 'source_diversity',
      observed_at: new Date(),
      time_window_hours: null,
      volume: mentions.length,
      velocity: null,
      source_diversity: diversity,
      confidence,
      status,
      provenance: 'CALCULATED',
      metadata: {
        uniqueSources: diversity,
        totalMentions: mentions.length,
      },
    });
  }

  /**
   * Calculate recency signal
   */
  private async calculateRecency(
    workspaceId: string,
    topicId: string,
    mentions: TopicMention[]
  ): Promise<TrendSignal | null> {
    if (mentions.length === 0) {
      return null;
    }

    const now = new Date();
    const mostRecent = mentions.reduce((latest, m) => {
      const mentionDate = new Date(m.mentioned_at);
      return mentionDate > latest ? mentionDate : latest;
    }, new Date(0));

    const hoursSinceLastMention = (now.getTime() - mostRecent.getTime()) / (1000 * 60 * 60);

    let status: 'NEW' | 'RISING' | 'SUSTAINED' | 'STABLE' | 'DECLINING' = 'STABLE';
    
    if (hoursSinceLastMention < 1) {
      status = 'RISING';
    } else if (hoursSinceLastMention < 24) {
      status = 'SUSTAINED';
    } else if (hoursSinceLastMention < 72) {
      status = 'STABLE';
    } else {
      status = 'DECLINING';
    }

    const confidence = Math.max(0, 1 - (hoursSinceLastMention / 168)); // Decay over 1 week

    return await this.intelligenceRepo.createTrendSignal(workspaceId, topicId, {
      signal_type: 'recency',
      observed_at: now,
      time_window_hours: Math.round(hoursSinceLastMention),
      volume: null,
      velocity: null,
      source_diversity: null,
      confidence,
      status,
      provenance: 'CALCULATED',
      metadata: {
        hoursSinceLastMention: Math.round(hoursSinceLastMention),
        mostRecentMention: mostRecent.toISOString(),
      },
    });
  }

  /**
   * Calculate velocity (rate of change)
   */
  private async calculateVelocity(
    workspaceId: string,
    topicId: string,
    mentions: TopicMention[]
  ): Promise<TrendSignal | null> {
    if (mentions.length < 3) {
      return null;
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeek = mentions.filter(m => new Date(m.mentioned_at) >= oneWeekAgo);
    const lastWeek = mentions.filter(m => {
      const date = new Date(m.mentioned_at);
      return date >= twoWeeksAgo && date < oneWeekAgo;
    });

    const thisWeekCount = thisWeek.length;
    const lastWeekCount = lastWeek.length;

    if (lastWeekCount === 0) {
      // No previous data
      return await this.intelligenceRepo.createTrendSignal(workspaceId, topicId, {
        signal_type: 'velocity',
        observed_at: now,
        time_window_hours: 168, // 1 week
        volume: thisWeekCount,
        velocity: null,
        source_diversity: null,
        confidence: 0.3,
        status: 'INSUFFICIENT_DATA',
        provenance: 'CALCULATED',
        metadata: { reason: 'No previous period for comparison' },
      });
    }

    const velocity = (thisWeekCount - lastWeekCount) / lastWeekCount;

    let status: 'NEW' | 'RISING' | 'SUSTAINED' | 'STABLE' | 'DECLINING' = 'STABLE';
    
    if (velocity > 0.5) {
      status = 'RISING';
    } else if (velocity > 0.1) {
      status = 'SUSTAINED';
    } else if (velocity > -0.1) {
      status = 'STABLE';
    } else {
      status = 'DECLINING';
    }

    const confidence = Math.min(1.0, (thisWeekCount + lastWeekCount) / 20);

    return await this.intelligenceRepo.createTrendSignal(workspaceId, topicId, {
      signal_type: 'velocity',
      observed_at: now,
      time_window_hours: 168,
      volume: thisWeekCount,
      velocity,
      source_diversity: null,
      confidence,
      status,
      provenance: 'CALCULATED',
      metadata: {
        thisWeekCount,
        lastWeekCount,
        percentChange: (velocity * 100).toFixed(1) + '%',
      },
    });
  }

  /**
   * Get latest trend signals for a topic
   */
  async getLatestTrends(workspaceId: string, topicId: string): Promise<TrendSignal[]> {
    return await this.intelligenceRepo.getTrendSignalsByTopic(workspaceId, topicId);
  }

  /**
   * Get trending topics (topics with RISING or NEW status)
   */
  async getTrendingTopics(workspaceId: string): Promise<Array<{
    topic: Topic;
    latestSignal: TrendSignal;
  }>> {
    const topics = await this.intelligenceRepo.getTopicsByWorkspace(workspaceId);
    const trending: Array<{ topic: Topic; latestSignal: TrendSignal }> = [];

    for (const topic of topics) {
      const signals = await this.intelligenceRepo.getTrendSignalsByTopic(workspaceId, topic.id);
      
      if (signals.length === 0) continue;

      const latestSignal = signals[0]; // Most recent signal
      
      if (latestSignal.status === 'RISING' || latestSignal.status === 'NEW') {
        trending.push({ topic, latestSignal });
      }
    }

    // Sort by confidence and recency
    return trending.sort((a, b) => {
      const confDiff = (b.latestSignal.confidence || 0) - (a.latestSignal.confidence || 0);
      if (confDiff !== 0) return confDiff;
      return new Date(b.latestSignal.observed_at).getTime() - new Date(a.latestSignal.observed_at).getTime();
    });
  }
}
