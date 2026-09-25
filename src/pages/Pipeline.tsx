import { useState, useEffect } from 'react';
import { useWorkspace } from '../workspace/WorkspaceContext';
import { pipelineApi } from '../api/client';
import {
  GitBranch, ArrowRight, User, Building2,
  Clock, CheckCircle2, AlertCircle, TrendingUp, Loader
} from 'lucide-react';

const pipelineStages = [
  { id: 'DISCOVERED', label: 'Discovered', color: 'bg-gray-100 border-gray-200' },
  { id: 'QUALIFIED', label: 'Qualified', color: 'bg-blue-50 border-blue-200' },
  { id: 'PROPOSAL', label: 'Proposal', color: 'bg-purple-50 border-purple-200' },
  { id: 'NEGOTIATION', label: 'Negotiation', color: 'bg-indigo-50 border-indigo-200' },
  { id: 'WON', label: 'Won', color: 'bg-green-50 border-green-200' },
  { id: 'LOST', label: 'Lost', color: 'bg-red-50 border-red-200' },
];

export default function PipelinePage() {
  const { activeWorkspace } = useWorkspace();
  
  // Real data from API
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeWorkspace) {
      loadOpportunities();
    }
  }, [activeWorkspace]);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pipelineApi.getAll();
      setOpportunities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pipeline');
      console.error('Failed to load pipeline:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = async (opportunityId: string, newStage: string) => {
    try {
      setError(null);
      await pipelineApi.updateStage(opportunityId, newStage);
      await loadOpportunities(); // Reload to get fresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stage');
      console.error('Failed to update stage:', err);
    }
  };

  const getOpportunitiesByStage = (stage: string) => {
    return opportunities.filter(o => o.stage === stage);
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
        <p className="text-gray-500 text-sm mt-1">Track opportunities through your sales pipeline</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Pipeline Summary */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
        {pipelineStages.map(stage => {
          const count = getOpportunitiesByStage(stage.id).length;
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
            const count = getOpportunitiesByStage(stage.id).length;
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
      {opportunities.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GitBranch className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No opportunities yet</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Opportunities will appear here when you qualify leads and move them through your sales pipeline.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pipelineStages.filter(s => getOpportunitiesByStage(s.id).length > 0).map(stage => {
            const stageOpportunities = getOpportunitiesByStage(stage.id);
            return (
              <div key={stage.id} className={`rounded-xl border-2 border-dashed p-3 min-h-[200px] ${stage.color}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{stage.label}</h4>
                  <span className="text-xs font-bold text-gray-500 bg-white px-1.5 py-0.5 rounded">{stageOpportunities.length}</span>
                </div>
                <div className="space-y-2">
                  {stageOpportunities.map(opportunity => (
                    <div key={opportunity.id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-xs font-semibold text-gray-800">Opportunity</p>
                          {opportunity.value && (
                            <p className="text-lg font-bold text-gray-900 mt-1">
                              ${opportunity.value.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      {opportunity.source && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <TrendingUp className="w-3 h-3 text-gray-400" />
                          <span className="text-[10px] text-gray-500">{opportunity.source}</span>
                        </div>
                      )}
                      <div className="flex gap-1 mt-3">
                        {pipelineStages.map((nextStage, idx) => {
                          const currentStageIdx = pipelineStages.findIndex(s => s.id === opportunity.stage);
                          if (idx <= currentStageIdx) return null;
                          return (
                            <button
                              key={nextStage.id}
                              onClick={() => handleStageChange(opportunity.id, nextStage.id)}
                              className="flex-1 text-[10px] px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-primary hover:text-white transition-colors"
                              title={`Move to ${nextStage.label}`}
                            >
                              → {nextStage.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Activity Log */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          Recent Activity
        </h3>
        {opportunities.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No activity yet. Activity will appear as you manage opportunities.</p>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">Activity tracking will be available in a future phase.</p>
        )}
      </div>
    </div>
  );
}
