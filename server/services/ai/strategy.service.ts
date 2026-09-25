/**
 * Content Strategy Service
 * Determines optimal content approach based on research and context
 */

import { ContentStrategy, ResearchResult, AIContext } from './index';

export class StrategyService {
  /**
   * Determine content strategy based on topic, research, and context
   */
  async determineStrategy(
    topic: string,
    research: ResearchResult,
    context: AIContext
  ): Promise<ContentStrategy> {
    // Determine objective based on context and topic
    const objective = this.determineObjective(topic, context);
    
    // Determine target audience
    const audience = this.determineAudience(context);
    
    // Determine angle based on research and audience
    const angle = this.determineAngle(topic, research, audience, context);
    
    // Determine format based on content complexity and audience
    const format = this.determineFormat(topic, research, angle, context);
    
    // Determine narrative structure
    const narrative = this.determineNarrative(angle, format);
    
    // Generate key points from research
    const keyPoints = this.extractKeyPoints(research);
    
    // Determine CTA based on objective
    const cta = this.determineCTA(objective, context);

    return {
      objective,
      audience,
      angle,
      format,
      narrative,
      hook: '', // Will be generated later
      keyPoints,
      cta
    };
  }

  /**
   * Determine content objective
   */
  private determineObjective(topic: string, context: AIContext): ContentStrategy['objective'] {
    // Analyze topic and context to determine objective
    const topicLower = topic.toLowerCase();
    
    // Check for educational keywords
    if (topicLower.includes('how to') || topicLower.includes('guide') || topicLower.includes('tutorial')) {
      return 'education';
    }
    
    // Check for authority-building keywords
    if (topicLower.includes('framework') || topicLower.includes('methodology') || topicLower.includes('approach')) {
      return 'authority';
    }
    
    // Check for conversation starters
    if (topicLower.includes('opinion') || topicLower.includes('thought') || topicLower.includes('perspective')) {
      return 'conversation';
    }
    
    // Check for lead generation
    if (topicLower.includes('solution') || topicLower.includes('service') || topicLower.includes('offer')) {
      return 'lead_generation';
    }
    
    // Default to education for most topics
    return 'education';
  }

  /**
   * Determine target audience
   */
  private determineAudience(context: AIContext): string {
    // Use ICP to determine audience
    if (context.icp?.target_roles && context.icp.target_roles.length > 0) {
      return context.icp.target_roles[0];
    }
    
    // Fall back to profile positioning
    if (context.profile?.positioning) {
      return context.profile.positioning;
    }
    
    return 'general professional audience';
  }

  /**
   * Determine content angle
   */
  private determineAngle(
    topic: string,
    research: ResearchResult,
    audience: string,
    context: AIContext
  ): ContentStrategy['angle'] {
    // Analyze research to determine best angle
    const hasContradictions = research.contradictions.length > 0;
    const hasStrongEvidence = research.claims.some(c => c.confidence > 0.8);
    
    // If there are contradictions, use contrarian angle
    if (hasContradictions) {
      return 'contrarian';
    }
    
    // If strong evidence exists, use analytical angle
    if (hasStrongEvidence && research.claims.length > 3) {
      return 'analytical';
    }
    
    // Check topic for story potential
    const topicLower = topic.toLowerCase();
    if (topicLower.includes('story') || topicLower.includes('experience') || topicLower.includes('journey')) {
      return 'story';
    }
    
    // Check for framework potential
    if (topicLower.includes('framework') || topicLower.includes('system') || topicLower.includes('process')) {
      return 'framework';
    }
    
    // Default to educational
    return 'educational';
  }

  /**
   * Determine content format
   */
  private determineFormat(
    topic: string,
    research: ResearchResult,
    angle: ContentStrategy['angle'],
    context: AIContext
  ): ContentStrategy['format'] {
    // Determine format based on angle and content complexity
    const complexity = this.assessComplexity(topic, research);
    
    // Complex multi-step content → carousel
    if (complexity === 'high' && angle === 'framework') {
      return 'carousel';
    }
    
    // Story angle → text post
    if (angle === 'story') {
      return 'text_post';
    }
    
    // Data-heavy content → document or carousel
    if (research.claims.length > 5 && research.claims.some(c => c.type === 'statistic')) {
      return complexity === 'high' ? 'carousel' : 'document';
    }
    
    // Simple educational content → text post
    if (angle === 'educational' && complexity === 'low') {
      return 'text_post';
    }
    
    // Checklist content
    if (topic.toLowerCase().includes('checklist') || topic.toLowerCase().includes('steps')) {
      return 'checklist';
    }
    
    // Default to text post
    return 'text_post';
  }

  /**
   * Assess content complexity
   */
  private assessComplexity(topic: string, research: ResearchResult): 'low' | 'medium' | 'high' {
    const claimCount = research.claims.length;
    const sourceCount = research.sources.length;
    
    if (claimCount > 10 || sourceCount > 5) {
      return 'high';
    }
    
    if (claimCount > 5 || sourceCount > 3) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Determine narrative structure
   */
  private determineNarrative(
    angle: ContentStrategy['angle'],
    format: ContentStrategy['format']
  ): string {
    const narrativeMap: Record<string, string> = {
      'educational': 'problem_solution',
      'contrarian': 'claim_counterpoint_evidence',
      'practical': 'situation_action_result',
      'analytical': 'observation_evidence_implication',
      'story': 'context_tension_resolution_lesson',
      'framework': 'problem_principle_steps_application',
      'observation': 'observation_evidence_implication',
      'case_study': 'situation_action_result_lesson'
    };
    
    return narrativeMap[angle] || 'problem_solution';
  }

  /**
   * Extract key points from research
   */
  private extractKeyPoints(research: ResearchResult): string[] {
    // Extract top claims as key points
    return research.claims
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
      .map(claim => claim.text);
  }

  /**
   * Determine call-to-action
   */
  private determineCTA(
    objective: ContentStrategy['objective'],
    context: AIContext
  ): string {
    const ctaMap: Record<string, string> = {
      'authority': 'What\'s your experience with this? Share your thoughts.',
      'education': 'Save this for later reference.',
      'awareness': 'Follow for more insights on this topic.',
      'conversation': 'What do you think? Let me know in the comments.',
      'lead_generation': 'DM me to learn more about how we can help.',
      'trust': 'Connect with me to discuss this further.',
      'conversion': 'Click the link in my profile to get started.'
    };
    
    return ctaMap[objective] || '';
  }

  /**
   * Generate a compelling hook
   */
  async generateHook(strategy: ContentStrategy, context: AIContext): Promise<string> {
    // Placeholder - will integrate with AI provider
    // Hook should be based on the strongest claim or most interesting angle
    
    if (strategy.keyPoints.length > 0) {
      return strategy.keyPoints[0];
    }
    
    return '';
  }

  /**
   * Select optimal format (can be called separately for format testing)
   */
  async selectFormat(strategy: ContentStrategy, context: AIContext): Promise<string> {
    return strategy.format;
  }
}

export const strategyService = new StrategyService();
