import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '../api/client';

const statusColor = {
  active:    { bg: 'rgba(22,163,74,0.1)',   text: '#15803d' },
  completed: { bg: 'rgba(99,102,241,0.1)',  text: '#4f46e5' },
  paused:    { bg: 'rgba(245,158,11,0.1)',  text: '#d97706' },
  pending:   { bg: 'rgba(107,114,128,0.1)', text: '#6b7280' },
};

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

export default function MarketplacePage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);

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
    }).catch(() => {});
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 700 }}>Marketplace</h1>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.875rem' }}>
          Fund real-world sustainability projects. Milestones are independently verified before funds are released.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {projects.map((p) => {
          const colors = statusColor[p.status] || statusColor.pending;
          const funded = p.amountFunded || 0;
          const goal = p.totalAmount || 0;
          const pct = goal > 0 ? Math.min(100, (funded / goal) * 100) : 0;
          const href = `/app/projects/${p.id}`;

          return (
            <div
              key={p.id}
              onClick={() => navigate(href)}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(20,83,45,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--line)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, lineHeight: 1.3, color: 'var(--text)' }}>{p.name}</h3>
                  {p.category && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginTop: '0.2rem' }}>{p.category}</span>
                  )}
                </div>
                <span style={{ background: colors.bg, color: colors.text, padding: '0.2rem 0.55rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'capitalize', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {p.status}
                </span>
              </div>

              <p style={{ margin: '0 0 0.75rem', fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.55, minHeight: '3.6em' }}>
                {truncate(p.description, 110)}
              </p>

              {p.milestones.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '1rem' }}>
                  {p.milestones.map((m) => {
                    const dot = m.status === 'approved' ? '#15803d'
                      : m.status === 'submitted' ? '#d97706'
                      : 'var(--line-strong)';
                    const textColor = m.status === 'pending' ? 'var(--muted)' : 'var(--text)';
                    return (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.775rem' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dot, flexShrink: 0 }} />
                        <span style={{ color: textColor }}>{m.title}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>${funded.toLocaleString()} raised</span>
                  <span style={{ color: 'var(--muted)' }}>{Math.round(pct)}% of ${goal.toLocaleString()}</span>
                </div>
                <div style={{ position: 'relative', background: 'var(--line)', borderRadius: '999px', height: '5px' }}>
                  <div style={{ width: `${pct}%`, background: 'var(--primary)', height: '100%', borderRadius: '999px', transition: 'width 0.3s' }} />
                  {/* Milestone tick marks */}
                  {p.milestones.length > 1 && (() => {
                    let cumulative = 0;
                    return p.milestones.slice(0, -1).map((m, i) => {
                      cumulative += (m.amount || 0);
                      const tickPct = goal > 0 ? Math.min(100, (cumulative / goal) * 100) : 0;
                      return (
                        <span key={i} style={{
                          position: 'absolute',
                          top: 0,
                          left: `${tickPct}%`,
                          width: '1.5px',
                          height: '5px',
                          background: tickPct <= pct ? 'rgba(255,255,255,0.6)' : 'var(--line-strong)',
                          transform: 'translateX(-50%)',
                        }} />
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
