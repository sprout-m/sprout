import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarket } from '../context/MarketContext';
import StatusPill from '../components/StatusPill';

const CATEGORIES = ['SaaS', 'Ecommerce', 'Media', 'Agency', 'Marketplace', 'Other'];

const INDUSTRY_TAGS = [
  'B2B', 'B2C', 'AI/ML', 'FinTech', 'HealthTech', 'EdTech',
  'Dev Tools', 'Newsletter', 'Podcast', 'D2C', 'Subscription', 'AdTech',
];

const EMPTY_FORM = {
  anonymizedName: '',
  category: '',
  location: '',
  askingRange: '',
  revenueRange: '',
  profitRange: '',
  age: '',
  teaserDescription: '',
  ndaRequired: false,
  industryTags: [],
};

function CreateListingModal({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { createListing } = useMarket();

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const toggleTag = (tag) =>
    setForm((f) => ({
      ...f,
      industryTags: f.industryTags.includes(tag)
        ? f.industryTags.filter((t) => t !== tag)
        : [...f.industryTags, tag],
    }));

  const valid = form.anonymizedName.trim() && form.category;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!valid) return;
    setError('');
    setSaving(true);
    try {
      const listing = await createListing({
        anonymized_name: form.anonymizedName.trim(),
        category: form.category,
        industry_tags: form.industryTags,
        location: form.location.trim(),
        asking_range: form.askingRange.trim(),
        revenue_range: form.revenueRange.trim(),
        profit_range: form.profitRange.trim(),
        age: form.age.trim(),
        teaser_description: form.teaserDescription.trim(),
        nda_required: form.ndaRequired,
      });
      onCreated(listing);
    } catch (err) {
      setError(err.message || 'Failed to create listing');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'var(--surface, #1a1a1a)',
          border: '1px solid var(--line, #2a2a2a)',
          borderRadius: '10px',
          width: '100%', maxWidth: '560px',
          maxHeight: '90vh', overflowY: 'auto',
          padding: '1.75rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>New Listing</h2>
          <button
            className="ghost"
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          {/* Listing name */}
          <div className="ob-field">
            <label className="ob-field-label">
              Listing name <span style={{ color: 'var(--danger, #e55)' }}>*</span>
            </label>
            <input
              className="ob-field-input"
              placeholder="e.g. Anonymous SaaS Co."
              value={form.anonymizedName}
              onChange={(e) => set('anonymizedName', e.target.value)}
              autoFocus
              required
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
              Shown to all buyers — keep it anonymous.
            </p>
          </div>

          {/* Category */}
          <div className="ob-field">
            <label className="ob-field-label">
              Category <span style={{ color: 'var(--danger, #e55)' }}>*</span>
            </label>
            <select
              className="ob-field-input"
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              required
            >
              <option value="">Select a category…</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Industry tags */}
          <div className="ob-field">
            <label className="ob-field-label">Industry tags</label>
            <div className="ob-chip-grid" style={{ marginTop: '0.5rem' }}>
              {INDUSTRY_TAGS.map((tag) => {
                const selected = form.industryTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`ob-chip${selected ? ' ob-chip--active' : ''}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {selected && (
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Two-column grid for ranges */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="ob-field">
              <label className="ob-field-label">Asking range</label>
              <input
                className="ob-field-input"
                placeholder="e.g. $500K – $750K"
                value={form.askingRange}
                onChange={(e) => set('askingRange', e.target.value)}
              />
            </div>
            <div className="ob-field">
              <label className="ob-field-label">Revenue range</label>
              <input
                className="ob-field-input"
                placeholder="e.g. $200K – $300K ARR"
                value={form.revenueRange}
                onChange={(e) => set('revenueRange', e.target.value)}
              />
            </div>
            <div className="ob-field">
              <label className="ob-field-label">Profit range</label>
              <input
                className="ob-field-input"
                placeholder="e.g. $80K – $120K"
                value={form.profitRange}
                onChange={(e) => set('profitRange', e.target.value)}
              />
            </div>
            <div className="ob-field">
              <label className="ob-field-label">Business age</label>
              <input
                className="ob-field-input"
                placeholder="e.g. 3 years"
                value={form.age}
                onChange={(e) => set('age', e.target.value)}
              />
            </div>
          </div>

          <div className="ob-field">
            <label className="ob-field-label">Location</label>
            <input
              className="ob-field-input"
              placeholder="e.g. United States"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
            />
          </div>

          {/* Teaser description */}
          <div className="ob-field">
            <label className="ob-field-label">Teaser description</label>
            <textarea
              className="ob-field-input"
              rows={4}
              placeholder="A brief, anonymous description shown to all buyers on the marketplace…"
              value={form.teaserDescription}
              onChange={(e) => set('teaserDescription', e.target.value)}
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          {/* NDA required */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
            <input
              type="checkbox"
              checked={form.ndaRequired}
              onChange={(e) => set('ndaRequired', e.target.checked)}
              style={{ width: '1rem', height: '1rem', accentColor: 'var(--accent, #6366f1)' }}
            />
            Require NDA before buyers can request access
          </label>

          {error && (
            <p style={{ color: 'var(--danger, #e55)', fontSize: '0.8125rem' }}>{error}</p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
            <button type="button" className="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" disabled={!valid || saving}>
              {saving ? 'Publishing…' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SellerListingsPage() {
  const { listings, accessRequests, offers, user } = useMarket();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);

  // Only show this seller's own listings
  const myListings = listings.filter((l) => l.sellerId === user?.id);

  const countRequests = (listingId) => accessRequests.filter((r) => r.listingId === listingId).length;
  const countOffers = (listingId) => offers.filter((o) => o.listingId === listingId).length;

  return (
    <section>
      {showCreate && (
        <CreateListingModal
          onClose={() => setShowCreate(false)}
          onCreated={() => setShowCreate(false)}
        />
      )}

      <div className="page-header">
        <div>
          <h2>Listings</h2>
          <p>Manage listing status, document readiness, and in-flight demand.</p>
        </div>
        <button onClick={() => setShowCreate(true)}>+ New Listing</button>
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
                        <button
                          className="ghost"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          onClick={() => navigate(`/app/listing/${listing.id}`)}
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
