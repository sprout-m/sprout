import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMarket } from '../context/MarketContext';
import StatusPill from '../components/StatusPill';

const ACCESS_LEVEL_OPTIONS = [
  { value: 'Level 1', label: 'Level 1 - Overview + Financials + Offers' },
  { value: 'Level 2', label: 'Level 2 - Overview + Financials + Documents + Offers' },
  { value: 'Shortlist', label: 'Shortlist - Full access (includes Offers + Activity)' },
];

function RequestCard({
  request, level, onLevelChange, onApprove, onReject, onUpdateLevel, onMessage,
  updatingLevel, levelFeedback, canUpdateLevel
}) {
  const isPending = request.sellerDecision === 'pending';
  const isApproved = request.sellerDecision === 'approved';

  return (
    <div className="req-card">
      <div className="req-card-head">
        <div>
          <span className="req-card-listing">{request.listingName}</span>
          <span className="req-card-date">Submitted {request.requestedAt}</span>
        </div>
        <StatusPill status={request.sellerDecision} />
      </div>

      <div className="req-card-meta">
        <span className="req-buyer-pill">
          <span className="req-buyer-avatar">{request.buyerHandle[0]?.toUpperCase()}</span>
          <span className="req-buyer-name">{request.buyerHandle}</span>
        </span>
        <span className={`req-badge ${request.ndaSigned ? 'req-badge--ok' : 'req-badge--warn'}`}>
          {request.ndaSigned ? '✓ NDA Signed' : '! NDA Missing'}
        </span>
        <span className={`req-badge ${request.proofOfFundsStatus === 'verified' ? 'req-badge--ok' : ''}`}>
          {request.proofAmountUSDC.toLocaleString()} USDC
          {request.proofOfFundsStatus === 'verified' ? ' · Verified' : ' · Pending'}
        </span>
        {isApproved && request.accessLevel && (
          <span className="req-badge">{request.accessLevel}</span>
        )}
      </div>

      {(isPending || isApproved) && (
        <div className="req-card-actions">
          {isPending ? (
            <>
              <span className="req-action-label">Grant level</span>
              <select value={level} onChange={(e) => onLevelChange(e.target.value)}>
                {ACCESS_LEVEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <button onClick={onApprove}>Approve</button>
              <button className="ghost" onClick={onReject}>Reject</button>
            </>
          ) : (
            <>
              <span className="req-action-label">Access level</span>
              <select value={level} onChange={(e) => onLevelChange(e.target.value)}>
                {ACCESS_LEVEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <button onClick={onUpdateLevel} disabled={updatingLevel || !canUpdateLevel}>
                {updatingLevel ? 'Updating…' : 'Update Level'}
              </button>
              {levelFeedback && (
                <span className={`req-action-feedback req-action-feedback--${levelFeedback.type}`}>
                  {levelFeedback.message}
                </span>
              )}
              <button
                className="ghost"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem' }}
                onClick={onMessage}
              >
                Message Buyer
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function SellerRequestsPage() {
  const { accessRequests, decideAccess, listings, userCache } = useMarket();
  const navigate = useNavigate();
  const location = useLocation();
  const [levels, setLevels] = useState({});
  const [updatingLevels, setUpdatingLevels] = useState({});
  const [levelFeedback, setLevelFeedback] = useState({});

  const filterListingId = location.state?.listingId ?? null;
  const filterListing = filterListingId ? listings.find((l) => l.id === filterListingId) : null;

  const enriched = accessRequests
    .filter((r) => !filterListingId || r.listingId === filterListingId)
    .map((r) => ({
      ...r,
      listingName: listings.find((l) => l.id === r.listingId)?.anonymizedName || r.listingId,
      buyerHandle: userCache[r.buyerId]?.handle || r.buyerId?.slice(0, 8) || r.buyerId
    }));

  const pending = enriched.filter((r) => r.sellerDecision === 'pending');
  const decided = enriched.filter((r) => r.sellerDecision !== 'pending');
  const hasBoth = pending.length > 0 && decided.length > 0;

  function makeHandlers(request) {
    const level = levels[request.id] || request.accessLevel || 'Level 1';
    const currentLevel = request.accessLevel || 'Level 1';
    const canUpdateLevel = level !== currentLevel;

    return {
      level,
      canUpdateLevel,
      updatingLevel: !!updatingLevels[request.id],
      levelFeedback: levelFeedback[request.id] || null,
      onLevelChange: (val) => {
        setLevels((prev) => ({ ...prev, [request.id]: val }));
        setLevelFeedback((prev) => ({ ...prev, [request.id]: null }));
      },
      onApprove: () => decideAccess({ requestId: request.id, decision: 'approved', accessLevel: level }),
      onUpdateLevel: async () => {
        if (!canUpdateLevel) return;
        setUpdatingLevels((prev) => ({ ...prev, [request.id]: true }));
        setLevelFeedback((prev) => ({ ...prev, [request.id]: null }));
        try {
          await decideAccess({ requestId: request.id, decision: 'approved', accessLevel: level });
          setLevelFeedback((prev) => ({
            ...prev,
            [request.id]: { type: 'success', message: `Updated to ${level}` },
          }));
          setTimeout(() => {
            setLevelFeedback((prev) => ({ ...prev, [request.id]: null }));
          }, 2200);
        } catch (err) {
          setLevelFeedback((prev) => ({
            ...prev,
            [request.id]: { type: 'error', message: err?.message || 'Update failed' },
          }));
        } finally {
          setUpdatingLevels((prev) => ({ ...prev, [request.id]: false }));
        }
      },
      onReject: () => decideAccess({ requestId: request.id, decision: 'rejected' }),
      onMessage: () => navigate('/app/messages', {
        state: {
          listingId: request.listingId,
          buyerId: request.buyerId,
          sellerId: listings.find((l) => l.id === request.listingId)?.sellerId,
        }
      })
    };
  }

  return (
    <section>
      <div className="page-header">
        <h2>Access Requests</h2>
        <p>Review NDA and proof-of-funds submissions, then approve or reject buyer access.</p>
      </div>

      {filterListing && (
        <div className="filter-banner">
          <span>Filtered: <strong>{filterListing.anonymizedName}</strong></span>
          <button className="ghost" onClick={() => navigate('/app/seller/requests', { replace: true, state: {} })}>
            Clear filter
          </button>
        </div>
      )}

      {enriched.length === 0 ? (
        <div className="card">
          <div className="empty-center">
            <p>No requests{filterListing ? ' for this listing' : ' yet'}</p>
            <p>{filterListing ? 'No buyers have requested access to this listing.' : 'Buyer access requests will appear here.'}</p>
          </div>
        </div>
      ) : (
        <div className="req-list">
          {pending.length > 0 && (
            <div className="req-group">
              {hasBoth && <div className="req-section-label">Needs Review · {pending.length}</div>}
              {pending.map((r) => <RequestCard key={r.id} request={r} {...makeHandlers(r)} />)}
            </div>
          )}
          {decided.length > 0 && (
            <div className="req-group">
              {hasBoth && <div className="req-section-label">Decided · {decided.length}</div>}
              {decided.map((r) => <RequestCard key={r.id} request={r} {...makeHandlers(r)} />)}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
