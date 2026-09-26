/**
 * Source Ingestion Service
 * Handles fetching, validation, and initial processing of external sources
 */

import { Pool } from 'pg';
import axios from 'axios';
import * as cheerio from 'cheerio';
import Parser from 'rss-parser';
import crypto from 'crypto';
import { IntelligenceRepository } from '../../repositories/intelligence.repository';
import { IntelligenceSource } from '../../models/types';

// Security constants
const MAX_URL_LENGTH = 2048;
const MAX_RESPONSE_SIZE = 10 * 1024 * 1024; // 10MB
const REQUEST_TIMEOUT = 30000; // 30 seconds
const ALLOWED_PROTOCOLS = ['http:', 'https:'];
const BLOCKED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
const BLOCKED_IP_RANGES = [
  /^10\./, // 10.0.0.0/8
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
  /^192\.168\./, // 192.168.0.0/16
  /^127\./, // 127.0.0.0/8
  /^0\./, // 0.0.0.0/8
];

const rssParser = new Parser();

export class SourceIngestionService {
  private intelligenceRepo: IntelligenceRepository;

  constructor(private pool: Pool) {
    this.intelligenceRepo = new IntelligenceRepository(pool);
  }

  /**
   * Ingest a source URL
   */
  async ingestSource(workspaceId: string, url: string): Promise<IntelligenceSource> {
    // Validate URL
    this.validateUrl(url);

    // Determine source type
    const sourceType = this.detectSourceType(url);

    // Create or update source record
    const source = await this.intelligenceRepo.createSource(workspaceId, url, sourceType);

    // If already processed, return existing
    if (source.status === 'PROCESSED') {
      return source;
    }

    try {
      // Fetch the source
      const fetchedData = await this.fetchSource(url, sourceType);

      // Update source with fetched data
      await this.intelligenceRepo.updateSource(workspaceId, source.id, {
        title: fetchedData.title,
        publisher: fetchedData.publisher,
        domain: fetchedData.domain,
        fetched_at: new Date(),
        published_at: fetchedData.publishedAt,
        content_hash: fetchedData.contentHash,
        status: 'FETCHED',
        reliability_score: fetchedData.reliabilityScore,
      });

      return { ...source, ...fetchedData, status: 'FETCHED' };
    } catch (error) {
      // Mark as failed
      await this.intelligenceRepo.updateSource(workspaceId, source.id, {
        status: 'FAILED',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Validate URL for security
   */
  private validateUrl(url: string): void {
    // Check length
    if (url.length > MAX_URL_LENGTH) {
      throw new Error('URL exceeds maximum length');
    }

    // Parse URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new Error('Invalid URL format');
    }

    // Check protocol
    if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
      throw new Error(`Protocol ${parsedUrl.protocol} not allowed`);
    }

    // Check for blocked hosts
    const hostname = parsedUrl.hostname.toLowerCase();
    if (BLOCKED_HOSTS.some(host => hostname === host || hostname.endsWith(`.${host}`))) {
      throw new Error('Access to internal networks is not allowed');
    }

    // Check for IP addresses
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipPattern.test(hostname)) {
      // Check if it's a private IP
      if (BLOCKED_IP_RANGES.some(range => range.test(hostname))) {
        throw new Error('Access to private IP ranges is not allowed');
      }
    }
  }

  /**
   * Detect source type from URL
   */
  private detectSourceType(url: string): string {
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.includes('/feed') || lowerUrl.includes('/rss') || lowerUrl.endsWith('.xml')) {
      return 'rss';
    }
    
    if (lowerUrl.includes('/atom')) {
      return 'atom';
    }
    
    if (lowerUrl.includes('sitemap')) {
      return 'sitemap';
    }
    
    return 'web';
  }

  /**
   * Fetch source content
   */
  private async fetchSource(url: string, sourceType: string): Promise<{
    title: string | null;
    publisher: string | null;
    domain: string | null;
    publishedAt: Date | null;
    contentHash: string | null;
    reliabilityScore: number | null;
    rawContent?: string;
  }> {
    try {
      if (sourceType === 'rss' || sourceType === 'atom') {
        return await this.fetchRSSFeed(url);
      } else {
        return await this.fetchWebPage(url);
      }
    } catch (error) {
      throw new Error(`Failed to fetch source: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch RSS/Atom feed
   */
  private async fetchRSSFeed(url: string): Promise<any> {
    const feed = await rssParser.parseURL(url);
    
    const domain = new URL(url).hostname;
    const content = JSON.stringify(feed.items.slice(0, 10));
    const contentHash = crypto.createHash('sha256').update(content).digest('hex');

    return {
      title: feed.title || null,
      publisher: feed.creator || domain,
      domain,
      publishedAt: feed.items[0]?.isoDate ? new Date(feed.items[0].isoDate) : null,
      contentHash,
      reliabilityScore: 0.7, // RSS feeds are generally reliable
      rawContent: content,
    };
  }

  /**
   * Fetch web page
   */
  private async fetchWebPage(url: string): Promise<any> {
    const response = await axios.get(url, {
      timeout: REQUEST_TIMEOUT,
      maxContentLength: MAX_RESPONSE_SIZE,
      headers: {
        'User-Agent': 'GrowthOperator/1.0 (Intelligence Bot)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      maxRedirects: 5,
    });

    // Check content type
    const contentType = response.headers['content-type'] || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      throw new Error(`Unsupported content type: ${contentType}`);
    }

    // Parse HTML
    const $ = cheerio.load(response.data);
    
    // Extract metadata
    const title = $('title').text() || $('h1').first().text() || null;
    const publisher = $('meta[property="og:site_name"]').attr('content') || 
                     $('meta[name="publisher"]').attr('content') || 
                     new URL(url).hostname;
    const publishedAt = $('meta[property="article:published_time"]').attr('content') ||
                       $('meta[name="date"]').attr('content') ||
                       $('time').attr('datetime') || null;
    
    // Extract main content
    $('script, style, nav, footer, header, aside, .ad, .advertisement').remove();
    const mainContent = $('article, main, .content, .post, .article').first();
    const cleanedText = mainContent.text() || $('body').text();
    
    const contentHash = crypto.createHash('sha256').update(cleanedText).digest('hex');

    return {
      title: title?.substring(0, 500) || null,
      publisher: publisher?.substring(0, 255) || null,
      domain: new URL(url).hostname,
      publishedAt: publishedAt ? new Date(publishedAt) : null,
      contentHash,
      reliabilityScore: this.calculateReliabilityScore(url, publisher),
      rawContent: cleanedText.substring(0, 50000),
    };
  }

  /**
   * Calculate reliability score based on source characteristics
   */
  private calculateReliabilityScore(url: string, publisher: string | null): number {
    let score = 0.5; // Base score

    const domain = new URL(url).hostname.toLowerCase();

    // Boost for known reliable domains
    const reliableDomains = ['.gov', '.edu', '.org'];
    if (reliableDomains.some(d => domain.endsWith(d))) {
      score += 0.2;
    }

    // Boost for established publishers
    const establishedPublishers = ['reuters', 'bloomberg', 'techcrunch', 'wired', 'nyt', 'wsj'];
    if (publisher && establishedPublishers.some(p => publisher.toLowerCase().includes(p))) {
      score += 0.2;
    }

    // Penalize suspicious domains
    if (domain.includes('blogspot') || domain.includes('wordpress.com')) {
      score -= 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Batch ingest multiple sources
   */
  async batchIngest(workspaceId: string, urls: string[]): Promise<{
    successful: IntelligenceSource[];
    failed: Array<{ url: string; error: string }>;
  }> {
    const successful: IntelligenceSource[] = [];
    const failed: Array<{ url: string; error: string }> = [];

    for (const url of urls) {
      try {
        const source = await this.ingestSource(workspaceId, url);
        successful.push(source);
      } catch (error) {
        failed.push({
          url,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { successful, failed };
  }
}
