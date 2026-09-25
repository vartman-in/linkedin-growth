import { useState } from 'react';
import { useApp } from '../store';
import {
  Plus, Lightbulb, Link2, FileText, TrendingUp, MessageSquare,
  RefreshCw, Eye, CheckCircle2, XCircle, AlertTriangle,
  ArrowRight, ChevronRight, Shield, Sparkles, BookOpen
} from 'lucide-react';
import { ContentIdea } from '../data';

type ContentTab = 'ideas' | 'drafts' | 'carousel' | 'calendar';

export default function ContentPage() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<ContentTab>('ideas');
  const [showNewIdea, setShowNewIdea] = useState(false);
  const [newIdeaType, setNewIdeaType] = useState<string>('');
  const [newIdeaContent, setNewIdeaContent] = useState('');

  const tabs = [
    { id: 'ideas' as const, label: 'Ideas & Sources', icon: Lightbulb, count: state.ideas.length },
    { id: 'drafts' as const, label: 'Drafts', icon: FileText, count: state.drafts.length },
    { id: 'carousel' as const, label: 'Carousel', icon: BookOpen, count: state.carouselSlides.length },
    { id: 'calendar' as const, label: 'Calendar', icon: TrendingUp, count: 0 },
  ];

  const handleAddIdea = () => {
    if (!newIdeaContent.trim()) return;
    const newIdea: ContentIdea = {
      id: `idea-${Date.now()}`,
      title: newIdeaContent.slice(0, 80),
      source: newIdeaType as ContentIdea['source'] || 'idea',
      status: 'new',
      pillar: 'AI',
      createdAt: new Date().toISOString(),
      thesis: newIdeaContent,
      angles: ['Angle A: Core thesis exploration', 'Angle B: Practical application', 'Angle C: Contrarian take']
    };
    dispatch({ type: 'ADD_IDEA', idea: newIdea });
    setNewIdeaContent('');
    setNewIdeaType('');
    setShowNewIdea(false);
  };

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
                  onClick={() => setShowNewIdea(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddIdea}
                  disabled={!newIdeaContent.trim()}
                  className="px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Start Creating
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
      {activeTab === 'ideas' && <IdeasPanel />}
      {activeTab === 'drafts' && <DraftsPanel />}
      {activeTab === 'carousel' && <CarouselPanel />}
      {activeTab === 'calendar' && <CalendarPanel />}
    </div>
  );
}

function IdeasPanel() {
  const { state, dispatch } = useApp();

  const statusColors: Record<string, string> = {
    new: 'bg-gray-100 text-gray-600',
    researching: 'bg-blue-100 text-blue-700',
    understood: 'bg-purple-100 text-purple-700',
    strategizing: 'bg-amber-100 text-amber-700',
    drafting: 'bg-indigo-100 text-indigo-700',
    review: 'bg-orange-100 text-orange-700',
    approved: 'bg-green-100 text-green-700',
    scheduled: 'bg-cyan-100 text-cyan-700',
    published: 'bg-emerald-100 text-emerald-700',
  };

  const sourceIcons: Record<string, typeof Lightbulb> = {
    idea: Lightbulb,
    url: Link2,
    notes: FileText,
    experience: Sparkles,
    trend: TrendingUp,
    sales: MessageSquare,
  };

  return (
    <div className="space-y-3">
      {state.ideas.map((idea, idx) => {
        const SourceIcon = sourceIcons[idea.source] || Lightbulb;
        return (
          <div
            key={idea.id}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer animate-slide-in"
            style={{ animationDelay: `${idx * 50}ms` }}
            onClick={() => dispatch({ type: 'SELECT_IDEA', id: idea.id })}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <SourceIcon className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">{idea.title}</h4>
                  {idea.thesis && (
                    <p className="text-xs text-gray-500 mb-2 italic">"{idea.thesis}"</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[idea.status]}`}>
                      {idea.status}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{idea.pillar}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-400 capitalize">{idea.source}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
            </div>
            {idea.angles && idea.angles.length > 0 && (
              <div className="mt-3 pl-12">
                <p className="text-xs text-gray-400 mb-1.5">Possible angles:</p>
                <div className="flex flex-wrap gap-1.5">
                  {idea.angles.map((angle, i) => (
                    <span key={i} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-md">
                      {angle}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DraftsPanel() {
  const { state, dispatch } = useApp();
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(state.drafts[0]?.id || null);
  const selectedDraft = state.drafts.find(d => d.id === selectedDraftId);

  if (!selectedDraft) return <p className="text-gray-500 text-sm">No drafts yet.</p>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Draft List */}
      <div className="space-y-2">
        {state.drafts.map(draft => (
          <button
            key={draft.id}
            onClick={() => setSelectedDraftId(draft.id)}
            className={`w-full text-left p-3 rounded-xl border transition-all
              ${draft.id === selectedDraftId ? 'border-primary bg-primary-light' : 'border-gray-200 bg-white hover:border-gray-300'}`}
          >
            <h4 className="text-sm font-medium text-gray-800 truncate">{draft.title}</h4>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium
                ${draft.status === 'review' ? 'bg-orange-100 text-orange-700' :
                  draft.status === 'approved' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-600'}`}>
                {draft.status}
              </span>
              <span className="text-xs text-gray-400">v{draft.version}</span>
              <span className="text-xs text-gray-400">• {draft.format}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Draft Detail */}
      <div className="lg:col-span-2 space-y-4">
        {/* Quality Status */}
        <div className={`rounded-xl border p-4 ${
          selectedDraft.quality.overall === 'PASS' ? 'border-success/30 bg-success-light/50' :
          selectedDraft.quality.overall === 'BLOCKED' ? 'border-danger/30 bg-danger-light/50' :
          'border-warning/30 bg-warning-light/50'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className={`w-4 h-4 ${
                selectedDraft.quality.overall === 'PASS' ? 'text-success' :
                selectedDraft.quality.overall === 'BLOCKED' ? 'text-danger' : 'text-warning'
              }`} />
              <span className="text-sm font-semibold text-gray-800">
                Quality: {selectedDraft.quality.overall.replace('_', ' ')}
              </span>
            </div>
            <span className="text-xs text-gray-500">Version {selectedDraft.version}</span>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {[
              { label: 'Thesis', pass: selectedDraft.quality.thesis },
              { label: 'Voice', pass: selectedDraft.quality.voice },
              { label: 'Evidence', pass: selectedDraft.quality.evidence },
              { label: 'Originality', pass: selectedDraft.quality.originality },
              { label: 'Structure', pass: selectedDraft.quality.structure },
              { label: 'Platform', pass: selectedDraft.quality.platform },
            ].map(check => (
              <div key={check.label} className="flex items-center gap-1.5">
                {check.pass ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-danger" />
                )}
                <span className="text-xs text-gray-600">{check.label}</span>
              </div>
            ))}
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
              {selectedDraft.content || selectedDraft.hook}
            </p>
          </div>
        </div>

        {/* Claims Ledger */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Claims & Evidence</h4>
          <div className="space-y-2">
            {selectedDraft.claims.map(claim => (
              <div key={claim.id} className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  claim.publishable ? 'bg-success' : 'bg-danger'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{claim.text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">{claim.type}</span>
                    <span className="text-xs text-gray-300">•</span>
                    <span className={`text-xs font-medium ${
                      claim.provenance === 'UNAVAILABLE' ? 'text-danger' :
                      claim.provenance === 'ESTIMATED' ? 'text-warning' : 'text-success'
                    }`}>{claim.provenance.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs text-gray-400">{Math.round(claim.confidence * 100)}% confidence</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Approval */}
        {selectedDraft.status === 'review' && selectedDraft.quality.overall === 'PASS' && (
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
                <button className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                  Schedule
                </button>
                <button
                  onClick={() => dispatch({ type: 'APPROVE_DRAFT', id: selectedDraft.id })}
                  className="px-4 py-1.5 text-sm bg-success text-white font-medium rounded-lg hover:bg-success/90 transition-colors"
                >
                  Approve & Publish
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedDraft.quality.overall === 'REVIEW_REQUIRED' && (
          <div className="bg-warning-light/50 border border-warning/30 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <span className="text-sm font-semibold text-gray-800">Review Required</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Some claims need verification before this can be approved.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CarouselPanel() {
  const { state } = useApp();
  const [activeSlide, setActiveSlide] = useState(0);

  const slideColors = [
    'from-primary to-primary-dark',
    'from-gray-800 to-gray-900',
    'from-accent to-purple-900',
    'from-accent to-purple-900',
    'from-indigo-600 to-indigo-800',
    'from-success to-emerald-800',
    'from-primary to-primary-dark',
  ];

  return (
    <div className="space-y-5">
      {/* Slide Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {state.carouselSlides.map((slide, idx) => (
          <button
            key={slide.id}
            onClick={() => setActiveSlide(idx)}
            className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all
              ${activeSlide === idx ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {idx + 1}. {slide.type}
          </button>
        ))}
      </div>

      {/* Carousel Preview */}
      <div className="flex gap-5">
        {/* Slide Preview */}
        <div className="flex-1">
          <div className={`aspect-[4/5] max-w-sm mx-auto rounded-2xl bg-gradient-to-br ${slideColors[activeSlide]} p-8 flex flex-col justify-between shadow-xl`}>
            <div>
              <span className="text-white/60 text-xs font-medium uppercase tracking-wider">
                {state.carouselSlides[activeSlide].type}
              </span>
              <h3 className="text-white text-2xl font-bold mt-3 leading-tight">
                {state.carouselSlides[activeSlide].headline}
              </h3>
            </div>
            <p className="text-white/80 text-sm leading-relaxed">
              {state.carouselSlides[activeSlide].body}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-white/40 text-xs">
                {activeSlide + 1} / {state.carouselSlides.length}
              </span>
              <div className="flex gap-1">
                {state.carouselSlides.map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === activeSlide ? 'bg-white' : 'bg-white/30'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Slide Details */}
        <div className="flex-1 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Slide Details</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-medium">Type</label>
                <p className="text-sm text-gray-700 capitalize mt-0.5">{state.carouselSlides[activeSlide].type}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Headline</label>
                <p className="text-sm text-gray-700 mt-0.5">{state.carouselSlides[activeSlide].headline}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Body</label>
                <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap">{state.carouselSlides[activeSlide].body}</p>
              </div>
              {state.carouselSlides[activeSlide].visualDirection && (
                <div>
                  <label className="text-xs text-gray-500 font-medium">Visual Direction</label>
                  <p className="text-sm text-gray-500 italic mt-0.5">{state.carouselSlides[activeSlide].visualDirection}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Carousel Structure</h4>
            <div className="space-y-1.5">
              {state.carouselSlides.map((slide, idx) => (
                <div
                  key={slide.id}
                  onClick={() => setActiveSlide(idx)}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all
                    ${idx === activeSlide ? 'bg-primary-light border border-primary/20' : 'hover:bg-gray-50'}`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                    ${idx === activeSlide ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {idx + 1}
                  </span>
                  <span className="text-xs text-gray-700 truncate">{slide.headline}</span>
                  <ArrowRight className="w-3 h-3 text-gray-300 ml-auto shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarPanel() {
  const { state } = useApp();

  const calendarItems = [
    { date: 'Jan 16', title: 'AI tools vs workflows', format: 'Text Post', status: 'review', pillar: 'AI' },
    { date: 'Jan 17', title: 'Context switching costs', format: 'Carousel', status: 'draft', pillar: 'Software Dev' },
    { date: 'Jan 18', title: 'Why AI pilots fail', format: 'Text Post', status: 'strategizing', pillar: 'AI' },
    { date: 'Jan 19', title: 'Building in public', format: 'Story', status: 'published', pillar: 'Startups' },
    { date: 'Jan 20', title: 'Workflow automation stack', format: 'Framework', status: 'new', pillar: 'AI' },
  ];

  const statusColors: Record<string, string> = {
    new: 'bg-gray-100 text-gray-600',
    draft: 'bg-blue-100 text-blue-700',
    strategizing: 'bg-amber-100 text-amber-700',
    review: 'bg-orange-100 text-orange-700',
    approved: 'bg-green-100 text-green-700',
    scheduled: 'bg-cyan-100 text-cyan-700',
    published: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-4 border-b border-gray-100">
        <h4 className="text-sm font-semibold text-gray-800">Content Calendar</h4>
      </div>
      <div className="divide-y divide-gray-100">
        {calendarItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
            <div className="text-center min-w-[50px]">
              <p className="text-xs text-gray-400">{item.date.split(' ')[0]}</p>
              <p className="text-lg font-bold text-gray-800">{item.date.split(' ')[1]}</p>
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-sm font-medium text-gray-800 truncate">{item.title}</h5>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">{item.format}</span>
                <span className="text-xs text-gray-300">•</span>
                <span className="text-xs text-gray-500">{item.pillar}</span>
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[item.status]}`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
