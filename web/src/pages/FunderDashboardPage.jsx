import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { investmentsApi } from '../api/client';

export default function FunderDashboardPage() {
  const navigate = useNavigate();
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
  const projectCount = new Set(investments.map((i) => i.project_id || i.projectId)).size;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>My Investments</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.875rem' }}>
            Track where your capital is creating impact.
          </p>
        </div>
        <Link to="/app/marketplace">
          <button>Browse Projects →</button>
        </Link>
      </div>

      {!loading && investments.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '1.1rem 1.25rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>${totalInvested.toLocaleString()}</div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginTop: '0.1rem' }}>Total Invested</div>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '1.1rem 1.25rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{projectCount}</div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginTop: '0.1rem' }}>Projects Funded</div>
          </div>
        </div>
      )}

      {loading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}
      {error && <p style={{ color: 'var(--danger, #dc2626)' }}>{error}</p>}

      {!loading && investments.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--muted)', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ margin: '0 0 1rem' }}>You haven't invested in any projects yet.</p>
          <Link to="/app/marketplace">
            <button>Browse Marketplace</button>
          </Link>
        </div>
      )}

      <div style={{ display: 'grid', gap: '1rem' }}>
        {investments.map((inv) => {
          const projectId = inv.project_id || inv.projectId;
          const projectName = inv.project?.name || inv.projectName || `Project #${projectId}`;
          const date = inv.created_at || inv.createdAt;
          return (
            <div key={inv.id} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
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
                  <div style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--primary)' }}>
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
                  <button className="ghost" onClick={() => navigate(`/app/projects/${projectId}`)}>
                    View Project
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
