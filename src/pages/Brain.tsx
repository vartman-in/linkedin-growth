import { useState, useEffect } from 'react';
import { useWorkspace } from '../workspace/WorkspaceContext';
import { intelligenceApi } from '../api/client';
import {
  Brain, Users, Search, Lightbulb, Palette, BarChart3,
  GraduationCap, Briefcase, TrendingUp, Target, Zap,
  CheckCircle2, AlertCircle, Clock, ArrowRight, Sparkles,
  Eye, MessageSquare, Save, Share2, UserPlus, Activity, Loader, FileText
} from 'lucide-react';

type BrainTab = 'overview' | 'audience' | 'research' | 'learning' | 'experiments' | 'report';

export default function BrainPage() {
  const { activeWorkspace } = useWorkspace();
  const [activeTab, setActiveTab] = useState<BrainTab>('overview');
  
  // Real data from API
  const [contentInsights, setContentInsights] = useState<any>(null);
  const [salesInsights, setSalesInsights] = useState<any>(null);
  const [contentRecommendations, setContentRecommendations] = useState<any[]>([]);
  const [leadRecommendations, setLeadRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeWorkspace) {
      loadIntelligence();
    }
  }, [activeWorkspace]);

  const loadIntelligence = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [contentInsightsData, salesInsightsData, contentRecsData, leadRecsData] = await Promise.allSettled([
        intelligenceApi.getContentInsights(),
        intelligenceApi.getSalesInsights(),
        intelligenceApi.getContentRecommendations(),
        intelligenceApi.getLeadRecommendations()
      ]);

      setContentInsights(contentInsightsData.status === 'fulfilled' ? contentInsightsData.value : null);
      setSalesInsights(salesInsightsData.status === 'fulfilled' ? salesInsightsData.value : null);
      setContentRecommendations(contentRecsData.status === 'fulfilled' ? contentRecsData.value : []);
      setLeadRecommendations(leadRecsData.status === 'fulfilled' ? leadRecsData.value : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load intelligence data');
      console.error('Failed to load intelligence:', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Brain },
    { id: 'audience' as const, label: 'Audience Insights', icon: Users },
    { id: 'research' as const, label: 'Content Recommendations', icon: Search },
    { id: 'learning' as const, label: 'Learning Patterns', icon: GraduationCap },
    { id: 'experiments' as const, label: 'Lead Recommendations', icon: Activity },
    { id: 'report' as const, label: 'Weekly Report', icon: BarChart3 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

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
      {activeTab === 'overview' && (
        <OverviewPanel 
          contentInsights={contentInsights}
          salesInsights={salesInsights}
        />
      )}
      {activeTab === 'audience' && <AudiencePanel contentInsights={contentInsights} />}
      {activeTab === 'research' && <ResearchPanel recommendations={contentRecommendations} />}
      {activeTab === 'learning' && <LearningPanel contentInsights={contentInsights} />}
      {activeTab === 'experiments' && <ExperimentsPanel recommendations={leadRecommendations} />}
      {activeTab === 'report' && <ReportPanel contentInsights={contentInsights} salesInsights={salesInsights} />}
    </div>
  );
}

function OverviewPanel({ contentInsights, salesInsights }: any) {
  const hasData = contentInsights || salesInsights;

  if (!hasData) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Brain className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No learning data yet</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
          The Content Intelligence OS will begin tracking patterns once you publish content and collect performance data.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 text-left max-w-sm mx-auto">
          <p className="text-xs font-medium text-gray-700 mb-2">The system will track:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Which content performs best</li>
            <li>• Audience engagement patterns</li>
            <li>• Topic effectiveness</li>
            <li>• Posting time optimization</li>
            <li>• Format preferences</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Content Insights Summary */}
      {contentInsights && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Content Intelligence
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-primary-light/50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Hot Topics</p>
              <p className="text-2xl font-bold text-primary">{contentInsights.hotTopics?.length || 0}</p>
            </div>
            <div className="bg-accent-light/50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Recurring Objections</p>
              <p className="text-2xl font-bold text-accent">{contentInsights.recurringObjections?.length || 0}</p>
            </div>
            <div className="bg-success-light/50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Recurring Questions</p>
              <p className="text-2xl font-bold text-success">{contentInsights.recurringQuestions?.length || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sales Insights Summary */}
      {salesInsights && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-accent" />
            Sales Intelligence
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-primary-light/50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Top Performing Content</p>
              <p className="text-2xl font-bold text-primary">{salesInsights.topPerformingContent?.length || 0}</p>
            </div>
            <div className="bg-accent-light/50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Content-to-Lead Mapping</p>
              <p className="text-2xl font-bold text-accent">{salesInsights.contentToLeadMapping?.length || 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AudiencePanel({ contentInsights }: any) {
  if (!contentInsights?.hotTopics || contentInsights.hotTopics.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No audience insights yet</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Audience insights will appear after analyzing conversations and content engagement.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-2">
          <Users className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-800">Audience Brain</p>
            <p className="text-xs text-gray-600 mt-1">
              Hot topics identified from conversations and content engagement.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contentInsights.hotTopics.map((topic: any, idx: number) => (
          <div key={idx} className="bg-white rounded-xl border border-gray-200 p-4">
            <h4 className="text-sm font-bold text-gray-800 mb-2">{topic.topic}</h4>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs text-gray-500">{topic.count} mentions</span>
              <span className="text-xs text-gray-500">{topic.leads?.length || 0} leads</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResearchPanel({ recommendations }: any) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No content recommendations yet</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Content recommendations will be generated based on sales intelligence and audience insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-2">
          <Search className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-800">Content Recommendations</p>
            <p className="text-xs text-gray-600 mt-1">
              AI-generated content ideas based on sales intelligence and audience insights.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec: any, idx: number) => (
          <div key={idx} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-sm font-bold text-gray-800">{rec.topic}</h4>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                rec.priority === 'medium' ? 'bg-orange-100 text-orange-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {rec.priority}
              </span>
            </div>
            <p className="text-xs text-gray-600 mb-2">{rec.reason}</p>
            <span className="text-xs text-gray-500">Source: {rec.source}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LearningPanel({ contentInsights }: any) {
  if (!contentInsights?.recurringObjections || contentInsights.recurringObjections.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <GraduationCap className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No learning signals yet</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Learning will appear after the system has real content, sales or user-feedback data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-2">
          <GraduationCap className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-800">Learning Brain</p>
            <p className="text-xs text-gray-600 mt-1">
              Recurring objections and questions identified from conversations.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {contentInsights.recurringObjections.map((objection: any, idx: number) => (
          <div key={idx} className="bg-white rounded-xl border border-gray-200 p-4">
            <h4 className="text-sm font-bold text-gray-800 mb-2">{objection.topic}</h4>
            <p className="text-xs text-gray-600 mb-2">{objection.count} occurrences</p>
            {objection.examples && objection.examples.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Examples:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {objection.examples.slice(0, 3).map((example: string, i: number) => (
                    <li key={i} className="italic">"{example}"</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ExperimentsPanel({ recommendations }: any) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Activity className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No lead recommendations yet</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Lead recommendations will be generated based on content engagement and audience insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-2">
          <Activity className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-800">Lead Recommendations</p>
            <p className="text-xs text-gray-600 mt-1">
              AI-generated lead recommendations based on content engagement.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec: any, idx: number) => (
          <div key={idx} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-sm font-bold text-gray-800">{rec.leadName}</h4>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                rec.priority === 'medium' ? 'bg-orange-100 text-orange-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {rec.priority}
              </span>
            </div>
            <p className="text-xs text-gray-600 mb-2">{rec.reason}</p>
            <p className="text-xs text-gray-500">Suggested action: {rec.suggestedAction}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportPanel({ contentInsights, salesInsights }: any) {
  if (!contentInsights && !salesInsights) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No weekly report yet</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Weekly intelligence reports will be generated after you've published content and collected performance data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl border border-primary/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Weekly Content Intelligence</h3>
            <p className="text-sm text-gray-500">Current Period</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{contentInsights?.hotTopics?.length || 0}</div>
            <div className="text-xs text-gray-500">Hot Topics</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-primary">{contentInsights?.recurringObjections?.length || 0}</div>
            <div className="text-xs text-gray-500">Objections</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-accent">{contentInsights?.recurringQuestions?.length || 0}</div>
            <div className="text-xs text-gray-500">Questions</div>
          </div>
        </div>
      </div>

      {/* Strong Signals */}
      {contentInsights?.hotTopics && contentInsights.hotTopics.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
            Strong Signals
          </h4>
          <div className="space-y-3">
            {contentInsights.hotTopics.slice(0, 3).map((topic: any, idx: number) => (
              <div key={idx} className="p-3 bg-success-light/50 border border-success/20 rounded-lg">
                <p className="text-sm text-gray-700">{topic.topic}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs font-medium text-success">{topic.count} mentions</span>
                  <span className="text-xs text-gray-500">{topic.leads?.length || 0} leads</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
