/**
 * AI Service Layer - Core Intelligence Services
 * 
 * This module provides the foundation for all AI-powered features:
 * - Research Intelligence
 * - Source Understanding
 * - Content Strategy
 * - Writing & Generation
 * - Quality Validation
 * - Learning & Adaptation
 */

export interface AIContext {
  workspaceId: string;
  userId?: string;
  profile?: any;
  voice?: any;
  icp?: any;
  audience?: any;
  pillars?: any[];
  proofPoints?: any[];
  experiences?: any[];
  contentHistory?: any[];
}

export interface ResearchResult {
  topic: string;
  sources: Source[];
  claims: Claim[];
  contradictions: Contradiction[];
  evidence: Evidence[];
  confidence: number;
}

export interface Source {
  id: string;
  url?: string;
  title: string;
  author?: string;
  date?: string;
  content: string;
  type: 'web' | 'document' | 'user_input' | 'trend';
  extractedAt: Date;
}

export interface Claim {
  id: string;
  text: string;
  sourceId: string;
  type: 'fact' | 'opinion' | 'statistic' | 'experience';
  confidence: number;
  status: 'supported' | 'contested' | 'contradicted' | 'unsupported' | 'unavailable';
  evidence: string[];
}

export interface Contradiction {
  claim1Id: string;
  claim2Id: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface Evidence {
  id: string;
  claimId: string;
  text: string;
  sourceId: string;
  type: 'direct_quote' | 'paraphrase' | 'inference';
}

export interface ContentStrategy {
  objective: 'authority' | 'education' | 'awareness' | 'conversation' | 'lead_generation' | 'trust' | 'conversion';
  audience: string;
  angle: 'educational' | 'contrarian' | 'practical' | 'analytical' | 'story' | 'framework' | 'observation' | 'case_study';
  format: 'text_post' | 'carousel' | 'document' | 'image_post' | 'poll' | 'short_form' | 'thread' | 'case_study' | 'checklist' | 'framework' | 'how_to' | 'opinion' | 'analysis';
  narrative: string;
  hook: string;
  keyPoints: string[];
  cta?: string;
}

export interface ContentDraft {
  id: string;
  title: string;
  content: string;
  format: string;
  hook?: string;
  cta?: string;
  slides?: CarouselSlide[];
  metadata: {
    strategy: ContentStrategy;
    claims: Claim[];
    sources: Source[];
    qualityScore: number;
    qualityStatus: 'pass' | 'review_required' | 'blocked';
    qualityIssues: QualityIssue[];
  };
}

export interface CarouselSlide {
  slideNumber: number;
  purpose: string;
  headline: string;
  body: string;
  evidence?: string;
  visualDirection?: string;
  sourceReference?: string;
}

export interface QualityIssue {
  type: 'thesis_drift' | 'source_fidelity' | 'unsupported_claim' | 'invented_statistic' | 'invented_experience' | 'persona_leakage' | 'icp_leakage' | 'voice_inconsistency' | 'banned_word' | 'duplicate_content' | 'malformed_output' | 'generic_filler' | 'hook_irrelevance' | 'narrative_incoherence' | 'cta_irrelevance' | 'source_contradiction' | 'incomplete_content';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  location?: string;
}

export interface LearningSignal {
  type: 'edit' | 'rejection' | 'regeneration' | 'selection' | 'performance' | 'response' | 'objection';
  data: any;
  timestamp: Date;
  confidence: number;
}

/**
 * Research Intelligence Service
 * Fetches and analyzes sources
 */
export class ResearchService {
  async research(topic: string, context: AIContext): Promise<ResearchResult> {
    // Placeholder - will implement actual research logic
    return {
      topic,
      sources: [],
      claims: [],
      contradictions: [],
      evidence: [],
      confidence: 0
    };
  }

  async fetchSource(url: string): Promise<Source> {
    // Placeholder - will implement actual fetching with SSRF protection
    throw new Error('Source fetching not yet implemented');
  }

  async extractClaims(source: Source): Promise<Claim[]> {
    // Placeholder - will implement claim extraction
    return [];
  }

  async detectContradictions(claims: Claim[]): Promise<Contradiction[]> {
    // Placeholder - will implement contradiction detection
    return [];
  }
}

/**
 * Content Strategy Service
 * Determines optimal content approach
 */
export class StrategyService {
  async determineStrategy(
    topic: string,
    research: ResearchResult,
    context: AIContext
  ): Promise<ContentStrategy> {
    // Placeholder - will implement strategy determination
    return {
      objective: 'education',
      audience: context.icp?.target_roles?.[0] || 'general',
      angle: 'educational',
      format: 'text_post',
      narrative: 'problem_solution',
      hook: '',
      keyPoints: [],
      cta: ''
    };
  }

  async generateHook(strategy: ContentStrategy, context: AIContext): Promise<string> {
    // Placeholder - will implement hook generation
    return '';
  }

  async selectFormat(strategy: ContentStrategy, context: AIContext): Promise<string> {
    // Placeholder - will implement format selection
    return 'text_post';
  }
}

/**
 * Writing Service
 * Generates content based on strategy and research
 */
export class WritingService {
  async generateDraft(
    strategy: ContentStrategy,
    research: ResearchResult,
    context: AIContext
  ): Promise<ContentDraft> {
    // Placeholder - will implement draft generation
    return {
      id: '',
      title: '',
      content: '',
      format: strategy.format,
      metadata: {
        strategy,
        claims: research.claims,
        sources: research.sources,
        qualityScore: 0,
        qualityStatus: 'review_required',
        qualityIssues: []
      }
    };
  }

  async generateCarousel(
    strategy: ContentStrategy,
    research: ResearchResult,
    context: AIContext
  ): Promise<CarouselSlide[]> {
    // Placeholder - will implement carousel generation
    return [];
  }

  async reviseDraft(
    draft: ContentDraft,
    feedback: string,
    context: AIContext
  ): Promise<ContentDraft> {
    // Placeholder - will implement revision
    return draft;
  }
}

/**
 * Quality Validation Service
 * Validates content against quality gates
 */
export class QualityService {
  async validateDraft(draft: ContentDraft, context: AIContext): Promise<{
    score: number;
    status: 'pass' | 'review_required' | 'blocked';
    issues: QualityIssue[];
  }> {
    // Placeholder - will implement quality validation
    return {
      score: 0,
      status: 'review_required',
      issues: []
    };
  }

  async checkThesisFidelity(draft: ContentDraft, originalThesis: string): Promise<boolean> {
    // Placeholder - will implement thesis fidelity check
    return true;
  }

  async checkSourceFidelity(draft: ContentDraft, sources: Source[]): Promise<boolean> {
    // Placeholder - will implement source fidelity check
    return true;
  }

  async detectUnsupportedClaims(draft: ContentDraft): Promise<Claim[]> {
    // Placeholder - will implement unsupported claim detection
    return [];
  }

  async detectPersonaLeakage(draft: ContentDraft, context: AIContext): Promise<boolean> {
    // Placeholder - will implement persona leakage detection
    return false;
  }
}

/**
 * Learning Service
 * Adapts based on user feedback and performance
 */
export class LearningService {
  async recordSignal(signal: LearningSignal, context: AIContext): Promise<void> {
    // Placeholder - will implement signal recording
  }

  async getLearnings(context: AIContext): Promise<any> {
    // Placeholder - will implement learning retrieval
    return {};
  }

  async adaptStrategy(learnings: any, context: AIContext): Promise<Partial<ContentStrategy>> {
    // Placeholder - will implement strategy adaptation
    return {};
  }
}

// Re-export services
export { researchService } from './research.service';
export { strategyService } from './strategy.service';
export { writingService } from './writing.service';
export { qualityService } from './quality.service';
export { learningService } from './learning.service';

// Export singleton instances
import { ResearchService } from './research.service';
import { StrategyService } from './strategy.service';
import { WritingService } from './writing.service';
import { QualityService } from './quality.service';
import { LearningService } from './learning.service';

export const research = new ResearchService();
export const strategy = new StrategyService();
export const writing = new WritingService();
export const quality = new QualityService();
export const learning = new LearningService();
