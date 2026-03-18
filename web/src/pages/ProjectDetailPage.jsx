import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { investmentsApi, projectsApi } from '../api/client';
import { useApp } from '../context/AppContext';

const msStatusLabel = {
  pending:   { text: 'Pending',   color: '#9ca3af' },
  submitted: { text: 'In Review', color: '#d97706' },
  approved:  { text: 'Approved',  color: '#15803d' },
  rejected:  { text: 'Rejected',  color: '#dc2626' },
};

const inputStyle = {
  width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.875rem',
  border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff',
  color: '#111827', outline: 'none', boxSizing: 'border-box',
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useApp();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    setFundLoading(true);
    try {
      const body = { amount: Number(fundAmount) };
      if (fundTxId.trim()) body.hedera_tx_id = fundTxId.trim();
      const result = await investmentsApi.fund(id, body);
      setFundResult(result);
      setFundAmount('');
      setFundTxId('');
      projectsApi.get(id).then(setData).catch(() => {});
    } catch (err) {
      setFundError(err.message || 'Investment failed');
    } finally {
      setFundLoading(false);
    }
  }

  if (loading) return <p style={{ color: '#9ca3af' }}>Loading…</p>;
  if (error) return <p style={{ color: '#dc2626' }}>{error}</p>;
  if (!data) return null;

  const { project: p, milestones } = data;
  const funded = p.amountFunded || 0;
  const released = p.amountReleased || 0;
  const goal = p.totalAmount || 0;
  const fundingPct = goal > 0 ? Math.min(100, (funded / goal) * 100) : 0;

  return (
    <div style={{ maxWidth: '820px' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div>
            {p.category && (
              <p style={{ margin: '0 0 0.375rem', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af' }}>
                {p.category}
              </p>
            )}
            <h1 style={{ margin: '0 0 0.625rem', fontSize: '1.625rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a', lineHeight: 1.2 }}>
              {p.name}
            </h1>
            {p.description && (
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9375rem', lineHeight: 1.7, maxWidth: '560px' }}>
                {p.description}
              </p>
            )}
          </div>
          <Link to={`/app/projects/${id}/audit`} style={{ flexShrink: 0 }}>
            <button className="ghost" style={{ whiteSpace: 'nowrap' }}>Audit Trail</button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0', marginBottom: '1.75rem', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
        {[
          { label: 'Funding Goal', value: `$${goal.toLocaleString()}` },
          { label: 'Raised',       value: `$${funded.toLocaleString()}`, green: true },
          { label: 'Released',     value: `$${released.toLocaleString()}` },
        ].map((s, i) => (
          <div key={s.label} style={{
            padding: '1.125rem 1.25rem',
            borderRight: i < 2 ? '1px solid #e5e7eb' : 'none',
            background: '#fff',
          }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500, marginBottom: '0.375rem' }}>{s.label}</div>
            <div style={{ fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.025em', color: s.green ? '#14532d' : '#111827' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151' }}>Funding progress</span>
          <span style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>{Math.round(fundingPct)}%</span>
        </div>
        <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: `${fundingPct}%`, height: '100%', background: '#14532d', borderRadius: '3px', transition: 'width 0.3s' }} />
        </div>
        {p.goal && (
          <p style={{ margin: '0.75rem 0 0', fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.6 }}>
            <span style={{ fontWeight: 600, color: '#374151' }}>Impact goal: </span>{p.goal}
          </p>
        )}
      </div>

      {/* Fund form */}
      {user?.role === 'funder' && p.status === 'active' && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem', background: '#fff' }}>
          <h2 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Fund this project</h2>
          {fundResult ? (
            <div>
              <p style={{ margin: '0 0 0.75rem', fontWeight: 600, color: '#14532d' }}>Investment recorded.</p>
              {fundResult.escrow_account && (
                <div style={{ padding: '0.875rem 1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  <div style={{ color: '#6b7280', marginBottom: '0.375rem' }}>Send HBAR to escrow account:</div>
                  <code style={{ color: '#14532d', fontWeight: 700, wordBreak: 'break-all' }}>{fundResult.escrow_account}</code>
                </div>
              )}
              <button className="ghost" onClick={() => setFundResult(null)}>Make another investment</button>
            </div>
          ) : (
            <form onSubmit={handleFund} style={{ display: 'grid', gap: '0.875rem' }}>
              <div style={{ display: 'grid', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151' }}>Amount (USD)</label>
                <input type="number" min="1" step="0.01" placeholder="500" required style={inputStyle}
                  value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151' }}>Hedera Transaction ID <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
                <input type="text" placeholder="0.0.12345@1234567890.000000000" style={inputStyle}
                  value={fundTxId} onChange={(e) => setFundTxId(e.target.value)} />
              </div>
              {fundError && <p style={{ margin: 0, fontSize: '0.875rem', color: '#dc2626' }}>{fundError}</p>}
              <div>
                <button type="submit" disabled={fundLoading || !fundAmount}>
                  {fundLoading ? 'Processing…' : 'Invest Now'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Milestones */}
      <div>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Milestones</h2>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
          {milestones.map((ms, idx) => {
            const meta = msStatusLabel[ms.status] || msStatusLabel.pending;
            const canSubmit = user?.role === 'organizer' && ms.status === 'pending';
            const canReview = (user?.role === 'verifier' || user?.role === 'funder') && ms.status === 'submitted';
            return (
              <div key={ms.id} style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr auto',
                gap: '1rem',
                alignItems: 'center',
                padding: '1.125rem 1.25rem',
                borderTop: idx > 0 ? '1px solid #e5e7eb' : 'none',
                background: '#fff',
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d1d5db', fontFamily: 'monospace' }}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#111827', marginBottom: ms.description ? '0.25rem' : 0 }}>
                    {ms.title}
                  </div>
                  {ms.description && (
                    <div style={{ fontSize: '0.8125rem', color: '#6b7280', lineHeight: 1.55 }}>{ms.description}</div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827' }}>${(ms.amount || 0).toLocaleString()}</div>
                    <div style={{ fontSize: '0.75rem', color: meta.color, fontWeight: 500, marginTop: '0.125rem' }}>{meta.text}</div>
                  </div>
                  {canSubmit && (
                    <button onClick={() => navigate(`/app/milestones/${ms.id}/proof`)}>Submit Proof</button>
                  )}
                  {canReview && (
                    <button onClick={() => navigate(`/app/milestones/${ms.id}/review`)}>Review</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
