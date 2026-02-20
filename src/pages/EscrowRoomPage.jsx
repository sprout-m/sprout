import { useNavigate } from 'react-router-dom';
import { useMarket } from '../context/MarketContext';
import StatusPill from '../components/StatusPill';

const steps = [
  { label: 'Buyer deposits USDC', key: 'deposit' },
  { label: 'Seller transfers ownership contract', key: 'transfer' },
  { label: 'Funds released to seller', key: 'release' }
];

export default function EscrowRoomPage() {
  const { escrows, offers, listings, depositEscrow, transferOwnership, openDispute } = useMarket();
  const navigate = useNavigate();

  const getOffer = (id) => offers.find((o) => o.offerId === id);
  const getListingName = (listingId) => listings.find((l) => l.id === listingId)?.anonymizedName || listingId;

  if (!escrows.length) {
    return (
      <section>
        <div className="page-header">
          <h2>Closing</h2>
          <p>Accepted offers move here for USDC deposit, ownership transfer, and finalization.</p>
        </div>
        <div className="card empty-center">
          <p>No active closings</p>
          <p style={{ color: 'var(--muted)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
            Accept an offer on the Offers board to open a closing workflow.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="page-header">
        <h2>Closing</h2>
        <p>Accepted offers move here for USDC deposit, ownership transfer, and finalization.</p>
      </div>

      {escrows.map((escrow) => {
        const offer = getOffer(escrow.offerId);
        if (!offer) return null;

        const deposited = escrow.status !== 'awaitingDeposit';
        const transferred = escrow.status === 'completed';

        const stepDone = [deposited, transferred, transferred];

        return (
          <article key={escrow.escrowId} className="card" style={{ marginBottom: '0.75rem' }}>
            <div className="card-top" style={{ marginBottom: '1rem' }}>
              <div>
                <span className="cat-label" style={{ marginBottom: '0.25rem', display: 'block' }}>
                  {offer.terms.dealType}
                </span>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
                  {getListingName(offer.listingId)}
                </h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '1.0625rem', fontWeight: 700, letterSpacing: '-0.025em', fontFeatureSettings: "'tnum'", marginBottom: '0.25rem' }}>
                  {escrow.amountUSDC.toLocaleString()} USDC
                </p>
                <StatusPill status={escrow.status} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: '1.5rem', alignItems: 'start' }}>
              <div>
                <p className="form-label" style={{ marginBottom: '0.5rem' }}>Closing Steps</p>
                <div className="step-section">
                  {steps.map((step, i) => (
                    <div key={step.key} className="step-row">
                      <span className={`step-indicator${stepDone[i] ? ' done' : ''}`}>
                        {stepDone[i] ? '✓' : i + 1}
                      </span>
                      <span style={stepDone[i] ? { color: 'var(--ok)' } : { color: 'var(--text-secondary)' }}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gap: '0.5rem', minWidth: '160px' }}>
                <button
                  disabled={escrow.status !== 'awaitingDeposit'}
                  onClick={() => depositEscrow(escrow.escrowId)}
                >
                  Deposit USDC
                </button>
                <button
                  className="ghost"
                  disabled={escrow.status !== 'funded'}
                  onClick={() => transferOwnership(escrow.escrowId)}
                >
                  Transfer Ownership
                </button>
                <button
                  className="ghost"
                  disabled={escrow.status === 'completed' || escrow.status === 'disputed'}
                  onClick={() => {
                    openDispute(escrow.escrowId);
                    navigate('/app/messages', {
                      state: { listingId: offer.listingId, buyerId: offer.buyerId }
                    });
                  }}
                >
                  {escrow.status === 'disputed' ? 'Dispute Opened' : 'Open Dispute'}
                </button>
              </div>
            </div>

            <div className="tx-grid" style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--line)' }}>
              <div className="tx-item">
                <span>Deposit Tx</span>
                <code>{escrow.buyerDepositTx || '—'}</code>
              </div>
              <div className="tx-item">
                <span>Transfer Tx</span>
                <code>{escrow.sellerTransferTx || '—'}</code>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
