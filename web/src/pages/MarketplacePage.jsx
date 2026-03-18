import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '../api/client';

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

export default function MarketplacePage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectsApi.listPublic().then(async (list) => {
      const withMilestones = await Promise.all(
        list.map((p) =>
          projectsApi.get(p.id)
            .then((d) => ({ ...p, milestones: d.milestones || [] }))
            .catch(() => ({ ...p, milestones: [] }))
        )
      );
      setProjects(withMilestones);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.375rem', fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.025em', color: '#0f172a' }}>
          Marketplace
        </h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9375rem' }}>
          Sustainability projects seeking funding. Milestones verified before funds release.
        </p>
      </div>

      {loading && <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Loading…</p>}

      {!loading && projects.length === 0 && (
        <div style={{ padding: '3rem', textAlign: 'center', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <p style={{ margin: 0, color: '#6b7280' }}>No projects listed yet.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {projects.map((p) => {
          const funded = p.amountFunded || 0;
          const goal = p.totalAmount || 0;
          const pct = goal > 0 ? Math.min(100, (funded / goal) * 100) : 0;
          const approved = (p.milestones || []).filter((m) => m.status === 'approved').length;
          const total = (p.milestones || []).length;

          return (
            <div
              key={p.id}
              onClick={() => navigate(`/app/projects/${p.id}`)}
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0',
                cursor: 'pointer',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#14532d';
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ marginBottom: '0.375rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>
                  {p.name}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'capitalize', whiteSpace: 'nowrap', flexShrink: 0, paddingTop: '1px' }}>
                  {p.status || 'pending'}
                </span>
              </div>

              {p.category && (
                <span style={{ fontSize: '0.8125rem', color: '#9ca3af', marginBottom: '0.75rem', display: 'block' }}>
                  {p.category}
                </span>
              )}

              <p style={{ margin: '0 0 1.25rem', fontSize: '0.8125rem', color: '#6b7280', lineHeight: 1.65, flexGrow: 1 }}>
                {truncate(p.description, 120)}
              </p>

              <div style={{ marginTop: 'auto' }}>
                <div style={{ height: '3px', background: '#f3f4f6', borderRadius: '2px', marginBottom: '0.75rem', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: '#14532d', borderRadius: '2px' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#111827' }}>
                      ${funded.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: '#9ca3af' }}> of ${goal.toLocaleString()}</span>
                  </div>
                  {total > 0 && (
                    <span style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>
                      {approved}/{total} milestones
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
