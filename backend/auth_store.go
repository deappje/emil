package main

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"golang.org/x/crypto/bcrypt"
)

const sessionTTL = 30 * 24 * time.Hour

var (
	errEmailTaken = errors.New("e-mailadres bestaat al")
	errSetupDone  = errors.New("er bestaat al een account")
)

// dummyHash is compared against when an e-mail address is unknown, so a
// failed login takes as long whether or not the account exists.
var dummyHash, _ = bcrypt.GenerateFromPassword([]byte("plantengids"), 12)

func normalizeEmail(s string) string { return strings.ToLower(strings.TrimSpace(s)) }

func hashToken(token string) []byte {
	sum := sha256.Sum256([]byte(token))
	return sum[:]
}

func (a *App) countUsers(ctx context.Context) (int, error) {
	var n int
	err := a.db.QueryRow(ctx, `SELECT count(*) FROM users`).Scan(&n)
	return n, err
}

func (a *App) insertUser(ctx context.Context, email, name, password, role string) (User, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return User{}, err
	}
	u := User{Email: normalizeEmail(email), Name: strings.TrimSpace(name), Role: role}
	err = a.db.QueryRow(ctx, `INSERT INTO users (email, name, password_hash, role)
		VALUES ($1, $2, $3, $4) RETURNING id`, u.Email, u.Name, string(hash), role).Scan(&u.ID)
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return User{}, errEmailTaken
	}
	return u, err
}

// insertFirstAdmin creates the first account as administrator, under a
// lock so two simultaneous setups cannot both succeed.
func (a *App) insertFirstAdmin(ctx context.Context, c credentials) (User, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(c.Password), 12)
	if err != nil {
		return User{}, err
	}
	u := User{Email: normalizeEmail(c.Email), Name: strings.TrimSpace(c.Name), Role: "admin"}
	err = pgx.BeginFunc(ctx, a.db, func(tx pgx.Tx) error {
		if _, err := tx.Exec(ctx, `SELECT pg_advisory_xact_lock(7316)`); err != nil {
			return err
		}
		var n int
		if err := tx.QueryRow(ctx, `SELECT count(*) FROM users`).Scan(&n); err != nil {
			return err
		}
		if n > 0 {
			return errSetupDone
		}
		return tx.QueryRow(ctx, `INSERT INTO users (email, name, password_hash, role)
			VALUES ($1, $2, $3, 'admin') RETURNING id`, u.Email, u.Name, string(hash)).Scan(&u.ID)
	})
	return u, err
}

// checkPassword returns the user when email and password match.
func (a *App) checkPassword(ctx context.Context, email, password string) (*User, error) {
	var u User
	var hash string
	err := a.db.QueryRow(ctx, `SELECT id, email, name, role, password_hash FROM users
		WHERE email = $1`, normalizeEmail(email)).Scan(&u.ID, &u.Email, &u.Name, &u.Role, &hash)
	if errors.Is(err, pgx.ErrNoRows) {
		_ = bcrypt.CompareHashAndPassword(dummyHash, []byte(password))
		return nil, errNotFound
	}
	if err != nil {
		return nil, err
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) != nil {
		return nil, errNotFound
	}
	return &u, nil
}

func (a *App) setPassword(ctx context.Context, id int64, password string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return err
	}
	_, err = a.db.Exec(ctx, `UPDATE users SET password_hash=$2 WHERE id=$1`, id, string(hash))
	return err
}

// newSession stores a session for the user and returns its secret token.
func (a *App) newSession(ctx context.Context, userID int64) (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	token := base64.RawURLEncoding.EncodeToString(b)
	_, err := a.db.Exec(ctx, `INSERT INTO sessions (token_hash, user_id, expires_at)
		VALUES ($1, $2, $3)`, hashToken(token), userID, time.Now().Add(sessionTTL))
	if err == nil {
		_, err = a.db.Exec(ctx, `DELETE FROM sessions WHERE expires_at < now()`)
	}
	return token, err
}

func (a *App) userBySession(ctx context.Context, token string) (*User, error) {
	var u User
	err := a.db.QueryRow(ctx, `SELECT u.id, u.email, u.name, u.role FROM sessions s
		JOIN users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.expires_at > now()`,
		hashToken(token)).Scan(&u.ID, &u.Email, &u.Name, &u.Role)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (a *App) deleteSession(ctx context.Context, token string) error {
	_, err := a.db.Exec(ctx, `DELETE FROM sessions WHERE token_hash = $1`, hashToken(token))
	return err
}
