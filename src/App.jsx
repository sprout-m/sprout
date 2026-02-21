import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { useMarket } from './context/MarketContext';
import Layout from './components/Layout';
import EscrowRoomPage from './pages/EscrowRoomPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ListingDetailPage from './pages/ListingDetailPage';
import MarketplacePage from './pages/MarketplacePage';
import MessagesPage from './pages/MessagesPage';
import MyDealsPage from './pages/MyDealsPage';
import ProfilePage from './pages/ProfilePage';
import CreateListingPage from './pages/CreateListingPage';
import SellerListingsPage from './pages/SellerListingsPage';
import SellerOffersBoardPage from './pages/SellerOffersBoardPage';
import SellerRequestsPage from './pages/SellerRequestsPage';
import OperatorDashboardPage from './pages/OperatorDashboardPage';
import OperatorUsersPage from './pages/OperatorUsersPage';
import OperatorListingsPage from './pages/OperatorListingsPage';
import OperatorDisputesPage from './pages/OperatorDisputesPage';

function LegacyListingRedirect() {
  const { listingId } = useParams();
  return <Navigate to={`/app/listing/${listingId}`} replace />;
}

// Redirects to /login when not authenticated; shows a blank screen while the
// session is being restored from localStorage.
function RequireAuth({ children }) {
  const { user, initializing } = useMarket();
  if (initializing) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/listing/:listingId" element={<LegacyListingRedirect />} />
        <Route
          path="/app"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<MarketplacePage />} />
          <Route path="listing/:listingId" element={<ListingDetailPage />} />
          <Route path="my-deals" element={<MyDealsPage />} />
          <Route path="seller/listings" element={<SellerListingsPage />} />
          <Route path="seller/listings/new" element={<CreateListingPage />} />
          <Route path="seller/requests" element={<SellerRequestsPage />} />
          <Route path="seller/offers" element={<SellerOffersBoardPage />} />
          <Route path="escrow" element={<EscrowRoomPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="operator" element={<OperatorDashboardPage />} />
          <Route path="operator/users" element={<OperatorUsersPage />} />
          <Route path="operator/listings" element={<OperatorListingsPage />} />
          <Route path="operator/disputes" element={<OperatorDisputesPage />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
