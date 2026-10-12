package main

import (
	"errors"
	"net/http"
	"time"
)

type userRow struct {
	User
	CreatedAt time.Time `json:"createdAt"`
}

func (a *App) listUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := a.db.Query(r.Context(), `SELECT id, email, name, role, created_at
		FROM users ORDER BY lower(name)`)
	if err != nil {
		serverError(w, err)
		return
	}
	defer rows.Close()
	users := []userRow{}
	for rows.Next() {
		var u userRow
		if err := rows.Scan(&u.ID, &u.Email, &u.Name, &u.Role, &u.CreatedAt); err != nil {
			serverError(w, err)
			return
		}
		users = append(users, u)
	}
	writeJSON(w, http.StatusOK, users)
}

// createUser adds an account with a starting password the administrator
// passes on; the new user can change it under their account menu.
func (a *App) createUser(w http.ResponseWriter, r *http.Request) {
	var body struct {
		credentials
		Role string `json:"role"`
	}
	if !readJSON(w, r, 4096, &body) {
		return
	}
	if msg := validateAccount(body.credentials); msg != "" {
		writeError(w, http.StatusBadRequest, msg)
		return
	}
	if body.Role != "admin" {
		body.Role = "editor"
	}
	u, err := a.insertUser(r.Context(), body.Email, body.Name, body.Password, body.Role)
	if errors.Is(err, errEmailTaken) {
		writeError(w, http.StatusConflict, "Er bestaat al een account met dit e-mailadres.")
		return
	}
	if err != nil {
		serverError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, userRow{User: u, CreatedAt: time.Now()})
}

func (a *App) deleteUser(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	if id == currentUser(r).ID {
		writeError(w, http.StatusBadRequest, "Je kunt je eigen account niet verwijderen.")
		return
	}
	tag, err := a.db.Exec(r.Context(), `DELETE FROM users WHERE id = $1`, id)
	if err != nil {
		serverError(w, err)
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "Niet gevonden.")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
