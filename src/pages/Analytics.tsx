import { useApp } from '../store';
import { Eye, FileText, Users, MessageSquare, Target, ArrowUpRight } from 'lucide-react';

export default function AnalyticsPage() {
  const { state } = useApp();

  const hasContent = state.ideas.length > 0 || state.drafts.length > 0;
  const hasProspects = state.prospects.length > 0;
  const hasPublished = state.drafts.some(d => d.status === 'approved');

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Track content performance and sales pipeline metrics</p>
      </div>

      {/* Unavailable State */}
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Eye className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No analytics available yet</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
          Analytics require a connected LinkedIn account and published content. Once connected, real engagement data will appear here.
        </p>
        <div className="space-y-3 max-w-sm mx-auto text-left">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[10px] font-bold text-gray-500">1</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Connect LinkedIn</p>
              <p className="text-xs text-gray-500">Required for post analytics and engagement data</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[10px] font-bold text-gray-500">2</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Publish content</p>
              <p className="text-xs text-gray-500">Analytics appear after your first published post</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[10px] font-bold text-gray-500">3</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Wait for data</p>
              <p className="text-xs text-gray-500">Metrics update periodically from LinkedIn</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Source Notice */}
      <div className="mt-6 bg-primary-light/50 border border-primary/20 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          <p className="text-xs text-gray-700">
            <strong>Data transparency:</strong> When analytics become available, every metric will show its provenance — whether it comes from verified LinkedIn data, internal tracking, user-entered data, or is an estimate. No metric will ever be fabricated.
          </p>
        </div>
      </div>

      {/* What will appear */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Content Analytics (coming soon)
          </h4>
          <div className="space-y-2">
            {[
              'Posts published',
              'Average engagement',
              'Total reach',
              'Top performing content',
              'Weekly trends'
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-600">{item}</span>
                <span className="text-xs text-gray-400">Unavailable</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-accent" />
            Sales Analytics (coming soon)
          </h4>
          <div className="space-y-2">
            {[
              'Prospects discovered',
              'Qualified prospects',
              'Response rate',
              'Meetings booked',
              'Pipeline distribution'
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-600">{item}</span>
                <span className="text-xs text-gray-400">Unavailable</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
