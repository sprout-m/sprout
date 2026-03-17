import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function RegisterPage() {
  const { registerUser } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');
  const [role, setRole] = useState('funder');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await registerUser({ email, handle, password, role });
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ob-shell">
      <header className="ob-header">
        <div className="ob-header-inner">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src="/sproutwithwhitetext.png" alt="Sprout" style={{ height: '120px', width: 'auto' }} />
          </Link>
        </div>
      </header>

      <main className="ob-main">
        <div className="ob-screen" style={{ maxWidth: '420px' }}>
          <h1 className="ob-heading">Create your account</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Fund impact. Release on proof.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
            <div className="ob-field">
              <label className="ob-field-label">Email</label>
              <input
                className="ob-field-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="ob-field">
              <label className="ob-field-label">Handle</label>
              <input
                className="ob-field-input"
                type="text"
                placeholder="yourname"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                required
              />
            </div>

            <div className="ob-field">
              <label className="ob-field-label">Role</label>
              <select className="ob-field-input" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="funder">Funder — invest in projects and approve milestone releases</option>
                <option value="organizer">Organizer — create projects and submit proof of progress</option>
              </select>
            </div>

            <div className="ob-field">
              <label className="ob-field-label">Password</label>
              <input
                className="ob-field-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="ob-field">
              <label className="ob-field-label">Confirm Password</label>
              <input
                className="ob-field-input"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p style={{ color: 'var(--danger, #e55)', fontSize: '0.8125rem' }}>{error}</p>
            )}

            <button
              type="submit"
              className="ob-btn-next"
              disabled={loading || !email || !handle || !password || !confirmPassword}
            >
              {loading ? 'Creating account…' : 'Create account →'}
            </button>
          </form>

          <p style={{ marginTop: '1.5rem', fontSize: '0.8125rem', color: 'var(--muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent, #22c55e)' }}>Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
