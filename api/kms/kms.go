package kms

import (
	"context"
	"encoding/base64"
	"fmt"
	"os"

	"github.com/aws/aws-sdk-go-v2/config"
	awskms "github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/kms/types"
)

// Service wraps AWS KMS for cryptographic signing of milestone approvals.
// The private key never leaves KMS — only the signature is returned.
type Service struct {
	client *awskms.Client
	keyID  string
}

// New creates a KMS service using the AWS default credential chain
// (env vars AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY, IAM role, etc.)
func New(region, keyID string) (*Service, error) {
	cfg, err := config.LoadDefaultConfig(context.Background(),
		config.WithRegion(region),
	)
	if err != nil {
		return nil, fmt.Errorf("load AWS config: %w", err)
	}

	return &Service{
		client: awskms.NewFromConfig(cfg),
		keyID:  keyID,
	}, nil
}

// NewFromEnv creates a KMS service reading region and key ID from environment variables.
func NewFromEnv() (*Service, error) {
	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "us-east-1"
	}
	keyID := os.Getenv("AWS_KMS_KEY_ID")
	if keyID == "" {
		return nil, fmt.Errorf("AWS_KMS_KEY_ID is required for approval signing")
	}
	return New(region, keyID)
}

// SignApproval signs the given payload bytes using AWS KMS ECDSA_SHA_256.
// Returns the KMS key ID and a base64-encoded signature.
// The private key never leaves KMS.
func (s *Service) SignApproval(payload []byte) (keyID, signatureBase64 string, err error) {
	result, err := s.client.Sign(context.Background(), &awskms.SignInput{
		KeyId:            &s.keyID,
		Message:          payload,
		MessageType:      types.MessageTypeRaw,
		SigningAlgorithm: types.SigningAlgorithmSpecEcdsaSha256,
	})
	if err != nil {
		return "", "", fmt.Errorf("KMS sign: %w", err)
	}

	sig := base64.StdEncoding.EncodeToString(result.Signature)
	return s.keyID, sig, nil
}

// GetPublicKey returns the PEM-encoded public key for the configured KMS key.
// Used for client-side verification display in the audit UI.
func (s *Service) GetPublicKey() (string, error) {
	result, err := s.client.GetPublicKey(context.Background(), &awskms.GetPublicKeyInput{
		KeyId: &s.keyID,
	})
	if err != nil {
		return "", fmt.Errorf("KMS get public key: %w", err)
	}

	// Return DER bytes as base64 (callers can wrap in PEM if needed)
	return base64.StdEncoding.EncodeToString(result.PublicKey), nil
}

// Enabled returns false when KMS_KEY_ID is not configured (dev/test mode).
// In dev mode SignApproval returns a mock signature so the app still works.
func (s *Service) Enabled() bool {
	return s.keyID != ""
}
