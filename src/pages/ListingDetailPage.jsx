import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import RequestAccessModal from '../components/RequestAccessModal';
import StatusPill from '../components/StatusPill';
import { useMarket } from '../context/MarketContext';
import { useWallet } from '../context/WalletContext';

const lockedTabs = ['Overview', 'Metrics', 'Process', 'Q&A'];
const unlockedTabs = ['Overview', 'Financials', 'Documents', 'Offers', 'Activity'];

const CATEGORY_COLORS = {
  SaaS:        '#6366f1',
  Ecommerce:   '#10b981',
  Media:       '#a855f7',
  Agency:      '#f97316',
  Marketplace: '#06b6d4',
  Other:       '#94a3b8',
};

export default function ListingDetailPage() {
  const { listingId } = useParams();
  const { listings, accessRequests, offers, activeUser, requestAccess, submitOffer } = useMarket();
  const { isConnected, connecting, connect } = useWallet();
  const listing = listings.find((l) => l.id === listingId);
  const myOffer = offers.find((o) => o.listingId === listingId);

  const request = accessRequests.find((r) => r.listingId === listingId && r.buyerId === activeUser.id);
  const unlocked = request?.sellerDecision === 'approved';

  const tabs = unlocked ? unlockedTabs : lockedTabs;
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [showModal, setShowModal] = useState(false);

  const [offerAmount, setOfferAmount] = useState(0);
  const [dealType, setDealType] = useState('asset sale');
  const [diligencePeriod, setDiligencePeriod] = useState(14);
  const [closeWindow, setCloseWindow] = useState('30 days');
  const [offerNotes, setOfferNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [offerError, setOfferError] = useState('');

  const timeline = useMemo(
    () => ['Request Access + NDA', 'Proof of Funds', 'Seller Approval', 'Submit Offer', 'USDC Escrow + Transfer'],
    []
  );

  useEffect(() => {
    if (!tabs.includes(activeTab)) setActiveTab(tabs[0]);
  }, [tabs, activeTab]);

  async function handleRequestAccess() {
    if (!isConnected) {
      const acct = await connect();
      if (!acct) return;
    }
    setShowModal(true);
  }

  if (!listing) return <p>Listing not found.</p>;

  const accentColor = CATEGORY_COLORS[listing.category] || CATEGORY_COLORS.Other;

  return (
    <section className="listing-detail">

      {/* ── Hero ── */}
      <div className="ld-hero" style={{ borderTopColor: accentColor }}>
        <div className="ld-hero-body">
          <div className="ld-hero-eyebrow">
            <span className="cat-label" style={{ color: accentColor }}>{listing.category}</span>
            {listing.location && <><span className="ld-dot" /><span>{listing.location}</span></>}
            {listing.age && <><span className="ld-dot" /><span>{listing.age} old</span></>}
          </div>

          <h1 className="ld-hero-title">{listing.anonymizedName}</h1>
          <p className="ld-hero-teaser">{listing.teaserDescription}</p>

          <div className="ld-hero-tags">
            {listing.verified && <span className="tag">Operator Vetted</span>}
            {listing.ndaRequired && <span className="tag">NDA Required</span>}
            {listing.escrowType && <span className="tag">{listing.escrowType} Escrow</span>}
            {listing.industryTags?.map((t) => <span key={t} className="tag">{t}</span>)}
          </div>
        </div>

        <div className="ld-hero-stats">
          <div className="ld-stat">
            <span>Asking Price</span>
            <strong>{listing.askingRange}</strong>
          </div>
          <div className="ld-stat">
            <span>Revenue</span>
            <strong>{listing.revenueRange}</strong>
          </div>
          <div className="ld-stat">
            <span>Profit</span>
            <strong>{listing.profitRange}</strong>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="listing-layout">

        {/* Main */}
        <div>
          <div className="tab-row">
            {tabs.map((tab) => (
              <button key={tab} className={activeTab === tab ? 'tab active' : 'tab'} onClick={() => setActiveTab(tab)}>
                {tab}
              </button>
            ))}
          </div>

          <div className="tab-panel">
            {activeTab === 'Overview' && (
              <div style={{ display: 'grid', gap: '1.25rem' }}>
                <p style={{ fontSize: '0.9375rem', lineHeight: 1.75, color: 'var(--text-secondary)', margin: 0 }}>
                  {listing.teaserDescription}
                </p>
                {listing.industryTags?.length > 0 && (
                  <div className="badge-row">
                    {listing.industryTags.map((tag) => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Metrics' && (
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                Detailed metrics are visible after NDA signing, proof of funds, and seller approval.
              </p>
            )}

            {activeTab === 'Process' && (
              <div className="step-section">
                {timeline.map((step, i) => (
                  <div key={step} className="step-row">
                    <span className="step-indicator">{i + 1}</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'Q&A' && (
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                Q&A with the seller is available after submitting an access request.
              </p>
            )}

            {activeTab === 'Financials' && unlocked && (
              <div className="card-grid two">
                <article className="card compact">
                  <h4>TTM Revenue</h4>
                  <p style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em', marginTop: '0.25rem' }}>
                    {listing.fullFinancials.ttmRevenue}
                  </p>
                </article>
                <article className="card compact">
                  <h4>TTM Profit</h4>
                  <p style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em', marginTop: '0.25rem' }}>
                    {listing.fullFinancials.ttmProfit}
                  </p>
                </article>
                <article className="card compact">
                  <h4>MoM Growth</h4>
                  <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {listing.fullFinancials.momTrend.join('  ·  ')}
                  </p>
                </article>
                <article className="card compact">
                  <h4>CAC/LTV · Churn</h4>
                  <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {listing.fullFinancials.cacLtv} &nbsp;·&nbsp; {listing.fullFinancials.churn}
                  </p>
                </article>
              </div>
            )}

            {activeTab === 'Documents' && unlocked && (
              <div className="folder-list">
                {Object.entries(listing.dataroomFolders).map(([folder, files]) => (
                  <div key={folder} className="folder">
                    <h4>{folder}</h4>
                    {files.map((file) => (
                      <div key={file} className="file-row">
                        <span>{file}</span>
                        <span style={{ color: 'var(--muted-light)', fontSize: '0.75rem' }}>Feb 11, 2026</span>
                        <button className="ghost" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>View</button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'Offers' && unlocked && (
              myOffer ? (
                <div className="callout" style={{ display: 'grid', gap: '0.5rem' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Offer submitted</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span>Amount</span>
                    <strong>{myOffer.amountUSDC?.toLocaleString()} USDC</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span>Status</span>
                    <strong style={{ textTransform: 'capitalize' }}>{myOffer.status}</strong>
                  </div>
                  {myOffer.terms?.dealType && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                      <span>Deal type</span>
                      <strong style={{ textTransform: 'capitalize' }}>{myOffer.terms.dealType}</strong>
                    </div>
                  )}
                </div>
              ) : (
                <form
                  className="offer-form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setOfferError('');
                    setSubmitting(true);
                    try {
                      await submitOffer({
                        listingId,
                        amountUSDC: offerAmount,
                        terms: { dealType, diligencePeriod: `${diligencePeriod} days`, closeWindow },
                        notes: offerNotes,
                      });
                    } catch (err) {
                      setOfferError(err.message || 'Failed to submit offer');
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  <h4>Make an Offer</h4>
                  <div className="form-field">
                    <label className="form-label">Offer Amount (USDC)</label>
                    <input type="number" required min="1000" value={offerAmount}
                      onChange={(e) => setOfferAmount(e.target.value)} placeholder="e.g. 950000" />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Deal Type</label>
                    <select value={dealType} onChange={(e) => setDealType(e.target.value)}>
                      <option value="asset sale">Asset sale</option>
                      <option value="equity sale">Equity sale</option>
                    </select>
                  </div>
                  <div className="card-grid two">
                    <div className="form-field">
                      <label className="form-label">Diligence Period (days)</label>
                      <input type="number" value={diligencePeriod} onChange={(e) => setDiligencePeriod(e.target.value)} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Close Window</label>
                      <input value={closeWindow} onChange={(e) => setCloseWindow(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Notes to Seller</label>
                    <textarea value={offerNotes} onChange={(e) => setOfferNotes(e.target.value)}
                      placeholder="Optional — any context for the seller" rows={3} />
                  </div>
                  <label className="check-row">
                    <input type="checkbox" required />
                    I can fund escrow within 24 hours.
                  </label>
                  {offerError && <p style={{ color: 'var(--danger)', fontSize: '0.8125rem' }}>{offerError}</p>}
                  <button type="submit" disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Submit Offer'}
                  </button>
                </form>
              )
            )}

            {activeTab === 'Activity' && unlocked && (
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                Activity log is visible to the approved buyer and seller only.
              </p>
            )}
          </div>
        </div>

        {/* CTA sidebar */}
        <aside className="cta-panel">
          <div className="ld-access-header" style={{ borderColor: accentColor }}>
            <StatusPill status={unlocked ? 'approved' : request?.sellerDecision || 'locked'} />
            <h4>Access Requirements</h4>
            <p>Complete all steps to unlock documents and submit an offer.</p>
          </div>

          <div className="access-checklist">
            <div className="cta-step-row">
              <span className={`cta-step-dot${request?.ndaSigned ? ' done' : ''}`}>
                {request?.ndaSigned ? '✓' : '1'}
              </span>
              <div>
                <p className="cta-step-label">Sign NDA</p>
                <p className="cta-step-sub">Platform mutual non-disclosure</p>
              </div>
            </div>
            <div className="cta-step-row">
              <span className={`cta-step-dot${request?.proofOfFundsStatus === 'verified' ? ' done' : ''}`}>
                {request?.proofOfFundsStatus === 'verified' ? '✓' : '2'}
              </span>
              <div>
                <p className="cta-step-label">Proof of Funds</p>
                <p className="cta-step-sub">Deposit or wallet attestation</p>
              </div>
            </div>
            <div className="cta-step-row">
              <span className={`cta-step-dot${request?.sellerDecision === 'approved' ? ' done' : ''}`}>
                {request?.sellerDecision === 'approved' ? '✓' : '3'}
              </span>
              <div>
                <p className="cta-step-label">Seller Approval</p>
                <p className="cta-step-sub">Seller reviews your profile</p>
              </div>
            </div>
          </div>

          <button className="cta-panel-btn" onClick={handleRequestAccess} disabled={Boolean(request) || connecting}>
            {request ? 'Request Submitted' : connecting ? 'Connecting…' : !isConnected ? 'Connect Wallet →' : 'Request Access →'}
          </button>

          {request && (
            <div className="callout">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span>Decision</span>
                <strong style={{ textTransform: 'capitalize' }}>{request.sellerDecision}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginTop: '0.3125rem' }}>
                <span>Proof of Funds</span>
                <strong style={{ textTransform: 'capitalize' }}>{request.proofOfFundsStatus}</strong>
              </div>
            </div>
          )}
        </aside>
      </div>

      {showModal && (
        <RequestAccessModal
          onClose={() => setShowModal(false)}
          onSubmit={({ ndaSigned, proofMethod, proofAmountUSDC, proofTxId }) =>
            requestAccess({ listingId, ndaSigned, proofMethod, proofAmountUSDC, proofTxId })
          }
        />
      )}
    </section>
  );
}
