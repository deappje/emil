package main

import (
	"encoding/csv"
	"net/http"
	"strconv"
	"strings"
)

// exportHeader names the columns as the importer reads them back.
var exportHeader = []string{"naam", "botanische naam", "soort", "levensduur", "standplaats",
	"hoogte min", "hoogte max", "breedte", "bloeikleur", "bladkleur", "bloeimaanden",
	"inheems", "ecowaarde", "groenblijvend", "winterhard", "vochtigheid", "giftig",
	"geurend", "eetbaar", "beschrijving", "foto url", "foto bron", "bron url"}

// exportCSV downloads every plant as a semicolon-separated file with a
// byte-order mark, the form Dutch Excel opens without an import dialog.
func (a *App) exportCSV(w http.ResponseWriter, r *http.Request) {
	plants, err := a.listPlantsDB(r.Context())
	if err != nil {
		serverError(w, err)
		return
	}
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", `attachment; filename="plantengids.csv"`)
	_, _ = w.Write([]byte{0xEF, 0xBB, 0xBF})
	cw := csv.NewWriter(w)
	cw.Comma = ';'
	_ = cw.Write(exportHeader)
	for _, p := range plants {
		_ = cw.Write([]string{p.Name, p.LatinName, p.Type, p.Lifecycle, strings.Join(p.Sun, "|"),
			cmText(p.HeightMin), cmText(p.HeightMax), cmText(p.Width),
			strings.Join(p.FlowerColors, "|"), strings.Join(p.LeafColors, "|"), monthsText(p.BloomMonths),
			yesNo(p.Native), strings.Join(p.Wildlife, "|"), yesNo(p.Evergreen), yesNo(p.Hardy),
			strings.Join(p.Moisture, "|"), yesNo(p.Toxic), yesNo(p.Fragrant), yesNo(p.Edible),
			p.Description, p.PhotoURL, p.PhotoCredit, p.SourceURL})
	}
	cw.Flush()
}

func cmText(v *int) string {
	if v == nil {
		return ""
	}
	return strconv.Itoa(*v)
}

func monthsText(months []int) string {
	parts := make([]string, len(months))
	for i, m := range months {
		parts[i] = strconv.Itoa(m)
	}
	return strings.Join(parts, "|")
}

func yesNo(b bool) string {
	if b {
		return "ja"
	}
	return "nee"
}
