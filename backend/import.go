package main

import (
	"context"
	"fmt"
	"net/http"
	"sync"
)

const maxImportRows = 100

type importResult struct {
	Created  int      `json:"created"`
	Updated  int      `json:"updated"`
	Photos   int      `json:"photos"`
	Problems []string `json:"problems"`
}

type photoJob struct {
	line   int
	id     int64
	url    string
	credit string // set once the photo is stored, when the row gave none
}

// importRows adds or updates up to maxImportRows plants per request. The
// browser parses the file and sends it in batches, so a large import shows
// progress and no single request runs long. offset is the batch's first
// row in the file, for line numbers in problems.
func (a *App) importRows(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Rows   []map[string]string `json:"rows"`
		Offset int                 `json:"offset"`
	}
	if !readJSON(w, r, 8<<20, &body) {
		return
	}
	if len(body.Rows) > maxImportRows {
		writeError(w, http.StatusBadRequest, fmt.Sprintf("Stuur maximaal %d rijen per keer.", maxImportRows))
		return
	}
	ctx, uid := r.Context(), userID(r)
	res := importResult{Problems: []string{}}
	var jobs []photoJob
	for i, row := range body.Rows {
		line := body.Offset + i + 2 // line 1 is the header
		p, photo, warnings, err := rowToPlant(row)
		for _, w := range warnings {
			res.Problems = append(res.Problems, fmt.Sprintf("Regel %d: %s.", line, w))
		}
		if err != nil {
			res.Problems = append(res.Problems, fmt.Sprintf("Regel %d overgeslagen: %s.", line, err))
			continue
		}
		present := presentFields(row)
		existing, err := a.findPlant(ctx, p)
		if err != nil {
			serverError(w, err)
			return
		}
		id := existing.id
		if id == 0 {
			if id, err = a.insertPlant(ctx, p, uid); err != nil {
				serverError(w, err)
				return
			}
			res.Created++
		} else {
			if err := a.updateImported(ctx, id, p, present, uid); err != nil {
				serverError(w, err)
				return
			}
			res.Updated++
		}
		if photo != "" && photo != existing.photoSource {
			job := photoJob{line: line, id: id, url: photo}
			if !present["credit"] {
				job.credit = creditFor(photo)
			}
			jobs = append(jobs, job)
		}
	}
	for _, problem := range a.importPhotos(ctx, jobs, uid, &res.Photos) {
		res.Problems = append(res.Problems, problem)
	}
	writeJSON(w, http.StatusOK, res)
}

// updateImported applies a row to an existing plant without touching the
// fields the row leaves out.
func (a *App) updateImported(ctx context.Context, id int64, in Plant, present map[string]bool, uid *int64) error {
	cur, err := a.getPlantDB(ctx, id)
	if err != nil {
		return err
	}
	merged := mergeImported(cur, in, present)
	if err := merged.normalize(); err != nil {
		return err
	}
	return a.updatePlant(ctx, id, merged, uid)
}

// importPhotos fetches the photos a few at a time and stores them in the
// bucket; without a bucket the plant links to the address instead.
func (a *App) importPhotos(ctx context.Context, jobs []photoJob, uid *int64, done *int) []string {
	var (
		mu       sync.Mutex
		wg       sync.WaitGroup
		problems []string
		slots    = make(chan struct{}, 6)
	)
	for _, job := range jobs {
		wg.Add(1)
		slots <- struct{}{}
		go func() {
			defer func() { <-slots; wg.Done() }()
			err := a.importPhoto(ctx, job, uid)
			mu.Lock()
			defer mu.Unlock()
			if err != nil {
				problems = append(problems, fmt.Sprintf("Regel %d: foto niet opgehaald (%v).", job.line, err))
			} else {
				*done++
			}
		}()
	}
	wg.Wait()
	return problems
}

func (a *App) importPhoto(ctx context.Context, job photoJob, uid *int64) error {
	if err := a.storeImportedPhoto(ctx, job, uid); err != nil {
		return err
	}
	if job.credit == "" {
		return nil
	}
	_, err := a.db.Exec(ctx, `UPDATE plants SET photo_credit=$2 WHERE id=$1`, job.id, job.credit)
	return err
}

func (a *App) storeImportedPhoto(ctx context.Context, job photoJob, uid *int64) error {
	if a.photos == nil {
		_, err := a.setPhoto(ctx, job.id, "", job.url, job.url, uid)
		return err
	}
	data, contentType, err := fetchImage(ctx, job.url)
	if err != nil {
		return err
	}
	key, err := a.photos.Put(ctx, job.id, contentType, data)
	if err != nil {
		return err
	}
	old, err := a.setPhoto(ctx, job.id, key, "", job.url, uid)
	if err != nil {
		a.photos.deleteQuietly(ctx, key)
		return err
	}
	a.photos.deleteQuietly(ctx, old)
	return nil
}
