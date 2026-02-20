import { useState } from 'react';
import { useMarket } from '../context/MarketContext';
import StatusPill from '../components/StatusPill';

const STATUS_FILTERS = ['all', 'live', 'draft'];

export default function OperatorListingsPage() {
  const { adminListings, adminToggleListingStatus, adminVerifyListing } = useMarket();
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);

  const filtered = adminListings.filter((l) => {
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      l.anonymized_name.toLowerCase().includes(q) ||
      l.seller_handle.toLowerCase().includes(q) ||
      l.category.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  async function handleToggleStatus(listing) {
    setTogglingId(listing.id);
    try {
      await adminToggleListingStatus(listing);
    } finally {
      setTogglingId(null);
    }
  }

  async function handleVerify(listing) {
    setVerifyingId(listing.id);
    try {
      await adminVerifyListing(listing.id, !listing.verified);
    } finally {
      setVerifyingId(null);
    }
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>All Listings</h2>
          <p>Manage status and verification across all seller listings.</p>
        </div>
        <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
          {adminListings.length} total
        </span>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <input
          style={{
            flex: '1 1 200px', maxWidth: '280px',
            background: 'var(--surface)', border: '1px solid var(--line)',
            borderRadius: '6px', padding: '0.4rem 0.75rem',
            color: 'var(--text)', fontSize: '0.875rem',
          }}
          placeholder="Search listings or seller…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="ob-chip-grid" style={{ margin: 0 }}>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              className={`ob-chip${statusFilter === s ? ' ob-chip--active' : ''}`}
              onClick={() => setStatusFilter(s)}
              style={{ textTransform: 'capitalize' }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-center">
          <p style={{ color: 'var(--muted)' }}>No listings match the current filter.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Listing</th>
                <th>Seller</th>
                <th>Status</th>
                <th>Verified</th>
                <th>Asking</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id}>
                  <td>
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{l.anonymized_name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{l.category}</p>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>@{l.seller_handle}</td>
                  <td>
                    <StatusPill status={l.status} />
                  </td>
                  <td>
                    {l.verified ? (
                      <span style={{ fontSize: '0.8125rem', color: '#10b981', fontWeight: 600 }}>✓ Vetted</span>
                    ) : (
                      <span style={{ fontSize: '0.8125rem', color: 'var(--muted-light)' }}>—</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                    {l.asking_range || <span style={{ color: 'var(--muted-light)' }}>—</span>}
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                    {new Date(l.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="actions-row">
                      <button
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', opacity: togglingId === l.id ? 0.5 : 1 }}
                        disabled={togglingId === l.id}
                        onClick={() => handleToggleStatus(l)}
                      >
                        {l.status === 'live' ? 'Unpublish' : 'Go Live'}
                      </button>
                      <button
                        className="ghost"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', opacity: verifyingId === l.id ? 0.5 : 1 }}
                        disabled={verifyingId === l.id}
                        onClick={() => handleVerify(l)}
                      >
                        {l.verified ? 'Unverify' : 'Verify'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
