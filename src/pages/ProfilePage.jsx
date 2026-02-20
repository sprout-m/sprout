import { useMarket } from '../context/MarketContext';

function ProfileRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4375rem 0', borderBottom: '1px solid var(--line)' }}>
      <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text)' }}>{value}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { activeUser } = useMarket();

  return (
    <section>
      <div className="page-header">
        <h2>Profile</h2>
        <p>Account identity, wallet, and permissions.</p>
      </div>

      <div className="profile-header">
        <div className="avatar">
          {activeUser.handle.charAt(0).toUpperCase()}
        </div>
        <div className="profile-header-info">
          <h3>{activeUser.handle}</h3>
          <p style={{ textTransform: 'capitalize' }}>{activeUser.role} · KYC Verified</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <article className="card compact">
          <h3>Identity</h3>
          <ProfileRow label="Handle" value={activeUser.handle} />
          <ProfileRow label="Role" value={activeUser.role.charAt(0).toUpperCase() + activeUser.role.slice(1)} />
          <ProfileRow label="KYC Status" value="Verified" />
        </article>

        <article className="card compact">
          <h3>Wallet</h3>
          <ProfileRow label="Address" value="0x8f...91c2" />
          <ProfileRow label="Network" value="Base" />
          <ProfileRow label="Token" value="USDC" />
        </article>

        <article className="card compact">
          <h3>Permissions</h3>
          <ProfileRow label="Marketplace" value="Full Access" />
          <ProfileRow label="Documents" value="NDA-gated" />
          <ProfileRow label="Escrow" value="Active" />
        </article>
      </div>
    </section>
  );
}
