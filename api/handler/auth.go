package handler

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/meridian-mkt/api/middleware"
	"github.com/meridian-mkt/api/model"
	"golang.org/x/crypto/bcrypt"
)

type registerRequest struct {
	Email    string `json:"email"    binding:"required,email"`
	Handle   string `json:"handle"   binding:"required,min=2"`
	Password string `json:"password" binding:"required,min=8"`
	Role     string `json:"role"     binding:"required,oneof=funder organizer verifier admin"`
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

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		fail(c, http.StatusInternalServerError, "failed to hash password")
		return
	}

	var user model.User
	err = h.db.QueryRow(context.Background(), `
		INSERT INTO users (email, handle, role, password_hash)
		VALUES ($1, $2, $3, $4)
		RETURNING id, email, handle, role, created_at
	`, req.Email, req.Handle, req.Role, string(hash)).
		Scan(&user.ID, &user.Email, &user.Handle, &user.Role, &user.CreatedAt)
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
	var passwordHash string
	err := h.db.QueryRow(context.Background(), `
		SELECT id, email, handle, role, password_hash, created_at
		FROM users WHERE email = $1
	`, req.Email).
		Scan(&user.ID, &user.Email, &user.Handle, &user.Role, &passwordHash, &user.CreatedAt)
	if err != nil {
		fail(c, http.StatusUnauthorized, "invalid credentials")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
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

func (h *Handler) Me(c *gin.Context) {
	claims := middleware.GetClaims(c)

	var user model.User
	err := h.db.QueryRow(context.Background(), `
		SELECT id, email, handle, role, created_at
		FROM users WHERE id = $1
	`, claims.UserID).
		Scan(&user.ID, &user.Email, &user.Handle, &user.Role, &user.CreatedAt)
	if err != nil {
		fail(c, http.StatusNotFound, "user not found")
		return
	}

	ok(c, user)
}

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
		UPDATE users SET handle = $1
		WHERE id = $2
		RETURNING id, email, handle, role, created_at
	`, req.Handle, claims.UserID).
		Scan(&user.ID, &user.Email, &user.Handle, &user.Role, &user.CreatedAt)
	if err != nil {
		fail(c, http.StatusInternalServerError, "update failed")
		return
	}

	ok(c, user)
}

// parseUUID extracts a UUID path parameter.
func parseUUID(c *gin.Context, param string) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.Param(param))
	if err != nil {
		fail(c, http.StatusBadRequest, "invalid "+param)
		return uuid.UUID{}, false
	}
	return id, true
}
