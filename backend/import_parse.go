package main

import (
	"fmt"
	"html"
	"regexp"
	"slices"
	"strconv"
	"strings"
)

// rowToPlant turns one imported row (column name → cell) into a plant, the
// address of its photo if any, and warnings about cells it had to guess.
func rowToPlant(row map[string]string) (p Plant, photo string, warnings []string, err error) {
	f := canonicalRow(row)
	p = Plant{
		Name:        f["name"],
		LatinName:   f["latin"],
		Description: plainText(f["description"]),
		PhotoCredit: f["credit"],
		SourceURL:   f["source"],
	}
	if p.LatinName == "" {
		// Shop names read "Hortensia - Hydrangea serrata 'Euphoria'".
		if dutch, latin, ok := strings.Cut(p.Name, " - "); ok {
			p.Name, p.LatinName = strings.TrimSpace(dutch), strings.TrimSpace(latin)
		}
	}
	if p.Name == "" {
		p.Name = p.LatinName
	}
	if p.SourceURL == "" && f["urlKey"] != "" {
		p.SourceURL = magentoShop + f["urlKey"] + ".html"
	}

	p.Type = strings.ToLower(f["type"])
	if !slices.Contains(plantTypes, p.Type) {
		p.Type = firstMatch(normKey(f["type"]), typeRules)
	}
	if p.Type == "" {
		p.Type = "vaste-plant"
		if f["type"] != "" {
			warnings = append(warnings, fmt.Sprintf("soort %q onbekend, ingedeeld als vaste plant", f["type"]))
		}
	}
	p.Lifecycle = parseLifecycle(f["lifecycle"], p.Type)

	p.Sun = eachItem(f["sun"], sunRules, false)
	p.Moisture = eachItem(f["moisture"], moistureRules, false)
	p.FlowerColors = eachItem(f["flower"], flowerRules, true)
	p.LeafColors = eachItem(f["leaf"], leafRules, true)
	p.Wildlife = parseWildlife(f)
	p.BloomMonths = parseMonths(f["months"])

	p.HeightMin, p.HeightMax = parseLength(f["height"])
	if lo, _ := parseLength(f["heightMin"]); lo != nil {
		p.HeightMin = lo
	}
	if _, hi := parseLength(f["heightMax"]); hi != nil {
		p.HeightMax = hi
	}
	_, p.Width = parseLength(f["width"])

	p.Native = parseBool(f["native"], false)
	p.Evergreen = parseBool(f["evergreen"], false)
	p.Hardy = parseBool(f["hardy"], true)
	p.Toxic = parseBool(f["toxic"], false)
	p.Fragrant = parseBool(f["fragrant"], false)
	p.Edible = parseBool(f["edible"], false)

	photo = f["photo"]
	if photo == "no_selection" {
		photo = ""
	} else if strings.HasPrefix(photo, "/") {
		photo = magentoMedia + photo
	}
	return p, photo, warnings, p.normalize()
}

func normKey(s string) string {
	s = strings.NewReplacer("_", " ", "-", " ").Replace(strings.ToLower(s))
	return strings.Join(strings.Fields(s), " ")
}

// canonicalRow maps a row's own column names to the field names of
// fieldAliases, unpacking a Magento additional_attributes cell first.
func canonicalRow(row map[string]string) map[string]string {
	cells := map[string]string{}
	for k, v := range row {
		cells[normKey(k)] = strings.TrimSpace(v)
	}
	for k, v := range parseMagentoAttributes(cells["additional attributes"]) {
		if cells[normKey(k)] == "" {
			cells[normKey(k)] = strings.TrimSpace(v)
		}
	}
	out := map[string]string{}
	for field, names := range fieldAliases {
		for _, n := range names {
			if v := cells[n]; v != "" {
				out[field] = v
				break
			}
		}
	}
	return out
}

var magentoKey = regexp.MustCompile(`(?:^|,)([a-z0-9_]+)=`)

// parseMagentoAttributes splits "code=value,code2=a,b" into its pairs; a
// comma only starts a new pair when a code= follows it.
func parseMagentoAttributes(s string) map[string]string {
	out := map[string]string{}
	idx := magentoKey.FindAllStringSubmatchIndex(s, -1)
	for i, m := range idx {
		end := len(s)
		if i+1 < len(idx) {
			end = idx[i+1][0]
		}
		out[s[m[2]:m[3]]] = s[m[1]:end]
	}
	return out
}

var listSplit = regexp.MustCompile(`\s*(?:[,;|/+&–-]|\ben\b|\btot\b|\bof\b)\s*`)

// eachItem splits a cell into items and maps each through rules: every
// matching rule when all is set, otherwise the first.
func eachItem(cell string, rules []rule, all bool) []string {
	out := []string{}
	for _, item := range listSplit.Split(strings.ToLower(cell), -1) {
		for _, r := range rules {
			if matches(item, r.needles) && !slices.Contains(out, r.value) {
				out = append(out, r.value)
				if !all {
					break
				}
			}
		}
	}
	return out
}

func firstMatch(text string, rules []rule) string {
	for _, r := range rules {
		if matches(text, r.needles) {
			return r.value
		}
	}
	return ""
}

var wordSplit = regexp.MustCompile(`[^\p{L}0-9]+`)

func matches(text string, needles []string) bool {
	words := wordSplit.Split(text, -1)
	for _, n := range needles {
		if word, ok := strings.CutPrefix(n, "="); ok {
			if slices.Contains(words, word) {
				return true
			}
		} else if strings.Contains(text, n) {
			return true
		}
	}
	return false
}

func parseLifecycle(cell, plantType string) string {
	s := strings.ToLower(cell)
	switch {
	case strings.Contains(s, "tweejarig") || strings.Contains(s, "biennial"):
		return "tweejarig"
	case strings.Contains(s, "eenjarig") || strings.Contains(s, "annual"):
		return "eenjarig"
	case s == "" && plantType == "eenjarige":
		return "eenjarig"
	}
	return "meerjarig"
}

func parseWildlife(f map[string]string) []string {
	w := eachItem(f["wildlife"], wildlifeRules, true)
	for field, value := range map[string]string{"bees": "bijen", "butterflies": "vlinders", "birds": "vogels"} {
		if parseBool(f[field], false) && !slices.Contains(w, value) {
			w = append(w, value)
		}
	}
	if len(w) == 0 && parseBool(f["eco"], false) {
		w = append(w, "insecten")
	}
	return w // normalize puts these in display order
}

func parseBool(cell string, fallback bool) bool {
	s := strings.ToLower(strings.TrimSpace(cell))
	if s == "" {
		return fallback
	}
	return !matches(s, falseWords)
}

var monthToken = regexp.MustCompile(`[a-z]+|\d+|-`)

// parseMonths reads "6-8", "juni t/m augustus", "mei, juni" or "nov-feb".
func parseMonths(cell string) []int {
	s := strings.ToLower(cell)
	for _, sep := range []string{"tot en met", "t/m", " tot ", " to ", "–", "—"} {
		s = strings.ReplaceAll(s, sep, "-")
	}
	var seq []int // months, with 0 marking a dash
	for _, tok := range monthToken.FindAllString(s, -1) {
		if tok == "-" {
			seq = append(seq, 0)
		} else if n, err := strconv.Atoi(tok); err == nil && n >= 1 && n <= 12 {
			seq = append(seq, n)
		} else if m, ok := monthNames[tok]; ok {
			seq = append(seq, m)
		}
	}
	var out []int
	for i := 0; i < len(seq); i++ {
		if seq[i] == 0 {
			continue
		}
		if i+2 < len(seq) && seq[i+1] == 0 && seq[i+2] != 0 {
			for m := seq[i]; ; m = m%12 + 1 {
				out = append(out, m)
				if m == seq[i+2] {
					break
				}
			}
			i += 2
			continue
		}
		out = append(out, seq[i])
	}
	return out
}

var (
	number    = regexp.MustCompile(`\d+(?:\.\d+)?`)
	meterUnit = regexp.MustCompile(`\d\s*m(?:eter|tr)?\b`)
)

// parseLength reads "120", "30-40 cm" or "1,5 m" as centimetres: the
// first and last number, or the same one twice.
func parseLength(cell string) (lo, hi *int) {
	s := strings.ReplaceAll(strings.ToLower(cell), ",", ".")
	nums := number.FindAllString(s, -1)
	if len(nums) == 0 {
		return nil, nil
	}
	scale := 1.0
	if meterUnit.MatchString(s) && !strings.Contains(s, "cm") {
		scale = 100
	}
	cm := func(n string) *int {
		f, _ := strconv.ParseFloat(n, 64)
		v := int(f*scale + 0.5)
		return &v
	}
	return cm(nums[0]), cm(nums[len(nums)-1])
}

var (
	breakTags = regexp.MustCompile(`(?i)<\s*(br|/p|/li|/h[1-6]|/div)\s*/?>`)
	anyTag    = regexp.MustCompile(`<[^>]*>`)
	blankRuns = regexp.MustCompile(`\n{3,}`)
)

// plainText turns an HTML product description into plain paragraphs.
func plainText(s string) string {
	s = breakTags.ReplaceAllString(s, "\n")
	s = html.UnescapeString(anyTag.ReplaceAllString(s, ""))
	lines := strings.Split(s, "\n")
	for i, l := range lines {
		lines[i] = strings.Join(strings.Fields(l), " ")
	}
	return strings.TrimSpace(blankRuns.ReplaceAllString(strings.Join(lines, "\n"), "\n\n"))
}
