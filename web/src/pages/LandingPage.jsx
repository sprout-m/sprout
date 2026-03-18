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
      <nav style={{ borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto', padding: '0 2rem',
          height: '88px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <img src="/sproutlogo-transparent.png" alt="Sprout" style={{ height: '76px', width: 'auto' }} />
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Link to="/login" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, padding: '0.5rem 0.875rem' }}>
              Sign in
            </Link>
            <Link to="/register" style={{
              background: '#14532d', color: '#fff', textDecoration: 'none',
              padding: '0.5rem 1.25rem', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600,
            }}>
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — two column */}
      <section style={{ borderBottom: '1px solid #e5e7eb' }}>
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

          {/* Right panel — what's at stake */}
          <div style={{
            borderLeft: '1px solid #e5e7eb',
            padding: '5rem 0 5rem 3rem',
            display: 'flex', flexDirection: 'column', gap: '2rem',
          }}>
            {[
              { stat: 'Escrow-first', desc: 'Funds locked before organizers begin. No capital at risk of misuse.' },
              { stat: 'KMS-signed', desc: 'Every approval is signed by AWS KMS. Tamper-proof by hardware.' },
              { stat: 'On Hedera', desc: 'Consensus timestamps on every event. Permanent, auditable record.' },
            ].map((item) => (
              <div key={item.stat}>
                <p style={{ margin: '0 0 0.375rem', fontWeight: 700, fontSize: '1rem', color: '#14532d', letterSpacing: '-0.01em' }}>
                  {item.stat}
                </p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.65 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flow — horizontal step strip */}
      <section style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
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
                <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', display: 'block', marginBottom: '0.625rem' }}>
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
