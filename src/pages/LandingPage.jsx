import { Link } from 'react-router-dom';

const features = [
  {
    title: 'Operator-Vetted Listings',
    desc: 'Every listing passes our review before going live. Financials are verified, sellers are screened, and each listing carries clear quality signals.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path d="M10 2l2.09 5.26L18 8.27l-4 3.87.18 5.86L10 15.77l-4.18 2.23L6 12.14 2 8.27l5.91-1.01L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    title: 'NDA-Gated Due Diligence',
    desc: "Buyers request access to each listing's data room. Sellers review the buyer profile and approve or decline before any sensitive information is shared.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <rect x="4" y="9" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 9V6.5a3 3 0 0 1 6 0V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  },
  {
    title: 'On-Chain Escrow',
    desc: 'Funds are held in USDC smart-contract escrow with milestone-based release. No wire risk. Full auditability from deposit through to close.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path d="M10 2l7 4v4c0 4.5-3 7.5-7 8.5C6 17.5 3 14.5 3 10V6l7-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    title: 'Structured Offer Process',
    desc: 'LOIs, counteroffers, and deal terms are managed end-to-end on the platform — with a timestamped audit trail for both parties through to signing.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path d="M3 10h14M12 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
];

const steps = [
  {
    title: 'Browse anonymized listings',
    desc: "Explore verified businesses by category, revenue range, and location — no identifying details until you're approved by the seller."
  },
  {
    title: 'Request data room access',
    desc: 'Sign a platform NDA and submit a request. Sellers review your profile before granting access to financials and documents.'
  },
  {
    title: 'Conduct due diligence',
    desc: "Access curated document folders — P&L statements, legal filings, ops guides, and growth reports — organized by the seller."
  },
  {
    title: 'Submit and negotiate an offer',
    desc: 'Make a formal LOI, receive counteroffers, and agree on final terms within the platform. Everything logged and timestamped.'
  },
  {
    title: 'Close via escrow',
    desc: 'Funds move to a smart-contract escrow and are released upon milestone confirmation from both parties.'
  }
];

const stats = [
  { value: '$42M+', label: 'Closed transaction volume' },
  { value: '127', label: 'Active listings' },
  { value: '98%', label: 'NDA compliance rate' },
  { value: '14 days', label: 'Avg. time to close' }
];

const categories = ['SaaS', 'Ecommerce', 'Media', 'Agency', 'Marketplace'];

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
          <Link to="/app" className="lp-btn-primary lp-btn-sm">
            Enter Marketplace →
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-container lp-hero-body">
          <p className="lp-eyebrow">Private Acquisition Marketplace</p>
          <h1 className="lp-h1">
            Buy and sell profitable<br />online businesses
          </h1>
          <p className="lp-hero-sub">
            Meridian connects vetted buyers with verified sellers through structured due diligence,
            NDA-gated data rooms, and on-chain escrow.
          </p>
          <div className="lp-hero-actions">
            <Link to="/app" className="lp-btn-primary">Browse Listings</Link>
            <a href="#how-it-works" className="lp-btn-outline">How it works</a>
          </div>
        </div>

        {/* Stats bar */}
        <div className="lp-stats-bar">
          <div className="lp-container lp-stats-inner">
            {stats.map((stat) => (
              <div key={stat.label} className="lp-stat">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="lp-section">
        <div className="lp-container">
          <p className="lp-section-label">Why Meridian</p>
          <h2 className="lp-section-h2">Built for serious M&amp;A</h2>
          <p className="lp-section-sub">
            Not a broker. Not a listings aggregator. Meridian is infrastructure for structured private acquisitions.
          </p>
          <div className="lp-feature-grid">
            {features.map((f) => (
              <div key={f.title} className="lp-feature-card card">
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
        <div className="lp-container">
          <p className="lp-section-label">Process</p>
          <h2 className="lp-section-h2">From browse to close</h2>
          <p className="lp-section-sub">
            A structured, end-to-end process designed to protect both buyers and sellers at every step.
          </p>
          <div className="lp-steps">
            {steps.map((step, i) => (
              <div key={step.title} className="lp-step">
                <div className="lp-step-num">{String(i + 1).padStart(2, '0')}</div>
                <div className="lp-step-body">
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Category strip ── */}
      <section className="lp-section lp-section--dark">
        <div className="lp-container">
          <p className="lp-section-label lp-section-label--light">Listings</p>
          <h2 className="lp-section-h2 lp-section-h2--light">Active across five verticals</h2>
          <p className="lp-section-sub lp-section-sub--light">
            Opportunities ranging from early-growth SaaS to established e-commerce brands — verified and ready for serious buyers.
          </p>
          <div className="lp-category-strip">
            {categories.map((cat) => (
              <div key={cat} className="lp-category-chip">
                <span>{cat}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
            <Link to="/app" className="lp-btn-primary">View All Listings</Link>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="lp-final-cta">
        <div className="lp-container lp-final-cta-inner">
          <div>
            <h2>Ready to explore?</h2>
            <p>Browse current listings — anonymized, verified, and ready for serious buyers.</p>
          </div>
          <Link to="/app" className="lp-btn-primary lp-btn-lg">
            Browse Listings →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <img
            src="/logo.png"
            alt="Meridian"
            style={{ height: '34px', filter: 'brightness(0) invert(1)', opacity: 0.45 }}
          />
          <p>© 2025 Meridian Marketplace. Structured M&amp;A for online businesses.</p>
        </div>
      </footer>
    </div>
  );
}
