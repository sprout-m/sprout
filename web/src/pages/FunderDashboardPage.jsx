import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { investmentsApi } from '../api/client';

export default function FunderDashboardPage() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    investmentsApi.myInvestments()
      .then(setInvestments)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const totalInvested = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>My Investments</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.875rem' }}>
            Track where your capital is creating impact.
          </p>
        </div>
        <Link to="/marketplace">
          <button style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
            Browse Projects →
          </button>
        </Link>
      </div>

      {/* Total summary */}
      {!loading && investments.length > 0 && (
        <div style={{ background: 'var(--surface, #1a2332)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '2rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.2rem' }}>Total Invested</div>
            <div style={{ fontWeight: 700, fontSize: '1.5rem', color: '#4ade80' }}>${totalInvested.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.2rem' }}>Projects Funded</div>
            <div style={{ fontWeight: 700, fontSize: '1.5rem' }}>
              {new Set(investments.map((i) => i.project_id || i.projectId)).size}
            </div>
          </div>
        </div>
      )}

      {loading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}
      {error && <p style={{ color: '#f87171' }}>{error}</p>}

      {!loading && investments.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌱</div>
          <p>You haven't invested in any projects yet. Browse the marketplace.</p>
          <Link to="/marketplace">
            <button style={{ marginTop: '1rem', background: '#16a34a', color: '#fff', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
              Browse Marketplace
            </button>
          </Link>
        </div>
      )}

      <div style={{ display: 'grid', gap: '1rem' }}>
        {investments.map((inv) => {
          const projectId = inv.project_id || inv.projectId;
          const projectName = inv.project?.name || inv.projectName || `Project #${projectId}`;
          const date = inv.created_at || inv.createdAt;
          return (
            <div key={inv.id} style={{ background: 'var(--surface, #1a2332)', border: '1px solid var(--border, rgba(255,255,255,0.08))', borderRadius: '10px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{projectName}</h3>
                  {date && (
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.8125rem' }}>
                      {new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.125rem', color: '#4ade80' }}>
                    ${(inv.amount || 0).toLocaleString()}
                  </div>
                  {inv.hedera_tx_id && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                      TX: {inv.hedera_tx_id.slice(0, 20)}…
                    </div>
                  )}
                </div>
              </div>
              {projectId && (
                <div style={{ marginTop: '0.875rem' }}>
                  <Link to={`/app/projects/${projectId}`} style={{ textDecoration: 'none' }}>
                    <button style={{ background: 'transparent', border: '1px solid var(--border, rgba(255,255,255,0.12))', color: 'var(--muted)', padding: '0.3rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8125rem' }}>
                      View Project
                    </button>
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
