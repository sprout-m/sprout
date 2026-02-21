package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/meridian-mkt/api/middleware"
	"github.com/meridian-mkt/api/model"
	"golang.org/x/crypto/bcrypt"
)

type registerRequest struct {
	Email           string `json:"email"             binding:"required,email"`
	Handle          string `json:"handle"            binding:"required,min=2"`
	Password        string `json:"password"          binding:"required,min=8"`
	Role            string `json:"role"              binding:"required,oneof=buyer seller"`
	HederaAccountID string `json:"hedera_account_id" binding:"required"`
}

type loginRequest struct {
	Email    string `json:"email"    binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type authResponse struct {
	Token string     `json:"token"`
	User  model.User `json:"user"`
}

func (h *Handler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, err.Error())
		return
	}

	if h.hedera == nil {
		fail(c, http.StatusServiceUnavailable, "wallet verification is unavailable")
		return
	}

	pubKey, err := h.hedera.GetAccountPublicKey(req.HederaAccountID)
	if err != nil {
		fail(c, http.StatusBadRequest, "could not verify Hedera account: "+err.Error())
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		fail(c, http.StatusInternalServerError, "failed to hash password")
		return
	}

	var user model.User
	err = h.db.QueryRow(context.Background(), `
		INSERT INTO users (email, handle, role, hedera_account_id, hedera_public_key, password_hash)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, email, handle, role, COALESCE(hedera_account_id,''), COALESCE(hedera_public_key,''), created_at, updated_at
	`, req.Email, req.Handle, req.Role, req.HederaAccountID, pubKey, string(hash)).
		Scan(&user.ID, &user.Email, &user.Handle, &user.Role,
			&user.HederaAccountID, &user.HederaPublicKey, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		fail(c, http.StatusConflict, "email already registered")
		return
	}

	token, err := middleware.IssueToken(h.cfg.JWTSecret, user.ID, user.Role)
	if err != nil {
		fail(c, http.StatusInternalServerError, "failed to issue token")
		return
	}

	created(c, authResponse{Token: token, User: user})
}

func (h *Handler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, err.Error())
		return
	}

	var user model.User
	err := h.db.QueryRow(context.Background(), `
		SELECT id, email, handle, role, COALESCE(hedera_account_id,''), COALESCE(hedera_public_key,''),
		       password_hash, created_at, updated_at
		FROM users WHERE email = $1
	`, req.Email).
		Scan(&user.ID, &user.Email, &user.Handle, &user.Role,
			&user.HederaAccountID, &user.HederaPublicKey,
			&user.PasswordHash, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		fail(c, http.StatusUnauthorized, "invalid credentials")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		fail(c, http.StatusUnauthorized, "invalid credentials")
		return
	}

	token, err := middleware.IssueToken(h.cfg.JWTSecret, user.ID, user.Role)
	if err != nil {
		fail(c, http.StatusInternalServerError, "failed to issue token")
		return
	}

	ok(c, authResponse{Token: token, User: user})
}

// Me returns the profile of the authenticated user.
func (h *Handler) Me(c *gin.Context) {
	claims := middleware.GetClaims(c)

	var user model.User
	err := h.db.QueryRow(context.Background(), `
		SELECT id, email, handle, role, COALESCE(hedera_account_id,''), COALESCE(hedera_public_key,''), created_at, updated_at
		FROM users WHERE id = $1
	`, claims.UserID).
		Scan(&user.ID, &user.Email, &user.Handle, &user.Role,
			&user.HederaAccountID, &user.HederaPublicKey, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		fail(c, http.StatusNotFound, "user not found")
		return
	}

	ok(c, user)
}

// LinkWallet associates a Hedera account ID and public key with the user's profile.
// The frontend calls this after the user connects their HashPack wallet.
type linkWalletRequest struct {
	HederaAccountID string `json:"hedera_account_id" binding:"required"`
}

func (h *Handler) LinkWallet(c *gin.Context) {
	claims := middleware.GetClaims(c)

	var req linkWalletRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, err.Error())
		return
	}

	// Fetch the public key from the mirror node so we store the real Ed25519 key.
	pubKey, err := h.hedera.GetAccountPublicKey(req.HederaAccountID)
	if err != nil {
		fail(c, http.StatusBadRequest, "could not verify Hedera account: "+err.Error())
		return
	}

	var updatedAt time.Time
	_, err = h.db.Exec(context.Background(), `
		UPDATE users SET hedera_account_id = $1, hedera_public_key = $2, updated_at = NOW()
		WHERE id = $3
		RETURNING updated_at
	`, req.HederaAccountID, pubKey, claims.UserID)
	if err != nil {
		fail(c, http.StatusInternalServerError, "failed to link wallet")
		return
	}
	_ = updatedAt

	ok(c, gin.H{"hedera_account_id": req.HederaAccountID, "hedera_public_key": pubKey})
}

// UpdateProfile allows a user to change their handle.
type updateProfileRequest struct {
	Handle string `json:"handle" binding:"required,min=2"`
}

func (h *Handler) UpdateProfile(c *gin.Context) {
	claims := middleware.GetClaims(c)

	var req updateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, err.Error())
		return
	}

	var user model.User
	err := h.db.QueryRow(context.Background(), `
		UPDATE users SET handle = $1, updated_at = NOW()
		WHERE id = $2
		RETURNING id, email, handle, role, COALESCE(hedera_account_id,''), COALESCE(hedera_public_key,''), created_at, updated_at
	`, req.Handle, claims.UserID).
		Scan(&user.ID, &user.Email, &user.Handle, &user.Role,
			&user.HederaAccountID, &user.HederaPublicKey, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		fail(c, http.StatusInternalServerError, "update failed")
		return
	}

	ok(c, user)
}

// helper to parse UUID from path param
func parseUUID(c *gin.Context, param string) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.Param(param))
	if err != nil {
		fail(c, http.StatusBadRequest, "invalid "+param)
		return uuid.UUID{}, false
	}
	return id, true
}
