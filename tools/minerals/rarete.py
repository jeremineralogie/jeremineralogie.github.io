# Classement des fiches minéraux par rareté, pour doser la difficulté des jeux (« Trouve le minéral » : très commun + commun ;
# quiz du jour : très commun + commun + rare). Les fiches non citées ici sont « rare ».
# Critère : fréquence dans la nature et en collection, avec un coup de pouce aux espèces et gemmes que le grand public connaît.
import json, re, sys
TRES_COMMUN = """quartz calcite pyrite fluorite gypse hematite magnetite galene malachite azurite amethyste agate jaspe calcedoine opale silex
talc muscovite biotite orthose albite dolomite baryte sphalerite almandin schorl beryl aragonite halite soufre graphite limonite
goethite serpentine olivine kaolinite cristal-de-roche citrine quartz-rose obsidienne microcline apatite epidote hornblende""".split()
COMMUN = """aigue-marine emeraude topaze rubis saphir corindon diamant or argent cuivre grossulaire spessartine pyrope andradite rhodolite tsavorite
demantoide hessonite uvarovite melanite dravite elbaite verdelite indicolite fluorapatite cinabre realgar orpiment stibine arsenopyrite
cassiterite wolframite scheelite rhodochrosite rhodonite siderite smithsonite cerusite anglesite pyromorphite vanadinite wulfenite mimetite
celestine anhydrite selenite albatre turquoise lapis-lazuli lazurite sodalite labradorite amazonite sanidine zircon rutile ilmenite chromite
bornite covellite chalcocite cuprite marcassite pyrrhotite molybdenite uraninite pechblende torbernite autunite chrysocolle hemimorphite
dioptase prehnite apophyllite stilbite natrolite chabazite actinote tremolite diopside augite enstatite spodumene kunzite hiddenite lepidolite
cordierite iolite andalousite chiastolite disthene staurotide jadeite nephrite pierre-de-soleil aventurine cornaline onyx sardoine chrysoprase
heliotrope morion quartz-fume quartz-rutile ametrine morganite heliodore goshenite bixbite peridot spinelle chrysoberyl alexandrite cymophane
tanzanite vesuvianite titanite wollastonite borax ambre jais rose-des-sables rose-de-fer oeuf-de-dinosaure opale-noble opale-de-feu hyalite
spath-d-islande tourmaline-melon-d-eau fuchsite clinochlore magnesite chrysotile vermiculite howlite pyrolusite vivianite oeil-de-tigre topaze-imperiale chalcanthite bismuth""".split()
TRES_RARE = """taaffeite bazzite pentagonite kornerupine kinoite plancheite shattuckite aikinite argyrodite bassetite bayldonite beraunite berlinite
bixbyite boracite brannerite cacoxenite cavansite coffinite columbite-fe cornetite creedite crichtonite cylindrite cuprosklodowskite curite
dawsonite delafossite dufrenite dufrenoysite dyscrasite emplectite eosphorite euchroite fairfieldite fourmarierite francevillite franckeite
galenobismutite gaspeite gehlenite gorceixite goyazite hambergite hanksite heterosite hopeite huntite hureaulite jacobsite johannite
johannsenite kasolite kermesite kutnohorite lanarkite langite legrandite lillianite lithiophilite ludlamite luzonite meneghinite microlite
milarite mixite montebrasite nosean padparadscha phosphophyllite phosphuranylite plumbogummite pollucite polybasite posnjakite powellite
pucherite purpurite pyrostilpnite quincyte rammelsbergite rockbridgeite rutherfordine sabugalite saleeite sartorite schoepite senarmontite
serandite serpierite sinhalite sklodowskite soddyite symplesite szaibelyite tarbuttite teallite tephroite tetradymite tugtupite tungstite
tyrolite tyuyamunite ullmannite uranocircite uranopilite vauxite vauquelinite violarite wardite wittichenite zinkenite zippeite zeunerite
metazeunerite meta-autunite cotunnite laurionite matlockite nantokite caledonite chalcophanite chalcophyllite clinoclase cosalite geocronite
jordanite bismite cervantite stibiconite massicot plattnerite thorianite thorite tellure carrollite linnaeite sphaerocobaltite otavite
greenockite alabandite pyreneite pyrochlore bastnasite-ce parisite-ce allanite-ce tantalite-fe""".split()
LABEL = {"tres_commun": "très commun", "commun": "commun", "rare": "rare", "tres_rare": "très rare"}
def classify(slug):
    if slug in TRES_COMMUN: return "tres_commun"
    if slug in COMMUN: return "commun"
    if slug in TRES_RARE: return "tres_rare"
    return "rare"
if __name__ == "__main__":
    slugs = sys.stdin.read().split()
    known = set(slugs)
    for name, group in (("TRES_COMMUN", TRES_COMMUN), ("COMMUN", COMMUN), ("TRES_RARE", TRES_RARE)):
        missing = [s for s in group if s not in known]
        if missing: print("ABSENTS de la base dans", name, ":", missing, file=sys.stderr)
    dup = [s for s in set(TRES_COMMUN + COMMUN + TRES_RARE) if (s in TRES_COMMUN) + (s in COMMUN) + (s in TRES_RARE) > 1]
    if dup: print("DOUBLONS :", dup, file=sys.stderr)
    out = {s: classify(s) for s in slugs}
    json.dump(out, open("/tmp/claude-0/rarete.json", "w"), ensure_ascii=False)
    from collections import Counter
    print(Counter(out.values()))
    print("RARE:", " ".join(s for s in slugs if out[s] == "rare"))
