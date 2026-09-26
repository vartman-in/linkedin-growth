/**
 * Content Opportunity Engine
 * Identifies and scores content opportunities based on intelligence
 */

import { Pool } from 'pg';
import { getAIProvider } from '../../ai/provider';
import { IntelligenceRepository } from '../../repositories/intelligence.repository';
import { ClosedLoopRepository } from '../../repositories/closed-loop.repository';
import { Topic, TrendSignal, ContentOpportunity, SourceClaim, IntelligenceSource } from '../../models/types';

export interface OpportunityScore {
  overallScore: number;
  learningAdjustment?: {
    adjustment: number;
    reason: string;
    supportingObservations: number;
    confidence: string;
  };
  breakdown: {
    topicRelevance: { score: number; reason: string };
    audienceRelevance: { score: number; reason: string };
    timeliness: { score: number; reason: string };
    evidenceStrength: { score: number; reason: string };
    userExpertiseRelevance: { score: number; reason: string };
    novelty: { score: number; reason: string };
    sourceDiversity: { score: number; reason: string };
    conversationPotential: { score: number; reason: string };
    contentSaturation: { score: number; reason: string };
    confidence: { score: number; reason: string };
  };
}

export class ContentOpportunityService {
  private intelligenceRepo: IntelligenceRepository;
  private closedLoopRepo: ClosedLoopRepository;

  constructor(private pool: Pool) {
    this.intelligenceRepo = new IntelligenceRepository(pool);
    this.closedLoopRepo = new ClosedLoopRepository(pool);
  }

  /**
   * Generate content opportunities for a workspace
   */
  async generateOpportunities(
    workspaceId: string,
    profile?: any,
    icp?: any
  ): Promise<ContentOpportunity[]> {
    // Get trending topics
    const topics = await this.intelligenceRepo.getTopicsByWorkspace(workspaceId);
    const opportunities: ContentOpportunity[] = [];

    for (const topic of topics) {
      const opportunity = await this.evaluateOpportunity(workspaceId, topic, profile, icp);
      if (opportunity) {
        opportunities.push(opportunity);
      }
    }

    // Sort by overall score
    return opportunities.sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0));
  }

  /**
   * Evaluate a topic for content opportunity
   */
  async evaluateOpportunity(
    workspaceId: string,
    topic: Topic,
    profile?: any,
    icp?: any
  ): Promise<ContentOpportunity | null> {
    // Get trend signals for topic
    const signals = await this.intelligenceRepo.getTrendSignalsByTopic(workspaceId, topic.id);
    
    if (signals.length === 0) {
      return null;
    }

    // Get latest signal
    const latestSignal = signals[0];

    // Get mentions and claims
    const mentions = await this.intelligenceRepo.getMentionsByTopic(workspaceId, topic.id);
    const sourceIds = [...new Set(mentions.map(m => m.source_id))];
    
    // Get claims from these sources
    const claims: SourceClaim[] = [];
    for (const sourceId of sourceIds.slice(0, 10)) { // Limit to 10 sources
      const sourceClaims = await this.intelligenceRepo.getClaimsBySource(workspaceId, sourceId);
      claims.push(...sourceClaims);
    }

    // Score the opportunity
    const scoring = await this.scoreOpportunity(workspaceId, topic, latestSignal, claims, profile, icp);

    // Generate opportunity using AI if score is high enough
    if (scoring.overallScore >= 50) {
      const opportunity = await this.generateOpportunityDetails(
        workspaceId,
        topic,
        latestSignal,
        claims,
        sourceIds,
        scoring,
        profile,
        icp
      );

      return opportunity;
    }

    return null;
  }

  /**
   * Score an opportunity across multiple dimensions
   */
  private async scoreOpportunity(
    workspaceId: string,
    topic: Topic,
    signal: TrendSignal,
    claims: SourceClaim[],
    profile?: any,
    icp?: any
  ): Promise<OpportunityScore> {
    const breakdown: OpportunityScore['breakdown'] = {
      topicRelevance: { score: 0, reason: '' },
      audienceRelevance: { score: 0, reason: '' },
      timeliness: { score: 0, reason: '' },
      evidenceStrength: { score: 0, reason: '' },
      userExpertiseRelevance: { score: 0, reason: '' },
      novelty: { score: 0, reason: '' },
      sourceDiversity: { score: 0, reason: '' },
      conversationPotential: { score: 0, reason: '' },
      contentSaturation: { score: 0, reason: '' },
      confidence: { score: 0, reason: '' },
    };

    // Topic relevance (based on mentions and trend status)
    const mentionCount = await this.getMentionCount(workspaceId, topic.id);
    breakdown.topicRelevance.score = Math.min(100, mentionCount * 10);
    breakdown.topicRelevance.reason = `${mentionCount} mentions across sources`;

    // Audience relevance (based on ICP match)
    if (icp) {
      const icpMatch = this.checkICPMatch(topic, icp);
      breakdown.audienceRelevance.score = icpMatch ? 80 : 40;
      breakdown.audienceRelevance.reason = icpMatch 
        ? 'Topic aligns with ICP interests' 
        : 'Partial alignment with ICP';
    } else {
      breakdown.audienceRelevance.score = 50;
      breakdown.audienceRelevance.reason = 'No ICP configured';
    }

    // Timeliness (based on trend status and recency)
    if (signal.status === 'RISING' || signal.status === 'NEW') {
      breakdown.timeliness.score = 90;
      breakdown.timeliness.reason = `Topic is ${signal.status.toLowerCase()} with recent activity`;
    } else if (signal.status === 'SUSTAINED') {
      breakdown.timeliness.score = 70;
      breakdown.timeliness.reason = 'Topic has sustained interest';
    } else {
      breakdown.timeliness.score = 40;
      breakdown.timeliness.reason = 'Topic activity is stable or declining';
    }

    // Evidence strength (based on claim quality and quantity)
    const supportedClaims = claims.filter(c => c.status === 'SUPPORTED').length;
    const totalClaims = claims.length;
    breakdown.evidenceStrength.score = totalClaims > 0 
      ? Math.min(100, (supportedClaims / totalClaims) * 100)
      : 0;
    breakdown.evidenceStrength.reason = `${supportedClaims}/${totalClaims} claims supported by evidence`;

    // User expertise relevance (based on profile)
    if (profile) {
      const expertiseMatch = this.checkExpertiseMatch(topic, profile);
      breakdown.userExpertiseRelevance.score = expertiseMatch ? 90 : 50;
      breakdown.userExpertiseRelevance.reason = expertiseMatch
        ? 'User has relevant expertise'
        : 'Limited evidence of user expertise';
    } else {
      breakdown.userExpertiseRelevance.score = 50;
      breakdown.userExpertiseRelevance.reason = 'No profile configured';
    }

    // Novelty (based on how new the topic is)
    const topicAge = await this.getTopicAge(workspaceId, topic.id);
    if (topicAge < 7) { // Less than 7 days old
      breakdown.novelty.score = 90;
      breakdown.novelty.reason = 'Emerging topic with high novelty';
    } else if (topicAge < 30) {
      breakdown.novelty.score = 70;
      breakdown.novelty.reason = 'Relatively new topic';
    } else {
      breakdown.novelty.score = 40;
      breakdown.novelty.reason = 'Established topic';
    }

    // Source diversity
    const sourceDiversity = signal.source_diversity || 0;
    breakdown.sourceDiversity.score = Math.min(100, sourceDiversity * 20);
    breakdown.sourceDiversity.reason = `${sourceDiversity} unique sources discussing this topic`;

    // Conversation potential (based on contradictions and open questions)
    const contradictions = claims.filter(c => c.status === 'CONTRADICTED').length;
    breakdown.conversationPotential.score = Math.min(100, contradictions * 25 + 30);
    breakdown.conversationPotential.reason = `${contradictions} contradictions suggest discussion potential`;

    // Content saturation (inverse - less saturation = higher score)
    const existingContent = await this.getExistingContentCount(workspaceId, topic.id);
    breakdown.contentSaturation.score = Math.max(0, 100 - existingContent * 20);
    breakdown.contentSaturation.reason = `${existingContent} existing content pieces on this topic`;

    // Confidence (based on data quality)
    breakdown.confidence.score = (signal.confidence || 0.5) * 100;
    breakdown.confidence.reason = `Signal confidence: ${((signal.confidence || 0.5) * 100).toFixed(0)}%`;
    
    // Calculate base overall score (weighted average)
    const weights = {
      topicRelevance: 0.15,
      audienceRelevance: 0.15,
      timeliness: 0.15,
      evidenceStrength: 0.15,
      userExpertiseRelevance: 0.10,
      novelty: 0.10,
      sourceDiversity: 0.05,
      conversationPotential: 0.05,
      contentSaturation: 0.05,
      confidence: 0.05,
    };

    const baseScore = Object.entries(breakdown).reduce((sum, [key, value]) => {
      return sum + value.score * (weights[key as keyof typeof weights] || 0);
    }, 0);

    // Apply learning adjustment if patterns exist
    const learningAdjustment = await this.calculateLearningAdjustment(workspaceId, topic);
    const overallScore = baseScore + (learningAdjustment?.adjustment || 0);

    return {
      overallScore: Math.round(overallScore * 100) / 100,
      learningAdjustment,
      breakdown,
    };
  }

  /**
   * Calculate learning adjustment based on historical patterns
   */
  private async calculateLearningAdjustment(
    workspaceId: string,
    topic: Topic
  ): Promise<OpportunityScore['learningAdjustment'] | undefined> {
    try {
      // Query learning patterns for this workspace
      const patterns = await this.closedLoopRepo.getActivePatterns(workspaceId);
      
      if (patterns.length === 0) {
        return undefined; // No learning data yet
      }

      // Look for topic preference patterns
      const topicPatterns = patterns.filter(p => 
        p.pattern_type === 'topic_preference' && 
        p.pattern_data?.topic === topic.canonical_name
      );

      if (topicPatterns.length > 0) {
        const pattern = topicPatterns[0];
        const acceptanceRate = pattern.pattern_data?.acceptance_rate || 0.5;
        const observationCount = pattern.observation_count;
        
        // Calculate adjustment based on acceptance rate and confidence
        // Max adjustment: ±10 points
        const adjustment = (acceptanceRate - 0.5) * 20;
        
        // Determine confidence level based on observation count
        let confidence = 'INSUFFICIENT_DATA';
        if (observationCount >= 10) {
          confidence = 'STRONG_PATTERN';
        } else if (observationCount >= 5) {
          confidence = 'EMERGING_PATTERN';
        } else if (observationCount >= 3) {
          confidence = 'EARLY_SIGNAL';
        }

        return {
          adjustment: Math.round(adjustment * 100) / 100,
          reason: `${observationCount} historical opportunities on this topic with ${(acceptanceRate * 100).toFixed(0)}% acceptance rate`,
          supportingObservations: observationCount,
          confidence,
        };
      }

      return undefined;
    } catch (error) {
      console.error('Failed to calculate learning adjustment:', error);
      return undefined;
    }
  }
  /**
   * Generate detailed opportunity using AI
   */
  private async generateOpportunityDetails(
    workspaceId: string,
    topic: Topic,
    signal: TrendSignal,
    claims: SourceClaim[],
    sourceIds: string[],
    scoring: OpportunityScore,
    profile?: any,
    icp?: any
  ): Promise<ContentOpportunity> {
    const ai = getAIProvider();

    const claimTexts = claims.slice(0, 10).map(c => c.claim_text).join('\n- ');

    const prompt = `Analyze this topic and generate a content opportunity.

TOPIC: ${topic.canonical_name}
TREND STATUS: ${signal.status}
EVIDENCE:
- ${claimTexts || 'No specific claims available'}

${profile ? `USER PROFILE: ${profile.headline || profile.role || 'Unknown'}` : ''}
${icp ? `TARGET AUDIENCE: ${icp.target_roles?.join(', ') || 'Unknown'}` : ''}

Generate a content opportunity in JSON format:
{
  "thesis": "The core argument or perspective to take",
  "whyNow": "Why this is timely and relevant now",
  "audienceRelevance": "Why the target audience should care",
  "userRelevance": "Why this user specifically can speak to this",
  "evidenceStrength": "HIGH|MEDIUM|LOW",
  "noveltyScore": 0.0-1.0,
  "conversationPotential": 0.0-1.0,
  "recommendedAngle": "The specific angle to take",
  "recommendedObjective": "authority|education|awareness|conversation|lead_generation|trust|conversion",
  "recommendedFormat": "text_post|carousel|document|etc",
  "confidence": 0.0-1.0
}

Be specific and evidence-based. Do not invent information.`;

    try {
      const result = await ai.completeStructured<{
        thesis: string;
        whyNow: string;
        audienceRelevance: string;
        userRelevance: string;
        evidenceStrength: string;
        noveltyScore: number;
        conversationPotential: number;
        recommendedAngle: string;
        recommendedObjective: string;
        recommendedFormat: string;
        confidence: number;
      }>(prompt, {}, { temperature: 0.5 });

      // Persist opportunity
      const opportunity = await this.intelligenceRepo.createOpportunity(workspaceId, {
        topic_id: topic.id,
        topic_name: topic.canonical_name,
        thesis: result.thesis,
        why_now: result.whyNow,
        audience_relevance: result.audienceRelevance,
        user_relevance: result.userRelevance,
        evidence_strength: result.evidenceStrength,
        novelty_score: result.noveltyScore,
        conversation_potential: result.conversationPotential,
        source_ids: sourceIds,
        supporting_claim_ids: claims.map(c => c.id),
        recommended_angle: result.recommendedAngle,
        recommended_objective: result.recommendedObjective,
        recommended_format: result.recommendedFormat,
        confidence: result.confidence,
        status: 'DISCOVERED',
        overall_score: scoring.overallScore,
        scoring_breakdown: scoring.breakdown as any,
      });

      return opportunity;
    } catch (error) {
      // Fallback to basic opportunity without AI
      return await this.intelligenceRepo.createOpportunity(workspaceId, {
        topic_id: topic.id,
        topic_name: topic.canonical_name,
        thesis: `Content opportunity around ${topic.canonical_name}`,
        why_now: signal.status === 'RISING' ? 'Topic is currently rising in interest' : 'Topic has sustained interest',
        audience_relevance: 'Relevant to target audience',
        user_relevance: 'Aligns with user expertise',
        evidence_strength: claims.length > 5 ? 'HIGH' : claims.length > 2 ? 'MEDIUM' : 'LOW',
        novelty_score: 0.5,
        conversation_potential: 0.5,
        source_ids: sourceIds,
        supporting_claim_ids: claims.map(c => c.id),
        confidence: signal.confidence || 0.5,
        status: 'DISCOVERED',
        overall_score: scoring.overallScore,
        scoring_breakdown: scoring.breakdown as any,
      });
    }
  }

  // Helper methods
  private async getMentionCount(workspaceId: string, topicId: string): Promise<number> {
    const mentions = await this.intelligenceRepo.getMentionsByTopic(workspaceId, topicId);
    return mentions.length;
  }

  private checkICPMatch(topic: Topic, icp: any): boolean {
    const topicLower = topic.canonical_name.toLowerCase();
    const icpText = [
      ...(icp.target_roles || []),
      ...(icp.industries || []),
      ...(icp.problems || []),
    ].join(' ').toLowerCase();

    return icpText.includes(topicLower) || topicLower.split(' ').some(word => icpText.includes(word));
  }

  private checkExpertiseMatch(topic: Topic, profile: any): boolean {
    const topicLower = topic.canonical_name.toLowerCase();
    const profileText = [
      profile.headline || '',
      profile.role || '',
      profile.bio || '',
      ...(profile.proof_points || []),
    ].join(' ').toLowerCase();

    return profileText.includes(topicLower) || topicLower.split(' ').some(word => profileText.includes(word));
  }

  private async getTopicAge(workspaceId: string, topicId: string): Promise<number> {
    const topic = await this.intelligenceRepo.getTopic(workspaceId, topicId);
    if (!topic) return 999;
    
    const now = new Date();
    const created = new Date(topic.created_at);
    return (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // Days
  }

  private async getExistingContentCount(workspaceId: string, topicId: string): Promise<number> {
    // Check how many content ideas/drafts exist for this topic
    const result = await this.pool.query(
      `SELECT COUNT(*) FROM content_ideas 
       WHERE workspace_id = $1 
       AND (pillar ILIKE $2 OR title ILIKE $2)`,
      [workspaceId, `%${topicId}%`]
    );
    return parseInt(result.rows[0].count) || 0;
  }
}
