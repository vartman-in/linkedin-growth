/**
 * Quality Validation Service
 * Validates content against quality gates and rules
 */

import { ContentDraft, QualityIssue, AIContext, Source, Claim } from './index';

export class QualityService {
  /**
   * Validate a draft against all quality gates
   */
  async validateDraft(draft: ContentDraft, context: AIContext): Promise<{
    score: number;
    status: 'pass' | 'review_required' | 'blocked';
    issues: QualityIssue[];
  }> {
    const issues: QualityIssue[] = [];
    let score = 100;

    // Run all quality checks
    const thesisCheck = await this.checkThesisFidelity(draft, context);
    if (!thesisCheck.pass) {
      issues.push(thesisCheck.issue!);
      score -= 20;
    }

    const sourceCheck = await this.checkSourceFidelity(draft, draft.metadata.sources);
    if (!sourceCheck.pass) {
      issues.push(sourceCheck.issue!);
      score -= 15;
    }

    const unsupportedClaims = await this.detectUnsupportedClaims(draft);
    if (unsupportedClaims.length > 0) {
      issues.push({
        type: 'unsupported_claim',
        severity: 'critical',
        message: `${unsupportedClaims.length} unsupported claim(s) detected`
      });
      score -= 25;
    }

    const personaLeakage = await this.detectPersonaLeakage(draft, context);
    if (personaLeakage) {
      issues.push({
        type: 'persona_leakage',
        severity: 'critical',
        message: 'ICP information leaked into content as personal experience'
      });
      score -= 30;
    }

    const voiceCheck = await this.checkVoiceConsistency(draft, context);
    if (!voiceCheck.pass) {
      issues.push(voiceCheck.issue!);
      score -= 10;
    }

    const bannedWords = await this.checkBannedWords(draft, context);
    if (bannedWords.length > 0) {
      issues.push({
        type: 'banned_word',
        severity: 'warning',
        message: `Banned words detected: ${bannedWords.join(', ')}`
      });
      score -= 5;
    }

    const duplicates = await this.detectDuplicateContent(draft);
    if (duplicates) {
      issues.push({
        type: 'duplicate_content',
        severity: 'warning',
        message: 'Duplicate sentences or sections detected'
      });
      score -= 10;
    }

    const contradictions = await this.checkSourceContradictions(draft);
    if (contradictions.length > 0) {
      issues.push({
        type: 'source_contradiction',
        severity: 'critical',
        message: `${contradictions.length} source contradiction(s) detected`
      });
      score -= 20;
    }

    // Determine status
    let status: 'pass' | 'review_required' | 'blocked' = 'pass';
    
    // Critical issues block publication
    if (issues.some(i => i.severity === 'critical')) {
      status = 'blocked';
    } else if (issues.length > 0) {
      status = 'review_required';
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    return { score, status, issues };
  }

  /**
   * Check thesis fidelity
   */
  async checkThesisFidelity(
    draft: ContentDraft,
    context: AIContext
  ): Promise<{ pass: boolean; issue?: QualityIssue }> {
    // Placeholder - will implement semantic similarity check
    // For now, always pass
    return { pass: true };
  }

  /**
   * Check source fidelity
   */
  async checkSourceFidelity(
    draft: ContentDraft,
    sources: Source[]
  ): Promise<{ pass: boolean; issue?: QualityIssue }> {
    // Check if draft accurately represents sources
    // Placeholder - will implement actual checking
    return { pass: true };
  }

  /**
   * Detect unsupported claims
   */
  async detectUnsupportedClaims(draft: ContentDraft): Promise<Claim[]> {
    // Find claims with low confidence or unavailable status
    return draft.metadata.claims.filter(
      c => c.confidence < 0.5 || c.status === 'unavailable'
    );
  }

  /**
   * Detect persona/ICP leakage
   */
  async detectPersonaLeakage(
    draft: ContentDraft,
    context: AIContext
  ): Promise<boolean> {
    // Check if ICP information is presented as personal experience
    // Placeholder - will implement actual detection
    return false;
  }

  /**
   * Check voice consistency
   */
  async checkVoiceConsistency(
    draft: ContentDraft,
    context: AIContext
  ): Promise<{ pass: boolean; issue?: QualityIssue }> {
    // Check if content matches voice profile
    // Placeholder - will implement actual checking
    return { pass: true };
  }

  /**
   * Check for banned words
   */
  async checkBannedWords(
    draft: ContentDraft,
    context: AIContext
  ): Promise<string[]> {
    const bannedWords = context.voice?.banned_words || [];
    const content = draft.content.toLowerCase();
    
    return bannedWords.filter(word => 
      content.includes(word.toLowerCase())
    );
  }

  /**
   * Detect duplicate content
   */
  async detectDuplicateContent(draft: ContentDraft): Promise<boolean> {
    // Check for duplicate sentences or sections
    const sentences = draft.content.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
    const seen = new Set<string>();
    
    for (const sentence of sentences) {
      const normalized = sentence.toLowerCase().trim();
      if (seen.has(normalized)) {
        return true;
      }
      seen.add(normalized);
    }
    
    return false;
  }

  /**
   * Check for source contradictions
   */
  async checkSourceContradictions(draft: ContentDraft): Promise<any[]> {
    // Check if draft contains contradictory claims from sources
    // Placeholder - will implement actual checking
    return [];
  }

  /**
   * Check hook relevance
   */
  async checkHookRelevance(draft: ContentDraft): Promise<boolean> {
    // Check if hook is semantically connected to thesis
    // Placeholder - will implement actual checking
    return true;
  }

  /**
   * Check narrative coherence
   */
  async checkNarrativeCoherence(draft: ContentDraft): Promise<boolean> {
    // Check if narrative structure is coherent
    // Placeholder - will implement actual checking
    return true;
  }

  /**
   * Check CTA relevance
   */
  async checkCTARelevance(draft: ContentDraft): Promise<boolean> {
    // Check if CTA matches objective
    // Placeholder - will implement actual checking
    return true;
  }

  /**
   * Check content completeness
   */
  async checkContentCompleteness(draft: ContentDraft): Promise<boolean> {
    // Check if content is complete and not truncated
    return draft.content.length > 0 && !draft.content.includes('[TODO]');
  }
}

export const qualityService = new QualityService();
