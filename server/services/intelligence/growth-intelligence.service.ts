/**
 * Growth Intelligence Engine
 * Main orchestrator for the intelligence pipeline
 */

import { Pool } from 'pg';
import { SourceIngestionService } from './source-ingestion.service';
import { SourceNormalizationService } from './source-normalization.service';
import { SourceUnderstandingService } from './source-understanding.service';
import { TopicClusteringService } from './topic-clustering.service';
import { TrendSignalService } from './trend-signal.service';
import { ContentOpportunityService } from './content-opportunity.service';
import { ContentGapService } from './content-gap.service';
import { IntelligenceRepository } from '../../repositories/intelligence.repository';

export class GrowthIntelligenceService {
  private sourceIngestion: SourceIngestionService;
  private sourceNormalization: SourceNormalizationService;
  private sourceUnderstanding: SourceUnderstandingService;
  private topicClustering: TopicClusteringService;
  private trendSignal: TrendSignalService;
  private contentOpportunity: ContentOpportunityService;
  private contentGap: ContentGapService;
  private intelligenceRepo: IntelligenceRepository;

  constructor(private pool: Pool) {
    this.sourceIngestion = new SourceIngestionService(pool);
    this.sourceNormalization = new SourceNormalizationService(pool);
    this.sourceUnderstanding = new SourceUnderstandingService(pool);
    this.topicClustering = new TopicClusteringService(pool);
    this.trendSignal = new TrendSignalService(pool);
    this.contentOpportunity = new ContentOpportunityService(pool);
    this.contentGap = new ContentGapService(pool);
    this.intelligenceRepo = new IntelligenceRepository(pool);
  }

  /**
   * Full intelligence pipeline: ingest → normalize → understand → cluster → detect trends → generate opportunities
   */
  async processSource(workspaceId: string, url: string, profile?: any, icp?: any): Promise<{
    source: any;
    document: any;
    understanding: any;
    claims: any[];
    topics: any[];
    trends: any[];
    opportunities: any[];
    gaps: any[];
  }> {
    // Step 1: Ingest source
    const source = await this.sourceIngestion.ingestSource(workspaceId, url);

    // Step 2: Normalize source
    const document = await this.sourceNormalization.normalizeSource(workspaceId, source);

    // Step 3: Understand source
    const analysis = await this.sourceUnderstanding.analyzeSource(workspaceId, source.id, document.id);

    // Step 4: Cluster topics
    const clusters = await this.topicClustering.clusterTopics(workspaceId);

    // Step 5: Detect trends
    const trends = await this.trendSignal.detectTrends(workspaceId);

    // Step 6: Generate opportunities
    const opportunities = await this.contentOpportunity.generateOpportunities(workspaceId, profile, icp);

    // Step 7: Detect gaps
    const gaps = await this.contentGap.detectGaps(workspaceId);

    return {
      source,
      document,
      understanding: analysis.understanding,
      claims: analysis.claims,
      topics: analysis.topics.map(t => t.topic),
      trends,
      opportunities,
      gaps,
    };
  }

  /**
   * Batch process multiple sources
   */
  async batchProcessSources(workspaceId: string, urls: string[], profile?: any, icp?: any): Promise<{
    processed: number;
    failed: number;
    opportunities: any[];
    gaps: any[];
  }> {
    let processed = 0;
    let failed = 0;

    for (const url of urls) {
      try {
        await this.processSource(workspaceId, url, profile, icp);
        processed++;
      } catch (error) {
        console.error(`Failed to process ${url}:`, error);
        failed++;
      }
    }

    // Generate final opportunities and gaps
    const opportunities = await this.contentOpportunity.generateOpportunities(workspaceId, profile, icp);
    const gaps = await this.contentGap.detectGaps(workspaceId);

    return { processed, failed, opportunities, gaps };
  }

  /**
   * Get intelligence summary for a workspace
   */
  async getIntelligenceSummary(workspaceId: string): Promise<{
    sources: { total: number; processed: number; failed: number };
    topics: { total: number; clusters: number };
    trends: { rising: number; stable: number; declining: number };
    opportunities: { total: number; highConfidence: number };
    gaps: { total: number; highPriority: number };
  }> {
    const sources = await this.intelligenceRepo.getSourcesByWorkspace(workspaceId, 1000);
    const topics = await this.intelligenceRepo.getTopicsByWorkspace(workspaceId, 1000);
    const trends = await this.intelligenceRepo.getTrendSignalsByWorkspace(workspaceId, 1000);
    const opportunities = await this.intelligenceRepo.getOpportunitiesByWorkspace(workspaceId);
    const gaps = await this.intelligenceRepo.getGapsByWorkspace(workspaceId, 1000);

    const clusters = await this.topicClustering.clusterTopics(workspaceId);

    return {
      sources: {
        total: sources.length,
        processed: sources.filter(s => s.status === 'PROCESSED').length,
        failed: sources.filter(s => s.status === 'FAILED').length,
      },
      topics: {
        total: topics.length,
        clusters: clusters.length,
      },
      trends: {
        rising: trends.filter(t => t.status === 'RISING').length,
        stable: trends.filter(t => t.status === 'STABLE' || t.status === 'SUSTAINED').length,
        declining: trends.filter(t => t.status === 'DECLINING').length,
      },
      opportunities: {
        total: opportunities.length,
        highConfidence: opportunities.filter(o => (o.confidence || 0) > 0.7).length,
      },
      gaps: {
        total: gaps.length,
        highPriority: gaps.filter(g => (g.confidence || 0) > 0.7).length,
      },
    };
  }

  /**
   * Get source details with full analysis
   */
  async getSourceDetails(workspaceId: string, sourceId: string): Promise<{
    source: any;
    documents: any[];
    claims: any[];
    topics: any[];
    mentions: any[];
  }> {
    const source = await this.intelligenceRepo.getSource(workspaceId, sourceId);
    if (!source) {
      throw new Error('Source not found');
    }

    const documents = await this.intelligenceRepo.getDocumentsBySource(workspaceId, sourceId);
    const claims = await this.intelligenceRepo.getClaimsBySource(workspaceId, sourceId);
    const mentions = await this.intelligenceRepo.getMentionsBySource(workspaceId, sourceId);

    // Get topics from mentions
    const topicIds = [...new Set(mentions.map(m => m.topic_id))];
    const topics = await Promise.all(
      topicIds.map(id => this.intelligenceRepo.getTopic(workspaceId, id))
    );

    return {
      source,
      documents,
      claims,
      topics: topics.filter(Boolean),
      mentions,
    };
  }

  /**
   * Get opportunity details
   */
  async getOpportunityDetails(workspaceId: string, opportunityId: string): Promise<{
    opportunity: any;
    topic: any;
    sources: any[];
    claims: any[];
    trends: any[];
  }> {
    const opportunity = await this.intelligenceRepo.getOpportunity(workspaceId, opportunityId);
    if (!opportunity) {
      throw new Error('Opportunity not found');
    }

    const topic = opportunity.topic_id 
      ? await this.intelligenceRepo.getTopic(workspaceId, opportunity.topic_id)
      : null;

    const sources = await Promise.all(
      opportunity.source_ids.map(id => this.intelligenceRepo.getSource(workspaceId, id))
    );

    const claims = await Promise.all(
      opportunity.supporting_claim_ids.map(id => 
        this.pool.query('SELECT * FROM source_claims WHERE id = $1', [id]).then(r => r.rows[0])
      )
    );

    const trends = topic 
      ? await this.intelligenceRepo.getTrendSignalsByTopic(workspaceId, topic.id)
      : [];

    return {
      opportunity,
      topic,
      sources: sources.filter(Boolean),
      claims: claims.filter(Boolean),
      trends,
    };
  }

  /**
   * Convert opportunity to content idea
   */
  async convertOpportunityToIdea(
    workspaceId: string,
    opportunityId: string
  ): Promise<{ ideaId: string; opportunity: any }> {
    const opportunity = await this.intelligenceRepo.getOpportunity(workspaceId, opportunityId);
    if (!opportunity) {
      throw new Error('Opportunity not found');
    }

    // Create content idea
    const ideaResult = await this.pool.query(
      `INSERT INTO content_ideas (workspace_id, title, source_reference, pillar, audience, angle, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'NEW')
       RETURNING id`,
      [
        workspaceId,
        opportunity.thesis || opportunity.topic_name,
        JSON.stringify({ opportunityId, sourceIds: opportunity.source_ids }),
        null, // pillar
        opportunity.audience_relevance,
        opportunity.recommended_angle,
      ]
    );

    const ideaId = ideaResult.rows[0].id;

    // Update opportunity status
    await this.intelligenceRepo.updateOpportunity(workspaceId, opportunityId, {
      status: 'CONVERTED',
    });

    return { ideaId, opportunity };
  }

  // Expose sub-services for direct access
  getSourceIngestionService() { return this.sourceIngestion; }
  getSourceNormalizationService() { return this.sourceNormalization; }
  getSourceUnderstandingService() { return this.sourceUnderstanding; }
  getTopicClusteringService() { return this.topicClustering; }
  getTrendSignalService() { return this.trendSignal; }
  getContentOpportunityService() { return this.contentOpportunity; }
  getContentGapService() { return this.contentGap; }
  getRepository() { return this.intelligenceRepo; }
}
