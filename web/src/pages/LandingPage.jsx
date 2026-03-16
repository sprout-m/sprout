import { Link } from 'react-router-dom';

const features = [
  {
    icon: '🌿',
    title: 'Milestone-Based Funding',
    description: 'Funds are locked upfront but only released when each milestone is independently verified.',
  },
  {
    icon: '🔐',
    title: 'AWS KMS Signing',
    description: 'Every approval is cryptographically signed by AWS KMS. Private keys never leave the HSM.',
  },
  {
    icon: '⛓️',
    title: 'Hedera Audit Trail',
    description: 'All events are logged with consensus timestamps on Hedera HCS — tamper-proof by design.',
  },
  {
    icon: '💸',
    title: 'Automatic Fund Release',
    description: 'HBAR transfers to the organizer happen on-chain immediately after a verified approval.',
  },
];

const steps = [
  { num: '01', role: 'Funder', action: 'Creates a project with milestones and locks funding into escrow.' },
  { num: '02', role: 'Organizer', action: 'Completes work, then submits proof — text, images, or documents.' },
  { num: '03', role: 'Verifier', action: 'Reviews the proof and approves, triggering a KMS signature.' },
  { num: '04', role: 'Blockchain', action: 'HBAR transfers on-chain. HCS records every event permanently.' },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#080f09', color: '#e2f0e4', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>

      {/* Nav */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: '#0d2414', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/sidelogo.png" alt="Sprout" style={{ height: '56px', width: 'auto', filter: 'brightness(0) invert(1)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link to="/login" style={{ color: 'rgba(226,240,228,0.65)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, padding: '0.4rem 0.75rem' }}>
              Sign in
            </Link>
            <Link to="/register" style={{ background: '#16a34a', color: '#fff', textDecoration: 'none', padding: '0.45rem 1.125rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, display: 'inline-block' }}>
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: '760px', margin: '0 auto', padding: '6rem 1.5rem 5rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(22,163,74,0.12)', border: '1px solid rgba(22,163,74,0.3)', color: '#4ade80', padding: '0.3rem 1rem', borderRadius: '999px', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '2rem', letterSpacing: '0.01em' }}>
          <span>🌱</span>
          <span>Hedera Apex Hackathon 2026 · Sustainability Track</span>
        </div>

        <h1 style={{ fontSize: 'clamp(2.25rem, 5.5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.12, letterSpacing: '-0.03em', marginBottom: '1.5rem', color: '#f0fdf4' }}>
          Release sustainability funding<br />
          <span style={{ color: '#4ade80' }}>only when progress is verified</span>
        </h1>

        <p style={{ fontSize: '1.125rem', color: 'rgba(226,240,228,0.6)', maxWidth: '560px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
          Sprout is a milestone-based escrow platform for sustainability projects. Funders lock capital, organizers prove impact, verifiers sign approvals — all backed by AWS KMS and Hedera.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" style={{ background: '#16a34a', color: '#fff', textDecoration: 'none', padding: '0.8rem 2rem', borderRadius: '10px', fontSize: '1rem', fontWeight: 700, display: 'inline-block' }}>
            Start a project →
          </Link>
          <Link to="/login" style={{ background: 'transparent', color: 'rgba(226,240,228,0.85)', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.14)', padding: '0.8rem 2rem', borderRadius: '10px', fontSize: '1rem', fontWeight: 500, display: 'inline-block' }}>
            Sign in
          </Link>
        </div>
      </section>

      {/* Divider */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
      </div>

      {/* How it works */}
      <section style={{ maxWidth: '780px', margin: '0 auto', padding: '5rem 1.5rem' }}>
        <p style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4ade80', marginBottom: '1rem' }}>How it works</p>
        <h2 style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#f0fdf4', marginBottom: '3rem' }}>
          Four steps from promise to proof
        </h2>
        <div style={{ display: 'grid', gap: '0.875rem' }}>
          {steps.map((s) => (
            <div key={s.num} style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.25rem 1.5rem' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '0.8125rem', fontWeight: 700, color: '#4ade80', opacity: 0.6, flexShrink: 0, paddingTop: '0.125rem', width: '2rem' }}>
                {s.num}
              </div>
              <div>
                <span style={{ fontWeight: 700, color: '#86efac', marginRight: '0.625rem', fontSize: '0.9375rem' }}>{s.role}</span>
                <span style={{ color: 'rgba(226,240,228,0.65)', fontSize: '0.9375rem', lineHeight: 1.6 }}>{s.action}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
      </div>

      {/* Features */}
      <section style={{ maxWidth: '960px', margin: '0 auto', padding: '5rem 1.5rem 7rem' }}>
        <p style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4ade80', marginBottom: '1rem' }}>Why Sprout</p>
        <h2 style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#f0fdf4', marginBottom: '3rem' }}>
          Built for accountability
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem' }}>
          {features.map((f) => (
            <div key={f.title} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(134,239,172,0.1)', borderRadius: '14px', padding: '1.75rem 1.5rem' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>{f.icon}</div>
              <h3 style={{ margin: '0 0 0.625rem', fontWeight: 700, fontSize: '1rem', color: '#f0fdf4', letterSpacing: '-0.01em' }}>{f.title}</h3>
              <p style={{ margin: 0, color: 'rgba(226,240,228,0.55)', fontSize: '0.875rem', lineHeight: 1.65 }}>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '2rem 1.5rem', textAlign: 'center' }}>
        <p style={{ margin: 0, color: 'rgba(226,240,228,0.3)', fontSize: '0.8125rem' }}>
          © 2026 Sprout · Built on Hedera · Secured by AWS KMS
        </p>
      </footer>
    </div>
  );
}
