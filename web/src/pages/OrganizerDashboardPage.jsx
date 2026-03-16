import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { projectsApi } from '../api/client';

const statusColor = {
  active:    { bg: 'rgba(34,197,94,0.15)',   text: '#4ade80' },
  completed: { bg: 'rgba(99,102,241,0.15)',  text: '#818cf8' },
  paused:    { bg: 'rgba(245,158,11,0.15)',  text: '#fbbf24' },
  pending:   { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' },
};

export default function OrganizerDashboardPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    projectsApi.myProjects()
      .then(setProjects)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>My Projects</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            Manage your projects and submit proof to unlock milestone payments.
          </p>
        </div>
        <Link to="/app/projects/new">
          <button style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
            + Create New Project
          </button>
        </Link>
      </div>

      {loading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}
      {error && <p style={{ color: '#f87171' }}>{error}</p>}

      {!loading && projects.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <p>You haven't created any projects yet.</p>
          <Link to="/app/projects/new">
            <button style={{ marginTop: '1rem', background: '#22c55e', color: '#fff', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
              Create Your First Project
            </button>
          </Link>
        </div>
      )}

      <div style={{ display: 'grid', gap: '1rem' }}>
        {projects.map((p) => {
          const colors = statusColor[p.status] || statusColor.pending;
          const funded = p.amountFunded || 0;
          const goal = p.totalAmount || 0;
          const pct = goal > 0 ? Math.min(100, (funded / goal) * 100) : 0;
          return (
            <div key={p.id} style={{ background: 'var(--surface, #1a2332)', border: '1px solid var(--border, rgba(255,255,255,0.08))', borderRadius: '10px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 600 }}>{p.name}</h3>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.8125rem' }}>{p.category}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ background: colors.bg, color: colors.text, padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}>
                    {p.status}
                  </span>
                  <button
                    onClick={() => navigate(`/app/projects/${p.id}`)}
                    style={{ background: 'transparent', border: '1px solid var(--border, rgba(255,255,255,0.12))', color: 'var(--muted)', padding: '0.3rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8125rem' }}
                  >
                    View
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.8125rem', marginBottom: '0.875rem' }}>
                <div>
                  <div style={{ color: 'var(--muted)', marginBottom: '0.1rem' }}>Funding Goal</div>
                  <strong>${goal.toLocaleString()}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--muted)', marginBottom: '0.1rem' }}>Amount Funded</div>
                  <strong style={{ color: '#4ade80' }}>${funded.toLocaleString()}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--muted)', marginBottom: '0.1rem' }}>Released</div>
                  <strong style={{ color: '#22c55e' }}>${(p.amountReleased || 0).toLocaleString()}</strong>
                </div>
              </div>

              {goal > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>
                    <span>Funding progress</span>
                    <span>{Math.round(pct)}%</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '999px', height: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, background: '#22c55e', height: '100%', transition: 'width 0.3s' }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
