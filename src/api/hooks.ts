/**
 * React Hooks for Growth Operator API
 * Provides type-safe, easy-to-use hooks for all API operations
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  workspaceApi, 
  profileApi, 
  icpApi, 
  contentIdeasApi, 
  contentDraftsApi,
  leadsApi,
  conversationsApi,
  pipelineApi,
  intelligenceApi,
  healthApi
} from '../api/client';

// ============ GENERIC HOOKS ============

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useApi<T>(
  apiCall: () => Promise<T>,
  deps: any[] = []
): UseApiState<T> & { refetch: () => void } {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await apiCall();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: (error as Error).message
      });
    }
  }, deps);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

// ============ WORKSPACE HOOKS ============

export function useWorkspaces() {
  return useApi(() => workspaceApi.getAll());
}

export function useWorkspace(id: string) {
  return useApi(() => workspaceApi.getById(id), [id]);
}

// ============ PROFILE HOOKS ============

export function useProfile() {
  return useApi(() => profileApi.getMe());
}

export function useUpdateProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await profileApi.updateMe(data);
      setLoading(false);
      return result;
    } catch (error) {
      setError((error as Error).message);
      setLoading(false);
      throw error;
    }
  };

  return { updateProfile, loading, error };
}

// ============ ICP HOOKS ============

export function useICPs() {
  return useApi(() => icpApi.getAll());
}

export function useICP(id: string) {
  return useApi(() => icpApi.getById(id), [id]);
}

// ============ CONTENT IDEAS HOOKS ============

export function useContentIdeas(status?: string) {
  return useApi(() => contentIdeasApi.getAll(status), [status]);
}

export function useContentIdea(id: string) {
  return useApi(() => contentIdeasApi.getById(id), [id]);
}

export function useCreateContentIdea() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createIdea = async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await contentIdeasApi.create(data);
      setLoading(false);
      return result;
    } catch (error) {
      setError((error as Error).message);
      setLoading(false);
      throw error;
    }
  };

  return { createIdea, loading, error };
}

export function useGenerateDraft() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateDraft = async (ideaId: string, context?: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await contentIdeasApi.generateDraft(ideaId, context);
      setLoading(false);
      return result;
    } catch (error) {
      setError((error as Error).message);
      setLoading(false);
      throw error;
    }
  };

  return { generateDraft, loading, error };
}

// ============ CONTENT DRAFTS HOOKS ============

export function useContentDrafts(status?: string) {
  return useApi(() => contentDraftsApi.getAll(status), [status]);
}

export function useContentDraft(id: string) {
  return useApi(() => contentDraftsApi.getById(id), [id]);
}

export function useApproveDraft() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approveDraft = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await contentDraftsApi.approve(id);
      setLoading(false);
      return result;
    } catch (error) {
      setError((error as Error).message);
      setLoading(false);
      throw error;
    }
  };

  return { approveDraft, loading, error };
}

// ============ LEADS HOOKS ============

export function useLeads(status?: string) {
  return useApi(() => leadsApi.getAll(status), [status]);
}

export function useLead(id: string) {
  return useApi(() => leadsApi.getById(id), [id]);
}

export function useCreateLead() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLead = async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await leadsApi.create(data);
      setLoading(false);
      return result;
    } catch (error) {
      setError((error as Error).message);
      setLoading(false);
      throw error;
    }
  };

  return { createLead, loading, error };
}

export function useQualifyLead() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qualifyLead = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await leadsApi.qualify(id);
      setLoading(false);
      return result;
    } catch (error) {
      setError((error as Error).message);
      setLoading(false);
      throw error;
    }
  };

  return { qualifyLead, loading, error };
}

export function useGenerateOutreach() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateOutreach = async (leadId: string, context?: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await leadsApi.generateOutreach(leadId, context);
      setLoading(false);
      return result;
    } catch (error) {
      setError((error as Error).message);
      setLoading(false);
      throw error;
    }
  };

  return { generateOutreach, loading, error };
}

// ============ CONVERSATIONS HOOKS ============

export function useConversations(leadId: string) {
  return useApi(() => leadsApi.getConversations(leadId), [leadId]);
}

export function useConversation(id: string) {
  return useApi(() => conversationsApi.getById(id), [id]);
}

export function useMessages(conversationId: string) {
  return useApi(() => conversationsApi.getMessages(conversationId), [conversationId]);
}

export function useAddMessage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMessage = async (conversationId: string, direction: 'INBOUND' | 'OUTBOUND', body: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await conversationsApi.addMessage(conversationId, direction, body);
      setLoading(false);
      return result;
    } catch (error) {
      setError((error as Error).message);
      setLoading(false);
      throw error;
    }
  };

  return { addMessage, loading, error };
}

export function useClassifyMessage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const classifyMessage = async (message: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await conversationsApi.classifyMessage(message);
      setLoading(false);
      return result;
    } catch (error) {
      setError((error as Error).message);
      setLoading(false);
      throw error;
    }
  };

  return { classifyMessage, loading, error };
}

// ============ PIPELINE HOOKS ============

export function usePipeline(stage?: string) {
  return useApi(() => pipelineApi.getAll(stage), [stage]);
}

export function useOpportunity(id: string) {
  return useApi(() => pipelineApi.getById(id), [id]);
}

// ============ INTELLIGENCE HOOKS ============

export function useContentInsights() {
  return useApi(() => intelligenceApi.getContentInsights());
}

export function useSalesInsights() {
  return useApi(() => intelligenceApi.getSalesInsights());
}

export function useKnowledgeGraph() {
  return useApi(() => intelligenceApi.getKnowledgeGraph());
}

export function useContentRecommendations() {
  return useApi(() => intelligenceApi.getContentRecommendations());
}

export function useLeadRecommendations() {
  return useApi(() => intelligenceApi.getLeadRecommendations());
}

// ============ HEALTH HOOKS ============

export function useHealth() {
  return useApi(() => healthApi.check());
}
