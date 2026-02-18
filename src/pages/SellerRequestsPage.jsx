import { useState } from 'react';
import { useMarket } from '../context/MarketContext';
import StatusPill from '../components/StatusPill';

export default function SellerRequestsPage() {
  const { accessRequests, decideAccess, listings, users } = useMarket();
  const [levels, setLevels] = useState({});

  const listingName = (id) => listings.find((l) => l.id === id)?.anonymizedName || id;
  const buyerHandle = (id) => Object.values(users).find((u) => u.id === id)?.handle || id;

  return (
    <section>
      <div className="page-header">
        <h2>Access Requests</h2>
        <p>Review NDA and proof-of-funds submissions, then approve or reject buyer access.</p>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Listing</th>
              <th>Buyer</th>
              <th>NDA</th>
              <th>Proof of Funds</th>
              <th>Submitted</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {accessRequests.map((request) => {
              const isPending = request.sellerDecision === 'pending';
              return (
                <tr key={request.id}>
                  <td>{listingName(request.listingId)}</td>
                  <td>{buyerHandle(request.buyerId)}</td>
                  <td>{request.ndaSigned ? 'Signed' : 'Missing'}</td>
                  <td>
                    {request.proofAmountUSDC.toLocaleString()} USDC
                    {request.proofOfFundsStatus === 'verified' && (
                      <span style={{ color: 'var(--ok)', marginLeft: '0.375rem', fontSize: '0.75rem' }}>✓</span>
                    )}
                  </td>
                  <td>{request.requestedAt}</td>
                  <td>
                    <StatusPill status={request.sellerDecision} />
                  </td>
                  <td>
                    {isPending ? (
                      <div className="action-cell">
                        <div className="action-cell-inline">
                          <select
                            value={levels[request.id] || 'Level 2'}
                            onChange={(e) => setLevels((prev) => ({ ...prev, [request.id]: e.target.value }))}
                          >
                            <option>Level 1</option>
                            <option>Level 2</option>
                            <option>Level 3</option>
                          </select>
                          <button
                            onClick={() =>
                              decideAccess({
                                requestId: request.id,
                                decision: 'approved',
                                accessLevel: levels[request.id] || 'Level 2'
                              })
                            }
                          >
                            Approve
                          </button>
                          <button
                            className="ghost"
                            onClick={() => decideAccess({ requestId: request.id, decision: 'rejected' })}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="decided-row">
                        {request.accessLevel && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{request.accessLevel}</span>
                        )}
                        <button className="ghost" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                          Message
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
