import { useNavigate } from 'react-router-dom';
import { useMarket } from '../context/MarketContext';

function StatCard({ value, label, warn }) {
  return (
    <div
      className="stat-chip"
      style={warn ? { borderColor: 'var(--danger, #e55)', background: 'rgba(229,85,85,0.08)' } : {}}
    >
      <strong style={warn ? { color: 'var(--danger, #e55)' } : {}}>{value ?? '—'}</strong>
      <span>{label}</span>
    </div>
  );
}

export default function OperatorDashboardPage() {
  const { adminStats, adminUsers, adminListings, adminDisputes } = useMarket();
  const navigate = useNavigate();

  const recentUsers = adminUsers.slice(0, 6);
  const recentListings = adminListings.slice(0, 6);

  const roleColor = { buyer: '#6366f1', seller: '#10b981', operator: '#f59e0b' };

  return (
    <section style={{ display: 'grid', gap: '2rem' }}>
      <div className="page-header">
        <div>
          <h2>Admin Dashboard</h2>
          <p>Platform overview, user activity, and pending actions.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="market-stats">
        <StatCard value={adminStats?.total_users} label="Total Users" />
        <StatCard value={adminStats?.total_buyers} label="Buyers" />
        <StatCard value={adminStats?.total_sellers} label="Sellers" />
        <StatCard value={adminStats?.listings_live} label="Live Listings" />
        <StatCard value={adminStats?.listings_draft} label="Draft Listings" />
        <StatCard value={adminStats?.offers_pending} label="Open Offers" />
        <StatCard value={adminStats?.escrows_funded} label="Funded Escrows" />
        <StatCard
          value={adminStats?.escrows_disputed}
          label="Disputes"
          warn={(adminStats?.escrows_disputed || 0) > 0}
        />
      </div>

      {/* Disputes alert */}
      {adminDisputes.length > 0 && (
        <div
          className="callout"
          style={{
            borderColor: 'var(--danger, #e55)',
            background: 'rgba(229,85,85,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--danger, #e55)' }}>
              {adminDisputes.length} dispute{adminDisputes.length > 1 ? 's' : ''} require resolution
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
              Review each case and choose to release funds or refund the buyer.
            </p>
          </div>
          <button
            onClick={() => navigate('/app/operator/disputes')}
            style={{ whiteSpace: 'nowrap', marginLeft: '1rem' }}
          >
            Resolve Disputes
          </button>
        </div>
      )}

      {/* Two-column: recent users + recent listings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Recent Users */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Recent Users</h3>
            <button
              className="ghost"
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
              onClick={() => navigate('/app/operator/users')}
            >
              View all
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Handle</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.length === 0 ? (
                  <tr><td colSpan={3} style={{ color: 'var(--muted)', textAlign: 'center' }}>No users yet</td></tr>
                ) : recentUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          width: '1.5rem', height: '1.5rem', borderRadius: '50%',
                          background: roleColor[u.role] || '#888',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.65rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                        }}>
                          {u.handle.charAt(0).toUpperCase()}
                        </span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>@{u.handle}</span>
                      </div>
                    </td>
                    <td>
                      <span className="cat-label" style={{ background: `${roleColor[u.role]}22`, color: roleColor[u.role] }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Listings */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Recent Listings</h3>
            <button
              className="ghost"
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
              onClick={() => navigate('/app/operator/listings')}
            >
              View all
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Listing</th>
                  <th>Status</th>
                  <th>Seller</th>
                </tr>
              </thead>
              <tbody>
                {recentListings.length === 0 ? (
                  <tr><td colSpan={3} style={{ color: 'var(--muted)', textAlign: 'center' }}>No listings yet</td></tr>
                ) : recentListings.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{l.anonymized_name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{l.category}</p>
                      </div>
                    </td>
                    <td>
                      <span className="cat-label" style={l.status === 'live' ? { background: '#10b98122', color: '#10b981' } : {}}>
                        {l.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>@{l.seller_handle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
