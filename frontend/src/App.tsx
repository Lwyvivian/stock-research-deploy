/** Root component - Route configuration */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import theme from './theme';
import { useAuthStore } from './stores/authStore';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import DataCollectionPage from './pages/DataCollectionPage';
import DocumentAnalysisPage from './pages/DocumentAnalysisPage';
import PeerComparisonPage from './pages/PeerComparisonPage';
import ThesisPage from './pages/ThesisPage';
import ReportPreviewPage from './pages/ReportPreviewPage';

// 占位页面组件（后续逐步实现）
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div style={{ textAlign: 'center', paddingTop: 80 }}>
      <h2>{title}</h2>
      <p style={{ color: '#999' }}>此页面正在开发中...</p>
    </div>
  );
}

/** Route guard — redirects to login if not authenticated */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ConfigProvider theme={theme} locale={enUS}>
      <BrowserRouter>
        <Routes>
          {/* 公开路由 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* 受保护路由 */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<HomePage />} />
            <Route path="/projects/:projectId/data-collection" element={<DataCollectionPage />} />
            <Route path="/projects/:projectId/analysis" element={<DocumentAnalysisPage />} />
            <Route path="/projects/:projectId/peer-comparison" element={<PeerComparisonPage />} />
            <Route path="/projects/:projectId/thesis" element={<ThesisPage />} />
            <Route path="/projects/:projectId/report" element={<ReportPreviewPage />} />
          </Route>

          {/* 兜底 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
