/**
 * Writing Service
 * Generates content based on strategy, research, and voice
 */

import { ContentDraft, ContentStrategy, ResearchResult, AIContext, CarouselSlide } from './index';
import { v4 as uuidv4 } from 'uuid';

export class WritingService {
  /**
   * Generate a content draft based on strategy and research
   */
  async generateDraft(
    strategy: ContentStrategy,
    research: ResearchResult,
    context: AIContext
  ): Promise<ContentDraft> {
    // Generate content based on format
    let content = '';
    let slides: CarouselSlide[] | undefined;

    switch (strategy.format) {
      case 'carousel':
        slides = await this.generateCarousel(strategy, research, context);
        content = this.carouselToContent(slides);
        break;
      case 'text_post':
      default:
        content = await this.generateTextPost(strategy, research, context);
        break;
    }

    const draft: ContentDraft = {
      id: uuidv4(),
      title: strategy.keyPoints[0] || strategy.hook || 'Untitled',
      content,
      format: strategy.format,
      hook: strategy.hook,
      cta: strategy.cta,
      slides,
      metadata: {
        strategy,
        claims: research.claims,
        sources: research.sources,
        qualityScore: 0,
        qualityStatus: 'review_required',
        qualityIssues: []
      }
    };

    return draft;
  }

  /**
   * Generate a text post
   */
  private async generateTextPost(
    strategy: ContentStrategy,
    research: ResearchResult,
    context: AIContext
  ): Promise<string> {
    // Build content based on narrative structure
    const sections: string[] = [];

    // Hook
    if (strategy.hook) {
      sections.push(strategy.hook);
      sections.push('');
    }

    // Main content based on narrative
    switch (strategy.narrative) {
      case 'problem_solution':
        sections.push(this.generateProblemSection(strategy, research));
        sections.push('');
        sections.push(this.generateSolutionSection(strategy, research));
        break;
      
      case 'observation_evidence_implication':
        sections.push(this.generateObservationSection(strategy, research));
        sections.push('');
        sections.push(this.generateEvidenceSection(strategy, research));
        sections.push('');
        sections.push(this.generateImplicationSection(strategy, research));
        break;
      
      case 'claim_counterpoint_evidence':
        sections.push(this.generateClaimSection(strategy, research));
        sections.push('');
        sections.push(this.generateCounterpointSection(strategy, research));
        sections.push('');
        sections.push(this.generateEvidenceSection(strategy, research));
        break;
      
      default:
        // Generic structure
        for (const point of strategy.keyPoints) {
          sections.push(`• ${point}`);
        }
        break;
    }

    // CTA
    if (strategy.cta) {
      sections.push('');
      sections.push(strategy.cta);
    }

    return sections.join('\n');
  }

  /**
   * Generate carousel slides
   */
  private async generateCarousel(
    strategy: ContentStrategy,
    research: ResearchResult,
    context: AIContext
  ): Promise<CarouselSlide[]> {
    const slides: CarouselSlide[] = [];
    const keyPoints = strategy.keyPoints.slice(0, 5); // Max 5 key points

    // Cover slide
    slides.push({
      slideNumber: 1,
      purpose: 'cover',
      headline: strategy.hook || strategy.keyPoints[0] || 'Title',
      body: strategy.audience ? `For ${strategy.audience}` : '',
      visualDirection: 'Bold, attention-grabbing design'
    });

    // Content slides
    for (let i = 0; i < keyPoints.length; i++) {
      const point = keyPoints[i];
      const claim = research.claims.find(c => c.text === point);
      
      slides.push({
        slideNumber: i + 2,
        purpose: 'content',
        headline: point,
        body: this.expandPoint(point, claim, research),
        evidence: claim?.evidence?.join(', '),
        visualDirection: 'Clear, focused design with supporting visuals'
      });
    }

    // Conclusion slide
    slides.push({
      slideNumber: slides.length + 1,
      purpose: 'conclusion',
      headline: 'Key Takeaway',
      body: strategy.cta || 'Summary of main points',
      visualDirection: 'Memorable, actionable conclusion'
    });

    return slides;
  }

  /**
   * Convert carousel to text content
   */
  private carouselToContent(slides: CarouselSlide[]): string {
    return slides
      .map(slide => `[Slide ${slide.slideNumber}]\n${slide.headline}\n${slide.body}`)
      .join('\n\n');
  }

  /**
   * Generate problem section
   */
  private generateProblemSection(strategy: ContentStrategy, research: ResearchResult): string {
    const problem = strategy.keyPoints[0] || 'The challenge';
    return `**The Problem**\n\n${problem}`;
  }

  /**
   * Generate solution section
   */
  private generateSolutionSection(strategy: ContentStrategy, research: ResearchResult): string {
    const solutions = strategy.keyPoints.slice(1);
    if (solutions.length === 0) return '';
    
    return `**The Solution**\n\n${solutions.map(s => `• ${s}`).join('\n')}`;
  }

  /**
   * Generate observation section
   */
  private generateObservationSection(strategy: ContentStrategy, research: ResearchResult): string {
    return `**Observation**\n\n${strategy.keyPoints[0] || 'Key observation'}`;
  }

  /**
   * Generate evidence section
   */
  private generateEvidenceSection(strategy: ContentStrategy, research: ResearchResult): string {
    const evidence = research.claims
      .filter(c => c.confidence > 0.7)
      .slice(0, 3)
      .map(c => `• ${c.text}`)
      .join('\n');
    
    return `**Evidence**\n\n${evidence || 'Supporting data'}`;
  }

  /**
   * Generate implication section
   */
  private generateImplicationSection(strategy: ContentStrategy, research: ResearchResult): string {
    return `**Implication**\n\n${strategy.keyPoints[strategy.keyPoints.length - 1] || 'What this means'}`;
  }

  /**
   * Generate claim section
   */
  private generateClaimSection(strategy: ContentStrategy, research: ResearchResult): string {
    return `**The Claim**\n\n${strategy.keyPoints[0] || 'Main argument'}`;
  }

  /**
   * Generate counterpoint section
   */
  private generateCounterpointSection(strategy: ContentStrategy, research: ResearchResult): string {
    return `**The Counterpoint**\n\n${strategy.keyPoints[1] || 'Alternative perspective'}`;
  }

  /**
   * Expand a key point with supporting details
   */
  private expandPoint(point: string, claim: any, research: ResearchResult): string {
    if (!claim) return point;
    
    const evidence = claim.evidence?.slice(0, 2).join(' ') || '';
    return evidence ? `${point}\n\n${evidence}` : point;
  }

  /**
   * Generate carousel slides (public method)
   */
  async generateCarouselSlides(
    strategy: ContentStrategy,
    research: ResearchResult,
    context: AIContext
  ): Promise<CarouselSlide[]> {
    return this.generateCarousel(strategy, research, context);
  }

  /**
   * Revise a draft based on feedback
   */
  async reviseDraft(
    draft: ContentDraft,
    feedback: string,
    context: AIContext
  ): Promise<ContentDraft> {
    // Placeholder - will integrate with AI provider for revision
    // For now, return the same draft
    return {
      ...draft,
      id: uuidv4(), // New version
      metadata: {
        ...draft.metadata,
        qualityScore: 0,
        qualityStatus: 'review_required',
        qualityIssues: []
      }
    };
  }
}

export const writingService = new WritingService();
