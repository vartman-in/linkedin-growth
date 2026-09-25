/**
 * Shared Intelligence Layer
 * Connects Content Machine and Sales Machine through shared knowledge
 */

import { Pool } from 'pg';

export class SharedIntelligenceService {
  constructor(private pool: Pool) {}

  /**
   * Get content insights from sales data
   * Identifies recurring objections, questions, and topics from conversations
   */
  async getContentInsightsFromSales(workspaceId: string): Promise<{
    recurringObjections: Array<{ topic: string; count: number; examples: string[] }>;
    recurringQuestions: Array<{ topic: string; count: number; examples: string[] }>;
    hotTopics: Array<{ topic: string; count: number; leads: string[] }>;
  }> {
    // Get all conversations for workspace
    const conversations = await this.pool.query(
      `SELECT c.id, c.lead_id, m.body, m.direction
       FROM conversations c
       JOIN messages m ON m.conversation_id = c.id
       WHERE c.workspace_id = $1 AND m.direction = 'INBOUND'
       ORDER BY m.created_at DESC`,
      [workspaceId]
    );

    const objections: Map<string, { count: number; examples: string[] }> = new Map();
    const questions: Map<string, { count: number; examples: string[] }> = new Map();
    const topics: Map<string, { count: number; leads: Set<string> }> = new Map();

    // Analyze messages
    for (const row of conversations.rows) {
      const message = row.body.toLowerCase();
      
      // Detect objections
      if (message.includes('too expensive') || message.includes('not sure') || message.includes('concern')) {
        const topic = 'pricing/concerns';
        if (!objections.has(topic)) {
          objections.set(topic, { count: 0, examples: [] });
        }
        objections.get(topic)!.count++;
        if (objections.get(topic)!.examples.length < 3) {
          objections.get(topic)!.examples.push(row.body);
        }
      }
      
      // Detect questions
      if (message.includes('?')) {
        const topic = 'general question';
        if (!questions.has(topic)) {
          questions.set(topic, { count: 0, examples: [] });
        }
        questions.get(topic)!.count++;
        if (questions.get(topic)!.examples.length < 3) {
          questions.get(topic)!.examples.push(row.body);
        }
      }
      
      // Detect topics
      const keywords = this.extractKeywords(row.body);
      for (const keyword of keywords) {
        if (!topics.has(keyword)) {
          topics.set(keyword, { count: 0, leads: new Set() });
        }
        topics.get(keyword)!.count++;
        topics.get(keyword)!.leads.add(row.lead_id);
      }
    }

    return {
      recurringObjections: Array.from(objections.entries()).map(([topic, data]) => ({
        topic,
        count: data.count,
        examples: data.examples
      })),
      recurringQuestions: Array.from(questions.entries()).map(([topic, data]) => ({
        topic,
        count: data.count,
        examples: data.examples
      })),
      hotTopics: Array.from(topics.entries())
        .map(([topic, data]) => ({
          topic,
          count: data.count,
          leads: Array.from(data.leads)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    };
  }

  /**
   * Get sales insights from content performance
   * Identifies which content generates the most qualified conversations
   */
  async getSalesInsightsFromContent(workspaceId: string): Promise<{
    topPerformingContent: Array<{
      contentId: string;
      title: string;
      engagement: number;
      leadsGenerated: number;
    }>;
    contentToLeadMapping: Array<{
      contentId: string;
      leadIds: string[];
    }>;
  }> {
    // This would require analytics data which isn't implemented yet
    // Placeholder for future implementation
    return {
      topPerformingContent: [],
      contentToLeadMapping: []
    };
  }

  /**
   * Get knowledge graph for workspace
   * Connects people, companies, topics, content, and conversations
   */
  async getKnowledgeGraph(workspaceId: string): Promise<{
    nodes: Array<{
      id: string;
      type: 'person' | 'company' | 'topic' | 'content' | 'conversation';
      label: string;
      data: any;
    }>;
    edges: Array<{
      source: string;
      target: string;
      type: string;
      weight: number;
    }>;
  }> {
    const nodes: any[] = [];
    const edges: any[] = [];

    // Get leads (people)
    const leads = await this.pool.query(
      'SELECT * FROM leads WHERE workspace_id = $1',
      [workspaceId]
    );

    for (const lead of leads.rows) {
      nodes.push({
        id: lead.id,
        type: 'person',
        label: lead.name,
        data: lead
      });

      // Add company node if exists
      if (lead.company) {
        const companyId = `company_${lead.company}`;
        if (!nodes.find(n => n.id === companyId)) {
          nodes.push({
            id: companyId,
            type: 'company',
            label: lead.company,
            data: { name: lead.company }
          });
        }
        edges.push({
          source: lead.id,
          target: companyId,
          type: 'works_at',
          weight: 1
        });
      }
    }

    // Get content
    const content = await this.pool.query(
      'SELECT * FROM content_ideas WHERE workspace_id = $1',
      [workspaceId]
    );

    for (const item of content.rows) {
      nodes.push({
        id: item.id,
        type: 'content',
        label: item.title,
        data: item
      });

      // Extract topics from content
      const topics = this.extractKeywords(item.title);
      for (const topic of topics) {
        const topicId = `topic_${topic}`;
        if (!nodes.find(n => n.id === topicId)) {
          nodes.push({
            id: topicId,
            type: 'topic',
            label: topic,
            data: { name: topic }
          });
        }
        edges.push({
          source: item.id,
          target: topicId,
          type: 'about',
          weight: 1
        });
      }
    }

    return { nodes, edges };
  }

  /**
   * Get content recommendations based on sales intelligence
   */
  async getContentRecommendations(workspaceId: string): Promise<Array<{
    topic: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
    source: 'sales_objection' | 'sales_question' | 'hot_topic' | 'content_gap';
  }>> {
    const insights = await this.getContentInsightsFromSales(workspaceId);
    const recommendations: any[] = [];

    // Recommendations from objections
    for (const objection of insights.recurringObjections) {
      if (objection.count >= 2) {
        recommendations.push({
          topic: objection.topic,
          reason: `Recurring objection in ${objection.count} conversations`,
          priority: objection.count >= 3 ? 'high' : 'medium',
          source: 'sales_objection'
        });
      }
    }

    // Recommendations from questions
    for (const question of insights.recurringQuestions) {
      if (question.count >= 2) {
        recommendations.push({
          topic: question.topic,
          reason: `Recurring question in ${question.count} conversations`,
          priority: question.count >= 3 ? 'high' : 'medium',
          source: 'sales_question'
        });
      }
    }

    // Recommendations from hot topics
    for (const topic of insights.hotTopics) {
      if (topic.count >= 3) {
        recommendations.push({
          topic: topic.topic,
          reason: `Hot topic mentioned in ${topic.count} conversations`,
          priority: topic.count >= 5 ? 'high' : 'medium',
          source: 'hot_topic'
        });
      }
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Get lead recommendations based on content engagement
   */
  async getLeadRecommendations(workspaceId: string): Promise<Array<{
    leadId: string;
    leadName: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
    suggestedAction: string;
  }>> {
    // This would require analytics data which isn't implemented yet
    // Placeholder for future implementation
    return [];
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
    ]);

    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w));

    // Return top keywords
    const wordCounts = new Map<string, number>();
    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }

    return Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }
}

export const sharedIntelligenceService = new SharedIntelligenceService(null as any);
