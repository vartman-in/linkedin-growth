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

// Mock Data
export const mockContentIdeas: ContentIdea[] = [
  {
    id: '1',
    title: 'AI tools aren\'t the problem. Poor workflows are.',
    source: 'idea',
    status: 'review',
    pillar: 'AI',
    createdAt: '2025-01-15T10:00:00Z',
    thesis: 'People don\'t need more AI tools. They need better workflows.',
    angles: ['Tool accumulation vs workflow design', 'How to audit an AI workflow', 'Why tool switching creates friction']
  },
  {
    id: '2',
    title: 'The hidden cost of context switching in engineering teams',
    source: 'experience',
    status: 'drafting',
    pillar: 'Software Development',
    createdAt: '2025-01-14T08:00:00Z',
    thesis: 'Context switching costs more than most teams realize',
    angles: ['Measuring context switching cost', 'System design to reduce switching', 'Team rituals that help']
  },
  {
    id: '3',
    title: 'Why most AI pilots fail after 90 days',
    source: 'trend',
    status: 'strategizing',
    pillar: 'AI',
    createdAt: '2025-01-13T14:00:00Z',
    thesis: 'AI pilots fail not because of technology but because of organizational readiness',
    angles: ['The 90-day cliff', 'What separates successful pilots', 'Organizational prerequisites']
  },
  {
    id: '4',
    title: 'Building in public: lessons from shipping 50 features in 6 months',
    source: 'experience',
    status: 'published',
    pillar: 'Startups',
    createdAt: '2025-01-10T09:00:00Z',
    thesis: 'Speed of iteration matters more than perfection',
    angles: ['Shipping cadence', 'Feedback loops', 'Technical debt management']
  },
  {
    id: '5',
    title: 'The workflow automation stack that actually works',
    source: 'sales',
    status: 'new',
    pillar: 'AI',
    createdAt: '2025-01-15T16:00:00Z',
    thesis: 'Most automation stacks are overengineered. Simple workflows win.',
    angles: ['Minimal viable automation', 'Integration patterns', 'When to automate vs when not to']
  }
];

export const mockDrafts: ContentDraft[] = [
  {
    id: 'd1',
    ideaId: '1',
    title: 'AI tools aren\'t the problem. Poor workflows are.',
    format: 'text',
    content: `Most AI workflows fail before the model is even involved.

I've watched teams spend weeks evaluating AI tools, only to abandon them a month later.

The problem isn't the tools. It's the workflow around them.

Here's what I've learned after helping 12 teams implement AI:

→ Tool accumulation ≠ capability
→ More tools = more context switching
→ The best AI workflow is the simplest one that works

Before adding another AI tool, audit these three things:

1. Where does your team actually lose time?
2. What's the handoff between human and AI?
3. What happens when the AI gets it wrong?

The teams that succeed with AI aren't using more tools. They're using fewer tools with better workflows.

What's the biggest workflow bottleneck in your AI adoption?`,
    hook: 'Most AI workflows fail before the model is even involved.',
    cta: 'What\'s the biggest workflow bottleneck in your AI adoption?',
    version: 2,
    status: 'review',
    quality: {
      overall: 'PASS',
      thesis: true,
      voice: true,
      evidence: true,
      originality: true,
      structure: true,
      platform: true
    },
    claims: [
      { id: 'c1', text: '12 teams implement AI', type: 'EXPERIENCE', provenance: 'VERIFIED_USER_RECEIPT', confidence: 1.0, publishable: true },
      { id: 'c2', text: 'Most AI workflows fail before the model is involved', type: 'OPINION', provenance: 'VERIFIED_USER_RECEIPT', confidence: 0.85, publishable: true }
    ],
    createdAt: '2025-01-15T12:00:00Z'
  },
  {
    id: 'd2',
    ideaId: '2',
    title: 'The hidden cost of context switching',
    format: 'carousel',
    content: '',
    hook: 'Your team isn\'t slow. They\'re switching contexts 47 times a day.',
    version: 1,
    status: 'draft',
    quality: {
      overall: 'REVIEW_REQUIRED',
      thesis: true,
      voice: true,
      evidence: false,
      originality: true,
      structure: true,
      platform: true
    },
    claims: [
      { id: 'c3', text: '47 context switches per day', type: 'STATISTIC', provenance: 'ESTIMATED', confidence: 0.6, publishable: false }
    ],
    createdAt: '2025-01-14T10:00:00Z'
  }
];

export const mockCarouselSlides: CarouselSlide[] = [
  { id: 's1', type: 'cover', headline: 'The Hidden Cost of Context Switching', body: 'Why your engineering team feels slow (and what to do about it)', visualDirection: 'Dark background, bold typography, clock icon' },
  { id: 's2', type: 'context', headline: 'The Problem', body: 'Engineers switch contexts an average of 11 times per hour. Each switch costs 23 minutes of recovery time.', visualDirection: 'Split screen: calendar chaos vs focused work' },
  { id: 's3', type: 'insight', headline: 'The Real Cost', body: 'A team of 8 engineers losing 2 hours each to context switching = 80 hours/week of lost productivity.', visualDirection: 'Calculator visualization, big numbers' },
  { id: 's4', type: 'insight', headline: 'What Causes It', body: '• Too many meetings\n• Slack interruptions\n• Unclear priorities\n• Tool sprawl\n• Lack of focus time', visualDirection: 'Icon grid, clean layout' },
  { id: 's5', type: 'example', headline: 'What Changed Everything', body: 'We implemented "Focus Blocks" — 3 hours of uninterrupted time, twice a day. No meetings, no Slack, no exceptions.', visualDirection: 'Before/after comparison' },
  { id: 's6', type: 'takeaway', headline: 'The Result', body: 'Sprint velocity increased 34%. Team satisfaction scores went up. Bug rate went down.', visualDirection: 'Upward trend graph, green accent' },
  { id: 's7', type: 'cta', headline: 'Try This Week', body: 'Block 2 hours of focus time tomorrow. Protect it like a client meeting. See what happens.', visualDirection: 'Calendar with blocked time, action-oriented' }
];

export const mockProspects: Prospect[] = [
  {
    id: 'p1',
    name: 'Sarah Chen',
    role: 'VP of Engineering',
    company: 'TechFlow AI',
    industry: 'AI / SaaS',
    size: '50-200',
    location: 'San Francisco, US',
    status: 'responded',
    qualification: { icpRole: true, industry: true, companySize: true, signal: true, activity: true, buyingIntent: 'inferred' },
    score: 92,
    signals: ['Hiring AI engineers', 'Posted about workflow challenges', 'Company raised Series B'],
    lastActivity: '2025-01-15T14:30:00Z',
    brief: {
      who: 'VP Engineering at a Series B AI startup',
      whyThem: 'Actively scaling engineering team, posted about workflow challenges',
      whyNow: 'Just raised Series B, expanding team rapidly',
      whatWeKnow: ['Hiring 5 AI engineers', 'Posted about context switching', 'Team grew from 20 to 50 in 6 months'],
      whatWeDontKnow: ['Current tooling stack', 'Budget for tooling', 'Decision-making process'],
      relevantSignal: 'Posted about engineering productivity challenges on Jan 12',
      possibleValue: 'Workflow automation could help their rapidly growing team maintain velocity',
      risks: ['May already have solutions', 'VP may not be direct buyer']
    }
  },
  {
    id: 'p2',
    name: 'Marcus Johnson',
    role: 'Head of Growth',
    company: 'ScaleUp Labs',
    industry: 'SaaS',
    size: '10-50',
    location: 'Austin, US',
    status: 'contacted',
    qualification: { icpRole: true, industry: true, companySize: true, signal: true, activity: false, buyingIntent: 'unknown' },
    score: 78,
    signals: ['Launched new product', 'Active on LinkedIn'],
    lastActivity: '2025-01-14T09:00:00Z'
  },
  {
    id: 'p3',
    name: 'Priya Patel',
    role: 'CTO',
    company: 'DataBridge',
    industry: 'Data / AI',
    size: '100-500',
    location: 'Bangalore, India',
    status: 'qualified',
    qualification: { icpRole: true, industry: true, companySize: true, signal: true, activity: true, buyingIntent: 'known' },
    score: 95,
    signals: ['Speaking at AI conference', 'Company expanding to US', 'Posted about automation needs'],
    lastActivity: '2025-01-15T11:00:00Z'
  },
  {
    id: 'p4',
    name: 'James Wilson',
    role: 'Founder & CEO',
    company: 'CloudNative.io',
    industry: 'DevOps',
    size: '10-50',
    location: 'London, UK',
    status: 'discovered',
    qualification: { icpRole: true, industry: true, companySize: true, signal: false, activity: true, buyingIntent: 'unknown' },
    score: 65,
    signals: ['Recently launched product', 'Active founder on LinkedIn'],
    lastActivity: '2025-01-13T16:00:00Z'
  }
];

export const mockConversations: Conversation[] = [
  {
    id: 'conv1',
    prospectId: 'p1',
    prospectName: 'Sarah Chen',
    messages: [
      { id: 'm1', from: 'user', content: 'Hi Sarah, I saw your post about workflow challenges at TechFlow. We\'ve been helping scaling engineering teams reduce context switching. Would love to share what we\'ve learned.', timestamp: '2025-01-13T10:00:00Z' },
      { id: 'm2', from: 'prospect', content: 'Thanks for reaching out! Yes, this is actually a huge challenge for us right now. We grew from 20 to 50 engineers in 6 months and things are getting chaotic. What specifically have you seen work?', timestamp: '2025-01-14T09:30:00Z' },
      { id: 'm3', from: 'user', content: 'Great question. The biggest lever we\'ve seen is implementing structured focus blocks. One team we worked with saw 34% velocity improvement. I wrote about it here: [link]. Happy to share more specifics if useful.', timestamp: '2025-01-14T14:00:00Z' },
      { id: 'm4', from: 'prospect', content: 'That\'s exactly the kind of thing we need. Would you be open to a 20-min call this week? I\'d love to understand more about how this works in practice.', timestamp: '2025-01-15T14:30:00Z' }
    ],
    classification: 'meeting',
    suggestedResponse: 'Absolutely, Sarah! I\'d love to walk you through how this works in practice. I have availability Thursday at 2pm PT or Friday at 10am PT. Which works better for you?',
    responseReasoning: 'Prospect explicitly requested a meeting. Respond with specific time options to reduce friction.',
    lastMessage: '2025-01-15T14:30:00Z',
    unread: true
  },
  {
    id: 'conv2',
    prospectId: 'p3',
    prospectName: 'Priya Patel',
    messages: [
      { id: 'm5', from: 'user', content: 'Hi Priya, enjoyed your talk at the AI Summit on automation. Your point about workflow-first resonated with our approach.', timestamp: '2025-01-12T11:00:00Z' },
      { id: 'm6', from: 'prospect', content: 'Thanks! Glad it resonated. We\'re actually looking at tools to help our team automate more of our data pipeline workflows. Any recommendations?', timestamp: '2025-01-13T08:00:00Z' }
    ],
    classification: 'question',
    suggestedResponse: 'Happy to help! Based on what you described, I\'d suggest starting with mapping your current manual steps before choosing tools. We\'ve seen teams waste months on tools that don\'t fit their actual workflow. Want me to share a framework we use for this?',
    responseReasoning: 'Prospect asking for recommendations. Provide value first before pitching.',
    lastMessage: '2025-01-13T08:00:00Z',
    unread: true
  }
];

export const mockTrends: TrendItem[] = [
  {
    id: 't1',
    topic: 'AI Agent Orchestration',
    whyItMatters: 'Companies are moving from single AI tools to multi-agent systems. This is the next evolution of AI adoption.',
    audienceFit: 'High — your audience is actively evaluating AI tools and workflows',
    angles: ['Why single AI tools fail at scale', 'How to orchestrate multiple AI agents', 'The infrastructure gap in AI adoption'],
    freshness: 'hot',
    evidence: ['Multiple LinkedIn posts from engineering leaders', 'New frameworks released this week', 'VC funding increasing in this space']
  },
  {
    id: 't2',
    topic: 'Developer Experience as Competitive Advantage',
    whyItMatters: 'Companies investing in DX are seeing 2-3x retention improvements. This connects to your workflow expertise.',
    audienceFit: 'Medium-High — resonates with your engineering audience',
    angles: ['DX investment ROI', 'How to measure developer experience', 'The connection between DX and velocity'],
    freshness: 'warm',
    evidence: ['Recent survey data', 'Company case studies', 'Industry reports']
  },
  {
    id: 't3',
    topic: 'The Death of the Standup Meeting',
    whyItMatters: 'Async-first teams are replacing standups with structured updates. Controversial but relevant.',
    audienceFit: 'Medium — sparks discussion in your audience',
    angles: ['Why standups fail at scale', 'Async alternatives that work', 'When standups still make sense'],
    freshness: 'emerging',
    evidence: ['Company announcements', 'Team retrospectives shared publicly', 'Product releases supporting async']
  }
];

export const mockAnalytics: AnalyticsData = {
  content: {
    postsPublished: 23,
    avgEngagement: 142,
    totalReach: 45200,
    topPerforming: [
      { title: 'Building in public: 50 features in 6 months', engagement: 312, reach: 8400 },
      { title: 'Why your AI pilot failed', engagement: 287, reach: 7200 },
      { title: 'The workflow audit framework', engagement: 198, reach: 5100 }
    ],
    weeklyPosts: [
      { week: 'Week 1', posts: 3, engagement: 95 },
      { week: 'Week 2', posts: 4, engagement: 128 },
      { week: 'Week 3', posts: 3, engagement: 156 },
      { week: 'Week 4', posts: 5, engagement: 189 },
      { week: 'Week 5', posts: 4, engagement: 142 },
      { week: 'Week 6', posts: 4, engagement: 167 }
    ]
  },
  sales: {
    prospectsDiscovered: 47,
    qualified: 23,
    contacted: 15,
    responded: 9,
    meetings: 4,
    pipeline: [
      { stage: 'Discovered', count: 12 },
      { stage: 'Researched', count: 8 },
      { stage: 'Qualified', count: 6 },
      { stage: 'Contacted', count: 5 },
      { stage: 'Responded', count: 4 },
      { stage: 'Meeting', count: 3 },
      { stage: 'Opportunity', count: 2 }
    ],
    weeklyActivity: [
      { week: 'Week 1', outreach: 3, responses: 1 },
      { week: 'Week 2', outreach: 5, responses: 2 },
      { week: 'Week 3', outreach: 4, responses: 3 },
      { week: 'Week 4', outreach: 3, responses: 2 },
      { week: 'Week 5', outreach: 6, responses: 4 },
      { week: 'Week 6', outreach: 4, responses: 3 }
    ]
  }
};

export const mockVoiceProfile: VoiceProfile = {
  tone: ['direct', 'conversational', 'analytical'],
  rhythm: 'mixed',
  vocabulary: ['workflow', 'leverage', 'systematic', 'evidence', 'framework'],
  banned: ['game-changer', 'revolutionary', 'disrupt', 'synergy', 'leverage (as verb)', 'unlock', 'supercharge'],
  formatting: ['short paragraphs', 'bullet points', 'whitespace', 'minimal emojis'],
  receipts: [
    'Helped 12 teams implement AI workflows',
    'Reduced context switching by 34% at previous company',
    'Shipped 50 features in 6 months at startup',
    'Built automation systems serving 10K+ users'
  ]
};

export const mockICP: ICPProfile = {
  roles: ['VP Engineering', 'CTO', 'Head of Engineering', 'Founder', 'CEO'],
  industries: ['SaaS', 'AI', 'Technology', 'DevOps', 'Data'],
  companySize: '10-500 employees',
  geography: ['US', 'India', 'UK', 'Canada'],
  painAreas: ['Scaling engineering teams', 'AI adoption', 'Workflow automation', 'Developer productivity'],
  buyingTriggers: ['Rapid team growth', 'New funding', 'Technology migration', 'Productivity plateau'],
  exclusions: ['Enterprise (>5000)', 'Government', 'Non-profit']
};

export const mockPillars: ContentPillar[] = [
  {
    id: 'pill1',
    name: 'AI',
    purpose: 'Establish authority in practical AI adoption',
    audience: 'Engineering leaders evaluating AI',
    subtopics: ['AI workflows', 'AI tooling', 'AI adoption', 'Prompt engineering', 'AI agents'],
    preferredFormats: ['text post', 'carousel', 'framework']
  },
  {
    id: 'pill2',
    name: 'Software Development',
    purpose: 'Share engineering leadership insights',
    audience: 'Engineering managers and senior devs',
    subtopics: ['Team scaling', 'Developer experience', 'Architecture', 'Engineering culture'],
    preferredFormats: ['text post', 'story', 'case study']
  },
  {
    id: 'pill3',
    name: 'Startups',
    purpose: 'Connect with founders and operators',
    audience: 'Startup founders and early employees',
    subtopics: ['Building in public', 'Shipping velocity', 'Fundraising', 'Product-market fit'],
    preferredFormats: ['story', 'text post', 'framework']
  },
  {
    id: 'pill4',
    name: 'Tech Careers',
    purpose: 'Attract early-career and mid-level engineers',
    audience: 'Engineers looking to grow',
    subtopics: ['Career growth', 'Technical skills', 'Leadership', 'Interviewing'],
    preferredFormats: ['text post', 'checklist', 'comparison']
  }
];

// ============================================
// CONTENT INTELLIGENCE OS - BRAIN SYSTEM
// ============================================

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

// Mock Brain Data
export const mockAudienceSegments: AudienceSegment[] = [
  {
    id: 'seg1',
    name: 'Beginner Developer',
    problems: ['Where do I start?', 'What should I learn?', 'Which programming language?', 'How do I build my first project?', 'How do I use GitHub?'],
    questions: ['What\'s the best way to learn coding?', 'How long does it take to learn?', 'Should I learn Python or JavaScript?'],
    goals: ['Build first project', 'Get first job', 'Understand fundamentals'],
    skillLevel: 'beginner',
    toolsUsed: ['VS Code', 'GitHub', 'ChatGPT', 'YouTube'],
    topicsInterested: ['Getting started', 'Tutorials', 'Project ideas', 'Career advice'],
    contentPreferences: ['Step-by-step tutorials', 'Visual guides', 'Simple explanations'],
    size: 45,
    engagement: 78
  },
  {
    id: 'seg2',
    name: 'AI Learner',
    problems: ['Which AI tools should I learn?', 'How do I use ChatGPT for coding?', 'What\'s new in AI?', 'Which AI tools are free?', 'How do I build with AI?'],
    questions: ['What\'s the best AI tool for beginners?', 'How do I prompt effectively?', 'Can AI replace developers?'],
    goals: ['Master AI tools', 'Build AI projects', 'Stay current'],
    skillLevel: 'intermediate',
    toolsUsed: ['ChatGPT', 'Claude', 'Cursor', 'GitHub Copilot'],
    topicsInterested: ['AI tools', 'Prompt engineering', 'AI projects', 'AI news'],
    contentPreferences: ['Tool comparisons', 'Practical tutorials', 'News breakdowns'],
    size: 32,
    engagement: 85
  },
  {
    id: 'seg3',
    name: 'Quick Builder',
    problems: ['Need ready-to-use code', 'Want fast results', 'Struggle to debug', 'Need shortcuts'],
    questions: ['Where can I copy code?', 'What\'s the fastest way to build?', 'How do I fix this error?'],
    goals: ['Build quickly', 'Ship projects', 'Use templates'],
    skillLevel: 'beginner',
    toolsUsed: ['AI code generators', 'Template sites', 'Stack Overflow'],
    topicsInterested: ['Code snippets', 'Templates', 'Quick wins', 'Copy-paste solutions'],
    contentPreferences: ['Code examples', 'Ready-to-use snippets', 'Fast tutorials'],
    size: 28,
    engagement: 65
  },
  {
    id: 'seg4',
    name: 'Startup Builder',
    problems: ['What should I build?', 'How do I validate an idea?', 'Which tools are cheap/free?', 'How do I launch?', 'How do I get users?'],
    questions: ['How do I find my first customers?', 'What\'s the best tech stack?', 'How do I price my product?'],
    goals: ['Launch product', 'Get users', 'Make revenue'],
    skillLevel: 'intermediate',
    toolsUsed: ['Next.js', 'Vercel', 'Stripe', 'Supabase'],
    topicsInterested: ['Indie hacking', 'Product launches', 'Growth tactics', 'Monetization'],
    contentPreferences: ['Case studies', 'Revenue reports', 'Launch stories'],
    size: 18,
    engagement: 92
  }
];

export const mockContentOpportunities: ContentOpportunity[] = [
  {
    id: 'opp1',
    topic: 'New Free AI Coding Tool: Cursor Pro',
    source: 'Product Hunt',
    discoveredAt: '2025-01-15T08:00:00Z',
    scores: {
      audienceRelevance: 9,
      freshness: 10,
      problemIntensity: 8,
      educationalValue: 9,
      novelty: 8,
      shareability: 9,
      productRelevance: 7,
      competition: 6
    },
    overallScore: 8.3,
    angles: [
      { id: 'a1', audience: 'Beginner Developer', title: 'Build your first project with this free AI coding tool', hook: 'You can now build a full web app without writing a single line of code.', format: 'carousel', estimatedPerformance: 85 },
      { id: 'a2', audience: 'AI Learner', title: 'I tested Cursor Pro for a week. Here\'s what happened.', hook: 'I replaced my entire workflow with AI for 7 days.', format: 'text', estimatedPerformance: 78 },
      { id: 'a3', audience: 'Startup Builder', title: 'How to build an MVP in 24 hours with AI tools', hook: 'I built a SaaS product in one day. Here\'s the exact stack.', format: 'tutorial', estimatedPerformance: 92 }
    ],
    status: 'selected',
    classifiedFor: ['AI Learner', 'Beginner Developer', 'Startup Builder']
  },
  {
    id: 'opp2',
    topic: 'GitHub Copilot Workspace Launch',
    source: 'GitHub Blog',
    discoveredAt: '2025-01-14T14:00:00Z',
    scores: {
      audienceRelevance: 8,
      freshness: 9,
      problemIntensity: 7,
      educationalValue: 8,
      novelty: 7,
      shareability: 8,
      productRelevance: 6,
      competition: 7
    },
    overallScore: 7.5,
    angles: [
      { id: 'a4', audience: 'AI Learner', title: 'GitHub just changed how we code forever', hook: 'GitHub Copilot Workspace is here. This changes everything.', format: 'news', estimatedPerformance: 75 },
      { id: 'a5', audience: 'Quick Builder', title: 'How to use GitHub Copilot Workspace (step-by-step)', hook: 'GitHub just made coding 10x easier. Here\'s how to use it.', format: 'tutorial', estimatedPerformance: 82 }
    ],
    status: 'scored',
    classifiedFor: ['AI Learner', 'Quick Builder']
  },
  {
    id: 'opp3',
    topic: 'Why Junior Developers Struggle with Debugging',
    source: 'Reddit /r/learnprogramming',
    discoveredAt: '2025-01-13T10:00:00Z',
    scores: {
      audienceRelevance: 9,
      freshness: 5,
      problemIntensity: 9,
      educationalValue: 10,
      novelty: 6,
      shareability: 7,
      productRelevance: 8,
      competition: 5
    },
    overallScore: 7.4,
    angles: [
      { id: 'a6', audience: 'Beginner Developer', title: 'The debugging mindset every junior developer needs', hook: 'Stop Googling errors. Do this instead.', format: 'carousel', estimatedPerformance: 88 },
      { id: 'a7', audience: 'Quick Builder', title: '5 debugging tools that will save you hours', hook: 'I wasted 100+ hours debugging the wrong way.', format: 'text', estimatedPerformance: 76 }
    ],
    status: 'in-progress',
    classifiedFor: ['Beginner Developer', 'Quick Builder']
  }
];

export const mockPostDNA: PostDNA[] = [
  {
    id: 'dna1',
    postNumber: 17,
    topic: 'AI Coding',
    subtopic: 'Free AI Tools',
    audience: 'Beginner Developer',
    skillLevel: 'beginner',
    format: 'carousel',
    hookType: 'contrarian',
    hookText: 'You can now build your first project with this free AI coding tool.',
    hookLength: 11,
    visualType: 'Screenshot + diagram',
    contentStructure: 'Problem → Solution → Steps → Example → CTA',
    cta: 'Save this for later',
    publishTime: '2025-01-10T19:30:00Z',
    source: 'Product launch',
    freshness: 2,
    postLength: 780,
    metrics: {
      reach: 8400,
      impressions: 12500,
      reactions: 342,
      comments: 74,
      reposts: 31,
      saves: 118,
      sends: 45,
      linkClicks: 23,
      followersGained: 24,
      profileVisits: 86
    },
    performanceScore: 92,
    businessRelevance: 78,
    lessons: ['Beginner-focused tutorials perform well', 'Contrarian hooks increase engagement', 'Carousels get more saves', 'Fresh tools generate urgency']
  },
  {
    id: 'dna2',
    postNumber: 16,
    topic: 'Developer Tips',
    subtopic: 'Productivity',
    audience: 'AI Learner',
    skillLevel: 'intermediate',
    format: 'text',
    hookType: 'practical',
    hookText: '5 AI tools that will 10x your coding speed.',
    hookLength: 9,
    visualType: 'Single graphic',
    contentStructure: 'Hook → List → Explanation → CTA',
    cta: 'Which one is your favorite?',
    publishTime: '2025-01-08T18:00:00Z',
    source: 'Curated list',
    freshness: 5,
    postLength: 650,
    metrics: {
      reach: 5200,
      impressions: 8900,
      reactions: 198,
      comments: 42,
      reposts: 18,
      saves: 67,
      sends: 23,
      linkClicks: 12,
      followersGained: 12,
      profileVisits: 45
    },
    performanceScore: 68,
    businessRelevance: 65,
    lessons: ['List posts get moderate engagement', 'Practical hooks work for intermediate audience', 'Text posts get fewer saves than carousels']
  },
  {
    id: 'dna3',
    postNumber: 15,
    topic: 'AI News',
    subtopic: 'Claude 3.5 Launch',
    audience: 'AI Learner',
    skillLevel: 'intermediate',
    format: 'text',
    hookType: 'educational',
    hookText: 'Claude 3.5 just launched. Here\'s what you need to know.',
    hookLength: 10,
    visualType: 'Screenshot',
    contentStructure: 'News → Features → Comparison → Implications',
    cta: null,
    publishTime: '2025-01-05T20:00:00Z',
    source: 'News',
    freshness: 1,
    postLength: 890,
    metrics: {
      reach: 11200,
      impressions: 18500,
      reactions: 456,
      comments: 89,
      reposts: 67,
      saves: 134,
      sends: 78,
      linkClicks: 45,
      followersGained: 38,
      profileVisits: 124
    },
    performanceScore: 95,
    businessRelevance: 72,
    lessons: ['Fresh news gets high reach', 'Educational hooks work for news', 'Very fresh content (<2 days) performs best', 'AI news has high shareability']
  }
];

export const mockLearnedPatterns: LearnedPattern[] = [
  {
    id: 'pat1',
    observation: 'Beginner-focused practical tutorials consistently outperform other formats',
    evidence: ['Post #17: 8,400 reach', 'Post #12: 7,200 reach', 'Post #9: 6,800 reach', 'Post #6: 5,900 reach'],
    confidence: 'high',
    sampleSize: 11,
    supportingPosts: [17, 12, 9, 6, 4, 2],
    conflictingPosts: [16],
    lastUpdated: '2025-01-15T12:00:00Z',
    category: 'audience'
  },
  {
    id: 'pat2',
    observation: 'Contrarian hooks increase comments but may reduce saves',
    evidence: ['Post #17: 74 comments, 118 saves', 'Post #14: 62 comments, 45 saves', 'Post #11: 58 comments, 52 saves'],
    confidence: 'medium',
    sampleSize: 7,
    supportingPosts: [17, 14, 11],
    conflictingPosts: [15, 13],
    lastUpdated: '2025-01-14T10:00:00Z',
    category: 'hook'
  },
  {
    id: 'pat3',
    observation: 'Carousels get 2.3x more saves than text posts',
    evidence: ['Post #17 carousel: 118 saves', 'Post #13 carousel: 95 saves', 'Post #16 text: 67 saves', 'Post #10 text: 34 saves'],
    confidence: 'high',
    sampleSize: 9,
    supportingPosts: [17, 13, 8, 5],
    conflictingPosts: [],
    lastUpdated: '2025-01-13T15:00:00Z',
    category: 'format'
  },
  {
    id: 'pat4',
    observation: 'Posts published between 7-8 PM get 40% more engagement',
    evidence: ['Post #17 at 7:30 PM: 92 score', 'Post #15 at 8:00 PM: 95 score', 'Post #12 at 7:45 PM: 78 score', 'Post #16 at 6:00 PM: 68 score'],
    confidence: 'medium',
    sampleSize: 12,
    supportingPosts: [17, 15, 12, 9],
    conflictingPosts: [16, 14],
    lastUpdated: '2025-01-12T18:00:00Z',
    category: 'timing'
  },
  {
    id: 'pat5',
    observation: 'AI tool tutorials have higher business relevance than general AI news',
    evidence: ['Post #17 tool tutorial: 78 business score', 'Post #15 AI news: 72 business score', 'Post #13 tool guide: 85 business score'],
    confidence: 'medium',
    sampleSize: 6,
    supportingPosts: [17, 13, 10],
    conflictingPosts: [15],
    lastUpdated: '2025-01-11T14:00:00Z',
    category: 'topic'
  }
];

export const mockExperiments: Experiment[] = [
  {
    id: 'exp1',
    name: 'Hook Type A/B Test',
    hypothesis: 'Contrarian hooks generate more comments than practical hooks',
    variable: 'Hook type',
    status: 'completed',
    startDate: '2025-01-01',
    endDate: '2025-01-07',
    variations: [
      { id: 'v1', name: 'Contrarian: "Stop learning to code this way"', postId: 14, metric: 62 },
      { id: 'v2', name: 'Practical: "5 steps to learn coding faster"', postId: 16, metric: 42 }
    ],
    result: 'Contrarian hooks generated 48% more comments',
    confidence: 72
  },
  {
    id: 'exp2',
    name: 'Format Test: Carousel vs Text',
    hypothesis: 'Carousels generate more saves than text posts',
    variable: 'Content format',
    status: 'completed',
    startDate: '2025-01-08',
    endDate: '2025-01-14',
    variations: [
      { id: 'v3', name: 'Carousel: AI tool tutorial', postId: 17, metric: 118 },
      { id: 'v4', name: 'Text: AI tool list', postId: 16, metric: 67 }
    ],
    result: 'Carousels generated 76% more saves',
    confidence: 85
  },
  {
    id: 'exp3',
    name: 'CTA Test: Question vs Save',
    hypothesis: 'Question CTAs generate more comments than save CTAs',
    variable: 'Call-to-action',
    status: 'running',
    startDate: '2025-01-15',
    variations: [
      { id: 'v5', name: 'Question: "Which tool is your favorite?"', postId: 18, metric: 0 },
      { id: 'v6', name: 'Save: "Save this for later"', postId: 19, metric: 0 }
    ]
  },
  {
    id: 'exp4',
    name: 'Topic Test: Tutorial vs News',
    hypothesis: 'Tutorials generate more business relevance than news',
    variable: 'Content topic',
    status: 'planned',
    startDate: '2025-01-22',
    variations: [
      { id: 'v7', name: 'Tutorial: How to build with AI', postId: 0, metric: 0 },
      { id: 'v8', name: 'News: Latest AI updates', postId: 0, metric: 0 }
    ]
  }
];

export const mockWeeklyReport: WeeklyLearningReport = {
  id: 'report1',
  week: 'Week 3, January 2025',
  startDate: '2025-01-13',
  endDate: '2025-01-19',
  postsPublished: 5,
  totalReach: 32400,
  totalEngagement: 1245,
  topicBreakdown: [
    { topic: 'AI Tool Tutorials', posts: 2, avgReach: 7800, avgEngagement: 420 },
    { topic: 'AI News', posts: 1, avgReach: 11200, avgEngagement: 580 },
    { topic: 'Developer Tips', posts: 1, avgReach: 5200, avgEngagement: 240 },
    { topic: 'Career Advice', posts: 1, avgReach: 4800, avgEngagement: 195 }
  ],
  strongSignals: [
    { observation: 'Beginner-focused practical tutorials have performed consistently well relative to other formats over the last 4 weeks.', confidence: 'high', evidence: 11 },
    { observation: 'Carousels generate 2.3x more saves than text posts.', confidence: 'high', evidence: 9 },
    { observation: 'Posts published between 7-8 PM get 40% more engagement.', confidence: 'medium', evidence: 12 }
  ],
  weakSignals: [
    { observation: 'Contrarian hooks may increase comments but reduce saves.', confidence: 'low', evidence: 3 },
    { observation: 'AI tool tutorials may have higher business relevance than general AI news.', confidence: 'low', evidence: 6 }
  ],
  nextExperiments: [
    'Test AI tutorial + carousel format',
    'Test developer problem + short text post',
    'Test AI news + practical implementation angle',
    'Test beginner tutorial + downloadable resource'
  ],
  exploreExploitRatio: {
    exploit: 70,
    explore: 20,
    experiment: 10
  }
};

export const mockBrainMetrics: BrainMetrics = {
  audienceBrain: {
    segments: 4,
    problemsTracked: 23,
    questionsTracked: 18
  },
  researchBrain: {
    signalsCollected: 847,
    opportunitiesFound: 156,
    opportunitiesScored: 89
  },
  ideaBrain: {
    ideasGenerated: 234,
    ideasSelected: 67,
    selectionRate: 28.6
  },
  creativeBrain: {
    scriptsGenerated: 67,
    visualsGenerated: 67,
    captionsGenerated: 67
  },
  analyticsBrain: {
    postsTracked: 17,
    dataPointsCollected: 187,
    avgPerformanceScore: 78.4
  },
  learningBrain: {
    patternsLearned: 5,
    experimentsRun: 4,
    confidenceLevel: 'Medium-High'
  },
  businessBrain: {
    contentToBusiness: 72,
    resourceDownloads: 234,
    leadsGenerated: 18
  }
};
