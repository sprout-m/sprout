import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useMarket } from '../context/MarketContext';
import StatusPill from '../components/StatusPill';

const ALL_CATEGORIES = ['SaaS', 'Ecommerce', 'Media', 'Agency', 'Marketplace'];

const CATEGORY_COLORS = {
  SaaS:        '#6366f1',
  Ecommerce:   '#10b981',
  Media:       '#a855f7',
  Agency:      '#f97316',
  Marketplace: '#06b6d4',
  Other:       '#94a3b8',
};

export default function MarketplacePage() {
  const { listings, accessRequests, activeUser } = useMarket();

  const myRequest = (listingId) =>
    accessRequests.find((r) => r.listingId === listingId && r.buyerId === activeUser.id) ?? null;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState(new Set());
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const toggleCategory = (cat) => {
    setCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const categoryCounts = useMemo(() => {
    const counts = {};
    for (const cat of ALL_CATEGORIES) {
      counts[cat] = listings.filter((l) => l.category === cat).length;
    }
    return counts;
  }, [listings]);

  const filtered = useMemo(() => {
    return listings.filter((listing) => {
      const text = `${listing.anonymizedName} ${listing.category} ${listing.industryTags.join(' ')}`.toLowerCase();
      const searchMatch = text.includes(search.toLowerCase());
      const categoryMatch = categories.size === 0 || categories.has(listing.category);
      const verifiedMatch = !verifiedOnly || listing.verified;
      return searchMatch && categoryMatch && verifiedMatch;
    });
  }, [listings, search, categories, verifiedOnly]);

  const hasActiveFilters = categories.size > 0 || verifiedOnly || search.length > 0;

  return (
    <section>
      <div className={`market-layout${sidebarOpen ? '' : ' market-layout--filters-collapsed'}`}>
        <div className={`filter-sidebar-wrap${sidebarOpen ? '' : ' filter-sidebar-wrap--closed'}`}>
          <aside className="card filter-sidebar">
            <p className="filter-sidebar-heading">Filters</p>

            <input
              placeholder="Search keyword or tag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="filter-group">
              <p className="filter-group-label">Category</p>
              <div className="filter-check-list">
                {ALL_CATEGORIES.map((cat) => (
                  <label key={cat} className="check-row">
                    <input
                      type="checkbox"
                      checked={categories.has(cat)}
                      onChange={() => toggleCategory(cat)}
                    />
                    <span style={{ flex: 1 }}>{cat}</span>
                    <span className="filter-count">{categoryCounts[cat]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <p className="filter-group-label">Options</p>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                />
                Operator-verified only
              </label>
            </div>
          </aside>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
            <button className="ghost filter-toggle-btn" onClick={() => setSidebarOpen((o) => !o)}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="2.5" width="12" height="1.25" rx="0.625" fill="currentColor" />
                <rect x="1" y="6.375" width="8" height="1.25" rx="0.625" fill="currentColor" />
                <rect x="1" y="10.25" width="5" height="1.25" rx="0.625" fill="currentColor" />
              </svg>
              {sidebarOpen ? 'Hide filters' : 'Show filters'}
              {hasActiveFilters && <span className="filter-toggle-dot" />}
            </button>

            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
              {filtered.length} {filtered.length === 1 ? 'listing' : 'listings'}
            </span>

            {hasActiveFilters && (
              <button
                className="ghost"
                style={{ fontSize: '0.6875rem', padding: '0.1875rem 0.5rem', marginLeft: 'auto' }}
                onClick={() => { setSearch(''); setCategories(new Set()); setVerifiedOnly(false); }}
              >
                Clear filters
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="card" style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
              No listings match your filters.
            </div>
          ) : (
            <div className="listings-grid">
              {filtered.map((listing) => {
                const req = myRequest(listing.id);
                const decision = req?.sellerDecision ?? null;
                return (
                  <article
                    key={listing.id}
                    className="listing-card"
                    style={{ '--card-accent': CATEGORY_COLORS[listing.category] || CATEGORY_COLORS.Other }}
                  >
                    <div className="listing-card-head">
                      <span className="cat-label">{listing.category}</span>
                      <StatusPill status={listing.status} />
                    </div>

                    <div>
                      <h3 className="listing-card-title">{listing.anonymizedName}</h3>
                      <p className="listing-card-teaser">{listing.teaserDescription}</p>
                    </div>

                    <div className="listing-metrics">
                      <div className="metric">
                        <span>TTM Revenue</span>
                        <strong>{listing.revenueRange}</strong>
                      </div>
                      <div className="metric">
                        <span>TTM Profit</span>
                        <strong>{listing.profitRange}</strong>
                      </div>
                      <div className="metric">
                        <span>Asking Price</span>
                        <strong>{listing.askingRange}</strong>
                      </div>
                    </div>

                    <div className="listing-card-footer">
                      <div className="listing-card-tags">
                        {listing.verified && <span className="tag">Vetted</span>}
                        {listing.ndaRequired && <span className="tag">NDA</span>}
                        <span className="tag">{listing.escrowType}</span>
                        {listing.location && <span className="tag">{listing.location}</span>}
                      </div>
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {decision === 'pending' && <StatusPill status="pending" />}
                        {decision === 'approved' && <StatusPill status="approved" />}
                        {decision === 'rejected' && <StatusPill status="rejected" />}
                        <Link className="button-link" to={`/app/listing/${listing.id}`}>
                          View
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
