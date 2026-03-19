import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { investmentsApi, projectsApi } from '../api/client';
import { useApp } from '../context/AppContext';
import { formatHbarWithUsd } from '../utils/currency';

export default function VerifierDashboardPage() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'funder') {
      Promise.all([projectsApi.list(), investmentsApi.myInvestments()])
        .then(([allProjects, investments]) => {
          const fundedProjectIds = new Set(investments.map((inv) => inv.project_id || inv.projectId));
          setProjects(allProjects.filter((project) => fundedProjectIds.has(project.id)));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
      return;
    }

    projectsApi.list()
      .then(setProjects)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = projects.filter((p) => p.status === 'active');

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Review Queue</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
          {user?.role === 'funder'
          ? 'Review submitted proof and approve or reject milestone payouts on your funded projects.'
            : 'Review submitted proof and approve or reject milestone payouts.'}
        </p>
      </div>

      {loading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}

      {!loading && active.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--muted)', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ margin: 0 }}>No active projects to review right now.</p>
        </div>
      )}

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {active.map((p) => (
          <div
            key={p.id}
            style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '1.125rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', cursor: 'pointer' }}
            onClick={() => navigate(`/app/projects/${p.id}`)}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: '0.15rem' }}>{p.category}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0, fontSize: '0.8125rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--muted)' }}>Released</div>
                <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{formatHbarWithUsd(p.amountReleased || 0)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--muted)' }}>Goal</div>
                <div style={{ fontWeight: 600 }}>{formatHbarWithUsd(p.totalAmount || 0)}</div>
              </div>
              <button className="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/app/projects/${p.id}`); }}>
                Review →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
