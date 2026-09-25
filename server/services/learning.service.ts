/**
 * Learning Service
 * Records learning signals and detects patterns from actual data
 */

import { Pool } from 'pg';
import { getAIProvider } from './ai/provider';

export type LearningSignalType =
  | 'USER_EDIT'
  | 'APPROVAL'
  | 'REJECTION'
  | 'REGENERATION'
  | 'CONTENT_PERFORMANCE'
  | 'LEAD_RESPONSE'
  | 'OBJECTION'
  | 'CONVERSATION_OUTCOME';

export type LearningScope = 'WORKSPACE' | 'PERSONA' | 'CONTENT_PILLAR' | 'TOPIC';

export interface LearningSignal {
  signalType: LearningSignalType;
  scope: LearningScope;
  scopeId?: string;
  data: Record<string, any>;
  confidence: number;
  workspaceId: string;
  userId?: string;
}

export interface LearningPattern {
  id: string;
  pattern: string;
  evidence: string[];
  confidence: number;
  scope: LearningScope;
  scopeId?: string;
  workspaceId: string;
  createdAt: Date;
}

export class LearningService {
  constructor(private pool: Pool) {}

  /**
   * Record a learning signal
   */
  async recordSignal(signal: LearningSignal): Promise<void> {
    await this.pool.query(
      `INSERT INTO learning_signals (workspace_id, signal_type, scope, scope_id, data, confidence, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        signal.workspaceId,
        signal.signalType,
        signal.scope,
        signal.scopeId || null,
        JSON.stringify(signal.data),
        signal.confidence
      ]
    );
  }

  /**
   * Record user edit signal
   */
  async recordUserEdit(
    workspaceId: string,
    contentId: string,
    edits: { field: string; before: string; after: string }[],
    userId?: string
  ): Promise<void> {
    await this.recordSignal({
      signalType: 'USER_EDIT',
      scope: 'WORKSPACE',
      data: { contentId, edits },
      confidence: 1.0,
      workspaceId,
      userId
    });
  }

  /**
   * Record approval signal
   */
  async recordApproval(
    workspaceId: string,
    contentId: string,
    userId?: string
  ): Promise<void> {
    await this.recordSignal({
      signalType: 'APPROVAL',
      scope: 'WORKSPACE',
      data: { contentId },
      confidence: 1.0,
      workspaceId,
      userId
    });
  }

  /**
   * Record rejection signal
   */
  async recordRejection(
    workspaceId: string,
    contentId: string,
    reason?: string,
    userId?: string
  ): Promise<void> {
    await this.recordSignal({
      signalType: 'REJECTION',
      scope: 'WORKSPACE',
      data: { contentId, reason },
      confidence: 1.0,
      workspaceId,
      userId
    });
  }

  /**
   * Record content performance signal
   */
  async recordContentPerformance(
    workspaceId: string,
    contentId: string,
    metrics: {
      impressions?: number;
      reach?: number;
      reactions?: number;
      comments?: number;
      shares?: number;
    }
  ): Promise<void> {
    await this.recordSignal({
      signalType: 'CONTENT_PERFORMANCE',
      scope: 'WORKSPACE',
      data: { contentId, metrics },
      confidence: 1.0,
      workspaceId
    });
  }

  /**
   * Record objection signal
   */
  async recordObjection(
    workspaceId: string,
    leadId: string,
    objection: string,
    userId?: string
  ): Promise<void> {
    await this.recordSignal({
      signalType: 'OBJECTION',
      scope: 'WORKSPACE',
      data: { leadId, objection },
      confidence: 1.0,
      workspaceId,
      userId
    });
  }

  /**
   * Detect patterns from learning signals
   */
  async detectPatterns(workspaceId: string): Promise<LearningPattern[]> {
    const patterns: LearningPattern[] = [];

    // Pattern 1: Most edited fields
    const editPatterns = await this.detectEditPatterns(workspaceId);
    patterns.push(...editPatterns);

    // Pattern 2: High-performing content characteristics
    const performancePatterns = await this.detectPerformancePatterns(workspaceId);
    patterns.push(...performancePatterns);

    // Pattern 3: Common objections
    const objectionPatterns = await this.detectObjectionPatterns(workspaceId);
    patterns.push(...objectionPatterns);

    // Pattern 4: Approval/rejection patterns
    const approvalPatterns = await this.detectApprovalPatterns(workspaceId);
    patterns.push(...approvalPatterns);

    return patterns;
  }

  /**
   * Detect edit patterns
   */
  private async detectEditPatterns(workspaceId: string): Promise<LearningPattern[]> {
    const result = await this.pool.query(
      `SELECT data, COUNT(*) as count
       FROM learning_signals
       WHERE workspace_id = $1 AND signal_type = 'USER_EDIT'
       GROUP BY data
       HAVING COUNT(*) >= 3
       ORDER BY count DESC
       LIMIT 10`,
      [workspaceId]
    );

    return result.rows.map((row, idx) => ({
      id: `edit_pattern_${idx}`,
      pattern: `Frequently edited: ${JSON.stringify(row.data)}`,
      evidence: [`${row.count} occurrences`],
      confidence: Math.min(row.count / 10, 1.0),
      scope: 'WORKSPACE' as LearningScope,
      workspaceId,
      createdAt: new Date()
    }));
  }

  /**
   * Detect performance patterns
   */
  private async detectPerformancePatterns(workspaceId: string): Promise<LearningPattern[]> {
    const result = await this.pool.query(
      `SELECT data
       FROM learning_signals
       WHERE workspace_id = $1 AND signal_type = 'CONTENT_PERFORMANCE'
       ORDER BY created_at DESC
       LIMIT 20`,
      [workspaceId]
    );

    if (result.rows.length < 5) {
      return []; // Not enough data
    }

    try {
      const ai = getAIProvider();
      const performanceData = result.rows.map(r => r.data);
      
      const prompt = `Analyze these content performance metrics and identify patterns.

PERFORMANCE DATA:
${JSON.stringify(performanceData, null, 2)}

Identify patterns in JSON format:
{
  "patterns": [
    {
      "pattern": "description of pattern",
      "evidence": ["evidence 1", "evidence 2"],
      "confidence": 0.0-1.0
    }
  ]
}`;

      const analysis = await ai.completeStructured<{
        patterns: Array<{
          pattern: string;
          evidence: string[];
          confidence: number;
        }>;
      }>(prompt, {}, { temperature: 0.3 });

      return analysis.patterns.map((p, idx) => ({
        id: `perf_pattern_${idx}`,
        pattern: p.pattern,
        evidence: p.evidence,
        confidence: p.confidence,
        scope: 'WORKSPACE' as LearningScope,
        workspaceId,
        createdAt: new Date()
      }));
    } catch (error) {
      console.error('Failed to detect performance patterns:', error);
      return [];
    }
  }

  /**
   * Detect objection patterns
   */
  private async detectObjectionPatterns(workspaceId: string): Promise<LearningPattern[]> {
    const result = await this.pool.query(
      `SELECT data->>'objection' as objection, COUNT(*) as count
       FROM learning_signals
       WHERE workspace_id = $1 AND signal_type = 'OBJECTION'
       GROUP BY data->>'objection'
       HAVING COUNT(*) >= 2
       ORDER BY count DESC
       LIMIT 10`,
      [workspaceId]
    );

    return result.rows.map((row, idx) => ({
      id: `objection_pattern_${idx}`,
      pattern: `Common objection: ${row.objection}`,
      evidence: [`Mentioned ${row.count} times`],
      confidence: Math.min(row.count / 5, 1.0),
      scope: 'WORKSPACE' as LearningScope,
      workspaceId,
      createdAt: new Date()
    }));
  }

  /**
   * Detect approval/rejection patterns
   */
  private async detectApprovalPatterns(workspaceId: string): Promise<LearningPattern[]> {
    const result = await this.pool.query(
      `SELECT 
        signal_type,
        COUNT(*) as count
       FROM learning_signals
       WHERE workspace_id = $1 
         AND signal_type IN ('APPROVAL', 'REJECTION')
       GROUP BY signal_type`,
      [workspaceId]
    );

    const approvals = result.rows.find(r => r.signal_type === 'APPROVAL')?.count || 0;
    const rejections = result.rows.find(r => r.signal_type === 'REJECTION')?.count || 0;
    const total = approvals + rejections;

    if (total < 5) {
      return []; // Not enough data
    }

    const approvalRate = approvals / total;

    return [{
      id: 'approval_pattern',
      pattern: `Content approval rate: ${(approvalRate * 100).toFixed(1)}%`,
      evidence: [`${approvals} approvals`, `${rejections} rejections`],
      confidence: Math.min(total / 20, 1.0),
      scope: 'WORKSPACE' as LearningScope,
      workspaceId,
      createdAt: new Date()
    }];
  }

  /**
   * Get learning insights for workspace
   */
  async getInsights(workspaceId: string): Promise<{
    patterns: LearningPattern[];
    recommendations: string[];
  }> {
    const patterns = await this.detectPatterns(workspaceId);
    const recommendations: string[] = [];

    // Generate recommendations based on patterns
    for (const pattern of patterns) {
      if (pattern.pattern.includes('objection')) {
        recommendations.push(`Create content addressing common objection: ${pattern.pattern}`);
      }
      if (pattern.pattern.includes('approval rate')) {
        const match = pattern.pattern.match(/([\d.]+)%/);
        if (match) {
          const rate = parseFloat(match[1]);
          if (rate < 50) {
            recommendations.push('Consider reviewing content quality guidelines - approval rate is below 50%');
          }
        }
      }
    }

    return { patterns, recommendations };
  }
}

export const learningService = new LearningService(null as any);
