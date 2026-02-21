import { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import RequestAccessModal from '../components/RequestAccessModal';
import StatusPill from '../components/StatusPill';
import { listingsApi } from '../api/client';
import { useMarket } from '../context/MarketContext';
import { useWallet } from '../context/WalletContext';

const lockedTabs = ['Overview', 'Metrics', 'Process', 'Q&A'];
const unlockedTabs = ['Overview', 'Financials', 'Documents', 'Offers', 'Activity'];

const ACCESS_TABS = {
  'Level 1':   ['Overview', 'Financials'],
  'Level 2':   ['Overview', 'Financials', 'Documents'],
  'Shortlist': ['Overview', 'Financials', 'Documents', 'Offers', 'Activity'],
};

// What the access level label means to display in the sidebar
const ACCESS_LEVEL_DESC = {
  'Level 1':   'Financials only',
  'Level 2':   'Financials + Documents',
  'Shortlist': 'Full access — can submit offer',
};

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
  const { listings, accessRequests, offers, activeUser, requestAccess, submitOffer, updateListing } = useMarket();
  const { isConnected, connecting, connect } = useWallet();
  const [listingDetail, setListingDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const baseListing = listings.find((l) => l.id === listingId);
  const listing = listingDetail || baseListing;
  const myOffer = offers.find((o) => o.listingId === listingId);

  const isSeller = listing?.sellerId === activeUser?.id;
  const request = !isSeller && accessRequests.find((r) => r.listingId === listingId && r.buyerId === activeUser.id);
  // accessLevel: null = no access, 'Level 1' / 'Level 2' / 'Shortlist'
  const accessLevel = isSeller
    ? 'Shortlist'
    : (request?.sellerDecision === 'approved' ? (request.accessLevel || 'Level 1') : null);
  const unlocked = !!accessLevel;

  const { state: navState } = useLocation();
  const tabs = isSeller ? unlockedTabs : (ACCESS_TABS[accessLevel] || lockedTabs);
  const [activeTab, setActiveTab] = useState(() => {
    const requested = navState?.tab;
    return requested && tabs.includes(requested) ? requested : tabs[0];
  });
  const [showModal, setShowModal] = useState(false);

  const [offerAmount, setOfferAmount] = useState(0);
  const [dealType, setDealType] = useState('asset sale');
  const [diligencePeriod, setDiligencePeriod] = useState(14);
  const [closeWindow, setCloseWindow] = useState('30 days');
  const [offerNotes, setOfferNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [offerError, setOfferError] = useState('');

  // Seller — financials editor
  const [editingFinancials, setEditingFinancials] = useState(false);
  const [finForm, setFinForm] = useState(null); // populated on open
  const [savingFin, setSavingFin] = useState(false);

  // Seller — document upload state
  const [savingDocs, setSavingDocs] = useState(false);

  const timeline = useMemo(
    () => ['Request Access + NDA', 'Proof of Funds', 'Seller Approval', 'Submit Offer', 'USDC Escrow + Transfer'],
    []
  );

  useEffect(() => {
    if (!tabs.includes(activeTab)) setActiveTab(tabs[0]);
  }, [tabs, activeTab]);

  useEffect(() => {
    let cancelled = false;
    if (!listingId) return undefined;

    setLoadingDetail(true);
    listingsApi.get(listingId)
      .then((detail) => {
        if (cancelled) return;
        setListingDetail(detail);
      })
      .catch(() => {
        if (cancelled) return;
        setListingDetail(null);
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingDetail(false);
      });

    return () => {
      cancelled = true;
    };
  }, [listingId, activeUser?.id]);

  async function handleRequestAccess() {
    if (!isConnected) {
      const acct = await connect();
      if (!acct) return;
    }
    setShowModal(true);
  }

  if (!listing && loadingDetail) return <p>Loading listing…</p>;
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
              isSeller && editingFinancials ? (
                <form
                  style={{ display: 'grid', gap: '1rem' }}
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setSavingFin(true);
                    try {
                      const updated = await updateListing(listingId, {
                        full_financials: {
                          ttmRevenue: finForm.ttmRevenue,
                          ttmProfit:  finForm.ttmProfit,
                          momTrend:   finForm.momTrend.split(',').map((s) => s.trim()).filter(Boolean),
                          cacLtv:     finForm.cacLtv,
                          churn:      finForm.churn,
                        },
                      });
                      setListingDetail(updated);
                      setEditingFinancials(false);
                    } finally {
                      setSavingFin(false);
                    }
                  }}
                >
                  {[
                    { key: 'ttmRevenue', label: 'TTM Revenue', placeholder: 'e.g. $420K' },
                    { key: 'ttmProfit',  label: 'TTM Profit',  placeholder: 'e.g. $140K' },
                    { key: 'momTrend',   label: 'MoM Growth (comma-separated)', placeholder: 'e.g. +4%, +6%, +3%' },
                    { key: 'cacLtv',     label: 'CAC / LTV',   placeholder: 'e.g. $120 / $980' },
                    { key: 'churn',      label: 'Churn',        placeholder: 'e.g. 1.8%' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key} className="form-field">
                      <label className="form-label">{label}</label>
                      <input
                        value={finForm[key]}
                        onChange={(e) => setFinForm((f) => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder}
                      />
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" disabled={savingFin}>{savingFin ? 'Saving…' : 'Save'}</button>
                    <button type="button" className="ghost" onClick={() => setEditingFinancials(false)}>Cancel</button>
                  </div>
                </form>
              ) : !listing.fullFinancials ? (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>No financial details added yet.</p>
                  {isSeller && (
                    <button
                      style={{ justifySelf: 'start' }}
                      onClick={() => { setFinForm({ ttmRevenue: '', ttmProfit: '', momTrend: '', cacLtv: '', churn: '' }); setEditingFinancials(true); }}
                    >
                      + Add Financials
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
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
                        {listing.fullFinancials.momTrend?.join('  ·  ') || '—'}
                      </p>
                    </article>
                    <article className="card compact">
                      <h4>CAC/LTV · Churn</h4>
                      <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {listing.fullFinancials.cacLtv} &nbsp;·&nbsp; {listing.fullFinancials.churn}
                      </p>
                    </article>
                  </div>
                  {isSeller && (
                    <button
                      className="ghost"
                      style={{ justifySelf: 'start', fontSize: '0.8125rem', padding: '0.25rem 0.625rem' }}
                      onClick={() => {
                        const f = listing.fullFinancials;
                        setFinForm({
                          ttmRevenue: f.ttmRevenue || '',
                          ttmProfit:  f.ttmProfit  || '',
                          momTrend:   (f.momTrend || []).join(', '),
                          cacLtv:     f.cacLtv    || '',
                          churn:      f.churn     || '',
                        });
                        setEditingFinancials(true);
                      }}
                    >
                      Edit Financials
                    </button>
                  )}
                </div>
              )
            )}

            {activeTab === 'Documents' && unlocked && (() => {
              const folders = listing.dataroomFolders ?? {};
              const allGroupNames = ['Financial', 'Business Operations', 'Technical', 'Legal'];

              async function addFileToFolder(folderName, file) {
                setSavingDocs(true);
                try {
                  const updated = { ...folders };
                  updated[folderName] = [...(updated[folderName] || []), file.name];
                  const next = await updateListing(listingId, { dataroom_folders: updated });
                  setListingDetail(next);
                } finally {
                  setSavingDocs(false);
                }
              }

              async function removeFileFromFolder(folderName, fileName) {
                setSavingDocs(true);
                try {
                  const updated = { ...folders };
                  updated[folderName] = (updated[folderName] || []).filter((f) => f !== fileName);
                  if (!updated[folderName].length) delete updated[folderName];
                  const next = await updateListing(listingId, { dataroom_folders: updated });
                  setListingDetail(next);
                } finally {
                  setSavingDocs(false);
                }
              }

              const hasDocs = Object.keys(folders).length > 0;

              return (
                <div className="folder-list">
                  {(isSeller ? allGroupNames : Object.keys(folders)).map((folderName) => {
                    const files = folders[folderName] || [];
                    if (!isSeller && files.length === 0) return null;
                    return (
                      <div key={folderName} className="folder">
                        <h4>{folderName}</h4>
                        {files.map((file) => (
                          <div key={file} className="file-row">
                            <span>{file}</span>
                            {isSeller ? (
                              <button
                                className="ghost"
                                style={{ fontSize: '0.75rem', padding: '0.125rem 0.375rem', color: 'var(--muted)' }}
                                disabled={savingDocs}
                                onClick={() => removeFileFromFolder(folderName, file)}
                              >
                                Remove
                              </button>
                            ) : (
                              <>
                                <span style={{ color: 'var(--muted-light)', fontSize: '0.75rem' }}>Feb 11, 2026</span>
                                <button className="ghost" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>View</button>
                              </>
                            )}
                          </div>
                        ))}
                        {isSeller && (
                          <label className="doc-upload-btn" style={{ marginTop: files.length ? '0.5rem' : 0 }}>
                            <input
                              type="file"
                              style={{ display: 'none' }}
                              disabled={savingDocs}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) addFileToFolder(folderName, f);
                                e.target.value = '';
                              }}
                            />
                            {savingDocs ? 'Saving…' : '+ Add file'}
                          </label>
                        )}
                      </div>
                    );
                  })}
                  {!isSeller && !hasDocs && (
                    <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>No documents uploaded yet.</p>
                  )}
                </div>
              );
            })()}

            {activeTab === 'Offers' && unlocked && (
              isSeller ? (
                offers.filter((o) => o.listingId === listingId).length === 0 ? (
                  <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>No offers received yet.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {offers.filter((o) => o.listingId === listingId).map((o) => (
                      <div key={o.id} className="callout" style={{ display: 'grid', gap: '0.375rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                          <span style={{ color: 'var(--muted)' }}>Amount</span>
                          <strong>{o.amountUSDC?.toLocaleString()} USDC</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                          <span style={{ color: 'var(--muted)' }}>Status</span>
                          <strong style={{ textTransform: 'capitalize' }}>{o.status}</strong>
                        </div>
                        {o.terms?.dealType && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                            <span style={{ color: 'var(--muted)' }}>Deal type</span>
                            <strong style={{ textTransform: 'capitalize' }}>{o.terms.dealType}</strong>
                          </div>
                        )}
                        {o.notes && (
                          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem', borderTop: '1px solid var(--line)', paddingTop: '0.375rem' }}>
                            {o.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )
              ) : myOffer ? (
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
          {isSeller ? (
            <div className="ld-access-header" style={{ borderColor: accentColor }}>
              <StatusPill status={listing.status} />
              <h4>Your Listing</h4>
              <p>You have full access as the listing owner.</p>
              <div style={{ display: 'grid', gap: '0.375rem', marginTop: '0.75rem', fontSize: '0.8125rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Access requests</span>
                  <strong>{accessRequests.filter((r) => r.listingId === listingId).length}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Offers received</span>
                  <strong>{offers.filter((o) => o.listingId === listingId).length}</strong>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="ld-access-header" style={{ borderColor: accentColor }}>
                <StatusPill status={accessLevel || request?.sellerDecision || 'locked'} />
                <h4>Access Requirements</h4>
                <p>
                  {accessLevel
                    ? ACCESS_LEVEL_DESC[accessLevel]
                    : 'Complete all steps to request access from the seller.'}
                </p>
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
                  <span className={`cta-step-dot${accessLevel ? ' done' : ''}`}>
                    {accessLevel ? '✓' : '3'}
                  </span>
                  <div>
                    <p className="cta-step-label">Seller Approval</p>
                    <p className="cta-step-sub">
                      {accessLevel ? `Granted: ${accessLevel}` : 'Seller reviews your profile'}
                    </p>
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
                  {accessLevel && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginTop: '0.3125rem' }}>
                      <span>Access Level</span>
                      <strong>{accessLevel}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginTop: '0.3125rem' }}>
                    <span>Proof of Funds</span>
                    <strong style={{ textTransform: 'capitalize' }}>{request.proofOfFundsStatus}</strong>
                  </div>
                </div>
              )}
            </>
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
