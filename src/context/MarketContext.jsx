import { createContext, useContext, useMemo, useState } from 'react';
import { accessRequestsSeed, escrowsSeed, listingsSeed, offersSeed, users } from '../data/mockData';

const MarketContext = createContext(null);

export function MarketProvider({ children }) {
  const [listings, setListings] = useState(listingsSeed);
  const [accessRequests, setAccessRequests] = useState(accessRequestsSeed);
  const [offers, setOffers] = useState(offersSeed);
  const [escrows, setEscrows] = useState(escrowsSeed);
  const [messageThreads, setMessageThreads] = useState([]);
  const [activeUser, setActiveUser] = useState(users.buyer);

  const startConversation = ({ listingId, buyerId, sellerId = users.seller.id }) => {
    const listingName = listings.find((l) => l.id === listingId)?.anonymizedName || listingId;
    const buyerName = Object.values(users).find((u) => u.id === buyerId)?.handle || buyerId;
    const sellerName = Object.values(users).find((u) => u.id === sellerId)?.handle || sellerId;
    const threadId = `thr-${listingId}-${buyerId}-${sellerId}`;

    setMessageThreads((prev) => {
      if (prev.some((thread) => thread.threadId === threadId)) return prev;

      return [
        {
          threadId,
          listingId,
          buyerId,
          sellerId,
          title: `${listingName} · ${buyerName} <> ${sellerName}`,
          updatedAt: new Date().toISOString(),
          messages: []
        },
        ...prev
      ];
    });

    return threadId;
  };

  const sendMessage = ({ threadId, text, senderId = activeUser.id }) => {
    const body = String(text || '').trim();
    if (!body) return;

    setMessageThreads((prev) => {
      const stamp = new Date().toISOString();
      const next = prev.map((thread) =>
        thread.threadId === threadId
          ? {
              ...thread,
              updatedAt: stamp,
              messages: [
                ...thread.messages,
                {
                  id: `msg-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
                  senderId,
                  text: body,
                  createdAt: stamp
                }
              ]
            }
          : thread
      );

      return next.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    });
  };

  const requestAccess = ({ listingId, ndaSigned, proofMethod, proofAmountUSDC }) => {
    const existing = accessRequests.find((r) => r.listingId === listingId && r.buyerId === activeUser.id);
    if (existing) return;

    setAccessRequests((prev) => [
      {
        id: `ar-${Date.now()}`,
        listingId,
        buyerId: activeUser.id,
        ndaSigned,
        proofOfFundsStatus: proofMethod === 'wallet' ? 'pending' : 'verified',
        proofAmountUSDC,
        proofMethod,
        sellerDecision: 'pending',
        accessLevel: null,
        requestedAt: new Date().toISOString().slice(0, 10)
      },
      ...prev
    ]);
  };

  const decideAccess = ({ requestId, decision, accessLevel }) => {
    setAccessRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              sellerDecision: decision,
              accessLevel: decision === 'approved' ? accessLevel : null,
              proofOfFundsStatus: r.proofOfFundsStatus === 'pending' && decision === 'approved' ? 'verified' : r.proofOfFundsStatus
            }
          : r
      )
    );
  };

  const submitOffer = ({ listingId, amountUSDC, terms, notes }) => {
    const newOffer = {
      offerId: `off-${Date.now()}`,
      listingId,
      buyerId: activeUser.id,
      amountUSDC: Number(amountUSDC),
      terms,
      notes,
      status: 'submitted'
    };
    setOffers((prev) => [newOffer, ...prev]);
  };

  const updateOfferStatus = ({ offerId, status }) => {
    setOffers((prev) =>
      prev.map((offer) => {
        if (offer.offerId !== offerId) return offer;
        if (status === 'accepted') {
          setEscrows((escPrev) => {
            if (escPrev.some((esc) => esc.offerId === offerId)) return escPrev;
            return [
              {
                escrowId: `esc-${Date.now()}`,
                offerId,
                buyerDepositTx: null,
                sellerTransferTx: null,
                amountUSDC: offer.amountUSDC,
                status: 'awaitingDeposit'
              },
              ...escPrev
            ];
          });
        }
        return { ...offer, status };
      })
    );
  };

  const depositEscrow = (escrowId) => {
    setEscrows((prev) =>
      prev.map((esc) =>
        esc.escrowId === escrowId
          ? { ...esc, status: 'funded', buyerDepositTx: `0xdep${Math.random().toString(16).slice(2, 10)}` }
          : esc
      )
    );
  };

  const transferOwnership = (escrowId) => {
    setEscrows((prev) =>
      prev.map((esc) => {
        if (esc.escrowId !== escrowId) return esc;
        const next = {
          ...esc,
          status: 'completed',
          sellerTransferTx: `0xtrf${Math.random().toString(16).slice(2, 10)}`
        };
        return next;
      })
    );
  };

  const openDispute = (escrowId) => {
    const escrow = escrows.find((esc) => esc.escrowId === escrowId);
    if (!escrow || escrow.status === 'completed') return null;

    const offer = offers.find((item) => item.offerId === escrow.offerId);
    if (!offer) return null;

    setEscrows((prev) =>
      prev.map((item) =>
        item.escrowId === escrowId && item.status !== 'completed'
          ? { ...item, status: 'disputed' }
          : item
      )
    );

    const threadId = startConversation({ listingId: offer.listingId, buyerId: offer.buyerId });
    sendMessage({
      threadId,
      senderId: 'system',
      text: 'Dispute opened for this closing. Please coordinate resolution steps here.'
    });

    return { threadId, listingId: offer.listingId, buyerId: offer.buyerId };
  };

  const value = useMemo(
    () => ({
      listings,
      setListings,
      accessRequests,
      offers,
      escrows,
      messageThreads,
      activeUser,
      setActiveUser,
      users,
      startConversation,
      sendMessage,
      requestAccess,
      decideAccess,
      submitOffer,
      updateOfferStatus,
      depositEscrow,
      transferOwnership,
      openDispute
    }),
    [listings, accessRequests, offers, escrows, messageThreads, activeUser]
  );

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return context;
}
