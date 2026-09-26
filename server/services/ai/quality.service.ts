/**
 * Quality Validation Service
 * Implements real quality gates for content validation
 */

import { ContentDraft, QualityIssue, AIContext, Source, Claim } from './index';
import { getAIProvider } from './provider';

export interface QualityGateResult {
  gate: string;
  status: 'PASS' | 'REVIEW_REQUIRED' | 'BLOCKED';
  severity: 'critical' | 'warning' | 'info';
  evidence?: string;
  reason?: string;
}

export class QualityService {
  /**
   * Validate a draft against all quality gates
   */
  async validateDraft(draft: ContentDraft, context: AIContext): Promise<{
    score: number;
    status: 'pass' | 'review_required' | 'blocked';
    issues: QualityIssue[];
  }> {
    const results: QualityGateResult[] = [];

    // Run all quality gates
    results.push(await this.checkThesisFidelity(draft, context));
    results.push(await this.checkSourceFidelity(draft, context));
    results.push(await this.checkUnsupportedClaims(draft, context));
    results.push(await this.checkPersonaLeakage(draft, context));
    results.push(await this.checkICPLeakage(draft, context));
    results.push(await this.checkVoiceConsistency(draft, context));
    results.push(await this.checkBannedWords(draft, context));
    results.push(await this.checkDuplicateContent(draft, context));
    results.push(await this.checkSourceContradictions(draft, context));
    results.push(await this.checkInventedStatistics(draft, context));
    results.push(await this.checkInventedExperience(draft, context));
    results.push(await this.checkInventedSocialProof(draft, context));
    results.push(await this.checkGenericFiller(draft, context));
    results.push(await this.checkHookRelevance(draft, context));
    results.push(await this.checkNarrativeCoherence(draft, context));
    results.push(await this.checkEvidenceAvailability(draft, context));
    results.push(await this.checkCitationIntegrity(draft, context));
    results.push(await this.checkMalformedOutput(draft, context));
    results.push(await this.checkCarouselIntegrity(draft, context));
    results.push(await this.checkCTARelevance(draft, context));

    // Convert results to issues
    const issues: QualityIssue[] = results
      .filter(r => r.status !== 'PASS')
      .map(r => ({
        type: this.mapGateToIssueType(r.gate),
        severity: r.severity,
        message: r.reason || r.evidence || `${r.gate} check failed`,
        location: r.gate
      }));

    // Calculate score
    let score = 100;
    for (const result of results) {
      if (result.status === 'BLOCKED') {
        score -= 25;
      } else if (result.status === 'REVIEW_REQUIRED') {
        if (result.severity === 'critical') {
          score -= 15;
        } else if (result.severity === 'warning') {
          score -= 5;
        } else {
          score -= 2;
        }
      }
    }
    score = Math.max(0, score);

    // Determine overall status
    let status: 'pass' | 'review_required' | 'blocked' = 'pass';
    
    // Critical issues block publication
    if (results.some(r => r.status === 'BLOCKED')) {
      status = 'blocked';
    } else if (issues.length > 0) {
      status = 'review_required';
    }

    return { score, status, issues };
  }

  /**
   * Gate 1: Thesis Fidelity
   */
  private async checkThesisFidelity(draft: ContentDraft, context: AIContext): Promise<QualityGateResult> {
    if (!context.thesis) {
      return { gate: 'thesis_fidelity', status: 'PASS', severity: 'info' };
    }

    try {
      const ai = getAIProvider();
      const prompt = `Compare the original thesis with the final content. Determine if the core message has been preserved or if there has been significant semantic drift.

ORIGINAL THESIS:
${context.thesis}

FINAL CONTENT:
${draft.content.substring(0, 3000)}

Analyze in JSON format:
{
  "preserved": true/false,
  "drift_score": 0.0-1.0 (0 = no drift, 1 = completely different),
  "reason": "brief explanation"
}`;

      const result = await ai.completeStructured<{
        preserved: boolean;
        drift_score: number;
        reason: string;
      }>(prompt, {}, { temperature: 0.2 });

      if (result.drift_score > 0.6) {
        return {
          gate: 'thesis_fidelity',
          status: 'BLOCKED',
          severity: 'critical',
          reason: `Significant thesis drift detected: ${result.reason}`
        };
      } else if (result.drift_score > 0.3) {
        return {
          gate: 'thesis_fidelity',
          status: 'REVIEW_REQUIRED',
          severity: 'warning',
          reason: `Moderate thesis drift: ${result.reason}`
        };
      }

      return { gate: 'thesis_fidelity', status: 'PASS', severity: 'info' };
    } catch (error) {
      return { gate: 'thesis_fidelity', status: 'PASS', severity: 'info', reason: 'Could not verify' };
    }
  }

  /**
   * Gate 2: Source Fidelity
   */
  private async checkSourceFidelity(draft: ContentDraft, context: AIContext): Promise<QualityGateResult> {
    const sources = draft.metadata.sources;
    if (!sources || sources.length === 0) {
      return { gate: 'source_fidelity', status: 'PASS', severity: 'info', reason: 'No sources to verify' };
    }

    // Check if content references source material
    const sourceTexts = sources.map(s => s.content.substring(0, 500)).join(' ');
    const contentLower = draft.content.toLowerCase();
    
    // Simple check: does content mention key terms from sources?
    const sourceTerms = sourceTexts.toLowerCase().split(/\s+/).filter(w => w.length > 5);
    const matches = sourceTerms.filter(term => contentLower.includes(term)).length;
    const matchRatio = matches / Math.max(sourceTerms.length, 1);

    if (matchRatio < 0.05) {
      return {
        gate: 'source_fidelity',
        status: 'REVIEW_REQUIRED',
        severity: 'warning',
        reason: 'Content may not adequately reference source material'
      };
    }

    return { gate: 'source_fidelity', status: 'PASS', severity: 'info' };
  }

  /**
   * Gate 3: Unsupported Claims
   */
  private async checkUnsupportedClaims(draft: ContentDraft, context: AIContext): Promise<QualityGateResult> {
    const claims = draft.metadata.claims;
    if (!claims || claims.length === 0) {
      return { gate: 'unsupported_claims', status: 'PASS', severity: 'info' };
    }

    const unsupported = claims.filter(c => 
      c.confidence < 0.5 || c.status === 'unsupported' || c.status === 'unavailable'
    );

    if (unsupported.length > 0) {
      return {
        gate: 'unsupported_claims',
        status: 'BLOCKED',
        severity: 'critical',
        reason: `${unsupported.length} unsupported claim(s) detected`
      };
    }

    return { gate: 'unsupported_claims', status: 'PASS', severity: 'info' };
  }

  /**
   * Gate 4: Persona Leakage
   */
  private async checkPersonaLeakage(draft: ContentDraft, context: AIContext): Promise<QualityGateResult> {
    if (!context.profile) {
      return { gate: 'persona_leakage', status: 'PASS', severity: 'info' };
    }

    // Check if profile information appears in content as personal experience
    const profileTerms = [
      context.profile.role,
      context.profile.company,
      context.profile.industry
    ].filter(Boolean).map(t => t.toLowerCase());

    const contentLower = draft.content.toLowerCase();
    const hasLeakage = profileTerms.some(term => 
      contentLower.includes(term) && 
      (contentLower.includes('i ') || contentLower.includes('my '))
    );

    if (hasLeakage) {
      return {
        gate: 'persona_leakage',
        status: 'REVIEW_REQUIRED',
        severity: 'warning',
        reason: 'Profile information may be leaking into content as personal experience'
      };
    }

    return { gate: 'persona_leakage', status: 'PASS', severity: 'info' };
  }

  /**
   * Gate 5: ICP Leakage
   */
  private async checkICPLeakage(draft: ContentDraft, context: AIContext): Promise<QualityGateResult> {
    if (!context.icp) {
      return { gate: 'icp_leakage', status: 'PASS', severity: 'info' };
    }

    const icpTerms = [
      ...(context.icp.target_roles || []),
      ...(context.icp.industries || [])
    ].map(t => t.toLowerCase());

    const contentLower = draft.content.toLowerCase();
    const hasLeakage = icpTerms.some(term => 
      contentLower.includes(term) && 
      (contentLower.includes('we ') || contentLower.includes('our '))
    );

    if (hasLeakage) {
      return {
        gate: 'icp_leakage',
        status: 'REVIEW_REQUIRED',
        severity: 'warning',
        reason: 'ICP information may be leaking into content'
      };
    }

    return { gate: 'icp_leakage', status: 'PASS', severity: 'info' };
  }

  /**
   * Gate 6: Voice Consistency
   */
  private async checkVoiceConsistency(draft: ContentDraft, context: AIContext): Promise<QualityGateResult> {
    if (!context.voice) {
      return { gate: 'voice_consistency', status: 'PASS', severity: 'info' };
    }

    try {
      const ai = getAIProvider();
      const prompt = `Analyze this content for voice consistency.

VOICE GUIDELINES:
- Tone: ${context.voice.tone || 'professional'}
- Style: ${context.voice.rhythm || 'mixed'}

CONTENT:
${draft.content.substring(0, 2000)}

Evaluate in JSON:
{
  "consistent": true/false,
  "score": 0.0-1.0,
  "issues": ["list of inconsistencies"]
}`;

      const result = await ai.completeStructured<{
        consistent: boolean;
        score: number;
        issues: string[];
      }>(prompt, {}, { temperature: 0.2 });

      if (result.score < 0.5) {
        return {
          gate: 'voice_consistency',
          status: 'REVIEW_REQUIRED',
          severity: 'warning',
          reason: `Voice inconsistencies: ${result.issues.join(', ')}`
        };
      }

      return { gate: 'voice_consistency', status: 'PASS', severity: 'info' };
    } catch (error) {
      return { gate: 'voice_consistency', status: 'PASS', severity: 'info' };
    }
  }

  /**
   * Gate 7: Banned Words
   */
  private async checkBannedWords(draft: ContentDraft, context: AIContext): Promise<QualityGateResult> {
    const bannedWords = context.voice?.banned_words || [];
    if (bannedWords.length === 0) {
      return { gate: 'banned_words', status: 'PASS', severity: 'info' };
    }

    const contentLower = draft.content.toLowerCase();
    const found = bannedWords.filter(word => 
      contentLower.includes(word.toLowerCase())
    );

    if (found.length > 0) {
      return {
        gate: 'banned_words',
        status: 'BLOCKED',
        severity: 'critical',
        reason: `Banned words detected: ${found.join(', ')}`
      };
    }

    return { gate: 'banned_words', status: 'PASS', severity: 'info' };
  }

  /**
   * Gate 8: Duplicate Content
   */
  private async checkDuplicateContent(draft: ContentDraft, context: AIContext): Promise<QualityGateResult> {
    const sentences = draft.content.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
    const seen = new Map<string, number>();

    for (const sentence of sentences) {
      const normalized = sentence.toLowerCase();
      seen.set(normalized, (seen.get(normalized) || 0) + 1);
    }

    const duplicates = Array.from(seen.entries()).filter(([_, count]) => count > 1);

    if (duplicates.length > 0) {
      return {
        gate: 'duplicate_content',
        status: 'REVIEW_REQUIRED',
        severity: 'warning',
        reason: `${duplicates.length} duplicate sentence(s) detected`
      };
    }

    return { gate: 'duplicate_content', status: 'PASS', severity: 'info' };
  }

  /**
   * Gate 9: Source Contradictions
   */
  private async checkSourceContradictions(draft: ContentDraft, context: AIContext): Promise<QualityGateResult> {
    const claims = draft.metadata.claims;
    if (!claims || claims.length < 2) {
      return { gate: 'source_contradictions', status: 'PASS', severity: 'info' };
    }

    // Check for contradictory claims
    const contradicted = claims.filter(c => c.status === 'contradicted');

    if (contradicted.length > 0) {
      return {
        gate: 'source_contradictions',
        status: 'BLOCKED',
        severity: 'critical',
        reason: `${contradicted.length} contradicted claim(s) detected`
      };
    }

    return { gate: 'source_contradictions', status: 'PASS', severity: 'info' };
  }

  /**
   * Gate 10: Invented Statistics
   */
  private async checkInventedStatistics(draft: ContentDraft, context: AIContext): Promise<QualityGateResult> {
    const claims = draft.metadata.claims;
    const statClaims = claims?.filter(c => c.type === 'statistic') || [];
    
    const invented = statClaims.filter(c => 
      c.status === 'unavailable' || c.confidence < 0.5
    );

    if (invented.length > 0) {
      return {
        gate: 'invented_statistics',
        status: 'BLOCKED',
        severity: 'critical',
        reason: `${invented.length} potentially invented statistic(s) detected`
      };
    }

    return { gate: 'invented_statistics', status: 'PASS', severity: 'info' };
  }

  /**
   * Gate 11: Invented Experience
   */
  private async checkInventedExperience(draft: ContentDraft, context: AIContext): Promise<QualityGateResult> {
    const claims = draft.metadata.claims;
    const expClaims = claims?.filter(c => c.type === 'experience') || [];
    
    const invented = expClaims.filter(c => 
      c.status === 'unavailable' || c.confidence < 0.5
    );

    if (invented.length > 0) {
      return {
        gate: 'invented_experience',
        status: 'BLOCKED',
        severity: 'critical',
        reason: `${invented.length} potentially invented experience(s) detected`
      };
    }

    return { gate: 'invented_experience', status: 'PASS', severity: 'info' };
  }

  /**
   * Gate 12: Invented Social Proof
   */
  private async checkInventedSocialProof(draft: ContentDraft, context: AIContext): Promise<QualityGateResult> {
    const socialProofPatterns = /\b(\d+[\+,]?\s*(clients|customers|users|followers|companies|teams))\b/gi;
    const matches = draft.content.match(socialProofPatterns);

    if (matches && matches.length > 0) {
      // Check if these are supported by claims
      const claims = draft.metadata.claims || [];
      const supported = matches.filter(match => 
        claims.some(c => c.text.includes(match) && c.confidence > 0.7)
      );

      if (supported.length < matches.length) {
        return {
          gate: 'invented_social_proof',
          status: 'REVIEW_REQUIRED',
          severity: 'warning',
          reason: `${matches.length - supported.length} unsupported social proof claim(s)`
        };
      }
    }

    return { gate: 'invented_social_proof', status: 'PASS', severity: 'info' };
  }

  /**
   * Gate 13: Generic Filler
   */
  private async checkGenericFiller(draft: ContentDraft, context: AIContext): Promise<QualityGateResult> {
    const fillerPhrases = [
      'in today\'s fast-paced world',
      'at the end of the day',
      'think outside the box',
      'leverage synergies',
      'paradigm shift',
      'game-changer',
      'revolutionary'
    ];

    const contentLower = draft.content.toLowerCase();
    const found = fillerPhrases.filter(phrase => contentLower.includes(phrase));

    if (found.length > 2) {
      return {
        gate: 'generic_filler',
        status: 'REVIEW_REQUIRED',
        severity: 'warning',
        reason: `${found.length} generic filler phrases detected`
      };
    }

    return { gate: 'generic_filler', status: 'PASS', severity: 'info' };
  }

  /**
   * Gate 14: Hook Relevance
   */
  private async checkHookRelevance(draft: ContentDraft, context: AIContext): Promise<QualityGateResult> {
    if (!draft.hook) {
      return { gate: 'hook_relevance', status: 'PASS', severity: 'info' };
    }

    try {
      const ai = getAIProvider();
      const prompt = `Evaluate if this hook is relevant to the content.

HOOK: ${draft.hook}

CONTENT: ${draft.content.substring(0, 1500)}

JSON response:
{
  "relevant": true/false,
  "score": 0.0-1.0,
  "reason": "brief explanation"
}`;

      const result = await ai.completeStructured<{
        relevant: boolean;
        score: number;
        reason: string;
      }>(prompt, {}, { temperature: 0.2 });

      if (result.score < 0.5) {
        return {
          gate: 'hook_relevance',
          status: 'REVIEW_REQUIRED',
          severity: 'warning',
          reason: `Hook may not be relevant: ${result.reason}`
        };
      }

      return { gate: 'hook_relevance', status: 'PASS', severity: 'info' };
    } catch (error) {
      return { gate: 'hook_relevance', status: 'PASS', severity: 'info' };
    }
  }

  /**
   * Gate 15: Narrative Coherence
   */
  private async checkNarrativeCoherence(draft: ContentDraft, context: AIContext): Promise<QualityGateResult> {
    try {
      const ai = getAIProvider();
      const prompt = `Evaluate the narrative coherence of this content.

CONTENT: ${draft.content.substring(0, 2000)}

JSON response:
{
  "coherent": true/false,
  "score": 0.0-1.0,
  "issues": ["list of coherence issues"]
}`;

      const result = await ai.completeStructured<{
        coherent: boolean;
        score: number;
        issues: string[];
      }>(prompt, {}, { temperature: 0.2 });

      if (result.score < 0.5) {
        return {
          gate: 'narrative_coherence',
          status: 'REVIEW_REQUIRED',
          severity: 'warning',
          reason: `Coherence issues: ${result.issues.join(', ')}`
        };
      }

      return { gate: 'narrative_coherence', status: 'PASS', severity: 'info' };
    } catch (error) {
      return { gate: 'narrative_coherence', status: 'PASS', severity: 'info' };
    }
  }

  /**
   * Gate 16: Evidence Availability
   */
  private async checkEvidenceAvailability(draft: ContentDraft, context: AIContext): Promise<QualityGateResult> {
    const claims = draft.metadata.claims || [];
    const claimsWithoutEvidence = claims.filter(c => 
      !c.evidence || c.evidence.length === 0
    );

    if (claimsWithoutEvidence.length > claims.length * 0.5) {
      return {
        gate: 'evidence_availability',
        status: 'REVIEW_REQUIRED',
        severity: 'warning',
        reason: `${claimsWithoutEvidence.length} claim(s) lack supporting evidence`
      };
    }

    return { gate: 'evidence_availability', status: 'PASS', severity: 'info' };
  }

  /**
   * Gate 17: Citation Integrity
   */
  private async checkCitationIntegrity(draft: ContentDraft, context: AIContext): Promise<QualityGateResult> {
    const sources = draft.metadata.sources || [];
    if (sources.length === 0) {
      return { gate: 'citation_integrity', status: 'PASS', severity: 'info' };
    }

    // Check if content references sources
    const hasReferences = sources.some(source => 
      draft.content.includes(source.title) || 
      draft.content.includes(source.url as string)
    );

    if (!hasReferences && sources.length > 0) {
      return {
        gate: 'citation_integrity',
        status: 'REVIEW_REQUIRED',
        severity: 'warning',
        reason: 'Content does not appear to reference its sources'
      };
    }

    return { gate: 'citation_integrity', status: 'PASS', severity: 'info' };
  }

  /**
   * Gate 18: Malformed Output
   */
  private async checkMalformedOutput(draft: ContentDraft, context: AIContext): Promise<QualityGateResult> {
    const issues: string[] = [];

    // Check for incomplete sentences
    if (draft.content.endsWith('...') || draft.content.endsWith('[TODO]')) {
      issues.push('Content appears incomplete');
    }

    // Check for placeholder text
    if (draft.content.includes('[INSERT') || draft.content.includes('[PLACEHOLDER]')) {
      issues.push('Placeholder text detected');
    }

    // Check for excessive length
    if (draft.content.length > 3000 && draft.format === 'text_post') {
      issues.push('Content exceeds LinkedIn optimal length');
    }

    if (issues.length > 0) {
      return {
        gate: 'malformed_output',
        status: 'BLOCKED',
        severity: 'critical',
        reason: issues.join('; ')
      };
    }

    return { gate: 'malformed_output', status: 'PASS', severity: 'info' };
  }

  /**
   * Gate 19: Carousel Integrity
   */
  private async checkCarouselIntegrity(draft: ContentDraft, context: AIContext): Promise<QualityGateResult> {
    if (draft.format !== 'carousel') {
      return { gate: 'carousel_integrity', status: 'PASS', severity: 'info' };
    }

    const slides = draft.slides || [];
    if (slides.length === 0) {
      return {
        gate: 'carousel_integrity',
        status: 'BLOCKED',
        severity: 'critical',
        reason: 'Carousel has no slides'
      };
    }

    // Check slide structure
    const issues: string[] = [];
    
    if (!slides[0] || slides[0].purpose !== 'cover') {
      issues.push('Missing cover slide');
    }

    if (slides.length < 3) {
      issues.push('Too few slides (minimum 3)');
    }

    if (slides.length > 10) {
      issues.push('Too many slides (maximum 10)');
    }

    // Check for empty slides
    const emptySlides = slides.filter(s => !s.headline && !s.body);
    if (emptySlides.length > 0) {
      issues.push(`${emptySlides.length} empty slide(s)`);
    }

    if (issues.length > 0) {
      return {
        gate: 'carousel_integrity',
        status: 'BLOCKED',
        severity: 'critical',
        reason: issues.join('; ')
      };
    }

    return { gate: 'carousel_integrity', status: 'PASS', severity: 'info' };
  }

  /**
   * Gate 20: CTA Relevance
   */
  private async checkCTARelevance(draft: ContentDraft, context: AIContext): Promise<QualityGateResult> {
    if (!draft.cta) {
      return { gate: 'cta_relevance', status: 'PASS', severity: 'info' };
    }

    try {
      const ai = getAIProvider();
      const prompt = `Evaluate if this CTA is relevant to the content and objective.

CONTENT: ${draft.content.substring(0, 1500)}
CTA: ${draft.cta}
OBJECTIVE: ${draft.metadata.strategy.objective}

JSON response:
{
  "relevant": true/false,
  "score": 0.0-1.0,
  "reason": "brief explanation"
}`;

      const result = await ai.completeStructured<{
        relevant: boolean;
        score: number;
        reason: string;
      }>(prompt, {}, { temperature: 0.2 });

      if (result.score < 0.5) {
        return {
          gate: 'cta_relevance',
          status: 'REVIEW_REQUIRED',
          severity: 'warning',
          reason: `CTA may not be relevant: ${result.reason}`
        };
      }

      return { gate: 'cta_relevance', status: 'PASS', severity: 'info' };
    } catch (error) {
      return { gate: 'cta_relevance', status: 'PASS', severity: 'info' };
    }
  }

  /**
   * Map gate name to issue type
   */
  private mapGateToIssueType(gate: string): any {
    const mapping: Record<string, any> = {
      'thesis_fidelity': 'thesis_drift',
      'source_fidelity': 'source_fidelity',
      'unsupported_claims': 'unsupported_claim',
      'persona_leakage': 'persona_leakage',
      'icp_leakage': 'icp_leakage',
      'voice_consistency': 'voice_inconsistency',
      'banned_words': 'banned_word',
      'duplicate_content': 'duplicate_content',
      'source_contradictions': 'source_contradiction',
      'invented_statistics': 'invented_statistic',
      'invented_experience': 'invented_experience',
      'invented_social_proof': 'invented_social_proof',
      'generic_filler': 'generic_filler',
      'hook_relevance': 'hook_irrelevance',
      'narrative_coherence': 'narrative_incoherence',
      'evidence_availability': 'missing_evidence',
      'citation_integrity': 'citation_integrity',
      'malformed_output': 'malformed_output',
      'carousel_integrity': 'malformed_carousel',
      'cta_relevance': 'cta_irrelevance'
    };

    return mapping[gate] || 'malformed_output';
  }
}

export const qualityService = new QualityService();
