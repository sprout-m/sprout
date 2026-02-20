// Package hedera is the meridian Hedera native layer.
//
// It provides primitives for:
//
//   - Escrow accounts secured by a 2-of-3 threshold KeyList (buyer, seller, platform).
//     Funds are released or refunded via Scheduled Transactions that require
//     exactly two of the three parties to co-sign.
//
//   - HCS audit trail: every deal milestone is written as a JSON message to a
//     per-deal HCS topic, giving both parties and the platform an immutable,
//     ordered, timestamped event log.
//
//   - HTS token helpers: USDC token association, a test stablecoin for testnet,
//     and an NFT collection representing listing ownership that transfers on close.
//
//   - Mirror node queries: read-only REST calls for USDC balances, account public
//     keys, HCS topic messages, and scheduled transaction status.
//
//   - Proof of funds: balance-based verification that a buyer holds sufficient
//     USDC before they are granted access to a private listing's data room.
//
// # Typical deal lifecycle
//
//  1. Seller lists a business → platform mints a Listing NFT (tokens.go).
//  2. Buyer requests data room access → platform calls CheckProofOfFunds (proof.go).
//  3. Offer accepted → platform calls CreateEscrowAccount, CreateDealTopic,
//     logs EventEscrowCreated (escrow.go, hcs.go).
//  4. Buyer signs and submits BuildDepositTransaction via their wallet.
//     Platform detects the deposit on mirror node, logs EventEscrowFunded.
//  5. Due-diligence window passes → platform calls ScheduleRelease,
//     logs EventReleaseScheduled, sends ScheduleID to buyer.
//  6. Buyer signs BuildScheduleSignTx via their wallet → threshold met →
//     USDC released to seller automatically. Platform logs EventDealClosed.
//  7. Platform transfers the Listing NFT to the buyer (tokens.go).
//
// # Dispute flow
//
//  1. Either party signals a dispute → platform logs EventDisputeOpened.
//  2. After off-chain arbitration, platform calls ScheduleRelease or
//     ScheduleRefund depending on outcome, then SignSchedule (platform) and
//     asks the winning party to co-sign → logs EventDisputeResolved.
package hedera
