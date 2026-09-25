import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../api/client';
import { useAuth } from '../auth/AuthContext';

interface Workspace {
  id: string;
  name: string;
  role: string;
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  loading: boolean;
  setActiveWorkspace: (workspace: Workspace) => void;
  createWorkspace: (name: string) => Promise<Workspace>;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const loadWorkspaces = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      const wsList = await authApi.workspaces();
      setWorkspaces(wsList);
      
      // Restore active workspace from localStorage or use first workspace
      const storedWorkspaceId = localStorage.getItem('active_workspace_id');
      const storedWorkspace = wsList.find(w => w.id === storedWorkspaceId);
      
      if (storedWorkspace) {
        setActiveWorkspaceState(storedWorkspace);
      } else if (wsList.length > 0) {
        setActiveWorkspaceState(wsList[0]);
        localStorage.setItem('active_workspace_id', wsList[0].id);
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, [isAuthenticated]);

  const setActiveWorkspace = (workspace: Workspace) => {
    setActiveWorkspaceState(workspace);
    localStorage.setItem('active_workspace_id', workspace.id);
  };

  const createWorkspace = async (name: string): Promise<Workspace> => {
    const newWorkspace = await authApi.createWorkspace(name);
    const workspace: Workspace = {
      id: newWorkspace.id,
      name: newWorkspace.name,
      role: 'OWNER'
    };
    setWorkspaces(prev => [...prev, workspace]);
    setActiveWorkspace(workspace);
    return workspace;
  };

  const refreshWorkspaces = async () => {
    await loadWorkspaces();
  };

  return (
    <WorkspaceContext.Provider value={{
      workspaces,
      activeWorkspace,
      loading,
      setActiveWorkspace,
      createWorkspace,
      refreshWorkspaces
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
