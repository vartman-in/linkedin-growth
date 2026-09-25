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
  getMe: () => request<any>('/profiles/me'),
  
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

// ============ HEALTH API ============

export const healthApi = {
  check: () => request<{ status: string; timestamp: string; version: string }>('/health'),
};
