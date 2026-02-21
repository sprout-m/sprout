import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarket } from '../context/MarketContext';
import { useWallet } from '../context/WalletContext';
import StatusPill from '../components/StatusPill';

export default function SellerListingsPage() {
  const { listings, accessRequests, offers, user, updateListing } = useMarket();
  const { isConnected, connecting, connect } = useWallet();
  const navigate = useNavigate();
  const [togglingId, setTogglingId] = useState(null);

  async function handleNewListing() {
    if (!isConnected) {
      const acct = await connect();
      if (!acct) return;
    }
    navigate('/app/seller/listings/new');
  }

  async function toggleStatus(listing) {
    setTogglingId(listing.id);
    try {
      const nextStatus = listing.status === 'live' ? 'draft' : 'live';
      await updateListing(listing.id, { status: nextStatus });
    } finally {
      setTogglingId(null);
    }
  }

  const myListings = listings.filter((l) => l.sellerId === user?.id);
  const countRequests = (listingId) => accessRequests.filter((r) => r.listingId === listingId).length;
  const countOffers   = (listingId) => offers.filter((o) => o.listingId === listingId).length;

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Listings</h2>
          <p>Manage listing status, document readiness, and in-flight demand.</p>
        </div>
        <button onClick={handleNewListing} disabled={connecting}>
          {connecting ? 'Connecting…' : '+ New Listing'}
        </button>
      </div>

      <div className="market-stats">
        <div className="stat-chip">
          <strong>{myListings.length}</strong>
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

      {myListings.length === 0 ? (
        <div className="card empty-center">
          <p>No listings yet</p>
          <p style={{ color: 'var(--muted)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
            Click <strong>+ New Listing</strong> to publish your first business for sale.
          </p>
        </div>
      ) : (
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
              {myListings.map((listing) => {
                const reqCount   = countRequests(listing.id);
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
                        : <span style={{ color: 'var(--muted-light)' }}>—</span>}
                    </td>
                    <td>
                      {offerCount > 0
                        ? <span className="col-count">{offerCount}</span>
                        : <span style={{ color: 'var(--muted-light)' }}>—</span>}
                    </td>
                    <td>
                      <div className="actions-row">
                        <button
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', opacity: togglingId === listing.id ? 0.5 : 1 }}
                          disabled={togglingId === listing.id}
                          onClick={() => toggleStatus(listing)}
                        >
                          {listing.status === 'live' ? 'Unpublish' : 'Go Live'}
                        </button>
                        <button
                          className="ghost"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          onClick={() => navigate(`/app/listing/${listing.id}`, { state: { tab: 'Documents' } })}
                        >
                          Documents
                        </button>
                        <button
                          className="ghost"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          onClick={() => navigate('/app/seller/requests', { state: { listingId: listing.id } })}
                        >
                          Requests
                        </button>
                        <button
                          className="ghost"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          onClick={() => navigate('/app/seller/offers', { state: { listingId: listing.id } })}
                        >
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
      )}
    </section>
  );
}
