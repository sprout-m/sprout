export default function StatusPill({ status }) {
  const normalized = String(status || '').toLowerCase();
  return <span className={`status-pill ${normalized}`}>{status}</span>;
}
