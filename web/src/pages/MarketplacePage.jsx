import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi } from '../api/client';
import { useApp } from '../context/AppContext';

const statusColor = {
  active:    { bg: 'rgba(34,197,94,0.15)',   text: '#4ade80' },
  completed: { bg: 'rgba(99,102,241,0.15)',  text: '#818cf8' },
  paused:    { bg: 'rgba(245,158,11,0.15)',  text: '#fbbf24' },
  pending:   { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' },
};

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

export default function MarketplacePage() {
  const { user } = useApp();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    projectsApi.listPublic()
      .then(setProjects)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const projectLink = (id) => user ? `/app/projects/${id}` : `/projects/${id}`;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #0f1923)', color: 'var(--text, #f1f5f9)' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f2d1a 0%, #0f1923 60%)', borderBottom: '1px solid rgba(34,197,94,0.15)', padding: '3rem 1.5rem 2.5rem' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#f1f5f9' }}>
                Sustainability Projects
              </h1>
              <p style={{ margin: '0.5rem 0 0', color: 'var(--muted, #94a3b8)', fontSize: '1rem', maxWidth: '480px' }}>
                Fund real-world impact. Every milestone is verified on-chain before funds are released.
              </p>
            </div>
            {!user && (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Link to="/login">
                  <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#f1f5f9', padding: '0.5rem 1.25rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
                    Sign In
                  </button>
                </Link>
                <Link to="/register">
                  <button style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                    Get Started
                  </button>
                </Link>
              </div>
            )}
            {user && (
              <Link to="/app">
                <button style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                  Go to Dashboard
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {loading && (
          <p style={{ color: 'var(--muted, #94a3b8)', textAlign: 'center', padding: '3rem 0' }}>Loading projects…</p>
        )}

        {error && (
          <p style={{ color: '#f87171', textAlign: 'center', padding: '3rem 0' }}>{error}</p>
        )}

        {!loading && !error && projects.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--muted, #94a3b8)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌱</div>
            <p style={{ fontSize: '1rem' }}>No projects listed yet. Check back soon.</p>
          </div>
        )}

        {!loading && projects.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {projects.map((p) => {
              const colors = statusColor[p.status] || statusColor.pending;
              const funded = p.amountFunded || 0;
              const goal = p.totalAmount || 0;
              const pct = goal > 0 ? Math.min(100, (funded / goal) * 100) : 0;

              return (
                <div
                  key={p.id}
                  style={{
                    background: 'var(--surface, #1a2332)',
                    border: '1px solid var(--border, rgba(255,255,255,0.08))',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  {/* Name + badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, lineHeight: 1.3 }}>{p.name}</h3>
                      {p.category && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted, #94a3b8)', display: 'block', marginTop: '0.2rem' }}>
                          {p.category}
                        </span>
                      )}
                    </div>
                    <span style={{ background: colors.bg, color: colors.text, padding: '0.2rem 0.55rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'capitalize', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {p.status}
                    </span>
                  </div>

                  {/* Description */}
                  {p.description && (
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--muted, #94a3b8)', lineHeight: 1.5 }}>
                      {truncate(p.description, 100)}
                    </p>
                  )}

                  {/* Funding progress */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted, #94a3b8)', marginBottom: '0.3rem' }}>
                      <span style={{ color: '#4ade80', fontWeight: 600 }}>${funded.toLocaleString()} funded</span>
                      <span>of ${goal.toLocaleString()}</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '999px', height: '5px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #16a34a, #22c55e)', height: '100%', transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted, #94a3b8)', marginTop: '0.25rem', textAlign: 'right' }}>
                      {Math.round(pct)}% of goal
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                    <Link to={projectLink(p.id)} style={{ flex: 1, textDecoration: 'none' }}>
                      <button style={{ width: '100%', background: 'transparent', border: '1px solid var(--border, rgba(255,255,255,0.15))', color: '#f1f5f9', padding: '0.45rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500 }}>
                        View Project
                      </button>
                    </Link>
                    {user?.role === 'funder' && p.status === 'active' && (
                      <Link to={projectLink(p.id)} style={{ flex: 1, textDecoration: 'none' }}>
                        <button style={{ width: '100%', background: '#16a34a', color: '#fff', border: 'none', padding: '0.45rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600 }}>
                          Fund this project
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
