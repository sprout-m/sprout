package hedera

import "fmt"

func VerifyBalance(network, accountID, usdcTokenID string, requiredUSDC float64) (bool, error) {
	balance, err := GetUSDCBalance(network, accountID, usdcTokenID)
	if err != nil {
		return false, fmt.Errorf("verify balance for %s: %w", accountID, err)
	}
	return balance >= requiredUSDC, nil
}

type ProofOfFundsResult struct {
	AccountID    string
	RequiredUSDC float64
	ActualUSDC   float64
	Verified     bool
}

func CheckProofOfFunds(network, accountID, usdcTokenID string, requiredUSDC float64) (ProofOfFundsResult, error) {
	balance, err := GetUSDCBalance(network, accountID, usdcTokenID)
	if err != nil {
		return ProofOfFundsResult{}, fmt.Errorf("check proof of funds for %s: %w", accountID, err)
	}

	return ProofOfFundsResult{
		AccountID:    accountID,
		RequiredUSDC: requiredUSDC,
		ActualUSDC:   balance,
		Verified:     balance >= requiredUSDC,
	}, nil
}
