package main

import (
	"errors"
	"slices"
	"strings"
	"time"
)

// Plant is one garden plant and all the properties it can be filtered on.
// Lengths are centimetres; multi-valued properties hold the slugs below.
type Plant struct {
	ID           int64     `json:"id"`
	Name         string    `json:"name"`
	LatinName    string    `json:"latinName"`
	Type         string    `json:"type"`
	Lifecycle    string    `json:"lifecycle"`
	Sun          []string  `json:"sun"`
	HeightMin    *int      `json:"heightMin"`
	HeightMax    *int      `json:"heightMax"`
	Width        *int      `json:"width"`
	FlowerColors []string  `json:"flowerColors"`
	LeafColors   []string  `json:"leafColors"`
	BloomMonths  []int     `json:"bloomMonths"`
	Native       bool      `json:"native"`
	Wildlife     []string  `json:"wildlife"`
	Evergreen    bool      `json:"evergreen"`
	Hardy        bool      `json:"hardy"`
	Moisture     []string  `json:"moisture"`
	Toxic        bool      `json:"toxic"`
	Fragrant     bool      `json:"fragrant"`
	Edible       bool      `json:"edible"`
	Description  string    `json:"description"`
	PhotoURL     string    `json:"photoUrl"`
	PhotoCredit  string    `json:"photoCredit"`
	SourceURL    string    `json:"sourceUrl"`
	UpdatedAt    time.Time `json:"updatedAt"`
	UpdatedBy    string    `json:"updatedBy"`

	photoKey string // object key of an uploaded photo; wins over PhotoURL
}

// The allowed values, in display order. The frontend mirrors these.
var (
	plantTypes = []string{"vaste-plant", "heester", "boom", "haagplant", "klimplant", "bloembol",
		"eenjarige", "siergras", "varen", "conifeer", "roos", "kruid", "fruit", "waterplant"}
	lifecycles     = []string{"meerjarig", "tweejarig", "eenjarig"}
	sunValues      = []string{"zon", "halfschaduw", "schaduw"}
	flowerColors   = []string{"wit", "geel", "oranje", "rood", "roze", "paars", "blauw", "groen"}
	leafColors     = []string{"groen", "geel", "rood", "paars", "grijs", "blauw", "bont"}
	wildlifeValues = []string{"bijen", "vlinders", "vogels", "insecten"}
	moistureValues = []string{"droog", "normaal", "vochtig", "nat"}
)

// normalize trims and validates p in place: unknown list values are dropped,
// lists are deduplicated into display order and heights are put in order.
func (p *Plant) normalize() error {
	p.Name = strings.TrimSpace(p.Name)
	p.LatinName = strings.TrimSpace(p.LatinName)
	p.Description = strings.TrimSpace(p.Description)
	p.PhotoCredit = strings.TrimSpace(p.PhotoCredit)
	p.SourceURL = strings.TrimSpace(p.SourceURL)
	switch {
	case p.Name == "":
		return errors.New("naam is verplicht")
	case len(p.Name) > 200 || len(p.LatinName) > 200:
		return errors.New("naam is te lang")
	case len(p.Description) > 10000:
		return errors.New("beschrijving is te lang")
	case !slices.Contains(plantTypes, p.Type):
		return errors.New("onbekende soort plant")
	case !slices.Contains(lifecycles, p.Lifecycle):
		return errors.New("onbekende levensduur")
	}
	if p.SourceURL != "" && !isHTTPURL(p.SourceURL) {
		return errors.New("bronlink moet met http:// of https:// beginnen")
	}
	p.Sun = keepKnown(p.Sun, sunValues)
	p.FlowerColors = keepKnown(p.FlowerColors, flowerColors)
	p.LeafColors = keepKnown(p.LeafColors, leafColors)
	p.Wildlife = keepKnown(p.Wildlife, wildlifeValues)
	p.Moisture = keepKnown(p.Moisture, moistureValues)
	p.BloomMonths = keepMonths(p.BloomMonths)
	p.HeightMin, p.HeightMax, p.Width = clampCM(p.HeightMin), clampCM(p.HeightMax), clampCM(p.Width)
	if p.HeightMin != nil && p.HeightMax != nil && *p.HeightMin > *p.HeightMax {
		p.HeightMin, p.HeightMax = p.HeightMax, p.HeightMin
	}
	return nil
}

func keepKnown(values, allowed []string) []string {
	out := []string{}
	for _, a := range allowed {
		if slices.Contains(values, a) {
			out = append(out, a)
		}
	}
	return out
}

func keepMonths(months []int) []int {
	out := []int{}
	for m := 1; m <= 12; m++ {
		if slices.Contains(months, m) {
			out = append(out, m)
		}
	}
	return out
}

func clampCM(v *int) *int {
	if v == nil || *v < 0 || *v > 10000 {
		return nil
	}
	return v
}

func isHTTPURL(s string) bool {
	return strings.HasPrefix(s, "https://") || strings.HasPrefix(s, "http://")
}
