import { useState } from 'react';
import { useApp } from '../store';
import {
  Search, UserCheck, Target, FileSearch, Send,
  ChevronRight, MapPin, Building2, Users,
  CheckCircle2, XCircle, AlertCircle, HelpCircle,
  Zap, TrendingUp, Clock, ArrowRight, Star
} from 'lucide-react';
import { mockTrends } from '../data';

type LeadsTab = 'discover' | 'research' | 'trends';

export default function LeadsPage() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<LeadsTab>('discover');
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(state.prospects[0]?.id || null);
  const selectedProspect = state.prospects.find(p => p.id === selectedProspectId);

  const tabs = [
    { id: 'discover' as const, label: 'Prospects', icon: Search, count: state.prospects.length },
    { id: 'research' as const, label: 'Research', icon: FileSearch, count: 0 },
    { id: 'trends' as const, label: 'Trend Intelligence', icon: TrendingUp, count: mockTrends.length },
  ];

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Machine</h1>
          <p className="text-gray-500 text-sm mt-1">Research-driven prospecting and relationship building</p>
        </div>
        <button className="flex items-center gap-2 bg-accent text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors shadow-sm">
          <Search className="w-4 h-4" />
          Discover Prospects
        </button>
      </div>

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
          {/* Prospect List */}
          <div className="space-y-2">
            {state.prospects.map(prospect => (
              <button
                key={prospect.id}
                onClick={() => setSelectedProspectId(prospect.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all
                  ${prospect.id === selectedProspectId ? 'border-accent bg-accent-light/50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800">{prospect.name}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{prospect.role} @ {prospect.company}</p>
                  </div>
                  <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    prospect.score >= 90 ? 'bg-success-light text-success' :
                    prospect.score >= 70 ? 'bg-warning-light text-warning' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {prospect.score}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium
                    ${prospect.status === 'responded' ? 'bg-green-100 text-green-700' :
                      prospect.status === 'contacted' ? 'bg-blue-100 text-blue-700' :
                      prospect.status === 'qualified' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-600'}`}>
                    {prospect.status}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Prospect Detail */}
          {selectedProspect && (
            <div className="lg:col-span-2 space-y-4">
              {/* Header */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-accent to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{selectedProspect.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{selectedProspect.name}</h3>
                      <p className="text-sm text-gray-600">{selectedProspect.role} @ {selectedProspect.company}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> {selectedProspect.industry}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Users className="w-3 h-3" /> {selectedProspect.size}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {selectedProspect.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{selectedProspect.score}</div>
                    <div className="text-xs text-gray-500">Fit Score</div>
                  </div>
                </div>
              </div>

              {/* Qualification */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-accent" />
                  Qualification
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: 'ICP Role', value: selectedProspect.qualification.icpRole, type: 'boolean' },
                    { label: 'Industry', value: selectedProspect.qualification.industry, type: 'boolean' },
                    { label: 'Company Size', value: selectedProspect.qualification.companySize, type: 'boolean' },
                    { label: 'Relevant Signal', value: selectedProspect.qualification.signal, type: 'boolean' },
                    { label: 'Recent Activity', value: selectedProspect.qualification.activity, type: 'boolean' },
                    { label: 'Buying Intent', value: selectedProspect.qualification.buyingIntent, type: 'intent' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      {item.type === 'boolean' ? (
                        item.value ? <CheckCircle2 className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-danger" />
                      ) : (
                        item.value === 'known' ? <CheckCircle2 className="w-4 h-4 text-success" /> :
                        item.value === 'inferred' ? <AlertCircle className="w-4 h-4 text-warning" /> :
                        <HelpCircle className="w-4 h-4 text-gray-400" />
                      )}
                      <div>
                        <p className="text-xs text-gray-500">{item.label}</p>
                        <p className="text-xs font-medium text-gray-700 capitalize">
                          {item.type === 'boolean' ? (item.value ? 'Yes' : 'No') : item.value as string}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signals */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-warning" />
                  Signals
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProspect.signals.map((signal, idx) => (
                    <span key={idx} className="text-xs bg-accent-light text-accent px-2.5 py-1.5 rounded-lg font-medium">
                      {signal}
                    </span>
                  ))}
                </div>
              </div>

              {/* Prospect Brief */}
              {selectedProspect.brief && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Prospect Brief
                  </h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-500 mb-1">WHO</p>
                        <p className="text-sm text-gray-700">{selectedProspect.brief.who}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-500 mb-1">WHY THEM</p>
                        <p className="text-sm text-gray-700">{selectedProspect.brief.whyThem}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-500 mb-1">WHY NOW</p>
                        <p className="text-sm text-gray-700">{selectedProspect.brief.whyNow}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-500 mb-1">POSSIBLE VALUE</p>
                        <p className="text-sm text-gray-700">{selectedProspect.brief.possibleValue}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1.5">WHAT WE KNOW</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProspect.brief.whatWeKnow.map((item, idx) => (
                          <span key={idx} className="text-xs bg-success-light text-success px-2 py-1 rounded-md">✓ {item}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1.5">WHAT WE DON'T KNOW</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProspect.brief.whatWeDontKnow.map((item, idx) => (
                          <span key={idx} className="text-xs bg-warning-light text-warning px-2 py-1 rounded-md">? {item}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1.5">RISKS</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProspect.brief.risks.map((item, idx) => (
                          <span key={idx} className="text-xs bg-danger-light text-danger px-2 py-1 rounded-md">⚠ {item}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 bg-accent text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
                  <Send className="w-4 h-4" />
                  Draft Outreach
                </button>
                <button className="flex items-center justify-center gap-2 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  <Star className="w-4 h-4" />
                  Add to Pipeline
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'trends' && <TrendsPanel />}
      {activeTab === 'research' && <ResearchPanel />}
    </div>
  );
}

function TrendsPanel() {
  const freshnessColors = {
    hot: 'bg-red-100 text-red-700',
    warm: 'bg-orange-100 text-orange-700',
    emerging: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="space-y-4">
      <div className="bg-warning-light/50 border border-warning/20 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-warning" />
          <p className="text-sm text-gray-700">
            <strong>Note:</strong> Trends are not content ideas. Each trend needs analysis to determine if it fits your audience and voice.
          </p>
        </div>
      </div>
      {mockTrends.map((trend, idx) => (
        <div key={trend.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all animate-slide-in" style={{ animationDelay: `${idx * 100}ms` }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-base font-semibold text-gray-800">{trend.topic}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${freshnessColors[trend.freshness]}`}>
                  {trend.freshness}
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300" />
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Why this matters</p>
              <p className="text-sm text-gray-700">{trend.whyItMatters}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Audience fit</p>
              <p className="text-sm text-gray-700">{trend.audienceFit}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Possible angles</p>
              <div className="flex flex-wrap gap-1.5">
                {trend.angles.map((angle, i) => (
                  <span key={i} className="text-xs bg-primary-light text-primary px-2 py-1 rounded-md">{angle}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Evidence</p>
              <div className="flex flex-wrap gap-1.5">
                {trend.evidence.map((ev, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">{ev}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
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
