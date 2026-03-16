import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '../api/client';

export default function VerifierDashboardPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectsApi.list()
      .then(setProjects)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // For each project, we'll show those with milestones needing review
  const activeProjects = projects.filter((p) => p.status === 'active');

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Review Queue</h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Review submitted proof and approve or reject milestone payouts.
      </p>

      {loading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}

      {!loading && activeProjects.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <p>No active projects to review right now.</p>
        </div>
      )}

      <div style={{ display: 'grid', gap: '1rem' }}>
        {activeProjects.map((p) => (
          <div key={p.id} style={{ background: 'var(--surface, #1a2332)', border: '1px solid var(--border, rgba(255,255,255,0.08))', borderRadius: '10px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 600 }}>{p.name}</h3>
                <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.8125rem' }}>{p.category}</p>
              </div>
              <button
                onClick={() => navigate(`/app/projects/${p.id}`)}
                style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
              >
                View Milestones
              </button>
            </div>
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1.5rem', fontSize: '0.8125rem', color: 'var(--muted)' }}>
              <span>Total: <strong style={{ color: 'inherit' }}>${(p.totalAmount || 0).toLocaleString()}</strong></span>
              <span>Released: <strong style={{ color: '#4ade80' }}>${(p.amountReleased || 0).toLocaleString()}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
