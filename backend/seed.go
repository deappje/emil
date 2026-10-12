package main

import (
	"context"
	_ "embed"
	"encoding/json"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// seed.json is a starter set of common Dutch garden plants in the import
// format, with photos from Wikimedia Commons and their credits.
//
//go:embed seed.json
var seedJSON []byte

// seed loads the starter set once in the database's life; a database that
// has been seeded is never seeded again, even after its plants are deleted.
func seed(ctx context.Context, db *pgxpool.Pool) error {
	var rows []map[string]string
	if err := json.Unmarshal(seedJSON, &rows); err != nil {
		return fmt.Errorf("seed.json: %w", err)
	}
	return pgx.BeginFunc(ctx, db, func(tx pgx.Tx) error {
		tag, err := tx.Exec(ctx, `INSERT INTO meta (key, value) VALUES ('seeded', now()::text)
			ON CONFLICT (key) DO NOTHING`)
		if err != nil || tag.RowsAffected() == 0 {
			return err
		}
		for i, row := range rows {
			p, photo, _, err := rowToPlant(row)
			if err != nil {
				return fmt.Errorf("seed row %d: %w", i+1, err)
			}
			if err := insertSeedPlant(ctx, tx, p, photo); err != nil {
				return err
			}
		}
		log.Printf("seeded %d plants", len(rows))
		return nil
	})
}

func insertSeedPlant(ctx context.Context, tx pgx.Tx, p Plant, photo string) error {
	_, err := tx.Exec(ctx, `INSERT INTO plants (name, latin_name, type, lifecycle, sun,
		height_min, height_max, width, flower_colors, leaf_colors, bloom_months, native,
		wildlife, evergreen, hardy, moisture, toxic, fragrant, edible, description,
		photo_credit, source_url, updated_by, photo_url, photo_source)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$24)`,
		append(plantArgs(p, nil), photo)...)
	return err
}
