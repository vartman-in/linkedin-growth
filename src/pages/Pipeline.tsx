import { useApp } from '../store';
import {
  GitBranch, ArrowRight, User, Building2,
  Clock, CheckCircle2, AlertCircle, TrendingUp
} from 'lucide-react';

const pipelineStages = [
  { id: 'discovered', label: 'Discovered', color: 'bg-gray-100 border-gray-200' },
  { id: 'researched', label: 'Researched', color: 'bg-blue-50 border-blue-200' },
  { id: 'qualified', label: 'Qualified', color: 'bg-purple-50 border-purple-200' },
  { id: 'contacted', label: 'Contacted', color: 'bg-indigo-50 border-indigo-200' },
  { id: 'responded', label: 'Responded', color: 'bg-cyan-50 border-cyan-200' },
  { id: 'conversation', label: 'Conversation', color: 'bg-teal-50 border-teal-200' },
  { id: 'meeting', label: 'Meeting', color: 'bg-green-50 border-green-200' },
  { id: 'opportunity', label: 'Opportunity', color: 'bg-amber-50 border-amber-200' },
];

export default function PipelinePage() {
  const { state } = useApp();

  const getProspectsByStage = (stage: string) => {
    return state.prospects.filter(p => p.status === stage);
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
        <p className="text-gray-500 text-sm mt-1">Track prospects through your sales pipeline</p>
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mb-6">
        {pipelineStages.map(stage => {
          const count = getProspectsByStage(stage.id).length;
          return (
            <div key={stage.id} className={`rounded-xl border p-3 text-center ${stage.color}`}>
              <p className="text-lg font-bold text-gray-800">{count}</p>
              <p className="text-xs text-gray-500 font-medium">{stage.label}</p>
            </div>
          );
        })}
      </div>

      {/* Pipeline Flow Visual */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-primary" />
          Pipeline Flow
        </h3>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {pipelineStages.map((stage, idx) => {
            const count = getProspectsByStage(stage.id).length;
            const isActive = count > 0;
            return (
              <div key={stage.id} className="flex items-center">
                <div className={`flex flex-col items-center px-3 py-2 rounded-lg min-w-[80px] transition-all
                  ${isActive ? 'bg-primary-light border border-primary/20' : 'bg-gray-50 border border-gray-100'}`}>
                  <span className={`text-sm font-bold ${isActive ? 'text-primary' : 'text-gray-400'}`}>{count}</span>
                  <span className={`text-[10px] font-medium text-center ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                    {stage.label}
                  </span>
                </div>
                {idx < pipelineStages.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-gray-300 mx-0.5 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {pipelineStages.filter(s => getProspectsByStage(s.id).length > 0 || s.id === 'discovered' || s.id === 'qualified' || s.id === 'contacted' || s.id === 'responded').map(stage => {
          const prospects = getProspectsByStage(stage.id);
          return (
            <div key={stage.id} className={`rounded-xl border-2 border-dashed p-3 min-h-[200px] ${stage.color}`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{stage.label}</h4>
                <span className="text-xs font-bold text-gray-500 bg-white px-1.5 py-0.5 rounded">{prospects.length}</span>
              </div>
              <div className="space-y-2">
                {prospects.map(prospect => (
                  <div key={prospect.id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                          <span className="text-white text-[10px] font-bold">
                            {prospect.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-800">{prospect.name}</p>
                          <p className="text-[10px] text-gray-500">{prospect.role}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        prospect.score >= 90 ? 'bg-success-light text-success' :
                        prospect.score >= 70 ? 'bg-warning-light text-warning' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {prospect.score}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3 h-3 text-gray-400" />
                      <span className="text-[10px] text-gray-500">{prospect.company}</span>
                    </div>
                    {prospect.signals.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {prospect.signals.slice(0, 2).map((signal, idx) => (
                          <span key={idx} className="text-[9px] bg-accent-light text-accent px-1.5 py-0.5 rounded">
                            {signal}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {prospects.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-xs text-gray-400">No prospects</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity Log */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          Recent Activity
        </h3>
        <div className="space-y-3">
          {[
            { action: 'Sarah Chen moved to Responded', time: '2 hours ago', type: 'success' },
            { action: 'Priya Patel qualified — score: 95', time: '5 hours ago', type: 'info' },
            { action: 'Marcus Johnson contacted', time: '1 day ago', type: 'info' },
            { action: 'James Wilson discovered', time: '2 days ago', type: 'info' },
          ].map((activity, idx) => (
            <div key={idx} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className={`w-2 h-2 rounded-full ${
                activity.type === 'success' ? 'bg-success' : 'bg-primary'
              }`} />
              <p className="text-sm text-gray-700 flex-1">{activity.action}</p>
              <span className="text-xs text-gray-400">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
