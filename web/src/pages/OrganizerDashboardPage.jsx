import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { projectsApi } from '../api/client';
import { formatHbarFromAmount, formatUsdEstimateFromHbar } from '../utils/currency';

const statusColor = {
  active:    { bg: 'rgba(22,163,74,0.1)',   text: '#15803d' },
  completed: { bg: 'rgba(99,102,241,0.1)',  text: '#4f46e5' },
  paused:    { bg: 'rgba(245,158,11,0.1)',  text: '#d97706' },
  pending:   { bg: 'rgba(107,114,128,0.1)', text: '#6b7280' },
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
            Manage your projects and submit proof to unlock milestone releases in HBAR.
          </p>
        </div>
        <Link to="/app/projects/new">
          <button>+ New Project</button>
        </Link>
      </div>

      {loading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}
      {error && <p style={{ color: 'var(--danger, #dc2626)' }}>{error}</p>}

      {!loading && projects.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--muted)', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ margin: '0 0 1rem' }}>You haven't created any projects yet.</p>
          <Link to="/app/projects/new">
            <button>Create Your First Project</button>
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
            <div key={p.id} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 600 }}>{p.name}</h3>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.8125rem' }}>{p.category}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ background: colors.bg, color: colors.text, padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}>
                    {p.status}
                  </span>
                  <button className="ghost" onClick={() => navigate(`/app/projects/${p.id}`)}>View</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.8125rem', marginBottom: '0.875rem' }}>
                <div>
                  <div style={{ color: 'var(--muted)', marginBottom: '0.1rem' }}>Funding Goal</div>
                  <strong>{formatUsdEstimateFromHbar(goal)}</strong>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.1rem' }}>{formatHbarFromAmount(goal)}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--muted)', marginBottom: '0.1rem' }}>Funded</div>
                  <strong style={{ color: '#15803d' }}>{formatUsdEstimateFromHbar(funded)}</strong>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.1rem' }}>{formatHbarFromAmount(funded)}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--muted)', marginBottom: '0.1rem' }}>Released</div>
                  <strong style={{ color: '#15803d' }}>{formatUsdEstimateFromHbar(p.amountReleased || 0)}</strong>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.1rem' }}>{formatHbarFromAmount(p.amountReleased || 0)}</div>
                </div>
              </div>

              {goal > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>
                    <span>Funding progress</span>
                    <span>{Math.round(pct)}%</span>
                  </div>
                  <div style={{ background: 'var(--line)', borderRadius: '999px', height: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, background: 'var(--primary)', height: '100%', transition: 'width 0.3s' }} />
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
