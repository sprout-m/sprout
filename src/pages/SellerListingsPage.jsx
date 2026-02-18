import { useMarket } from '../context/MarketContext';
import StatusPill from '../components/StatusPill';

export default function SellerListingsPage() {
  const { listings, accessRequests, offers } = useMarket();

  const countRequests = (listingId) => accessRequests.filter((r) => r.listingId === listingId).length;
  const countOffers = (listingId) => offers.filter((o) => o.listingId === listingId).length;

  return (
    <section>
      <div className="page-header">
        <h2>Listings</h2>
        <p>Manage listing status, data room readiness, and in-flight demand.</p>
      </div>

      <div className="market-stats">
        <div className="stat-chip">
          <strong>{listings.length}</strong>
          <span>Active Listings</span>
        </div>
        <div className="stat-chip">
          <strong>{accessRequests.length}</strong>
          <span>Access Requests</span>
        </div>
        <div className="stat-chip">
          <strong>{offers.length}</strong>
          <span>Offers Received</span>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Listing</th>
              <th>Category</th>
              <th>Status</th>
              <th>Requests</th>
              <th>Offers</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => {
              const reqCount = countRequests(listing.id);
              const offerCount = countOffers(listing.id);
              return (
                <tr key={listing.id}>
                  <td>
                    <strong style={{ fontSize: '0.875rem' }}>{listing.anonymizedName}</strong>
                  </td>
                  <td>
                    <span className="cat-label">{listing.category}</span>
                  </td>
                  <td>
                    <StatusPill status={listing.status} />
                  </td>
                  <td>
                    {reqCount > 0
                      ? <span className="col-count">{reqCount}</span>
                      : <span style={{ color: 'var(--muted-light)' }}>—</span>
                    }
                  </td>
                  <td>
                    {offerCount > 0
                      ? <span className="col-count">{offerCount}</span>
                      : <span style={{ color: 'var(--muted-light)' }}>—</span>
                    }
                  </td>
                  <td>
                    <div className="actions-row">
                      <button className="ghost" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                        Data Room
                      </button>
                      <button className="ghost" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                        Requests
                      </button>
                      <button className="ghost" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                        Offers
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
