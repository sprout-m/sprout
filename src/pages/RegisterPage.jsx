import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useMarket } from '../context/MarketContext';

export default function RegisterPage() {
  const { registerUser, isAuthenticated } = useMarket();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [role, setRole] = useState('buyer');

  if (isAuthenticated) return <Navigate to="/app" replace />;

  const handleSubmit = (event) => {
    event.preventDefault();
    const user = registerUser({ name, role });
    if (user.role === 'seller') navigate('/seller/listings', { replace: true });
    else navigate('/marketplace', { replace: true });
  };

  return (
    <section className="landing-shell">
      <div className="landing-page">
        <header className="landing-topbar">
          <p className="landing-brand">Meridian Marketplace</p>
          <Link className="small-link" to="/">Back to landing</Link>
        </header>

        <div className="card register-card">
          <div className="page-header">
            <h2>Create your account</h2>
            <p>Choose your role and continue to your dashboard.</p>
          </div>

          <form className="landing-auth-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="form-label" htmlFor="register-name">Full name</label>
              <input
                id="register-name"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-field">
              <p className="form-label">I am registering as</p>
              <div className="landing-role-grid">
                <label className={`landing-role-option${role === 'buyer' ? ' active' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="buyer"
                    checked={role === 'buyer'}
                    onChange={(e) => setRole(e.target.value)}
                  />
                  <span>Buyer</span>
                  <small>Browse opportunities, request access, and submit offers.</small>
                </label>

                <label className={`landing-role-option${role === 'seller' ? ' active' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="seller"
                    checked={role === 'seller'}
                    onChange={(e) => setRole(e.target.value)}
                  />
                  <span>Seller</span>
                  <small>Manage listings, review buyers, and negotiate offers.</small>
                </label>
              </div>
            </div>

            <button type="submit">Continue as {role}</button>
          </form>
        </div>
      </div>
    </section>
  );
}
