import { Link, useNavigate } from 'react-router-dom';
import { useMarket } from '../context/MarketContext';
import StatusPill from '../components/StatusPill';

function DealCard({ title, children, count }) {
  return (
    <article className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        {count > 0 && <span className="col-count">{count}</span>}
      </div>
      {children}
    </article>
  );
}

export default function MyDealsPage() {
  const navigate = useNavigate();
  const { activeUser, accessRequests, offers, escrows, listings } = useMarket();

  const myRequests = accessRequests.filter((r) => r.buyerId === activeUser.id);
  const myOffers = offers.filter((o) => o.buyerId === activeUser.id);
  const listingOfferIds = offers.map((o) => o.offerId);
  const sellerRequests = accessRequests;
  const sellerOffers = offers;
  const matchedEscrows = escrows.filter((esc) => listingOfferIds.includes(esc.offerId));

  const listingName = (id) => listings.find((l) => l.id === id)?.anonymizedName || id;

  if (activeUser.role !== 'buyer') {
    return (
      <section>
        <div className="page-header">
          <h2>{activeUser.role === 'seller' ? 'Deal Console' : 'Deal Oversight'}</h2>
          <p>
            {activeUser.role === 'seller'
              ? 'Monitor request approvals, offer quality, and escrow readiness.'
              : 'Audit all requests, offers, and escrow activity across Meridian.'}
          </p>
        </div>

        <div className="dashboard-grid">
          <DealCard title="Access Requests" count={sellerRequests.length}>
            {sellerRequests.length === 0 ? (
              <p className="empty-state">No requests yet</p>
            ) : (
              sellerRequests.map((req) => (
                <div className="line-item" key={req.id}>
                  <Link to={`/app/listing/${req.listingId}`} style={{ flex: 1, fontWeight: 500 }}>
                    {listingName(req.listingId)}
                  </Link>
                  <StatusPill status={req.sellerDecision} />
                </div>
              ))
            )}
          </DealCard>

          <DealCard title="Offers" count={sellerOffers.length}>
            {sellerOffers.length === 0 ? (
              <p className="empty-state">No offers yet</p>
            ) : (
              sellerOffers.map((offer) => (
                <div className="line-item" key={offer.offerId}>
                  <Link to={`/app/listing/${offer.listingId}`} style={{ flex: 1, fontWeight: 500 }}>
                    {listingName(offer.listingId)}
                  </Link>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, fontFeatureSettings: "'tnum'", whiteSpace: 'nowrap' }}>
                    {offer.amountUSDC.toLocaleString()} USDC
                  </span>
                  <StatusPill status={offer.status} />
                </div>
              ))
            )}
          </DealCard>

          <DealCard title="Escrows" count={matchedEscrows.length}>
            {matchedEscrows.length === 0 ? (
              <p className="empty-state">No active escrows</p>
            ) : (
              matchedEscrows.map((esc) => (
                <div className="line-item" key={esc.escrowId}>
                  <span style={{ flex: 1, fontWeight: 700, fontFeatureSettings: "'tnum'" }}>
                    {esc.amountUSDC.toLocaleString()} USDC
                  </span>
                  <StatusPill status={esc.status} />
                  <Link to="/app/escrow" className="ghost small-link">Open</Link>
                </div>
              ))
            )}
          </DealCard>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="page-header">
        <h2>My Deals</h2>
        <p>Track your access requests, submitted offers, and escrow milestones.</p>
      </div>

      <div className="dashboard-grid">
        <DealCard title="Access Requests" count={myRequests.length}>
          {myRequests.length === 0 ? (
            <p className="empty-state">No requests submitted yet</p>
          ) : (
            myRequests.map((req) => (
              <div className="line-item" key={req.id}>
                <Link to={`/app/listing/${req.listingId}`} style={{ flex: 1, fontWeight: 500 }}>
                  {listingName(req.listingId)}
                </Link>
                <StatusPill status={req.sellerDecision} />
                {req.sellerDecision === 'approved' && (
                  <button
                    className="ghost small-link"
                    onClick={() =>
                      navigate('/app/messages', {
                        state: {
                          listingId: req.listingId,
                          sellerId: listings.find((l) => l.id === req.listingId)?.sellerId,
                          buyerId: activeUser.id,
                        },
                      })}
                  >
                    Message Seller
                  </button>
                )}
              </div>
            ))
          )}
        </DealCard>

        <DealCard title="Offers" count={myOffers.length}>
          {myOffers.length === 0 ? (
            <p className="empty-state">No offers submitted yet</p>
          ) : (
            myOffers.map((offer) => (
              <div className="line-item" key={offer.offerId}>
                <Link to={`/app/listing/${offer.listingId}`} style={{ flex: 1, fontWeight: 500 }}>
                  {listingName(offer.listingId)}
                </Link>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, fontFeatureSettings: "'tnum'", whiteSpace: 'nowrap' }}>
                  {offer.amountUSDC.toLocaleString()} USDC
                </span>
                <StatusPill status={offer.status} />
              </div>
            ))
          )}
        </DealCard>

        <DealCard title="Escrows" count={escrows.length}>
          {escrows.length === 0 ? (
            <p className="empty-state">No active escrows</p>
          ) : (
            escrows.map((esc) => (
              <div className="line-item" key={esc.escrowId}>
                <span style={{ flex: 1, fontWeight: 700, fontFeatureSettings: "'tnum'" }}>
                  {esc.amountUSDC.toLocaleString()} USDC
                </span>
                <StatusPill status={esc.status} />
                <Link to="/app/escrow" className="ghost small-link">Open</Link>
              </div>
            ))
          )}
        </DealCard>
      </div>
    </section>
  );
}
