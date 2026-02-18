import { Link, Navigate } from 'react-router-dom';
import { useMarket } from '../context/MarketContext';

export default function LandingPage() {
  const { isAuthenticated } = useMarket();
  if (isAuthenticated) return <Navigate to="/app" replace />;

  return (
    <section className="landing-shell home-shell">
      <div className="landing-page home-page">
        <header className="landing-topbar home-topbar">
          <p className="landing-brand">Meridian Marketplace</p>
          <div className="landing-topbar-actions">
            <Link className="small-link" to="/register">Sign in</Link>
            <Link className="button-link" to="/register">Get started</Link>
          </div>
        </header>

        <section className="home-hero">
          <p className="home-eyebrow">Meridian Platform</p>
          <h1>Transaction infrastructure for digital business acquisitions.</h1>
          <p className="home-subtitle">
            Meridian centralizes sourcing, qualification, diligence, offer management, and escrow
            execution into one controlled operating environment.
          </p>
          <div className="home-cta-row">
            <Link className="button-link" to="/register">Request access</Link>
            <Link className="small-link" to="/register">Schedule demo</Link>
          </div>

          <div className="home-proof-row">
            <span>Institutional workflow standards</span>
            <span>NDA and financial qualification controls</span>
            <span>End-to-end transaction visibility</span>
          </div>
        </section>

        <section className="home-value-grid">
          <article className="home-value-card">
            <h2>Qualified counterparty access</h2>
            <p>
              Enforce NDA and proof-of-funds requirements before diligence access is provisioned.
            </p>
          </article>
          <article className="home-value-card">
            <h2>Controlled diligence process</h2>
            <p>
              Consolidate requests, documents, and timelines in one governed workflow.
            </p>
          </article>
          <article className="home-value-card">
            <h2>Execution-grade close management</h2>
            <p>
              Move from initial outreach to funded escrow with accountable stage transitions.
            </p>
          </article>
        </section>

        <section className="home-flow">
          <div className="home-flow-copy">
            <p className="home-section-label">Operating model</p>
            <h2>A structured transaction lifecycle.</h2>
          </div>
          <div className="home-steps">
            <article>
              <p>1</p>
              <h3>Originate</h3>
              <span>Review curated listings with standardized business and performance context.</span>
            </article>
            <article>
              <p>2</p>
              <h3>Qualify</h3>
              <span>Approve counterparty access after legal and financial screening criteria are met.</span>
            </article>
            <article>
              <p>3</p>
              <h3>Negotiate</h3>
              <span>Capture and govern offer progression through a shared status framework.</span>
            </article>
            <article>
              <p>4</p>
              <h3>Close</h3>
              <span>Track escrow funding and transfer milestones through final completion.</span>
            </article>
          </div>
        </section>

        <section className="home-social-proof">
          <article>
            <p>
              "Meridian replaced fragmented diligence coordination with a single, accountable operating layer."
            </p>
            <span>Director of Corporate Development, Northline Digital</span>
          </article>
          <article>
            <p>
              "Qualification controls improved counterpart quality and reduced time lost to unqualified outreach."
            </p>
            <span>Managing Partner, Exit Studio Partners</span>
          </article>
        </section>

        <section className="home-final-cta">
          <div>
            <p className="home-section-label">Engagement</p>
            <h2>Deploy a professional operating layer for your next transaction cycle.</h2>
          </div>
          <Link className="button-link" to="/register">Create workspace</Link>
        </section>
      </div>
    </section>
  );
}
