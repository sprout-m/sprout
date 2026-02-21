import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMarket } from '../context/MarketContext';
import { useWallet } from '../context/WalletContext';

export default function RegisterPage() {
  const { registerUser } = useMarket();
  const { isConnected, connecting, accountId, connect } = useWallet();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');
  const [role, setRole] = useState('buyer');
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
      if (!isConnected || !accountId) {
        setError('Connect your wallet to continue');
        return;
      }
      await registerUser({ email, handle, password, role, hederaAccountId: accountId });
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
          <Link to="/">
            <img
              src="/LOGO.png"
              alt="Meridian"
              style={{ height: '36px', filter: 'brightness(0) invert(1)' }}
            />
          </Link>
        </div>
      </header>

      <main className="ob-main">
        <div className="ob-screen" style={{ maxWidth: '420px' }}>
          <h1 className="ob-heading">Create your account</h1>

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
              <label className="ob-field-label">Handle</label>
              <input
                className="ob-field-input"
                type="text"
                autoComplete="username"
                placeholder="yourname"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                required
              />
            </div>

            <div className="ob-field">
              <label className="ob-field-label">Role</label>
              <select className="ob-field-input" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
              </select>
            </div>

            <div className="ob-field">
              <label className="ob-field-label">Wallet (required)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="ghost"
                  style={{ fontSize: '0.8125rem', padding: '0.375rem 0.625rem' }}
                  onClick={connect}
                  disabled={connecting}
                >
                  {connecting ? 'Connecting…' : (isConnected ? 'Reconnect Wallet' : 'Connect Wallet')}
                </button>
                <span style={{ fontSize: '0.75rem', color: isConnected ? 'var(--ok)' : 'var(--muted)' }}>
                  {isConnected && accountId ? `Connected: ${accountId}` : 'No wallet connected'}
                </span>
              </div>
            </div>

            <div className="ob-field">
              <label className="ob-field-label">Password</label>
              <input
                className="ob-field-input"
                type="password"
                autoComplete="new-password"
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
                autoComplete="new-password"
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
              disabled={loading || !email || !handle || !password || !confirmPassword || !isConnected || !accountId}
            >
              {loading ? 'Creating account…' : 'Create account →'}
            </button>
          </form>

          <p style={{ marginTop: '1.5rem', fontSize: '0.8125rem', color: 'var(--muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent, #6366f1)' }}>
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
