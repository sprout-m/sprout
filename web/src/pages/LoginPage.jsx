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
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter', system-ui, sans-serif", WebkitFontSmoothing: 'antialiased' }}>

      {/* Nav */}
      <nav style={{ background: 'linear-gradient(135deg, #166534 0%, #14532d 60%, #0f3d20 100%)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem', height: '80px', display: 'flex', alignItems: 'center' }}>
          <Link to="/">
            <img src="/sproutwithwhitetext.png" alt="Sprout" style={{ height: '120px', width: 'auto' }} />
          </Link>
        </div>
      </nav>

      {/* Form */}
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '5rem 1.5rem' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.625rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a' }}>
            Sign in
          </h1>
          <p style={{ margin: '0 0 2rem', fontSize: '0.9375rem', color: '#6b7280' }}>
            Fund impact. Release on proof.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gap: '0.375rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Email</label>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                style={{
                  width: '100%', padding: '0.625rem 0.875rem', fontSize: '0.9375rem',
                  border: '1px solid #d1d5db', borderRadius: '7px', background: '#fff',
                  color: '#111827', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'grid', gap: '0.375rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Password</label>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%', padding: '0.625rem 0.875rem', fontSize: '0.9375rem',
                  border: '1px solid #d1d5db', borderRadius: '7px', background: '#fff',
                  color: '#111827', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {error && (
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#dc2626' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              style={{
                marginTop: '0.25rem',
                background: loading || !email || !password ? '#86efac' : '#14532d',
                color: '#fff', border: 'none', padding: '0.75rem',
                borderRadius: '7px', fontSize: '0.9375rem', fontWeight: 600,
                cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#14532d', fontWeight: 600, textDecoration: 'none' }}>Create one</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
