package hedera

import (
	"fmt"
	"math"
	"time"

	hedera "github.com/hashgraph/hedera-sdk-go/v2"
)

const usdcDecimals = 6

// usdcToUnits converts a human-readable USDC amount to raw HTS token units.
// USDC uses 6 decimal places: 1.00 USDC == 1_000_000 units.
func usdcToUnits(amount float64) int64 {
	return int64(math.Round(amount * math.Pow10(usdcDecimals)))
}

// CreateEscrowAccount creates a new Hedera account with a 2-of-3 threshold key
// controlled by the buyer, seller, and platform operator. Any two of the three
// parties can authorise a debit — typically platform + buyer (release) or
// platform + seller (refund dispute resolution).
//
// The account auto-associates with one HTS token (USDC) so the buyer can
// deposit without a separate TokenAssociateTransaction.
func CreateEscrowAccount(client *hedera.Client, buyerKey, sellerKey, platformKey hedera.PublicKey) (hedera.AccountID, error) {
	thresholdKey := hedera.NewKeyList().
		SetThreshold(2).
		AddAllPublicKeys([]hedera.PublicKey{buyerKey, sellerKey, platformKey})

	txResponse, err := hedera.NewAccountCreateTransaction().
		SetKey(thresholdKey).
		SetInitialBalance(hedera.ZeroHbar).
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
	// Include a nanosecond timestamp in the inner tx memo to ensure uniqueness
	// across retry attempts. Without this, Hedera deduplicates schedules by
	// inner-tx body — a previously-failed release would hand back the old
	// executed schedule ID, causing CompleteRelease to see an already-set
	// executed_timestamp while USDC remains stuck in escrow.
	// Keep the memo short: Hedera enforces a 100-byte limit.
	innerMemo := fmt.Sprintf("release:%d", time.Now().UnixNano())

	scheduledTx, err := hedera.NewTransferTransaction().
		AddTokenTransfer(usdcTokenID, escrowAccountID, -units).
		AddTokenTransfer(usdcTokenID, sellerAccountID, units).
		SetTransactionMemo(innerMemo).
		// Cap must cover the actual fee at execution time; 2 HBAR is well above
		// the typical ~0.001 HBAR token-transfer fee. Without an explicit cap the
		// SDK default can be lower than the network requires, producing
		// INSUFFICIENT_TX_FEE even when the payer has plenty of HBAR.
		SetMaxTransactionFee(hedera.NewHbar(2)).
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
		SetMaxTransactionFee(hedera.NewHbar(2)).
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
