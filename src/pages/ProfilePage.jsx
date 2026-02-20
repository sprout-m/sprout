import { useState } from 'react';
import { useMarket } from '../context/MarketContext';
import { useWallet } from '../context/WalletContext';

function ProfileRow({ label, value }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0.4375rem 0', borderBottom: '1px solid var(--line)',
    }}>
      <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text)', fontFamily: label === 'Account ID' || label === 'Public Key' ? 'monospace' : 'inherit', wordBreak: 'break-all', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { activeUser, linkWallet } = useMarket();
  const { accountId, isConnected, connecting, connect, disconnect } = useWallet();
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState('');

  const network = import.meta.env.VITE_HEDERA_NETWORK || 'testnet';
  const hasLinkedWallet = Boolean(activeUser?.hederaAccountId);

  async function handleConnect() {
    setLinkError('');
    await connect();
  }

  async function handleLinkWallet() {
    if (!accountId) return;
    setLinking(true);
    setLinkError('');
    try {
      await linkWallet(accountId);
    } catch (err) {
      setLinkError(err.message || 'Failed to link wallet');
    } finally {
      setLinking(false);
    }
  }

  async function handleDisconnect() {
    await disconnect();
  }

  const walletLinkedAndMatches = hasLinkedWallet && accountId && activeUser.hederaAccountId === accountId;
  const walletLinkedDifferent  = hasLinkedWallet && accountId && activeUser.hederaAccountId !== accountId;

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
          <p style={{ textTransform: 'capitalize' }}>{activeUser.role}</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Identity */}
        <article className="card compact">
          <h3>Identity</h3>
          <ProfileRow label="Handle" value={`@${activeUser.handle}`} />
          <ProfileRow label="Email"  value={activeUser.email} />
          <ProfileRow label="Role"   value={activeUser.role.charAt(0).toUpperCase() + activeUser.role.slice(1)} />
        </article>

        {/* Hedera Wallet */}
        <article className="card compact">
          <h3>Hedera Wallet</h3>

          {hasLinkedWallet && (
            <>
              <ProfileRow label="Account ID"  value={activeUser.hederaAccountId} />
              <ProfileRow
                label="Public Key"
                value={activeUser.hederaPublicKey
                  ? activeUser.hederaPublicKey.slice(0, 16) + '…'
                  : '—'}
              />
              <ProfileRow label="Network"     value={network.charAt(0).toUpperCase() + network.slice(1)} />
              <ProfileRow label="Token"       value="USDC (HTS)" />
            </>
          )}

          {!hasLinkedWallet && !isConnected && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
              Connect your HashPack wallet to participate in USDC escrow.
            </p>
          )}

          {/* Connection status */}
          {isConnected && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.4375rem 0', borderBottom: '1px solid var(--line)',
            }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>Connected</span>
              <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--ok, #10b981)' }}>
                {accountId}
              </span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.75rem' }}>
            {!isConnected && (
              <button onClick={handleConnect} disabled={connecting} style={{ width: '100%' }}>
                {connecting ? 'Opening HashPack…' : 'Connect HashPack'}
              </button>
            )}

            {isConnected && !walletLinkedAndMatches && (
              <button onClick={handleLinkWallet} disabled={linking} style={{ width: '100%' }}>
                {linking ? 'Linking…' : walletLinkedDifferent ? 'Update Linked Wallet' : 'Link Wallet to Account'}
              </button>
            )}

            {isConnected && walletLinkedAndMatches && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.4rem 0.75rem', borderRadius: '6px',
                background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
                fontSize: '0.8125rem', color: 'var(--ok, #10b981)',
              }}>
                <span>✓</span>
                <span>Wallet linked</span>
              </div>
            )}

            {isConnected && (
              <button className="ghost" onClick={handleDisconnect} style={{ width: '100%', fontSize: '0.8125rem' }}>
                Disconnect
              </button>
            )}
          </div>

          {linkError && (
            <p style={{ fontSize: '0.75rem', color: 'var(--danger, #e55)', marginTop: '0.5rem' }}>{linkError}</p>
          )}
        </article>

        {/* Permissions */}
        <article className="card compact">
          <h3>Permissions</h3>
          <ProfileRow label="Marketplace" value="Full Access" />
          <ProfileRow label="Documents"   value="NDA-gated" />
          <ProfileRow label="Escrow"      value={hasLinkedWallet ? 'Active' : 'Link wallet to enable'} />
        </article>
      </div>
    </section>
  );
}
