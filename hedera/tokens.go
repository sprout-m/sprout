package hedera

import (
	"fmt"

	hedera "github.com/hashgraph/hedera-sdk-go/v2"
)

func AssociateToken(client *hedera.Client, accountID hedera.AccountID, tokenID hedera.TokenID) error {
	txResponse, err := hedera.NewTokenAssociateTransaction().
		SetAccountID(accountID).
		SetTokenIDs(tokenID).
		Execute(client)
	if err != nil {
		return fmt.Errorf("associate token %s with account %s: %w", tokenID, accountID, err)
	}

	_, err = txResponse.GetReceipt(client)
	if err != nil {
		return fmt.Errorf("get associate receipt: %w", err)
	}

	return nil
}

func CreateTestStablecoin(client *hedera.Client) (hedera.TokenID, error) {
	operatorAccountID := client.GetOperatorAccountID()
	operatorKey := client.GetOperatorPublicKey()

	txResponse, err := hedera.NewTokenCreateTransaction().
		SetTokenName("Test USDC").
		SetTokenSymbol("tUSDC").
		SetDecimals(6).
		SetInitialSupply(0).
		SetTreasuryAccountID(operatorAccountID).
		SetSupplyKey(operatorKey).
		SetAdminKey(operatorKey).
		Execute(client)
	if err != nil {
		return hedera.TokenID{}, fmt.Errorf("create test stablecoin: %w", err)
	}

	receipt, err := txResponse.GetReceipt(client)
	if err != nil {
		return hedera.TokenID{}, fmt.Errorf("get stablecoin creation receipt: %w", err)
	}

	return *receipt.TokenID, nil
}

func MintTestUSDC(client *hedera.Client, tokenID hedera.TokenID, amountUSDC float64) error {
	units := usdcToUnits(amountUSDC)

	txResponse, err := hedera.NewTokenMintTransaction().
		SetTokenID(tokenID).
		SetAmount(uint64(units)).
		Execute(client)
	if err != nil {
		return fmt.Errorf("mint test USDC: %w", err)
	}

	_, err = txResponse.GetReceipt(client)
	return err
}

func TransferTestUSDC(
	client *hedera.Client,
	tokenID hedera.TokenID,
	recipientAccountID hedera.AccountID,
	amountUSDC float64,
) error {
	operatorAccountID := client.GetOperatorAccountID()

	units := usdcToUnits(amountUSDC)

	txResponse, err := hedera.NewTransferTransaction().
		AddTokenTransfer(tokenID, operatorAccountID, -units).
		AddTokenTransfer(tokenID, recipientAccountID, units).
		Execute(client)
	if err != nil {
		return fmt.Errorf("transfer test USDC to %s: %w", recipientAccountID, err)
	}

	_, err = txResponse.GetReceipt(client)
	return err
}

func CreateListingNFTCollection(client *hedera.Client) (hedera.TokenID, error) {
	operatorAccountID := client.GetOperatorAccountID()
	operatorKey := client.GetOperatorPublicKey()

	txResponse, err := hedera.NewTokenCreateTransaction().
		SetTokenName("Meridian Listing").
		SetTokenSymbol("PVTL").
		SetTokenType(hedera.TokenTypeNonFungibleUnique).
		SetDecimals(0).
		SetInitialSupply(0).
		SetTreasuryAccountID(operatorAccountID).
		SetSupplyKey(operatorKey).
		SetAdminKey(operatorKey).
		Execute(client)
	if err != nil {
		return hedera.TokenID{}, fmt.Errorf("create NFT collection: %w", err)
	}

	receipt, err := txResponse.GetReceipt(client)
	if err != nil {
		return hedera.TokenID{}, fmt.Errorf("get NFT collection receipt: %w", err)
	}

	return *receipt.TokenID, nil
}

func MintListingNFT(client *hedera.Client, collectionTokenID hedera.TokenID, metadata []byte) (int64, error) {
	txResponse, err := hedera.NewTokenMintTransaction().
		SetTokenID(collectionTokenID).
		SetMetadatas([][]byte{metadata}).
		Execute(client)
	if err != nil {
		return 0, fmt.Errorf("mint listing NFT: %w", err)
	}

	receipt, err := txResponse.GetReceipt(client)
	if err != nil {
		return 0, fmt.Errorf("get NFT mint receipt: %w", err)
	}

	if len(receipt.SerialNumbers) == 0 {
		return 0, fmt.Errorf("no serial numbers in NFT mint receipt")
	}

	return receipt.SerialNumbers[0], nil
}

func TransferListingNFT(
	client *hedera.Client,
	collectionTokenID hedera.TokenID,
	serialNumber int64,
	fromAccountID, toAccountID hedera.AccountID,
) error {
	nftID := hedera.NftID{
		TokenID:      collectionTokenID,
		SerialNumber: serialNumber,
	}

	txResponse, err := hedera.NewTransferTransaction().
		AddNftTransfer(nftID, fromAccountID, toAccountID).
		Execute(client)
	if err != nil {
		return fmt.Errorf("transfer NFT serial %d from %s to %s: %w",
			serialNumber, fromAccountID, toAccountID, err)
	}

	_, err = txResponse.GetReceipt(client)
	return err
}
