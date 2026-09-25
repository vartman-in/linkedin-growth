/**
 * Research Intelligence Service
 * Handles source fetching, extraction, and analysis with security protections
 */

import { Source, Claim, Contradiction, Evidence, ResearchResult, AIContext } from './index';
import { v4 as uuidv4 } from 'uuid';

// Security constants
const MAX_URL_LENGTH = 2048;
const MAX_RESPONSE_SIZE = 10 * 1024 * 1024; // 10MB
const REQUEST_TIMEOUT = 30000; // 30 seconds
const ALLOWED_PROTOCOLS = ['http:', 'https:'];
const BLOCKED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];

export class ResearchService {
  /**
   * Research a topic by fetching and analyzing sources
   */
  async research(topic: string, context: AIContext): Promise<ResearchResult> {
    // For now, return empty result - will integrate with actual AI providers
    return {
      topic,
      sources: [],
      claims: [],
      contradictions: [],
      evidence: [],
      confidence: 0
    };
  }

  /**
   * Fetch a source with SSRF protection
   */
  async fetchSource(url: string): Promise<Source> {
    // Validate URL
    this.validateUrl(url);

    try {
      // Note: Actual fetching will be implemented when AI provider is integrated
      // This is the security validation layer
      const source: Source = {
        id: uuidv4(),
        url,
        title: '',
        content: '',
        type: 'web',
        extractedAt: new Date()
      };

      return source;
    } catch (error) {
      throw new Error(`Failed to fetch source: ${error.message}`);
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
   * Extract claims from a source
   */
  async extractClaims(source: Source): Promise<Claim[]> {
    // Placeholder - will integrate with AI provider for claim extraction
    return [];
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
