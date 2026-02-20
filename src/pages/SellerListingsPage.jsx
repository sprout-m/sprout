import * as Slider from '@radix-ui/react-slider';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarket } from '../context/MarketContext';
import { useWallet } from '../context/WalletContext';
import StatusPill from '../components/StatusPill';

const CATEGORIES = ['SaaS', 'Ecommerce', 'Media', 'Agency', 'Marketplace', 'Other'];

const INDUSTRY_TAGS = [
  'B2B', 'B2C', 'AI/ML', 'FinTech', 'HealthTech', 'EdTech',
  'Dev Tools', 'Newsletter', 'Podcast', 'D2C', 'Subscription', 'AdTech',
];

const DOC_GROUPS = [
  {
    label: 'Financial',
    docs: [
      'P&L Statement (TTM + 3 years)',
      'Balance Sheet',
      'Cash Flow Statement',
      'Tax Returns (3 years)',
      'MRR / ARR Breakdown',
    ],
  },
  {
    label: 'Business Operations',
    docs: [
      'Business Overview / Pitch Deck',
      'Customer List (anonymized)',
      'Vendor & Supplier Contracts',
      'Employee & Contractor Agreements',
    ],
  },
  {
    label: 'Technical',
    docs: [
      'Product Roadmap',
      'Technical Architecture Overview',
      'IP & Patent Documentation',
    ],
  },
  {
    label: 'Legal',
    docs: [
      'Certificate of Incorporation',
      'Cap Table',
      'Litigation History',
    ],
  },
];

function fmtDollars(n) {
  if (n >= 1_000_000) return `$${+(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

function RangeSlider({ label, min, max, step, value, onValueChange, format }) {
  return (
    <div className="ob-field">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
        <label className="ob-field-label" style={{ margin: 0 }}>{label}</label>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text)' }}>
          {format(value[0])} – {format(value[1])}
        </span>
      </div>
      <Slider.Root
        className="rdx-slider"
        min={min} max={max} step={step}
        value={value}
        onValueChange={onValueChange}
        minStepsBetweenThumbs={1}
      >
        <Slider.Track className="rdx-track">
          <Slider.Range className="rdx-range" />
        </Slider.Track>
        <Slider.Thumb className="rdx-thumb" aria-label={`${label} low`} />
        <Slider.Thumb className="rdx-thumb" aria-label={`${label} high`} />
      </Slider.Root>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--muted-light)', marginTop: '0.375rem' }}>
        <span>{format(min)}</span><span>{format(max)}</span>
      </div>
    </div>
  );
}

function SingleSlider({ label, min, max, step, value, onValueChange, format }) {
  return (
    <div className="ob-field">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
        <label className="ob-field-label" style={{ margin: 0 }}>{label}</label>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text)' }}>{format(value)}</span>
      </div>
      <Slider.Root
        className="rdx-slider"
        min={min} max={max} step={step}
        value={[value]}
        onValueChange={([v]) => onValueChange(v)}
      >
        <Slider.Track className="rdx-track">
          <Slider.Range className="rdx-range" />
        </Slider.Track>
        <Slider.Thumb className="rdx-thumb" aria-label={label} />
      </Slider.Root>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--muted-light)', marginTop: '0.375rem' }}>
        <span>{format(min)}</span><span>{format(max)}</span>
      </div>
    </div>
  );
}

const EMPTY_FORM = {
  anonymizedName: '',
  category: '',
  location: '',
  asking:   [250_000,  2_000_000],
  revenue:  [100_000,    750_000],
  profit:   [ 30_000,    200_000],
  ageYears: 3,
  teaserDescription: '',
  ndaRequired: false,
  industryTags: [],
  docs: [],
};

function CreateListingModal({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [docFiles, setDocFiles] = useState({});
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

  const toggleDoc = (doc) =>
    setForm((f) => ({
      ...f,
      docs: f.docs.includes(doc)
        ? f.docs.filter((d) => d !== doc)
        : [...f.docs, doc],
    }));

  const valid = form.anonymizedName.trim() && form.category;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!valid) return;
    setError('');
    setSaving(true);
    try {
      const listing = await createListing({
        anonymized_name:    form.anonymizedName.trim(),
        category:           form.category,
        industry_tags:      form.industryTags,
        location:           form.location.trim(),
        asking_range:       `${fmtDollars(form.asking[0])} – ${fmtDollars(form.asking[1])}`,
        revenue_range:      `${fmtDollars(form.revenue[0])} – ${fmtDollars(form.revenue[1])}`,
        profit_range:       `${fmtDollars(form.profit[0])} – ${fmtDollars(form.profit[1])}`,
        age:                form.ageYears === 1 ? '1 year' : `${form.ageYears} years`,
        teaser_description: form.teaserDescription.trim(),
        nda_required:       form.ndaRequired,
        document_checklist: form.docs,
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
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-lg)',
          width: '100%', maxWidth: '580px',
          maxHeight: '90vh', overflowY: 'auto',
          padding: '1.75rem',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.18), 0 4px 12px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>New Listing</h2>
          <button className="ghost" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={onClose}>
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>

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
              autoFocus required
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
            <select className="ob-field-input" value={form.category} onChange={(e) => set('category', e.target.value)} required>
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
                  <button key={tag} type="button" className={`ob-chip${selected ? ' ob-chip--active' : ''}`} onClick={() => toggleTag(tag)}>
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

          {/* Sliders */}
          <div style={{ display: 'grid', gap: '1.5rem', padding: '1.25rem', background: 'var(--surface-soft)', borderRadius: 'var(--radius-md)', border: '1px solid var(--line)' }}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-light)', margin: 0 }}>Financials</p>

            <RangeSlider
              label="Asking range"
              min={50_000} max={10_000_000} step={50_000}
              value={form.asking}
              onValueChange={(v) => set('asking', v)}
              format={fmtDollars}
            />
            <RangeSlider
              label="Revenue range"
              min={10_000} max={5_000_000} step={10_000}
              value={form.revenue}
              onValueChange={(v) => set('revenue', v)}
              format={fmtDollars}
            />
            <RangeSlider
              label="Profit range"
              min={0} max={2_000_000} step={10_000}
              value={form.profit}
              onValueChange={(v) => set('profit', v)}
              format={fmtDollars}
            />
            <SingleSlider
              label="Business age"
              min={1} max={20} step={1}
              value={form.ageYears}
              onValueChange={(v) => set('ageYears', v)}
              format={(v) => v === 1 ? '1 year' : `${v} years`}
            />
          </div>

          {/* Location */}
          <div className="ob-field">
            <label className="ob-field-label">Location</label>
            <input className="ob-field-input" placeholder="e.g. United States" value={form.location} onChange={(e) => set('location', e.target.value)} />
          </div>

          {/* Teaser */}
          <div className="ob-field">
            <label className="ob-field-label">Teaser description</label>
            <textarea
              className="ob-field-input" rows={3}
              placeholder="A brief, anonymous description shown to all buyers…"
              value={form.teaserDescription}
              onChange={(e) => set('teaserDescription', e.target.value)}
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          {/* Document checklist */}
          <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <div style={{ padding: '0.75rem 1rem', background: 'var(--surface-soft)', borderBottom: '1px solid var(--line)' }}>
              <p style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-light)', margin: 0 }}>
                Dataroom Documents
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                Select the documents you'll provide and upload each file.
              </p>
            </div>
            {DOC_GROUPS.map((group) => (
              <div key={group.label} style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--line)' }}>
                <p style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                  {group.label}
                </p>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {group.docs.map((doc) => {
                    const checked = form.docs.includes(doc);
                    const file = docFiles[doc];
                    return (
                      <div key={doc}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              toggleDoc(doc);
                              if (checked) setDocFiles((f) => { const n = { ...f }; delete n[doc]; return n; });
                            }}
                            style={{ accentColor: 'var(--primary)', flexShrink: 0 }}
                          />
                          {doc}
                        </label>
                        {checked && (
                          <div className="doc-upload-row">
                            {file ? (
                              <>
                                <span className="doc-upload-name">{file.name}</span>
                                <button
                                  type="button"
                                  className="ghost"
                                  style={{ fontSize: '0.6875rem', padding: '0.125rem 0.375rem' }}
                                  onClick={() => setDocFiles((f) => { const n = { ...f }; delete n[doc]; return n; })}
                                >
                                  Remove
                                </button>
                              </>
                            ) : (
                              <label className="doc-upload-btn">
                                <input
                                  type="file"
                                  style={{ display: 'none' }}
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) setDocFiles((prev) => ({ ...prev, [doc]: f }));
                                  }}
                                />
                                + Attach file
                              </label>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* NDA */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
            <input
              type="checkbox"
              checked={form.ndaRequired}
              onChange={(e) => set('ndaRequired', e.target.checked)}
              style={{ width: '1rem', height: '1rem', accentColor: 'var(--accent, #6366f1)' }}
            />
            Require NDA before buyers can request access
          </label>

          {error && <p style={{ color: 'var(--danger, #e55)', fontSize: '0.8125rem' }}>{error}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" className="ghost" onClick={onClose} disabled={saving}>Cancel</button>
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
  const { listings, accessRequests, offers, user, updateListing } = useMarket();
  const { isConnected, connecting, connect } = useWallet();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  async function handleNewListing() {
    if (!isConnected) {
      const acct = await connect();
      if (!acct) return;
    }
    setShowCreate(true);
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
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.5rem',
                            opacity: togglingId === listing.id ? 0.5 : 1,
                          }}
                          disabled={togglingId === listing.id}
                          onClick={() => toggleStatus(listing)}
                        >
                          {listing.status === 'live' ? 'Unpublish' : 'Go Live'}
                        </button>
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
