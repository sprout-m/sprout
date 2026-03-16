// Package hedera is the Sprout Hedera integration layer.
//
// It provides:
//
//   - Project escrow accounts: simple operator-key accounts that hold HBAR
//     until a KMS-signed milestone approval triggers release (escrow.go).
//
//   - HCS audit trail: every project event (PROJECT_CREATED, PROOF_SUBMITTED,
//     MILESTONE_APPROVED, FUNDS_RELEASED) is logged to a per-project HCS topic,
//     providing an immutable, ordered, consensus-timestamped record (hcs.go).
//
//   - Mirror node queries: read-only REST calls for HCS messages, account info,
//     and transaction verification (mirror.go).
//
// # Typical project lifecycle
//
//  1. Funder creates project → platform calls CreateProjectAccount + CreateDealTopic,
//     logs PROJECT_CREATED.
//  2. Organizer completes milestone work → submits proof via API.
//     Platform logs PROOF_SUBMITTED to HCS.
//  3. Verifier reviews proof → approves → AWS KMS signs approval payload.
//     Platform logs MILESTONE_APPROVED + KMS signature ref to HCS.
//  4. Platform calls ReleaseToOrganizer → HBAR transferred on-chain.
//     Platform logs FUNDS_RELEASED to HCS.
package hedera
