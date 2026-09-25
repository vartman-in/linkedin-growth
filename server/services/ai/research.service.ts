/**
 * Research Intelligence Service
 * Handles source fetching, extraction, and analysis with security protections
 */

import { Source, Claim, Contradiction, Evidence, ResearchResult, AIContext } from './index';
import { getAIProvider } from './provider';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import * as cheerio from 'cheerio';
import Parser from 'rss-parser';

// Security constants
const MAX_URL_LENGTH = 2048;
const MAX_RESPONSE_SIZE = 10 * 1024 * 1024; // 10MB
const REQUEST_TIMEOUT = 30000; // 30 seconds
const ALLOWED_PROTOCOLS = ['http:', 'https:'];
const BLOCKED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];

const rssParser = new Parser();

export class ResearchService {
  /**
   * Research a topic by fetching and analyzing sources
   */
  async research(topic: string, context: AIContext): Promise<ResearchResult> {
    const sources: Source[] = [];
    const claims: Claim[] = [];
    const contradictions: Contradiction[] = [];
    const evidence: Evidence[] = [];

    // If context has source URLs, fetch them
    if (context.sourceUrls && context.sourceUrls.length > 0) {
      for (const url of context.sourceUrls) {
        try {
          const source = await this.fetchSource(url);
          sources.push(source);
          
          // Extract claims from source
          const sourceClaims = await this.extractClaims(source);
          claims.push(...sourceClaims);
        } catch (error) {
          console.error(`Failed to fetch source ${url}:`, error);
        }
      }
    }

    // Detect contradictions
    const detectedContradictions = await this.detectContradictions(claims);
    contradictions.push(...detectedContradictions);

    // Calculate confidence based on source quality and claim support
    const confidence = this.calculateConfidence(sources, claims, contradictions);

    return {
      topic,
      sources,
      claims,
      contradictions,
      evidence,
      confidence
    };
  }

  /**
   * Fetch a source with SSRF protection
   */
  async fetchSource(url: string): Promise<Source> {
    // Validate URL
    this.validateUrl(url);

    try {
      // Check if it's an RSS/Atom feed
      if (url.includes('/feed') || url.includes('/rss') || url.endsWith('.xml')) {
        return await this.fetchRSSSource(url);
      }

      // Fetch HTML content
      const response = await axios.get(url, {
        timeout: REQUEST_TIMEOUT,
        maxContentLength: MAX_RESPONSE_SIZE,
        headers: {
          'User-Agent': 'GrowthOperator/1.0 (Research Bot)',
        },
      });

      // Check content type
      const contentType = response.headers['content-type'] || '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
        throw new Error(`Unsupported content type: ${contentType}`);
      }

      // Parse HTML
      const $ = cheerio.load(response.data);
      
      // Extract title
      const title = $('title').text() || $('h1').first().text() || url;
      
      // Extract main content
      $('script, style, nav, footer, header, aside').remove();
      const content = $('body').text().replace(/\s+/g, ' ').trim();

      // Extract metadata
      const author = $('meta[name="author"]').attr('content') || '';
      const date = $('meta[property="article:published_time"]').attr('content') || '';

      const source: Source = {
        id: uuidv4(),
        url,
        title: title.substring(0, 500),
        author: author.substring(0, 200),
        date: date.substring(0, 50),
        content: content.substring(0, 50000), // Limit content size
        type: 'web',
        extractedAt: new Date()
      };

      return source;
    } catch (error) {
      if (error.response) {
        throw new Error(`Failed to fetch source: HTTP ${error.response.status}`);
      }
      throw new Error(`Failed to fetch source: ${error.message}`);
    }
  }

  /**
   * Fetch RSS/Atom feed source
   */
  private async fetchRSSSource(url: string): Promise<Source> {
    try {
      const feed = await rssParser.parseURL(url);
      
      const items = feed.items.slice(0, 5); // Get latest 5 items
      const content = items.map(item => 
        `${item.title}: ${item.contentSnippet || item.content || ''}`
      ).join('\n\n');

      return {
        id: uuidv4(),
        url,
        title: feed.title || url,
        author: feed.creator || '',
        date: feed.items[0]?.isoDate || '',
        content: content.substring(0, 50000),
        type: 'web',
        extractedAt: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to parse RSS feed: ${error.message}`);
    }
  }

  /**
   * Validate URL for SSRF protection
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

    // Check for blocked hosts (SSRF protection)
    const hostname = parsedUrl.hostname.toLowerCase();
    if (BLOCKED_HOSTS.some(host => hostname === host || hostname.endsWith(`.${host}`))) {
      throw new Error('Access to internal networks is not allowed');
    }

    // Check for IP addresses (basic SSRF protection)
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipPattern.test(hostname)) {
      throw new Error('Direct IP access is not allowed');
    }

    // Check for private IP ranges
    if (this.isPrivateIP(hostname)) {
      throw new Error('Access to private IP ranges is not allowed');
    }
  }

  /**
   * Check if hostname is a private IP
   */
  private isPrivateIP(hostname: string): boolean {
    const parts = hostname.split('.').map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) return false;

    // 10.0.0.0/8
    if (parts[0] === 10) return true;
    // 172.16.0.0/12
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true;

    return false;
  }

  /**
   * Calculate overall confidence based on sources and claims
   */
  private calculateConfidence(
    sources: Source[],
    claims: Claim[],
    contradictions: Contradiction[]
  ): number {
    if (sources.length === 0 || claims.length === 0) return 0;

    // Base confidence from claim support
    const supportedClaims = claims.filter(c => c.status === 'supported').length;
    const claimConfidence = supportedClaims / claims.length;

    // Penalty for contradictions
    const contradictionPenalty = contradictions.length * 0.1;

    // Bonus for multiple sources
    const sourceBonus = Math.min(sources.length * 0.05, 0.2);

    const confidence = Math.max(0, Math.min(1, 
      claimConfidence + sourceBonus - contradictionPenalty
    ));

    return confidence;
  }

  /**
   * Extract claims from a source using AI
   */
  async extractClaims(source: Source): Promise<Claim[]> {
    try {
      const ai = getAIProvider();
      
      const prompt = `Analyze this content and extract factual claims, statistics, and key assertions.

Source: ${source.title}
URL: ${source.url}
Content: ${source.content.substring(0, 10000)}

Extract claims in JSON format:
{
  "claims": [
    {
      "text": "The claim text",
      "type": "fact|opinion|statistic|experience",
      "confidence": 0.0-1.0,
      "evidence": ["supporting text from source"]
    }
  ]
}

Focus on verifiable claims, not opinions. Include confidence scores based on how well-supported each claim is in the source.`;

      const result = await ai.completeStructured<{
        claims: Array<{
          text: string;
          type: 'fact' | 'opinion' | 'statistic' | 'experience';
          confidence: number;
          evidence: string[];
        }>;
      }>(prompt, {}, { temperature: 0.3 });

      return result.claims.map(claim => ({
        id: uuidv4(),
        text: claim.text,
        sourceId: source.id,
        type: claim.type,
        confidence: claim.confidence,
        status: claim.confidence > 0.7 ? 'supported' : claim.confidence > 0.4 ? 'contested' : 'unsupported',
        evidence: claim.evidence
      }));
    } catch (error) {
      console.error('Failed to extract claims:', error);
      return [];
    }
  }

  /**
   * Detect contradictions between claims
   */
  async detectContradictions(claims: Claim[]): Promise<Contradiction[]> {
    // Placeholder - will implement contradiction detection logic
    const contradictions: Contradiction[] = [];

    // Group claims by topic/subject
    const claimsByTopic = new Map<string, Claim[]>();
    for (const claim of claims) {
      // Simple topic extraction - will be more sophisticated with AI
      const topic = this.extractTopic(claim.text);
      if (!claimsByTopic.has(topic)) {
        claimsByTopic.set(topic, []);
      }
      claimsByTopic.get(topic)!.push(claim);
    }

    // Check for contradictions within each topic
    for (const [topic, topicClaims] of claimsByTopic) {
      if (topicClaims.length < 2) continue;

      // Compare each pair of claims
      for (let i = 0; i < topicClaims.length; i++) {
        for (let j = i + 1; j < topicClaims.length; j++) {
          const contradiction = this.checkContradiction(topicClaims[i], topicClaims[j]);
          if (contradiction) {
            contradictions.push(contradiction);
          }
        }
      }
    }

    return contradictions;
  }

  /**
   * Extract topic from claim text
   */
  private extractTopic(text: string): string {
    // Simple topic extraction - will be replaced with AI-powered extraction
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can']);
    const keywords = words.filter(w => !stopWords.has(w) && w.length > 3);
    return keywords.slice(0, 3).join(' ');
  }

  /**
   * Check if two claims contradict each other
   */
  private checkContradiction(claim1: Claim, claim2: Claim): Contradiction | null {
    // Placeholder - will implement actual contradiction detection
    // For now, check for obvious contradictions like "X is true" vs "X is false"
    
    const text1 = claim1.text.toLowerCase();
    const text2 = claim2.text.toLowerCase();

    // Simple contradiction patterns
    const contradictionPatterns = [
      { positive: /is (true|correct|accurate)/, negative: /is (false|incorrect|inaccurate|wrong)/ },
      { positive: /increases?/, negative: /decreases?/ },
      { positive: /improves?/, negative: /worsens?/ },
    ];

    for (const pattern of contradictionPatterns) {
      const claim1Positive = pattern.positive.test(text1);
      const claim1Negative = pattern.negative.test(text1);
      const claim2Positive = pattern.positive.test(text2);
      const claim2Negative = pattern.negative.test(text2);

      if ((claim1Positive && claim2Negative) || (claim1Negative && claim2Positive)) {
        return {
          claim1Id: claim1.id,
          claim2Id: claim2.id,
          description: `Claims contradict each other on the same topic`,
          severity: 'high'
        };
      }
    }

    return null;
  }

  /**
   * Map evidence to claims
   */
  async mapEvidence(claims: Claim[], sources: Source[]): Promise<Evidence[]> {
    // Placeholder - will implement evidence mapping
    return [];
  }
}

export const researchService = new ResearchService();
