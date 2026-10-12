package main

// Column names an import may use for each field, written as normKey makes
// them (lowercase, "_" and "-" as spaces). The first non-empty one wins.
// Besides our own export they cover common Magento product attributes.
var fieldAliases = map[string][]string{
	"name":        {"naam", "nederlandse naam", "plantnaam", "name"},
	"latin":       {"botanische naam", "latijnse naam", "wetenschappelijke naam", "latin name", "latinname", "botanical name", "botanische naam plant"},
	"type":        {"soort", "plantsoort", "type", "soort plant", "categorie", "categories"},
	"lifecycle":   {"levensduur", "levenscyclus", "lifecycle"},
	"sun":         {"standplaats", "licht", "zon of schaduw", "sun"},
	"heightMin":   {"hoogte min", "minimale hoogte", "min hoogte", "heightmin"},
	"heightMax":   {"hoogte max", "maximale hoogte", "max hoogte", "eindhoogte", "heightmax"},
	"height":      {"hoogte", "hoogte volgroeid", "height"},
	"width":       {"breedte", "eindbreedte", "breedte volgroeid", "width"},
	"flower":      {"bloeikleur", "bloemkleur", "kleur", "flowercolors", "color"},
	"leaf":        {"bladkleur", "leafcolors"},
	"months":      {"bloeimaanden", "bloeiperiode", "bloeitijd", "bloei", "bloommonths"},
	"native":      {"inheems", "native"},
	"wildlife":    {"ecowaarde", "ecologische waarde", "waardevol voor", "trekt aan", "wildlife"},
	"eco":         {"ecologisch waardevol", "ecologisch", "biodivers"},
	"bees":        {"bijvriendelijk", "bijenplant", "drachtplant"},
	"butterflies": {"vlindervriendelijk", "vlinderplant"},
	"birds":       {"vogelvriendelijk", "vogelplant"},
	"evergreen":   {"groenblijvend", "wintergroen", "bladhoudend", "evergreen"},
	"hardy":       {"winterhard", "hardy"},
	"moisture":    {"vochtigheid", "grondvochtigheid", "vocht", "moisture"},
	"toxic":       {"giftig", "toxic"},
	"fragrant":    {"geurend", "geur", "fragrant"},
	"edible":      {"eetbaar", "edible"},
	"description": {"beschrijving", "omschrijving", "description", "short description"},
	"photo":       {"foto url", "foto", "afbeelding", "image url", "base image", "image", "photourl"},
	"credit":      {"foto bron", "fotobron", "photocredit"},
	"source":      {"bron url", "bronlink", "product url", "sourceurl", "url"},
	"urlKey":      {"url key"},
}

// magentoMedia prefixes the relative image paths of a Magento export.
const magentoMedia = "https://www.directplant.nl/media/catalog/product"

// magentoShop prefixes a Magento url_key to give the product page.
const magentoShop = "https://www.directplant.nl/"

type rule struct {
	value   string
	needles []string // substrings; "=word" must match a whole word
}

// typeRules are tried in order on the whole cell; the first match wins, so
// "fruitbomen" is fruit and "bolvormen" (topiary) is a shrub, not a bulb.
var typeRules = []rule{
	{"roos", []string{"roos", "rozen"}},
	{"haagplant", []string{"haag"}},
	{"klimplant", []string{"klim"}},
	{"conifeer", []string{"conifeer", "coniferen", "naaldbo"}},
	{"fruit", []string{"fruit"}},
	{"boom", []string{"boom", "bomen", "=tree"}},
	{"siergras", []string{"gras"}},
	{"varen", []string{"varen"}},
	{"waterplant", []string{"water", "vijver", "oever", "moeras"}},
	{"kruid", []string{"kruid", "moestuin"}},
	{"eenjarige", []string{"eenjarig", "tweejarig", "zomerbloei", "perkplant"}},
	{"heester", []string{"heester", "struik", "bolvorm"}},
	{"bloembol", []string{"bloembol", "bollen", "=bol", "knol"}},
	{"vaste-plant", []string{"vaste plant", "vasteplant", "borderplant", "bodembedekker", "perennial"}},
}

// sunRules and moistureRules take the first match per list item.
var sunRules = []rule{
	{"halfschaduw", []string{"half", "lichte schaduw", "partial"}},
	{"schaduw", []string{"schaduw", "shade"}},
	{"zon", []string{"zon", "sun"}},
}

var moistureRules = []rule{
	{"nat", []string{"=nat", "=natte", "moeras", "oever", "=wet"}},
	{"vochtig", []string{"vocht", "moist"}},
	{"droog", []string{"droog", "droge", "=dry"}},
	{"normaal", []string{"normaal", "normale", "gemiddeld", "normal"}},
}

// Colour and wildlife rules take every match, for compounds such as
// "paarsblauw" or "bijen en vlinders".
var flowerRules = []rule{
	{"wit", []string{"wit", "creme", "crème", "ivoor", "white"}},
	{"geel", []string{"geel", "gele", "goud", "yellow"}},
	{"oranje", []string{"oranje", "abrikoos", "koper", "orange"}},
	{"rood", []string{"rood", "rode", "karmijn", "bordeaux", "=red"}},
	{"roze", []string{"roze", "rose", "rosé", "zalm", "pink"}},
	{"paars", []string{"paars", "lila", "violet", "purper", "lavendel", "mauve", "purple"}},
	{"blauw", []string{"blauw", "blue"}},
	{"groen", []string{"groen", "green"}},
}

var leafRules = []rule{
	{"groen", []string{"groen", "green"}},
	{"geel", []string{"geel", "gele", "goud", "yellow"}},
	{"rood", []string{"rood", "rode", "brons", "=red"}},
	{"paars", []string{"paars", "purper", "purple"}},
	{"grijs", []string{"grijs", "zilver", "silver", "grey", "gray"}},
	{"blauw", []string{"blauw", "blue"}},
	{"bont", []string{"bont", "gerand", "gevlekt", "variegat"}},
}

var wildlifeRules = []rule{
	{"bijen", []string{"bij", "hommel", "=bee", "bees"}},
	{"vlinders", []string{"vlinder", "rups", "butterfl"}},
	{"vogels", []string{"vogel", "=bird", "birds"}},
	{"insecten", []string{"insect", "zweefvlieg", "kever"}},
}

var monthNames = map[string]int{
	"jan": 1, "januari": 1, "january": 1, "feb": 2, "februari": 2, "february": 2,
	"mrt": 3, "maa": 3, "maart": 3, "mar": 3, "march": 3, "apr": 4, "april": 4,
	"mei": 5, "may": 5, "jun": 6, "juni": 6, "june": 6, "jul": 7, "juli": 7, "july": 7,
	"aug": 8, "augustus": 8, "august": 8, "sep": 9, "sept": 9, "september": 9,
	"okt": 10, "oktober": 10, "oct": 10, "october": 10, "nov": 11, "november": 11,
	"dec": 12, "december": 12,
}

// falseWords make a yes/no cell false; any other non-empty text is true,
// so a cell like "Wintergroen" counts as yes.
var falseWords = []string{"=nee", "=no", "=false", "=0", "=n", "niet", "geen", "bladverliezend", "deciduous"}
