import { useState, useEffect } from 'react';
import { useWorkspace } from '../workspace/WorkspaceContext';
import { leadsApi } from '../api/client';
import {
  Search, UserCheck, Target, FileSearch, Send,
  ChevronRight, MapPin, Building2, Users,
  CheckCircle2, XCircle, AlertCircle, HelpCircle,
  Zap, TrendingUp, Clock, ArrowRight, Star, Loader, Plus
} from 'lucide-react';

type LeadsTab = 'discover' | 'research' | 'trends';

export default function LeadsPage() {
  const { activeWorkspace } = useWorkspace();
  const [activeTab, setActiveTab] = useState<LeadsTab>('discover');
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);
  const [showAddLead, setShowAddLead] = useState(false);
  
  // Real data from API
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeWorkspace) {
      loadLeads();
    }
  }, [activeWorkspace]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await leadsApi.getAll();
      setLeads(data);
      if (data.length > 0 && !selectedProspectId) {
        setSelectedProspectId(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leads');
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLead = async (leadData: any) => {
    try {
      setError(null);
      const newLead = await leadsApi.create(leadData);
      setLeads([newLead, ...leads]);
      setShowAddLead(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create lead');
      console.error('Failed to create lead:', err);
    }
  };

  const handleQualifyLead = async (leadId: string) => {
    try {
      setError(null);
      const updatedLead = await leadsApi.qualify(leadId);
      setLeads(leads.map(l => l.id === leadId ? updatedLead : l));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to qualify lead');
      console.error('Failed to qualify lead:', err);
    }
  };

  const selectedProspect = leads.find(p => p.id === selectedProspectId);

  const tabs = [
    { id: 'discover' as const, label: 'Leads', icon: Search, count: leads.length },
    { id: 'research' as const, label: 'Research', icon: FileSearch, count: 0 },
    { id: 'trends' as const, label: 'Trend Intelligence', icon: TrendingUp, count: 0 },
  ];

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
          <h1 className="text-2xl font-bold text-gray-900">Sales Machine</h1>
          <p className="text-gray-500 text-sm mt-1">Research-driven prospecting and relationship building</p>
        </div>
        <button
          onClick={() => setShowAddLead(true)}
          className="flex items-center gap-2 bg-accent text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Lead
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddLead && (
        <AddLeadModal
          onClose={() => setShowAddLead(false)}
          onAdd={handleAddLead}
        />
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
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-accent-light text-accent' : 'bg-gray-200 text-gray-500'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'discover' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Lead List */}
          <div className="space-y-2">
            {leads.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No leads yet</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Add your first lead to start building your sales pipeline.
                </p>
              </div>
            ) : (
              leads.map(prospect => (
                <button
                  key={prospect.id}
                  onClick={() => setSelectedProspectId(prospect.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all
                    ${prospect.id === selectedProspectId ? 'border-accent bg-accent-light/50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800">{prospect.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{prospect.title} @ {prospect.company}</p>
                    </div>
                    <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      (prospect.score || 0) >= 90 ? 'bg-success-light text-success' :
                      (prospect.score || 0) >= 70 ? 'bg-warning-light text-warning' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {prospect.score || 0}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium
                      ${prospect.status === 'RESPONDED' ? 'bg-green-100 text-green-700' :
                        prospect.status === 'CONTACTED' ? 'bg-blue-100 text-blue-700' :
                        prospect.status === 'QUALIFIED' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-600'}`}>
                      {prospect.status}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Lead Detail */}
          {selectedProspect && (
            <div className="lg:col-span-2 space-y-4">
              {/* Header */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-accent to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{selectedProspect.name.split(' ').map((n: string) => n[0]).join('')}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{selectedProspect.name}</h3>
                      <p className="text-sm text-gray-600">{selectedProspect.title} @ {selectedProspect.company}</p>
                      <div className="flex items-center gap-3 mt-2">
                        {selectedProspect.company && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> {selectedProspect.company}
                          </span>
                        )}
                        {selectedProspect.title && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Users className="w-3 h-3" /> {selectedProspect.title}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{selectedProspect.score || 0}</div>
                    <div className="text-xs text-gray-500">Fit Score</div>
                  </div>
                </div>
              </div>

              {/* Qualification */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-accent" />
                  Status
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="text-xs font-medium text-gray-700 capitalize">{selectedProspect.status}</p>
                    </div>
                  </div>
                  {selectedProspect.source && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <Star className="w-4 h-4 text-warning" />
                      <div>
                        <p className="text-xs text-gray-500">Source</p>
                        <p className="text-xs font-medium text-gray-700">{selectedProspect.source}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {selectedProspect.status === 'NEW' && (
                  <button
                    onClick={() => handleQualifyLead(selectedProspect.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-accent text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
                  >
                    <UserCheck className="w-4 h-4" />
                    Qualify Lead
                  </button>
                )}
                <button className="flex items-center justify-center gap-2 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  <Send className="w-4 h-4" />
                  Draft Outreach
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'research' && <ResearchPanel />}
      {activeTab === 'trends' && <TrendsPanel />}
    </div>
  );
}

function AddLeadModal({ onClose, onAdd }: { onClose: () => void; onAdd: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    title: '',
    profileUrl: '',
    source: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Add New Lead</h3>
          <p className="text-sm text-gray-500 mt-1">Enter lead information</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="John Doe"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Company</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({...formData, company: e.target.value})}
              placeholder="Acme Corp"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="CEO, Founder, etc."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">LinkedIn Profile URL</label>
            <input
              type="url"
              value={formData.profileUrl}
              onChange={(e) => setFormData({...formData, profileUrl: e.target.value})}
              placeholder="https://linkedin.com/in/..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Source</label>
            <input
              type="text"
              value={formData.source}
              onChange={(e) => setFormData({...formData, source: e.target.value})}
              placeholder="How did you find this lead?"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors"
            >
              Add Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TrendsPanel() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <TrendingUp className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">No trend intelligence yet</h3>
      <p className="text-sm text-gray-500 max-w-md mx-auto">
        Trend intelligence will become available after configuring your ICP and connecting data sources. The system will then surface relevant topics based on your audience and content pillars.
      </p>
    </div>
  );
}

function ResearchPanel() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Search className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Deep Research Mode</h3>
      <p className="text-sm text-gray-500 max-w-md mx-auto">
        Enter a prospect name, company, or topic to conduct deep research. The system will gather public information, identify signals, and prepare a comprehensive brief.
      </p>
      <div className="mt-6 max-w-md mx-auto">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search for a prospect, company, or topic..."
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />
          <button className="px-4 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors">
            Research
          </button>
        </div>
      </div>
    </div>
  );
}
