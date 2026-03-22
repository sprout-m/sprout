import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMarket } from '../context/MarketContext';
import { useWallet } from '../context/WalletContext';

function ProfileRow({ label, value, mono = false }) {
  return (
    <div className="profile-row">
      <span className="profile-row-label">{label}</span>
      <span className={`profile-row-value${mono ? ' mono' : ''}`}>{value}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { activeUser, linkWallet } = useMarket();
  const { accountId, isConnected, connecting, connect, disconnect } = useWallet();
  const location = useLocation();
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState('');

  const network = import.meta.env.VITE_HEDERA_NETWORK || 'testnet';
  const hasLinkedWallet = Boolean(activeUser?.hederaAccountId);
  const walletRequired = activeUser?.role !== 'operator' && !hasLinkedWallet;
  const cameFromWalletGate = Boolean(location.state?.requireWallet);

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

      {/* ── Profile Hero ── */}
      <div className="profile-hero">
        <div className="profile-hero-avatar">
          {activeUser.handle.charAt(0).toUpperCase()}
        </div>
        <div className="profile-hero-body">
          <h2 className="profile-hero-name">{activeUser.handle}</h2>
          <div className="profile-hero-meta">
            <span className="tag" style={{ textTransform: 'capitalize' }}>{activeUser.role}</span>
            <span className="profile-hero-email">{activeUser.email}</span>
          </div>
        </div>
        {hasLinkedWallet && (
          <div className="profile-hero-wallet-badge">
            <span className="profile-wallet-dot" />
            <span className="mono" style={{ fontSize: '0.8125rem' }}>{activeUser.hederaAccountId}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
              {network.charAt(0).toUpperCase() + network.slice(1)}
            </span>
          </div>
        )}
      </div>

      {/* ── Two-column body ── */}
      <div className="profile-layout">

        {/* Left: Identity + Permissions */}
        <div style={{ display: 'grid', gap: '0.75rem', alignContent: 'start' }}>
          <article className="card compact">
            <p className="card-section-label">Identity</p>
            <ProfileRow label="Handle" value={`@${activeUser.handle}`} />
            <ProfileRow label="Email"  value={activeUser.email} />
            <ProfileRow label="Role"   value={activeUser.role.charAt(0).toUpperCase() + activeUser.role.slice(1)} />
          </article>

          <article className="card compact">
            <p className="card-section-label">Permissions</p>
            <ProfileRow label="Marketplace" value="Full Access" />
            <ProfileRow label="Documents"   value="NDA-gated" />
            <ProfileRow
              label="Escrow"
              value={hasLinkedWallet ? 'Active' : 'Link wallet to enable'}
            />
          </article>
        </div>

        {/* Right: Wallet */}
        <article className="card compact">
          <p className="card-section-label">Hedera Wallet</p>
          {walletRequired && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--danger, #e55)', marginBottom: '0.75rem' }}>
              {cameFromWalletGate
                ? 'Link your wallet to continue using Sprout.'
                : 'Wallet link required for escrow and settlement actions.'}
            </p>
          )}

          {hasLinkedWallet && (
            <>
              <ProfileRow label="Account ID"  value={activeUser.hederaAccountId} mono />
              <ProfileRow
                label="Public Key"
                value={activeUser.hederaPublicKey
                  ? activeUser.hederaPublicKey.slice(0, 20) + '…'
                  : '—'}
                mono
              />
              <ProfileRow label="Network" value={network.charAt(0).toUpperCase() + network.slice(1)} />
              <ProfileRow label="Token"   value="USDC (HTS)" />
            </>
          )}

          {!hasLinkedWallet && !isConnected && (
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '1rem' }}>
              Connect your HashPack wallet to participate in USDC escrow and sign on-chain documents.
            </p>
          )}

          {isConnected && (
            <div className="profile-row">
              <span className="profile-row-label">Connected</span>
              <span className="mono" style={{ fontSize: '0.8125rem', color: 'var(--ok, #16a34a)' }}>{accountId}</span>
            </div>
          )}

          <div style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem' }}>
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
              <div className="wallet-linked-badge">
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
            <p className="err-msg">{linkError}</p>
          )}
        </article>
      </div>
    </section>
  );
}
