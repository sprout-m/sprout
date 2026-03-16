import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { investmentsApi, projectsApi } from '../api/client';
import { useApp } from '../context/AppContext';

const statusColor = {
  pending:   { bg: 'rgba(99,102,241,0.15)',  text: '#818cf8' },
  submitted: { bg: 'rgba(245,158,11,0.15)',  text: '#fbbf24' },
  approved:  { bg: 'rgba(34,197,94,0.15)',   text: '#4ade80' },
  rejected:  { bg: 'rgba(239,68,68,0.15)',   text: '#f87171' },
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useApp();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Funding form state
  const [fundAmount, setFundAmount] = useState('');
  const [fundTxId, setFundTxId] = useState('');
  const [fundLoading, setFundLoading] = useState(false);
  const [fundError, setFundError] = useState('');
  const [fundResult, setFundResult] = useState(null);

  useEffect(() => {
    projectsApi.get(id)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleFund(e) {
    e.preventDefault();
    setFundError('');
    setFundResult(null);
    if (!fundAmount || Number(fundAmount) <= 0) {
      setFundError('Please enter a valid amount');
      return;
    }
    setFundLoading(true);
    try {
      const body = { amount: Number(fundAmount) };
      if (fundTxId.trim()) body.hedera_tx_id = fundTxId.trim();
      const result = await investmentsApi.fund(id, body);
      setFundResult(result);
      setFundAmount('');
      setFundTxId('');
      // Refresh project data to update amountFunded
      projectsApi.get(id).then(setData).catch(() => {});
    } catch (err) {
      setFundError(err.message || 'Investment failed');
    } finally {
      setFundLoading(false);
    }
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>Loading…</p>;
  if (error) return <p style={{ color: '#f87171' }}>{error}</p>;
  if (!data) return null;

  const { project: p, milestones } = data;
  const progress = p.totalAmount > 0 ? (p.amountReleased / p.totalAmount) * 100 : 0;
  const fundingPct = p.totalAmount > 0 ? Math.min(100, ((p.amountFunded || 0) / p.totalAmount) * 100) : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{p.name}</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.875rem' }}>{p.category}</p>
        </div>
        <Link to={`/app/projects/${id}/audit`}>
          <button style={{ background: 'transparent', border: '1px solid var(--border, rgba(255,255,255,0.12))', color: 'var(--muted)', padding: '0.4rem 0.875rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8125rem' }}>
            Audit Trail
          </button>
        </Link>
      </div>

      {/* Funding progress section */}
      <div style={{ background: 'var(--surface, #1a2332)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.125rem' }}>Funding Goal</div>
            <div style={{ fontWeight: 700, fontSize: '1.375rem' }}>${(p.totalAmount || 0).toLocaleString()}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.125rem' }}>Funded</div>
            <div style={{ fontWeight: 700, fontSize: '1.375rem', color: '#4ade80' }}>${(p.amountFunded || 0).toLocaleString()}</div>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '999px', height: '8px', overflow: 'hidden', marginBottom: '0.375rem' }}>
          <div style={{ width: `${fundingPct}%`, background: 'linear-gradient(90deg, #16a34a, #22c55e)', height: '100%', transition: 'width 0.3s' }} />
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textAlign: 'right' }}>
          {Math.round(fundingPct)}% of goal funded
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Funding', value: `$${(p.totalAmount || 0).toLocaleString()}` },
          { label: 'Released', value: `$${(p.amountReleased || 0).toLocaleString()}`, color: '#4ade80' },
          { label: 'Milestones', value: milestones.length },
        ].map((s) => (
          <div key={s.label} style={{ background: 'var(--surface, #1a2332)', border: '1px solid var(--border, rgba(255,255,255,0.08))', borderRadius: '10px', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>{s.label}</div>
            <div style={{ fontWeight: 700, fontSize: '1.25rem', color: s.color || 'inherit' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Milestone release progress bar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '0.375rem' }}>
          <span>Milestone Releases</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, progress)}%`, background: '#22c55e', height: '100%' }} />
        </div>
      </div>

      {/* Funder investment form */}
      {user?.role === 'funder' && (
        <div style={{ background: 'var(--surface, #1a2332)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600, color: '#4ade80' }}>Fund this project</h2>
          {fundResult ? (
            <div>
              <p style={{ color: '#4ade80', fontWeight: 600, marginBottom: '0.5rem' }}>Investment recorded!</p>
              {fundResult.escrow_account && (
                <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px', padding: '0.875rem', fontSize: '0.875rem' }}>
                  <div style={{ color: 'var(--muted)', marginBottom: '0.25rem' }}>Send HBAR to escrow account:</div>
                  <code style={{ color: '#4ade80', fontWeight: 700, wordBreak: 'break-all' }}>{fundResult.escrow_account}</code>
                </div>
              )}
              <button
                onClick={() => setFundResult(null)}
                style={{ marginTop: '0.875rem', background: 'transparent', border: '1px solid var(--border, rgba(255,255,255,0.12))', color: 'var(--muted)', padding: '0.375rem 0.875rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8125rem' }}
              >
                Make another investment
              </button>
            </div>
          ) : (
            <form onSubmit={handleFund} style={{ display: 'grid', gap: '0.875rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '0.375rem' }}>Amount (USD) *</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  placeholder="500"
                  required
                  className="ob-field-input"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '0.375rem' }}>Hedera Transaction ID (optional)</label>
                <input
                  type="text"
                  value={fundTxId}
                  onChange={(e) => setFundTxId(e.target.value)}
                  placeholder="0.0.12345@1234567890.000000000"
                  className="ob-field-input"
                  style={{ width: '100%' }}
                />
              </div>
              {fundError && <p style={{ color: '#f87171', fontSize: '0.8125rem', margin: 0 }}>{fundError}</p>}
              <button
                type="submit"
                disabled={fundLoading}
                style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, alignSelf: 'flex-start' }}
              >
                {fundLoading ? 'Processing…' : 'Invest Now'}
              </button>
            </form>
          )}
        </div>
      )}

      {p.goal && (
        <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px', padding: '0.875rem 1rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          <span style={{ color: '#4ade80', fontWeight: 600 }}>Goal: </span>{p.goal}
        </div>
      )}

      {/* Milestones */}
      <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Milestones</h2>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {milestones.map((ms) => {
          const colors = statusColor[ms.status] || statusColor.pending;
          const canSubmitProof = user?.role === 'organizer' && ms.status === 'pending';
          const canReview = user?.role === 'verifier' && ms.status === 'submitted';
          return (
            <div key={ms.id} style={{ background: 'var(--surface, #1a2332)', border: '1px solid var(--border, rgba(255,255,255,0.08))', borderRadius: '10px', padding: '1.125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ width: '24px', height: '24px', background: colors.bg, color: colors.text, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                    {ms.orderIndex}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{ms.title}</div>
                    {ms.description && <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: '0.125rem' }}>{ms.description}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>${(ms.amount || 0).toLocaleString()}</div>
                    <span style={{ background: colors.bg, color: colors.text, padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'capitalize' }}>
                      {ms.status}
                    </span>
                  </div>
                  {canSubmitProof && (
                    <button onClick={() => navigate(`/app/milestones/${ms.id}/proof`)} style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '0.375rem 0.875rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      Submit Proof
                    </button>
                  )}
                  {canReview && (
                    <button onClick={() => navigate(`/app/milestones/${ms.id}/review`)} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '0.375rem 0.875rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      Review
                    </button>
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
