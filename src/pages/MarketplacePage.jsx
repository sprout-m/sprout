import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useMarket } from '../context/MarketContext';
import StatusPill from '../components/StatusPill';

const ALL_CATEGORIES = ['SaaS', 'Ecommerce', 'Media', 'Agency', 'Marketplace'];

function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="filter-section">
      <button className="filter-section-header" onClick={() => setOpen((o) => !o)}>
        <span>{title}</span>
        <svg
          className={`filter-chevron${open ? '' : ' collapsed'}`}
          width="11" height="11" viewBox="0 0 12 12" fill="none"
        >
          <path d="M2 4.5L6 8.5L10 4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div className="filter-section-body">{children}</div>}
    </div>
  );
}

export default function MarketplacePage() {
  const { listings } = useMarket();
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
      <div className="market-layout">
        <aside className="card filter-sidebar">
          <FilterSection title="Search">
            <input
              placeholder="Keyword, category, tag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </FilterSection>

          <FilterSection title="Category">
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
          </FilterSection>

          <FilterSection title="Options">
            <label className="check-row">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
              />
              Operator-verified only
            </label>
          </FilterSection>
        </aside>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
              {filtered.length} {filtered.length === 1 ? 'listing' : 'listings'}
            </p>
            {hasActiveFilters && (
              <button
                className="ghost"
                style={{ fontSize: '0.6875rem', padding: '0.125rem 0.5rem' }}
                onClick={() => { setSearch(''); setCategories(new Set()); setVerifiedOnly(false); }}
              >
                Clear all
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="card" style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
              No listings match your filters.
            </div>
          ) : (
            <div className="listings-grid">
              {filtered.map((listing) => (
                <article key={listing.id} className="listing-card">
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
                      <span>Revenue</span>
                      <strong>{listing.revenueRange}</strong>
                    </div>
                    <div className="metric">
                      <span>Margin</span>
                      <strong>{listing.profitRange}</strong>
                    </div>
                    <div className="metric">
                      <span>Established</span>
                      <strong>{listing.age}</strong>
                    </div>
                    <div className="metric">
                      <span>Location</span>
                      <strong>{listing.location}</strong>
                    </div>
                  </div>

                  <div className="listing-card-footer">
                    <div className="listing-card-ask">
                      <span>Asking</span>
                      <strong>{listing.askingRange}</strong>
                    </div>
                    <div className="listing-card-footer-row">
                      <div className="listing-card-tags">
                        {listing.verified && <span className="tag">Vetted</span>}
                        {listing.ndaRequired && <span className="tag">NDA</span>}
                        <span className="tag">{listing.escrowType}</span>
                      </div>
                      <Link className="button-link" style={{ marginLeft: 'auto' }} to={`/listing/${listing.id}`}>
                        View
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
