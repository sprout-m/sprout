import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import RequestAccessModal from '../components/RequestAccessModal';
import StatusPill from '../components/StatusPill';
import { useMarket } from '../context/MarketContext';

const lockedTabs = ['Overview', 'Metrics', 'Process', 'Q&A'];
const unlockedTabs = ['Overview', 'Financials', 'Data Room', 'Offers', 'Activity'];

export default function ListingDetailPage() {
  const { listingId } = useParams();
  const { listings, accessRequests, activeUser, requestAccess, submitOffer } = useMarket();
  const listing = listings.find((l) => l.id === listingId);

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

  const timeline = useMemo(
    () => ['Request Access + NDA', 'Proof of Funds', 'Seller Approval', 'Submit Offer', 'USDC Escrow + Transfer'],
    []
  );

  useEffect(() => {
    if (!tabs.includes(activeTab)) setActiveTab(tabs[0]);
  }, [tabs, activeTab]);

  if (!listing) return <p>Listing not found.</p>;

  return (
    <section>
      <div className="page-header">
        <h2>{listing.anonymizedName}</h2>
        <p>{listing.category} · {listing.location} · {listing.age}</p>
      </div>

      <div className="listing-stats">
        <div className="stat-chip">
          <strong>{listing.askingRange}</strong>
          <span>Asking Range</span>
        </div>
        <div className="stat-chip">
          <strong>{listing.revenueRange}</strong>
          <span>Revenue (MRR)</span>
        </div>
        <div className="stat-chip">
          <strong>{listing.profitRange}</strong>
          <span>Profit Margin</span>
        </div>
        <div className="stat-chip">
          <div style={{ marginBottom: '0.375rem' }}>
            <StatusPill status={unlocked ? 'approved' : request?.sellerDecision || 'locked'} />
          </div>
          <span>Access Status</span>
        </div>
      </div>

      <div className="listing-layout">
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
              <div style={{ display: 'grid', gap: '1rem' }}>
                <p style={{ fontSize: '0.9375rem', lineHeight: 1.65, color: 'var(--text-secondary)' }}>
                  {listing.teaserDescription}
                </p>
                <div className="listing-metrics">
                  <div className="metric">
                    <span>Asking</span>
                    <strong>{listing.askingRange}</strong>
                  </div>
                  <div className="metric">
                    <span>Revenue</span>
                    <strong>{listing.revenueRange}</strong>
                  </div>
                  <div className="metric">
                    <span>Profit</span>
                    <strong>{listing.profitRange}</strong>
                  </div>
                  <div className="metric">
                    <span>Category</span>
                    <strong>{listing.category}</strong>
                  </div>
                </div>
                <div className="badge-row">
                  {listing.verified && <span className="tag">Operator Vetted</span>}
                  {listing.ndaRequired && <span className="tag">NDA Required</span>}
                  <span className="tag">{listing.escrowType} Escrow</span>
                </div>
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

            {activeTab === 'Data Room' && unlocked && (
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
              <form
                className="offer-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitOffer({
                    listingId,
                    amountUSDC: offerAmount,
                    terms: { dealType, diligencePeriod: `${diligencePeriod} days`, closeWindow },
                    notes: offerNotes
                  });
                  setOfferNotes('');
                }}
              >
                <h4>Make an Offer</h4>
                <div className="form-field">
                  <label className="form-label">Offer Amount (USDC)</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    placeholder="e.g. 950000"
                  />
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
                    <input
                      type="number"
                      value={diligencePeriod}
                      onChange={(e) => setDiligencePeriod(e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Close Window</label>
                    <input value={closeWindow} onChange={(e) => setCloseWindow(e.target.value)} />
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">Notes to Seller</label>
                  <textarea
                    value={offerNotes}
                    onChange={(e) => setOfferNotes(e.target.value)}
                    placeholder="Optional — any context for the seller"
                    rows={3}
                  />
                </div>
                <label className="check-row">
                  <input type="checkbox" required />
                  I can fund escrow within 24 hours.
                </label>
                <button type="submit">Submit Offer</button>
              </form>
            )}

            {activeTab === 'Activity' && unlocked && (
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                Activity log is visible to the approved buyer and seller only.
              </p>
            )}
          </div>
        </div>

        <aside className="cta-panel">
          <div>
            <h4>Access Requirements</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
              Complete all three steps to unlock the full data room.
            </p>
          </div>

          <div className="access-checklist">
            <div className="step-row">
              <span className={`step-indicator${request?.ndaSigned ? ' done' : ''}`}>
                {request?.ndaSigned ? '✓' : '1'}
              </span>
              <span style={request?.ndaSigned ? { color: 'var(--ok)' } : {}}>Sign NDA</span>
            </div>
            <div className="step-row">
              <span className={`step-indicator${request?.proofOfFundsStatus === 'verified' ? ' done' : ''}`}>
                {request?.proofOfFundsStatus === 'verified' ? '✓' : '2'}
              </span>
              <span style={request?.proofOfFundsStatus === 'verified' ? { color: 'var(--ok)' } : {}}>
                Proof of Funds
              </span>
            </div>
            <div className="step-row">
              <span className={`step-indicator${request?.sellerDecision === 'approved' ? ' done' : ''}`}>
                {request?.sellerDecision === 'approved' ? '✓' : '3'}
              </span>
              <span style={request?.sellerDecision === 'approved' ? { color: 'var(--ok)' } : {}}>
                Seller Approval
              </span>
            </div>
          </div>

          <button style={{ width: '100%' }} onClick={() => setShowModal(true)} disabled={Boolean(request)}>
            {request ? 'Request Submitted' : 'Request Access'}
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
          onSubmit={({ ndaSigned, proofMethod, proofAmountUSDC }) =>
            requestAccess({ listingId, ndaSigned, proofMethod, proofAmountUSDC })
          }
        />
      )}
    </section>
  );
}
