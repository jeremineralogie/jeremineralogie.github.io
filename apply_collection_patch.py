import sys
p=sys.argv[1]
s=open(p,encoding="utf-8").read()
edits=[
('let pollingFallback = null;\n',
 'let pollingFallback = null;\nlet presetsApplied = false;\nconst presets = new URLSearchParams(location.search);\n'),
('    renderFilters();\n    renderCollection();\n    status.textContent = "Collection synchronisée avec Supabase.";',
 '    renderFilters();\n    if (!presetsApplied) {\n      presetsApplied = true;\n      filters.forEach(filter => {\n        const wanted = normalize(presets.get(filter.dataset.filter));\n        const option = wanted && [...filter.options].find(item => normalize(item.value) === wanted);\n        if (option) filter.value = option.value;\n      });\n    }\n    renderCollection();\n    status.textContent = "Collection synchronisée avec Supabase.";'),
]
for o,n in edits:
    if s.count(o)!=1: sys.exit("ancrage non unique: "+o[:50])
    s=s.replace(o,n)
open(p,"w",encoding="utf-8").write(s)
