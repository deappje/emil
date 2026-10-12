package main

import (
	"context"
	"net/http"
	"strings"
)

type ctxKey struct{}

// User is a signed-in account as handlers see it.
type User struct {
	ID    int64  `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
	Role  string `json:"role"`
}

func currentUser(r *http.Request) *User {
	u, _ := r.Context().Value(ctxKey{}).(*User)
	return u
}

func userID(r *http.Request) *int64 {
	if u := currentUser(r); u != nil {
		return &u.ID
	}
	return nil
}

// securityHeaders sets the two headers every response carries: the
// Basable editor may frame the app, nobody else may.
func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Security-Policy", "frame-ancestors 'self' https://basable.com")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		next.ServeHTTP(w, r)
	})
}

// csrfGuard requires the X-Requested-With header on every state-changing API
// request. Browsers only send a custom header cross-origin after a CORS
// preflight, which this server never approves, so a forged form post or
// fetch from another site cannot carry the session cookie into a change.
func csrfGuard(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		safe := r.Method == http.MethodGet || r.Method == http.MethodHead || r.Method == http.MethodOptions
		if !safe && strings.HasPrefix(r.URL.Path, "/api/") && r.Header.Get("X-Requested-With") == "" {
			writeError(w, http.StatusForbidden, "Verzoek geweigerd.")
			return
		}
		next.ServeHTTP(w, r)
	})
}

// withUser attaches the session's user, if any, to the request context.
func (a *App) withUser(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if c, err := r.Cookie(sessionCookie); err == nil && strings.HasPrefix(r.URL.Path, "/api/") {
			if u, err := a.userBySession(r.Context(), c.Value); err == nil {
				r = r.WithContext(context.WithValue(r.Context(), ctxKey{}, u))
			}
		}
		next.ServeHTTP(w, r)
	})
}

func requireUser(h http.HandlerFunc) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if currentUser(r) == nil {
			writeError(w, http.StatusUnauthorized, "Log in om dit te doen.")
			return
		}
		h(w, r)
	})
}

func requireAdmin(h http.HandlerFunc) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		u := currentUser(r)
		if u == nil {
			writeError(w, http.StatusUnauthorized, "Log in om dit te doen.")
			return
		}
		if u.Role != "admin" {
			writeError(w, http.StatusForbidden, "Alleen beheerders mogen dit.")
			return
		}
		h(w, r)
	})
}
