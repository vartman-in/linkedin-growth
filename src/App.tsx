import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './store';
import { AuthProvider } from './auth/AuthContext';
import { WorkspaceProvider } from './workspace/WorkspaceContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import HomePage from './pages/Home';
import BrainPage from './pages/Brain';
import ContentPage from './pages/Content';
import LeadsPage from './pages/Leads';
import InboxPage from './pages/Inbox';
import PipelinePage from './pages/Pipeline';
import AnalyticsPage from './pages/Analytics';
import SettingsPage from './pages/Settings';

function AppContent() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/brain" element={<BrainPage />} />
        <Route path="/content" element={<ContentPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/pipeline" element={<PipelinePage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WorkspaceProvider>
          <AppProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AppContent />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AppProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
