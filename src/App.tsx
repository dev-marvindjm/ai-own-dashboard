import { Routes, Route, Navigate } from 'react-router';
import { AppLayout } from './components/layout/AppLayout';
import ExplorePage from './pages/ExplorePage';
import DashboardPage from './pages/DashboardPage';
import TemplatesPage from './pages/TemplatesPage';
import BrokersPage from './pages/BrokersPage';
import MessagesPage from './pages/MessagesPage';
import ProvidersPage from './pages/ProvidersPage';
import TokensPage from './pages/TokensPage';
import GoalsPage from './pages/GoalsPage';
import ChallengesPage from './pages/ChallengesPage';
import FundsPage from './pages/FundsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import GetStartedPage from './pages/GetStartedPage';
import TradingStrategyPage from './pages/TradingStrategyPage';
import TemplateConfigPage from './pages/TemplateConfigPage';
import TemplateBrokersPage from './pages/TemplateBrokersPage';
import NotificationsPage from './pages/NotificationsPage';

function ProtectedLayout() {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return <Navigate to="/get-started" replace />;
  }
  return <AppLayout />;
}

export function App() {
  return (
    <Routes>
      {/* Public Onboarding, Tutorial, Login & Register */}
      <Route path="/get-started" element={<GetStartedPage />} />
      <Route path="/login" element={<GetStartedPage />} />
      <Route path="/register" element={<GetStartedPage />} />
      <Route path="/login-simple" element={<LoginPage />} />

      {/* Protected App Routes */}
      <Route element={<ProtectedLayout />}>
        {/* Explore Hub */}
        <Route path="/" element={<ExplorePage />} />
        <Route path="/explore" element={<ExplorePage />} />

        {/* Dashboard Analytics & OpsPulse */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Trading Operations / Templates */}
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/template-config" element={<TemplateConfigPage />} />
        <Route path="/template-brokers" element={<TemplateBrokersPage />} />
        <Route path="/template-strategy" element={<Navigate to="/template-brokers" replace />} />
        <Route path="/trading-strategy" element={<TradingStrategyPage />} />
        <Route path="/signals-setups" element={<TemplatesPage />} />

        {/* Brokers */}
        <Route path="/brokers" element={<BrokersPage />} />

        {/* Messages */}
        <Route path="/telegram" element={<MessagesPage network="Telegram" />} />
        <Route path="/telegram-messages" element={<MessagesPage network="Telegram" />} />
        <Route path="/whatsapp" element={<MessagesPage network="WhatsApp" />} />
        <Route path="/whatsapp-messages" element={<MessagesPage network="WhatsApp" />} />

        {/* Providers & Senders */}
        <Route path="/providers" element={<ProvidersPage />} />
        <Route path="/senders" element={<ProvidersPage />} />

        {/* Tokens & NLP Lexer */}
        <Route path="/token" element={<TokensPage />} />
        <Route path="/tokens" element={<TokensPage />} />

        {/* Goals, Challenges & Funds */}
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/challenges" element={<ChallengesPage />} />
        <Route path="/funds" element={<FundsPage />} />

        {/* Notifications Hub */}
        <Route path="/notifications" element={<NotificationsPage />} />

        {/* Settings */}
        <Route path="/settings" element={<SettingsPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
