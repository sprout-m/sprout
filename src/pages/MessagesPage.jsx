import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMarket } from '../context/MarketContext';

export default function MessagesPage() {
  const { messageThreads, userCache, user, startConversation, loadThreadMessages, sendMessage } =
    useMarket();
  const location = useLocation();
  const [activeThreadId, setActiveThreadId] = useState('');
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef(null);

  const activeThread = useMemo(
    () => messageThreads.find((t) => t.threadId === activeThreadId) || null,
    [messageThreads, activeThreadId]
  );

  // Open or create a thread when navigated here with listing/buyer state
  useEffect(() => {
    const listingId = location.state?.listingId;
    const buyerId = location.state?.buyerId;
    const sellerId = location.state?.sellerId;
    if (!listingId || (!buyerId && !sellerId)) return;

    startConversation({ listingId, buyerId, sellerId }).then((threadId) => {
      setActiveThreadId(threadId);
    });
  }, [location.state?.listingId, location.state?.buyerId, location.state?.sellerId]);

  // Auto-select first thread when no thread is active
  useEffect(() => {
    if (activeThreadId) return;
    if (!messageThreads.length) return;
    setActiveThreadId(messageThreads[0].threadId);
  }, [activeThreadId, messageThreads]);

  // Load messages when the active thread changes
  useEffect(() => {
    if (!activeThreadId) return;
    loadThreadMessages(activeThreadId);
  }, [activeThreadId]);

  // Scroll to bottom when messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages?.length]);

  const userHandle = (id) => {
    if (id === 'system') return 'System';
    return userCache[id]?.handle || id?.slice(0, 8) || id;
  };

  const relTime = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(iso).toLocaleDateString();
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    const text = draft;
    setDraft('');
    await sendMessage({ threadId: activeThread.threadId, text });
  };

  return (
    <div className="msg-layout">
      <aside className="msg-sidebar">
        <div className="msg-sidebar-head">
          <h2>Messages</h2>
        </div>
        <div className="msg-thread-list">
          {!messageThreads.length && (
            <div style={{ padding: '1rem', fontSize: '0.8125rem', color: 'var(--muted)' }}>
              No conversations yet.
            </div>
          )}
          {messageThreads.map((thread) => {
            const msgs = thread.messages || [];
            const lastMsg = msgs[msgs.length - 1];
            const isActive = thread.threadId === activeThreadId;
            return (
              <button
                key={thread.threadId}
                className={`msg-thread-item${isActive ? ' msg-thread-item--active' : ''}`}
                onClick={() => setActiveThreadId(thread.threadId)}
              >
                <div className="msg-thread-title">{thread.title}</div>
                <div className="msg-thread-preview">
                  {lastMsg ? lastMsg.text : 'No messages yet — start the conversation.'}
                </div>
                <div className="msg-thread-time">{relTime(thread.updatedAt)}</div>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="msg-panel">
        {activeThread ? (
          <>
            <div className="msg-panel-head">
              <div className="msg-panel-title">{activeThread.title}</div>
              <div className="msg-panel-meta">
                {(activeThread.messages || []).length
                  ? `${activeThread.messages.length} message${activeThread.messages.length === 1 ? '' : 's'}`
                  : 'No messages yet'}
              </div>
            </div>

            <div className="msg-body">
              {!(activeThread.messages || []).length ? (
                <div className="msg-empty">
                  <p>No messages yet</p>
                  <p>Start the conversation below.</p>
                </div>
              ) : (
                (activeThread.messages || []).map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  const isSystem = msg.senderId === 'system' || msg.senderType === 'system';
                  if (isSystem) {
                    return (
                      <div key={msg.id} className="msg-row msg-row--system">
                        <div className="msg-system-bubble">{msg.text}</div>
                      </div>
                    );
                  }
                  return (
                    <div key={msg.id} className={`msg-row${isMe ? ' msg-row--me' : ''}`}>
                      <div className={`msg-bubble ${isMe ? 'msg-bubble--me' : 'msg-bubble--other'}`}>
                        <div className="msg-sender">{userHandle(msg.senderId)}</div>
                        <div className="msg-text">{msg.text}</div>
                        <div className="msg-time">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="msg-compose" onSubmit={handleSend}>
              <textarea
                className="msg-compose-input"
                rows={3}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a message…"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend(e);
                }}
              />
              <div className="msg-compose-footer">
                <span className="msg-compose-hint">⌘↵ to send</span>
                <button type="submit" disabled={!draft.trim()}>
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="msg-empty">
            {messageThreads.length ? (
              <>
                <p>Select a thread</p>
                <p>Choose a conversation from the sidebar.</p>
              </>
            ) : (
              <>
                <p>No conversations yet</p>
                <p>
                  Open a conversation from Access Requests or Closing to start messaging.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
