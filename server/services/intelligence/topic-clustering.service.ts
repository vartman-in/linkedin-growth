/**
 * Topic Clustering Service
 * Groups related topics and detects semantic relationships
 */

import { Pool } from 'pg';
import { getAIProvider } from '../ai/provider';
import { IntelligenceRepository } from '../../repositories/intelligence.repository';
import { Topic, TopicMention } from '../../models/types';

export interface TopicCluster {
  canonicalTopic: Topic;
  relatedTopics: Topic[];
  sourceCount: number;
  sourceDiversity: number;
  recentActivity: number;
  representativeClaims: string[];
  contradictions: string[];
  confidence: number;
}

export class TopicClusteringService {
  private intelligenceRepo: IntelligenceRepository;

  constructor(private pool: Pool) {
    this.intelligenceRepo = new IntelligenceRepository(pool);
  }

  /**
   * Cluster topics for a workspace
   */
  async clusterTopics(workspaceId: string): Promise<TopicCluster[]> {
    // Get all topics for workspace
    const topics = await this.intelligenceRepo.getTopicsByWorkspace(workspaceId);
    
    if (topics.length === 0) {
      return [];
    }

    // Get mentions for each topic
    const topicMentions = await Promise.all(
      topics.map(async (topic) => {
        const mentions = await this.intelligenceRepo.getMentionsByTopic(workspaceId, topic.id);
        return { topic, mentions };
      })
    );

    // Group topics by semantic similarity
    const clusters = await this.groupBySimilarity(workspaceId, topicMentions);

    return clusters;
  }

  /**
   * Group topics by semantic similarity using AI
   */
  private async groupBySimilarity(
    workspaceId: string,
    topicMentions: Array<{ topic: Topic; mentions: TopicMention[] }>
  ): Promise<TopicCluster[]> {
    if (topicMentions.length === 0) {
      return [];
    }

    // For small numbers of topics, do pairwise comparison
    if (topicMentions.length <= 20) {
      return await this.pairwiseClustering(workspaceId, topicMentions);
    }

    // For larger numbers, use AI-assisted clustering
    return await this.aiAssistedClustering(workspaceId, topicMentions);
  }

  /**
   * Pairwise clustering for small topic sets
   */
  private async pairwiseClustering(
    workspaceId: string,
    topicMentions: Array<{ topic: Topic; mentions: TopicMention[] }>
  ): Promise<TopicCluster[]> {
    const clusters: TopicCluster[] = [];
    const used = new Set<string>();

    for (let i = 0; i < topicMentions.length; i++) {
      if (used.has(topicMentions[i].topic.id)) continue;

      const cluster: TopicCluster = {
        canonicalTopic: topicMentions[i].topic,
        relatedTopics: [],
        sourceCount: topicMentions[i].mentions.length,
        sourceDiversity: new Set(topicMentions[i].mentions.map(m => m.source_id)).size,
        recentActivity: topicMentions[i].mentions.length,
        representativeClaims: [],
        contradictions: [],
        confidence: 1.0,
      };

      // Find related topics
      for (let j = i + 1; j < topicMentions.length; j++) {
        if (used.has(topicMentions[j].topic.id)) continue;

        const similarity = await this.calculateSimilarity(
          topicMentions[i].topic,
          topicMentions[j].topic
        );

        if (similarity > 0.7) {
          cluster.relatedTopics.push(topicMentions[j].topic);
          cluster.sourceCount += topicMentions[j].mentions.length;
          cluster.sourceDiversity += new Set(topicMentions[j].mentions.map(m => m.source_id)).size;
          cluster.recentActivity += topicMentions[j].mentions.length;
          used.add(topicMentions[j].topic.id);
        }
      }

      // Update aliases for canonical topic
      if (cluster.relatedTopics.length > 0) {
        const aliases = [
          ...cluster.canonicalTopic.aliases,
          ...cluster.relatedTopics.map(t => t.canonical_name),
          ...cluster.relatedTopics.flatMap(t => t.aliases),
        ];
        
        await this.intelligenceRepo.createTopic(
          workspaceId,
          cluster.canonicalTopic.canonical_name,
          [...new Set(aliases)]
        );
      }

      clusters.push(cluster);
      used.add(topicMentions[i].topic.id);
    }

    return clusters;
  }

  /**
   * AI-assisted clustering for large topic sets
   */
  private async aiAssistedClustering(
    workspaceId: string,
    topicMentions: Array<{ topic: Topic; mentions: TopicMention[] }>
  ): Promise<TopicCluster[]> {
    const ai = getAIProvider();

    const topicList = topicMentions.map(tm => ({
      name: tm.topic.canonical_name,
      aliases: tm.topic.aliases,
      mentionCount: tm.mentions.length,
    }));

    const prompt = `Group these topics into semantic clusters. Topics that discuss the same underlying concept should be grouped together.

TOPICS:
${JSON.stringify(topicList, null, 2)}

Return clusters in JSON format:
{
  "clusters": [
    {
      "canonicalTopic": "the best name for this cluster",
      "relatedTopics": ["other topic names in this cluster"],
      "confidence": 0.0-1.0
    }
  ]
}`;

    try {
      const result = await ai.completeStructured<{
        clusters: Array<{
          canonicalTopic: string;
          relatedTopics: string[];
          confidence: number;
        }>;
      }>(prompt, {}, { temperature: 0.2 });

      // Map AI clusters to actual topic objects
      const clusters: TopicCluster[] = [];

      for (const aiCluster of result.clusters) {
        const canonical = topicMentions.find(tm => 
          tm.topic.canonical_name === aiCluster.canonicalTopic ||
          tm.topic.aliases.includes(aiCluster.canonicalTopic)
        );

        if (!canonical) continue;

        const related = topicMentions.filter(tm =>
          aiCluster.relatedTopics.includes(tm.topic.canonical_name) ||
          tm.topic.aliases.some(alias => aiCluster.relatedTopics.includes(alias))
        );

        clusters.push({
          canonicalTopic: canonical.topic,
          relatedTopics: related.map(r => r.topic),
          sourceCount: canonical.mentions.length + related.reduce((sum, r) => sum + r.mentions.length, 0),
          sourceDiversity: new Set([
            ...canonical.mentions.map(m => m.source_id),
            ...related.flatMap(r => r.mentions.map(m => m.source_id)),
          ]).size,
          recentActivity: canonical.mentions.length + related.reduce((sum, r) => sum + r.mentions.length, 0),
          representativeClaims: [],
          contradictions: [],
          confidence: aiCluster.confidence,
        });
      }

      return clusters;
    } catch (error) {
      // Fallback to pairwise clustering
      return await this.pairwiseClustering(workspaceId, topicMentions);
    }
  }

  /**
   * Calculate similarity between two topics
   */
  private async calculateSimilarity(topic1: Topic, topic2: Topic): Promise<number> {
    // Simple similarity based on name overlap
    const name1 = topic1.canonical_name.toLowerCase();
    const name2 = topic2.canonical_name.toLowerCase();

    // Check if one is substring of another
    if (name1.includes(name2) || name2.includes(name1)) {
      return 0.9;
    }

    // Check alias overlap
    const aliases1 = [name1, ...topic1.aliases.map(a => a.toLowerCase())];
    const aliases2 = [name2, ...topic2.aliases.map(a => a.toLowerCase())];

    const overlap = aliases1.filter(a1 => aliases2.some(a2 => a2.includes(a1) || a1.includes(a2)));
    
    if (overlap.length > 0) {
      return 0.8;
    }

    // Word overlap
    const words1 = new Set(name1.split(/\s+/));
    const words2 = new Set(name2.split(/\s+/));
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    
    if (intersection.size > 0) {
      return intersection.size / Math.max(words1.size, words2.size);
    }

    return 0.0;
  }

  /**
   * Get cluster statistics
   */
  async getClusterStats(workspaceId: string): Promise<{
    totalTopics: number;
    totalClusters: number;
    avgClusterSize: number;
    topClusters: TopicCluster[];
  }> {
    const clusters = await this.clusterTopics(workspaceId);
    
    const totalTopics = clusters.reduce((sum, c) => sum + 1 + c.relatedTopics.length, 0);
    const avgClusterSize = clusters.length > 0 
      ? clusters.reduce((sum, c) => sum + 1 + c.relatedTopics.length, 0) / clusters.length
      : 0;

    const topClusters = clusters
      .sort((a, b) => b.sourceCount - a.sourceCount)
      .slice(0, 10);

    return {
      totalTopics,
      totalClusters: clusters.length,
      avgClusterSize,
      topClusters,
    };
  }
}
