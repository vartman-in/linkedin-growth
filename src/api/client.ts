/**
 * API Client for Growth Operator Backend
 * Handles authentication and API requests
 */

const API_BASE = (window as any).__ENV__?.VITE_API_URL || 'http://localhost:3001/api/v1';

class ApiError extends Error {
  constructor(public status: number, public data: any) {
    super(data?.error?.message || 'API Error');
    this.name = 'ApiError';
  }
}

// Token management
let authToken: string | null = localStorage.getItem('auth_token');

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      
      // Handle 401 Unauthorized - redirect to login
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        authToken = null;
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      
      throw new ApiError(response.status, data);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error(`Network error: ${(error as Error).message}`);
  }
}

// ============ AUTH API ============

export const authApi = {
  register: (email: string, password: string, name: string) =>
    request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<any>('/auth/me'),

  workspaces: () => request<any[]>('/auth/workspaces'),

  createWorkspace: (name: string) =>
    request<any>('/auth/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
};

// ============ WORKSPACE API ============

export const workspaceApi = {
  getAll: () => request<any[]>('/workspaces'),
  
  getById: (id: string) => request<any>(`/workspaces/${id}`),
  
  create: (name: string) => 
    request<any>('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  
  update: (id: string, name: string) =>
    request<any>(`/workspaces/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    }),
  
  delete: (id: string) =>
    request<void>(`/workspaces/${id}`, {
      method: 'DELETE',
    }),
};

// ============ PROFILE API ============

export const profileApi = {
  getAll: () => request<any[]>('/profiles'),
  
  getMe: () => request<any>('/profiles/me'),
  
  create: (data: any) =>
    request<any>('/profiles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  updateMe: (data: any) =>
    request<any>('/profiles/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  deleteMe: () =>
    request<void>('/profiles/me', {
      method: 'DELETE',
    }),
};

// ============ ICP API ============

export const icpApi = {
  getAll: () => request<any[]>('/icps'),
  
  getById: (id: string) => request<any>(`/icps/${id}`),
  
  create: (data: any) =>
    request<any>('/icps', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: any) =>
    request<any>(`/icps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    request<void>(`/icps/${id}`, {
      method: 'DELETE',
    }),
};

// ============ CONTENT IDEAS API ============

export const contentIdeasApi = {
  getAll: (status?: string) => 
    request<any[]>(`/content-ideas/ideas${status ? `?status=${status}` : ''}`),
  
  getById: (id: string) => request<any>(`/content-ideas/ideas/${id}`),
  
  create: (data: any) =>
    request<any>('/content-ideas/ideas', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: any) =>
    request<any>(`/content-ideas/ideas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    request<void>(`/content-ideas/ideas/${id}`, {
      method: 'DELETE',
    }),
  
  generateDraft: (id: string, context?: any) =>
    request<any>(`/content-ideas/ideas/${id}/generate`, {
      method: 'POST',
      body: JSON.stringify(context || {}),
    }),
};

// ============ CONTENT DRAFTS API ============

export const contentDraftsApi = {
  getAll: (status?: string) => 
    request<any[]>(`/content-ideas/drafts${status ? `?status=${status}` : ''}`),
  
  getById: (id: string) => request<any>(`/content-ideas/drafts/${id}`),
  
  update: (id: string, data: any) =>
    request<any>(`/content-ideas/drafts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  approve: (id: string) =>
    request<any>(`/content-ideas/drafts/${id}/approve`, {
      method: 'POST',
    }),
  
  delete: (id: string) =>
    request<void>(`/content-ideas/drafts/${id}`, {
      method: 'DELETE',
    }),
};

// ============ LEADS API ============

export const leadsApi = {
  getAll: (status?: string) => 
    request<any[]>(`/sales/leads${status ? `?status=${status}` : ''}`),
  
  getById: (id: string) => request<any>(`/sales/leads/${id}`),
  
  create: (data: any) =>
    request<any>('/sales/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: any) =>
    request<any>(`/sales/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  qualify: (id: string) =>
    request<any>(`/sales/leads/${id}/qualify`, {
      method: 'POST',
    }),
  
  generateOutreach: (id: string, context?: any) =>
    request<{ message: string }>(`/sales/leads/${id}/outreach`, {
      method: 'POST',
      body: JSON.stringify(context || {}),
    }),
  
  delete: (id: string) =>
    request<void>(`/sales/leads/${id}`, {
      method: 'DELETE',
    }),
  
  getConversations: (id: string) =>
    request<any[]>(`/sales/leads/${id}/conversations`),
};

// ============ CONVERSATIONS API ============

export const conversationsApi = {
  getAll: () => request<any[]>('/sales/conversations'),
  
  create: (leadId: string, channel: string) =>
    request<any>('/sales/conversations', {
      method: 'POST',
      body: JSON.stringify({ leadId, channel }),
    }),
  
  getById: (id: string) => request<any>(`/sales/conversations/${id}`),
  
  getMessages: (id: string) =>
    request<any[]>(`/sales/conversations/${id}/messages`),
  
  addMessage: (id: string, direction: 'INBOUND' | 'OUTBOUND', body: string) =>
    request<any>(`/sales/conversations/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ direction, body }),
    }),
  
  classifyMessage: (message: string) =>
    request<{ intent: string; confidence: number }>('/sales/messages/classify', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
};

// ============ PIPELINE API ============

export const pipelineApi = {
  getAll: (stage?: string) => 
    request<any[]>(`/sales/pipeline${stage ? `?stage=${stage}` : ''}`),
  
  getById: (id: string) => request<any>(`/sales/pipeline/${id}`),
  
  create: (leadId: string, data?: any) =>
    request<any>('/sales/pipeline', {
      method: 'POST',
      body: JSON.stringify({ leadId, ...data }),
    }),
  
  updateStage: (id: string, stage: string) =>
    request<any>(`/sales/pipeline/${id}/stage`, {
      method: 'PUT',
      body: JSON.stringify({ stage }),
    }),
};

// ============ INTELLIGENCE API ============

export const intelligenceApi = {
  getContentInsights: () =>
    request<any>('/intelligence/content-insights'),
  
  getSalesInsights: () =>
    request<any>('/intelligence/sales-insights'),
  
  getKnowledgeGraph: () =>
    request<any>('/intelligence/knowledge-graph'),
  
  getContentRecommendations: () =>
    request<any[]>('/intelligence/content-recommendations'),
  
  getLeadRecommendations: () =>
    request<any[]>('/intelligence/lead-recommendations'),
};

// ============ INTELLIGENCE ENGINE API ============

export const intelligenceEngineApi = {
  // Source Management
  ingestSource: (url: string) =>
    request<any>('/intelligence-engine/sources/ingest', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),
  
  batchIngest: (urls: string[]) =>
    request<any>('/intelligence-engine/sources/batch-ingest', {
      method: 'POST',
      body: JSON.stringify({ urls }),
    }),
  
  getSources: (limit?: number, offset?: number) =>
    request<any[]>(`/intelligence-engine/sources${limit ? `?limit=${limit}` : ''}${offset ? `&offset=${offset}` : ''}`),
  
  getSource: (id: string) =>
    request<any>(`/intelligence-engine/sources/${id}`),
  
  processSource: (id: string) =>
    request<any>(`/intelligence-engine/sources/${id}/process`, {
      method: 'POST',
    }),
  
  // Topics
  getTopics: (limit?: number) =>
    request<any[]>(`/intelligence-engine/topics${limit ? `?limit=${limit}` : ''}`),
  
  getTopic: (id: string) =>
    request<any>(`/intelligence-engine/topics/${id}`),
  
  clusterTopics: () =>
    request<any[]>('/intelligence-engine/topics/cluster', {
      method: 'POST',
    }),
  
  // Trends
  getTrends: (limit?: number) =>
    request<any[]>(`/intelligence-engine/trends${limit ? `?limit=${limit}` : ''}`),
  
  detectTrends: () =>
    request<any[]>('/intelligence-engine/trends/detect', {
      method: 'POST',
    }),
  
  getTrendingTopics: () =>
    request<any[]>('/intelligence-engine/trends/trending'),
  
  // Opportunities
  getOpportunities: (status?: string, limit?: number) =>
    request<any[]>(`/intelligence-engine/opportunities${status ? `?status=${status}` : ''}${limit ? `&limit=${limit}` : ''}`),
  
  getOpportunity: (id: string) =>
    request<any>(`/intelligence-engine/opportunities/${id}`),
  
  generateOpportunities: (profile?: any, icp?: any) =>
    request<any[]>('/intelligence-engine/opportunities/generate', {
      method: 'POST',
      body: JSON.stringify({ profile, icp }),
    }),
  
  updateOpportunityStatus: (id: string, status: string) =>
    request<any>(`/intelligence-engine/opportunities/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  
  convertOpportunityToIdea: (id: string) =>
    request<any>(`/intelligence-engine/opportunities/${id}/convert`, {
      method: 'POST',
    }),
  
  // Gaps
  getGaps: (limit?: number) =>
    request<any[]>(`/intelligence-engine/gaps${limit ? `?limit=${limit}` : ''}`),
  
  detectGaps: () =>
    request<any[]>('/intelligence-engine/gaps/detect', {
      method: 'POST',
    }),
  
  // Summary
  getSummary: () =>
    request<any>('/intelligence-engine/summary'),
  
  // Full Pipeline
  processUrl: (url: string, profile?: any, icp?: any) =>
    request<any>('/intelligence-engine/process', {
      method: 'POST',
      body: JSON.stringify({ url, profile, icp }),
    }),
  
  batchProcess: (urls: string[], profile?: any, icp?: any) =>
    request<any>('/intelligence-engine/batch-process', {
      method: 'POST',
      body: JSON.stringify({ urls, profile, icp }),
    }),
};

// ============ HEALTH API ============

export const healthApi = {
  check: () => request<{ status: string; timestamp: string; version: string }>('/health'),
};

// ============ CLOSED-LOOP API ============

export const closedLoopApi = {
  // Feedback
  recordFeedback: (data: {
    entityType: 'opportunity' | 'idea' | 'draft' | 'content' | 'topic';
    entityId: string;
    feedbackType: 'accepted' | 'dismissed' | 'edited' | 'converted' | 'published' | 'rejected';
    feedbackData?: Record<string, any>;
  }) =>
    request<any>('/closed-loop/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getFeedbackSummary: () => request<any>('/closed-loop/feedback'),

  getRecentFeedback: (limit?: number) =>
    request<any[]>(`/closed-loop/feedback/recent${limit ? `?limit=${limit}` : ''}`),

  getEntityFeedback: (entityType: string, entityId: string) =>
    request<any[]>(`/closed-loop/feedback/${entityType}/${entityId}`),

  // Performance
  recordPerformance: (data: {
    contentId: string;
    platform: string;
    publishedAt: string;
    metrics: Record<string, number>;
    provenance: 'VERIFIED_PLATFORM' | 'USER_ENTERED' | 'IMPORTED' | 'SYSTEM_CALCULATED';
    sourceReference?: string;
  }) =>
    request<any>('/closed-loop/performance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getRecentPerformance: (limit?: number) =>
    request<any[]>(`/closed-loop/performance${limit ? `?limit=${limit}` : ''}`),

  getContentPerformance: (contentId: string) =>
    request<any[]>(`/closed-loop/performance/${contentId}`),

  // Patterns
  detectPatterns: () =>
    request<any>('/closed-loop/patterns/detect', {
      method: 'POST',
    }),

  getPatterns: (patternType?: string) =>
    request<any[]>(`/closed-loop/patterns${patternType ? `?patternType=${patternType}` : ''}`),

  // Insights
  generateInsights: () =>
    request<any>('/closed-loop/insights/generate', {
      method: 'POST',
    }),

  getInsights: (insightType?: string, limit?: number) =>
    request<any[]>(`/closed-loop/insights${insightType ? `?insightType=${insightType}` : ''}${limit ? `&limit=${limit}` : ''}`),

  // Jobs
  scheduleJob: (jobType: string, scheduledAt: string) =>
    request<any>('/closed-loop/jobs/schedule', {
      method: 'POST',
      body: JSON.stringify({ jobType, scheduledAt }),
    }),

  getRecentJobs: (limit?: number) =>
    request<any[]>(`/closed-loop/jobs${limit ? `?limit=${limit}` : ''}`),
};
