import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectsApi } from '../api/client';

const eventColors = {
  PROJECT_CREATED:    { color: '#818cf8', bg: 'rgba(99,102,241,0.12)', icon: '🌱' },
  PROOF_SUBMITTED:    { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', icon: '📤' },
  MILESTONE_APPROVED: { color: '#4ade80', bg: 'rgba(34,197,94,0.12)',  icon: '✅' },
  MILESTONE_REJECTED: { color: '#f87171', bg: 'rgba(239,68,68,0.12)',  icon: '❌' },
  FUNDS_RELEASED:     { color: '#34d399', bg: 'rgba(52,211,153,0.12)', icon: '💸' },
};

export default function AuditTimelinePage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    projectsApi.audit(id)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Audit Timeline</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.875rem' }}>
            Tamper-evident event trail stored on Hedera HCS
          </p>
        </div>
        <Link to={`/app/projects/${id}`}>
          <button style={{ background: 'transparent', border: '1px solid var(--border, rgba(255,255,255,0.12))', color: 'var(--muted)', padding: '0.4rem 0.875rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8125rem' }}>
            ← Project
          </button>
        </Link>
      </div>

      {data?.hcs_topic_id && (
        <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', padding: '0.875rem 1rem', marginBottom: '1.5rem', fontSize: '0.8125rem' }}>
          <span style={{ color: '#818cf8', fontWeight: 600 }}>HCS Topic: </span>
          <span style={{ fontFamily: 'monospace' }}>{data.hcs_topic_id}</span>
          <a
            href={`https://hashscan.io/testnet/topic/${data.hcs_topic_id}`}
            target="_blank"
            rel="noreferrer"
            style={{ marginLeft: '1rem', color: '#818cf8', fontSize: '0.75rem' }}
          >
            View on HashScan ↗
          </a>
        </div>
      )}

      {loading && <p style={{ color: 'var(--muted)' }}>Fetching HCS events…</p>}
      {error && <p style={{ color: '#f87171' }}>{error}</p>}

      {!loading && data?.note && (
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{data.note}</p>
      )}

      {!loading && data?.events?.length === 0 && !data?.note && (
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>No events yet. They will appear here as the project progresses.</p>
      )}

      {/* Timeline */}
      <div style={{ position: 'relative', paddingLeft: '2rem' }}>
        <div style={{ position: 'absolute', left: '0.75rem', top: 0, bottom: 0, width: '2px', background: 'var(--border, rgba(255,255,255,0.08))' }} />

        {(data?.events || []).map((ev, i) => {
          const style = eventColors[ev.type] || { color: '#9ca3af', bg: 'rgba(156,163,175,0.12)', icon: '•' };
          return (
            <div key={i} style={{ position: 'relative', marginBottom: '1.5rem' }}>
              {/* Dot */}
              <div style={{ position: 'absolute', left: '-1.6rem', top: '0.25rem', width: '1.25rem', height: '1.25rem', background: style.bg, border: `2px solid ${style.color}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>
                {style.icon}
              </div>

              <div style={{ background: 'var(--surface, #1a2332)', border: '1px solid var(--border, rgba(255,255,255,0.08))', borderRadius: '10px', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ background: style.bg, color: style.color, padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
                    {ev.type}
                  </span>
                  {ev.timestamp && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                      {new Date(ev.timestamp).toLocaleString()}
                    </span>
                  )}
                </div>

                {ev.payload && Object.keys(ev.payload).length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    {Object.entries(ev.payload).map(([k, v]) => (
                      <div key={k} style={{ fontSize: '0.8125rem', marginBottom: '0.2rem' }}>
                        <span style={{ color: 'var(--muted)' }}>{k}: </span>
                        <span style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
