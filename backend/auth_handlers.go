package main

import (
	"errors"
	"net/http"
	"strings"
	"time"
)

const sessionCookie = "pg_session"

type credentials struct {
	Email    string `json:"email"`
	Name     string `json:"name"`
	Password string `json:"password"`
}

func validateAccount(c credentials) string {
	switch {
	case !strings.Contains(c.Email, "@") || len(c.Email) > 200:
		return "Vul een geldig e-mailadres in."
	case strings.TrimSpace(c.Name) == "" || len(c.Name) > 100:
		return "Vul een naam in."
	case len(c.Password) < 8 || len(c.Password) > 200:
		return "Het wachtwoord moet minstens 8 tekens hebben."
	}
	return ""
}

// authStatus tells the frontend who is signed in, and whether the very first
// account still has to be created.
func (a *App) authStatus(w http.ResponseWriter, r *http.Request) {
	n, err := a.countUsers(r.Context())
	if err != nil {
		serverError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"user":        currentUser(r),
		"needsSetup":  n == 0,
		"photoUpload": a.photos != nil,
	})
}

// setup creates the first account, as administrator. It is refused once
// any account exists; after that, administrators add accounts.
func (a *App) setup(w http.ResponseWriter, r *http.Request) {
	var c credentials
	if !readJSON(w, r, 4096, &c) {
		return
	}
	if msg := validateAccount(c); msg != "" {
		writeError(w, http.StatusBadRequest, msg)
		return
	}
	u, err := a.insertFirstAdmin(r.Context(), c)
	if errors.Is(err, errSetupDone) {
		writeError(w, http.StatusConflict, "Er bestaat al een beheerder. Log in.")
		return
	}
	if err != nil {
		serverError(w, err)
		return
	}
	a.startSession(w, r, u)
}

func (a *App) login(w http.ResponseWriter, r *http.Request) {
	var c credentials
	if !readJSON(w, r, 4096, &c) {
		return
	}
	u, err := a.checkPassword(r.Context(), c.Email, c.Password)
	if errors.Is(err, errNotFound) {
		writeError(w, http.StatusUnauthorized, "E-mailadres of wachtwoord klopt niet.")
		return
	}
	if err != nil {
		serverError(w, err)
		return
	}
	a.startSession(w, r, *u)
}

func (a *App) startSession(w http.ResponseWriter, r *http.Request, u User) {
	token, err := a.newSession(r.Context(), u.ID)
	if err != nil {
		serverError(w, err)
		return
	}
	http.SetCookie(w, a.cookie(token, time.Now().Add(sessionTTL)))
	writeJSON(w, http.StatusOK, map[string]any{"user": u})
}

func (a *App) logout(w http.ResponseWriter, r *http.Request) {
	if c, err := r.Cookie(sessionCookie); err == nil {
		_ = a.deleteSession(r.Context(), c.Value)
	}
	http.SetCookie(w, a.cookie("", time.Unix(0, 0)))
	writeJSON(w, http.StatusOK, map[string]any{"user": nil})
}

func (a *App) cookie(value string, expires time.Time) *http.Cookie {
	c := &http.Cookie{Name: sessionCookie, Value: value, Path: "/", Expires: expires,
		HttpOnly: true, Secure: a.cfg.SecureCookies, SameSite: http.SameSiteLaxMode}
	if a.cfg.SecureCookies {
		c.SameSite = http.SameSiteNoneMode
	}
	return c
}

func (a *App) changePassword(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Current string `json:"current"`
		New     string `json:"new"`
	}
	if !readJSON(w, r, 4096, &body) {
		return
	}
	u := currentUser(r)
	if _, err := a.checkPassword(r.Context(), u.Email, body.Current); err != nil {
		writeError(w, http.StatusBadRequest, "Je huidige wachtwoord klopt niet.")
		return
	}
	if len(body.New) < 8 || len(body.New) > 200 {
		writeError(w, http.StatusBadRequest, "Het nieuwe wachtwoord moet minstens 8 tekens hebben.")
		return
	}
	if err := a.setPassword(r.Context(), u.ID, body.New); err != nil {
		serverError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
