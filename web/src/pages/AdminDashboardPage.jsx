import { useApp } from '../context/AppContext';

export default function AdminDashboardPage() {
  const { adminStats, adminUsers, adminProjects } = useApp();

  const statCards = adminStats ? [
    { label: 'Total Users', value: adminStats.total_users },
    { label: 'Funders', value: adminStats.total_funders },
    { label: 'Organizers', value: adminStats.total_organizers },
    { label: 'Verifiers', value: adminStats.total_verifiers },
    { label: 'Active Projects', value: adminStats.projects_active, color: '#4ade80' },
    { label: 'Completed', value: adminStats.projects_completed, color: '#818cf8' },
    { label: 'Total Milestones', value: adminStats.milestones_total },
    { label: 'Approved', value: adminStats.milestones_approved, color: '#4ade80' },
    { label: 'Pending', value: adminStats.milestones_pending, color: '#fbbf24' },
  ] : [];

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Admin Dashboard</h1>

      {adminStats && (
        <>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--muted)' }}>Platform Stats</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
            {statCards.map((s) => (
              <div key={s.label} style={{ background: 'var(--surface, #1a2332)', border: '1px solid var(--border, rgba(255,255,255,0.08))', borderRadius: '8px', padding: '0.875rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{s.label}</div>
                <div style={{ fontWeight: 700, fontSize: '1.375rem', marginTop: '0.25rem', color: s.color || 'inherit' }}>{s.value ?? '–'}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {adminProjects.length > 0 && (
        <>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--muted)' }}>All Projects</h2>
          <div style={{ background: 'var(--surface, #1a2332)', border: '1px solid var(--border, rgba(255,255,255,0.08))', borderRadius: '10px', overflow: 'hidden', marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))' }}>
                  {['Name', 'Category', 'Status', 'Total', 'Released', 'Funder'].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--muted)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {adminProjects.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border, rgba(255,255,255,0.05))' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>{p.name}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--muted)' }}>{p.category}</td>
                    <td style={{ padding: '0.75rem 1rem', textTransform: 'capitalize' }}>{p.status}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>${(p.totalAmount || 0).toLocaleString()}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#4ade80' }}>${(p.amountReleased || 0).toLocaleString()}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--muted)' }}>{p.funder_handle || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {adminUsers.length > 0 && (
        <>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--muted)' }}>Users</h2>
          <div style={{ background: 'var(--surface, #1a2332)', border: '1px solid var(--border, rgba(255,255,255,0.08))', borderRadius: '10px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))' }}>
                  {['Handle', 'Email', 'Role', 'Joined'].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--muted)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border, rgba(255,255,255,0.05))' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>{u.handle}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--muted)' }}>{u.email}</td>
                    <td style={{ padding: '0.75rem 1rem', textTransform: 'capitalize' }}>{u.role}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--muted)' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
