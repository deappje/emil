package main

import (
	"io"
	"net/http"
)

const maxPhotoBytes = 10 << 20

// uploadPhoto takes the image as the raw request body (the browser scales
// it down first) and makes it the plant's photo.
func (a *App) uploadPhoto(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	if a.photos == nil {
		writeError(w, http.StatusServiceUnavailable, "Foto-opslag is niet ingesteld.")
		return
	}
	data, err := io.ReadAll(http.MaxBytesReader(w, r.Body, maxPhotoBytes))
	if err != nil {
		writeError(w, http.StatusRequestEntityTooLarge, "De foto is groter dan 10 MB.")
		return
	}
	contentType := http.DetectContentType(data)
	if imageExt[contentType] == "" {
		writeError(w, http.StatusBadRequest, "Kies een JPG-, PNG- of WebP-afbeelding.")
		return
	}
	if err := a.replacePhoto(r, id, contentType, data); err != nil {
		storeError(w, err)
		return
	}
	a.respondPlant(w, r, http.StatusOK, id)
}

// replacePhoto stores data as the plant's photo and removes the old object.
func (a *App) replacePhoto(r *http.Request, id int64, contentType string, data []byte) error {
	if _, err := a.getPlantDB(r.Context(), id); err != nil {
		return err
	}
	key, err := a.photos.Put(r.Context(), id, contentType, data)
	if err != nil {
		return err
	}
	old, err := a.setPhoto(r.Context(), id, key, "", "", userID(r))
	if err != nil {
		a.photos.deleteQuietly(r.Context(), key)
		return err
	}
	a.photos.deleteQuietly(r.Context(), old)
	return nil
}

func (a *App) removePhoto(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	old, err := a.setPhoto(r.Context(), id, "", "", "", userID(r))
	if err != nil {
		storeError(w, err)
		return
	}
	a.photos.deleteQuietly(r.Context(), old)
	a.respondPlant(w, r, http.StatusOK, id)
}
