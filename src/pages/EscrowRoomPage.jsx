import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarket } from '../context/MarketContext';
import { useWallet } from '../context/WalletContext';
import StatusPill from '../components/StatusPill';

const steps = [
  { label: 'Buyer deposits USDC', key: 'deposit' },
  { label: 'Seller transfers ownership contract', key: 'transfer' },
  { label: 'Funds released to seller', key: 'release' }
];

export default function EscrowRoomPage() {
  const { escrows, offers, listings, user, confirmDeposit, transferNFT, openDispute } = useMarket();
  const { isConnected, accountId: walletAccountId, transferUSDC } = useWallet();
  const navigate = useNavigate();
  const [depositingId,  setDepositingId]  = useState(null);
  const [depositError,  setDepositError]  = useState('');
  const [transferringId, setTransferringId] = useState(null);
  const [transferError, setTransferError] = useState('');

  const getOffer = (id) => offers.find((o) => o.offerId === id);
  const getListing = (listingId) => listings.find((l) => l.id === listingId);
  const getListingName = (listingId) => getListing(listingId)?.anonymizedName || listingId;

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
        const nftTransferred = Boolean(escrow.sellerTransferTx);
        const released = ['releaseScheduled', 'completed'].includes(escrow.status);

        const stepDone = [deposited, nftTransferred, released];

        const isBuyer = user?.id === offer.buyerId;
        const isSeller = user?.id === getListing(offer.listingId)?.sellerId;

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
                {isBuyer && (
                  <>
                    <button
                      disabled={escrow.status !== 'awaitingDeposit' || depositingId === escrow.escrowId}
                      onClick={async () => {
                        setDepositError('');
                        setDepositingId(escrow.escrowId);
                        try {
                          let txId;
                          const hasRealWallet = isConnected
                            && escrow.hederaAccountId
                            && import.meta.env.VITE_HEDERA_USDC_TOKEN_ID;

                          if (hasRealWallet) {
                            // Real on-chain USDC transfer via HashPack
                            txId = await transferUSDC(
                              walletAccountId,
                              escrow.hederaAccountId,
                              escrow.amountUSDC,
                            );
                          } else {
                            // Dev/testnet fallback — no real Hedera token configured
                            txId = `0.0.${Date.now()}@${Math.floor(Date.now() / 1000)}.0`;
                          }

                          await confirmDeposit(escrow.escrowId, txId);
                        } catch (err) {
                          setDepositError(err.message || 'Deposit failed');
                        } finally {
                          setDepositingId(null);
                        }
                      }}
                    >
                      {depositingId === escrow.escrowId ? 'Waiting for HashPack…' : 'Deposit USDC'}
                    </button>
                    {depositError && depositingId === null && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--danger, #e55)', marginTop: '0.25rem' }}>
                        {depositError}
                      </p>
                    )}
                  </>
                )}
                {isSeller && (
                  <>
                    <button
                      className="ghost"
                      disabled={
                        escrow.status !== 'funded' && escrow.status !== 'releaseScheduled'
                        || Boolean(escrow.sellerTransferTx)
                        || transferringId === escrow.escrowId
                      }
                      onClick={async () => {
                        setTransferError('');
                        setTransferringId(escrow.escrowId);
                        try {
                          await transferNFT(escrow.escrowId);
                        } catch (err) {
                          setTransferError(err.message || 'NFT transfer failed');
                        } finally {
                          setTransferringId(null);
                        }
                      }}
                    >
                      {transferringId === escrow.escrowId
                        ? 'Transferring…'
                        : escrow.sellerTransferTx
                          ? 'NFT Transferred ✓'
                          : 'Transfer Listing NFT'}
                    </button>
                    {transferError && transferringId === null && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--danger, #e55)', marginTop: '0.25rem' }}>
                        {transferError}
                      </p>
                    )}
                  </>
                )}
                {(isBuyer || isSeller) && (
                  <button
                    className="ghost"
                    disabled={escrow.status === 'completed' || escrow.status === 'disputed'}
                    onClick={async () => {
                      await openDispute(escrow.escrowId);
                      const listing = getListing(offer.listingId);
                      navigate('/app/messages', {
                        state: {
                          listingId: offer.listingId,
                          buyerId: offer.buyerId,
                          sellerId: listing?.sellerId,
                        }
                      });
                    }}
                  >
                    {escrow.status === 'disputed' ? 'Dispute Opened' : 'Open Dispute'}
                  </button>
                )}
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
