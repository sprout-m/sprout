import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { milestonesApi } from '../api/client';
import { formatHbarFromAmount, formatUsdEstimateFromHbar } from '../utils/currency';

export default function ProofSubmissionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [milestone, setMilestone] = useState(null);
  const [form, setForm] = useState({ text_update: '', doc_urls: '', file_hashes: '' });
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    milestonesApi.get(id)
      .then((d) => setMilestone(d.milestone))
      .catch((e) => setError(e.message))
      .finally(() => setFetchLoading(false));
  }, [id]);

  async function filesToDataUrls(files) {
    return Promise.all(files.map((file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.readAsDataURL(file);
    })));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const parseList = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);
      const imageUrls = await filesToDataUrls(imageFiles);
      await milestonesApi.submitProof(id, {
        text_update: form.text_update,
        image_urls: imageUrls,
        doc_urls: parseList(form.doc_urls),
        file_hashes: parseList(form.file_hashes),
      });
      navigate(`/app/projects/${milestone?.projectId || ''}`, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to submit proof');
    } finally {
      setLoading(false);
    }
  }

  if (fetchLoading) return <p style={{ color: 'var(--muted)' }}>Loading…</p>;
  if (error && !milestone) return <p style={{ color: '#f87171' }}>{error}</p>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Submit Proof</h1>
      {milestone && (
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          Milestone: <strong style={{ color: 'inherit' }}>{milestone.title}</strong> — {formatUsdEstimateFromHbar(milestone.amount || 0)} payout on approval
          <span style={{ display: 'block', marginTop: '0.2rem', fontSize: '0.75rem' }}>{formatHbarFromAmount(milestone.amount || 0)}</span>
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
        <div style={{ background: 'var(--surface, #1a2332)', border: '1px solid var(--border, rgba(255,255,255,0.08))', borderRadius: '10px', padding: '1.25rem' }}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div className="ob-field">
              <label className="ob-field-label">Progress Update *</label>
              <textarea
                className="ob-field-input"
                rows={5}
                required
                value={form.text_update}
                onChange={(e) => setForm((p) => ({ ...p, text_update: e.target.value }))}
                placeholder="Describe what was accomplished. Include measurable outcomes, dates, and any relevant context for the verifier."
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="ob-field">
              <label className="ob-field-label">Attach Images</label>
              <input
                className="ob-field-input"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
              />
              {imageFiles.length > 0 && (
                <div style={{ display: 'grid', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
                  {imageFiles.map((file) => (
                    <div key={`${file.name}-${file.size}`}>{file.name}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="ob-field">
              <label className="ob-field-label">Document URLs (one per line)</label>
              <textarea
                className="ob-field-input"
                rows={2}
                value={form.doc_urls}
                onChange={(e) => setForm((p) => ({ ...p, doc_urls: e.target.value }))}
                placeholder="https://drive.google.com/..."
                style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.8125rem' }}
              />
            </div>

            <div className="ob-field">
              <label className="ob-field-label">File Hashes (SHA-256, one per line)</label>
              <textarea
                className="ob-field-input"
                rows={2}
                value={form.file_hashes}
                onChange={(e) => setForm((p) => ({ ...p, file_hashes: e.target.value }))}
                placeholder="abc123def456..."
                style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.8125rem' }}
              />
            </div>
          </div>
        </div>

        {error && <p style={{ color: 'var(--danger, #f87171)', fontSize: '0.8125rem' }}>{error}</p>}

        <button type="submit" className="ob-btn-next" disabled={loading || !form.text_update}>
          {loading ? 'Submitting…' : 'Submit Proof →'}
        </button>
      </form>
    </div>
  );
}
