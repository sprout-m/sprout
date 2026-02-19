import { Link } from 'react-router-dom';

const previewCards = [
  {
    category: 'SaaS',
    name: 'B2B SaaS – Compliance Ops',
    teaser: 'Recurring compliance automation with sticky SMB base. Low churn, fully remote team of four.',
    revenue: '$58k – $72k MRR',
    margin: '28–34%',
    age: '4.2 yrs',
    location: 'United States',
    ask: '$900k – $1.2M',
  },
  {
    category: 'Ecommerce',
    name: 'Outdoor Gear Brand',
    teaser: 'Premium accessories with diversified channel mix and loyal repeat buyer base. Strong Amazon + DTC split.',
    revenue: '$120k – $160k MRR',
    margin: '19–26%',
    age: '6.8 yrs',
    location: 'Canada',
    ask: '$650k – $820k',
  },
  {
    category: 'Media',
    name: 'Niche B2B Newsletter',
    teaser: 'High-margin newsletter with 42k engaged subscribers, strong sponsor relationships, and consistent open rates.',
    revenue: '$18k – $24k MRR',
    margin: '61–72%',
    age: '3.1 yrs',
    location: 'United States',
    ask: '$380k – $520k',
  },
];

const features = [
  {
    title: 'Operator-Vetted Listings',
    desc: 'Every listing passes our review before going live. Financials verified, sellers screened, quality signals visible upfront.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2l7 4v4c0 4.5-3 7.5-7 8.5C6 17.5 3 14.5 3 10V6l7-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'NDA-Gated Due Diligence',
    desc: "Buyers request data room access per listing. Sellers review buyer profiles and approve or decline before anything sensitive is shared.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="4" y="9" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 9V6.5a3 3 0 0 1 6 0V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="10" cy="13.5" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: 'On-Chain Escrow',
    desc: 'USDC smart-contract escrow with milestone-based release. No wire risk. Full auditability from deposit to close.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 3 L10 7 M10 7 C7 7 4.5 9 4.5 12C4.5 15 7 17 10 17C13 17 15.5 15 15.5 12C15.5 9 13 7 10 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 12l1.5 1.5L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Structured Offer Process',
    desc: 'LOIs, counteroffers, and deal terms managed end-to-end. A clean, timestamped audit trail for both parties through to signing.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 7h8M6 10h6M6 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

const steps = [
  {
    title: 'Browse anonymized listings',
    desc: "Explore verified businesses by category, revenue, and location — no identifying details until you're approved.",
  },
  {
    title: 'Request data room access',
    desc: 'Sign a platform NDA and submit a request. Sellers review your profile before granting access.',
  },
  {
    title: 'Conduct due diligence',
    desc: 'Access curated folders — P&L statements, legal filings, ops guides, and growth reports — organized by the seller.',
  },
  {
    title: 'Submit and negotiate an offer',
    desc: 'Make a formal LOI, receive counteroffers, and agree on final terms. Everything logged and timestamped.',
  },
  {
    title: 'Close via on-chain escrow',
    desc: 'Funds move to smart-contract escrow and are released upon milestone confirmation from both parties.',
  },
];

function PreviewCard({ card }) {
  return (
    <div className="lp-preview-card">
      <div className="lp-preview-card-head">
        <span className="cat-label">{card.category}</span>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <span className="tag">Vetted</span>
          <span className="tag">NDA</span>
        </div>
      </div>
      <div>
        <div className="lp-preview-card-title">{card.name}</div>
        <p className="lp-preview-card-teaser">{card.teaser}</p>
      </div>
      <div className="listing-metrics">
        <div className="metric"><span>Revenue</span><strong>{card.revenue}</strong></div>
        <div className="metric"><span>Margin</span><strong>{card.margin}</strong></div>
        <div className="metric"><span>Age</span><strong>{card.age}</strong></div>
        <div className="metric"><span>Location</span><strong>{card.location}</strong></div>
      </div>
      <div className="lp-preview-card-footer">
        <div>
          <p className="lp-preview-ask-label">Asking</p>
          <strong className="lp-preview-ask-val">{card.ask}</strong>
        </div>
        <span className="status-pill">Live</span>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="lp">
      {/* ── Nav ── */}
      <header className="lp-nav">
        <div className="lp-container lp-nav-inner">
          <img
            src="/logo.png"
            alt="Meridian"
            style={{ height: '44px', filter: 'brightness(0) invert(1)' }}
          />
          <Link to="/onboarding" className="lp-btn-primary lp-btn-sm">
            Enter Marketplace →
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-hero-glow" />
        <div className="lp-container lp-hero-grid">

          {/* Left: copy */}
          <div className="lp-hero-copy">
            <p className="lp-eyebrow">Private Acquisition Marketplace</p>
            <h1 className="lp-h1">
              The private marketplace for online acquisitions
            </h1>
            <p className="lp-hero-sub">
              Meridian connects vetted buyers with verified sellers through structured due diligence,
              NDA-gated data rooms, and on-chain escrow.
            </p>
            <div className="lp-hero-actions">
              <Link to="/onboarding" className="lp-btn-primary">Browse Listings →</Link>
              <a href="#how-it-works" className="lp-btn-outline">How it works</a>
            </div>
            <div className="lp-hero-stats">
              <div className="lp-hero-stat">
                <strong>$42M+</strong>
                <span>Transaction volume</span>
              </div>
              <div className="lp-hero-stat-div" />
              <div className="lp-hero-stat">
                <strong>127</strong>
                <span>Active listings</span>
              </div>
              <div className="lp-hero-stat-div" />
              <div className="lp-hero-stat">
                <strong>14 days</strong>
                <span>Avg. time to close</span>
              </div>
            </div>
          </div>

          {/* Right: product preview */}
          <div className="lp-hero-preview-wrap">
            <div className="lp-preview-frame">
              <div className="lp-preview-frame-bar">
                <div className="lp-preview-dots">
                  <span /><span /><span />
                </div>
                <span className="lp-preview-url">meridian.market/marketplace</span>
              </div>
              <div className="lp-preview-frame-body">
                {previewCards.map((card) => (
                  <PreviewCard key={card.name} card={card} />
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Features ── */}
      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-section-header">
            <div>
              <p className="lp-section-label">Why Meridian</p>
              <h2 className="lp-section-h2">Built for serious M&amp;A</h2>
            </div>
            <p className="lp-section-desc">
              Not a broker, not a listings aggregator. Meridian is infrastructure for structured private acquisitions.
            </p>
          </div>
          <div className="lp-feature-grid">
            {features.map((f) => (
              <div key={f.title} className="lp-feature-card">
                <div className="lp-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="lp-section lp-section--white" id="how-it-works">
        <div className="lp-container lp-hiw-grid">
          <div className="lp-hiw-left">
            <p className="lp-section-label">Process</p>
            <h2 className="lp-section-h2">From browse<br />to close</h2>
            <p className="lp-hiw-sub">
              A structured, end-to-end process designed to protect both buyers and sellers at every step.
            </p>
            <Link to="/onboarding" className="lp-btn-dark">Browse Listings →</Link>
          </div>
          <div className="lp-steps">
            {steps.map((step, i) => (
              <div key={step.title} className="lp-step">
                <div className="lp-step-indicator">
                  <div className="lp-step-dot">{i + 1}</div>
                  {i < steps.length - 1 && <div className="lp-step-line" />}
                </div>
                <div className="lp-step-body">
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="lp-final-cta">
        <div className="lp-final-cta-glow" />
        <div className="lp-container lp-final-cta-inner">
          <p className="lp-eyebrow" style={{ marginBottom: '1rem' }}>Get started</p>
          <h2>Ready to find your next acquisition?</h2>
          <p>Browse current listings — anonymized, operator-verified, and ready for serious buyers.</p>
          <div className="lp-final-cta-actions">
            <Link to="/onboarding" className="lp-btn-primary lp-btn-lg">Browse Listings →</Link>
            <a href="#how-it-works" className="lp-btn-outline">Learn how it works</a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <img
            src="/logo.png"
            alt="Meridian"
            style={{ height: '34px', filter: 'brightness(0) invert(1)', opacity: 0.4 }}
          />
          <p>© 2025 Meridian Marketplace. Structured M&amp;A for online businesses.</p>
        </div>
      </footer>
    </div>
  );
}
