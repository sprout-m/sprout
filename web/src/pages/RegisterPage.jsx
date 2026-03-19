import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useWallet } from '../context/WalletContext';

const inputStyle = {
  width: '100%', padding: '0.625rem 0.875rem', fontSize: '0.9375rem',
  border: '1px solid #d1d5db', borderRadius: '7px', background: '#fff',
  color: '#111827', outline: 'none', boxSizing: 'border-box',
};

const labelStyle = { fontSize: '0.875rem', fontWeight: 600, color: '#374151' };

export default function RegisterPage() {
  const { registerUser } = useApp();
  const { accountId, isConnected, connecting, connect, disconnect } = useWallet();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');
  const [role, setRole] = useState('funder');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const walletRequired = role === 'funder' || role === 'organizer';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (walletRequired && !accountId) {
      setError('Connect HashPack to continue as a funder or organizer');
      return;
    }
    setLoading(true);
    try {
      await registerUser({ email, handle, password, role, hedera_account_id: walletRequired ? accountId : '' });
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading || connecting || !email || !handle || !password || !confirmPassword || (walletRequired && !accountId);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter', system-ui, sans-serif", WebkitFontSmoothing: 'antialiased' }}>

      <nav style={{ background: 'linear-gradient(135deg, #166534 0%, #14532d 60%, #0f3d20 100%)', height: '80px', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '0 2rem', display: 'flex', alignItems: 'center' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', lineHeight: 0 }}>
            <img src="/sproutwithwhitetext.png" alt="Sprout" style={{ height: '120px', width: 'auto' }} />
          </Link>
        </div>
      </nav>

      <main style={{ display: 'flex', justifyContent: 'center', padding: '4rem 1.5rem' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.625rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a' }}>
            Create your account
          </h1>
          <p style={{ margin: '0 0 2rem', fontSize: '0.9375rem', color: '#6b7280' }}>
            Fund impact. Release on proof.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gap: '0.375rem' }}>
              <label style={labelStyle}>Email</label>
              <input type="email" placeholder="you@example.com" autoFocus required
                value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ display: 'grid', gap: '0.375rem' }}>
              <label style={labelStyle}>Handle</label>
              <input type="text" placeholder="yourname" required
                value={handle} onChange={(e) => setHandle(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ display: 'grid', gap: '0.375rem' }}>
              <label style={labelStyle}>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
                <option value="funder">Funder — invest in projects and approve milestone releases</option>
                <option value="organizer">Organizer — create projects and submit proof of progress</option>
              </select>
            </div>

            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <label style={labelStyle}>Hedera wallet</label>
              <div style={{ padding: '0.875rem 1rem', border: '1px solid #d1d5db', borderRadius: '7px', background: '#fff', fontSize: '0.875rem', color: '#374151' }}>
                {walletRequired
                  ? (accountId
                    ? `Connected HashPack account: ${accountId}`
                    : 'HashPack not connected')
                  : 'Wallet connection is optional for this role.'}
              </div>
              {walletRequired ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {!isConnected ? (
                    <button type="button" className="ghost" onClick={connect} disabled={connecting} style={{ flex: 1 }}>
                      {connecting ? 'Opening HashPack…' : 'Connect HashPack'}
                    </button>
                  ) : (
                    <button type="button" className="ghost" onClick={disconnect} style={{ flex: 1 }}>
                      Disconnect Wallet
                    </button>
                  )}
                </div>
              ) : null}
            </div>

            <div style={{ display: 'grid', gap: '0.375rem' }}>
              <label style={labelStyle}>Password</label>
              <input type="password" placeholder="••••••••" required
                value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ display: 'grid', gap: '0.375rem' }}>
              <label style={labelStyle}>Confirm password</label>
              <input type="password" placeholder="••••••••" required
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} />
            </div>

            {error && <p style={{ margin: 0, fontSize: '0.875rem', color: '#dc2626' }}>{error}</p>}

            <button type="submit" disabled={disabled} style={{
              marginTop: '0.25rem', background: '#14532d', color: '#fff', border: 'none',
              padding: '0.75rem', borderRadius: '7px', fontSize: '0.9375rem', fontWeight: 600,
              cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1,
              transition: 'opacity 0.15s',
            }}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#14532d', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
