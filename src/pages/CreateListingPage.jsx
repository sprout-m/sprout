import * as Slider from '@radix-ui/react-slider';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarket } from '../context/MarketContext';

const CATEGORIES = ['SaaS', 'Ecommerce', 'Media', 'Agency', 'Marketplace', 'Other'];

const INDUSTRY_TAGS = [
  'B2B', 'B2C', 'AI/ML', 'FinTech', 'HealthTech', 'EdTech',
  'Dev Tools', 'Newsletter', 'Podcast', 'D2C', 'Subscription', 'AdTech',
];

const DOC_GROUPS = [
  {
    label: 'Financial',
    docs: ['P&L Statement (TTM + 3 years)', 'Balance Sheet', 'Cash Flow Statement', 'Tax Returns (3 years)', 'MRR / ARR Breakdown'],
  },
  {
    label: 'Business Operations',
    docs: ['Business Overview / Pitch Deck', 'Customer List (anonymized)', 'Vendor & Supplier Contracts', 'Employee & Contractor Agreements'],
  },
  {
    label: 'Technical',
    docs: ['Product Roadmap', 'Technical Architecture Overview', 'IP & Patent Documentation'],
  },
  {
    label: 'Legal',
    docs: ['Certificate of Incorporation', 'Cap Table', 'Litigation History'],
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
      <Slider.Root className="rdx-slider" min={min} max={max} step={step} value={value}
        onValueChange={onValueChange} minStepsBetweenThumbs={1}>
        <Slider.Track className="rdx-track"><Slider.Range className="rdx-range" /></Slider.Track>
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
      <Slider.Root className="rdx-slider" min={min} max={max} step={step} value={[value]}
        onValueChange={([v]) => onValueChange(v)}>
        <Slider.Track className="rdx-track"><Slider.Range className="rdx-range" /></Slider.Track>
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

const STEPS = ['Basics', 'Financials', 'Details', 'Documents', 'Review'];

export default function CreateListingPage() {
  const [step, setStep]       = useState(0);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [docFiles, setDocFiles] = useState({});
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const { createListing } = useMarket();
  const navigate = useNavigate();

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

  const canNext = step !== 0 || (form.anonymizedName.trim() && form.category);

  async function handlePublish() {
    setError('');
    setSaving(true);
    try {
      const dataroom_folders = {};
      DOC_GROUPS.forEach((group) => {
        const files = group.docs
          .filter((doc) => form.docs.includes(doc) && docFiles[doc])
          .map((doc) => docFiles[doc].name);
        if (files.length) dataroom_folders[group.label] = files;
      });

      await createListing({
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
        full_financials: {
          ttmRevenue: `${fmtDollars(form.revenue[0])} – ${fmtDollars(form.revenue[1])}`,
          ttmProfit:  `${fmtDollars(form.profit[0])} – ${fmtDollars(form.profit[1])}`,
          momTrend:   [],
          cacLtv:     '—',
          churn:      '—',
        },
        ...(Object.keys(dataroom_folders).length ? { dataroom_folders } : {}),
      });
      navigate('/app/seller/listings');
    } catch (err) {
      setError(err.message || 'Failed to create listing');
      setSaving(false);
    }
  }

  return (
    <section className="wizard-wrap">

      {/* ── Header ── */}
      <div style={{ marginBottom: '0.25rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>New Listing</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
          Step {step + 1} of {STEPS.length} — {STEPS[step]}
        </p>
      </div>

      {/* ── Step indicator ── */}
      <div className="wizard-steps">
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: 'contents' }}>
            <div className="wizard-step-item">
              <div className={`wizard-step-dot${i < step ? ' done' : i === step ? ' active' : ''}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`wizard-step-label${i === step ? ' active' : ''}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`wizard-step-connector${i < step ? ' done' : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Step content ── */}
      <div className="wizard-content">

        {/* Step 0 — Basics */}
        {step === 0 && (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <div className="ob-field">
              <label className="ob-field-label">
                Listing name <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                className="ob-field-input"
                placeholder="e.g. Anonymous SaaS Co."
                value={form.anonymizedName}
                onChange={(e) => set('anonymizedName', e.target.value)}
                autoFocus
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                Keep it anonymous — no identifying details.
              </p>
            </div>
            <div className="ob-field">
              <label className="ob-field-label">
                Category <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <select className="ob-field-input" value={form.category}
                onChange={(e) => set('category', e.target.value)}>
                <option value="">Select a category…</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="ob-field">
              <label className="ob-field-label">Location</label>
              <input className="ob-field-input" placeholder="e.g. United States"
                value={form.location} onChange={(e) => set('location', e.target.value)} />
            </div>
          </div>
        )}

        {/* Step 1 — Financials */}
        {step === 1 && (
          <div style={{ display: 'grid', gap: '1.75rem' }}>
            <RangeSlider label="Asking range" min={50_000} max={10_000_000} step={50_000}
              value={form.asking} onValueChange={(v) => set('asking', v)} format={fmtDollars} />
            <RangeSlider label="Revenue range" min={10_000} max={5_000_000} step={10_000}
              value={form.revenue} onValueChange={(v) => set('revenue', v)} format={fmtDollars} />
            <RangeSlider label="Profit range" min={0} max={2_000_000} step={10_000}
              value={form.profit} onValueChange={(v) => set('profit', v)} format={fmtDollars} />
            <SingleSlider label="Business age" min={1} max={20} step={1}
              value={form.ageYears} onValueChange={(v) => set('ageYears', v)}
              format={(v) => v === 1 ? '1 year' : `${v} years`} />
          </div>
        )}

        {/* Step 2 — Details */}
        {step === 2 && (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <div className="ob-field">
              <label className="ob-field-label">Industry tags</label>
              <div className="ob-chip-grid" style={{ marginTop: '0.5rem' }}>
                {INDUSTRY_TAGS.map((tag) => {
                  const selected = form.industryTags.includes(tag);
                  return (
                    <button key={tag} type="button"
                      className={`ob-chip${selected ? ' ob-chip--active' : ''}`}
                      onClick={() => toggleTag(tag)}>
                      {selected && (
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5"
                            strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="ob-field">
              <label className="ob-field-label">Teaser description</label>
              <textarea className="ob-field-input" rows={4}
                placeholder="A brief, anonymous description shown to all buyers…"
                value={form.teaserDescription}
                onChange={(e) => set('teaserDescription', e.target.value)}
                style={{ resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
              <input type="checkbox" checked={form.ndaRequired}
                onChange={(e) => set('ndaRequired', e.target.checked)}
                style={{ width: '1rem', height: '1rem', accentColor: 'var(--accent, #6366f1)' }} />
              Require NDA before buyers can request access
            </label>
          </div>
        )}

        {/* Step 3 — Documents */}
        {step === 3 && (
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
                          <input type="checkbox" checked={checked}
                            onChange={() => {
                              toggleDoc(doc);
                              if (checked) setDocFiles((f) => { const n = { ...f }; delete n[doc]; return n; });
                            }}
                            style={{ accentColor: 'var(--primary)', flexShrink: 0 }} />
                          {doc}
                        </label>
                        {checked && (
                          <div className="doc-upload-row">
                            {file ? (
                              <>
                                <span className="doc-upload-name">{file.name}</span>
                                <button type="button" className="ghost"
                                  style={{ fontSize: '0.6875rem', padding: '0.125rem 0.375rem' }}
                                  onClick={() => setDocFiles((f) => { const n = { ...f }; delete n[doc]; return n; })}>
                                  Remove
                                </button>
                              </>
                            ) : (
                              <label className="doc-upload-btn">
                                <input type="file" style={{ display: 'none' }}
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) setDocFiles((prev) => ({ ...prev, [doc]: f }));
                                  }} />
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
        )}

        {/* Step 4 — Review */}
        {step === 4 && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div className="card" style={{ display: 'grid', gap: '0.625rem' }}>
              {[
                ['Name',      form.anonymizedName],
                ['Category',  form.category],
                form.location && ['Location', form.location],
                ['Asking',    `${fmtDollars(form.asking[0])} – ${fmtDollars(form.asking[1])}`],
                ['Revenue',   `${fmtDollars(form.revenue[0])} – ${fmtDollars(form.revenue[1])}`],
                ['Profit',    `${fmtDollars(form.profit[0])} – ${fmtDollars(form.profit[1])}`],
                ['Age',       form.ageYears === 1 ? '1 year' : `${form.ageYears} years`],
                form.industryTags.length && ['Tags', form.industryTags.join(', ')],
                ['NDA',       form.ndaRequired ? 'Required' : 'Not required'],
                ['Documents', form.docs.length ? `${form.docs.length} selected` : 'None'],
              ].filter(Boolean).map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--muted)' }}>{label}</span>
                  <strong style={{ textAlign: 'right', maxWidth: '60%' }}>{value}</strong>
                </div>
              ))}
            </div>

            {form.teaserDescription && (
              <div className="card">
                <p style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                  Teaser
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  {form.teaserDescription}
                </p>
              </div>
            )}

            {error && <p style={{ color: 'var(--danger)', fontSize: '0.8125rem' }}>{error}</p>}
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <div className="wizard-nav">
        <button className="ghost"
          onClick={() => step === 0 ? navigate('/app/seller/listings') : setStep((s) => s - 1)}>
          {step === 0 ? 'Cancel' : '← Back'}
        </button>

        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
            Next →
          </button>
        ) : (
          <button onClick={handlePublish} disabled={saving}>
            {saving ? 'Publishing…' : 'Publish Listing'}
          </button>
        )}
      </div>

    </section>
  );
}
