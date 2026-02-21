export default function StatusPill({ status }) {
  const raw = String(status || '');
  const normalized = raw.toLowerCase();
  const label = raw
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());

  return <span className={`status-pill ${normalized}`}>{label}</span>;
}
