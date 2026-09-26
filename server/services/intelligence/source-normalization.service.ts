/**
 * Source Normalization Service
 * Transforms raw source content into structured, normalized documents
 */

import { Pool } from 'pg';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { IntelligenceRepository } from '../../repositories/intelligence.repository';
import { SourceDocument, IntelligenceSource } from '../../models/types';

export class SourceNormalizationService {
  private intelligenceRepo: IntelligenceRepository;

  constructor(private pool: Pool) {
    this.intelligenceRepo = new IntelligenceRepository(pool);
  }

  /**
   * Normalize a source into a structured document
   */
  async normalizeSource(workspaceId: string, source: IntelligenceSource): Promise<SourceDocument> {
    // Get raw content (would be stored during ingestion)
    // For now, we'll fetch it again if needed
    const rawContent = await this.getRawContent(source);

    // Normalize based on source type
    let normalized: Partial<SourceDocument>;
    
    switch (source.source_type) {
      case 'rss':
      case 'atom':
        normalized = await this.normalizeRSSContent(source, rawContent);
        break;
      case 'web':
      default:
        normalized = await this.normalizeWebContent(source, rawContent);
        break;
    }

    // Create document record
    const document = await this.intelligenceRepo.createDocument(source.id, workspaceId, {
      ...normalized,
      content_hash: crypto.createHash('sha256').update(normalized.cleaned_body || '').digest('hex'),
      extraction_confidence: this.calculateExtractionConfidence(normalized),
      provenance: 'EXTRACTED',
    });

    // Update source status
    await this.intelligenceRepo.updateSource(workspaceId, source.id, {
      status: 'PROCESSED',
    });

    return document;
  }

  /**
   * Get raw content for a source
   */
  private async getRawContent(source: IntelligenceSource): Promise<string> {
    // In a real implementation, this would retrieve cached content
    // For now, return empty string (content would be fetched during ingestion)
    return '';
  }

  /**
   * Normalize RSS/Atom feed content
   */
  private async normalizeRSSContent(source: IntelligenceSource, rawContent: string): Promise<Partial<SourceDocument>> {
    try {
      const feedData = JSON.parse(rawContent);
      
      // Extract items from feed
      const items = feedData.items || [];
      const firstItem = items[0];

      return {
        title: source.title || firstItem?.title || null,
        author: firstItem?.creator || firstItem?.author || null,
        publisher: source.publisher || null,
        publication_date: firstItem?.isoDate ? new Date(firstItem.isoDate) : source.published_at,
        canonical_url: firstItem?.link || source.url,
        language: firstItem?.language || 'en',
        cleaned_body: this.combineFeedItems(items),
        headings: items.map((item: any) => item.title).filter(Boolean),
        paragraphs: items.map((item: any) => item.contentSnippet || item.content || '').filter(Boolean),
        metadata: {
          feedType: source.source_type,
          itemCount: items.length,
          feedTitle: feedData.title,
        },
      };
    } catch (error) {
      return {
        title: source.title,
        publisher: source.publisher,
        publication_date: source.published_at,
        canonical_url: source.url,
        cleaned_body: '',
        headings: [],
        paragraphs: [],
        metadata: { error: 'Failed to parse RSS content' },
      };
    }
  }

  /**
   * Combine feed items into a single body
   */
  private combineFeedItems(items: any[]): string {
    return items
      .map(item => {
        const title = item.title || '';
        const content = item.contentSnippet || item.content || '';
        return `${title}\n\n${content}`;
      })
      .join('\n\n---\n\n');
  }

  /**
   * Normalize web page content
   */
  private async normalizeWebContent(source: IntelligenceSource, rawContent: string): Promise<Partial<SourceDocument>> {
    if (!rawContent) {
      return {
        title: source.title,
        publisher: source.publisher,
        publication_date: source.published_at,
        canonical_url: source.url,
        cleaned_body: '',
        headings: [],
        paragraphs: [],
        metadata: { warning: 'No raw content available' },
      };
    }

    const $ = cheerio.load(rawContent);

    // Remove unwanted elements
    $('script, style, nav, footer, header, aside, .ad, .advertisement, .sidebar, .comments').remove();

    // Extract title
    const title = $('title').text() || $('h1').first().text() || source.title || null;

    // Extract author
    const author = $('meta[name="author"]').attr('content') || 
                  $('meta[property="article:author"]').attr('content') ||
                  $('.author').first().text() ||
                  null;

    // Extract publication date
    const pubDate = $('meta[property="article:published_time"]').attr('content') ||
                   $('meta[name="date"]').attr('content') ||
                   $('time').attr('datetime') ||
                   null;

    // Extract headings
    const headings: string[] = [];
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const text = $(el).text().trim();
      if (text) headings.push(text);
    });

    // Extract paragraphs
    const paragraphs: string[] = [];
    $('p').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 20) { // Filter out short paragraphs
        paragraphs.push(text);
      }
    });

    // Extract main content
    const mainContent = $('article, main, .content, .post, .article').first();
    const cleanedBody = mainContent.text() || $('body').text();

    // Clean and normalize text
    const normalizedBody = this.cleanText(cleanedBody);

    return {
      title: title?.substring(0, 500) || null,
      author: author?.substring(0, 255) || null,
      publisher: source.publisher || null,
      publication_date: pubDate ? new Date(pubDate) : source.published_at,
      canonical_url: source.url,
      language: $('html').attr('lang') || 'en',
      cleaned_body: normalizedBody.substring(0, 50000),
      headings: headings.slice(0, 50),
      paragraphs: paragraphs.slice(0, 200),
      metadata: {
        wordCount: normalizedBody.split(/\s+/).length,
        headingCount: headings.length,
        paragraphCount: paragraphs.length,
      },
    };
  }

  /**
   * Clean and normalize text
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n/g, '\n\n') // Normalize paragraph breaks
      .trim();
  }

  /**
   * Calculate extraction confidence
   */
  private calculateExtractionConfidence(document: Partial<SourceDocument>): number {
    let confidence = 0.5; // Base confidence

    // Boost if we have title
    if (document.title) confidence += 0.1;

    // Boost if we have substantial content
    if (document.cleaned_body && document.cleaned_body.length > 500) {
      confidence += 0.2;
    }

    // Boost if we have structured content
    if (document.headings && document.headings.length > 0) {
      confidence += 0.1;
    }

    if (document.paragraphs && document.paragraphs.length > 5) {
      confidence += 0.1;
    }

    return Math.min(1.0, confidence);
  }

  /**
   * Batch normalize multiple sources
   */
  async batchNormalize(workspaceId: string, sources: IntelligenceSource[]): Promise<{
    successful: SourceDocument[];
    failed: Array<{ sourceId: string; error: string }>;
  }> {
    const successful: SourceDocument[] = [];
    const failed: Array<{ sourceId: string; error: string }> = [];

    for (const source of sources) {
      try {
        const document = await this.normalizeSource(workspaceId, source);
        successful.push(document);
      } catch (error) {
        failed.push({
          sourceId: source.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { successful, failed };
  }
}
