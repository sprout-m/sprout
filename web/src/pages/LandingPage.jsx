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
      <section style={{ borderBottom: '1px solid #e5e7eb', background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 52%, #f7fee7 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(20, 83, 45, 0.16) 1.2px, transparent 1.2px)',
          backgroundSize: '16px 16px',
          opacity: 0.65,
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          top: '8%',
          right: '10%',
          width: '340px',
          height: '340px',
          borderRadius: '999px',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.55) 14%, rgba(255, 255, 255, 0.18) 34%, rgba(187, 247, 208, 0.12) 48%, rgba(255, 255, 255, 0) 72%)',
          filter: 'blur(3px)',
          mixBlendMode: 'screen',
          opacity: 0.95,
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          top: '16%',
          right: '16%',
          width: '240px',
          height: '22px',
          borderRadius: '999px',
          background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.72) 35%, rgba(255,255,255,0.28) 62%, rgba(255,255,255,0) 100%)',
          transform: 'rotate(-18deg)',
          filter: 'blur(3px)',
          mixBlendMode: 'screen',
          opacity: 0.9,
          pointerEvents: 'none',
        }} />
        <div style={{
          maxWidth: '1100px', margin: '0 auto', padding: '0 2rem',
          display: 'grid', gridTemplateColumns: '1fr 400px', gap: '4rem', alignItems: 'center',
          minHeight: '480px',
          position: 'relative',
          zIndex: 1,
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

          {/* Right panel — product preview */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 0' }}>
            <div style={{
              width: '100%',
              maxWidth: '390px',
              padding: '1rem',
              border: '1px solid #c7d2df',
              borderRadius: '14px',
              background: 'linear-gradient(180deg, #ffffff 0%, #f8fbf9 100%)',
              boxShadow: '0 18px 36px rgba(15, 23, 42, 0.10)',
              display: 'grid',
              gap: '0.9rem',
            }}>
              <div style={{
                border: '1px solid #d6e0d9',
                borderRadius: '10px',
                background: '#ffffff',
                padding: '0.95rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.7rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '0.3rem' }}>
                      Project
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                      Ocean Plastic Recovery
                    </div>
                  </div>
                  <div style={{
                    alignSelf: 'start',
                    padding: '0.25rem 0.55rem',
                    borderRadius: '999px',
                    background: '#ecfdf5',
                    border: '1px solid #86efac',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: '#166534',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}>
                    Active
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                  {[
                    ['Goal', '$1,200'],
                    ['Raised', '$850'],
                    ['Released', '$300'],
                  ].map(([label, value]) => (
                    <div key={label} style={{
                      border: '1px solid #dbe4ee',
                      borderRadius: '8px',
                      background: '#f8fafc',
                      padding: '0.65rem 0.7rem',
                    }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b', marginBottom: '0.2rem' }}>
                        {label}
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#111827' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                border: '1px solid #d6e0d9',
                borderRadius: '10px',
                background: '#ffffff',
                padding: '0.95rem',
              }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '0.55rem' }}>
                  Audit Trail
                </div>
                <div style={{ display: 'grid', gap: '0.55rem' }}>
                  {[
                    ['Project created', 'Escrow: 0.0.8316001'],
                    ['Proof submitted', 'Milestone 02'],
                    ['Approval signed', 'AWS KMS + Hedera HCS'],
                  ].map(([title, meta]) => (
                    <div key={title} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                      <div style={{ width: '0.55rem', height: '0.55rem', borderRadius: '999px', background: '#16a34a', marginTop: '0.32rem', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#111827' }}>{title}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.1rem' }}>{meta}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
              { n: '01', who: 'Organizer', what: 'Creates a project, defines milestones, and sets the impact goal and funding target.' },
              { n: '02', who: 'Funder', what: 'Funds the project through HashPack and sends HBAR into the project escrow account.' },
              { n: '03', who: 'Organizer', what: 'Executes the work and submits proof with updates, files, and image attachments.' },
              { n: '04', who: 'Sprout + Hedera', what: 'Funders review proof, AWS KMS signs approvals, and Hedera logs and settles releases.' },
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

      <section style={{ borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '3.5rem 2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '4rem', alignItems: 'start' }}>
            <div>
              <p style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af' }}>
                Technical flow
              </p>
              <p style={{ margin: 0, fontSize: '0.9375rem', color: '#374151', lineHeight: 1.7 }}>
                Sprout combines wallet settlement, secure signing, and consensus logging into one milestone release flow.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {[
                {
                  title: 'HashPack Funding',
                  desc: 'Funders connect a Hedera wallet and send converted HBAR into a project-specific escrow account.',
                },
                {
                  title: 'AWS KMS Approval',
                  desc: 'When a funded milestone is approved, Sprout signs the approval payload through AWS KMS.',
                },
                {
                  title: 'Hedera Audit Trail',
                  desc: 'Project creation, proof submission, and approvals are written to Hedera HCS for tamper-evident history.',
                },
              ].map((item) => (
                <div key={item.title} style={{
                  background: '#ffffff',
                  border: '1px solid #d8e1ea',
                  borderRadius: '10px',
                  padding: '1.15rem',
                }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.45rem' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#6b7280', lineHeight: 1.65 }}>
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Roles detail — asymmetric */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '5rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '5rem', alignItems: 'start' }}>
          <div>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af' }}>
              Product roles
            </p>
            <p style={{ margin: 0, fontSize: '0.9375rem', color: '#374151', lineHeight: 1.7 }}>
              Sprout is built around organizers and funders. Organizers define and execute projects.
              Funders provide capital, review submitted proof, and approve milestone releases.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
            {[
              {
                role: 'Organizer',
                desc: 'Defines the project, sets the milestone budget, executes the work, and submits proof for each milestone with updates, files, and images.',
              },
              {
                role: 'Funder',
                desc: 'Backs projects through HashPack, sends HBAR into escrow, reviews proof on projects they funded, and approves or rejects milestone releases.',
              },
              {
                role: 'Infrastructure',
                desc: 'AWS KMS signs approval payloads, Hedera escrows and settles project funds, and HCS creates a tamper-evident audit trail for the full project lifecycle.',
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
            Sprout
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
