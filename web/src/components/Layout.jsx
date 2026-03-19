import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useWallet } from '../context/WalletContext';

const sharedRoutes = [
  { to: '/app/marketplace', label: 'Marketplace' },
];

const roleRoutes = {
  funder: [
    { to: '/app/funder', label: 'My Investments' },
    { to: '/app/verifier', label: 'Review Queue' },
    ...sharedRoutes,
  ],
  organizer: [
    { to: '/app/organizer', label: 'My Projects' },
    ...sharedRoutes,
  ],
  verifier: [
    { to: '/app/verifier', label: 'Review Queue' },
    ...sharedRoutes,
  ],
  admin: [
    { to: '/app/admin', label: 'Dashboard' },
    ...sharedRoutes,
  ],
};

export default function Layout() {
  const { user, logoutUser } = useApp();
  const { accountId, isConnected, connecting, connect } = useWallet();
  const navigate = useNavigate();
  const role = user?.role || 'funder';
  const routes = roleRoutes[role] || [];

  function handleLogout() {
    logoutUser();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="header-inner">
          <div className="brand">
            <Link to="/app" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', lineHeight: 0 }}>
              <img src="/sproutwithwhitetext.png" alt="Sprout" style={{ height: '120px', width: 'auto' }} />
            </Link>
          </div>

          <div className="topbar-divider" />

          <nav className="topbar-nav">
            {routes.map((route) => (
              <NavLink
                key={route.to}
                to={route.to}
                end={route.to !== '/app/projects/new'}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                {route.label}
              </NavLink>
            ))}
          </nav>

          <div className="topbar-actions">
            <div className="topbar-wallet">
              {isConnected ? (
                <div className="topbar-wallet-chip">
                  <span className="topbar-wallet-dot" />
                  <span>Hedera</span>
                  <code>{accountId.slice(0, 8)}...{accountId.slice(-4)}</code>
                </div>
              ) : (
                <button className="ghost" onClick={connect} disabled={connecting}>
                  {connecting ? 'Opening HashPack…' : 'Connect Hedera'}
                </button>
              )}
            </div>
            <div className="topbar-user-menu">
              <div className="topbar-user">
                <span className="topbar-user-avatar">
                  {(user?.handle || '?').charAt(0).toUpperCase()}
                </span>
                <span className="topbar-user-handle">{user?.handle}</span>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginLeft: '0.25rem' }}>
                  {role}
                </span>
              </div>
              <div className="topbar-user-dropdown">
                <button className="ghost" onClick={handleLogout}>Sign out</button>
              </div>
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
