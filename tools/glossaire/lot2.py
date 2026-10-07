#!/usr/bin/env python3
"""Génère la migration SQL du lot 2 du glossaire (cristallographie, minéralogie, géologie) à partir des trois fichiers de termes.
Usage : python3 tools/glossaire/lot2.py   (depuis la racine du dépôt)
Chaque terme n'est ajouté que s'il n'existe pas déjà (même identifiant) : relancer la migration est sans effet.
Les termes liés inconnus sont écartés ; les minéraux d'exemple ne sont gardés que s'ils existent et sont publiés."""
import json, os, re, sys, unicodedata, html

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
import lot2_cristallographie, lot2_mineralogie, lot2_geologie

DOMAINS = [("cristallographie", lot2_cristallographie), ("mineralogie", lot2_mineralogie), ("geologie", lot2_geologie)]
OUT = os.path.join(ROOT, "supabase", "migrations", "20261007100000_glossary_lot2.sql")
# Noms de minéraux tels qu'ils figurent dans le site.
ALIASES = {"Fluorine": "Fluorite", "Cuivre natif": "Cuivre", "Argent natif": "Argent", "Érythrine": "Érythrite", "Nickéline": "Nickeline", "Bastnaésite": "Bastnäsite-(Ce)"}
DROP = {"Bauxite", "Nitratine", "Skutterudite"}


def slugify(text):
    text = unicodedata.normalize("NFD", text.lower().replace("œ", "oe").replace("æ", "ae"))
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-")


def page_title(path):
    match = re.search(r"<title>([^<]+)</title>", open(path, encoding="utf-8").read())
    return html.unescape(match.group(1)).split(" — ")[0].split(" : ")[0] if match else None


def existing_terms():
    """Termes déjà publiés : titres des pages glossaire/<identifiant>/ générées pour Google."""
    found = {}
    folder = os.path.join(ROOT, "glossaire")
    for slug in sorted(os.listdir(folder)):
        path = os.path.join(folder, slug, "index.html")
        if os.path.exists(path):
            found[slug] = page_title(path) or slug
    return found


def sql(text):
    return "'" + text.replace("'", "''") + "'"


def array(items):
    return "array[" + ", ".join(sql(item) for item in items) + "]::text[]" if items else "'{}'::text[]"


def main():
    existing = existing_terms()
    known_names = set(existing.values())
    new = {}
    for domain, module in DOMAINS:
        for term, definition, see, minerals in module.TERMS:
            slug = slugify(term)
            if slug in existing:
                print(f"ignoré (déjà au glossaire) : {term}", file=sys.stderr); continue
            if slug in new:
                raise SystemExit(f"terme en double dans le lot : {term}")
            new[slug] = (term, domain, definition.strip(), see, minerals)
    known_names |= {value[0] for value in new.values()}
    lines = [f"-- Glossaire, lot 2 : {len(new)} termes de cristallographie, de minéralogie et de géologie. Sans doublon : un terme déjà présent n'est pas touché.",
             "-- Fichier généré par tools/glossaire/lot2.py ; modifier les termes dans tools/glossaire/lot2_*.py puis relancer le script."]
    dropped = []
    for slug, (term, domain, definition, see, minerals) in new.items():
        see_list = [name for name in see.split(",") if name]
        kept = [name for name in see_list if name in known_names and name != term]
        dropped += [(term, name) for name in see_list if name not in kept]
        mineral_list = [ALIASES.get(name, name) for name in minerals.split(",") if name and name not in DROP]
        related = f"coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any({array(mineral_list)})), '{{}}'::text[])" if mineral_list else "'{}'::text[]"
        lines.append("insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)")
        lines.append(f"select {sql(term)}, {sql(slug)}, {sql(domain)}, {sql(definition)}, {array(kept)}, {related}")
        lines.append(f"where not exists (select 1 from public.glossary_terms where slug = {sql(slug)});")
    with open(OUT, "w", encoding="utf-8") as handle:
        handle.write("\n".join(lines) + "\n")
    print(f"{len(new)} termes écrits dans {os.path.relpath(OUT, ROOT)}")
    if dropped:
        print("termes liés écartés (inconnus) :", dropped, file=sys.stderr)


main()
