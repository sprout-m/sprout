# DAM Marketplace Frontend (React + Vite)

## Run

```bash
npm install
npm run dev
```

## Includes

- Marketplace browse with filters and listing cards
- Listing detail locked/unlocked states
- NDA + PoF request access modal
- Buyer offer submission flow
- Seller listings dashboard
- Seller access request queue with approvals and access levels
- Seller offers kanban board (submitted/shortlisted/accepted/rejected)
- Escrow room flow (deposit -> transfer -> complete)
- My Deals, Messages, and Profile sections

All data is mocked in-memory in `src/context/MarketContext.jsx` for frontend-only iteration.
