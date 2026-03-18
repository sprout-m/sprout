import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
      color: '#111827',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      WebkitFontSmoothing: 'antialiased',
    }}>

      {/* Nav */}
      <nav style={{ background: 'linear-gradient(135deg, #166534 0%, #14532d 60%, #0f3d20 100%)', height: '80px', display: 'flex', alignItems: 'center' }}>
        <div style={{
          maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '0 2rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <img src="/sproutwithwhitetext.png" alt="Sprout" style={{ height: '120px', width: 'auto' }} />
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Link to="/login" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, padding: '0.5rem 0.875rem' }}>
              Sign in
            </Link>
            <Link to="/register" style={{
              background: '#fff', color: '#14532d', textDecoration: 'none',
              padding: '0.5rem 1.25rem', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 700,
            }}>
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — two column */}
      <section style={{ borderBottom: '1px solid #e5e7eb', background: '#f0fdf4' }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto', padding: '0 2rem',
          display: 'grid', gridTemplateColumns: '1fr 400px', gap: '4rem', alignItems: 'center',
          minHeight: '480px',
        }}>
          <div style={{ padding: '5rem 0' }}>
            <h1 style={{
              fontSize: 'clamp(2.75rem, 5vw, 4rem)',
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: '-0.035em',
              color: '#0f172a',
              margin: '0 0 1.5rem',
            }}>
              Sustainability funding<br />
              that only moves when<br />
              <span style={{ color: '#14532d' }}>progress is proven.</span>
            </h1>
            <p style={{ margin: '0 0 2.25rem', fontSize: '1.0625rem', color: '#6b7280', lineHeight: 1.7, maxWidth: '480px' }}>
              Milestone-based escrow for climate and sustainability projects.
              Every approval is cryptographically signed. Every payment is recorded on Hedera.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link to="/register" style={{
                background: '#14532d', color: '#fff', textDecoration: 'none',
                padding: '0.75rem 1.625rem', borderRadius: '7px', fontSize: '0.9375rem', fontWeight: 600,
              }}>
                Start a project
              </Link>
              <Link to="/login" style={{
                color: '#6b7280', textDecoration: 'none', border: '1px solid #d1d5db',
                padding: '0.75rem 1.375rem', borderRadius: '7px', fontSize: '0.9375rem', fontWeight: 500,
              }}>
                Sign in
              </Link>
            </div>
          </div>

          {/* Right panel — graphic */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 0' }}>
            <svg width="360" height="380" viewBox="0 0 360 380" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Backdrop glow circle */}
              <circle cx="180" cy="180" r="155" fill="#dcfce7" opacity="0.6" />
              <circle cx="180" cy="180" r="120" fill="#bbf7d0" opacity="0.35" />

              {/* Stem */}
              <line x1="180" y1="310" x2="180" y2="145" stroke="#14532d" strokeWidth="3.5" strokeLinecap="round" />

              {/* Left big leaf */}
              <path d="M180 200 C160 185 120 175 105 145 C100 130 108 110 125 108 C155 106 185 135 180 200Z"
                fill="#16a34a" opacity="0.85" />
              {/* Left leaf vein */}
              <path d="M180 200 C160 178 130 158 115 138"
                stroke="#14532d" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />

              {/* Right big leaf */}
              <path d="M180 165 C200 148 240 138 258 108 C265 93 258 72 240 70 C210 67 178 98 180 165Z"
                fill="#22c55e" opacity="0.8" />
              {/* Right leaf vein */}
              <path d="M180 165 C205 145 232 118 248 92"
                stroke="#14532d" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />

              {/* Small left accent leaf */}
              <path d="M180 240 C162 230 138 228 128 212 C124 204 130 194 140 193 C160 191 180 208 180 240Z"
                fill="#4ade80" opacity="0.6" />

              {/* Circuit roots */}
              {/* Main root down */}
              <line x1="180" y1="310" x2="180" y2="340" stroke="#14532d" strokeWidth="2.5" strokeLinecap="round" />
              {/* Left root */}
              <line x1="180" y1="328" x2="130" y2="328" stroke="#14532d" strokeWidth="2" strokeLinecap="round" />
              <line x1="130" y1="328" x2="130" y2="348" stroke="#14532d" strokeWidth="2" strokeLinecap="round" />
              {/* Right root */}
              <line x1="180" y1="320" x2="230" y2="320" stroke="#14532d" strokeWidth="2" strokeLinecap="round" />
              <line x1="230" y1="320" x2="230" y2="340" stroke="#14532d" strokeWidth="2" strokeLinecap="round" />
              {/* Far left root */}
              <line x1="130" y1="338" x2="105" y2="338" stroke="#14532d" strokeWidth="1.5" strokeLinecap="round" />
              {/* Far right root */}
              <line x1="230" y1="332" x2="258" y2="332" stroke="#14532d" strokeWidth="1.5" strokeLinecap="round" />

              {/* Circuit nodes */}
              <circle cx="130" cy="348" r="5" fill="#16a34a" />
              <circle cx="230" cy="340" r="5" fill="#16a34a" />
              <circle cx="105" cy="338" r="4" fill="#4ade80" opacity="0.7" />
              <circle cx="258" cy="332" r="4" fill="#4ade80" opacity="0.7" />
              <circle cx="180" cy="340" r="4" fill="#14532d" opacity="0.5" />

              {/* Floating dots — growth particles */}
              <circle cx="100" cy="160" r="4" fill="#4ade80" opacity="0.5" />
              <circle cx="88" cy="200" r="3" fill="#16a34a" opacity="0.35" />
              <circle cx="270" cy="185" r="5" fill="#4ade80" opacity="0.4" />
              <circle cx="285" cy="155" r="3" fill="#22c55e" opacity="0.4" />
              <circle cx="255" cy="230" r="3.5" fill="#16a34a" opacity="0.3" />
              <circle cx="110" cy="125" r="2.5" fill="#4ade80" opacity="0.4" />

              {/* Outer ring arc */}
              <circle cx="180" cy="180" r="153" stroke="#86efac" strokeWidth="1" strokeDasharray="6 8" opacity="0.5" />
            </svg>
          </div>
        </div>
      </section>

      {/* Flow — horizontal step strip */}
      <section style={{ borderBottom: '1px solid #e5e7eb', background: '#ffffff' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '3.5rem 2rem' }}>
          <p style={{ margin: '0 0 2.5rem', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af' }}>
            The flow
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', position: 'relative' }}>
            {[
              { n: '01', who: 'Funder', what: 'Creates a project, defines milestones, and locks HBAR escrow on-chain.' },
              { n: '02', who: 'Organizer', what: 'Executes the work. Submits documents, images, or text as proof.' },
              { n: '03', who: 'Verifier', what: 'Reviews evidence. Approves or rejects. Decision signed via AWS KMS.' },
              { n: '04', who: 'Hedera', what: 'HBAR releases to organizer. HCS logs the event permanently.' },
            ].map((step, i) => (
              <div key={step.n} style={{
                padding: '0 2rem 0 0',
                borderRight: i < 3 ? '1px solid #e5e7eb' : 'none',
                marginRight: i < 3 ? '2rem' : 0,
              }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', display: 'block', marginBottom: '0.625rem' }}>
                  {step.n}
                </span>
                <p style={{ margin: '0 0 0.5rem', fontWeight: 700, fontSize: '0.9375rem', color: '#111827' }}>
                  {step.who}
                </p>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: '#6b7280', lineHeight: 1.65 }}>
                  {step.what}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles detail — asymmetric */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '5rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '5rem', alignItems: 'start' }}>
          <div>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af' }}>
              Three roles
            </p>
            <p style={{ margin: 0, fontSize: '0.9375rem', color: '#374151', lineHeight: 1.7 }}>
              Each party has a distinct, bounded role. No one actor can both claim
              and approve. The structure enforces accountability by design.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
            {[
              {
                role: 'Funder',
                desc: 'Sets the project scope, milestone targets, and funding amount. Locks HBAR into escrow before work begins. Receives a full audit trail.',
              },
              {
                role: 'Organizer',
                desc: 'Carries out the project work. Submits proof for each milestone — text, files, images. Receives HBAR directly after verifier approval.',
              },
              {
                role: 'Verifier',
                desc: 'An independent party who reviews submitted evidence. Approves or rejects each milestone. Every decision is signed by AWS KMS and logged on Hedera HCS.',
              },
            ].map((r, i) => (
              <div key={r.role} style={{
                padding: '1.625rem 1.75rem',
                borderTop: i > 0 ? '1px solid #e5e7eb' : 'none',
              }}>
                <p style={{ margin: '0 0 0.5rem', fontWeight: 700, fontSize: '0.9375rem', color: '#111827' }}>
                  {r.role}
                </p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.7 }}>
                  {r.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section style={{ background: 'linear-gradient(135deg, #166534 0%, #14532d 60%, #0f3d20 100%)', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '4rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem' }}>
          <div>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff' }}>
              Ready to fund with accountability?
            </h2>
            <p style={{ margin: 0, fontSize: '0.9375rem', color: 'rgba(255,255,255,0.65)' }}>
              Create a project and lock funding in minutes.
            </p>
          </div>
          <Link to="/register" style={{
            flexShrink: 0,
            background: '#ffffff', color: '#14532d', textDecoration: 'none',
            padding: '0.75rem 1.75rem', borderRadius: '7px', fontSize: '0.9375rem', fontWeight: 700,
          }}>
            Get started
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #e5e7eb' }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto', padding: '1.75rem 2rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.8125rem' }}>
            Sprout · Hedera Apex Hackathon 2026
          </p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link to="/login" style={{ color: '#6b7280', fontSize: '0.8125rem', textDecoration: 'none' }}>Sign in</Link>
            <Link to="/register" style={{ color: '#6b7280', fontSize: '0.8125rem', textDecoration: 'none' }}>Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
