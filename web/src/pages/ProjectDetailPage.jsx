import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { investmentsApi, projectsApi } from '../api/client';
import { useApp } from '../context/AppContext';

const msStatus = {
  pending:   { bg: 'rgba(107,114,128,0.1)', text: '#6b7280' },
  submitted: { bg: 'rgba(245,158,11,0.1)',  text: '#d97706' },
  approved:  { bg: 'rgba(22,163,74,0.1)',   text: '#15803d' },
  rejected:  { bg: 'rgba(239,68,68,0.1)',   text: '#dc2626' },
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

  if (loading) return <p style={{ color: 'var(--muted)' }}>Loading…</p>;
  if (error) return <p style={{ color: 'var(--danger, #dc2626)' }}>{error}</p>;
  if (!data) return null;

  const { project: p, milestones } = data;
  const fundingPct = p.totalAmount > 0 ? Math.min(100, ((p.amountFunded || 0) / p.totalAmount) * 100) : 0;
  const releasePct = p.totalAmount > 0 ? Math.min(100, ((p.amountReleased || 0) / p.totalAmount) * 100) : 0;

  return (
    <div style={{ maxWidth: '780px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 500, marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{p.category}</div>
          <h1 style={{ margin: 0, fontSize: '1.625rem', fontWeight: 700, lineHeight: 1.2 }}>{p.name}</h1>
          {p.description && <p style={{ margin: '0.5rem 0 0', color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>{p.description}</p>}
        </div>
        <Link to={`/app/projects/${id}/audit`} style={{ flexShrink: 0 }}>
          <button className="ghost">Audit Trail</button>
        </Link>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Funding Goal',  value: `$${(p.totalAmount || 0).toLocaleString()}` },
          { label: 'Raised',        value: `$${(p.amountFunded || 0).toLocaleString()}`, accent: true },
          { label: 'Released',      value: `$${(p.amountReleased || 0).toLocaleString()}` },
        ].map((s) => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '1rem 1.125rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>{s.label}</div>
            <div style={{ fontWeight: 700, fontSize: '1.25rem', color: s.accent ? 'var(--primary)' : 'var(--text)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Funding progress bar with milestone ticks */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: 600 }}>Funding progress</span>
          <span style={{ color: 'var(--muted)' }}>{Math.round(fundingPct)}%</span>
        </div>
        <div style={{ position: 'relative', background: 'var(--line)', borderRadius: '999px', height: '8px', marginBottom: '0.375rem' }}>
          <div style={{ width: `${fundingPct}%`, background: 'var(--primary)', height: '100%', borderRadius: '999px', transition: 'width 0.3s' }} />
          {milestones.length > 1 && (() => {
            let cum = 0;
            return milestones.slice(0, -1).map((m, i) => {
              cum += (m.amount || 0);
              const tpct = p.totalAmount > 0 ? Math.min(100, (cum / p.totalAmount) * 100) : 0;
              return (
                <span key={i} style={{
                  position: 'absolute', top: 0, left: `${tpct}%`,
                  width: '2px', height: '8px',
                  background: tpct <= fundingPct ? 'rgba(255,255,255,0.55)' : 'var(--line-strong)',
                  transform: 'translateX(-50%)',
                }} />
              );
            });
          })()}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted)' }}>
          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>${(p.amountFunded || 0).toLocaleString()} raised</span>
          <span>goal ${(p.totalAmount || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Goal statement */}
      {p.goal && (
        <div style={{ background: 'var(--primary-light)', border: '1px solid var(--primary-border)', borderRadius: 'var(--radius-md)', padding: '0.875rem 1rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--primary)' }}>
          <strong>Impact goal:</strong> {p.goal}
        </div>
      )}

      {/* Fund this project */}
      {user?.role === 'funder' && p.status === 'active' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>Fund this project</h2>
          {fundResult ? (
            <div>
              <p style={{ color: 'var(--primary)', fontWeight: 600, margin: '0 0 0.5rem' }}>Investment recorded.</p>
              {fundResult.escrow_account && (
                <div style={{ background: 'var(--primary-light)', border: '1px solid var(--primary-border)', borderRadius: 'var(--radius)', padding: '0.875rem', fontSize: '0.875rem', marginBottom: '0.875rem' }}>
                  <div style={{ color: 'var(--muted)', marginBottom: '0.25rem' }}>Send HBAR to escrow account:</div>
                  <code style={{ color: 'var(--primary)', fontWeight: 700, wordBreak: 'break-all' }}>{fundResult.escrow_account}</code>
                </div>
              )}
              <button className="ghost" onClick={() => setFundResult(null)}>Make another investment</button>
            </div>
          ) : (
            <form onSubmit={handleFund} style={{ display: 'grid', gap: '0.875rem' }}>
              <div className="ob-field">
                <label className="ob-field-label">Amount (USD)</label>
                <input className="ob-field-input" type="number" min="1" step="0.01" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} placeholder="500" required />
              </div>
              <div className="ob-field">
                <label className="ob-field-label">Hedera Transaction ID (optional)</label>
                <input className="ob-field-input" type="text" value={fundTxId} onChange={(e) => setFundTxId(e.target.value)} placeholder="0.0.12345@1234567890.000000000" />
              </div>
              {fundError && <p style={{ color: 'var(--danger, #dc2626)', fontSize: '0.8125rem', margin: 0 }}>{fundError}</p>}
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
      <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Milestones</h2>
      <div style={{ display: 'grid', gap: '0.625rem' }}>
        {milestones.map((ms, idx) => {
          const colors = msStatus[ms.status] || msStatus.pending;
          const canSubmit = user?.role === 'organizer' && ms.status === 'pending';
          const canReview = (user?.role === 'verifier' || user?.role === 'funder') && ms.status === 'submitted';
          return (
            <div key={ms.id} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '1rem 1.125rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: colors.bg, color: colors.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                {idx + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{ms.title}</div>
                {ms.description && <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.125rem' }}>{ms.description}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>${(ms.amount || 0).toLocaleString()}</div>
                  <span style={{ background: colors.bg, color: colors.text, padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'capitalize' }}>
                    {ms.status}
                  </span>
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
  );
}
