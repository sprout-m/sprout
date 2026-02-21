import { useState } from 'react';
import { useMarket } from '../context/MarketContext';

function ConfirmModal({ dispute, resolution, onConfirm, onCancel, saving }) {
  const isRelease = resolution === 'release';
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div style={{
        background: 'var(--surface, #1a1a1a)',
        border: '1px solid var(--line, #2a2a2a)',
        borderRadius: '10px',
        width: '100%', maxWidth: '420px',
        padding: '1.75rem',
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Confirm {isRelease ? 'Release to Seller' : 'Refund to Buyer'}
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '1rem' }}>
          {isRelease
            ? `This will release ${dispute.amount_usdc?.toLocaleString()} USDC to @${dispute.seller_handle}. This action cannot be undone.`
            : `This will refund ${dispute.amount_usdc?.toLocaleString()} USDC to @${dispute.buyer_handle}. This action cannot be undone.`
          }
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button className="ghost" onClick={onCancel} disabled={saving}>Cancel</button>
          <button
            onClick={onConfirm}
            disabled={saving}
            style={isRelease
              ? {}
              : { background: 'var(--danger, #e55)', borderColor: 'var(--danger, #e55)' }
            }
          >
            {saving ? 'Processing…' : (isRelease ? 'Release Funds' : 'Issue Refund')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OperatorDisputesPage() {
  const { adminDisputes, resolveDispute } = useMarket();
  const [confirm, setConfirm] = useState(null); // { dispute, resolution }
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleResolve() {
    if (!confirm) return;
    setSaving(true);
    setError('');
    try {
      await resolveDispute(confirm.dispute.id, confirm.resolution);
      setConfirm(null);
    } catch (err) {
      setError(err.message || 'Failed to resolve dispute');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      {confirm && (
        <ConfirmModal
          dispute={confirm.dispute}
          resolution={confirm.resolution}
          onConfirm={handleResolve}
          onCancel={() => { setConfirm(null); setError(''); }}
          saving={saving}
        />
      )}

      <div className="page-header">
        <div>
          <h2>Dispute Resolution</h2>
          <p>Review disputed escrows and release or refund funds.</p>
        </div>
        {adminDisputes.length > 0 && (
          <span
            style={{
              background: 'rgba(229,85,85,0.12)', color: 'var(--danger, #e55)',
              borderRadius: '999px', padding: '0.25rem 0.75rem',
              fontSize: '0.8125rem', fontWeight: 600,
            }}
          >
            {adminDisputes.length} open
          </span>
        )}
      </div>

      {error && (
        <p style={{ color: 'var(--danger, #e55)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</p>
      )}

      {adminDisputes.length === 0 ? (
        <div className="card empty-center">
          <p style={{ fontWeight: 600 }}>No open disputes</p>
          <p style={{ color: 'var(--muted)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
            All escrow disputes have been resolved.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {adminDisputes.map((d) => (
            <div
              key={d.id}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: '10px',
                padding: '1.25rem 1.5rem',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{d.listing_name}</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                    Escrow ID: <span style={{ fontFamily: 'monospace' }}>{d.id.slice(0, 8)}…</span>
                    &nbsp;·&nbsp;Disputed {new Date(d.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  style={{
                    background: 'rgba(229,85,85,0.12)', color: 'var(--danger, #e55)',
                    borderRadius: '999px', padding: '0.2rem 0.65rem',
                    fontSize: '0.75rem', fontWeight: 600,
                  }}
                >
                  Disputed
                </span>
              </div>

              {/* Parties + amount */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.75rem', alignItems: 'center', marginBottom: '1.25rem' }}>
                {/* Buyer */}
                <div style={{
                  background: 'var(--surface-raised, #222)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px', padding: '0.75rem',
                }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Buyer</p>
                  <p style={{ fontWeight: 600 }}>@{d.buyer_handle}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.15rem' }}>{d.buyer_email}</p>
                </div>

                {/* Amount */}
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</p>
                  <p style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.2rem' }}>
                    {d.amount_usdc?.toLocaleString()}
                  </p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>USDC</p>
                </div>

                {/* Seller */}
                <div style={{
                  background: 'var(--surface-raised, #222)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px', padding: '0.75rem',
                  textAlign: 'right',
                }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Seller</p>
                  <p style={{ fontWeight: 600 }}>@{d.seller_handle}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.15rem' }}>{d.seller_email}</p>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  style={{ flex: 1 }}
                  onClick={() => setConfirm({ dispute: d, resolution: 'release' })}
                >
                  Release to Seller
                </button>
                <button
                  className="ghost"
                  style={{
                    flex: 1,
                    borderColor: 'var(--danger, #e55)',
                    color: 'var(--danger, #e55)',
                  }}
                  onClick={() => setConfirm({ dispute: d, resolution: 'refund' })}
                >
                  Refund to Buyer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
