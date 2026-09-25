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

// Intelligence Engine Types
export type SourceType = 'web' | 'rss' | 'atom' | 'sitemap';
export type SourceStatus = 'DISCOVERED' | 'FETCHED' | 'PROCESSED' | 'FAILED';
export type ClaimStatus = 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'CONTRADICTED' | 'UNCERTAIN' | 'UNAVAILABLE';
export type TrendStatus = 'NEW' | 'RISING' | 'SUSTAINED' | 'STABLE' | 'DECLINING' | 'INSUFFICIENT_DATA';
export type OpportunityStatus = 'DISCOVERED' | 'REVIEWED' | 'SAVED' | 'DISMISSED' | 'CONVERTED';
export type GapType = 'unanswered_question' | 'missing_explanation' | 'contradictory_narrative' | 'overused_perspective' | 'underrepresented_perspective' | 'evidence_gap' | 'implementation_gap';

export interface IntelligenceSource {
  id: string;
  workspace_id: string;
  url: string;
  source_type: SourceType;
  title: string | null;
  publisher: string | null;
  domain: string | null;
  discovered_at: Date;
  fetched_at: Date | null;
  published_at: Date | null;
  content_hash: string | null;
  status: SourceStatus;
  reliability_score: number | null;
  error_message: string | null;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface SourceDocument {
  id: string;
  source_id: string;
  workspace_id: string;
  title: string | null;
  author: string | null;
  publisher: string | null;
  publication_date: Date | null;
  canonical_url: string | null;
  language: string | null;
  cleaned_body: string | null;
  headings: string[];
  paragraphs: string[];
  content_hash: string | null;
  extraction_confidence: number | null;
  provenance: string | null;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface SourceClaim {
  id: string;
  source_id: string;
  document_id: string | null;
  workspace_id: string;
  claim_text: string;
  evidence_location: string | null;
  claim_type: string | null;
  confidence: number | null;
  status: ClaimStatus;
  contradiction_group_id: string | null;
  extracted_by: string | null;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface Topic {
  id: string;
  workspace_id: string;
  canonical_name: string;
  aliases: string[];
  category: string | null;
  description: string | null;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface TopicMention {
  id: string;
  topic_id: string;
  source_id: string;
  workspace_id: string;
  relevance_score: number | null;
  context: string | null;
  mentioned_at: Date;
  metadata: Record<string, any>;
  created_at: Date;
}

export interface TrendSignal {
  id: string;
  topic_id: string;
  workspace_id: string;
  signal_type: string;
  observed_at: Date;
  time_window_hours: number | null;
  volume: number | null;
  velocity: number | null;
  source_diversity: number | null;
  confidence: number | null;
  status: TrendStatus;
  provenance: string | null;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface ContentOpportunity {
  id: string;
  workspace_id: string;
  topic_id: string | null;
  topic_name: string;
  thesis: string | null;
  why_now: string | null;
  audience_relevance: string | null;
  user_relevance: string | null;
  evidence_strength: string | null;
  novelty_score: number | null;
  conversation_potential: number | null;
  source_ids: string[];
  supporting_claim_ids: string[];
  contradiction_ids: string[];
  recommended_angle: string | null;
  recommended_objective: string | null;
  recommended_format: string | null;
  confidence: number | null;
  status: OpportunityStatus;
  overall_score: number | null;
  scoring_breakdown: Record<string, any>;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface ContentGap {
  id: string;
  workspace_id: string;
  topic_id: string | null;
  topic_name: string;
  gap_type: GapType | null;
  observed_narrative: string | null;
  unanswered_question: string | null;
  missing_perspective: string | null;
  evidence: Record<string, any>;
  opportunity_description: string | null;
  confidence: number | null;
  source_ids: string[];
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}
