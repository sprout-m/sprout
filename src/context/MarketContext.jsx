import { createContext, useContext, useEffect, useState } from 'react';
import {
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
      const [publicListings, myAccess, myOffers] = await Promise.all([
        listingsApi.list().catch(() => []),
        accessApi.mine().catch(() => []),
        offersApi.mine().catch(() => []),
      ]);
      setListings(publicListings);
      setAccessRequests(myAccess);
      setOffers(myOffers);
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
  }

  // ── Listing actions ───────────────────────────────────────────────────────
  async function createListing(data) {
    const l = await listingsApi.create(data);
    // Add immediately so the UI updates before any async reload.
    setListings((prev) => [l, ...prev]);
    return l;
  }

  // ── Access request actions ────────────────────────────────────────────────
  async function requestAccess({ listingId, ndaSigned, proofMethod, proofAmountUSDC }) {
    const ar = await accessApi.request(listingId, {
      nda_signed: ndaSigned,
      proof_method: proofMethod,
      proof_amount_usdc: proofAmountUSDC,
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
      amount_usdc: amountUSDC,
      terms,
      notes,
    });
    setOffers((prev) => [o, ...prev]);
    return o;
  }

  async function updateOfferStatus({ offerId, status }) {
    const o = await offersApi.updateStatus(offerId, { status });
    setOffers((prev) => prev.map((item) => (item.offerId === offerId ? o : item)));
    // If accepted, reload escrows (backend creates one asynchronously)
    if (status === 'accepted') {
      setTimeout(() => {
        escrowsApi.mine().then(setEscrows).catch(() => {});
      }, 2000);
    }
    return o;
  }

  // ── Escrow actions ────────────────────────────────────────────────────────
  async function depositEscrow(escrowId) {
    const fakeTxId = `0.0.${Date.now()}@${Math.floor(Date.now() / 1000)}.0`;
    const e = await escrowsApi.confirmDeposit(escrowId, fakeTxId);
    setEscrows((prev) => prev.map((item) => (item.escrowId === escrowId ? e : item)));
    return e;
  }

  // Kept for UI compatibility — in real flow the operator schedules release
  function transferOwnership(escrowId) {
    setEscrows((prev) =>
      prev.map((esc) =>
        esc.escrowId === escrowId ? { ...esc, status: 'releaseScheduled' } : esc
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
    requestAccess,
    decideAccess,
    submitOffer,
    updateOfferStatus,
    depositEscrow,
    transferOwnership,
    openDispute,
    startConversation,
    loadThreadMessages,
    sendMessage,
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
