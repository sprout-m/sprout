import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { milestonesApi } from '../api/client';
import { formatHbarFromAmount, formatUsdEstimateFromHbar } from '../utils/currency';

export default function ApprovalPanelPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    milestonesApi.get(id)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setFetchLoading(false));
  }, [id]);

  async function handleDecision(decision) {
    setError('');
    if (decision === 'reject' && !note) {
      setError('A reason is required when rejecting');
      return;
    }
    setLoading(true);
    try {
      let res;
      if (decision === 'approve') {
        res = await milestonesApi.approve(id, { note });
      } else {
        res = await milestonesApi.reject(id, { note });
      }
      setResult({ decision, data: res });
    } catch (err) {
      setError(err.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  }

  if (fetchLoading) return <p style={{ color: 'var(--muted)' }}>Loading…</p>;
  if (error && !data) return <p style={{ color: 'var(--danger)' }}>{error}</p>;
  if (!data) return null;

  const { milestone: ms, proof, approval: existingApproval } = data;

  if (result) {
    const approved = result.decision === 'approve';
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '3rem 1rem' }}>
        <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{approved ? 'Approved' : 'Rejected'}</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
          {approved
            ? 'KMS signature recorded. Funds released to organizer on Hedera.'
            : 'Milestone rejected. The organizer can resubmit proof.'}
        </p>
        {approved && result.data?.approval?.kms_signature && (
          <div style={{ background: 'var(--primary-light)', border: '1px solid var(--primary-border)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'left', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.375rem' }}>KMS Signature (base64)</div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', wordBreak: 'break-all', color: 'var(--text-secondary)' }}>
              {result.data.approval?.kms_signature}
            </div>
            {result.data?.payload_hash && (
              <>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0.75rem 0 0.25rem' }}>Payload Hash (SHA-256)</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', wordBreak: 'break-all', color: 'var(--text-secondary)' }}>
                  {result.data.payload_hash}
                </div>
              </>
            )}
          </div>
        )}
        <button className="ghost" onClick={() => navigate(-1)}>Back</button>
      </div>
    );
  }

  if (existingApproval) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Approval Record</h1>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <strong style={{ textTransform: 'capitalize' }}>{existingApproval.decision}</strong>
          {existingApproval.kmsSignature && (
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>KMS Signature</div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', wordBreak: 'break-all', color: 'var(--text-secondary)' }}>{existingApproval.kmsSignature}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Review Milestone</h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        {ms.title} — {formatUsdEstimateFromHbar(ms.amount || 0)} payout
        <span style={{ display: 'block', marginTop: '0.2rem', fontSize: '0.75rem' }}>{formatHbarFromAmount(ms.amount || 0)}</span>
      </p>

      {/* Proof */}
      {proof ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.25rem' }}>
          <h2 style={{ margin: '0 0 0.875rem', fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>Submitted Proof</h2>
          <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.6 }}>{proof.textUpdate}</p>
          {proof.imageUrls?.length > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.375rem' }}>Images</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                {proof.imageUrls.map((u, i) => (
                  <a key={i} href={u} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
                    <img
                      src={u}
                      alt={`Proof ${i + 1}`}
                      style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--line)' }}
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
          {proof.docUrls?.length > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.375rem' }}>Documents</div>
              {proof.docUrls.map((u, i) => (
                <div key={i} style={{ fontSize: '0.8125rem' }}><a href={u} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>{u}</a></div>
              ))}
            </div>
          )}
          {proof.fileHashes?.length > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.375rem' }}>File Hashes</div>
              {proof.fileHashes.map((h, i) => (
                <div key={i} style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{h}</div>
              ))}
            </div>
          )}
          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
            Submitted {new Date(proof.submittedAt).toLocaleString()}
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', padding: '0.875rem 1rem', marginBottom: '1.25rem', color: 'var(--danger)', fontSize: '0.875rem' }}>
          No proof submission found for this milestone.
        </div>
      )}

      {/* Decision */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'grid', gap: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>Your Decision</h2>
        <div className="ob-field">
          <label className="ob-field-label">Note (required for rejection)</label>
          <textarea
            className="ob-field-input"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note for the organizer…"
            style={{ resize: 'vertical' }}
          />
        </div>

        <div style={{ background: 'var(--primary-light)', border: '1px solid var(--primary-border)', borderRadius: 'var(--radius)', padding: '0.75rem', fontSize: '0.8125rem', color: 'var(--primary)' }}>
          Approving will call AWS KMS to sign the approval payload. The signature is stored on-chain via Hedera HCS.
        </div>

        {error && <p style={{ color: 'var(--danger)', fontSize: '0.8125rem', margin: 0 }}>{error}</p>}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => handleDecision('approve')}
            disabled={loading || !proof}
            style={{ flex: 1 }}
          >
            {loading ? 'Submitting…' : 'Approve & Release Funds'}
          </button>
          <button
            className="ghost"
            onClick={() => handleDecision('reject')}
            disabled={loading}
            style={{ flex: 1, borderColor: 'var(--danger-border)', color: 'var(--danger)' }}
          >
            {loading ? 'Submitting…' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}
