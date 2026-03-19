const BASE = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'sprout_token';

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

async function publicApiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(body?.error || `HTTP ${res.status}`);
  }
  return body?.data ?? body;
}

// ── Normalizers ──────────────────────────────────────────────────────────────

export function normalizeUser(u) {
  return { ...u, hederaAccountId: u.hedera_account_id || '', createdAt: u.created_at };
}

export function normalizeProject(p) {
  return {
    ...p,
    funderId: p.funder_id,
    organizerId: p.organizer_id,
    totalAmount: p.total_amount,
    amountFunded: p.amount_funded || 0,
    amountReleased: p.amount_released,
    hcsTopicId: p.hcs_topic_id,
    hederaEscrowAccount: p.hedera_escrow_account,
    createdAt: p.created_at,
  };
}

export function normalizeMilestone(m) {
  return {
    ...m,
    projectId: m.project_id,
    orderIndex: m.order_index,
    createdAt: m.created_at,
  };
}

export function normalizeProof(p) {
  return {
    ...p,
    milestoneId: p.milestone_id,
    organizerId: p.organizer_id,
    textUpdate: p.text_update,
    imageUrls: p.image_urls || [],
    docUrls: p.doc_urls || [],
    fileHashes: p.file_hashes || [],
    submittedAt: p.submitted_at,
  };
}

export function normalizeApproval(a) {
  return {
    ...a,
    milestoneId: a.milestone_id,
    verifierId: a.verifier_id,
    approvalPayload: a.approval_payload,
    kmsKeyId: a.kms_key_id,
    kmsSignature: a.kms_signature,
    hederaTxId: a.hedera_tx_id,
    decidedAt: a.decided_at,
  };
}

// ── Auth ──────────────────────────────────────────────────────────────────────

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
    apiFetch('/api/v1/users/me', { method: 'PUT', body: JSON.stringify(data) }).then(normalizeUser),
};

// ── Projects ──────────────────────────────────────────────────────────────────

export const projectsApi = {
  list: () => apiFetch('/api/v1/projects').then((l) => l.map(normalizeProject)),
  listPublic: () => publicApiFetch('/api/v1/projects').then((l) => l.map(normalizeProject)),
  myProjects: () => apiFetch('/api/v1/users/me/projects').then((l) => l.map(normalizeProject)),
  get: (id) =>
    apiFetch(`/api/v1/projects/${id}`).then((d) => ({
      project: normalizeProject(d.project),
      milestones: (d.milestones || []).map(normalizeMilestone),
    })),
  create: (data) =>
    apiFetch('/api/v1/projects', { method: 'POST', body: JSON.stringify(data) }).then((d) => ({
      project: normalizeProject(d.project),
      milestones: (d.milestones || []).map(normalizeMilestone),
    })),
  milestones: (id) =>
    apiFetch(`/api/v1/projects/${id}/milestones`).then((l) => l.map(normalizeMilestone)),
  audit: (id) => apiFetch(`/api/v1/projects/${id}/audit`),
};

// ── Investments ───────────────────────────────────────────────────────────────

export const investmentsApi = {
  fund: (projectId, data) =>
    apiFetch(`/api/v1/projects/${projectId}/invest`, { method: 'POST', body: JSON.stringify(data) }),
  myInvestments: () => apiFetch('/api/v1/users/me/investments'),
};

// ── Milestones ────────────────────────────────────────────────────────────────

export const milestonesApi = {
  get: (id) =>
    apiFetch(`/api/v1/milestones/${id}`).then((d) => ({
      milestone: normalizeMilestone(d.milestone),
      proof: d.proof ? normalizeProof(d.proof) : null,
      approval: d.approval ? normalizeApproval(d.approval) : null,
    })),
  submitProof: (id, data) =>
    apiFetch(`/api/v1/milestones/${id}/proof`, { method: 'POST', body: JSON.stringify(data) }).then(normalizeProof),
  approve: (id, data) =>
    apiFetch(`/api/v1/milestones/${id}/approve`, { method: 'POST', body: JSON.stringify(data) }),
  reject: (id, data) =>
    apiFetch(`/api/v1/milestones/${id}/reject`, { method: 'POST', body: JSON.stringify(data) }),
};

// ── Admin ─────────────────────────────────────────────────────────────────────

export const adminApi = {
  stats: () => apiFetch('/api/v1/admin/stats'),
  users: () => apiFetch('/api/v1/admin/users'),
  allProjects: () => apiFetch('/api/v1/admin/projects').then((l) => l.map(normalizeProject)),
};
