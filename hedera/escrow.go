package hedera

import (
	"fmt"

	hedera "github.com/hashgraph/hedera-sdk-go/v2"
)

// CreateProjectAccount creates a new Hedera account controlled solely by the
// platform operator key. This account holds project funds (HBAR) and releases
// them to the organizer after a KMS-signed approval.
func CreateProjectAccount(client *hedera.Client) (hedera.AccountID, error) {
	operatorKey := client.GetOperatorPublicKey()

	txResponse, err := hedera.NewAccountCreateTransaction().
		SetKey(operatorKey).
		SetInitialBalance(hedera.ZeroHbar).
		Execute(client)
	if err != nil {
		return hedera.AccountID{}, fmt.Errorf("create project escrow account: %w", err)
	}

	receipt, err := txResponse.GetReceipt(client)
	if err != nil {
		return hedera.AccountID{}, fmt.Errorf("get project account receipt: %w", err)
	}

	return *receipt.AccountID, nil
}

// ReleaseToOrganizer transfers HBAR from the project escrow account to the
// organizer's account. Called after a verifier's KMS-signed approval.
// amountTinybar is the amount in tinybars (1 HBAR = 100_000_000 tinybars).
func ReleaseToOrganizer(client *hedera.Client, escrowAccountIDStr, organizerAccountIDStr string, amountTinybar int64) (string, error) {
	escrowAccountID, err := hedera.AccountIDFromString(escrowAccountIDStr)
	if err != nil {
		return "", fmt.Errorf("invalid escrow account %q: %w", escrowAccountIDStr, err)
	}

	organizerAccountID, err := hedera.AccountIDFromString(organizerAccountIDStr)
	if err != nil {
		return "", fmt.Errorf("invalid organizer account %q: %w", organizerAccountIDStr, err)
	}

	txResponse, err := hedera.NewTransferTransaction().
		AddHbarTransfer(escrowAccountID, hedera.HbarFromTinybar(-amountTinybar)).
		AddHbarTransfer(organizerAccountID, hedera.HbarFromTinybar(amountTinybar)).
		SetTransactionMemo("Sprout milestone payout").
		Execute(client)
	if err != nil {
		return "", fmt.Errorf("release HBAR to organizer: %w", err)
	}

	receipt, err := txResponse.GetReceipt(client)
	if err != nil {
		return "", fmt.Errorf("get release receipt: %w", err)
	}

	return receipt.TransactionID.String(), nil
}
