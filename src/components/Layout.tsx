import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useWorkspace } from '../workspace/WorkspaceContext';
import WorkspaceSelector from './WorkspaceSelector';
import {
  Home, FileText, Users, MessageSquare, GitBranch,
  BarChart3, Settings, Zap, Bell, LogOut, ChevronDown
} from 'lucide-react';

const navItems = [
  { id: 'home', path: '/home', label: 'Home', icon: Home },
  { id: 'brain', path: '/brain', label: 'Brain', icon: Zap },
  { id: 'content', path: '/content', label: 'Content', icon: FileText },
  { id: 'leads', path: '/leads', label: 'Leads', icon: Users },
  { id: 'inbox', path: '/inbox', label: 'Inbox', icon: MessageSquare },
  { id: 'pipeline', path: '/pipeline', label: 'Pipeline', icon: GitBranch },
  { id: 'analytics', path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', path: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { workspaces, activeWorkspace, setActiveWorkspace, loading: workspaceLoading } = useWorkspace();
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentPage = location.pathname.substring(1) || 'home';

  // Show workspace selector if no active workspace
  if (!workspaceLoading && !activeWorkspace) {
    return <WorkspaceSelector />;
  }

  // Show loading state while workspace is loading
  if (workspaceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar flex flex-col shadow-xl">
        {/* Logo & Workspace Selector */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-white font-bold text-sm">Growth Operator</h1>
              <p className="text-gray-400 text-xs">LinkedIn OS</p>
            </div>
          </div>
          
          {/* Workspace Switcher */}
          {workspaces.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-sidebar-hover rounded-lg text-sm text-white hover:bg-sidebar-active transition-colors"
              >
                <span className="truncate">{activeWorkspace?.name || 'Select Workspace'}</span>
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              </button>
              
              {showWorkspaceDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  {workspaces.map(workspace => (
                    <button
                      key={workspace.id}
                      onClick={() => {
                        setActiveWorkspace(workspace);
                        setShowWorkspaceDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${
                        activeWorkspace?.id === workspace.id ? 'bg-primary-light text-primary font-medium' : 'text-gray-700'
                      }`}
                    >
                      {workspace.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all text-sm font-medium
                  ${isActive
                    ? 'bg-sidebar-active text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-sidebar-hover'
                  }`}
              >
                <Icon className="w-4.5 h-4.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name || 'User'}</p>
              <p className="text-gray-400 text-xs truncate">{user?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-sidebar-hover transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-800">
              {navItems.find(n => n.id === currentPage)?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
