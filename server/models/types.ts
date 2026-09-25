export interface Workspace {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'OWNER' | 'MEMBER';
  created_at: Date;
}

export interface Profile {
  id: string;
  workspace_id: string;
  user_id: string;
  display_name: string | null;
  headline: string | null;
  role: string | null;
  company: string | null;
  bio: string | null;
  voice_tone: string | null;
  banned_words: string[];
  proof_points: string[];
  created_at: Date;
  updated_at: Date;
}

export interface ICP {
  id: string;
  workspace_id: string;
  name: string;
  target_roles: string[];
  industries: string[];
  company_sizes: string[];
  geography: string[];
  seniority: string[];
  problems: string[];
  buying_signals: string[];
  exclusions: string[];
  created_at: Date;
  updated_at: Date;
}

export type ContentIdeaStatus = 'NEW' | 'RESEARCHING' | 'VALIDATED' | 'ARCHIVED';

export interface ContentIdea {
  id: string;
  workspace_id: string;
  title: string;
  source_reference: string | null;
  pillar: string | null;
  audience: string | null;
  angle: string | null;
  status: ContentIdeaStatus;
  created_at: Date;
  updated_at: Date;
}

export type ContentDraftStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';

export interface ContentDraft {
  id: string;
  workspace_id: string;
  idea_id: string | null;
  title: string;
  body: string;
  content_type: string;
  status: ContentDraftStatus;
  version: number;
  created_at: Date;
  updated_at: Date;
}

export type LeadStatus = 'NEW' | 'RESEARCHED' | 'QUALIFIED' | 'CONTACTED' | 'RESPONDED' | 'CONVERTED' | 'LOST';

export interface Lead {
  id: string;
  workspace_id: string;
  name: string;
  profile_url: string | null;
  company: string | null;
  title: string | null;
  status: LeadStatus;
  source: string | null;
  created_at: Date;
  updated_at: Date;
}

export type ConversationStatus = 'ACTIVE' | 'CLOSED' | 'ARCHIVED';

export interface Conversation {
  id: string;
  workspace_id: string;
  lead_id: string | null;
  channel: string;
  status: ConversationStatus;
  created_at: Date;
  updated_at: Date;
}

export type MessageDirection = 'INBOUND' | 'OUTBOUND';

export interface Message {
  id: string;
  conversation_id: string;
  direction: MessageDirection;
  body: string;
  created_at: Date;
}

export type OpportunityStage = 'DISCOVERED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';

export interface PipelineOpportunity {
  id: string;
  workspace_id: string;
  lead_id: string | null;
  stage: OpportunityStage;
  value: number | null;
  source: string | null;
  created_at: Date;
  updated_at: Date;
}

export type AnalyticsProvenance = 'VERIFIED_PLATFORM_DATA' | 'VERIFIED_INTERNAL_DATA' | 'USER_ENTERED' | 'ESTIMATED' | 'UNAVAILABLE';

export interface AnalyticsEvent {
  id: string;
  workspace_id: string;
  event_type: string;
  provenance: AnalyticsProvenance;
  metrics: Record<string, any>;
  created_at: Date;
}

export interface LearningSignal {
  id: string;
  workspace_id: string;
  signal_type: string;
  source: string;
  evidence: Record<string, any>;
  created_at: Date;
}

export interface AuditLogEntry {
  id: string;
  workspace_id: string | null;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, any> | null;
  created_at: Date;
}
