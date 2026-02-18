export default function MessagesPage() {
  return (
    <section>
      <div className="page-header">
        <h2>Messages</h2>
        <p>Threaded buyer/seller communication tied to each listing and offer.</p>
      </div>
      <div className="card empty-center">
        <p>No messages yet</p>
        <p style={{ color: 'var(--muted)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
          Conversations with counterparties will appear here once access is granted to a listing.
        </p>
      </div>
    </section>
  );
}
