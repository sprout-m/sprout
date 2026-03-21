import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '../api/client';
import { formatHbarFromAmount, formatUsdEstimateFromHbar } from '../utils/currency';

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
        <h1 style={{ margin: '0 0 0.375rem', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a' }}>
          Marketplace
        </h1>
        <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem', maxWidth: '760px', lineHeight: 1.6 }}>
          Sustainability projects seeking funding. Milestones verified before funds release.
        </p>
      </div>

      {loading && <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Loading…</p>}

      {!loading && projects.length === 0 && (
        <div style={{ padding: '3rem', textAlign: 'center', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <p style={{ margin: 0, color: '#6b7280' }}>No projects listed yet.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', alignItems: 'stretch' }}>
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
                background: '#ffffff',
                border: '1px solid #d7dee7',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '320px',
                gap: '0',
                cursor: 'pointer',
                transition: 'transform 0.15s, border-color 0.15s, box-shadow 0.15s',
                height: '100%',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 20px rgba(15, 23, 42, 0.04)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#94a3b8';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(15, 23, 42, 0.06), 0 16px 30px rgba(15, 23, 42, 0.06)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#d7dee7';
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 20px rgba(15, 23, 42, 0.04)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', minHeight: '2.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {p.name}
                </h3>
                <span style={{
                  fontSize: '0.72rem',
                  color: p.status === 'active' ? '#14532d' : '#334155',
                  background: p.status === 'active' ? '#ecfdf5' : '#f1f5f9',
                  border: p.status === 'active' ? '1px solid #bbf7d0' : '1px solid #dbe4ee',
                  textTransform: 'capitalize',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  padding: '0.18rem 0.48rem',
                  borderRadius: '999px',
                  fontWeight: 600,
                }}>
                  {p.status || 'pending'}
                </span>
              </div>

              <div style={{ minHeight: '1.25rem', marginBottom: '0.75rem' }}>
                {p.category && (
                  <span style={{ fontSize: '0.76rem', color: '#64748b', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {p.category}
                  </span>
                )}
              </div>

              <p style={{ margin: '0 0 1.25rem', fontSize: '0.84rem', color: '#475569', lineHeight: 1.65, flexGrow: 1, minHeight: '5.25rem', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {truncate(p.description, 120)}
              </p>

              <div style={{ marginTop: 'auto', paddingTop: '0.9rem', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.45rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Funding Progress</span>
                  <span style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 600 }}>{Math.round(pct)}%</span>
                </div>
                <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '999px', marginBottom: '0.85rem', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: '#166534', borderRadius: '999px' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                      {formatUsdEstimateFromHbar(funded)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.18rem', lineHeight: 1.4 }}>
                      {formatHbarFromAmount(funded)} funded
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>
                      Target {formatHbarFromAmount(goal)}
                    </div>
                  </div>
                  {total > 0 && (
                    <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
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
