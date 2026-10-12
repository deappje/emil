package main

import (
	"slices"
	"testing"
)

func TestParseMonths(t *testing.T) {
	cases := map[string][]int{
		"6-8":                {6, 7, 8},
		"juni t/m augustus":  {6, 7, 8},
		"mei, juni":          {5, 6},
		"nov-feb":            {1, 2, 11, 12},
		"6|7|8":              {6, 7, 8},
		"Juli tot september": {7, 8, 9},
		"":                   {},
		"onbekend":           {},
		"maart - april, okt": {3, 4, 10},
	}
	for in, want := range cases {
		p := Plant{Name: "x", Type: "vaste-plant", Lifecycle: "meerjarig", BloomMonths: parseMonths(in)}
		_ = p.normalize()
		if !slices.Equal(p.BloomMonths, want) {
			t.Errorf("parseMonths(%q) = %v, want %v", in, p.BloomMonths, want)
		}
	}
}

func TestParseLength(t *testing.T) {
	cases := []struct {
		in     string
		lo, hi int
	}{
		{"120", 120, 120},
		{"30-40 cm", 30, 40},
		{"1,5 m", 150, 150},
		{"1 - 2 meter", 100, 200},
		{"max 120", 120, 120},
	}
	for _, c := range cases {
		lo, hi := parseLength(c.in)
		if lo == nil || hi == nil || *lo != c.lo || *hi != c.hi {
			t.Errorf("parseLength(%q) = %v,%v want %d,%d", c.in, lo, hi, c.lo, c.hi)
		}
	}
	if lo, hi := parseLength("onbekend"); lo != nil || hi != nil {
		t.Errorf("parseLength without a number should be nil")
	}
}

func TestRowToPlantOwnFormat(t *testing.T) {
	p, photo, warnings, err := rowToPlant(map[string]string{
		"naam": "Grote kattenstaart", "botanische_naam": "Lythrum salicaria",
		"soort": "vaste-plant", "standplaats": "zon tot halfschaduw",
		"hoogte": "80-150 cm", "bloeikleur": "paarsroze", "bloeimaanden": "6-9",
		"inheems": "ja", "ecowaarde": "bijen en vlinders", "vochtigheid": "vochtig tot nat",
		"winterhard": "", "foto_url": "https://example.org/a.jpg",
	})
	if err != nil || len(warnings) > 0 {
		t.Fatalf("unexpected err=%v warnings=%v", err, warnings)
	}
	check := func(name string, got, want []string) {
		if !slices.Equal(got, want) {
			t.Errorf("%s = %v, want %v", name, got, want)
		}
	}
	check("sun", p.Sun, []string{"zon", "halfschaduw"})
	check("flower", p.FlowerColors, []string{"roze", "paars"})
	check("wildlife", p.Wildlife, []string{"bijen", "vlinders"})
	check("moisture", p.Moisture, []string{"vochtig", "nat"})
	if !p.Native || !p.Hardy || *p.HeightMin != 80 || *p.HeightMax != 150 || photo != "https://example.org/a.jpg" {
		t.Errorf("unexpected plant %+v photo %q", p, photo)
	}
}

func TestRowToPlantMagento(t *testing.T) {
	p, photo, _, err := rowToPlant(map[string]string{
		"sku":                   "DP-123",
		"name":                  "Hortensia - Hydrangea serrata 'Euphoria'",
		"categories":            "Default Category/Struiken/Hortensia",
		"base_image":            "/h/y/hydrangea.jpg",
		"url_key":               "hortensia-hydrangea-serrata-euphoria",
		"description":           "<p>Mooie <strong>hortensia</strong>.</p><p>Tweede&nbsp;alinea</p>",
		"additional_attributes": "standplaats=Halfschaduw,bloeikleur=Roze,Blauw,bijvriendelijk=Ja,wintergroen=Nee",
	})
	if err != nil {
		t.Fatal(err)
	}
	if p.Name != "Hortensia" || p.LatinName != "Hydrangea serrata 'Euphoria'" || p.Type != "heester" {
		t.Errorf("names/type wrong: %q %q %q", p.Name, p.LatinName, p.Type)
	}
	if photo != magentoMedia+"/h/y/hydrangea.jpg" || p.SourceURL != magentoShop+"hortensia-hydrangea-serrata-euphoria.html" {
		t.Errorf("links wrong: %q %q", photo, p.SourceURL)
	}
	if !slices.Equal(p.Sun, []string{"halfschaduw"}) || !slices.Equal(p.FlowerColors, []string{"roze", "blauw"}) {
		t.Errorf("attributes wrong: sun %v flower %v", p.Sun, p.FlowerColors)
	}
	if !slices.Equal(p.Wildlife, []string{"bijen"}) || p.Evergreen {
		t.Errorf("flags wrong: wildlife %v evergreen %v", p.Wildlife, p.Evergreen)
	}
	if p.Description != "Mooie hortensia.\nTweede alinea" {
		t.Errorf("description = %q", p.Description)
	}
}

func TestTypeRules(t *testing.T) {
	cases := map[string]string{
		"Fruitbomen":             "fruit",
		"Struiken/Bolvormen":     "heester",
		"Bloembollen/Tulpen":     "bloembol",
		"Vaste planten":          "vaste-plant",
		"Haagplanten/Taxus":      "haagplant",
		"Siergrassen":            "siergras",
		"Kruiden":                "kruid",
		"Eenjarige zomerbloeier": "eenjarige",
	}
	for in, want := range cases {
		if got := firstMatch(normKey(in), typeRules); got != want {
			t.Errorf("type %q = %q, want %q", in, got, want)
		}
	}
}

func TestMergeImportedKeepsHandWork(t *testing.T) {
	h80, h150 := 80, 150
	cur := Plant{Name: "Grote kattenstaart", LatinName: "Lythrum salicaria", Type: "vaste-plant",
		Lifecycle: "meerjarig", Sun: []string{"zon"}, HeightMin: &h80, HeightMax: &h150,
		Native: true, Wildlife: []string{"vlinders"}, Description: "Met de hand geschreven.", Hardy: true}
	row := map[string]string{"naam": "Grote kattenstaart", "botanische naam": "Lythrum salicaria",
		"bloeikleur": "paars", "bijvriendelijk": "ja"}
	in, _, _, err := rowToPlant(row)
	if err != nil {
		t.Fatal(err)
	}
	got := mergeImported(cur, in, presentFields(row))
	if !got.Native || got.Description != cur.Description || *got.HeightMax != 150 || !slices.Equal(got.Sun, cur.Sun) {
		t.Errorf("hand-entered fields lost: %+v", got)
	}
	if !slices.Equal(got.FlowerColors, []string{"paars"}) || !slices.Equal(got.Wildlife, []string{"vlinders", "bijen"}) {
		t.Errorf("imported fields not applied: flower %v wildlife %v", got.FlowerColors, got.Wildlife)
	}
	if !slices.Equal(cur.Wildlife, []string{"vlinders"}) {
		t.Errorf("merge changed the original's slice: %v", cur.Wildlife)
	}
	if creditFor("https://www.directplant.nl/media/x.jpg") != "Foto: www.directplant.nl" {
		t.Error("creditFor")
	}
}
