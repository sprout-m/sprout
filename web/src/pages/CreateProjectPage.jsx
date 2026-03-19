import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatUsdEstimateFromHbar } from '../utils/currency';

export default function CreateProjectPage() {
  const { createProject } = useApp();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    goal: '',
    total_amount: '',
  });

  const [milestones, setMilestones] = useState([
    { title: '', description: '', amount: '' },
  ]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function setField(k, v) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function setMilestone(i, k, v) {
    setMilestones((prev) => prev.map((m, idx) => idx === i ? { ...m, [k]: v } : m));
  }

  function addMilestone() {
    setMilestones((prev) => [...prev, { title: '', description: '', amount: '' }]);
  }

  function removeMilestone(i) {
    setMilestones((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (milestones.some((m) => !m.title || !m.amount)) {
      setError('All milestones must have a title and amount');
      return;
    }
    setLoading(true);
    try {
      const result = await createProject({
        ...form,
        total_amount: Number(form.total_amount),
        milestones: milestones.map((m, i) => ({
          title: m.title,
          description: m.description,
          amount: Number(m.amount),
          order_index: i + 1,
        })),
      });
      navigate(`/app/projects/${result.project.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Create a Project</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
        Define your project and milestones. Funders invest in HBAR; funds are released only when proof is verified.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
        {/* Project details */}
        <section style={{ background: 'var(--surface, #1a2332)', border: '1px solid var(--border, rgba(255,255,255,0.08))', borderRadius: '10px', padding: '1.25rem' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>Project Details</h2>
          <div style={{ display: 'grid', gap: '0.875rem' }}>
            <div className="ob-field">
              <label className="ob-field-label">Project Name *</label>
              <input className="ob-field-input" value={form.name} onChange={(e) => setField('name', e.target.value)} required placeholder="Community Garden Expansion" />
            </div>
            <div className="ob-field">
              <label className="ob-field-label">Category</label>
              <input className="ob-field-input" value={form.category} onChange={(e) => setField('category', e.target.value)} placeholder="Environment / Food Systems / Education…" />
            </div>
            <div className="ob-field">
              <label className="ob-field-label">Description</label>
              <textarea className="ob-field-input" rows={3} value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="What is this project trying to achieve?" style={{ resize: 'vertical' }} />
            </div>
            <div className="ob-field">
              <label className="ob-field-label">Goal / Impact Metric</label>
              <input className="ob-field-input" value={form.goal} onChange={(e) => setField('goal', e.target.value)} placeholder="Plant 500 trees by Q3 2026" />
            </div>
            <div className="ob-field">
              <label className="ob-field-label">Total Funding (HBAR) *</label>
              <input className="ob-field-input" type="number" min="1" step="0.01" value={form.total_amount} onChange={(e) => setField('total_amount', e.target.value)} required placeholder="10000" />
              {form.total_amount && (
                <div style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
                  {formatUsdEstimateFromHbar(form.total_amount)}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Milestones */}
        <section style={{ background: 'var(--surface, #1a2332)', border: '1px solid var(--border, rgba(255,255,255,0.08))', borderRadius: '10px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Milestones</h2>
            <button type="button" onClick={addMilestone} style={{ background: 'transparent', border: '1px solid #22c55e', color: '#22c55e', padding: '0.25rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8125rem' }}>
              + Add
            </button>
          </div>

          {milestones.map((m, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--muted)' }}>Milestone {i + 1}</span>
                {milestones.length > 1 && (
                  <button type="button" onClick={() => removeMilestone(i)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.8125rem' }}>
                    Remove
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div className="ob-field">
                  <label className="ob-field-label">Title *</label>
                  <input className="ob-field-input" value={m.title} onChange={(e) => setMilestone(i, 'title', e.target.value)} required placeholder="Complete site survey" />
                </div>
                <div className="ob-field">
                  <label className="ob-field-label">Description</label>
                  <input className="ob-field-input" value={m.description} onChange={(e) => setMilestone(i, 'description', e.target.value)} placeholder="What must be done?" />
                </div>
                <div className="ob-field">
                  <label className="ob-field-label">Payout (HBAR) *</label>
                  <input className="ob-field-input" type="number" min="0.01" step="0.01" value={m.amount} onChange={(e) => setMilestone(i, 'amount', e.target.value)} required placeholder="2500" />
                  {m.amount && (
                    <div style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
                      {formatUsdEstimateFromHbar(m.amount)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </section>

        {error && <p style={{ color: 'var(--danger, #e55)', fontSize: '0.8125rem' }}>{error}</p>}

        <button type="submit" className="ob-btn-next" disabled={loading || !form.name || !form.total_amount}>
          {loading ? 'Creating…' : 'Create Project →'}
        </button>
      </form>
    </div>
  );
}
