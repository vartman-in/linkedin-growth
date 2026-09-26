/**
 * Content Gap Engine
 * Identifies gaps in existing content and discussion
 */

import { Pool } from 'pg';
import { getAIProvider } from '../../ai/provider';
import { IntelligenceRepository } from '../../repositories/intelligence.repository';
import { Topic, ContentGap, SourceClaim, TopicMention } from '../../models/types';

export class ContentGapService {
  private intelligenceRepo: IntelligenceRepository;

  constructor(private pool: Pool) {
    this.intelligenceRepo = new IntelligenceRepository(pool);
  }

  /**
   * Detect content gaps for a workspace
   */
  async detectGaps(workspaceId: string): Promise<ContentGap[]> {
    const topics = await this.intelligenceRepo.getTopicsByWorkspace(workspaceId);
    const gaps: ContentGap[] = [];

    for (const topic of topics) {
      const topicGaps = await this.analyzeTopicGaps(workspaceId, topic);
      gaps.push(...topicGaps);
    }

    return gaps;
  }

  /**
   * Analyze gaps for a specific topic
   */
  async analyzeTopicGaps(workspaceId: string, topic: Topic): Promise<ContentGap[]> {
    const gaps: ContentGap[] = [];

    // Get all mentions and claims for this topic
    const mentions = await this.intelligenceRepo.getMentionsByTopic(workspaceId, topic.id);
    const sourceIds = [...new Set(mentions.map(m => m.source_id))];
    
    const claims: SourceClaim[] = [];
    for (const sourceId of sourceIds.slice(0, 20)) {
      const sourceClaims = await this.intelligenceRepo.getClaimsBySource(workspaceId, sourceId);
      claims.push(...sourceClaims);
    }

    // Gap Type 1: Unanswered Questions
    const questionGap = await this.detectUnansweredQuestions(workspaceId, topic, claims);
    if (questionGap) gaps.push(questionGap);

    // Gap Type 2: Missing Practical Implementation
    const implementationGap = await this.detectImplementationGaps(workspaceId, topic, claims);
    if (implementationGap) gaps.push(implementationGap);

    // Gap Type 3: Contradictory Narratives
    const contradictionGap = await this.detectContradictionGaps(workspaceId, topic, claims);
    if (contradictionGap) gaps.push(contradictionGap);

    // Gap Type 4: Evidence Gaps
    const evidenceGap = await this.detectEvidenceGaps(workspaceId, topic, claims);
    if (evidenceGap) gaps.push(evidenceGap);

    return gaps;
  }

  /**
   * Detect unanswered questions in the discussion
   */
  private async detectUnansweredQuestions(
    workspaceId: string,
    topic: Topic,
    claims: SourceClaim[]
  ): Promise<ContentGap | null> {
    // Look for claims that are questions or express uncertainty
    const uncertainClaims = claims.filter(c => 
      c.claim_text.includes('?') || 
      c.claim_text.toLowerCase().includes('unclear') ||
      c.claim_text.toLowerCase().includes('unknown') ||
      c.claim_text.toLowerCase().includes('question')
    );

    if (uncertainClaims.length === 0) {
      return null;
    }

    const ai = getAIProvider();

    try {
      const prompt = `Analyze these claims about "${topic.canonical_name}" and identify unanswered questions.

CLAIMS:
${uncertainClaims.map(c => `- ${c.claim_text}`).join('\n')}

Identify the main unanswered question in JSON format:
{
  "question": "The specific unanswered question",
  "evidence": ["claim 1", "claim 2"],
  "opportunity": "Why answering this would be valuable",
  "confidence": 0.0-1.0
}`;

      const result = await ai.completeStructured<{
        question: string;
        evidence: string[];
        opportunity: string;
        confidence: number;
      }>(prompt, {}, { temperature: 0.3 });

      return await this.intelligenceRepo.createGap(workspaceId, {
        topic_id: topic.id,
        topic_name: topic.canonical_name,
        gap_type: 'unanswered_question',
        unanswered_question: result.question,
        evidence: {
          sourceClaims: uncertainClaims.map(c => c.id),
          supportingText: result.evidence,
        },
        opportunity_description: result.opportunity,
        confidence: result.confidence,
        source_ids: [...new Set(uncertainClaims.map(c => c.source_id))],
      });
    } catch (error) {
      return null;
    }
  }

  /**
   * Detect gaps in practical implementation guidance
   */
  private async detectImplementationGaps(
    workspaceId: string,
    topic: Topic,
    claims: SourceClaim[]
  ): Promise<ContentGap | null> {
    // Look for theoretical/strategic claims without practical guidance
    const theoreticalClaims = claims.filter(c => 
      c.claim_text.toLowerCase().includes('should') ||
      c.claim_text.toLowerCase().includes('need to') ||
      c.claim_text.toLowerCase().includes('must') ||
      c.claim_text.toLowerCase().includes('important to')
    );

    const practicalClaims = claims.filter(c => 
      c.claim_text.toLowerCase().includes('step') ||
      c.claim_text.toLowerCase().includes('how to') ||
      c.claim_text.toLowerCase().includes('example') ||
      c.claim_text.toLowerCase().includes('tutorial')
    );

    // If we have theoretical claims but few practical ones, there's a gap
    if (theoreticalClaims.length > 3 && practicalClaims.length < 2) {
      return await this.intelligenceRepo.createGap(workspaceId, {
        topic_id: topic.id,
        topic_name: topic.canonical_name,
        gap_type: 'implementation_gap',
        observed_narrative: `Discussion focuses on theory (${theoreticalClaims.length} theoretical claims) but lacks practical guidance (${practicalClaims.length} practical claims)`,
        missing_perspective: 'Practical implementation steps and examples',
        evidence: {
          theoreticalCount: theoreticalClaims.length,
          practicalCount: practicalClaims.length,
          theoreticalExamples: theoreticalClaims.slice(0, 3).map(c => c.claim_text),
        },
        opportunity_description: 'Create practical implementation guide with step-by-step instructions',
        confidence: Math.min(1.0, (theoreticalClaims.length - practicalClaims.length) / 10),
        source_ids: [...new Set([...theoreticalClaims, ...practicalClaims].map(c => c.source_id))],
      });
    }

    return null;
  }

  /**
   * Detect gaps from contradictory narratives
   */
  private async detectContradictionGaps(
    workspaceId: string,
    topic: Topic,
    claims: SourceClaim[]
  ): Promise<ContentGap | null> {
    const contradictions = claims.filter(c => c.status === 'CONTRADICTED');

    if (contradictions.length < 2) {
      return null;
    }

    return await this.intelligenceRepo.createGap(workspaceId, {
      topic_id: topic.id,
      topic_name: topic.canonical_name,
      gap_type: 'contradictory_narrative',
      observed_narrative: `Multiple contradictory claims exist about ${topic.canonical_name}`,
      missing_perspective: 'Resolution or analysis of the contradictions',
      evidence: {
        contradictionCount: contradictions.length,
        contradictions: contradictions.slice(0, 5).map(c => ({
          text: c.claim_text,
          source: c.source_id,
        })),
      },
      opportunity_description: 'Analyze and resolve the contradictions with evidence-based perspective',
      confidence: Math.min(1.0, contradictions.length / 5),
      source_ids: [...new Set(contradictions.map(c => c.source_id))],
    });
  }

  /**
   * Detect gaps in evidence quality
   */
  private async detectEvidenceGaps(
    workspaceId: string,
    topic: Topic,
    claims: SourceClaim[]
  ): Promise<ContentGap | null> {
    const unsupportedClaims = claims.filter(c => 
      c.status === 'UNAVAILABLE' || c.status === 'UNCERTAIN'
    );

    const supportedClaims = claims.filter(c => c.status === 'SUPPORTED');

    // If we have many unsupported claims, there's an evidence gap
    if (unsupportedClaims.length > 3 && supportedClaims.length < unsupportedClaims.length) {
      return await this.intelligenceRepo.createGap(workspaceId, {
        topic_id: topic.id,
        topic_name: topic.canonical_name,
        gap_type: 'evidence_gap',
        observed_narrative: `Many claims about ${topic.canonical_name} lack strong evidence`,
        missing_perspective: 'Well-supported claims with verifiable evidence',
        evidence: {
          unsupportedCount: unsupportedClaims.length,
          supportedCount: supportedClaims.length,
          unsupportedExamples: unsupportedClaims.slice(0, 3).map(c => c.claim_text),
        },
        opportunity_description: 'Provide evidence-backed analysis with verified sources',
        confidence: Math.min(1.0, unsupportedClaims.length / 10),
        source_ids: [...new Set(unsupportedClaims.map(c => c.source_id))],
      });
    }

    return null;
  }

  /**
   * Get gaps for a specific topic
   */
  async getGapsForTopic(workspaceId: string, topicId: string): Promise<ContentGap[]> {
    return await this.intelligenceRepo.getGapsByTopic(workspaceId, topicId);
  }

  /**
   * Get top gaps by confidence
   */
  async getTopGaps(workspaceId: string, limit: number = 10): Promise<ContentGap[]> {
    const gaps = await this.intelligenceRepo.getGapsByWorkspace(workspaceId, limit);
    return gaps.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  }
}
