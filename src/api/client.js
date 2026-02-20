const BASE = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'meridian_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(body?.error || `HTTP ${res.status}`);
  }
  return body?.data ?? body;
}

// ── Normalizers ─────────────────────────────────────────────────────────────

export function normalizeListing(l) {
  return {
    ...l,
    sellerId: l.seller_id,
    anonymizedName: l.anonymized_name,
    industryTags: l.industry_tags || [],
    askingRange: l.asking_range,
    revenueRange: l.revenue_range,
    profitRange: l.profit_range,
    teaserDescription: l.teaser_description,
    ndaRequired: l.nda_required,
    escrowType: l.escrow_type,
    fullFinancials: l.full_financials ?? null,
    dataroomFolders: l.dataroom_folders ?? null,
    createdAt: l.created_at,
    updatedAt: l.updated_at,
  };
}

export function normalizeAccessRequest(r) {
  return {
    ...r,
    listingId: r.listing_id,
    buyerId: r.buyer_id,
    ndaSigned: r.nda_signed,
    proofOfFundsStatus: r.proof_of_funds_status,
    proofAmountUSDC: r.proof_amount_usdc,
    proofMethod: r.proof_method,
    // backend uses 'denied'; pages expect 'rejected'
    sellerDecision: r.seller_decision === 'denied' ? 'rejected' : r.seller_decision,
    accessLevel: r.access_level ?? null,
    requestedAt: r.requested_at,
    decidedAt: r.decided_at ?? null,
  };
}

export function normalizeOffer(o) {
  return {
    ...o,
    offerId: o.id,
    listingId: o.listing_id,
    buyerId: o.buyer_id,
    amountUSDC: o.amount_usdc,
    terms: o.terms ?? null,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  };
}

export function normalizeEscrow(e) {
  return {
    ...e,
    escrowId: e.id,
    offerId: e.offer_id,
    hederaAccountId: e.hedera_account_id,
    hcsTopicId: e.hcs_topic_id,
    scheduleId: e.schedule_id,
    buyerDepositTx: e.buyer_deposit_tx || null,
    sellerTransferTx: e.seller_transfer_tx || null,
    amountUSDC: e.amount_usdc,
    createdAt: e.created_at,
    updatedAt: e.updated_at,
  };
}

export function normalizeThread(t) {
  return {
    ...t,
    threadId: t.id,
    listingId: t.listing_id,
    buyerId: t.buyer_id,
    sellerId: t.seller_id,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    messages: [],
  };
}

export function normalizeMessage(m) {
  return {
    ...m,
    threadId: m.thread_id,
    senderId: m.sender_id,
    senderType: m.sender_type,
    text: m.body,
    createdAt: m.created_at,
  };
}

export function normalizeUser(u) {
  return {
    ...u,
    hederaAccountId: u.hedera_account_id,
    createdAt: u.created_at,
  };
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export const auth = {
  register: (data) =>
    apiFetch('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(data) }).then((d) => ({
      token: d.token,
      user: normalizeUser(d.user),
    })),
  login: (data) =>
    apiFetch('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(data) }).then((d) => ({
      token: d.token,
      user: normalizeUser(d.user),
    })),
  me: () => apiFetch('/api/v1/users/me').then(normalizeUser),
  updateProfile: (data) =>
    apiFetch('/api/v1/users/me', { method: 'PATCH', body: JSON.stringify(data) }).then(normalizeUser),
};

// ── Listings ─────────────────────────────────────────────────────────────────

export const listingsApi = {
  list: () => apiFetch('/api/v1/listings').then((l) => l.map(normalizeListing)),
  get: (id) => apiFetch(`/api/v1/listings/${id}`).then(normalizeListing),
  create: (data) =>
    apiFetch('/api/v1/listings', { method: 'POST', body: JSON.stringify(data) }).then(normalizeListing),
  update: (id, data) =>
    apiFetch(`/api/v1/listings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }).then(normalizeListing),
};

// ── Access requests ───────────────────────────────────────────────────────────

export const accessApi = {
  request: (listingId, data) =>
    apiFetch(`/api/v1/listings/${listingId}/access`, { method: 'POST', body: JSON.stringify(data) }).then(
      normalizeAccessRequest
    ),
  forListing: (listingId) =>
    apiFetch(`/api/v1/listings/${listingId}/access`).then((l) => l.map(normalizeAccessRequest)),
  mine: () => apiFetch('/api/v1/access/mine').then((l) => l.map(normalizeAccessRequest)),
  decide: (requestId, data) =>
    apiFetch(`/api/v1/access/${requestId}`, { method: 'PATCH', body: JSON.stringify(data) }).then(
      normalizeAccessRequest
    ),
};

// ── Offers ────────────────────────────────────────────────────────────────────

export const offersApi = {
  submit: (listingId, data) =>
    apiFetch(`/api/v1/listings/${listingId}/offers`, { method: 'POST', body: JSON.stringify(data) }).then(
      normalizeOffer
    ),
  forListing: (listingId) =>
    apiFetch(`/api/v1/listings/${listingId}/offers`).then((l) => l.map(normalizeOffer)),
  mine: () => apiFetch('/api/v1/offers/mine').then((l) => l.map(normalizeOffer)),
  updateStatus: (offerId, data) =>
    apiFetch(`/api/v1/offers/${offerId}/status`, { method: 'PATCH', body: JSON.stringify(data) }).then(normalizeOffer),
};

// ── Escrows ───────────────────────────────────────────────────────────────────

export const escrowsApi = {
  mine: () => apiFetch('/api/v1/escrows').then((l) => l.map(normalizeEscrow)),
  get: (id) => apiFetch(`/api/v1/escrows/${id}`).then(normalizeEscrow),
  confirmDeposit: (id, txId) =>
    apiFetch(`/api/v1/escrows/${id}/deposit`, {
      method: 'POST',
      body: JSON.stringify({ transaction_id: txId }),
    }).then(normalizeEscrow),
  scheduleRelease: (id) => apiFetch(`/api/v1/escrows/${id}/release`, { method: 'POST' }),
  openDispute: (id) => apiFetch(`/api/v1/escrows/${id}/dispute`, { method: 'POST' }),
  getEvents: (id) => apiFetch(`/api/v1/escrows/${id}/events`),
};

// ── Threads ───────────────────────────────────────────────────────────────────

export const threadsApi = {
  list: () => apiFetch('/api/v1/threads').then((l) => l.map(normalizeThread)),
  start: (data) =>
    apiFetch('/api/v1/threads', { method: 'POST', body: JSON.stringify(data) }).then(normalizeThread),
  getMessages: (threadId) =>
    apiFetch(`/api/v1/threads/${threadId}`).then((msgs) => msgs.map(normalizeMessage)),
  send: (threadId, body) =>
    apiFetch(`/api/v1/threads/${threadId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }).then(normalizeMessage),
};
