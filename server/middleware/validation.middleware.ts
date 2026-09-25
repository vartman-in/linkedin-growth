import { z } from 'zod';

// Workspace schemas
export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(255),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(255),
});

// User schemas
export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
});

// Workspace member schemas
export const addWorkspaceMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['OWNER', 'MEMBER']).optional().default('MEMBER'),
});

export const updateWorkspaceMemberSchema = z.object({
  role: z.enum(['OWNER', 'MEMBER']),
});

// Profile schemas
export const createProfileSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string().max(255).optional(),
  headline: z.string().optional(),
  role: z.string().max(255).optional(),
  company: z.string().max(255).optional(),
  bio: z.string().optional(),
  voiceTone: z.string().optional(),
  bannedWords: z.array(z.string()).optional(),
  proofPoints: z.array(z.string()).optional(),
});

export const updateProfileSchema = z.object({
  displayName: z.string().max(255).optional(),
  headline: z.string().optional(),
  role: z.string().max(255).optional(),
  company: z.string().max(255).optional(),
  bio: z.string().optional(),
  voiceTone: z.string().optional(),
  bannedWords: z.array(z.string()).optional(),
  proofPoints: z.array(z.string()).optional(),
});

// ICP schemas
export const createICPSchema = z.object({
  name: z.string().min(1).max(255),
  targetRoles: z.array(z.string()).optional(),
  industries: z.array(z.string()).optional(),
  companySizes: z.array(z.string()).optional(),
  geography: z.array(z.string()).optional(),
  seniority: z.array(z.string()).optional(),
  problems: z.array(z.string()).optional(),
  buyingSignals: z.array(z.string()).optional(),
  exclusions: z.array(z.string()).optional(),
});

export const updateICPSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  targetRoles: z.array(z.string()).optional(),
  industries: z.array(z.string()).optional(),
  companySizes: z.array(z.string()).optional(),
  geography: z.array(z.string()).optional(),
  seniority: z.array(z.string()).optional(),
  problems: z.array(z.string()).optional(),
  buyingSignals: z.array(z.string()).optional(),
  exclusions: z.array(z.string()).optional(),
});

// Content Idea schemas
export const createContentIdeaSchema = z.object({
  title: z.string().min(1),
  sourceReference: z.string().optional(),
  pillar: z.string().optional(),
  audience: z.string().optional(),
  angle: z.string().optional(),
  status: z.enum(['NEW', 'RESEARCHING', 'VALIDATED', 'ARCHIVED']).optional(),
});

export const updateContentIdeaSchema = z.object({
  title: z.string().min(1).optional(),
  sourceReference: z.string().optional(),
  pillar: z.string().optional(),
  audience: z.string().optional(),
  angle: z.string().optional(),
  status: z.enum(['NEW', 'RESEARCHING', 'VALIDATED', 'ARCHIVED']).optional(),
});

// Content Draft schemas
export const createContentDraftSchema = z.object({
  ideaId: z.string().uuid().optional(),
  title: z.string().min(1),
  body: z.string().min(1),
  contentType: z.string().min(1),
  status: z.enum(['DRAFT', 'IN_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']).optional(),
  version: z.number().int().positive().optional(),
});

export const updateContentDraftSchema = z.object({
  ideaId: z.string().uuid().optional(),
  title: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  contentType: z.string().min(1).optional(),
  status: z.enum(['DRAFT', 'IN_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']).optional(),
  version: z.number().int().positive().optional(),
});

// Lead schemas
export const createLeadSchema = z.object({
  name: z.string().min(1).max(255),
  profileUrl: z.string().url().optional(),
  company: z.string().max(255).optional(),
  title: z.string().max(255).optional(),
  status: z.enum(['NEW', 'RESEARCHED', 'QUALIFIED', 'CONTACTED', 'RESPONDED', 'CONVERTED', 'LOST']).optional(),
  source: z.string().max(255).optional(),
});

export const updateLeadSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  profileUrl: z.string().url().optional(),
  company: z.string().max(255).optional(),
  title: z.string().max(255).optional(),
  status: z.enum(['NEW', 'RESEARCHED', 'QUALIFIED', 'CONTACTED', 'RESPONDED', 'CONVERTED', 'LOST']).optional(),
  source: z.string().max(255).optional(),
});

// Conversation schemas
export const createConversationSchema = z.object({
  leadId: z.string().uuid().optional(),
  channel: z.string().min(1),
  status: z.enum(['ACTIVE', 'CLOSED', 'ARCHIVED']).optional(),
});

export const updateConversationSchema = z.object({
  leadId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'CLOSED', 'ARCHIVED']).optional(),
});

// Message schemas
export const createMessageSchema = z.object({
  conversationId: z.string().uuid(),
  direction: z.enum(['INBOUND', 'OUTBOUND']),
  body: z.string().min(1),
});

// Pipeline Opportunity schemas
export const createPipelineOpportunitySchema = z.object({
  leadId: z.string().uuid().optional(),
  stage: z.enum(['DISCOVERED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']).optional(),
  value: z.number().positive().optional(),
  source: z.string().max(255).optional(),
});

export const updatePipelineOpportunitySchema = z.object({
  leadId: z.string().uuid().optional(),
  stage: z.enum(['DISCOVERED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']).optional(),
  value: z.number().positive().optional(),
  source: z.string().max(255).optional(),
});

// UUID parameter schema
export const uuidParamSchema = z.object({
  id: z.string().uuid(),
});

export const workspaceIdParamSchema = z.object({
  workspaceId: z.string().uuid(),
});
