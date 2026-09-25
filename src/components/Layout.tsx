import { ReactNode } from 'react';
import { useApp } from '../store';
import {
  Home, FileText, Users, MessageSquare, GitBranch,
  BarChart3, Settings, Zap, Bell, X
} from 'lucide-react';

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'brain', label: 'Brain', icon: Zap },
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'inbox', label: 'Inbox', icon: MessageSquare },
  { id: 'pipeline', label: 'Pipeline', icon: GitBranch },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { state, dispatch } = useApp();
  const unreadCount = state.conversations.filter(c => c.unread).length;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar flex flex-col shadow-xl">
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-sm">Growth Operator</h1>
              <p className="text-gray-400 text-xs">LinkedIn OS</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = state.currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => dispatch({ type: 'SET_PAGE', page: item.id })}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all text-sm font-medium
                  ${isActive
                    ? 'bg-sidebar-active text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-sidebar-hover'
                  }`}
              >
                <Icon className="w-4.5 h-4.5" />
                <span>{item.label}</span>
                {item.id === 'inbox' && unreadCount > 0 && (
                  <span className="ml-auto bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => dispatch({ type: 'SET_PAGE', page: 'settings' })}
            className="w-full flex items-center gap-3 hover:bg-sidebar-hover rounded-lg p-1 -m-1 transition-colors"
          >
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <Settings className="w-4 h-4 text-gray-300" />
            </div>
            <div className="text-left">
              <p className="text-white text-sm font-medium">Set up profile</p>
              <p className="text-gray-400 text-xs">Configure workspace</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-800">
              {navItems.find(n => n.id === state.currentPage)?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5 text-gray-500" />
              {state.notifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-white text-[10px] rounded-full flex items-center justify-center">
                  {state.notifications.length}
                </span>
              )}
            </button>
            <div className="h-6 w-px bg-gray-200" />
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </header>

        {/* Notifications Bar */}
        {state.notifications.length > 0 && (
          <div className="bg-primary-light border-b border-primary/20 px-6 py-2 flex items-center gap-3">
            <Bell className="w-4 h-4 text-primary" />
            <p className="text-sm text-primary-dark font-medium flex-1">
              {state.notifications[0].message}
            </p>
            <button
              onClick={() => dispatch({ type: 'DISMISS_NOTIFICATION', id: state.notifications[0].id })}
              className="text-primary hover:text-primary-dark"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
