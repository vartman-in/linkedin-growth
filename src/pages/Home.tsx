import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useWorkspace } from '../workspace/WorkspaceContext';
import { profileApi, icpApi, contentIdeasApi, contentDraftsApi, leadsApi, conversationsApi, pipelineApi } from '../api/client';
import {
  FileText, Users, MessageSquare, ArrowRight,
  CheckCircle2, Lightbulb, Target, Settings,
  Zap, User, Link2, Loader
} from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [icps, setIcps] = useState<any[]>([]);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [activeWorkspace]);

  const loadData = async () => {
    if (!activeWorkspace) return;
    
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [profileData, icpsData, ideasData, draftsData, leadsData, conversationsData, opportunitiesData] = await Promise.allSettled([
        profileApi.getMe(),
        icpApi.getAll(),
        contentIdeasApi.getAll(),
        contentDraftsApi.getAll(),
        leadsApi.getAll(),
        conversationsApi.getAll(),
        pipelineApi.getAll()
      ]);

      setProfile(profileData.status === 'fulfilled' ? profileData.value : null);
      setIcps(icpsData.status === 'fulfilled' ? icpsData.value : []);
      setIdeas(ideasData.status === 'fulfilled' ? ideasData.value : []);
      setDrafts(draftsData.status === 'fulfilled' ? draftsData.value : []);
      setLeads(leadsData.status === 'fulfilled' ? leadsData.value : []);
      setConversations(conversationsData.status === 'fulfilled' ? conversationsData.value : []);
      setOpportunities(opportunitiesData.status === 'fulfilled' ? opportunitiesData.value : []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasProfile = profile && (profile.display_name || profile.headline);
  const hasICP = icps.length > 0;
  const hasContent = ideas.length > 0;
  const hasLeads = leads.length > 0;
  const hasConversations = conversations.length > 0;

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
      action: () => navigate('/settings')
    },
    {
      id: 'icp',
      title: 'Define your ICP',
      reason: 'Your Ideal Customer Profile guides prospect discovery and content targeting.',
      icon: Target,
      color: 'text-accent',
      bg: 'bg-accent-light',
      done: hasICP,
      action: () => navigate('/settings')
    },
    {
      id: 'content',
      title: 'Create your first content idea',
      reason: 'Start with an idea, URL, or experience to generate your first draft.',
      icon: FileText,
      color: 'text-success',
      bg: 'bg-success-light',
      done: hasContent,
      action: () => navigate('/content')
    }
  ];

  // Real workspace status counts
  const draftsForReview = drafts.filter((d: any) => d.status === 'IN_REVIEW').length;
  const unreadConversations = conversations.filter((c: any) => c.unread).length;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome to Growth Operator</h1>
        <p className="text-gray-500 mt-1">
          {user?.name ? `Hello, ${user.name}! ` : ''}Complete your workspace setup to start building your LinkedIn growth system.
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
                <span className="text-sm font-semibold text-gray-900">{ideas.length}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm text-gray-700">Drafts ready for review</span>
                <span className="text-sm font-semibold text-gray-900">{draftsForReview}</span>
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
          {hasLeads ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm text-gray-700">Leads</span>
                <span className="text-sm font-semibold text-gray-900">{leads.length}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm text-gray-700">Opportunities</span>
                <span className="text-sm font-semibold text-gray-900">{opportunities.length}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No leads yet. Configure your ICP to discover relevant prospects.</p>
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
                <span className="text-sm font-semibold text-gray-900">{conversations.length}</span>
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
            <span className="text-xs text-gray-500">Configured on server — required for content generation</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          LinkedIn integration will be available in a future phase. The AI provider is configured on the backend.
        </p>
      </div>
    </div>
  );
}
