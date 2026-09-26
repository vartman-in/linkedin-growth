/**
 * Source Understanding Service
 * AI-assisted analysis of source content to extract meaning, claims, and insights
 */

import { Pool } from 'pg';
import { getAIProvider } from '../../ai/provider';
import { IntelligenceRepository } from '../../repositories/intelligence.repository';
import { SourceDocument, SourceClaim, Topic, TopicMention } from '../../models/types';

export interface SourceUnderstanding {
  summary: string;
  centralThesis: string;
  keyObservations: string[];
  claims: Array<{
    text: string;
    type: 'fact' | 'opinion' | 'statistic' | 'prediction';
    confidence: number;
    evidenceLocation?: string;
  }>;
  uncertainties: string[];
  contradictions: string[];
  entities: string[];
  topics: string[];
  audienceRelevance: string;
  implications: string[];
  openQuestions: string[];
  potentialAngles: string[];
}

export class SourceUnderstandingService {
  private intelligenceRepo: IntelligenceRepository;

  constructor(private pool: Pool) {
    this.intelligenceRepo = new IntelligenceRepository(pool);
  }

  /**
   * Analyze a source document using AI
   */
  async understandSource(workspaceId: string, document: SourceDocument): Promise<SourceUnderstanding> {
    const ai = getAIProvider();

    const prompt = `Analyze this content and extract structured intelligence.

TITLE: ${document.title || 'Unknown'}
AUTHOR: ${document.author || 'Unknown'}
PUBLISHER: ${document.publisher || 'Unknown'}
DATE: ${document.publication_date || 'Unknown'}

CONTENT:
${document.cleaned_body?.substring(0, 10000) || 'No content available'}

Provide a comprehensive analysis in JSON format:
{
  "summary": "2-3 sentence summary of the main points",
  "centralThesis": "The core argument or message",
  "keyObservations": ["observation 1", "observation 2", ...],
  "claims": [
    {
      "text": "The specific claim",
      "type": "fact|opinion|statistic|prediction",
      "confidence": 0.0-1.0,
      "evidenceLocation": "where in the text this appears"
    }
  ],
  "uncertainties": ["things that are unclear or speculative"],
  "contradictions": ["internal contradictions or conflicts with known facts"],
  "entities": ["people", "organizations", "products", "technologies mentioned"],
  "topics": ["main topics discussed"],
  "audienceRelevance": "Who would find this relevant and why",
  "implications": ["what this means for the audience"],
  "openQuestions": ["questions raised but not answered"],
  "potentialAngles": ["potential content angles this suggests"]
}

Be precise and evidence-based. Do not invent information not present in the source.
Preserve uncertainty - if something is speculative, mark it as such.`;

    try {
      const result = await ai.completeStructured<SourceUnderstanding>(prompt, {}, {
        temperature: 0.3,
        maxTokens: 4000,
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to understand source: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract claims from understanding and persist them
   */
  async extractAndPersistClaims(
    workspaceId: string,
    sourceId: string,
    documentId: string,
    understanding: SourceUnderstanding
  ): Promise<SourceClaim[]> {
    const claims: SourceClaim[] = [];

    for (const claim of understanding.claims) {
      const persistedClaim = await this.intelligenceRepo.createClaim(workspaceId, sourceId, {
        document_id: documentId,
        claim_text: claim.text,
        evidence_location: claim.evidenceLocation || null,
        claim_type: claim.type,
        confidence: claim.confidence,
        status: claim.confidence > 0.7 ? 'SUPPORTED' : claim.confidence > 0.4 ? 'UNCERTAIN' : 'UNAVAILABLE',
        extracted_by: 'ai',
        metadata: {
          understanding_version: '1.0',
        },
      });
      claims.push(persistedClaim);
    }

    return claims;
  }

  /**
   * Extract and persist topics from understanding
   */
  async extractAndPersistTopics(
    workspaceId: string,
    sourceId: string,
    understanding: SourceUnderstanding
  ): Promise<Array<{ topic: Topic; mention: TopicMention }>> {
    const results: Array<{ topic: Topic; mention: TopicMention }> = [];

    for (const topicName of understanding.topics) {
      // Find or create topic
      let topic = await this.intelligenceRepo.findTopicByName(workspaceId, topicName);
      
      if (!topic) {
        topic = await this.intelligenceRepo.createTopic(workspaceId, topicName, []);
      }

      // Create mention
      const mention = await this.intelligenceRepo.createTopicMention(workspaceId, topic.id, sourceId, {
        relevance_score: 0.8, // Default relevance for extracted topics
        context: understanding.summary,
        metadata: {
          extracted_from: 'understanding',
        },
      });

      results.push({ topic, mention });
    }

    return results;
  }

  /**
   * Full analysis pipeline: understand, extract claims, extract topics
   */
  async analyzeSource(workspaceId: string, sourceId: string, documentId: string): Promise<{
    understanding: SourceUnderstanding;
    claims: SourceClaim[];
    topics: Array<{ topic: Topic; mention: TopicMention }>;
  }> {
    // Get document
    const document = await this.intelligenceRepo.getDocument(workspaceId, documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Understand source
    const understanding = await this.understandSource(workspaceId, document);

    // Extract and persist claims
    const claims = await this.extractAndPersistClaims(workspaceId, sourceId, documentId, understanding);

    // Extract and persist topics
    const topics = await this.extractAndPersistTopics(workspaceId, sourceId, understanding);

    return { understanding, claims, topics };
  }

  /**
   * Batch analyze multiple sources
   */
  async batchAnalyze(workspaceId: string, documents: SourceDocument[]): Promise<{
    successful: Array<{
      sourceId: string;
      understanding: SourceUnderstanding;
      claims: SourceClaim[];
      topics: Array<{ topic: Topic; mention: TopicMention }>;
    }>;
    failed: Array<{ sourceId: string; error: string }>;
  }> {
    const successful: Array<{
      sourceId: string;
      understanding: SourceUnderstanding;
      claims: SourceClaim[];
      topics: Array<{ topic: Topic; mention: TopicMention }>;
    }> = [];
    const failed: Array<{ sourceId: string; error: string }> = [];

    for (const document of documents) {
      try {
        const result = await this.analyzeSource(workspaceId, document.source_id, document.id);
        successful.push({
          sourceId: document.source_id,
          ...result,
        });
      } catch (error) {
        failed.push({
          sourceId: document.source_id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { successful, failed };
  }
}
