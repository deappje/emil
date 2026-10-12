package main

import (
	"net/http"
	"unicode"
)

func (a *App) listPlants(w http.ResponseWriter, r *http.Request) {
	plants, err := a.listPlantsDB(r.Context())
	if err != nil {
		serverError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, plants)
}

// readPlant decodes and validates a plant from the request body.
func readPlant(w http.ResponseWriter, r *http.Request) (Plant, bool) {
	var p Plant
	if !readJSON(w, r, 64<<10, &p) {
		return p, false
	}
	if err := p.normalize(); err != nil {
		writeError(w, http.StatusBadRequest, capitalize(err.Error())+".")
		return p, false
	}
	return p, true
}

func (a *App) createPlant(w http.ResponseWriter, r *http.Request) {
	p, ok := readPlant(w, r)
	if !ok {
		return
	}
	id, err := a.insertPlant(r.Context(), p, userID(r))
	if err != nil {
		serverError(w, err)
		return
	}
	a.respondPlant(w, r, http.StatusCreated, id)
}

func (a *App) editPlant(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	p, ok := readPlant(w, r)
	if !ok {
		return
	}
	if err := a.updatePlant(r.Context(), id, p, userID(r)); err != nil {
		storeError(w, err)
		return
	}
	a.respondPlant(w, r, http.StatusOK, id)
}

func (a *App) removePlant(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	key, err := a.deletePlantDB(r.Context(), id)
	if err != nil {
		storeError(w, err)
		return
	}
	a.photos.deleteQuietly(r.Context(), key)
	w.WriteHeader(http.StatusNoContent)
}

func (a *App) respondPlant(w http.ResponseWriter, r *http.Request, status int, id int64) {
	p, err := a.getPlantDB(r.Context(), id)
	if err != nil {
		storeError(w, err)
		return
	}
	writeJSON(w, status, p)
}

func capitalize(s string) string {
	r := []rune(s)
	if len(r) > 0 {
		r[0] = unicode.ToUpper(r[0])
	}
	return string(r)
}
