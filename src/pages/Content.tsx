import { useState, useEffect } from 'react';
import { useWorkspace } from '../workspace/WorkspaceContext';
import { contentIdeasApi, contentDraftsApi } from '../api/client';
import {
  Plus, Lightbulb, Link2, FileText, TrendingUp, MessageSquare,
  RefreshCw, Eye, CheckCircle2, XCircle, AlertTriangle,
  ArrowRight, ChevronRight, Shield, Sparkles, BookOpen, Target, Loader
} from 'lucide-react';

type ContentTab = 'ideas' | 'factory' | 'drafts' | 'carousel' | 'calendar';

export default function ContentPage() {
  const { activeWorkspace } = useWorkspace();
  const [activeTab, setActiveTab] = useState<ContentTab>('ideas');
  const [showNewIdea, setShowNewIdea] = useState(false);
  const [newIdeaType, setNewIdeaType] = useState<string>('');
  const [newIdeaContent, setNewIdeaContent] = useState('');
  const [creating, setCreating] = useState(false);
  
  // Real data from API
  const [ideas, setIdeas] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeWorkspace) {
      loadData();
    }
  }, [activeWorkspace]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ideasData, draftsData] = await Promise.all([
        contentIdeasApi.getAll(),
        contentDraftsApi.getAll()
      ]);
      setIdeas(ideasData);
      setDrafts(draftsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content');
      console.error('Failed to load content:', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'ideas' as const, label: 'Ideas & Sources', icon: Lightbulb, count: ideas.length },
    { id: 'factory' as const, label: 'Content Factory', icon: RefreshCw, count: 0 },
    { id: 'drafts' as const, label: 'Drafts', icon: FileText, count: drafts.length },
    { id: 'carousel' as const, label: 'Carousel', icon: BookOpen, count: 0 },
    { id: 'calendar' as const, label: 'Calendar', icon: TrendingUp, count: 0 },
  ];

  const handleAddIdea = async () => {
    if (!newIdeaContent.trim()) return;
    
    try {
      setCreating(true);
      setError(null);
      
      const newIdea = await contentIdeasApi.create({
        title: newIdeaContent.slice(0, 80),
        sourceReference: newIdeaType === 'url' ? newIdeaContent : undefined,
        pillar: 'AI',
        audience: undefined,
        angle: undefined,
      });
      
      setIdeas([newIdea, ...ideas]);
      setNewIdeaContent('');
      setNewIdeaType('');
      setShowNewIdea(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create idea');
      console.error('Failed to create idea:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleGenerateDraft = async (ideaId: string) => {
    try {
      setError(null);
      const draft = await contentIdeasApi.generateDraft(ideaId);
      setDrafts([draft, ...drafts]);
      
      // Update idea status
      setIdeas(ideas.map(idea => 
        idea.id === ideaId ? { ...idea, status: 'DRAFTING' } : idea
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate draft');
      console.error('Failed to generate draft:', err);
    }
  };

  const handleApproveDraft = async (draftId: string) => {
    try {
      setError(null);
      const updatedDraft = await contentDraftsApi.approve(draftId);
      setDrafts(drafts.map(d => d.id === draftId ? updatedDraft : d));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve draft');
      console.error('Failed to approve draft:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Machine</h1>
          <p className="text-gray-500 text-sm mt-1">Turn knowledge and evidence into high-quality LinkedIn content</p>
        </div>
        <button
          onClick={() => setShowNewIdea(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Content
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* New Idea Modal */}
      {showNewIdea && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Create New Content</h3>
              <p className="text-sm text-gray-500 mt-1">Choose your starting point</p>
            </div>
            <div className="p-6">
              {/* Source Types */}
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-6">
                {[
                  { id: 'idea', label: 'My Idea', icon: Lightbulb },
                  { id: 'url', label: 'Public URL', icon: Link2 },
                  { id: 'notes', label: 'My Notes', icon: FileText },
                  { id: 'experience', label: 'Experience', icon: Sparkles },
                  { id: 'trend', label: 'Trend', icon: TrendingUp },
                  { id: 'sales', label: 'Sales Signal', icon: MessageSquare },
                ].map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setNewIdeaType(type.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center
                        ${newIdeaType === type.id ? 'border-primary bg-primary-light' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <Icon className={`w-5 h-5 ${newIdeaType === type.id ? 'text-primary' : 'text-gray-400'}`} />
                      <span className={`text-xs font-medium ${newIdeaType === type.id ? 'text-primary' : 'text-gray-600'}`}>
                        {type.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Content Input */}
              <textarea
                value={newIdeaContent}
                onChange={(e) => setNewIdeaContent(e.target.value)}
                placeholder={
                  newIdeaType === 'url' ? 'Paste a URL (article, research, announcement)...' :
                  newIdeaType === 'notes' ? 'Paste your notes, thoughts, or transcript...' :
                  newIdeaType === 'experience' ? 'Describe your experience, lesson, or case study...' :
                  'What\'s your idea or thesis?'
                }
                className="w-full h-32 px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowNewIdea(false);
                    setNewIdeaContent('');
                    setNewIdeaType('');
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddIdea}
                  disabled={!newIdeaContent.trim() || creating}
                  className="px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {creating ? 'Creating...' : 'Start Creating'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-primary-light text-primary' : 'bg-gray-200 text-gray-500'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'ideas' && (
        <IdeasPanel 
          ideas={ideas} 
          onGenerate={handleGenerateDraft}
        />
      )}
      {activeTab === 'factory' && <FactoryPanel />}
      {activeTab === 'drafts' && (
        <DraftsPanel 
          drafts={drafts}
          onApprove={handleApproveDraft}
        />
      )}
      {activeTab === 'carousel' && <CarouselPanel />}
      {activeTab === 'calendar' && <CalendarPanel />}
    </div>
  );
}

function IdeasPanel({ ideas, onGenerate }: { ideas: any[], onGenerate: (id: string) => void }) {
  if (ideas.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lightbulb className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No content ideas yet</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Create your first idea from a thought, URL, note, or experience. The system will help you develop it into publishable content.
        </p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    NEW: 'bg-gray-100 text-gray-600',
    RESEARCHING: 'bg-blue-100 text-blue-700',
    DRAFTING: 'bg-indigo-100 text-indigo-700',
    VALIDATED: 'bg-purple-100 text-purple-700',
    ARCHIVED: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="space-y-3">
      {ideas.map((idea, idx) => (
        <div
          key={idea.id}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-primary/20 transition-all animate-slide-in"
          style={{ animationDelay: `${idx * 50}ms` }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <Lightbulb className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">{idea.title}</h4>
                {idea.thesis && (
                  <p className="text-xs text-gray-500 mb-2 italic">"{idea.thesis}"</p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[idea.status] || 'bg-gray-100 text-gray-600'}`}>
                    {idea.status}
                  </span>
                  {idea.pillar && (
                    <>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{idea.pillar}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {idea.status === 'NEW' && (
              <button
                onClick={() => onGenerate(idea.id)}
                className="ml-3 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-dark transition-colors"
              >
                Generate Draft
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function DraftsPanel({ drafts, onApprove }: { drafts: any[], onApprove: (id: string) => void }) {
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(drafts[0]?.id || null);
  const selectedDraft = drafts.find(d => d.id === selectedDraftId);

  if (drafts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No drafts yet</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Drafts appear here after you create a content idea and generate a draft. Start by adding an idea in the Ideas & Sources tab.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Draft List */}
      <div className="space-y-2">
        {drafts.map(draft => (
          <button
            key={draft.id}
            onClick={() => setSelectedDraftId(draft.id)}
            className={`w-full text-left p-3 rounded-xl border transition-all
              ${draft.id === selectedDraftId ? 'border-primary bg-primary-light' : 'border-gray-200 bg-white hover:border-gray-300'}`}
          >
            <h4 className="text-sm font-medium text-gray-800 truncate">{draft.title}</h4>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium
                ${draft.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                  draft.status === 'IN_REVIEW' ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-600'}`}>
                {draft.status}
              </span>
              <span className="text-xs text-gray-400">v{draft.version}</span>
              <span className="text-xs text-gray-400">• {draft.content_type}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Draft Detail */}
      {selectedDraft && (
        <div className="lg:col-span-2 space-y-4">
          {/* Quality Status */}
          <div className={`rounded-xl border p-4 ${
            selectedDraft.qualityStatus === 'PASS' ? 'border-success/30 bg-success-light/50' :
            selectedDraft.qualityStatus === 'BLOCKED' ? 'border-danger/30 bg-danger-light/50' :
            'border-warning/30 bg-warning-light/50'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className={`w-4 h-4 ${
                  selectedDraft.qualityStatus === 'PASS' ? 'text-success' :
                  selectedDraft.qualityStatus === 'BLOCKED' ? 'text-danger' : 'text-warning'
                }`} />
                <span className="text-sm font-semibold text-gray-800">
                  Quality: {selectedDraft.qualityStatus}
                </span>
              </div>
              <span className="text-xs text-gray-500">Version {selectedDraft.version}</span>
            </div>
            <div className="text-xs text-gray-600">
              Score: {selectedDraft.qualityScore}/100
            </div>
          </div>

          {/* Content Preview */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-800">Content Preview</h4>
              <div className="flex gap-2">
                <button className="text-xs px-2.5 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Regenerate
                </button>
                <button className="text-xs px-2.5 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> LinkedIn Preview
                </button>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-[system-ui]">
                {selectedDraft.body}
              </p>
            </div>
          </div>

          {/* Approval */}
          {selectedDraft.status === 'IN_REVIEW' && selectedDraft.qualityStatus !== 'BLOCKED' && (
            <div className="bg-success-light/50 border border-success/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <span className="text-sm font-semibold text-gray-800">Approval Ready</span>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                    Edit
                  </button>
                  <button
                    onClick={() => onApprove(selectedDraft.id)}
                    className="px-4 py-1.5 text-sm bg-success text-white font-medium rounded-lg hover:bg-success/90 transition-colors"
                  >
                    Approve
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedDraft.qualityStatus === 'BLOCKED' && (
            <div className="bg-danger-light/50 border border-danger/30 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-danger" />
                <span className="text-sm font-semibold text-gray-800">Blocked</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">This draft has critical quality issues that must be resolved before approval.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FactoryPanel() {
  return (
    <div className="space-y-5">
      {/* Pipeline Visualization */}
      <div className="bg-gradient-to-br from-accent/5 to-primary/5 rounded-xl border border-accent/10 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-accent" />
          Content Factory Pipeline
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Multi-agent system: Script Agent → Visual Agent → Caption Agent → Hashtag Agent → Fact Check → Human Review
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'idea', label: 'Idea', icon: Lightbulb, color: 'bg-yellow-100 text-yellow-700' },
            { id: 'angle', label: 'Angle', icon: Target, color: 'bg-blue-100 text-blue-700' },
            { id: 'script', label: 'Script', icon: FileText, color: 'bg-purple-100 text-purple-700' },
            { id: 'visual', label: 'Visual', icon: RefreshCw, color: 'bg-pink-100 text-pink-700' },
            { id: 'caption', label: 'Caption', icon: MessageSquare, color: 'bg-indigo-100 text-indigo-700' },
            { id: 'hashtags', label: 'Hashtags', icon: Sparkles, color: 'bg-teal-100 text-teal-700' },
            { id: 'factcheck', label: 'Fact Check', icon: Shield, color: 'bg-orange-100 text-orange-700' },
            { id: 'review', label: 'Human Review', icon: CheckCircle2, color: 'bg-green-100 text-green-700' },
          ].map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={step.id} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg ${step.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">{step.label}</span>
                </div>
                {idx < 7 && (
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Brain-Informed Opportunities */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Brain-Selected Opportunities
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          These topics will be selected by the brain based on audience relevance, freshness, and historical performance patterns once the system has real data.
        </p>
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 text-center">
          <p className="text-sm text-gray-500">No opportunities discovered yet. The brain will surface relevant topics after configuration.</p>
        </div>
      </div>

      {/* Explore/Exploit/Experiment */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Content Strategy Balance</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-success-light/50 rounded-lg">
            <div className="text-xl font-bold text-success">70%</div>
            <div className="text-xs text-gray-600 font-medium">Exploit</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Use proven patterns</div>
          </div>
          <div className="text-center p-3 bg-primary-light/50 rounded-lg">
            <div className="text-xl font-bold text-primary">20%</div>
            <div className="text-xs text-gray-600 font-medium">Explore</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Try variations</div>
          </div>
          <div className="text-center p-3 bg-accent-light/50 rounded-lg">
            <div className="text-xl font-bold text-accent">10%</div>
            <div className="text-xs text-gray-600 font-medium">Experiment</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Try new approaches</div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          The brain doesn't just repeat what worked. It balances proven patterns with exploration and experimentation.
        </p>
      </div>
    </div>
  );
}

function CarouselPanel() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <BookOpen className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">No carousels yet</h3>
      <p className="text-sm text-gray-500 max-w-md mx-auto">
        Carousels will be generated from your content ideas. Create an idea and generate a draft to get started.
      </p>
    </div>
  );
}

function CalendarPanel() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <TrendingUp className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">No content scheduled</h3>
      <p className="text-sm text-gray-500 max-w-md mx-auto">
        Your content calendar will show approved and scheduled posts here. Create and approve content to see it here.
      </p>
    </div>
  );
}
