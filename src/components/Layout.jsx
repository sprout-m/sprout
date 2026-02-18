import { useEffect, useMemo } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMarket } from '../context/MarketContext';

const roleRoutes = {
  buyer: [
    { to: '/', label: 'Marketplace' },
    { to: '/my-deals', label: 'My Deals' },
    { to: '/escrow', label: 'Escrow Room' },
    { to: '/messages', label: 'Messages' },
    { to: '/profile', label: 'Profile' }
  ],
  seller: [
    { to: '/seller/listings', label: 'Listings' },
    { to: '/seller/requests', label: 'Access Requests' },
    { to: '/seller/offers', label: 'Offers' },
    { to: '/escrow', label: 'Escrow Room' },
    { to: '/messages', label: 'Messages' },
    { to: '/profile', label: 'Profile' }
  ],
  operator: [
    { to: '/', label: 'Marketplace' },
    { to: '/seller/listings', label: 'Listings' },
    { to: '/seller/requests', label: 'Access Requests' },
    { to: '/seller/offers', label: 'Offers' },
    { to: '/escrow', label: 'Escrow' },
    { to: '/profile', label: 'Profile' }
  ]
};

const roleLanding = {
  buyer: '/',
  seller: '/seller/listings',
  operator: '/'
};

export default function Layout() {
  const { activeUser, setActiveUser, users } = useMarket();
  const navigate = useNavigate();
  const location = useLocation();
  const routes = useMemo(() => roleRoutes[activeUser.role] || roleRoutes.buyer, [activeUser.role]);

  useEffect(() => {
    if (location.pathname.startsWith('/listing/')) return;
    const allowed = routes.some((route) => location.pathname === route.to || location.pathname.startsWith(`${route.to}/`));
    if (!allowed) navigate(roleLanding[activeUser.role], { replace: true });
  }, [activeUser.role, location.pathname, navigate, routes]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="header-inner">
          <div className="brand">
            <Link to="/">
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
