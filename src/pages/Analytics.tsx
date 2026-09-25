import { useApp } from '../store';
import { mockAnalytics } from '../data';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, Users, FileText, MessageSquare,
  Target, ArrowUpRight, ArrowDownRight, Eye
} from 'lucide-react';

export default function AnalyticsPage() {
  const { state } = useApp();
  const data = mockAnalytics;

  const COLORS = ['#0a66c2', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#4f46e5'];

  const contentStats = [
    { label: 'Posts Published', value: data.content.postsPublished, change: '+4', icon: FileText, trend: 'up' },
    { label: 'Avg Engagement', value: data.content.avgEngagement, change: '+12%', icon: TrendingUp, trend: 'up' },
    { label: 'Total Reach', value: `${(data.content.totalReach / 1000).toFixed(1)}K`, change: '+18%', icon: Eye, trend: 'up' },
    { label: 'Content Ideas', value: state.ideas.length, change: '+2', icon: Target, trend: 'up' },
  ];

  const salesStats = [
    { label: 'Prospects Found', value: data.sales.prospectsDiscovered, change: '+8', icon: Users, trend: 'up' },
    { label: 'Qualified', value: data.sales.qualified, change: '+3', icon: Target, trend: 'up' },
    { label: 'Response Rate', value: '60%', change: '+5%', icon: MessageSquare, trend: 'up' },
    { label: 'Meetings', value: data.sales.meetings, change: '+1', icon: ArrowUpRight, trend: 'up' },
  ];

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Track content performance and sales pipeline metrics</p>
      </div>

      {/* Data Source Notice */}
      <div className="bg-primary-light/50 border border-primary/20 rounded-xl p-3 mb-6">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          <p className="text-xs text-gray-700">
            <strong>Data transparency:</strong> Content metrics shown are illustrative. Connect your LinkedIn account for verified platform data. Sales metrics are from internal tracking.
          </p>
        </div>
      </div>

      {/* Content Stats */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Content Performance
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {contentStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 bg-primary-light rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className={`text-xs font-medium flex items-center gap-0.5 ${
                    stat.trend === 'up' ? 'text-success' : 'text-danger'
                  }`}>
                    {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {stat.change}
                  </span>
                </div>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sales Stats */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-accent" />
          Sales Performance
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {salesStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 bg-accent-light rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-accent" />
                  </div>
                  <span className={`text-xs font-medium flex items-center gap-0.5 ${
                    stat.trend === 'up' ? 'text-success' : 'text-danger'
                  }`}>
                    {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {stat.change}
                  </span>
                </div>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        {/* Content Engagement Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h4 className="text-sm font-semibold text-gray-800 mb-4">Weekly Content Engagement</h4>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.content.weeklyPosts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
              />
              <Line type="monotone" dataKey="engagement" stroke="#0a66c2" strokeWidth={2.5} dot={{ fill: '#0a66c2', r: 4 }} />
              <Line type="monotone" dataKey="posts" stroke="#7c3aed" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#7c3aed', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-primary rounded" />
              <span className="text-xs text-gray-500">Engagement</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-accent rounded border-dashed" />
              <span className="text-xs text-gray-500">Posts</span>
            </div>
          </div>
        </div>

        {/* Sales Activity Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h4 className="text-sm font-semibold text-gray-800 mb-4">Weekly Sales Activity</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.sales.weeklyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
              />
              <Bar dataKey="outreach" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="responses" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-accent rounded" />
              <span className="text-xs text-gray-500">Outreach</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-success rounded" />
              <span className="text-xs text-gray-500">Responses</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Distribution & Top Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pipeline Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h4 className="text-sm font-semibold text-gray-800 mb-4">Pipeline Distribution</h4>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie
                  data={data.sales.pipeline}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {data.sales.pipeline.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {data.sales.pipeline.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-xs text-gray-600 flex-1">{item.stage}</span>
                  <span className="text-xs font-semibold text-gray-800">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Performing Content */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h4 className="text-sm font-semibold text-gray-800 mb-4">Top Performing Content</h4>
          <div className="space-y-3">
            {data.content.topPerforming.map((post, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold
                  ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-gray-200 text-gray-600' : 'bg-orange-100 text-orange-600'}`}>
                  #{idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 font-medium truncate">{post.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-500">{post.engagement} engagements</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{(post.reach / 1000).toFixed(1)}K reach</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content ↔ Sales Bridge */}
      <div className="mt-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border border-primary/10 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Content ↔ Sales Intelligence
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/80 rounded-lg p-4 border border-gray-100">
            <p className="text-xs font-medium text-accent mb-2">Sales → Content</p>
            <p className="text-sm text-gray-700">3 prospects recently raised <strong>workflow complexity</strong> as a pain point.</p>
            <p className="text-xs text-gray-500 mt-2 italic">Possible content: "Why AI tool sprawl is often a workflow problem"</p>
          </div>
          <div className="bg-white/80 rounded-lg p-4 border border-gray-100">
            <p className="text-xs font-medium text-primary mb-2">Content → Sales</p>
            <p className="text-sm text-gray-700">Sarah Chen engaged with your post on <strong>context switching</strong>.</p>
            <p className="text-xs text-gray-500 mt-2 italic">Suggested: Reference this shared interest in your next message</p>
          </div>
        </div>
      </div>
    </div>
  );
}
