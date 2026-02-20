import { createContext, useContext, useEffect, useState } from 'react';
import {
  adminApi,
  auth,
  accessApi,
  escrowsApi,
  listingsApi,
  offersApi,
  threadsApi,
  clearToken,
  getToken,
  setToken,
} from '../api/client';

const MarketContext = createContext(null);

export function MarketProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const [listings, setListings] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [offers, setOffers] = useState([]);
  const [escrows, setEscrows] = useState([]);
  const [messageThreads, setMessageThreads] = useState([]);
  // Cache of id → { id, handle } for displaying sender names
  const [userCache, setUserCache] = useState({});

  // Operator/admin state
  const [adminStats, setAdminStats] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminListings, setAdminListings] = useState([]);
  const [adminDisputes, setAdminDisputes] = useState([]);

  // ── Session restore ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!getToken()) {
      setInitializing(false);
      return;
    }
    auth
      .me()
      .then((u) => {
        setUser(u);
        cacheUser(u);
      })
      .catch(() => clearToken())
      .finally(() => setInitializing(false));
  }, []);

  // ── Load role data whenever user changes ───────────────────────────────────
  useEffect(() => {
    if (!user) return;
    loadUserData(user);
  }, [user?.id]);

  function cacheUser(u) {
    setUserCache((prev) => ({ ...prev, [u.id]: u }));
  }

  async function loadUserData(u) {
    const [myEscrows, myThreads] = await Promise.all([
      escrowsApi.mine().catch(() => []),
      threadsApi.list().catch(() => []),
    ]);
    setEscrows(myEscrows);
    setMessageThreads(myThreads);

    if (u.role === 'buyer') {
      const [publicListings, myAccess, myOffers] = await Promise.all([
        listingsApi.list().catch(() => []),
        accessApi.mine().catch(() => []),
        offersApi.mine().catch(() => []),
      ]);
      setListings(publicListings);
      setAccessRequests(myAccess);
      setOffers(myOffers);
    }

    if (u.role === 'seller') {
      // Use the authenticated /listings/mine endpoint so draft listings are included.
      const myListings = await listingsApi.mine().catch(() => []);
      setListings(myListings);

      if (myListings.length) {
        const [accessNested, offersNested] = await Promise.all([
          Promise.all(myListings.map((l) => accessApi.forListing(l.id).catch(() => []))),
          Promise.all(myListings.map((l) => offersApi.forListing(l.id).catch(() => []))),
        ]);
        setAccessRequests(accessNested.flat());
        setOffers(offersNested.flat());
      }
    }

    if (u.role === 'operator') {
      const [publicListings, stats, users, allListings, disputes] = await Promise.all([
        listingsApi.list().catch(() => []),
        adminApi.stats().catch(() => null),
        adminApi.users().catch(() => []),
        adminApi.allListings().catch(() => []),
        adminApi.disputes().catch(() => []),
      ]);
      setListings(publicListings);
      setAdminStats(stats);
      setAdminUsers(users);
      setAdminListings(allListings);
      setAdminDisputes(disputes);
    }
  }

  // ── Auth actions ──────────────────────────────────────────────────────────
  async function loginUser({ email, password }) {
    const { token, user: u } = await auth.login({ email, password });
    setToken(token);
    setUser(u);
    cacheUser(u);
  }

  async function registerUser({ email, handle, password, role }) {
    const { token, user: u } = await auth.register({ email, handle, password, role });
    setToken(token);
    setUser(u);
    cacheUser(u);
  }

  function logoutUser() {
    clearToken();
    setUser(null);
    setListings([]);
    setAccessRequests([]);
    setOffers([]);
    setEscrows([]);
    setMessageThreads([]);
    setUserCache({});
    setAdminStats(null);
    setAdminUsers([]);
    setAdminListings([]);
    setAdminDisputes([]);
  }

  // ── Listing actions ───────────────────────────────────────────────────────
  async function createListing(data) {
    const l = await listingsApi.create(data);
    setListings((prev) => [l, ...prev]);
    return l;
  }

  async function updateListing(id, data) {
    const l = await listingsApi.update(id, data);
    setListings((prev) => prev.map((item) => (item.id === id ? l : item)));
    return l;
  }

  // ── Access request actions ────────────────────────────────────────────────
  async function requestAccess({ listingId, ndaSigned, proofMethod, proofAmountUSDC, proofTxId }) {
    const ar = await accessApi.request(listingId, {
      nda_signed: ndaSigned,
      proof_method: proofMethod,
      proof_amount_usdc: Number(proofAmountUSDC),
      ...(proofTxId ? { proof_tx_id: proofTxId } : {}),
    });
    setAccessRequests((prev) => [ar, ...prev]);
    return ar;
  }

  async function decideAccess({ requestId, decision, accessLevel }) {
    // Frontend uses 'rejected'; backend expects 'denied'
    const backendDecision = decision === 'rejected' ? 'denied' : decision;
    const ar = await accessApi.decide(requestId, {
      decision: backendDecision,
      access_level: accessLevel,
    });
    setAccessRequests((prev) => prev.map((r) => (r.id === requestId ? ar : r)));
    return ar;
  }

  // ── Offer actions ─────────────────────────────────────────────────────────
  async function submitOffer({ listingId, amountUSDC, terms, notes }) {
    const o = await offersApi.submit(listingId, {
      amount_usdc: Number(amountUSDC),
      terms,
      notes,
    });
    setOffers((prev) => [o, ...prev]);
    return o;
  }

  async function updateOfferStatus({ offerId, status }) {
    const o = await offersApi.updateStatus(offerId, { status });
    setOffers((prev) => prev.map((item) => (item.offerId === offerId ? o : item)));
    // If accepted, reload escrows — the backend inserts the row synchronously
    // before responding, so it's immediately available.
    if (status === 'accepted') {
      escrowsApi.mine().then(setEscrows).catch(() => {});
    }
    return o;
  }

  // ── Escrow actions ────────────────────────────────────────────────────────
  // Records a completed on-chain deposit against the escrow row.
  // The actual signing happens in EscrowRoomPage via WalletContext.
  async function provisionEscrow(escrowId) {
    const result = await escrowsApi.provision(escrowId);
    if (!result.already_provisioned) {
      setEscrows((prev) => prev.map((e) => (e.escrowId === escrowId ? result : e)));
    }
    return result;
  }

  async function confirmDeposit(escrowId, transactionId) {
    const e = await escrowsApi.confirmDeposit(escrowId, transactionId);
    setEscrows((prev) => prev.map((item) => (item.escrowId === escrowId ? e : item)));
    return e;
  }

  async function linkWallet(hederaAccountId) {
    const result = await auth.linkWallet({ hedera_account_id: hederaAccountId });
    setUser((prev) =>
      prev ? { ...prev, hederaAccountId: result.hedera_account_id, hederaPublicKey: result.hedera_public_key } : prev
    );
    return result;
  }

  async function transferNFT(escrowId) {
    const result = await escrowsApi.transferNFT(escrowId);
    setEscrows((prev) =>
      prev.map((esc) =>
        esc.escrowId === escrowId
          ? { ...esc, sellerTransferTx: result.seller_transfer_tx }
          : esc
      )
    );
  }

  async function openDispute(escrowId) {
    await escrowsApi.openDispute(escrowId);
    setEscrows((prev) =>
      prev.map((esc) =>
        esc.escrowId === escrowId ? { ...esc, status: 'disputed' } : esc
      )
    );
  }

  // ── Admin actions ─────────────────────────────────────────────────────────
  async function adminVerifyListing(id, verified) {
    await adminApi.verifyListing(id, verified);
    setAdminListings((prev) => prev.map((l) => (l.id === id ? { ...l, verified } : l)));
  }

  async function adminToggleListingStatus(listing) {
    const nextStatus = listing.status === 'live' ? 'draft' : 'live';
    await listingsApi.update(listing.id, { status: nextStatus });
    setAdminListings((prev) =>
      prev.map((l) => (l.id === listing.id ? { ...l, status: nextStatus } : l))
    );
  }

  async function resolveDispute(id, resolution) {
    await adminApi.resolveDispute(id, resolution);
    setAdminDisputes((prev) => prev.filter((d) => d.id !== id));
    setAdminStats((prev) =>
      prev ? { ...prev, escrows_disputed: Math.max(0, (prev.escrows_disputed || 1) - 1) } : prev
    );
  }

  // ── Message actions ───────────────────────────────────────────────────────
  async function startConversation({ listingId, buyerId, sellerId }) {
    const body = { listing_id: listingId };
    if (user?.role === 'seller' || user?.role === 'operator') {
      body.buyer_id = buyerId;
    } else {
      body.seller_id = sellerId;
    }

    const thread = await threadsApi.start(body);

    setMessageThreads((prev) => {
      if (prev.some((t) => t.threadId === thread.threadId)) {
        return prev.map((t) => (t.threadId === thread.threadId ? thread : t));
      }
      return [thread, ...prev];
    });

    return thread.threadId;
  }

  async function loadThreadMessages(threadId) {
    const msgs = await threadsApi.getMessages(threadId);
    setMessageThreads((prev) =>
      prev.map((t) => (t.threadId === threadId ? { ...t, messages: msgs } : t))
    );
  }

  async function sendMessage({ threadId, text }) {
    const msg = await threadsApi.send(threadId, text);
    setMessageThreads((prev) =>
      prev.map((t) =>
        t.threadId === threadId
          ? {
              ...t,
              updatedAt: msg.createdAt,
              messages: [...(t.messages || []), msg],
            }
          : t
      )
    );
  }

  // ── Context value ─────────────────────────────────────────────────────────
  const value = {
    // Auth
    user,
    initializing,
    loginUser,
    registerUser,
    logoutUser,
    // For backward compat — pages reference activeUser.*
    activeUser: user,
    // Data
    listings,
    setListings,
    accessRequests,
    offers,
    escrows,
    messageThreads,
    userCache,
    // Actions
    createListing,
    updateListing,
    requestAccess,
    decideAccess,
    submitOffer,
    updateOfferStatus,
    provisionEscrow,
    confirmDeposit,
    linkWallet,
    transferNFT,
    openDispute,
    startConversation,
    loadThreadMessages,
    sendMessage,
    // Admin
    adminStats,
    adminUsers,
    adminListings,
    adminDisputes,
    adminVerifyListing,
    adminToggleListingStatus,
    resolveDispute,
  };

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return context;
}
