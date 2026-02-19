import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import EscrowRoomPage from './pages/EscrowRoomPage';
import LandingPage from './pages/LandingPage';
import OnboardingPage from './pages/OnboardingPage';
import ListingDetailPage from './pages/ListingDetailPage';
import MarketplacePage from './pages/MarketplacePage';
import MessagesPage from './pages/MessagesPage';
import MyDealsPage from './pages/MyDealsPage';
import ProfilePage from './pages/ProfilePage';
import SellerListingsPage from './pages/SellerListingsPage';
import SellerOffersBoardPage from './pages/SellerOffersBoardPage';
import SellerRequestsPage from './pages/SellerRequestsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/app" element={<Layout />}>
          <Route index element={<MarketplacePage />} />
          <Route path="listing/:listingId" element={<ListingDetailPage />} />
          <Route path="my-deals" element={<MyDealsPage />} />
          <Route path="seller/listings" element={<SellerListingsPage />} />
          <Route path="seller/requests" element={<SellerRequestsPage />} />
          <Route path="seller/offers" element={<SellerOffersBoardPage />} />
          <Route path="escrow" element={<EscrowRoomPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
