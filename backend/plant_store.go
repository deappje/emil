package main

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
)

const plantColumns = `p.id, p.name, p.latin_name, p.type, p.lifecycle, p.sun, p.height_min,
	p.height_max, p.width, p.flower_colors, p.leaf_colors, p.bloom_months, p.native,
	p.wildlife, p.evergreen, p.hardy, p.moisture, p.toxic, p.fragrant, p.edible,
	p.description, p.photo_key, p.photo_url, p.photo_credit, p.source_url,
	p.updated_at, coalesce(u.name, '')`

const plantSelect = `SELECT ` + plantColumns + ` FROM plants p LEFT JOIN users u ON u.id = p.updated_by`

var errNotFound = errors.New("niet gevonden")

func scanPlant(row pgx.Row) (Plant, error) {
	var p Plant
	err := row.Scan(&p.ID, &p.Name, &p.LatinName, &p.Type, &p.Lifecycle, &p.Sun, &p.HeightMin,
		&p.HeightMax, &p.Width, &p.FlowerColors, &p.LeafColors, &p.BloomMonths, &p.Native,
		&p.Wildlife, &p.Evergreen, &p.Hardy, &p.Moisture, &p.Toxic, &p.Fragrant, &p.Edible,
		&p.Description, &p.photoKey, &p.PhotoURL, &p.PhotoCredit, &p.SourceURL,
		&p.UpdatedAt, &p.UpdatedBy)
	if errors.Is(err, pgx.ErrNoRows) {
		return p, errNotFound
	}
	return p, err
}

func (a *App) listPlantsDB(ctx context.Context) ([]Plant, error) {
	rows, err := a.db.Query(ctx, plantSelect+` ORDER BY lower(p.name), p.id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	plants := []Plant{}
	for rows.Next() {
		p, err := scanPlant(rows)
		if err != nil {
			return nil, err
		}
		plants = append(plants, a.withPhoto(p))
	}
	return plants, rows.Err()
}

func (a *App) getPlantDB(ctx context.Context, id int64) (Plant, error) {
	p, err := scanPlant(a.db.QueryRow(ctx, plantSelect+` WHERE p.id = $1`, id))
	return a.withPhoto(p), err
}

// withPhoto resolves an uploaded photo's key to its public address.
func (a *App) withPhoto(p Plant) Plant {
	if p.photoKey != "" && a.photos != nil {
		p.PhotoURL = a.photos.URL(p.photoKey)
	}
	return p
}

// plantArgs are the values of every editable column, in the order of
// insertPlant's and updatePlant's placeholders $1..$23.
func plantArgs(p Plant, userID *int64) []any {
	return []any{p.Name, p.LatinName, p.Type, p.Lifecycle, p.Sun, p.HeightMin, p.HeightMax,
		p.Width, p.FlowerColors, p.LeafColors, p.BloomMonths, p.Native, p.Wildlife,
		p.Evergreen, p.Hardy, p.Moisture, p.Toxic, p.Fragrant, p.Edible, p.Description,
		p.PhotoCredit, p.SourceURL, userID}
}

func (a *App) insertPlant(ctx context.Context, p Plant, userID *int64) (int64, error) {
	var id int64
	err := a.db.QueryRow(ctx, `INSERT INTO plants (name, latin_name, type, lifecycle, sun,
		height_min, height_max, width, flower_colors, leaf_colors, bloom_months, native,
		wildlife, evergreen, hardy, moisture, toxic, fragrant, edible, description,
		photo_credit, source_url, updated_by)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
		RETURNING id`, plantArgs(p, userID)...).Scan(&id)
	return id, err
}

// updatePlant changes every editable column; the photo is changed separately.
func (a *App) updatePlant(ctx context.Context, id int64, p Plant, userID *int64) error {
	tag, err := a.db.Exec(ctx, `UPDATE plants SET name=$1, latin_name=$2, type=$3,
		lifecycle=$4, sun=$5, height_min=$6, height_max=$7, width=$8, flower_colors=$9,
		leaf_colors=$10, bloom_months=$11, native=$12, wildlife=$13, evergreen=$14,
		hardy=$15, moisture=$16, toxic=$17, fragrant=$18, edible=$19, description=$20,
		photo_credit=$21, source_url=$22, updated_by=$23, updated_at=now()
		WHERE id=$24`, append(plantArgs(p, userID), id)...)
	if err == nil && tag.RowsAffected() == 0 {
		return errNotFound
	}
	return err
}

// deletePlantDB removes a plant and returns its photo key for cleanup.
func (a *App) deletePlantDB(ctx context.Context, id int64) (string, error) {
	var key string
	err := a.db.QueryRow(ctx, `DELETE FROM plants WHERE id=$1 RETURNING photo_key`, id).Scan(&key)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", errNotFound
	}
	return key, err
}

// setPhoto points a plant at a stored object (key) or an external address
// (url). source is the address an imported photo came from, so a re-import
// of the same address can skip it. Returns the replaced key for cleanup.
func (a *App) setPhoto(ctx context.Context, id int64, key, url, source string, userID *int64) (string, error) {
	var old string
	err := a.db.QueryRow(ctx, `UPDATE plants p SET photo_key=$2, photo_url=$3, photo_source=$4,
		updated_by=$5, updated_at=now() FROM plants o WHERE p.id=o.id AND p.id=$1
		RETURNING o.photo_key`, id, key, url, source, userID).Scan(&old)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", errNotFound
	}
	return old, err
}

// existingPlant is what an import needs to know about a plant it matched.
type existingPlant struct {
	id          int64
	photoSource string
}

// findPlant matches an imported row to an existing plant: by botanical
// name when it has one, otherwise by Dutch name among plants without one.
// It returns a zero id when there is no match.
func (a *App) findPlant(ctx context.Context, p Plant) (existingPlant, error) {
	var e existingPlant
	query, arg := `SELECT id, photo_source FROM plants
		WHERE lower(latin_name)=lower($1) ORDER BY id LIMIT 1`, p.LatinName
	if p.LatinName == "" {
		query, arg = `SELECT id, photo_source FROM plants
			WHERE latin_name='' AND lower(name)=lower($1) ORDER BY id LIMIT 1`, p.Name
	}
	err := a.db.QueryRow(ctx, query, arg).Scan(&e.id, &e.photoSource)
	if errors.Is(err, pgx.ErrNoRows) {
		return e, nil
	}
	return e, err
}
