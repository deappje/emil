package main

import "net/http"

func (a *App) routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	mux.HandleFunc("GET /api/auth/status", a.authStatus)
	mux.HandleFunc("POST /api/auth/setup", a.setup)
	mux.HandleFunc("POST /api/auth/login", a.login)
	mux.HandleFunc("POST /api/auth/logout", a.logout)
	mux.Handle("POST /api/auth/password", requireUser(a.changePassword))

	mux.Handle("GET /api/users", requireAdmin(a.listUsers))
	mux.Handle("POST /api/users", requireAdmin(a.createUser))
	mux.Handle("DELETE /api/users/{id}", requireAdmin(a.deleteUser))

	mux.HandleFunc("GET /api/plants", a.listPlants)
	mux.Handle("POST /api/plants", requireUser(a.createPlant))
	mux.Handle("PUT /api/plants/{id}", requireUser(a.editPlant))
	mux.Handle("DELETE /api/plants/{id}", requireUser(a.removePlant))
	mux.Handle("PUT /api/plants/{id}/photo", requireUser(a.uploadPhoto))
	mux.Handle("DELETE /api/plants/{id}/photo", requireUser(a.removePhoto))

	mux.Handle("POST /api/import", requireAdmin(a.importRows))
	mux.HandleFunc("GET /api/export.csv", a.exportCSV)

	mux.HandleFunc("/api/", func(w http.ResponseWriter, r *http.Request) {
		writeError(w, http.StatusNotFound, "Niet gevonden.")
	})
	mux.Handle("/", spaHandler(a.cfg.StaticDir))

	return securityHeaders(csrfGuard(a.withUser(mux)))
}
