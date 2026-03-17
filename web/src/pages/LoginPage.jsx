import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function LoginPage() {
  const { loginUser } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginUser({ email, password });
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
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
        <div className="ob-screen" style={{ maxWidth: '400px' }}>
          <h1 className="ob-heading">Sign in to Sprout</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Fund impact. Release on proof.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
            <div className="ob-field">
              <label className="ob-field-label">Email</label>
              <input
                className="ob-field-input"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="ob-field">
              <label className="ob-field-label">Password</label>
              <input
                className="ob-field-input"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p style={{ color: 'var(--danger, #e55)', fontSize: '0.8125rem' }}>{error}</p>
            )}

            <button
              type="submit"
              className="ob-btn-next"
              disabled={loading || !email || !password}
            >
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <p style={{ marginTop: '1.5rem', fontSize: '0.8125rem', color: 'var(--muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--accent, #22c55e)' }}>Create one</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
