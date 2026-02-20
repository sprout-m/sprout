import { useLocation, useNavigate } from 'react-router-dom';
import { useMarket } from '../context/MarketContext';
import StatusPill from '../components/StatusPill';

function OfferCard({ offer, listingName, pof, onShortlist, onAccept, onReject }) {
  const isActive = offer.status === 'submitted' || offer.status === 'shortlisted';
  const isAccepted = offer.status === 'accepted';

  return (
    <div className="req-card">
      <div className="req-card-head">
        <div>
          <span className="req-card-listing">{listingName}</span>
          <span className="req-card-date">{offer.terms.dealType}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
          <span className="offer-amount-pill">{offer.amountUSDC.toLocaleString()} USDC</span>
          <StatusPill status={offer.status} />
        </div>
      </div>

      <div className="req-card-meta">
        <span className="req-badge">Diligence: {offer.terms.diligencePeriod}</span>
        <span className="req-badge">Close: {offer.terms.closeWindow}</span>
        {pof && (
          <>
            <span className={`req-badge ${pof.proofOfFundsStatus === 'verified' ? 'req-badge--ok' : ''}`}>
              PoF: {pof.proofAmountUSDC?.toLocaleString()} USDC
            </span>
            <span className={`req-badge ${pof.ndaSigned ? 'req-badge--ok' : 'req-badge--warn'}`}>
              {pof.ndaSigned ? '✓ NDA Signed' : '! NDA Missing'}
            </span>
          </>
        )}
      </div>

      {(isActive || isAccepted) && (
        <div className={`req-card-actions${isAccepted ? ' req-card-actions--decided' : ''}`}>
          {isActive ? (
            <>
              {offer.status === 'submitted' && (
                <button className="ghost" onClick={onShortlist}>Shortlist</button>
              )}
              <button onClick={onAccept}>Accept</button>
              <button className="ghost" onClick={onReject}>Reject</button>
            </>
          ) : (
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ok)' }}>
              Escrow opened — go to Closing
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function SellerOffersBoardPage() {
  const { offers, listings, users, updateOfferStatus, accessRequests } = useMarket();
  const navigate = useNavigate();
  const location = useLocation();

  const filterListingId = location.state?.listingId ?? null;
  const filterListing = filterListingId ? listings.find((l) => l.id === filterListingId) : null;

  const listingName = (id) => listings.find((l) => l.id === id)?.anonymizedName || id;
  const getPof = (listingId, buyerId) =>
    accessRequests.find((r) => r.listingId === listingId && r.buyerId === buyerId);

  const filtered = filterListingId ? offers.filter((o) => o.listingId === filterListingId) : offers;
  const active = filtered.filter((o) => o.status === 'submitted' || o.status === 'shortlisted');
  const decided = filtered.filter((o) => o.status === 'accepted' || o.status === 'rejected');
  const hasBoth = active.length > 0 && decided.length > 0;

  const handlers = (offer) => ({
    onShortlist: () => updateOfferStatus({ offerId: offer.offerId, status: 'shortlisted' }),
    onAccept: () => updateOfferStatus({ offerId: offer.offerId, status: 'accepted' }),
    onReject: () => updateOfferStatus({ offerId: offer.offerId, status: 'rejected' }),
  });

  return (
    <section>
      <div className="page-header">
        <h2>Offers</h2>
        <p>Review and act on inbound offers from approved buyers.</p>
      </div>

      {filterListing && (
        <div className="filter-banner">
          <span>Filtered: <strong>{filterListing.anonymizedName}</strong></span>
          <button className="ghost" onClick={() => navigate('/app/seller/offers', { replace: true, state: {} })}>
            Clear filter
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card empty-center">
          <p>No offers{filterListing ? ' for this listing' : ' yet'}</p>
          <p>{filterListing ? 'No buyers have submitted offers on this listing.' : 'Offers from approved buyers will appear here.'}</p>
        </div>
      ) : (
        <div className="req-list">
          {active.length > 0 && (
            <div className="req-group">
              {hasBoth && <div className="req-section-label">Needs Action · {active.length}</div>}
              {active.map((o) => (
                <OfferCard
                  key={o.offerId}
                  offer={o}
                  listingName={listingName(o.listingId)}
                  pof={getPof(o.listingId, o.buyerId)}
                  {...handlers(o)}
                />
              ))}
            </div>
          )}
          {decided.length > 0 && (
            <div className="req-group">
              {hasBoth && <div className="req-section-label">Decided · {decided.length}</div>}
              {decided.map((o) => (
                <OfferCard
                  key={o.offerId}
                  offer={o}
                  listingName={listingName(o.listingId)}
                  pof={getPof(o.listingId, o.buyerId)}
                  {...handlers(o)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
