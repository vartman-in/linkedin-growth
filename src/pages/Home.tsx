import { useApp } from '../store';
import {
  FileText, Users, MessageSquare, ArrowRight,
  TrendingUp, AlertCircle, CheckCircle2, Clock,
  Lightbulb, Target, Zap
} from 'lucide-react';

export default function HomePage() {
  const { state, dispatch } = useApp();

  const contentReady = state.drafts.filter(d => d.status === 'review').length;
  const ideasGenerated = state.ideas.filter(i => i.status === 'new' || i.status === 'researching').length;
  const sourcesToVerify = state.drafts.filter(d => d.quality.overall === 'REVIEW_REQUIRED').length;

  const prospectsResearched = state.prospects.filter(p => p.status === 'researched' || p.status === 'qualified').length;
  const repliesNeeded = state.conversations.filter(c => c.unread).length;
  const followUpsDue = state.prospects.filter(p => p.status === 'contacted').length;

  const recommendations = [
    {
      id: '1',
      title: 'Review today\'s post draft',
      reason: '1 post passed quality validation and is ready for your approval',
      icon: CheckCircle2,
      color: 'text-success',
      bg: 'bg-success-light',
      action: () => { dispatch({ type: 'SET_PAGE', page: 'content' }); dispatch({ type: 'SELECT_DRAFT', id: 'd1' }); }
    },
    {
      id: '2',
      title: 'Reply to Sarah Chen',
      reason: 'Meeting request from VP Engineering at TechFlow AI — high-fit prospect',
      icon: MessageSquare,
      color: 'text-primary',
      bg: 'bg-primary-light',
      action: () => { dispatch({ type: 'SET_PAGE', page: 'inbox' }); dispatch({ type: 'SELECT_CONVERSATION', id: 'conv1' }); }
    },
    {
      id: '3',
      title: 'Create content about AI tool overload',
      reason: '4 recent prospect conversations mentioned tool complexity as a pain point',
      icon: Lightbulb,
      color: 'text-accent',
      bg: 'bg-accent-light',
      action: () => dispatch({ type: 'SET_PAGE', page: 'content' })
    },
    {
      id: '4',
      title: 'Research 3 new prospects',
      reason: 'Trending topic "AI Agent Orchestration" aligns with your ICP and content pillar',
      icon: Target,
      color: 'text-warning',
      bg: 'bg-warning-light',
      action: () => dispatch({ type: 'SET_PAGE', page: 'leads' })
    }
  ];

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Good morning, Ankit</h1>
        <p className="text-gray-500 mt-1">Your Growth Operator — here's what needs your attention today.</p>
      </div>

      {/* Priority Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {/* Content Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-light rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-gray-800">Content</h3>
            </div>
            <button
              onClick={() => dispatch({ type: 'SET_PAGE', page: 'content' })}
              className="text-sm text-primary font-medium hover:text-primary-dark flex items-center gap-1"
            >
              Review <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span className="text-sm text-gray-700">Posts ready for review</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{contentReady}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-warning" />
                <span className="text-sm text-gray-700">Ideas generated</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{ideasGenerated}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-danger" />
                <span className="text-sm text-gray-700">Sources need verification</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{sourcesToVerify}</span>
            </div>
          </div>
        </div>

        {/* Sales Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent-light rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-accent" />
              </div>
              <h3 className="font-semibold text-gray-800">Sales</h3>
            </div>
            <button
              onClick={() => dispatch({ type: 'SET_PAGE', page: 'leads' })}
              className="text-sm text-accent font-medium hover:text-accent/80 flex items-center gap-1"
            >
              Review <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-success" />
                <span className="text-sm text-gray-700">Prospects researched</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{prospectsResearched}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="text-sm text-gray-700">Replies need attention</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{repliesNeeded}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-warning" />
                <span className="text-sm text-gray-700">Follow-ups due</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{followUpsDue}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Actions */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-gray-800">Recommended Actions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec, idx) => {
            const Icon = rec.icon;
            return (
              <button
                key={rec.id}
                onClick={rec.action}
                className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-md hover:border-primary/30 transition-all group"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 ${rec.bg} rounded-lg flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4.5 h-4.5 ${rec.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-800 group-hover:text-primary transition-colors">
                      {rec.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{rec.reason}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Operating Loop */}
      <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border border-primary/10 p-6">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-gray-800">Operating Loop Status</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Observe', 'Understand', 'Decide', 'Prepare', 'Verify', 'Review', 'Execute', 'Measure', 'Learn'].map((step, idx) => (
            <div key={step} className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                ${idx < 5 ? 'bg-success-light text-success' : idx === 5 ? 'bg-warning-light text-warning' : 'bg-gray-100 text-gray-500'}`}>
                {step}
              </span>
              {idx < 8 && <span className="text-gray-300">→</span>}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Content pipeline is in <strong>Verify</strong> stage. Sales pipeline is in <strong>Prepare</strong> stage.
        </p>
      </div>
    </div>
  );
}
