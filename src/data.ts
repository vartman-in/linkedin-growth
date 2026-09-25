// ============================================
// TYPE DEFINITIONS
// ============================================
// These interfaces define the shape of data in the system.
// Actual data comes from user actions and future backend integrations.

export interface ContentIdea {
  id: string;
  title: string;
  source: 'idea' | 'url' | 'notes' | 'experience' | 'trend' | 'sales';
  status: 'new' | 'researching' | 'understood' | 'strategizing' | 'drafting' | 'review' | 'approved' | 'scheduled' | 'published';
  pillar: string;
  createdAt: string;
  thesis?: string;
  angles?: string[];
}

export interface ContentDraft {
  id: string;
  ideaId: string;
  title: string;
  format: 'text' | 'carousel' | 'document';
  content: string;
  hook: string;
  cta?: string;
  version: number;
  status: 'draft' | 'validating' | 'review' | 'approved' | 'rejected';
  quality: {
    overall: 'PASS' | 'REVIEW_REQUIRED' | 'BLOCKED';
    thesis: boolean;
    voice: boolean;
    evidence: boolean;
    originality: boolean;
    structure: boolean;
    platform: boolean;
  };
  claims: Claim[];
  createdAt: string;
}

export interface Claim {
  id: string;
  text: string;
  type: 'STATISTIC' | 'FACT' | 'OPINION' | 'EXPERIENCE';
  provenance: 'VERIFIED_USER_RECEIPT' | 'VERIFIED_SOURCE' | 'VERIFIED_PLATFORM_DATA' | 'ESTIMATED' | 'UNAVAILABLE';
  confidence: number;
  publishable: boolean;
}

export interface CarouselSlide {
  id: string;
  type: 'cover' | 'context' | 'insight' | 'example' | 'takeaway' | 'cta';
  headline: string;
  body: string;
  visualDirection?: string;
}

export interface Prospect {
  id: string;
  name: string;
  role: string;
  company: string;
  industry: string;
  size: string;
  location: string;
  status: 'discovered' | 'researched' | 'qualified' | 'contacted' | 'responded' | 'conversation' | 'meeting' | 'opportunity' | 'won' | 'lost';
  qualification: {
    icpRole: boolean;
    industry: boolean;
    companySize: boolean;
    signal: boolean;
    activity: boolean;
    buyingIntent: 'known' | 'inferred' | 'unknown';
  };
  score: number;
  signals: string[];
  lastActivity: string;
  brief?: ProspectBrief;
}

export interface ProspectBrief {
  who: string;
  whyThem: string;
  whyNow: string;
  whatWeKnow: string[];
  whatWeDontKnow: string[];
  relevantSignal: string;
  possibleValue: string;
  risks: string[];
}

export interface OutreachDraft {
  id: string;
  prospectId: string;
  message: string;
  strategy: 'value-first' | 'conversation' | 'problem-relevant' | 'content-reference';
  evidence: string[];
  riskFlags: string[];
  charCount: number;
  status: 'draft' | 'approved' | 'sent' | 'failed';
  createdAt: string;
}

export interface Conversation {
  id: string;
  prospectId: string;
  prospectName: string;
  messages: Message[];
  classification: 'interested' | 'question' | 'objection' | 'not-now' | 'no' | 'meeting' | 'pricing' | 'unknown';
  suggestedResponse?: string;
  responseReasoning?: string;
  lastMessage: string;
  unread: boolean;
}

export interface Message {
  id: string;
  from: 'prospect' | 'user';
  content: string;
  timestamp: string;
}

export interface TrendItem {
  id: string;
  topic: string;
  whyItMatters: string;
  audienceFit: string;
  angles: string[];
  freshness: 'hot' | 'warm' | 'emerging';
  evidence: string[];
}

export interface AnalyticsData {
  content: {
    postsPublished: number;
    avgEngagement: number;
    totalReach: number;
    topPerforming: { title: string; engagement: number; reach: number }[];
    weeklyPosts: { week: string; posts: number; engagement: number }[];
  };
  sales: {
    prospectsDiscovered: number;
    qualified: number;
    contacted: number;
    responded: number;
    meetings: number;
    pipeline: { stage: string; count: number }[];
    weeklyActivity: { week: string; outreach: number; responses: number }[];
  };
}

export interface VoiceProfile {
  tone: string[];
  rhythm: string;
  vocabulary: string[];
  banned: string[];
  formatting: string[];
  receipts: string[];
}

export interface ICPProfile {
  roles: string[];
  industries: string[];
  companySize: string;
  geography: string[];
  painAreas: string[];
  buyingTriggers: string[];
  exclusions: string[];
}

export interface ContentPillar {
  id: string;
  name: string;
  purpose: string;
  audience: string;
  subtopics: string[];
  preferredFormats: string[];
}

export interface AudienceSegment {
  id: string;
  name: string;
  problems: string[];
  questions: string[];
  goals: string[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  toolsUsed: string[];
  topicsInterested: string[];
  contentPreferences: string[];
  size: number;
  engagement: number;
}

export interface ContentOpportunity {
  id: string;
  topic: string;
  source: string;
  discoveredAt: string;
  scores: {
    audienceRelevance: number;
    freshness: number;
    problemIntensity: number;
    educationalValue: number;
    novelty: number;
    shareability: number;
    productRelevance: number;
    competition: number;
  };
  overallScore: number;
  angles: ContentAngle[];
  status: 'discovered' | 'scored' | 'selected' | 'in-progress' | 'published';
  classifiedFor: string[];
}

export interface ContentAngle {
  id: string;
  audience: string;
  title: string;
  hook: string;
  format: string;
  estimatedPerformance: number;
}

export interface PostDNA {
  id: string;
  postNumber: number;
  topic: string;
  subtopic: string;
  audience: string;
  skillLevel: string;
  format: 'carousel' | 'text' | 'video' | 'document';
  hookType: 'contrarian' | 'practical' | 'question' | 'story' | 'educational';
  hookText: string;
  hookLength: number;
  visualType: string;
  contentStructure: string;
  cta: string | null;
  publishTime: string;
  source: string;
  freshness: number;
  postLength: number;
  metrics: {
    reach: number;
    impressions: number;
    reactions: number;
    comments: number;
    reposts: number;
    saves: number;
    sends: number;
    linkClicks: number;
    followersGained: number;
    profileVisits: number;
  };
  performanceScore: number;
  businessRelevance: number;
  lessons: string[];
}

export interface LearnedPattern {
  id: string;
  observation: string;
  evidence: string[];
  confidence: 'high' | 'medium' | 'low';
  sampleSize: number;
  supportingPosts: number[];
  conflictingPosts: number[];
  lastUpdated: string;
  category: 'hook' | 'format' | 'timing' | 'topic' | 'audience' | 'cta';
}

export interface Experiment {
  id: string;
  name: string;
  hypothesis: string;
  variable: string;
  status: 'planned' | 'running' | 'completed' | 'inconclusive';
  startDate: string;
  endDate?: string;
  variations: ExperimentVariation[];
  result?: string;
  confidence?: number;
}

export interface ExperimentVariation {
  id: string;
  name: string;
  postId: number;
  metric: number;
}

export interface WeeklyLearningReport {
  id: string;
  week: string;
  startDate: string;
  endDate: string;
  postsPublished: number;
  totalReach: number;
  totalEngagement: number;
  topicBreakdown: {
    topic: string;
    posts: number;
    avgReach: number;
    avgEngagement: number;
  }[];
  strongSignals: {
    observation: string;
    confidence: 'high' | 'medium' | 'low';
    evidence: number;
  }[];
  weakSignals: {
    observation: string;
    confidence: 'high' | 'medium' | 'low';
    evidence: number;
  }[];
  nextExperiments: string[];
  exploreExploitRatio: {
    exploit: number;
    explore: number;
    experiment: number;
  };
}

export interface BrainMetrics {
  audienceBrain: {
    segments: number;
    problemsTracked: number;
    questionsTracked: number;
  };
  researchBrain: {
    signalsCollected: number;
    opportunitiesFound: number;
    opportunitiesScored: number;
  };
  ideaBrain: {
    ideasGenerated: number;
    ideasSelected: number;
    selectionRate: number;
  };
  creativeBrain: {
    scriptsGenerated: number;
    visualsGenerated: number;
    captionsGenerated: number;
  };
  analyticsBrain: {
    postsTracked: number;
    dataPointsCollected: number;
    avgPerformanceScore: number;
  };
  learningBrain: {
    patternsLearned: number;
    experimentsRun: number;
    confidenceLevel: string;
  };
  businessBrain: {
    contentToBusiness: number;
    resourceDownloads: number;
    leadsGenerated: number;
  };
}

// ============================================
// EMPTY STATE DEFAULTS
// ============================================
// These represent a clean, unconfigured workspace.
// No demo data. No fake metrics. No fabricated insights.

export const emptyContentIdeas: ContentIdea[] = [];
export const emptyDrafts: ContentDraft[] = [];
export const emptyCarouselSlides: CarouselSlide[] = [];
export const emptyProspects: Prospect[] = [];
export const emptyConversations: Conversation[] = [];
export const emptyTrends: TrendItem[] = [];
export const emptyPillars: ContentPillar[] = [];
export const emptyAudienceSegments: AudienceSegment[] = [];
export const emptyContentOpportunities: ContentOpportunity[] = [];
export const emptyPostDNA: PostDNA[] = [];
export const emptyLearnedPatterns: LearnedPattern[] = [];
export const emptyExperiments: Experiment[] = [];

// Analytics: explicitly marked as unavailable, not zeroed-out fake data
export const unavailableAnalytics: AnalyticsData = {
  content: {
    postsPublished: 0,
    avgEngagement: 0,
    totalReach: 0,
    topPerforming: [],
    weeklyPosts: []
  },
  sales: {
    prospectsDiscovered: 0,
    qualified: 0,
    contacted: 0,
    responded: 0,
    meetings: 0,
    pipeline: [],
    weeklyActivity: []
  }
};

// Voice profile: unconfigured
export const defaultVoiceProfile: VoiceProfile = {
  tone: [],
  rhythm: '',
  vocabulary: [],
  banned: [],
  formatting: [],
  receipts: []
};

// ICP: unconfigured
export const defaultICP: ICPProfile = {
  roles: [],
  industries: [],
  companySize: '',
  geography: [],
  painAreas: [],
  buyingTriggers: [],
  exclusions: []
};

// Brain metrics: zero state (no data collected yet)
export const defaultBrainMetrics: BrainMetrics = {
  audienceBrain: { segments: 0, problemsTracked: 0, questionsTracked: 0 },
  researchBrain: { signalsCollected: 0, opportunitiesFound: 0, opportunitiesScored: 0 },
  ideaBrain: { ideasGenerated: 0, ideasSelected: 0, selectionRate: 0 },
  creativeBrain: { scriptsGenerated: 0, visualsGenerated: 0, captionsGenerated: 0 },
  analyticsBrain: { postsTracked: 0, dataPointsCollected: 0, avgPerformanceScore: 0 },
  learningBrain: { patternsLearned: 0, experimentsRun: 0, confidenceLevel: 'No data yet' },
  businessBrain: { contentToBusiness: 0, resourceDownloads: 0, leadsGenerated: 0 }
};

// Weekly report: unavailable
export const defaultWeeklyReport: WeeklyLearningReport = {
  id: '',
  week: '',
  startDate: '',
  endDate: '',
  postsPublished: 0,
  totalReach: 0,
  totalEngagement: 0,
  topicBreakdown: [],
  strongSignals: [],
  weakSignals: [],
  nextExperiments: [],
  exploreExploitRatio: { exploit: 0, explore: 0, experiment: 0 }
};
