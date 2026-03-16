import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useApp } from './context/AppContext';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FunderDashboardPage from './pages/FunderDashboardPage';
import CreateProjectPage from './pages/CreateProjectPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import OrganizerDashboardPage from './pages/OrganizerDashboardPage';
import ProofSubmissionPage from './pages/ProofSubmissionPage';
import VerifierDashboardPage from './pages/VerifierDashboardPage';
import ApprovalPanelPage from './pages/ApprovalPanelPage';
import AuditTimelinePage from './pages/AuditTimelinePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import MarketplacePage from './pages/MarketplacePage';

function RequireAuth({ children }) {
  const { user, initializing } = useApp();
  const location = useLocation();
  if (initializing) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

function RoleHome() {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  switch (user.role) {
    case 'funder':  return <Navigate to="/app/funder" replace />;
    case 'organizer': return <Navigate to="/app/organizer" replace />;
    case 'verifier':  return <Navigate to="/app/verifier" replace />;
    case 'admin':     return <Navigate to="/app/admin" replace />;
    default:          return <Navigate to="/app/funder" replace />;
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/app"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<RoleHome />} />

          {/* Funder */}
          <Route path="funder" element={<FunderDashboardPage />} />
          <Route path="projects/new" element={<CreateProjectPage />} />

          {/* Shared — all roles */}
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="projects/:id/audit" element={<AuditTimelinePage />} />

          {/* Organizer */}
          <Route path="organizer" element={<OrganizerDashboardPage />} />
          <Route path="milestones/:id/proof" element={<ProofSubmissionPage />} />

          {/* Verifier */}
          <Route path="verifier" element={<VerifierDashboardPage />} />
          <Route path="milestones/:id/review" element={<ApprovalPanelPage />} />

          {/* Admin */}
          <Route path="admin" element={<AdminDashboardPage />} />

          <Route path="*" element={<RoleHome />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
