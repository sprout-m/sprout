import { useMarket } from '../context/MarketContext';

const columns = ['submitted', 'shortlisted', 'accepted', 'rejected'];

const columnLabels = {
  submitted: 'Submitted',
  shortlisted: 'Shortlisted',
  accepted: 'Accepted',
  rejected: 'Rejected'
};

export default function SellerOffersBoardPage() {
  const { offers, listings, updateOfferStatus, accessRequests } = useMarket();
  const listingName = (id) => listings.find((l) => l.id === id)?.anonymizedName || id;
  const getPof = (listingId, buyerId) =>
    accessRequests.find((r) => r.listingId === listingId && r.buyerId === buyerId);

  return (
    <section>
      <div className="page-header">
        <h2>Offers Board</h2>
        <p>Manage inbound offers from submission through acceptance and escrow.</p>
      </div>

      <div className="kanban-grid">
        {columns.map((column) => {
          const columnOffers = offers.filter((offer) => offer.status === column);
          return (
            <div className="kanban-col" key={column}>
              <div className="kanban-col-header">
                <h3>{columnLabels[column]}</h3>
                {columnOffers.length > 0 && (
                  <span className="col-count">{columnOffers.length}</span>
                )}
              </div>

              {columnOffers.length === 0 ? (
                <p className="empty-state">No offers</p>
              ) : (
                columnOffers.map((offer) => {
                  const pof = getPof(offer.listingId, offer.buyerId);
                  return (
                    <article className="card compact" key={offer.offerId} style={{ marginBottom: '0.5rem' }}>
                      <div className="listing-card-head" style={{ marginBottom: '0.125rem' }}>
                        <span className="cat-label">{offer.terms.dealType}</span>
                      </div>

                      <strong className="offer-card-amount">
                        {offer.amountUSDC.toLocaleString()} USDC
                      </strong>

                      <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.125rem' }}>
                        {listingName(offer.listingId)}
                      </p>

                      <div className="offer-card-metrics">
                        <div className="metric">
                          <span>Diligence</span>
                          <strong>{offer.terms.diligencePeriod}</strong>
                        </div>
                        <div className="metric">
                          <span>Close</span>
                          <strong>{offer.terms.closeWindow}</strong>
                        </div>
                        {pof && (
                          <>
                            <div className="metric">
                              <span>PoF</span>
                              <strong>{pof.proofAmountUSDC?.toLocaleString()} USDC</strong>
                            </div>
                            <div className="metric">
                              <span>NDA</span>
                              <strong>{pof.ndaSigned ? 'Signed' : 'Missing'}</strong>
                            </div>
                          </>
                        )}
                      </div>

                      {(column === 'submitted' || column === 'shortlisted') && (
                        <div className="actions-row">
                          {column === 'submitted' && (
                            <button
                              className="ghost"
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                              onClick={() => updateOfferStatus({ offerId: offer.offerId, status: 'shortlisted' })}
                            >
                              Shortlist
                            </button>
                          )}
                          <button
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                            onClick={() => updateOfferStatus({ offerId: offer.offerId, status: 'accepted' })}
                          >
                            Accept
                          </button>
                          <button
                            className="ghost"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                            onClick={() => updateOfferStatus({ offerId: offer.offerId, status: 'rejected' })}
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {column === 'accepted' && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--ok)', fontWeight: 600, marginTop: '0.375rem' }}>
                          Escrow opened →
                        </p>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
