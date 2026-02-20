import { useState } from 'react';
import { useMarket } from '../context/MarketContext';

const ROLE_COLORS = { buyer: '#6366f1', seller: '#10b981', operator: '#f59e0b' };
const ROLES = ['all', 'buyer', 'seller', 'operator'];

export default function OperatorUsersPage() {
  const { adminUsers } = useMarket();
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = adminUsers.filter((u) => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || u.handle.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Users</h2>
          <p>All registered accounts on the platform.</p>
        </div>
        <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
          {adminUsers.length} total
        </span>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <input
          style={{
            flex: '1 1 200px', maxWidth: '280px',
            background: 'var(--surface)', border: '1px solid var(--line)',
            borderRadius: '6px', padding: '0.4rem 0.75rem',
            color: 'var(--text)', fontSize: '0.875rem',
          }}
          placeholder="Search by handle or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="ob-chip-grid" style={{ margin: 0 }}>
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              className={`ob-chip${roleFilter === r ? ' ob-chip--active' : ''}`}
              onClick={() => setRoleFilter(r)}
              style={{ textTransform: 'capitalize' }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-center">
          <p style={{ color: 'var(--muted)' }}>No users match the current filter.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Hedera Account</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <span style={{
                        width: '2rem', height: '2rem', borderRadius: '50%',
                        background: ROLE_COLORS[u.role] || '#555',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                      }}>
                        {u.handle.charAt(0).toUpperCase()}
                      </span>
                      <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>@{u.handle}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{u.email}</td>
                  <td>
                    <span
                      className="cat-label"
                      style={{
                        background: `${ROLE_COLORS[u.role]}22`,
                        color: ROLE_COLORS[u.role],
                        textTransform: 'capitalize',
                      }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
                    {u.hedera_account_id || <span style={{ color: 'var(--muted-light)' }}>—</span>}
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
