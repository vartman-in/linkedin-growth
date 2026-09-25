import { useState, useEffect } from 'react';
import { useWorkspace } from '../workspace/WorkspaceContext';
import { intelligenceEngineApi } from '../api/client';
import {
  Brain, Link2, TrendingUp, Lightbulb, AlertTriangle, Target,
  CheckCircle2, XCircle, Clock, ArrowRight, Sparkles,
  Eye, Loader, Plus, ExternalLink, BarChart3, Zap
} from 'lucide-react';

type BrainTab = 'overview' | 'opportunities' | 'trends' | 'gaps' | 'sources';

export default function BrainPage() {
  const { activeWorkspace } = useWorkspace();
  const [activeTab, setActiveTab] = useState<BrainTab>('overview');
  
  // Intelligence data
  const [summary, setSummary] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [gaps, setGaps] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  const [selectedSource, setSelectedSource] = useState<any>(null);
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [ingestUrl, setIngestUrl] = useState('');
  const [ingesting, setIngesting] = useState(false);

  useEffect(() => {
    if (activeWorkspace) {
      loadIntelligence();
    }
  }, [activeWorkspace]);

  const loadIntelligence = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [summaryData, opportunitiesData, trendsData, gapsData, sourcesData] = await Promise.allSettled([
        intelligenceEngineApi.getSummary(),
        intelligenceEngineApi.getOpportunities(),
        intelligenceEngineApi.getTrends(),
        intelligenceEngineApi.getGaps(),
        intelligenceEngineApi.getSources()
      ]);

      setSummary(summaryData.status === 'fulfilled' ? summaryData.value : null);
      setOpportunities(opportunitiesData.status === 'fulfilled' ? opportunitiesData.value : []);
      setTrends(trendsData.status === 'fulfilled' ? trendsData.value : []);
      setGaps(gapsData.status === 'fulfilled' ? gapsData.value : []);
      setSources(sourcesData.status === 'fulfilled' ? sourcesData.value : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load intelligence data');
      console.error('Failed to load intelligence:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIngestSource = async () => {
    if (!ingestUrl.trim()) return;
    
    try {
      setIngesting(true);
      setError(null);
      await intelligenceEngineApi.ingestSource(ingestUrl);
      setIngestUrl('');
      setShowIngestModal(false);
      await loadIntelligence();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ingest source');
    } finally {
      setIngesting(false);
    }
  };

  const handleConvertOpportunity = async (opportunityId: string) => {
    try {
      await intelligenceEngineApi.convertOpportunityToIdea(opportunityId);
      await loadIntelligence();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert opportunity');
    }
  };

  const handleUpdateOpportunityStatus = async (opportunityId: string, status: string) => {
    try {
      await intelligenceEngineApi.updateOpportunityStatus(opportunityId, status);
      await loadIntelligence();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update opportunity');
    }
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Brain },
    { id: 'opportunities' as const, label: 'Opportunities', icon: Lightbulb },
    { id: 'trends' as const, label: 'Trends', icon: TrendingUp },
    { id: 'gaps' as const, label: 'Content Gaps', icon: AlertTriangle },
    { id: 'sources' as const, label: 'Sources', icon: Link2 },
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
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Growth Intelligence</h1>
              <p className="text-gray-500 text-sm mt-0.5">AI-powered content intelligence and opportunity detection</p>
            </div>
          </div>
          <button
            onClick={() => setShowIngestModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Source
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Ingest Modal */}
      {showIngestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Add Source URL</h3>
            <input
              type="url"
              value={ingestUrl}
              onChange={(e) => setIngestUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowIngestModal(false);
                  setIngestUrl('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleIngestSource}
                disabled={ingesting || !ingestUrl.trim()}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
              >
                {ingesting ? 'Processing...' : 'Ingest'}
              </button>
            </div>
          </div>
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
        <OverviewPanel summary={summary} />
      )}
      {activeTab === 'opportunities' && (
        <OpportunitiesPanel
          opportunities={opportunities}
          onView={setSelectedOpportunity}
          onConvert={handleConvertOpportunity}
          onUpdateStatus={handleUpdateOpportunityStatus}
        />
      )}
      {activeTab === 'trends' && (
        <TrendsPanel trends={trends} />
      )}
      {activeTab === 'gaps' && (
        <GapsPanel gaps={gaps} />
      )}
      {activeTab === 'sources' && (
        <SourcesPanel sources={sources} onView={setSelectedSource} />
      )}

      {/* Opportunity Detail Modal */}
      {selectedOpportunity && (
        <OpportunityDetailModal
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
          onConvert={handleConvertOpportunity}
          onUpdateStatus={handleUpdateOpportunityStatus}
        />
      )}

      {/* Source Detail Modal */}
      {selectedSource && (
        <SourceDetailModal
          source={selectedSource}
          onClose={() => setSelectedSource(null)}
        />
      )}
    </div>
  );
}

function OverviewPanel({ summary }: { summary: any }) {
  if (!summary) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No intelligence data yet</h3>
        <p className="text-sm text-gray-500">Add sources to start building intelligence.</p>
      </div>
    );
  }

  const stats = [
    { label: 'Sources', value: summary.sources?.total || 0, icon: Link2, color: 'text-blue-600' },
    { label: 'Topics', value: summary.topics?.total || 0, icon: Target, color: 'text-purple-600' },
    { label: 'Trends', value: summary.trends?.rising || 0, icon: TrendingUp, color: 'text-green-600' },
    { label: 'Opportunities', value: summary.opportunities?.total || 0, icon: Lightbulb, color: 'text-orange-600' },
    { label: 'Gaps', value: summary.gaps?.total || 0, icon: AlertTriangle, color: 'text-red-600' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div key={idx} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <Icon className={`w-6 h-6 ${stat.color}`} />
              <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
            </div>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}

function OpportunitiesPanel({
  opportunities,
  onView,
  onConvert,
  onUpdateStatus
}: {
  opportunities: any[];
  onView: (opp: any) => void;
  onConvert: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
}) {
  if (opportunities.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No content opportunities yet</h3>
        <p className="text-sm text-gray-500">Add sources and detect trends to generate opportunities.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {opportunities.map(opp => (
        <div key={opp.id} className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{opp.topic_name}</h3>
              <p className="text-sm text-gray-600 mb-2">{opp.thesis}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" />
                  Score: {opp.overall_score?.toFixed(1) || 'N/A'}
                </span>
                <span className="flex items-center gap-1">
                  <Link2 className="w-3 h-3" />
                  {opp.source_ids?.length || 0} sources
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  opp.status === 'DISCOVERED' ? 'bg-blue-100 text-blue-700' :
                  opp.status === 'REVIEWED' ? 'bg-purple-100 text-purple-700' :
                  opp.status === 'SAVED' ? 'bg-green-100 text-green-700' :
                  opp.status === 'CONVERTED' ? 'bg-gray-100 text-gray-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {opp.status}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onView(opp)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Eye className="w-4 h-4" />
              View Details
            </button>
            {opp.status !== 'CONVERTED' && (
              <button
                onClick={() => onConvert(opp.id)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                <Sparkles className="w-4 h-4" />
                Create Content Idea
              </button>
            )}
            {opp.status === 'DISCOVERED' && (
              <button
                onClick={() => onUpdateStatus(opp.id, 'REVIEWED')}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark Reviewed
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function TrendsPanel({ trends }: { trends: any[] }) {
  if (trends.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No trend signals yet</h3>
        <p className="text-sm text-gray-500">More data is needed to detect trends.</p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-700',
    RISING: 'bg-green-100 text-green-700',
    SUSTAINED: 'bg-purple-100 text-purple-700',
    STABLE: 'bg-gray-100 text-gray-700',
    DECLINING: 'bg-red-100 text-red-700',
    INSUFFICIENT_DATA: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="space-y-4">
      {trends.map(trend => (
        <div key={trend.id} className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Topic {trend.topic_id?.substring(0, 8)}
              </h3>
              <p className="text-sm text-gray-600">{trend.signal_type}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[trend.status] || 'bg-gray-100 text-gray-600'}`}>
              {trend.status}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {trend.volume !== null && (
              <div>
                <p className="text-gray-500 text-xs">Volume</p>
                <p className="font-semibold">{trend.volume}</p>
              </div>
            )}
            {trend.velocity !== null && (
              <div>
                <p className="text-gray-500 text-xs">Velocity</p>
                <p className="font-semibold">{trend.velocity.toFixed(2)}</p>
              </div>
            )}
            {trend.source_diversity !== null && (
              <div>
                <p className="text-gray-500 text-xs">Source Diversity</p>
                <p className="font-semibold">{trend.source_diversity}</p>
              </div>
            )}
            {trend.confidence !== null && (
              <div>
                <p className="text-gray-500 text-xs">Confidence</p>
                <p className="font-semibold">{(trend.confidence * 100).toFixed(0)}%</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function GapsPanel({ gaps }: { gaps: any[] }) {
  if (gaps.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No content gaps detected</h3>
        <p className="text-sm text-gray-500">Add more sources to identify gaps.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {gaps.map(gap => (
        <div key={gap.id} className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{gap.topic_name}</h3>
              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                {gap.gap_type?.replace('_', ' ')}
              </span>
            </div>
            {gap.confidence !== null && (
              <span className="text-sm text-gray-500">
                Confidence: {(gap.confidence * 100).toFixed(0)}%
              </span>
            )}
          </div>

          {gap.unanswered_question && (
            <div className="mb-3">
              <p className="text-sm text-gray-600">{gap.unanswered_question}</p>
            </div>
          )}

          {gap.opportunity_description && (
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-900">{gap.opportunity_description}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SourcesPanel({ sources, onView }: { sources: any[]; onView: (source: any) => void }) {
  if (sources.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Link2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No sources yet</h3>
        <p className="text-sm text-gray-500 mb-4">Add your first source to start building intelligence.</p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    DISCOVERED: 'bg-blue-100 text-blue-700',
    FETCHED: 'bg-yellow-100 text-yellow-700',
    PROCESSED: 'bg-green-100 text-green-700',
    FAILED: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-3">
      {sources.map(source => (
        <div key={source.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate mb-1">
              {source.title || source.url}
            </h3>
            <p className="text-xs text-gray-500 truncate">{source.url}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span className={`px-2 py-0.5 rounded-full font-medium ${statusColors[source.status] || 'bg-gray-100 text-gray-600'}`}>
                {source.status}
              </span>
              {source.publisher && <span>{source.publisher}</span>}
              {source.fetched_at && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(source.fetched_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => onView(source)}
            className="ml-4 flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Eye className="w-4 h-4" />
            View
          </button>
        </div>
      ))}
    </div>
  );
}

function OpportunityDetailModal({
  opportunity,
  onClose,
  onConvert,
  onUpdateStatus
}: {
  opportunity: any;
  onClose: () => void;
  onConvert: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{opportunity.topic_name}</h2>
            <p className="text-sm text-gray-600">{opportunity.thesis}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Why Now</h3>
            <p className="text-sm text-gray-600">{opportunity.why_now || 'No timing information available'}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Audience Relevance</h3>
            <p className="text-sm text-gray-600">{opportunity.audience_relevance || 'Not specified'}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Recommended Approach</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Angle</p>
                <p className="text-sm font-medium">{opportunity.recommended_angle || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Format</p>
                <p className="text-sm font-medium">{opportunity.recommended_format || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Objective</p>
                <p className="text-sm font-medium">{opportunity.recommended_objective || 'N/A'}</p>
              </div>
            </div>
          </div>

          {opportunity.scoring_breakdown && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Scoring Breakdown</h3>
              <div className="space-y-2">
                {Object.entries(opportunity.scoring_breakdown).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div>
                      <p className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className="text-xs text-gray-500">{value.reason}</p>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{value.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            {opportunity.status !== 'CONVERTED' && (
              <button
                onClick={() => onConvert(opportunity.id)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                <Sparkles className="w-4 h-4" />
                Create Content Idea
              </button>
            )}
            {opportunity.status === 'DISCOVERED' && (
              <button
                onClick={() => onUpdateStatus(opportunity.id, 'REVIEWED')}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark Reviewed
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SourceDetailModal({ source, onClose }: { source: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{source.title || 'Untitled Source'}</h2>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              {source.publisher && <span>{source.publisher}</span>}
              {source.published_at && (
                <span>{new Date(source.published_at).toLocaleDateString()}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">URL</h3>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              {source.url}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Status</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              source.status === 'PROCESSED' ? 'bg-green-100 text-green-700' :
              source.status === 'FETCHED' ? 'bg-yellow-100 text-yellow-700' :
              source.status === 'FAILED' ? 'bg-red-100 text-red-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {source.status}
            </span>
          </div>

          {source.error_message && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{source.error_message}</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Metadata</h3>
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <pre className="whitespace-pre-wrap">{JSON.stringify(source.metadata || {}, null, 2)}</pre>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
