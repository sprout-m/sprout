package hedera

import (
	"fmt"
	"math"

	hedera "github.com/hashgraph/hedera-sdk-go/v2"
)

const usdcDecimals = 6

// usdcToUnits converts a human-readable USDC amount to raw HTS token units.
// USDC uses 6 decimal places: 1.00 USDC == 1_000_000 units.
func usdcToUnits(amount float64) int64 {
	return int64(math.Round(amount * math.Pow10(usdcDecimals)))
}

// BuildEscrowKeyList creates a 2-of-3 threshold KeyList for an escrow account.
//
// Any two of the three parties (buyer, seller, platform) must sign a
// transaction that debits the escrow account. Normal close: platform + buyer.
// Dispute resolution: platform + seller (refund) or platform + buyer (release).
func BuildEscrowKeyList(buyerKey, sellerKey, platformKey hedera.PublicKey) *hedera.KeyList {
	keyList := hedera.NewKeyList()
	keyList.SetThreshold(2)
	keyList.Add(buyerKey)
	keyList.Add(sellerKey)
	keyList.Add(platformKey)
	return keyList
}

// CreateEscrowAccount creates a new Hedera account protected by a 2-of-3
// threshold key and returns its AccountID.
//
// The account is configured to auto-associate one HTS token so it can receive
// USDC without a separate association transaction. The platform operator pays
// the account creation fee.
func CreateEscrowAccount(
	client *hedera.Client,
	buyerPublicKey, sellerPublicKey, platformPublicKey hedera.PublicKey,
) (hedera.AccountID, error) {
	keyList := BuildEscrowKeyList(buyerPublicKey, sellerPublicKey, platformPublicKey)

	txResponse, err := hedera.NewAccountCreateTransaction().
		SetKey(keyList).
		SetInitialBalance(hedera.ZeroHbar).
		// Allow automatic association with one HTS token (USDC).
		// This avoids an extra TokenAssociateTransaction before the buyer deposits.
		SetMaxAutomaticTokenAssociations(1).
		Execute(client)
	if err != nil {
		return hedera.AccountID{}, fmt.Errorf("create escrow account: %w", err)
	}

	receipt, err := txResponse.GetReceipt(client)
	if err != nil {
		return hedera.AccountID{}, fmt.Errorf("get escrow account receipt: %w", err)
	}

	return *receipt.AccountID, nil
}

// BuildDepositTransaction returns an unsigned TransferTransaction that moves
// amountUSDC from the buyer's account into the escrow account.
//
// This transaction must be signed by the buyer (via their wallet / HashPack)
// before it can be submitted to the network.
func BuildDepositTransaction(
	usdcTokenID hedera.TokenID,
	buyerAccountID, escrowAccountID hedera.AccountID,
	amountUSDC float64,
) (*hedera.TransferTransaction, error) {
	if amountUSDC <= 0 {
		return nil, fmt.Errorf("amount must be positive, got %f", amountUSDC)
	}

	units := usdcToUnits(amountUSDC)

	tx := hedera.NewTransferTransaction().
		AddTokenTransfer(usdcTokenID, buyerAccountID, -units).
		AddTokenTransfer(usdcTokenID, escrowAccountID, units)

	return tx, nil
}

// ScheduleRelease creates a Scheduled Transaction on-chain that, once
// co-signed by the buyer, releases the escrow funds to the seller.
//
// Flow:
//  1. Platform calls ScheduleRelease — this submits the schedule and
//     counts as the platform's signature (1 of 2 needed).
//  2. Platform shares the returned ScheduleID with the buyer (via your backend).
//  3. Buyer submits a ScheduleSignTransaction using BuildScheduleSignTx —
//     that is 2 of 3, the threshold is met, funds are released automatically.
//
// Returns the ScheduleID for the buyer to co-sign.
func ScheduleRelease(
	client *hedera.Client,
	usdcTokenID hedera.TokenID,
	escrowAccountID, sellerAccountID hedera.AccountID,
	amountUSDC float64,
	memo string,
) (hedera.ScheduleID, error) {
	if amountUSDC <= 0 {
		return hedera.ScheduleID{}, fmt.Errorf("amount must be positive, got %f", amountUSDC)
	}

	units := usdcToUnits(amountUSDC)

	// Build the inner transfer transaction that will be scheduled.
	scheduledTx, err := hedera.NewTransferTransaction().
		AddTokenTransfer(usdcTokenID, escrowAccountID, -units).
		AddTokenTransfer(usdcTokenID, sellerAccountID, units).
		Schedule()
	if err != nil {
		return hedera.ScheduleID{}, fmt.Errorf("build scheduled release: %w", err)
	}

	txResponse, err := scheduledTx.
		SetScheduleMemo(memo).
		Execute(client)
	if err != nil {
		return hedera.ScheduleID{}, fmt.Errorf("submit schedule create: %w", err)
	}

	receipt, err := txResponse.GetReceipt(client)
	if err != nil {
		return hedera.ScheduleID{}, fmt.Errorf("get schedule receipt: %w", err)
	}

	return *receipt.ScheduleID, nil
}

// ScheduleRefund creates a Scheduled Transaction that returns escrow funds to
// the buyer. Used when a dispute is resolved in the buyer's favour.
//
// Same co-signing flow as ScheduleRelease but the receiving party is the buyer.
// The other co-signer would typically be the seller (platform + seller sign).
func ScheduleRefund(
	client *hedera.Client,
	usdcTokenID hedera.TokenID,
	escrowAccountID, buyerAccountID hedera.AccountID,
	amountUSDC float64,
	memo string,
) (hedera.ScheduleID, error) {
	if amountUSDC <= 0 {
		return hedera.ScheduleID{}, fmt.Errorf("amount must be positive, got %f", amountUSDC)
	}

	units := usdcToUnits(amountUSDC)

	scheduledTx, err := hedera.NewTransferTransaction().
		AddTokenTransfer(usdcTokenID, escrowAccountID, -units).
		AddTokenTransfer(usdcTokenID, buyerAccountID, units).
		Schedule()
	if err != nil {
		return hedera.ScheduleID{}, fmt.Errorf("build scheduled refund: %w", err)
	}

	txResponse, err := scheduledTx.
		SetScheduleMemo(memo).
		Execute(client)
	if err != nil {
		return hedera.ScheduleID{}, fmt.Errorf("submit schedule refund: %w", err)
	}

	receipt, err := txResponse.GetReceipt(client)
	if err != nil {
		return hedera.ScheduleID{}, fmt.Errorf("get refund schedule receipt: %w", err)
	}

	return *receipt.ScheduleID, nil
}

// BuildScheduleSignTx returns an unsigned ScheduleSignTransaction for the given
// schedule. The buyer (or seller) submits this via their wallet to co-sign the
// scheduled release or refund, triggering execution once threshold is met.
func BuildScheduleSignTx(scheduleID hedera.ScheduleID) *hedera.ScheduleSignTransaction {
	return hedera.NewScheduleSignTransaction().
		SetScheduleID(scheduleID)
}

// SignSchedule signs a scheduled transaction using the platform operator key.
// Used when the platform needs to be the second (or first) signer on a
// dispute resolution, rather than a buyer/seller wallet interaction.
func SignSchedule(client *hedera.Client, scheduleID hedera.ScheduleID) error {
	txResponse, err := hedera.NewScheduleSignTransaction().
		SetScheduleID(scheduleID).
		Execute(client)
	if err != nil {
		return fmt.Errorf("sign schedule %s: %w", scheduleID, err)
	}

	_, err = txResponse.GetReceipt(client)
	if err != nil {
		return fmt.Errorf("get sign receipt for %s: %w", scheduleID, err)
	}

	return nil
}
