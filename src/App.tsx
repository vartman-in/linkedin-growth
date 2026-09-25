import { AppProvider, useApp } from './store';
import Layout from './components/Layout';
import HomePage from './pages/Home';
import ContentPage from './pages/Content';
import LeadsPage from './pages/Leads';
import InboxPage from './pages/Inbox';
import PipelinePage from './pages/Pipeline';
import AnalyticsPage from './pages/Analytics';
import SettingsPage from './pages/Settings';

function AppContent() {
  const { state } = useApp();

  const renderPage = () => {
    switch (state.currentPage) {
      case 'home': return <HomePage />;
      case 'content': return <ContentPage />;
      case 'leads': return <LeadsPage />;
      case 'inbox': return <InboxPage />;
      case 'pipeline': return <PipelinePage />;
      case 'analytics': return <AnalyticsPage />;
      case 'settings': return <SettingsPage />;
      default: return <HomePage />;
    }
  };

  return (
    <Layout>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
