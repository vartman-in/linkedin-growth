/**
 * Writing Service
 * Generates content based on strategy, research, and voice
 */

import { ContentDraft, ContentStrategy, ResearchResult, AIContext, CarouselSlide } from './index';
import { getAIProvider } from './provider';
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
    try {
      const ai = getAIProvider();
      
      // Build evidence context
      const evidenceContext = research.claims
        .filter(c => c.confidence > 0.6)
        .slice(0, 10)
        .map(c => `- ${c.text}`)
        .join('\n');

      // Build voice context
      const voiceContext = context.voice ? `
VOICE GUIDELINES:
- Tone: ${context.voice.tone || 'professional'}
- Style: ${context.voice.rhythm || 'mixed'}
- Avoid: ${(context.voice.banned_words || []).join(', ') || 'none specified'}
` : '';

      // Build thesis context
      const thesisContext = context.thesis ? `
ORIGINAL THESIS (preserve this core idea):
${context.thesis}
` : '';

      const prompt = `You are a LinkedIn content writer. Create compelling content based on this strategy.

STRATEGY:
- Objective: ${strategy.objective}
- Audience: ${strategy.audience}
- Angle: ${strategy.angle}
- Format: ${strategy.format}
- Narrative: ${strategy.narrative}
- Hook: ${strategy.hook}
- Key Points: ${strategy.keyPoints.join(', ')}
- CTA: ${strategy.cta}
${thesisContext}
EVIDENCE & RESEARCH:
${evidenceContext || 'No specific evidence available'}
${voiceContext}
RULES:
1. Preserve the original thesis if provided
2. Use only the evidence provided - do not invent statistics or experiences
3. Match the voice/tone guidelines
4. Create engaging, valuable content for LinkedIn
5. Include the hook at the beginning
6. End with the CTA
7. Use appropriate formatting for LinkedIn (short paragraphs, line breaks, emojis if appropriate)

${strategy.format === 'carousel' ? 'Create carousel slide content with clear slide breaks marked as [SLIDE N].' : 'Create a LinkedIn post.'}

Generate the content now:`;

      const content = await ai.complete(prompt, { temperature: 0.8, maxTokens: 2000 });

      let slides: CarouselSlide[] | undefined;
      if (strategy.format === 'carousel') {
        slides = await this.generateCarouselFromAI(content, strategy);
      }

      const draft: ContentDraft = {
        id: uuidv4(),
        title: strategy.keyPoints[0] || strategy.hook || 'Untitled',
        content,
        format: strategy.format,
        hook: strategy.hook,
        cta: strategy.cta,
        slides,
        meta {
          strategy,
          claims: research.claims,
          sources: research.sources,
          qualityScore: 0,
          qualityStatus: 'review_required',
          qualityIssues: []
        }
      };

      return draft;
    } catch (error) {
      console.error('AI writing failed, using fallback:', error);
      // Fallback to template-based generation
      return this.fallbackDraft(strategy, research, context);
    }
  }

  /**
   * Fallback draft generation when AI is unavailable
   */
  private async fallbackDraft(
    strategy: ContentStrategy,
    research: ResearchResult,
    context: AIContext
  ): Promise<ContentDraft> {
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

    return {
      id: uuidv4(),
      title: strategy.keyPoints[0] || strategy.hook || 'Untitled',
      content,
      format: strategy.format,
      hook: strategy.hook,
      cta: strategy.cta,
      slides,
      meta {
        strategy,
        claims: research.claims,
        sources: research.sources,
        qualityScore: 0,
        qualityStatus: 'review_required',
        qualityIssues: []
      }
    };
  }

  /**
   * Generate carousel slides from AI-generated content
   */
  private async generateCarouselFromAI(
    content: string,
    strategy: ContentStrategy
  ): Promise<CarouselSlide[]> {
    // Parse content into slides (simple heuristic)
    const sections = content.split(/\n\n+/).filter(s => s.trim());
    const slides: CarouselSlide[] = [];

    // Cover slide
    slides.push({
      slideNumber: 1,
      purpose: 'cover',
      headline: strategy.hook || strategy.keyPoints[0] || 'Title',
      body: strategy.audience ? `For ${strategy.audience}` : '',
      visualDirection: 'Bold, attention-grabbing design'
    });

    // Content slides
    for (let i = 0; i < Math.min(sections.length - 1, 5); i++) {
      const section = sections[i];
      const lines = section.split('\n');
      const headline = lines[0] || `Point ${i + 1}`;
      const body = lines.slice(1).join('\n') || section;

      slides.push({
        slideNumber: i + 2,
        purpose: 'content',
        headline: headline.substring(0, 100),
        body: body.substring(0, 500),
        visualDirection: 'Clear, focused design'
      });
    }

    // Conclusion slide
    slides.push({
      slideNumber: slides.length + 1,
      purpose: 'conclusion',
      headline: 'Key Takeaway',
      body: strategy.cta || sections[sections.length - 1] || 'Summary',
      visualDirection: 'Memorable, actionable conclusion'
    });

    return slides;
  }

  /**
   * Generate a text post (fallback)
   */
  private async generateTextPost(
    strategy: ContentStrategy,
    research: ResearchResult,
    context: AIContext
  ): Promise<string> {
    const sections: string[] = [];

    if (strategy.hook) {
      sections.push(strategy.hook);
      sections.push('');
    }

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
        for (const point of strategy.keyPoints) {
          sections.push(`• ${point}`);
        }
        break;
    }

    if (strategy.cta) {
      sections.push('');
      sections.push(strategy.cta);
    }

    return sections.join('\n');
  }

  /**
   * Generate carousel slides (fallback)
   */
  private async generateCarousel(
    strategy: ContentStrategy,
    research: ResearchResult,
    context: AIContext
  ): Promise<CarouselSlide[]> {
    const slides: CarouselSlide[] = [];
    const keyPoints = strategy.keyPoints.slice(0, 5);

    slides.push({
      slideNumber: 1,
      purpose: 'cover',
      headline: strategy.hook || strategy.keyPoints[0] || 'Title',
      body: strategy.audience ? `For ${strategy.audience}` : '',
      visualDirection: 'Bold, attention-grabbing design'
    });

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

    slides.push({
      slideNumber: slides.length + 1,
      purpose: 'conclusion',
      headline: 'Key Takeaway',
      body: strategy.cta || 'Summary of main points',
      visualDirection: 'Memorable, actionable conclusion'
    });

    return slides;
  }

  private carouselToContent(slides: CarouselSlide[]): string {
    return slides
      .map(slide => `[Slide ${slide.slideNumber}]\n${slide.headline}\n${slide.body}`)
      .join('\n\n');
  }

  private generateProblemSection(strategy: ContentStrategy, research: ResearchResult): string {
    const problem = strategy.keyPoints[0] || 'The challenge';
    return `**The Problem**\n\n${problem}`;
  }

  private generateSolutionSection(strategy: ContentStrategy, research: ResearchResult): string {
    const solutions = strategy.keyPoints.slice(1);
    if (solutions.length === 0) return '';
    return `**The Solution**\n\n${solutions.map(s => `• ${s}`).join('\n')}`;
  }

  private generateObservationSection(strategy: ContentStrategy, research: ResearchResult): string {
    return `**Observation**\n\n${strategy.keyPoints[0] || 'Key observation'}`;
  }

  private generateEvidenceSection(strategy: ContentStrategy, research: ResearchResult): string {
    const evidence = research.claims
      .filter(c => c.confidence > 0.7)
      .slice(0, 3)
      .map(c => `• ${c.text}`)
      .join('\n');
    return `**Evidence**\n\n${evidence || 'Supporting data'}`;
  }

  private generateImplicationSection(strategy: ContentStrategy, research: ResearchResult): string {
    return `**Implication**\n\n${strategy.keyPoints[strategy.keyPoints.length - 1] || 'What this means'}`;
  }

  private generateClaimSection(strategy: ContentStrategy, research: ResearchResult): string {
    return `**The Claim**\n\n${strategy.keyPoints[0] || 'Main argument'}`;
  }

  private generateCounterpointSection(strategy: ContentStrategy, research: ResearchResult): string {
    return `**The Counterpoint**\n\n${strategy.keyPoints[1] || 'Alternative perspective'}`;
  }

  private expandPoint(point: string, claim: any, research: ResearchResult): string {
    if (!claim) return point;
    const evidence = claim.evidence?.slice(0, 2).join(' ') || '';
    return evidence ? `${point}\n\n${evidence}` : point;
  }

  async generateCarouselSlides(
    strategy: ContentStrategy,
    research: ResearchResult,
    context: AIContext
  ): Promise<CarouselSlide[]> {
    return this.generateCarousel(strategy, research, context);
  }

  async reviseDraft(
    draft: ContentDraft,
    feedback: string,
    context: AIContext
  ): Promise<ContentDraft> {
    try {
      const ai = getAIProvider();
      
      const prompt = `Revise this content based on the feedback provided.

ORIGINAL CONTENT:
${draft.content}

FEEDBACK:
${feedback}

Revise the content to address the feedback while maintaining the core message and thesis. Return the revised content:`;

      const revisedContent = await ai.complete(prompt, { temperature: 0.7, maxTokens: 2000 });

      return {
        ...draft,
        id: uuidv4(),
        content: revisedContent,
        meta {
          ...draft.metadata,
          qualityScore: 0,
          qualityStatus: 'review_required',
          qualityIssues: []
        }
      };
    } catch (error) {
      console.error('AI revision failed:', error);
      return { ...draft, id: uuidv4() };
    }
  }
}

export const writingService = new WritingService();
