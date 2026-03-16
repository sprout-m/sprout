import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const sharedRoutes = [
  { to: '/marketplace', label: 'Marketplace' },
];

const roleRoutes = {
  funder: [
    { to: '/app/funder', label: 'My Investments' },
    ...sharedRoutes,
  ],
  organizer: [
    { to: '/app/organizer', label: 'My Projects' },
    { to: '/app/projects/new', label: 'New Project' },
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
            <Link to="/app" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <img src="/sidelogo.png" alt="Sprout" style={{ height: '56px', width: 'auto', filter: 'brightness(0) invert(1)' }} />
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
