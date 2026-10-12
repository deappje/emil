package main

import (
	"net/url"
	"slices"
)

// presentFields are the fields an imported row has a value for.
func presentFields(row map[string]string) map[string]bool {
	present := map[string]bool{}
	for field := range canonicalRow(row) {
		present[field] = true
	}
	return present
}

// mergeImported copies onto an existing plant only what the imported row
// actually contains, so re-importing a feed that lacks, say, "inheems"
// never erases what people categorised by hand.
func mergeImported(cur, in Plant, present map[string]bool) Plant {
	has := func(fields ...string) bool {
		return slices.ContainsFunc(fields, func(f string) bool { return present[f] })
	}
	out := cur
	if has("name") {
		out.Name = in.Name
	}
	if has("latin") || (has("name") && in.LatinName != "") {
		out.LatinName = in.LatinName // a shop name may carry the botanical one
	}
	if has("type") {
		out.Type = in.Type
	}
	if has("lifecycle") {
		out.Lifecycle = in.Lifecycle
	}
	if has("sun") {
		out.Sun = in.Sun
	}
	if has("moisture") {
		out.Moisture = in.Moisture
	}
	if has("flower") {
		out.FlowerColors = in.FlowerColors
	}
	if has("leaf") {
		out.LeafColors = in.LeafColors
	}
	if has("months") {
		out.BloomMonths = in.BloomMonths
	}
	if has("height", "heightMin") && in.HeightMin != nil {
		out.HeightMin = in.HeightMin
	}
	if has("height", "heightMax") && in.HeightMax != nil {
		out.HeightMax = in.HeightMax
	}
	if has("width") && in.Width != nil {
		out.Width = in.Width
	}
	if has("wildlife") {
		out.Wildlife = in.Wildlife
	} else if has("eco", "bees", "butterflies", "birds") {
		// Yes/no columns per animal only ever add to what is already known.
		for _, w := range in.Wildlife {
			if !slices.Contains(out.Wildlife, w) {
				out.Wildlife = append(slices.Clone(out.Wildlife), w)
			}
		}
	}
	for _, b := range []struct {
		field    string
		dst, src *bool
	}{
		{"native", &out.Native, &in.Native},
		{"evergreen", &out.Evergreen, &in.Evergreen},
		{"hardy", &out.Hardy, &in.Hardy},
		{"toxic", &out.Toxic, &in.Toxic},
		{"fragrant", &out.Fragrant, &in.Fragrant},
		{"edible", &out.Edible, &in.Edible},
	} {
		if has(b.field) {
			*b.dst = *b.src
		}
	}
	if has("description") {
		out.Description = in.Description
	}
	if has("credit") {
		out.PhotoCredit = in.PhotoCredit
	}
	if has("source", "urlKey") {
		out.SourceURL = in.SourceURL
	}
	return out
}

// creditFor names where an imported photo came from when the row gives no
// credit of its own: "Foto: www.directplant.nl".
func creditFor(photo string) string {
	if u, err := url.Parse(photo); err == nil && u.Host != "" {
		return "Foto: " + u.Host
	}
	return ""
}
