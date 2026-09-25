import { useApp } from '../store';
import {
  FileText, Users, MessageSquare, ArrowRight,
  CheckCircle2, Lightbulb, Target, Settings,
  Zap, User, Link2
} from 'lucide-react';

export default function HomePage() {
  const { state, dispatch } = useApp();

  const hasProfile = state.voiceProfile.tone.length > 0;
  const hasICP = state.icp.roles.length > 0;
  const hasPillars = state.pillars.length > 0;
  const hasContent = state.ideas.length > 0;
  const hasProspects = state.prospects.length > 0;
  const hasConversations = state.conversations.length > 0;

  // Setup actions - only show what's actually needed
  const setupActions = [
    {
      id: 'profile',
      title: 'Complete your profile',
      reason: 'Your voice, tone, and expertise guide all content generation.',
      icon: User,
      color: 'text-primary',
      bg: 'bg-primary-light',
      done: hasProfile,
      action: () => dispatch({ type: 'SET_PAGE', page: 'settings' })
    },
    {
      id: 'icp',
      title: 'Define your ICP',
      reason: 'Your Ideal Customer Profile guides prospect discovery and content targeting.',
      icon: Target,
      color: 'text-accent',
      bg: 'bg-accent-light',
      done: hasICP,
      action: () => dispatch({ type: 'SET_PAGE', page: 'settings' })
    },
    {
      id: 'pillars',
      title: 'Set content pillars',
      reason: 'Pillars define your content themes and keep your messaging focused.',
      icon: Lightbulb,
      color: 'text-warning',
      bg: 'bg-warning-light',
      done: hasPillars,
      action: () => dispatch({ type: 'SET_PAGE', page: 'settings' })
    },
    {
      id: 'content',
      title: 'Create your first content idea',
      reason: 'Start with an idea, URL, or experience to generate your first draft.',
      icon: FileText,
      color: 'text-success',
      bg: 'bg-success-light',
      done: hasContent,
      action: () => dispatch({ type: 'SET_PAGE', page: 'content' })
    }
  ];

  // Real workspace status counts
  const contentReady = state.drafts.filter(d => d.status === 'review').length;
  const unreadConversations = state.conversations.filter(c => c.unread).length;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome to Growth Operator</h1>
        <p className="text-gray-500 mt-1">
          Complete your workspace setup to start building your LinkedIn growth system.
        </p>
      </div>

      {/* Workspace Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-primary-light rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-gray-800">Content</h3>
          </div>
          {hasContent ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm text-gray-700">Ideas</span>
                <span className="text-sm font-semibold text-gray-900">{state.ideas.length}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm text-gray-700">Drafts ready for review</span>
                <span className="text-sm font-semibold text-gray-900">{contentReady}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No content yet. Create your first idea to get started.</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-accent-light rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-accent" />
            </div>
            <h3 className="font-semibold text-gray-800">Sales</h3>
          </div>
          {hasProspects ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm text-gray-700">Prospects</span>
                <span className="text-sm font-semibold text-gray-900">{state.prospects.length}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm text-gray-700">Unread conversations</span>
                <span className="text-sm font-semibold text-gray-900">{unreadConversations}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No prospects yet. Configure your ICP to discover relevant prospects.</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-warning-light rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-warning" />
            </div>
            <h3 className="font-semibold text-gray-800">Inbox</h3>
          </div>
          {hasConversations ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm text-gray-700">Conversations</span>
                <span className="text-sm font-semibold text-gray-900">{state.conversations.length}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm text-gray-700">Unread</span>
                <span className="text-sm font-semibold text-gray-900">{unreadConversations}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No conversations yet. Connect LinkedIn to monitor messages.</p>
          )}
        </div>
      </div>

      {/* Setup Actions */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-gray-800">Workspace Setup</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {setupActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.action}
                className={`bg-white rounded-xl border p-4 text-left hover:shadow-md transition-all group ${
                  action.done ? 'border-success/30 bg-success-light/30' : 'border-gray-200 hover:border-primary/30'
                }`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 ${action.bg} rounded-lg flex items-center justify-center shrink-0`}>
                    {action.done ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-success" />
                    ) : (
                      <Icon className={`w-4.5 h-4.5 ${action.color}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-semibold group-hover:text-primary transition-colors ${
                      action.done ? 'text-success' : 'text-gray-800'
                    }`}>
                      {action.done ? '✓ ' : ''}{action.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{action.reason}</p>
                  </div>
                  {!action.done && (
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Integration Status */}
      <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border border-primary/10 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Link2 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-gray-800">Integrations</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="text-sm text-gray-700">LinkedIn</span>
            </div>
            <span className="text-xs text-gray-500">Not connected — required for publishing and analytics</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="text-sm text-gray-700">AI Provider</span>
            </div>
            <span className="text-xs text-gray-500">Not configured — required for content generation</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Integrations will be available in a future phase. For now, you can configure your profile, ICP, and content pillars.
        </p>
      </div>
    </div>
  );
}
