import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMarket } from '../context/MarketContext';

const BUYER_STEPS = [
  {
    type: 'single',
    question: 'What is your acquisition budget?',
    options: [
      { value: 'under-250k', label: 'Under $250K', desc: 'Micro SaaS or early-stage deals' },
      { value: '250k-1m', label: '$250K – $1M', desc: 'Small established businesses' },
      { value: '1m-5m', label: '$1M – $5M', desc: 'Mid-market acquisitions' },
      { value: '5m-plus', label: '$5M+', desc: 'Larger deals and platform plays' },
    ],
  },
  {
    type: 'multi',
    question: 'Which business types interest you?',
    subLabel: 'Select all that apply.',
    options: [
      { value: 'SaaS', label: 'SaaS' },
      { value: 'Ecommerce', label: 'Ecommerce' },
      { value: 'Media', label: 'Media / Newsletter' },
      { value: 'Agency', label: 'Agency' },
      { value: 'Marketplace', label: 'Marketplace' },
    ],
  },
  {
    type: 'single',
    question: 'How soon are you looking to close a deal?',
    options: [
      { value: 'now', label: 'Actively looking now' },
      { value: '3mo', label: 'Within 3 months' },
      { value: '6mo', label: '3 – 6 months' },
      { value: 'exploring', label: 'Just exploring for now' },
    ],
  },
  {
    type: 'single',
    question: 'Have you acquired a business before?',
    options: [
      { value: 'yes', label: "Yes, I've completed at least one acquisition" },
      { value: 'no', label: 'No, this would be my first' },
      { value: 'fund', label: "I'm representing a fund or investment group" },
    ],
  },
  {
    type: 'text',
    question: "What's your name?",
    subLabel: 'Used for your buyer profile and correspondence.',
    placeholder: 'Your full name',
    label: 'Full name',
  },
];

const SELLER_STEPS = [
  {
    type: 'text',
    question: 'What is your business called?',
    subLabel: 'This stays private until you approve a buyer.',
    placeholder: 'e.g. Acme Corp',
    label: 'Business name',
    private: true,
  },
  {
    type: 'text',
    question: "What's your business website?",
    subLabel: 'Not shown to buyers until you approve them.',
    placeholder: 'acmecorp.com',
    label: 'Website URL',
    private: true,
  },
  {
    type: 'entity',
    question: 'How would you like to list your business?',
    private: true,
    options: [
      {
        value: 'individual',
        label: 'As an individual',
        desc: 'Sell your business under your own name. Examples include sole proprietors.',
        fields: [
          { key: 'firstName', label: 'Legal first name', placeholder: 'First name' },
          { key: 'lastName', label: 'Legal last name', placeholder: 'Last name' },
        ],
        note: 'This will not be visible to a buyer until they send an offer (LOI).',
      },
      {
        value: 'company',
        label: 'As a company',
        desc: 'Sell your business under your entity name. Examples include LLCs and corporations.',
        fields: [
          { key: 'entityName', label: 'Legal entity name', placeholder: 'e.g. Acme Corp LLC' },
        ],
      },
    ],
  },
  {
    type: 'single',
    question: 'What type of business are you selling?',
    options: [
      { value: 'SaaS', label: 'SaaS', desc: 'Software subscription product' },
      { value: 'Ecommerce', label: 'Ecommerce', desc: 'Online retail or DTC brand' },
      { value: 'Media', label: 'Media / Newsletter', desc: 'Content site, newsletter, or podcast' },
      { value: 'Agency', label: 'Agency', desc: 'Service or consulting business' },
      { value: 'Marketplace', label: 'Marketplace', desc: 'Two-sided platform or directory' },
    ],
  },
  {
    type: 'single',
    question: 'What is your approximate annual revenue?',
    options: [
      { value: 'under-100k', label: 'Under $100K' },
      { value: '100k-500k', label: '$100K – $500K' },
      { value: '500k-2m', label: '$500K – $2M' },
      { value: '2m-plus', label: '$2M+' },
    ],
  },
  {
    type: 'single',
    question: 'Why are you considering selling?',
    options: [
      { value: 'exit', label: 'Looking for a full exit' },
      { value: 'focus', label: 'Want to focus on other projects' },
      { value: 'strategic', label: 'Seeking a strategic acquirer or partner' },
      { value: 'lifestyle', label: 'Retirement or lifestyle change' },
    ],
  },
];

export default function OnboardingPage() {
  const { registerUser } = useMarket();
  const navigate = useNavigate();

  const [role, setRole] = useState(null);
  const [phase, setPhase] = useState('role'); // 'role' | 'survey' | 'auth'
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  // Auth phase state
  const [authHandle, setAuthHandle] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const steps = role === 'buyer' ? BUYER_STEPS : SELLER_STEPS;
  const totalSteps = steps.length;
  const currentStep = phase === 'survey' ? steps[step] : null;

  const canAdvance = () => {
    if (phase === 'role') return role !== null;
    if (phase === 'auth') return authHandle.trim() && authEmail.trim() && authPassword.length >= 8;
    if (!currentStep) return false;
    const ans = answers[step];
    if (currentStep.type === 'multi') return Array.isArray(ans) && ans.length > 0;
    if (currentStep.type === 'text') return typeof ans === 'string' && ans.trim().length > 0;
    if (currentStep.type === 'entity') {
      if (!ans?.entityType) return false;
      const opt = currentStep.options.find((o) => o.value === ans.entityType);
      return opt ? opt.fields.every((f) => (ans[f.key] || '').trim().length > 0) : false;
    }
    return !!ans;
  };

  const handleNext = () => {
    if (phase === 'role') {
      setPhase('survey');
      setStep(0);
      return;
    }
    if (phase === 'survey') {
      if (step < totalSteps - 1) {
        setStep((s) => s + 1);
      } else {
        // Pre-fill handle from survey name answers
        const nameAnswer =
          role === 'buyer'
            ? answers[4] // "What's your name?" step
            : answers[0]; // "What is your business called?"
        setAuthHandle(typeof nameAnswer === 'string' ? nameAnswer : '');
        setPhase('auth');
      }
      return;
    }
    if (phase === 'auth') {
      handleRegister();
    }
  };

  const handleBack = () => {
    if (phase === 'auth') {
      setPhase('survey');
      setStep(totalSteps - 1);
      return;
    }
    if (phase === 'survey' && step > 0) {
      setStep((s) => s - 1);
    } else {
      setPhase('role');
      setStep(0);
    }
  };

  async function handleRegister() {
    setAuthError('');
    setAuthLoading(true);
    try {
      await registerUser({
        email: authEmail,
        handle: authHandle,
        password: authPassword,
        role,
      });
      navigate('/app', { replace: true });
    } catch (err) {
      setAuthError(err.message || 'Registration failed');
    } finally {
      setAuthLoading(false);
    }
  }

  const setSingle = (value) => setAnswers((prev) => ({ ...prev, [step]: value }));
  const setText = (value) => setAnswers((prev) => ({ ...prev, [step]: value }));

  const toggleMulti = (value) => {
    setAnswers((prev) => {
      const current = prev[step] || [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [step]: next };
    });
  };

  // Entity step handlers
  const setEntityType = (entityType) => {
    setAnswers((prev) => ({ ...prev, [step]: { entityType } }));
  };

  const setEntityField = (key, value) => {
    setAnswers((prev) => ({
      ...prev,
      [step]: { ...(prev[step] || {}), [key]: value },
    }));
  };

  return (
    <div className="ob-shell">
      {/* ── Header ── */}
      <header className="ob-header">
        <div className="ob-header-inner">
          <Link to="/">
            <img
              src="/LOGO.png"
              alt="Meridian"
              style={{ height: '36px', filter: 'brightness(0) invert(1)' }}
            />
          </Link>
          <Link to="/" className="ob-exit-link">Exit</Link>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="ob-main">
        {phase === 'auth' ? (
          <div className="ob-screen" style={{ maxWidth: '400px' }}>
            <h1 className="ob-heading">Create your account</h1>
            <p className="ob-sub-label">Almost done — set up your login details.</p>

            <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
              <div className="ob-field">
                <label className="ob-field-label">Display name</label>
                <input
                  className="ob-field-input"
                  type="text"
                  placeholder="How you appear on Meridian"
                  value={authHandle}
                  onChange={(e) => setAuthHandle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="ob-field">
                <label className="ob-field-label">Email</label>
                <input
                  className="ob-field-input"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                />
              </div>
              <div className="ob-field">
                <label className="ob-field-label">Password</label>
                <input
                  className="ob-field-input"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && canAdvance()) handleRegister(); }}
                />
              </div>
              {authError && (
                <p style={{ color: 'var(--danger, #e55)', fontSize: '0.8125rem' }}>{authError}</p>
              )}
            </div>

            <div className="ob-role-footer" style={{ marginTop: '1.5rem' }}>
              <button className="ob-btn-back" onClick={handleBack}>← Back</button>
              <button
                className="ob-btn-next"
                disabled={!canAdvance() || authLoading}
                onClick={handleRegister}
              >
                {authLoading ? 'Creating account…' : 'Create account →'}
              </button>
            </div>

            <p style={{ marginTop: '1rem', fontSize: '0.8125rem', color: 'var(--muted)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--accent, #6366f1)' }}>Sign in</Link>
            </p>
          </div>
        ) : phase === 'role' ? (
          /* Role selection */
          <div className="ob-screen">
            <h1 className="ob-heading">What do you want to do on Meridian?</h1>
            <div className="ob-role-grid">
              <button
                className={`ob-role-card${role === 'buyer' ? ' ob-role-card--active' : ''}`}
                onClick={() => setRole('buyer')}
              >
                <div className="ob-role-icon ob-role-icon--buyer">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
                    <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M8 11h6M11 8v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="ob-role-text">
                  <strong>I want to buy a business</strong>
                  <span>Browse vetted listings, access documents, and make offers</span>
                </div>
                <div className={`ob-radio-dot${role === 'buyer' ? ' ob-radio-dot--on' : ''}`} />
              </button>

              <button
                className={`ob-role-card${role === 'seller' ? ' ob-role-card--active' : ''}`}
                onClick={() => setRole('seller')}
              >
                <div className="ob-role-icon ob-role-icon--seller">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M4.5 7h15l-1.2 4.6a2 2 0 0 1-1.94 1.5H7.64a2 2 0 0 1-1.94-1.5L4.5 7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                    <path d="M6.5 13.1V19h11v-5.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10 19v-3h4v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="ob-role-text">
                  <strong>I want to sell my business</strong>
                  <span>List your business, manage access requests, and close with escrow</span>
                </div>
                <div className={`ob-radio-dot${role === 'seller' ? ' ob-radio-dot--on' : ''}`} />
              </button>
            </div>

            <div className="ob-role-footer">
              <button className="ob-btn-next" disabled={!canAdvance()} onClick={handleNext}>
                Next →
              </button>
            </div>
          </div>
        ) : (
          /* Survey step */
          <div className="ob-screen">
            {currentStep.private && (
              <div className="ob-private-badge">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <rect x="3" y="7" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
                  <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                </svg>
                Private — only visible to you
              </div>
            )}

            <div>
              <p className="ob-step-label">Step {step + 1} of {totalSteps}</p>
              <h1 className="ob-heading">{currentStep.question}</h1>
              {currentStep.subLabel && (
                <p className="ob-sub-label">{currentStep.subLabel}</p>
              )}
            </div>

            {/* Single-select */}
            {currentStep.type === 'single' && (
              <div className="ob-option-list">
                {currentStep.options.map((opt) => (
                  <button
                    key={opt.value}
                    className={`ob-option${answers[step] === opt.value ? ' ob-option--active' : ''}`}
                    onClick={() => setSingle(opt.value)}
                  >
                    <div className="ob-option-body">
                      <span className="ob-option-label">{opt.label}</span>
                      {opt.desc && <span className="ob-option-desc">{opt.desc}</span>}
                    </div>
                    <div className={`ob-radio-dot${answers[step] === opt.value ? ' ob-radio-dot--on' : ''}`} />
                  </button>
                ))}
              </div>
            )}

            {/* Multi-select chips */}
            {currentStep.type === 'multi' && (
              <div className="ob-chip-grid">
                {currentStep.options.map((opt) => {
                  const selected = (answers[step] || []).includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      className={`ob-chip${selected ? ' ob-chip--active' : ''}`}
                      onClick={() => toggleMulti(opt.value)}
                    >
                      {selected && (
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Text input */}
            {currentStep.type === 'text' && (
              <div className="ob-field">
                <label className="ob-field-label">{currentStep.label}</label>
                <input
                  className="ob-field-input"
                  type="text"
                  placeholder={currentStep.placeholder}
                  value={answers[step] || ''}
                  onChange={(e) => setText(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && canAdvance()) handleNext();
                  }}
                />
              </div>
            )}

            {/* Entity — individual vs company */}
            {currentStep.type === 'entity' && (
              <div className="ob-entity-grid">
                {currentStep.options.map((opt) => {
                  const isActive = answers[step]?.entityType === opt.value;
                  const twoCol = opt.fields.length > 1;
                  return (
                    <div
                      key={opt.value}
                      className={`ob-entity-card${isActive ? ' ob-entity-card--active' : ''}`}
                    >
                      {/* Clickable header row */}
                      <div
                        className="ob-entity-head"
                        onClick={() => setEntityType(opt.value)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && setEntityType(opt.value)}
                      >
                        <div className={`ob-radio-dot${isActive ? ' ob-radio-dot--on' : ''}`} />
                        <div className="ob-entity-title">
                          <strong>{opt.label}</strong>
                          <span>{opt.desc}</span>
                        </div>
                      </div>

                      {/* Expanded fields */}
                      {isActive && (
                        <div className="ob-entity-body">
                          <div className={`ob-entity-fields${twoCol ? ' ob-entity-fields--two' : ''}`}>
                            {opt.fields.map((field, fi) => (
                              <div key={field.key} className="ob-field">
                                <label className="ob-field-label">{field.label}</label>
                                <input
                                  className="ob-field-input ob-field-input--sm"
                                  type="text"
                                  placeholder={field.placeholder}
                                  value={(answers[step] || {})[field.key] || ''}
                                  onChange={(e) => setEntityField(field.key, e.target.value)}
                                  autoFocus={fi === 0}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && canAdvance()) handleNext();
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          {opt.note && (
                            <p className="ob-entity-note">{opt.note}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Survey footer ── */}
      {phase === 'survey' && (
        <footer className="ob-footer">
          <div className="ob-progress">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`ob-progress-seg${i <= step ? ' ob-progress-seg--filled' : ''}`}
              />
            ))}
          </div>
          <div className="ob-footer-nav">
            <button className="ob-btn-back" onClick={handleBack}>← Back</button>
            <button className="ob-btn-next" disabled={!canAdvance()} onClick={handleNext}>
              {step === totalSteps - 1 ? 'Continue →' : 'Next →'}
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
