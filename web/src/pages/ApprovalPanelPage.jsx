import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { milestonesApi } from '../api/client';

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
  if (error && !data) return <p style={{ color: '#f87171' }}>{error}</p>;
  if (!data) return null;

  const { milestone: ms, proof, approval: existingApproval } = data;

  if (result) {
    const approved = result.decision === 'approve';
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '3rem 1rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{approved ? '✅' : '❌'}</div>
        <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{approved ? 'Approved!' : 'Rejected'}</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
          {approved
            ? 'KMS signature recorded. Funds released to organizer on Hedera.'
            : 'Milestone rejected. The organizer can resubmit proof.'}
        </p>
        {approved && result.data?.approval?.kms_signature && (
          <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px', padding: '1rem', textAlign: 'left', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 600, marginBottom: '0.5rem' }}>KMS Signature (base64)</div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', wordBreak: 'break-all', color: 'rgba(255,255,255,0.7)' }}>
              {result.data.approval?.kms_signature || result.data?.approval?.kms_signature}
            </div>
            {result.data?.payload_hash && (
              <>
                <div style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 600, margin: '0.75rem 0 0.25rem' }}>Payload Hash (SHA-256)</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', wordBreak: 'break-all', color: 'rgba(255,255,255,0.7)' }}>
                  {result.data.payload_hash}
                </div>
              </>
            )}
          </div>
        )}
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: '1px solid var(--border, rgba(255,255,255,0.12))', color: 'inherit', padding: '0.5rem 1.25rem', borderRadius: '6px', cursor: 'pointer' }}>
          Back
        </button>
      </div>
    );
  }

  if (existingApproval) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Approval Record</h1>
        <div style={{ background: 'var(--surface, #1a2332)', border: '1px solid var(--border, rgba(255,255,255,0.08))', borderRadius: '10px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.25rem' }}>{existingApproval.decision === 'approved' ? '✅' : '❌'}</span>
            <strong style={{ textTransform: 'capitalize' }}>{existingApproval.decision}</strong>
          </div>
          {existingApproval.kmsSignature && (
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>KMS Signature</div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', wordBreak: 'break-all', color: 'rgba(255,255,255,0.6)' }}>{existingApproval.kmsSignature}</div>
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
        {ms.title} — ${(ms.amount || 0).toLocaleString()} payout
      </p>

      {/* Proof */}
      {proof ? (
        <div style={{ background: 'var(--surface, #1a2332)', border: '1px solid var(--border, rgba(255,255,255,0.08))', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.25rem' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>Submitted Proof</h2>
          <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.6 }}>{proof.textUpdate}</p>
          {proof.imageUrls?.length > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.375rem' }}>Images</div>
              {proof.imageUrls.map((u, i) => (
                <div key={i} style={{ fontSize: '0.8125rem' }}><a href={u} target="_blank" rel="noreferrer" style={{ color: '#4ade80' }}>{u}</a></div>
              ))}
            </div>
          )}
          {proof.docUrls?.length > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.375rem' }}>Documents</div>
              {proof.docUrls.map((u, i) => (
                <div key={i} style={{ fontSize: '0.8125rem' }}><a href={u} target="_blank" rel="noreferrer" style={{ color: '#4ade80' }}>{u}</a></div>
              ))}
            </div>
          )}
          {proof.fileHashes?.length > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.375rem' }}>File Hashes</div>
              {proof.fileHashes.map((h, i) => (
                <div key={i} style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>{h}</div>
              ))}
            </div>
          )}
          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
            Submitted {new Date(proof.submittedAt).toLocaleString()}
          </div>
        </div>
      ) : (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem', color: '#f87171', fontSize: '0.875rem' }}>
          No proof submission found for this milestone.
        </div>
      )}

      {/* Decision */}
      <div style={{ background: 'var(--surface, #1a2332)', border: '1px solid var(--border, rgba(255,255,255,0.08))', borderRadius: '10px', padding: '1.25rem' }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>Your Decision</h2>
        <div style={{ marginBottom: '1rem' }}>
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

        <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.8125rem', color: '#4ade80' }}>
          🔑 Approving will call AWS KMS to sign the approval payload. The signature is stored on-chain via Hedera HCS.
        </div>

        {error && <p style={{ color: '#f87171', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => handleDecision('approve')}
            disabled={loading || !proof}
            style={{ flex: 1, background: '#22c55e', color: '#fff', border: 'none', padding: '0.625rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
          >
            {loading ? '…' : '✓ Approve & Release Funds'}
          </button>
          <button
            onClick={() => handleDecision('reject')}
            disabled={loading}
            style={{ flex: 1, background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', padding: '0.625rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
          >
            {loading ? '…' : '✗ Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}
