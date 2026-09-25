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
