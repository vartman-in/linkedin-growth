import { useState } from 'react';
import { useApp } from '../store';
import {
  Brain, Users, Search, Lightbulb, Palette, BarChart3,
  GraduationCap, Briefcase, TrendingUp, Target, Zap,
  CheckCircle2, AlertCircle, Clock, ArrowRight, Sparkles,
  Eye, MessageSquare, Save, Share2, UserPlus, Activity
} from 'lucide-react';

type BrainTab = 'overview' | 'audience' | 'research' | 'learning' | 'experiments' | 'report';

export default function BrainPage() {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState<BrainTab>('overview');

  const tabs = [
    { id: 'overview' as const, label: '8 Brains', icon: Brain },
    { id: 'audience' as const, label: 'Audience Brain', icon: Users },
    { id: 'research' as const, label: 'Research & Ideas', icon: Search },
    { id: 'learning' as const, label: 'Learning Patterns', icon: GraduationCap },
    { id: 'experiments' as const, label: 'Experiments', icon: Activity },
    { id: 'report' as const, label: 'Weekly Report', icon: BarChart3 },
  ];

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Content Intelligence OS</h1>
            <p className="text-gray-500 text-sm mt-0.5">Self-improving content brain that learns what works</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'overview' && <OverviewPanel />}
      {activeTab === 'audience' && <AudiencePanel />}
      {activeTab === 'research' && <ResearchPanel />}
      {activeTab === 'learning' && <LearningPanel />}
      {activeTab === 'experiments' && <ExperimentsPanel />}
      {activeTab === 'report' && <ReportPanel />}
    </div>
  );
}

function OverviewPanel() {
  const { state } = useApp();
  const metrics = state.brainMetrics;

  const brains = [
    {
      name: 'Business Brain',
      icon: Briefcase,
      color: 'from-amber-500 to-orange-600',
      question: 'What are we trying to sell/build?',
      metrics: [
        { label: 'Content-to-Business Score', value: metrics.businessBrain.contentToBusiness, suffix: '%' },
        { label: 'Resource Downloads', value: metrics.businessBrain.resourceDownloads },
        { label: 'Leads Generated', value: metrics.businessBrain.leadsGenerated }
      ]
    },
    {
      name: 'Audience Brain',
      icon: Users,
      color: 'from-blue-500 to-cyan-600',
      question: 'Who are we helping? What problems do they have?',
      metrics: [
        { label: 'Segments Tracked', value: metrics.audienceBrain.segments },
        { label: 'Problems Tracked', value: metrics.audienceBrain.problemsTracked },
        { label: 'Questions Tracked', value: metrics.audienceBrain.questionsTracked }
      ]
    },
    {
      name: 'Research Brain',
      icon: Search,
      color: 'from-purple-500 to-indigo-600',
      question: 'What is happening right now?',
      metrics: [
        { label: 'Signals Collected', value: metrics.researchBrain.signalsCollected },
        { label: 'Opportunities Found', value: metrics.researchBrain.opportunitiesFound },
        { label: 'Opportunities Scored', value: metrics.researchBrain.opportunitiesScored }
      ]
    },
    {
      name: 'Idea Brain',
      icon: Lightbulb,
      color: 'from-yellow-500 to-amber-600',
      question: 'What should we talk about?',
      metrics: [
        { label: 'Ideas Generated', value: metrics.ideaBrain.ideasGenerated },
        { label: 'Ideas Selected', value: metrics.ideaBrain.ideasSelected },
        { label: 'Selection Rate', value: metrics.ideaBrain.selectionRate, suffix: '%' }
      ]
    },
    {
      name: 'Creative Brain',
      icon: Palette,
      color: 'from-pink-500 to-rose-600',
      question: 'How should we present it?',
      metrics: [
        { label: 'Scripts Generated', value: metrics.creativeBrain.scriptsGenerated },
        { label: 'Visuals Generated', value: metrics.creativeBrain.visualsGenerated },
        { label: 'Captions Generated', value: metrics.creativeBrain.captionsGenerated }
      ]
    },
    {
      name: 'Analytics Brain',
      icon: BarChart3,
      color: 'from-green-500 to-emerald-600',
      question: 'What actually happened?',
      metrics: [
        { label: 'Posts Tracked', value: metrics.analyticsBrain.postsTracked },
        { label: 'Data Points', value: metrics.analyticsBrain.dataPointsCollected },
        { label: 'Avg Performance', value: metrics.analyticsBrain.avgPerformanceScore, suffix: '/100' }
      ]
    },
    {
      name: 'Learning Brain',
      icon: GraduationCap,
      color: 'from-teal-500 to-cyan-600',
      question: 'Why might it have happened? What evidence supports that?',
      metrics: [
        { label: 'Patterns Learned', value: metrics.learningBrain.patternsLearned },
        { label: 'Experiments Run', value: metrics.learningBrain.experimentsRun },
        { label: 'Confidence Level', value: metrics.learningBrain.confidenceLevel }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Closed Loop Visualization */}
      <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl border border-primary/10 p-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          The Closed Learning Loop
        </h3>
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          {['Research', 'Score', 'Select', 'Create', 'Publish', 'Measure', 'Learn', 'Improve'].map((step, idx) => (
            <div key={step} className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-white rounded-lg border border-gray-200 font-medium text-gray-700 shadow-sm">
                {step}
              </div>
              {idx < 7 && <ArrowRight className="w-4 h-4 text-gray-300" />}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 text-center mt-4">
          The brain continuously learns which content characteristics work for which audience, under which circumstances.
        </p>
      </div>

      {/* 8 Brains Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {brains.map((brain, idx) => {
          const Icon = brain.icon;
          return (
            <div key={idx} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all">
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-10 h-10 bg-gradient-to-br ${brain.color} rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-gray-800">{brain.name}</h4>
                  <p className="text-xs text-gray-500 mt-0.5 italic">"{brain.question}"</p>
                </div>
              </div>
              <div className="space-y-2">
                {brain.metrics.map((metric, mIdx) => (
                  <div key={mIdx} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-600">{metric.label}</span>
                    <span className="text-sm font-bold text-gray-800">
                      {metric.value}{'suffix' in metric && metric.suffix ? metric.suffix : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Explore/Exploit/Experiment */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Explore vs Exploit vs Experiment
        </h3>
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">Exploit (70%)</span>
              <span className="text-xs text-gray-500">Use what works</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-success rounded-full" style={{ width: '70%' }} />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">Explore (20%)</span>
              <span className="text-xs text-gray-500">Try variations</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '20%' }} />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">Experiment (10%)</span>
              <span className="text-xs text-gray-500">Try new things</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full" style={{ width: '10%' }} />
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          The brain doesn't just repeat what worked. It continuously tests new approaches while leveraging proven patterns.
        </p>
      </div>
    </div>
  );
}

function AudiencePanel() {
  const { state } = useApp();

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-2">
          <Users className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-800">Audience Brain</p>
            <p className="text-xs text-gray-600 mt-1">
              Your audience isn't just demographics. The brain understands <strong>intent</strong> — what problems they have, what questions they ask, what goals they pursue.
            </p>
          </div>
        </div>
      </div>

      {state.audienceSegments.map((segment, idx) => (
        <div key={segment.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all animate-slide-in" style={{ animationDelay: `${idx * 100}ms` }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-gray-800">{segment.name}</h4>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Users className="w-3 h-3" /> {segment.size}% of audience
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> {segment.engagement}% engagement
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  segment.skillLevel === 'beginner' ? 'bg-green-100 text-green-700' :
                  segment.skillLevel === 'intermediate' ? 'bg-blue-100 text-blue-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {segment.skillLevel}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-warning" />
                Problems
              </p>
              <div className="space-y-1">
                {segment.problems.slice(0, 4).map((problem, i) => (
                  <p key={i} className="text-xs text-gray-600 pl-2 border-l-2 border-warning/30">"{problem}"</p>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-primary" />
                Questions
              </p>
              <div className="space-y-1">
                {segment.questions.slice(0, 3).map((question, i) => (
                  <p key={i} className="text-xs text-gray-600 pl-2 border-l-2 border-primary/30">"{question}"</p>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <Target className="w-3 h-3 text-success" />
                Goals
              </p>
              <div className="flex flex-wrap gap-1.5">
                {segment.goals.map((goal, i) => (
                  <span key={i} className="text-xs bg-success-light text-success px-2 py-0.5 rounded">{goal}</span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <Zap className="w-3 h-3 text-accent" />
                Tools Used
              </p>
              <div className="flex flex-wrap gap-1.5">
                {segment.toolsUsed.map((tool, i) => (
                  <span key={i} className="text-xs bg-accent-light text-accent px-2 py-0.5 rounded">{tool}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-700 mb-2">Content Preferences</p>
            <div className="flex flex-wrap gap-1.5">
              {segment.contentPreferences.map((pref, i) => (
                <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{pref}</span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ResearchPanel() {
  const { state } = useApp();

  return (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-2">
          <Search className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-800">Research & Idea Brain</p>
            <p className="text-xs text-gray-600 mt-1">
              Every discovered topic gets classified, scored, and matched to audience segments. Not just news — <strong>content intelligence</strong>.
            </p>
          </div>
        </div>
      </div>

      {state.contentOpportunities.map((opp, idx) => (
        <div key={opp.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all animate-slide-in" style={{ animationDelay: `${idx * 100}ms` }}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-base font-bold text-gray-800">{opp.topic}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  opp.status === 'selected' ? 'bg-success-light text-success' :
                  opp.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {opp.status}
                </span>
              </div>
              <p className="text-xs text-gray-500">Source: {opp.source} • Discovered {new Date(opp.discoveredAt).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{opp.overallScore.toFixed(1)}</div>
              <div className="text-xs text-gray-500">Opportunity Score</div>
            </div>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {Object.entries(opp.scores).map(([key, value]) => (
              <div key={key} className="text-center p-2 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-800">{value}</div>
                <div className="text-[10px] text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
              </div>
            ))}
          </div>

          {/* Angles */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">Content Angles</p>
            <div className="space-y-2">
              {opp.angles.map((angle, i) => (
                <div key={angle.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-primary-light rounded-full flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{String.fromCharCode(65 + i)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-800">{angle.title}</p>
                    <p className="text-xs text-gray-500 italic mt-0.5">"{angle.hook}"</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-500">Audience: {angle.audience}</span>
                      <span className="text-[10px] text-gray-400">•</span>
                      <span className="text-[10px] text-gray-500">Format: {angle.format}</span>
                      <span className="text-[10px] text-gray-400">•</span>
                      <span className="text-[10px] text-success font-medium">Est. performance: {angle.estimatedPerformance}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Classified For */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Classified for: {opp.classifiedFor.join(', ')}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function LearningPanel() {
  const { state } = useApp();

  const confidenceColors = {
    high: 'bg-success-light text-success border-success/20',
    medium: 'bg-warning-light text-warning border-warning/20',
    low: 'bg-gray-100 text-gray-600 border-gray-200'
  };

  return (
    <div className="space-y-4">
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-2">
          <GraduationCap className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-800">Learning Brain</p>
            <p className="text-xs text-gray-600 mt-1">
              The brain doesn't just record metrics. It learns <strong>patterns with evidence</strong> and <strong>confidence levels</strong>. It says "evidence suggests" not "the algorithm rewards."
            </p>
          </div>
        </div>
      </div>

      {/* Post DNA */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Content DNA Tracking
        </h3>
        <p className="text-xs text-gray-500 mb-4">Every post's DNA is recorded to enable proper comparison and learning.</p>
        
        <div className="space-y-3">
          {state.postDNA.slice(0, 2).map((post, idx) => (
            <div key={post.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-sm font-bold text-gray-800">Post #{post.postNumber}</h4>
                  <p className="text-xs text-gray-500">{post.topic} • {post.audience}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">{post.performanceScore}</div>
                  <div className="text-[10px] text-gray-500">Performance</div>
                </div>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-3">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-sm font-bold text-gray-800">{(post.metrics.reach / 1000).toFixed(1)}K</div>
                  <div className="text-[10px] text-gray-500">Reach</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-sm font-bold text-gray-800">{post.metrics.saves}</div>
                  <div className="text-[10px] text-gray-500">Saves</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-sm font-bold text-gray-800">{post.metrics.comments}</div>
                  <div className="text-[10px] text-gray-500">Comments</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-sm font-bold text-gray-800">{post.metrics.reposts}</div>
                  <div className="text-[10px] text-gray-500">Shares</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-sm font-bold text-gray-800">{post.metrics.followersGained}</div>
                  <div className="text-[10px] text-gray-500">Followers</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-sm font-bold text-gray-800">{post.businessRelevance}</div>
                  <div className="text-[10px] text-gray-500">Business</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {post.lessons.map((lesson, i) => (
                  <span key={i} className="text-[10px] bg-primary-light text-primary px-2 py-0.5 rounded">{lesson}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Learned Patterns */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          Learned Patterns
        </h3>
        <p className="text-xs text-gray-500 mb-4">Patterns are learned with evidence and confidence levels. The brain doesn't claim certainty from small samples.</p>

        <div className="space-y-3">
          {state.learnedPatterns.map((pattern, idx) => (
            <div key={pattern.id} className={`border rounded-lg p-4 ${confidenceColors[pattern.confidence]}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-2 flex-1">
                  {pattern.confidence === 'high' ? <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" /> :
                   pattern.confidence === 'medium' ? <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" /> :
                   <Clock className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{pattern.observation}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-gray-500">Confidence: <strong className="capitalize">{pattern.confidence}</strong></span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">Sample size: {pattern.sampleSize} posts</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500 capitalize">Category: {pattern.category}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="ml-6 mt-2">
                <p className="text-xs text-gray-500 mb-1">Evidence:</p>
                <div className="flex flex-wrap gap-1">
                  {pattern.evidence.slice(0, 3).map((ev, i) => (
                    <span key={i} className="text-[10px] bg-white/50 px-2 py-0.5 rounded">{ev}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExperimentsPanel() {
  const { state } = useApp();

  const statusColors = {
    planned: 'bg-gray-100 text-gray-600',
    running: 'bg-blue-100 text-blue-700',
    completed: 'bg-success-light text-success',
    inconclusive: 'bg-warning-light text-warning'
  };

  return (
    <div className="space-y-4">
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-2">
          <Activity className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-800">Causal/Experimental Brain</p>
            <p className="text-xs text-gray-600 mt-1">
              After identifying patterns, the brain runs <strong>controlled experiments</strong> to validate hypotheses. This is how it actually learns.
            </p>
          </div>
        </div>
      </div>

      {state.experiments.map((exp, idx) => (
        <div key={exp.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all animate-slide-in" style={{ animationDelay: `${idx * 100}ms` }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="text-base font-bold text-gray-800">{exp.name}</h4>
              <p className="text-xs text-gray-500 mt-0.5">Variable: {exp.variable}</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[exp.status]}`}>
              {exp.status}
            </span>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <p className="text-xs font-medium text-gray-700 mb-1">Hypothesis</p>
            <p className="text-sm text-gray-600 italic">{exp.hypothesis}</p>
          </div>

          {exp.variations.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-700 mb-2">Variations</p>
              <div className="space-y-2">
                {exp.variations.map((variation, i) => (
                  <div key={variation.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-primary-light rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{String.fromCharCode(65 + i)}</span>
                      </div>
                      <span className="text-sm text-gray-700">{variation.name}</span>
                    </div>
                    {variation.metric > 0 && (
                      <span className="text-sm font-bold text-primary">{variation.metric}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {exp.result && (
            <div className="bg-success-light/50 border border-success/20 rounded-lg p-3">
              <p className="text-xs font-medium text-success mb-1">Result</p>
              <p className="text-sm text-gray-700">{exp.result}</p>
              {exp.confidence && (
                <p className="text-xs text-gray-500 mt-1">Confidence: {exp.confidence}%</p>
              )}
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4">
            <span className="text-xs text-gray-500">Started: {new Date(exp.startDate).toLocaleDateString()}</span>
            {exp.endDate && <span className="text-xs text-gray-500">Ended: {new Date(exp.endDate).toLocaleDateString()}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ReportPanel() {
  const { state } = useApp();
  const report = state.weeklyReport;

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl border border-primary/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Weekly Content Intelligence</h3>
            <p className="text-sm text-gray-500">{report.week}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{report.postsPublished}</div>
            <div className="text-xs text-gray-500">Posts Published</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-primary">{(report.totalReach / 1000).toFixed(1)}K</div>
            <div className="text-xs text-gray-500">Total Reach</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-accent">{report.totalEngagement}</div>
            <div className="text-xs text-gray-500">Total Engagement</div>
          </div>
        </div>
      </div>

      {/* Topic Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h4 className="text-sm font-semibold text-gray-800 mb-4">What We Learned by Topic</h4>
        <div className="space-y-3">
          {report.topicBreakdown.map((topic, idx) => (
            <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{topic.topic}</p>
                <p className="text-xs text-gray-500">{topic.posts} posts</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800">{(topic.avgReach / 1000).toFixed(1)}K</p>
                <p className="text-xs text-gray-500">Avg reach</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-primary">{topic.avgEngagement}</p>
                <p className="text-xs text-gray-500">Avg engagement</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strong Signals */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success" />
          Strong Signals
        </h4>
        <div className="space-y-3">
          {report.strongSignals.map((signal, idx) => (
            <div key={idx} className="p-3 bg-success-light/50 border border-success/20 rounded-lg">
              <p className="text-sm text-gray-700">{signal.observation}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs font-medium text-success">Confidence: {signal.confidence}</span>
                <span className="text-xs text-gray-500">Evidence: {signal.evidence} posts</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weak Signals */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-warning" />
          Weak Signals
        </h4>
        <div className="space-y-3">
          {report.weakSignals.map((signal, idx) => (
            <div key={idx} className="p-3 bg-warning-light/50 border border-warning/20 rounded-lg">
              <p className="text-sm text-gray-700">{signal.observation}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs font-medium text-warning">Confidence: {signal.confidence}</span>
                <span className="text-xs text-gray-500">Evidence: {signal.evidence} posts</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Experiments */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Next Experiments
        </h4>
        <div className="space-y-2">
          {report.nextExperiments.map((exp, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-6 h-6 bg-primary-light rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{idx + 1}</span>
              </div>
              <p className="text-sm text-gray-700">{exp}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Explore/Exploit/Experiment */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h4 className="text-sm font-semibold text-gray-800 mb-4">This Week's Strategy</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-success-light/50 rounded-lg">
            <div className="text-2xl font-bold text-success">{report.exploreExploitRatio.exploit}%</div>
            <div className="text-xs text-gray-600 mt-1">Exploit</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Use what works</div>
          </div>
          <div className="text-center p-4 bg-primary-light/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{report.exploreExploitRatio.explore}%</div>
            <div className="text-xs text-gray-600 mt-1">Explore</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Try variations</div>
          </div>
          <div className="text-center p-4 bg-accent-light/50 rounded-lg">
            <div className="text-2xl font-bold text-accent">{report.exploreExploitRatio.experiment}%</div>
            <div className="text-xs text-gray-600 mt-1">Experiment</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Try new things</div>
          </div>
        </div>
      </div>
    </div>
  );
}
