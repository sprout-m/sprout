import { useEffect, useMemo } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMarket } from '../context/MarketContext';

const roleRoutes = {
  buyer: [
    { to: '/app', label: 'Marketplace' },
    { to: '/app/my-deals', label: 'My Deals' },
    { to: '/app/escrow', label: 'Closing' },
    { to: '/app/messages', label: 'Messages' },
    { to: '/app/profile', label: 'Profile' }
  ],
  seller: [
    { to: '/app/seller/listings', label: 'Listings' },
    { to: '/app/seller/requests', label: 'Access Requests' },
    { to: '/app/seller/offers', label: 'Offers' },
    { to: '/app/escrow', label: 'Closing' },
    { to: '/app/messages', label: 'Messages' },
    { to: '/app/profile', label: 'Profile' }
  ],
  operator: [
    { to: '/app', label: 'Marketplace' },
    { to: '/app/seller/listings', label: 'Listings' },
    { to: '/app/seller/requests', label: 'Access Requests' },
    { to: '/app/seller/offers', label: 'Offers' },
    { to: '/app/escrow', label: 'Closing' },
    { to: '/app/profile', label: 'Profile' }
  ]
};

const roleLanding = {
  buyer: '/app',
  seller: '/app/seller/listings',
  operator: '/app'
};

export default function Layout() {
  const { user, logoutUser } = useMarket();
  const navigate = useNavigate();
  const location = useLocation();

  const role = user?.role || 'buyer';
  const routes = useMemo(() => roleRoutes[role] || roleRoutes.buyer, [role]);

  useEffect(() => {
    if (location.pathname.startsWith('/app/listing/')) return;
    const allowed = routes.some(
      (route) =>
        location.pathname === route.to || location.pathname.startsWith(`${route.to}/`)
    );
    if (!allowed) navigate(roleLanding[role], { replace: true });
  }, [role, location.pathname, navigate, routes]);

  function handleLogout() {
    logoutUser();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="header-inner">
          <div className="brand">
            <Link to="/app">
              <img
                src="/logo.png"
                alt="Meridian Marketplace"
                style={{ height: '52px', width: 'auto', display: 'block', filter: 'brightness(0) invert(1)' }}
              />
            </Link>
          </div>

          <div className="topbar-divider" />

          <nav className="topbar-nav">
            {routes.map((route) => (
              <NavLink
                key={route.to}
                to={route.to}
                end={route.to === '/app'}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                {route.label}
              </NavLink>
            ))}
          </nav>

          <div className="topbar-actions">
            <div className="topbar-user">
              <span className="topbar-user-avatar">
                {(user?.handle || '?').charAt(0).toUpperCase()}
              </span>
              <span className="topbar-user-handle">{user?.handle}</span>
            </div>
            <button
              className="ghost"
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem' }}
              onClick={handleLogout}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="content">
        <div className="content-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
