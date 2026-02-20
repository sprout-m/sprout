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
  const { activeUser, setActiveUser, users } = useMarket();
  const navigate = useNavigate();
  const location = useLocation();
  const routes = useMemo(() => roleRoutes[activeUser.role] || roleRoutes.buyer, [activeUser.role]);

  useEffect(() => {
    if (location.pathname.startsWith('/app/listing/')) return;
    const allowed = routes.some((route) => location.pathname === route.to || location.pathname.startsWith(`${route.to}/`));
    if (!allowed) navigate(roleLanding[activeUser.role], { replace: true });
  }, [activeUser.role, location.pathname, navigate, routes]);

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
            <label htmlFor="role-switch">View as</label>
            <select
              id="role-switch"
              value={activeUser.role}
              onChange={(e) => setActiveUser(users[e.target.value])}
            >
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
              <option value="operator">Operator</option>
            </select>
            <div className="topbar-user">
              <span className="topbar-user-avatar">
                {activeUser.handle.charAt(0).toUpperCase()}
              </span>
              <span className="topbar-user-handle">{activeUser.handle}</span>
            </div>
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
