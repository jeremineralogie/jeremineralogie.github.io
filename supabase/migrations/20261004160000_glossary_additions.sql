-- Termes ajoutés au glossaire (familles chimiques, cassure, éclat, clivage, habitus, formation, prospection, gemmes, couleur, formes). Sans doublon : un terme déjà présent n'est pas touché.
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Nésosilicate', 'nesosilicate', 'mineralogie', 'Silicate dont les tétraèdres SiO₄ sont isolés, reliés entre eux seulement par des métaux ; structure compacte, minéraux souvent durs et denses : olivine, grenat, zircon, topaze.', array['Silicate','Tétraèdre']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (chemical_class ilike '%nésosilicate%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'nesosilicate');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Sorosilicate', 'sorosilicate', 'mineralogie', 'Silicate dont les tétraèdres SiO₄ sont réunis par paires, parfois associés à des tétraèdres isolés : épidote, vésuvianite, hémimorphite.', array['Silicate','Tétraèdre']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (chemical_class ilike '%sorosilicate%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'sorosilicate');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Cyclosilicate', 'cyclosilicate', 'mineralogie', 'Silicate dont les tétraèdres SiO₄ forment des anneaux de trois, quatre ou six éléments ; cristaux souvent allongés et striés : béryl, tourmaline, cordiérite.', array['Silicate','Tétraèdre','Stries']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (chemical_class ilike '%cyclosilicate%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'cyclosilicate');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Inosilicate', 'inosilicate', 'mineralogie', 'Silicate dont les tétraèdres SiO₄ s''enchaînent en chaînes simples (pyroxènes) ou doubles (amphiboles) ; les cristaux sont allongés et présentent deux directions de clivage.', array['Silicate','Pyroxène','Amphibole']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (chemical_class ilike '%inosilicate%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'inosilicate');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Phyllosilicate', 'phyllosilicate', 'mineralogie', 'Silicate dont les tétraèdres SiO₄ forment des feuillets ; minéraux tendres, à clivage parfait en lamelles : micas, talc, kaolinite, serpentine.', array['Silicate','Mica','Argile']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (chemical_class ilike '%phyllosilicate%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'phyllosilicate');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Tectosilicate', 'tectosilicate', 'mineralogie', 'Silicate dont les tétraèdres SiO₄ forment un réseau en trois dimensions ; il réunit les feldspaths, les feldspathoïdes et les zéolites.', array['Silicate','Feldspath','Zéolite']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (chemical_class ilike '%tectosilicate%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'tectosilicate');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Oxyde et hydroxyde', 'oxyde-et-hydroxyde', 'mineralogie', 'Minéral associant un ou plusieurs métaux à l''oxygène (oxyde) ou au groupe OH (hydroxyde) ; famille de nombreux minerais (fer, étain, chrome) et de pierres dures comme le corindon.', array['Minerai','Silicate']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (chemical_class ilike 'Oxydes%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'oxyde-et-hydroxyde');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Sulfate', 'sulfate', 'mineralogie', 'Minéral contenant le groupe SO₄ ; en général tendre et clair : gypse, baryte, célestine, anhydrite. Les chromates, molybdates et tungstates (wulfénite, scheelite) sont rangés dans cette famille.', array['Sulfure','Évaporite']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (chemical_class ilike 'Sulfates%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'sulfate');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Phosphate', 'phosphate', 'mineralogie', 'Minéral contenant le groupe PO₄ ; les arséniates et les vanadates, de structure voisine, y sont rattachés. Souvent colorés et fragiles : apatite, turquoise, pyromorphite, vivianite.', array['Carbonate','Sulfate']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (chemical_class ilike 'Phosphates%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'phosphate');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Halogénure', 'halogenure', 'mineralogie', 'Minéral associant un métal à un halogène (fluor, chlore, brome ou iode) : fluorite (fluorure de calcium), halite (chlorure de sodium, le sel gemme).', array['Sulfate','Évaporite']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (chemical_class ilike 'Halogénures%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'halogenure');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Élément natif', 'element-natif', 'mineralogie', 'Élément chimique trouvé à l''état pur dans la nature : or, argent, cuivre, soufre, graphite, diamant.', array['Minéral','Malléable']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (chemical_class ilike 'Éléments natifs%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'element-natif');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Borate', 'borate', 'mineralogie', 'Minéral contenant du bore lié à l''oxygène ; se forme surtout dans les lacs salés asséchés : borax, howlite.', array['Évaporite','Sulfate']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (chemical_class ilike 'Borates%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'borate');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Composé organique', 'compose-organique', 'mineralogie', 'Substance d''origine végétale ou animale, fossilisée, rangée parmi les minéraux par commodité : ambre, jais. Elle n''a pas de structure cristalline.', array['Minéraloïde','Amorphe']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (chemical_class ilike 'Composés organiques%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'compose-organique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Cassure irrégulière', 'cassure-irreguliere', 'mineralogie', 'Cassure en surfaces rugueuses, sans forme régulière ; la plus courante, observée chez la plupart des minéraux sans clivage net.', array['Cassure','Cassure conchoïdale']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (fracture ilike '%irrégulière%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'cassure-irreguliere');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Cassure subconchoïdale', 'cassure-subconchoidale', 'mineralogie', 'Cassure intermédiaire entre irrégulière et conchoïdale : surfaces légèrement courbes, mais sans les ondulations nettes d''une coquille.', array['Cassure','Cassure conchoïdale']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (fracture ilike '%subconchoïdale%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'cassure-subconchoidale');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Cassure esquilleuse', 'cassure-esquilleuse', 'mineralogie', 'Cassure en éclats pointus et allongés, comme un bois qui se fend ; fréquente chez les minéraux fibreux ou très compacts, comme le jade.', array['Cassure','Fibreux']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (fracture ilike '%esquilleuse%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'cassure-esquilleuse');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Cassure terreuse', 'cassure-terreuse', 'mineralogie', 'Cassure à surface mate et friable, comme de la terre ; typique des minéraux tendres et poreux.', array['Cassure','Éclat terreux']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (fracture ilike '%terreuse%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'cassure-terreuse');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Éclat submétallique', 'eclat-submetallique', 'mineralogie', 'Éclat intermédiaire entre métallique et non métallique : surface brillante, mais moins vive que celle d''un métal, sur des minéraux sombres presque opaques.', array['Éclat','Éclat métallique']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (luster ilike '%submétallique%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'eclat-submetallique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Éclat cireux', 'eclat-cireux', 'mineralogie', 'Éclat doux et gras rappelant la cire d''une bougie, sur des surfaces lisses et compactes.', array['Éclat','Éclat résineux']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (luster ilike '%cireux%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'eclat-cireux');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Éclat terreux', 'eclat-terreux', 'mineralogie', 'Aspect mat et sans reflet, comme une motte de terre ; minéraux en masses poreuses ou pulvérulentes.', array['Éclat','Éclat mat']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (luster ilike '%terreux%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'eclat-terreux');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Éclat gras', 'eclat-gras', 'mineralogie', 'Éclat rappelant une surface enduite d''huile, légèrement luisante ; fréquent sur les cassures de certains minéraux en masses compactes.', array['Éclat','Éclat résineux']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (luster ilike '%gras%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'eclat-gras');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Éclat mat', 'eclat-mat', 'mineralogie', 'Absence d''éclat : la surface ne réfléchit pas la lumière, ce qui est fréquent chez les minéraux en masses fines ou poreuses.', array['Éclat','Éclat terreux']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (luster ilike '%mat%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'eclat-mat');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Clivage parfait', 'clivage-parfait', 'mineralogie', 'Clivage très net : le minéral se fend facilement en surfaces planes, lisses et brillantes, dont les plans se reconnaissent sans loupe.', array['Clivage','Plan de séparation']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (cleavage ilike 'parfait%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'clivage-parfait');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Clivage distinct', 'clivage-distinct', 'mineralogie', 'Clivage net mais moins facile à obtenir qu''un clivage parfait : les plans se voient bien, sans former de surfaces continues.', array['Clivage','Clivage parfait']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (cleavage ilike 'distinct%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'clivage-distinct');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Clivage imparfait', 'clivage-imparfait', 'mineralogie', 'Clivage à peine marqué : le minéral se casse parfois selon des plans, mais la plupart des cassures restent irrégulières.', array['Clivage','Cassure']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (cleavage ilike 'imparfait%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'clivage-imparfait');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Clivage basal', 'clivage-basal', 'mineralogie', 'Clivage parallèle à la base du cristal, perpendiculaire à son axe principal ; minéraux en feuillets ou en tablettes : micas, talc, graphite, topaze.', array['Clivage','Clivage parfait']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (cleavage ilike '%basal%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'clivage-basal');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Clivage rhomboédrique', 'clivage-rhomboedrique', 'mineralogie', 'Clivage en trois directions obliques, qui détache des rhomboèdres ; typique de la calcite, de la dolomite et de la sidérite.', array['Clivage','Rhomboèdre']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (cleavage ilike '%rhomboédrique%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'clivage-rhomboedrique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Clivage octaédrique', 'clivage-octaedrique', 'mineralogie', 'Clivage en quatre directions parallèles aux faces d''un octaèdre : un fragment prend la forme d''un octaèdre, comme avec la fluorite ou le diamant.', array['Clivage','Octaèdre']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (cleavage ilike '%octaédrique%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'clivage-octaedrique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Massif', 'massif', 'mineralogie', 'Se dit d''un minéral sans forme cristalline visible, en masse compacte d''un seul tenant. À ne pas confondre avec un massif montagneux.', array['Habitus','Fibreux']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (habit ilike '%massif%' or habit ilike '%masses%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'massif');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Granulaire', 'granulaire', 'mineralogie', 'En petits grains soudés entre eux, visibles à l''œil ou à la loupe, à l''aspect d''un sucre aggloméré.', array['Habitus','Grenu']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (habit ilike '%granulaire%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'granulaire');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Grenu', 'grenu', 'mineralogie', 'Constitué de grains plus ou moins gros bien jointifs, comme dans une roche cristalline.', array['Granulaire','Granite']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (habit ilike '%grenue%' or habit ilike '%grenu%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'grenu');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Rosette', 'rosette', 'mineralogie', 'Groupe de cristaux plats ou en lames disposés en pétales autour d''un point central, en forme de rose.', array['Habitus','Rose des sables']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (habit ilike '%rosette%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'rosette');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Paillette', 'paillette', 'mineralogie', 'Petite lame mince et brillante : mica, graphite, or alluvionnaire. L''or des rivières se récolte surtout sous cette forme.', array['Pépite','Batée','Placer']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (habit ilike '%paillette%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'paillette');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Gerbe', 'gerbe', 'mineralogie', 'Faisceau de cristaux allongés, réunis à une extrémité et écartés à l''autre, comme une gerbe de blé.', array['Habitus','Aciculaire']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (habit ilike '%gerbe%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'gerbe');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Enduit', 'enduit', 'mineralogie', 'Mince couche de minéral recouvrant une roche ou un autre minéral, sans cristaux nets.', array['Encroûtement','Croûte']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (habit ilike '%enduit%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'enduit');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Efflorescence', 'efflorescence', 'mineralogie', 'Dépôt de fins cristaux, souvent blancs ou colorés, formé en surface par l''évaporation d''une eau chargée de sels ; fréquent sur les parois humides.', array['Évaporite','Sulfate']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (habit ilike '%efflorescence%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'efflorescence');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Oxydation', 'oxydation', 'geologie', 'Transformation d''un minéral au contact de l''air et de l''eau, qui lui fait fixer de l''oxygène ; à l''origine des minéraux secondaires colorés dans la partie haute des gisements.', array['Zone d''oxydation','Minéral secondaire','Altération']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (formation ilike '%oxydation%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'oxydation');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Hydrothermal', 'hydrothermal', 'geologie', 'Se dit de ce qui se forme à partir de fluides chauds, riches en eau et en éléments dissous, qui circulent dans les fractures de la croûte ; origine de la plupart des filons.', array['Hydrothermalisme','Filon']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (formation ilike '%hydrothermal%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'hydrothermal');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Supergène', 'supergene', 'geologie', 'Se dit d''un minéral ou d''un processus formé près de la surface, par infiltration d''eau et oxydation ; par opposition à hypogène.', array['Hypogène','Zone d''oxydation','Zone de cémentation']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (formation ilike '%supergène%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'supergene');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Hypogène', 'hypogene', 'geologie', 'Se dit d''un minéral formé en profondeur, par cristallisation d''un magma ou remontée de fluides chauds ; par opposition à supergène.', array['Supergène','Minéral primaire']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (formation ilike '%hypogène%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'hypogene');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Métasomatisme', 'metasomatisme', 'geologie', 'Transformation d''une roche par échange d''éléments chimiques avec des fluides, sans fusion, certains minéraux étant remplacés par d''autres ; origine des skarns.', array['Skarn','Métamorphisme de contact']::text[], coalesce((select array_agg(name) from (select name from public.minerals where publication_status = 'published' and (formation ilike '%métasomat%') order by (rarity = 'tres_commun') desc, (rarity = 'commun') desc, name limit 4) s), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'metasomatisme');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Cristallisation', 'cristallisation', 'cristallographie', 'Formation de cristaux à partir d''un liquide (magma qui refroidit, solution qui s''évapore), d''un gaz ou d''un solide ; plus elle est lente, plus les cristaux sont gros.', array['Magma','Pegmatite','Croissance en trémie']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'cristallisation');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Stalagmite', 'stalagmite', 'geologie', 'Concrétion de calcite qui monte du sol d''une grotte, édifiée par l''eau qui goutte depuis le plafond ; elle fait face à la stalactite.', array['Stalactite','Karst','Concrétion']::text[], array['Calcite','Aragonite']::text[]
where not exists (select 1 from public.glossary_terms where slug = 'stalagmite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Prospection', 'prospection', 'geologie', 'Recherche sur le terrain de minéraux, de fossiles ou de minerais, en marchant et en observant les affleurements, les déblais et les ruisseaux. Elle se pratique avec l''accord du propriétaire et dans le respect de la réglementation.', array['Affleurement','Halde','Batée']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'prospection');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Massette', 'massette', 'geologie', 'Marteau court à tête large et plate, utilisé avec un burin pour fendre la roche et dégager un cristal sans l''abîmer.', array['Burin','Prospection']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'massette');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Burin', 'burin', 'geologie', 'Outil en acier à pointe ou à tranchant plat que l''on frappe à la massette pour décoller un cristal de sa roche ou fendre un bloc le long d''un plan de faiblesse.', array['Massette','Prospection']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'burin');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Loupe', 'loupe', 'mineralogie', 'Petite lentille grossissante, souvent ×10, qui permet d''observer cristaux, éclat, clivages et inclusions ; outil de base du prospecteur et de l''identification.', array['Éclat','Clivage']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'loupe');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Déblais', 'deblais', 'geologie', 'Roches et terres retirées lors du creusement d''une mine ou d''une carrière et entassées à proximité ; on y trouve souvent des minéraux laissés par les exploitants.', array['Halde','Terril','Carrière']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'deblais');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Éboulis', 'eboulis', 'geologie', 'Amas de fragments de roche détachés d''une paroi et tombés à son pied ; terrain de prospection quand la paroi est minéralisée.', array['Affleurement','Prospection']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'eboulis');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Pépite', 'pepite', 'geologie', 'Masse arrondie d''or natif, ou d''un autre métal natif, trouvée dans les alluvions ou les sols ; plus grosse qu''une paillette.', array['Paillette','Placer','Batée']::text[], array['Or','Argent','Cuivre']::text[]
where not exists (select 1 from public.glossary_terms where slug = 'pepite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Tamis', 'tamis', 'geologie', 'Grille ou toile à mailles qui trie les sédiments selon la taille des grains ; avec la batée, outil du chercheur d''or et de minéraux alluvionnaires.', array['Batée','Placer','Alluvion']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'tamis');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Pierre précieuse', 'pierre-precieuse', 'mineralogie', 'Gemme réputée pour sa dureté, sa rareté et son éclat, que la tradition réserve à quatre pierres : diamant, rubis, saphir et émeraude.', array['Gemme','Pierre fine']::text[], array['Diamant','Rubis','Saphir','Émeraude']::text[]
where not exists (select 1 from public.glossary_terms where slug = 'pierre-precieuse');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Pierre fine', 'pierre-fine', 'mineralogie', 'Gemme de joaillerie qui n''appartient pas aux pierres précieuses : améthyste, grenat, topaze, tourmaline, péridot, aigue-marine.', array['Gemme','Pierre précieuse']::text[], array['Améthyste','Grenat','Topaze','Péridot']::text[]
where not exists (select 1 from public.glossary_terms where slug = 'pierre-fine');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Pierre ornementale', 'pierre-ornementale', 'mineralogie', 'Roche ou minéral choisi pour sa couleur et son poli, employé en sculpture, en bijouterie et en décoration : malachite, lapis-lazuli, jade, marbre, onyx.', array['Gemme','Cabochon']::text[], array['Malachite','Lapis-lazuli','Jadéite','Onyx']::text[]
where not exists (select 1 from public.glossary_terms where slug = 'pierre-ornementale');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Carat', 'carat', 'mineralogie', 'Unité de masse des pierres précieuses : 1 carat vaut 0,2 gramme. À ne pas confondre avec le carat de l''or, qui mesure sa pureté sur 24.', array['Gemme','Taille']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'carat');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Taille', 'taille', 'mineralogie', 'Façonnage d''une pierre pour la mettre en valeur : facettes (brillant, émeraude, coussin) ou cabochon ; elle dépend de la dureté, du clivage et de la couleur.', array['Cabochon','Gemme','Clivage']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'taille');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Idiochromatique', 'idiochromatique', 'mineralogie', 'Se dit d''un minéral dont la couleur vient de sa composition même, donc toujours la même : malachite (verte), azurite (bleue), soufre (jaune).', array['Allochromatique','Couleur']::text[], array['Malachite','Azurite','Soufre']::text[]
where not exists (select 1 from public.glossary_terms where slug = 'idiochromatique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Allochromatique', 'allochromatique', 'mineralogie', 'Se dit d''un minéral normalement incolore dont la couleur vient d''impuretés ou de défauts : le quartz (améthyste, citrine), le corindon (rubis, saphir).', array['Idiochromatique','Couleur']::text[], array['Améthyste','Rubis','Saphir','Citrine']::text[]
where not exists (select 1 from public.glossary_terms where slug = 'allochromatique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Changement de couleur', 'changement-de-couleur', 'mineralogie', 'Phénomène par lequel une pierre change de teinte selon la lumière (jour ou lampe à incandescence) ; célèbre chez l''alexandrite, verte le jour et rouge le soir.', array['Couleur','Pléochroïsme']::text[], array['Alexandrite']::text[]
where not exists (select 1 from public.glossary_terms where slug = 'changement-de-couleur');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Luminescence', 'luminescence', 'mineralogie', 'Émission de lumière par un minéral sans chauffage, sous l''effet d''un rayonnement, d''un choc ou d''une réaction : fluorescence, phosphorescence, triboluminescence.', array['Fluorescence','Phosphorescence','Triboluminescence']::text[], array['Fluorite','Scheelite']::text[]
where not exists (select 1 from public.glossary_terms where slug = 'luminescence');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Dodécaèdre', 'dodecaedre', 'cristallographie', 'Forme cristalline à douze faces : le rhombododécaèdre (douze losanges) est fréquent chez les grenats, le pentagonododécaèdre chez la pyrite.', array['Rhombododécaèdre','Pyritoèdre']::text[], array['Grenat','Pyrite']::text[]
where not exists (select 1 from public.glossary_terms where slug = 'dodecaedre');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Pyramide', 'pyramide', 'cristallographie', 'Forme à faces triangulaires qui se rejoignent en pointe ; elle termine beaucoup de cristaux prismatiques, comme le quartz. Double, elle devient une bipyramide.', array['Bipyramide','Prisme']::text[], array['Quartz']::text[]
where not exists (select 1 from public.glossary_terms where slug = 'pyramide');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Cubo-octaèdre', 'cubo-octaedre', 'cristallographie', 'Forme combinant les faces d''un cube et celles d''un octaèdre, quand les deux se développent ensemble.', array['Cube','Octaèdre']::text[], array['Fluorite','Galène','Pyrite']::text[]
where not exists (select 1 from public.glossary_terms where slug = 'cubo-octaedre');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Trapézoèdre', 'trapezoedre', 'cristallographie', 'Forme dont toutes les faces sont des quadrilatères identiques en forme de cerf-volant ; l''icositétraèdre, à vingt-quatre faces, est le trapézoèdre le plus courant, notamment chez les grenats.', array['Icositétraèdre']::text[], array['Almandin','Spessartine']::text[]
where not exists (select 1 from public.glossary_terms where slug = 'trapezoedre');
