import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { investmentsApi, projectsApi } from '../api/client';
import { useApp } from '../context/AppContext';
import { useWallet } from '../context/WalletContext';
import { convertUsdToHbar, formatHbarFromAmount, formatUsdAmount, formatUsdEstimateFromHbar } from '../utils/currency';

const msStatusLabel = {
  pending:   { text: 'Pending',   color: '#9ca3af' },
  submitted: { text: 'In Review', color: '#d97706' },
  approved:  { text: 'Approved',  color: '#15803d' },
  rejected:  { text: 'Rejected',  color: '#dc2626' },
};

const inputStyle = {
  width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.875rem',
  border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff',
  color: '#111827', outline: 'none', boxSizing: 'border-box',
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useApp();
  const { isConnected, accountId, connecting, connect, transferHBAR } = useWallet();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [fundAmount, setFundAmount] = useState('');
  const [fundLoading, setFundLoading] = useState(false);
  const [fundError, setFundError] = useState('');
  const [fundResult, setFundResult] = useState(null);
  const [canFunderReview, setCanFunderReview] = useState(false);

  useEffect(() => {
    projectsApi.get(id)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (user?.role !== 'funder') {
      setCanFunderReview(false);
      return;
    }
    investmentsApi.myInvestments()
      .then((items) => {
        setCanFunderReview(items.some((inv) => (inv.project_id || inv.projectId) === id));
      })
      .catch(() => setCanFunderReview(false));
  }, [id, user?.role]);

  async function handleFund(e) {
    e.preventDefault();
    setFundError('');
    setFundResult(null);
    setFundLoading(true);
    try {
      if (!p.hederaEscrowAccount) {
        throw new Error('Project escrow account is still provisioning. Refresh in a moment and try again.');
      }

      let fromAccount = accountId;
      if (!isConnected) {
        fromAccount = await connect();
      }
      if (!fromAccount) {
        throw new Error('No wallet connected. Pair HashPack and try again.');
      }

      const fundAmountHbar = Number(convertUsdToHbar(fundAmount).toFixed(2));
      if (fundAmountHbar <= 0) {
        throw new Error('Funding amount must be greater than zero.');
      }

      const txId = await transferHBAR(fromAccount, p.hederaEscrowAccount, fundAmountHbar);
      const result = await investmentsApi.fund(id, { amount: fundAmountHbar, hedera_tx_id: txId });
      setFundResult(result);
      setFundAmount('');
      projectsApi.get(id).then(setData).catch(() => {});
    } catch (err) {
      setFundError(err.message || 'Investment failed');
    } finally {
      setFundLoading(false);
    }
  }

  if (loading) return <p style={{ color: '#9ca3af' }}>Loading…</p>;
  if (error) return <p style={{ color: '#dc2626' }}>{error}</p>;
  if (!data) return null;

  const { project: p, milestones } = data;
  const funded = p.amountFunded || 0;
  const released = p.amountReleased || 0;
  const goal = p.totalAmount || 0;
  const fundingPct = goal > 0 ? Math.min(100, (funded / goal) * 100) : 0;

  const projectStats = [
    { label: 'Funding Goal', usd: formatUsdEstimateFromHbar(goal), hbar: formatHbarFromAmount(goal) },
    { label: 'Raised', usd: formatUsdEstimateFromHbar(funded), hbar: formatHbarFromAmount(funded), green: true },
    { label: 'Released', usd: formatUsdEstimateFromHbar(released), hbar: formatHbarFromAmount(released) },
  ];
  const showFundingCard = user?.role === 'funder' && p.status === 'active';
  const fundAmountHbar = convertUsdToHbar(fundAmount);

  return (
    <div className="project-detail-page">
      <section className="project-detail-hero">
        <div className="project-detail-hero-copy">
          {p.category && (
            <p className="project-detail-eyebrow">{p.category}</p>
          )}
          <h1 className="project-detail-title">{p.name}</h1>
          {p.description && (
            <p className="project-detail-description">{p.description}</p>
          )}
        </div>
        <div className="project-detail-hero-actions">
          <div className="project-detail-status-card">
            <div className="project-detail-status-label">Project Status</div>
            <div className="project-detail-status-value">{p.status || 'Active'}</div>
            {p.hederaEscrowAccount && (
              <div className="project-detail-status-meta">Escrow: {p.hederaEscrowAccount}</div>
            )}
          </div>
          <Link to={`/app/projects/${id}/audit`}>
            <button className="ghost" style={{ whiteSpace: 'nowrap' }}>Audit Trail</button>
          </Link>
        </div>
      </section>

      <section className="project-detail-stats-row">
        {projectStats.map((s) => (
          <div key={s.label} className="project-detail-stat-card">
            <div className="project-detail-stat-label">{s.label}</div>
            <div className={`project-detail-stat-value${s.green ? ' is-green' : ''}`}>{s.usd}</div>
            <div className="project-detail-stat-hbar">{s.hbar}</div>
          </div>
        ))}
      </section>

      <div className={`project-detail-summary-grid${showFundingCard ? '' : ' is-single'}`}>
        <section className="project-detail-card">
          <div className="project-detail-section-head">
            <div>
              <div className="project-detail-section-kicker">Project Overview</div>
              <h2>Funding progress and delivery plan</h2>
            </div>
          </div>

          <div className="project-detail-progress-card">
            <div className="project-detail-progress-head">
              <span>Funding Progress</span>
              <strong>{Math.round(fundingPct)}%</strong>
            </div>
            <div className="project-detail-progress-bar">
              <div style={{ width: `${fundingPct}%` }} />
            </div>
            {p.goal && (
              <p className="project-detail-goal-copy">
                <span>Impact goal:</span> {p.goal}
              </p>
            )}
          </div>
        </section>

        {showFundingCard && (
          <section className="project-detail-card project-detail-funding-card">
            <div className="project-detail-section-head">
              <div>
                <div className="project-detail-section-kicker">Live Settlement</div>
                <h2>Fund this project</h2>
              </div>
            </div>
            <p className="project-detail-funding-copy">
              Enter a USD amount and HashPack will send the converted HBAR into the project escrow.
            </p>
            {fundResult ? (
              <div>
                <p style={{ margin: '0 0 0.75rem', fontWeight: 600, color: '#14532d' }}>Investment recorded on Hedera.</p>
                <div className="project-detail-note">
                  <div className="project-detail-note-label">Escrow account</div>
                  <code style={{ color: '#14532d', fontWeight: 700, wordBreak: 'break-all' }}>{p.hederaEscrowAccount || fundResult.escrow_account}</code>
                  {fundResult.investment?.hedera_tx_id && (
                    <div style={{ color: '#64748b', marginTop: '0.5rem' }}>Transaction: {fundResult.investment.hedera_tx_id}</div>
                  )}
                </div>
                <button className="ghost" onClick={() => setFundResult(null)}>Make another investment</button>
              </div>
            ) : (
              <form onSubmit={handleFund} style={{ display: 'grid', gap: '0.875rem' }}>
                <div style={{ display: 'grid', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151' }}>Amount (USD)</label>
                  <input type="number" min="0.01" step="0.01" placeholder="500" required style={inputStyle}
                    value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} />
                  {fundAmount && (
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {formatUsdAmount(fundAmount)} · {formatHbarFromAmount(fundAmountHbar.toFixed(2))}
                    </div>
                  )}
                </div>
                <div className="project-detail-note">
                  {!p.hederaEscrowAccount
                    ? 'Hedera escrow account is still provisioning for this project. Wait a moment, then refresh before funding.'
                    : `HashPack will send ${formatHbarFromAmount(fundAmountHbar.toFixed(2) || 0)} from your connected wallet to escrow account ${p.hederaEscrowAccount}.`}
                </div>
                {fundError && <p style={{ margin: 0, fontSize: '0.875rem', color: '#dc2626' }}>{fundError}</p>}
                <div>
                  <button type="submit" disabled={fundLoading || connecting || !fundAmount || !p.hederaEscrowAccount}>
                    {fundLoading ? 'Waiting for HashPack…' : !isConnected ? 'Connect HashPack & Invest' : 'Invest with HashPack'}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}
      </div>

      <section className="project-detail-card">
        <div className="project-detail-section-head">
          <div>
            <div className="project-detail-section-kicker">Execution Plan</div>
            <h2>Milestones</h2>
          </div>
        </div>

        <div className="project-detail-milestones">
          {milestones.map((ms, idx) => {
            const meta = msStatusLabel[ms.status] || msStatusLabel.pending;
            const canSubmit = user?.role === 'organizer' && user?.id === p.organizerId && ms.status === 'pending';
            const canReview =
              ((user?.role === 'verifier') || (user?.role === 'funder' && canFunderReview)) &&
              ms.status === 'submitted';
            return (
              <div key={ms.id} className="project-detail-milestone-row">
                <div className="project-detail-milestone-index">
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div className="project-detail-milestone-copy">
                  <div className="project-detail-milestone-title">{ms.title}</div>
                  {ms.description && (
                    <div className="project-detail-milestone-description">{ms.description}</div>
                  )}
                </div>
                <div className="project-detail-milestone-side">
                  <div className="project-detail-milestone-amounts">
                    <div className="project-detail-milestone-usd">{formatUsdEstimateFromHbar(ms.amount || 0)}</div>
                    <div className="project-detail-milestone-hbar">{formatHbarFromAmount(ms.amount || 0)}</div>
                    <div style={{ color: meta.color }} className="project-detail-milestone-status">{meta.text}</div>
                  </div>
                  {canSubmit && (
                    <button onClick={() => navigate(`/app/milestones/${ms.id}/proof`)}>Submit Proof</button>
                  )}
                  {canReview && (
                    <button onClick={() => navigate(`/app/milestones/${ms.id}/review`)}>Review</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
