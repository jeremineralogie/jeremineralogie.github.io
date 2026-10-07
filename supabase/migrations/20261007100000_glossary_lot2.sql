-- Glossaire, lot 2 : 466 termes de cristallographie, de minéralogie et de géologie. Sans doublon : un terme déjà présent n'est pas touché.
-- Fichier généré par tools/glossaire/lot2.py ; modifier les termes dans tools/glossaire/lot2_*.py puis relancer le script.
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Cristallographie', 'cristallographie', 'cristallographie', 'Science qui étudie les cristaux : leur forme, la disposition régulière de leurs atomes et les lois qui relient les deux.', array['Cristal', 'Réseau cristallin', 'Symétrie', 'Système cristallin']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'cristallographie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Structure cristalline', 'structure-cristalline', 'cristallographie', 'Façon dont les atomes, les ions ou les molécules sont rangés dans un cristal. Cet arrangement se répète dans les trois directions de l''espace et explique la forme, la dureté, le clivage et les propriétés optiques du minéral.', array['Réseau cristallin', 'Maille', 'Cristal']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'structure-cristalline');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Monocristal', 'monocristal', 'cristallographie', 'Cristal d''un seul bloc, dont le réseau d''atomes est continu, sans joint interne. S''oppose à l''agrégat, formé de nombreux petits cristaux.', array['Cristal', 'Agrégat cristallin']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'monocristal');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Agrégat cristallin', 'agregat-cristallin', 'cristallographie', 'Assemblage de plusieurs cristaux, ordonnés ou non, de la même espèce ou d''espèces différentes. La plupart des roches et beaucoup de spécimens sont des agrégats.', array['Cristal', 'Monocristal', 'Druse', 'Gerbe']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'agregat-cristallin');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Terminaison', 'terminaison', 'cristallographie', 'Extrémité d''un cristal, formée par les faces qui le ferment. La pointe d''un cristal de quartz est sa terminaison.', array['Biterminé', 'Face', 'Prisme', 'Pyramide']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Quartz']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'terminaison');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Pointement', 'pointement', 'cristallographie', 'Terme de cristallier pour désigner l''extrémité en pointe d''un cristal. Un cristal à pointements est limité à ses deux bouts par une pointe.', array['Terminaison', 'Biterminé', 'Cristallier']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'pointement');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Idiomorphe', 'idiomorphe', 'cristallographie', 'Se dit d''un cristal limité par ses propres faces, qui a pu croître librement sans être gêné par ses voisins. On dit aussi automorphe.', array['Face', 'Cristal', 'Xénomorphe']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'idiomorphe');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Automorphe', 'automorphe', 'cristallographie', 'Synonyme d''idiomorphe : cristal limité par ses propres faces, formé librement dans le vide d''une géode ou dans un magma encore liquide.', array['Idiomorphe', 'Xénomorphe', 'Géode']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'automorphe');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Xénomorphe', 'xenomorphe', 'cristallographie', 'Se dit d''un cristal sans faces propres, dont la forme a été imposée par les cristaux voisins qui ont poussé en même temps. C''est le cas de la plupart des grains d''une roche.', array['Idiomorphe', 'Cristal', 'Granulaire']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'xenomorphe');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Hypidiomorphe', 'hypidiomorphe', 'cristallographie', 'Se dit d''un cristal partiellement limité par ses propres faces : certaines faces sont développées, d''autres ont été gênées par les voisins.', array['Idiomorphe', 'Xénomorphe']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'hypidiomorphe');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Macle du Dauphiné', 'macle-du-dauphine', 'cristallographie', 'Macle du quartz formée de deux parties de même réseau tournées de 180° l''une par rapport à l''autre autour de l''axe vertical. Souvent invisible à l''œil nu, elle se repère à des faces irrégulières ou à des reflets inégaux. Elle tire son nom du Dauphiné.', array['Macle', 'Macle d''interpénétration', 'Macle du Brésil']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Quartz']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'macle-du-dauphine');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Macle du Brésil', 'macle-du-bresil', 'cristallographie', 'Macle du quartz qui associe un cristal « droit » et un cristal « gauche », image l''un de l''autre dans un miroir. Très fréquente dans l''améthyste, elle se reconnaît à des bandes fines dans le cristal.', array['Macle', 'Énantiomorphe', 'Macle du Dauphiné']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Quartz', 'Améthyste']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'macle-du-bresil');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Macle de la Gardette', 'macle-de-la-gardette', 'cristallographie', 'Autre nom de la macle du Japon du quartz, d''après la mine de La Gardette (Isère) où elle a été décrite pour la première fois. Les deux cristaux forment un angle voisin de 84°33′.', array['Macle du Japon', 'Macle', 'Macle de contact']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Quartz']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'macle-de-la-gardette');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Macle en croix', 'macle-en-croix', 'cristallographie', 'Macle où deux cristaux prismatiques se traversent en dessinant une croix, à angle droit ou à 60°. Elle est célèbre dans la staurotide.', array['Macle', 'Macle d''interpénétration']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Staurotide']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'macle-en-croix');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Macle de Baveno', 'macle-de-baveno', 'cristallographie', 'Macle des feldspaths potassiques, de l''orthose en particulier : les deux individus s''accolent par un plan incliné, ce qui donne des cristaux à section presque carrée. Elle porte le nom d''une localité d''Italie.', array['Macle', 'Macle de Carlsbad', 'Feldspath']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Orthose']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'macle-de-baveno');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Macle de Manebach', 'macle-de-manebach', 'cristallographie', 'Macle des feldspaths potassiques : les deux individus s''accolent par la face basale. Elle est moins courante que celles de Carlsbad et de Baveno.', array['Macle', 'Macle de Carlsbad', 'Macle de Baveno']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Orthose']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'macle-de-manebach');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Macle cyclique', 'macle-cyclique', 'cristallographie', 'Macle répétée plusieurs fois autour d''un axe, qui donne des cristaux en forme d''étoile, d''anneau ou de pseudo-hexagone. Elle est typique de la cérusite et de l''aragonite.', array['Macle', 'Macle polysynthétique']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Cérusite', 'Aragonite', 'Chrysobéryl']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'macle-cyclique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Croix de fer', 'croix-de-fer', 'cristallographie', 'Macle d''interpénétration de la pyrite, formée de deux pyritoèdres qui se traversent. Elle donne des cristaux aux arêtes en croix.', array['Macle d''interpénétration', 'Pyritoèdre', 'Macle']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Pyrite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'croix-de-fer');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Plan de macle', 'plan-de-macle', 'cristallographie', 'Plan de symétrie qui relie les deux parties d''une macle : un cristal est le reflet de l''autre dans ce plan.', array['Macle', 'Axe de macle', 'Loi de macle']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'plan-de-macle');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Axe de macle', 'axe-de-macle', 'cristallographie', 'Droite autour de laquelle on fait tourner un cristal, le plus souvent de 180°, pour retrouver sa position dans l''autre cristal de la macle.', array['Macle', 'Plan de macle', 'Loi de macle']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'axe-de-macle');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Loi de macle', 'loi-de-macle', 'cristallographie', 'Règle qui décrit comment les deux parties d''une macle sont orientées l''une par rapport à l''autre. Chaque loi de macle porte souvent le nom d''une localité : Carlsbad, Dauphiné, Japon, Brésil.', array['Macle', 'Plan de macle', 'Axe de macle']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'loi-de-macle');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Figure de corrosion', 'figure-de-corrosion', 'cristallographie', 'Petites marques en creux (triangles, pointes, stries) sur les faces d''un cristal, laissées par une dissolution partielle. Elles reflètent la symétrie du cristal.', array['Face', 'Symétrie', 'Dissolution']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'figure-de-corrosion');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Figure de croissance', 'figure-de-croissance', 'cristallographie', 'Relief régulier visible sur une face de cristal (marches, petites pyramides, triangles) qui montre comment les couches d''atomes se sont ajoutées pendant la croissance.', array['Stries', 'Face', 'Croissance cristalline']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'figure-de-croissance');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Croissance cristalline', 'croissance-cristalline', 'cristallographie', 'Phénomène par lequel un cristal grossit en ajoutant des atomes, couche par couche, à partir d''une solution, d''un liquide ou d''un gaz.', array['Cristallisation', 'Germe cristallin', 'Sursaturation']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'croissance-cristalline');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Cristallogenèse', 'cristallogenese', 'cristallographie', 'Naissance et croissance des cristaux : ensemble des phénomènes qui les font apparaître dans la nature ou en laboratoire.', array['Croissance cristalline', 'Cristallisation', 'Germe cristallin']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'cristallogenese');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Germe cristallin', 'germe-cristallin', 'cristallographie', 'Premier petit assemblage d''atomes à partir duquel un cristal commence à grandir. Il apparaît quand la solution est assez concentrée.', array['Croissance cristalline', 'Sursaturation', 'Cristallisation']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'germe-cristallin');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Sursaturation', 'sursaturation', 'cristallographie', 'État d''une solution qui contient plus de matière dissoute que la quantité qu''elle peut normalement garder. Elle favorise la naissance et la croissance des cristaux.', array['Cristallisation', 'Germe cristallin', 'Croissance cristalline']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'sursaturation');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Surcroissance', 'surcroissance', 'cristallographie', 'Croissance d''un cristal sur un autre, de la même espèce ou d''une espèce différente, qui le recouvre en partie.', array['Épitaxie', 'Croissance cristalline', 'Association minérale']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'surcroissance');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Cristal squelettique', 'cristal-squelettique', 'cristallographie', 'Cristal dont les arêtes ont grandi plus vite que le centre des faces, ce qui laisse des creux et des marches en forme d''entonnoir. Les cristaux en trémie de la halite en sont un exemple.', array['Croissance en trémie', 'Cristal', 'Face']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Halite', 'Bismuth']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'cristal-squelettique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Défaut cristallin', 'defaut-cristallin', 'cristallographie', 'Imperfection dans l''arrangement des atomes d''un cristal : atome manquant, atome en trop, impureté ou ligne de déformation. Les défauts influencent la couleur et la solidité.', array['Structure cristalline', 'Lacune', 'Dislocation', 'Centre coloré']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'defaut-cristallin');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Lacune', 'lacune', 'cristallographie', 'Place vide dans un cristal, là où un atome devrait se trouver. C''est le plus simple des défauts cristallins.', array['Défaut cristallin', 'Dislocation']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'lacune');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Dislocation', 'dislocation', 'cristallographie', 'Défaut en forme de ligne dans un cristal, où l''empilement des atomes est décalé. Les dislocations permettent aux métaux de se déformer sans casser.', array['Défaut cristallin', 'Lacune', 'Ductile']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'dislocation');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Centre coloré', 'centre-colore', 'cristallographie', 'Défaut cristallin qui absorbe certaines couleurs de la lumière et colore le minéral. Les irradiations naturelles en créent dans le quartz fumé, la fluorine ou la topaze.', array['Défaut cristallin', 'Chromophore', 'Couleur']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Quartz', 'Fluorite', 'Topaze']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'centre-colore');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Axe cristallographique', 'axe-cristallographique', 'cristallographie', 'Direction choisie dans un cristal pour décrire sa forme et placer ses faces. Un système cristallin se définit par le nombre, la longueur et l''angle de ses axes.', array['Système cristallin', 'Maille', 'Axe de symétrie']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'axe-cristallographique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Paramètre de maille', 'parametre-de-maille', 'cristallographie', 'Longueur d''une arête de la maille d''un cristal, ou angle entre deux arêtes. Ces valeurs, mesurées par diffraction des rayons X, caractérisent chaque espèce minérale.', array['Maille', 'Diffraction des rayons X', 'Réseau cristallin']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'parametre-de-maille');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Nœud du réseau', 'n-ud-du-reseau', 'cristallographie', 'Point qui représente chaque position répétée à l''identique dans un réseau cristallin. Relier les nœuds dessine la maille.', array['Réseau cristallin', 'Maille']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'n-ud-du-reseau');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Motif cristallin', 'motif-cristallin', 'cristallographie', 'Groupe d''atomes qui, répété à chaque nœud du réseau, construit tout le cristal.', array['Réseau cristallin', 'Maille', 'Structure cristalline']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'motif-cristallin');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Réseau de Bravais', 'reseau-de-bravais', 'cristallographie', 'Une des 14 façons d''empiler des points dans l''espace en répétant une maille. Les 14 réseaux de Bravais se répartissent entre les 7 systèmes cristallins.', array['Réseau cristallin', 'Maille', 'Système cristallin']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'reseau-de-bravais');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Cubique centré', 'cubique-centre', 'cristallographie', 'Structure où les atomes occupent les huit sommets d''un cube et son centre. Le fer en est un exemple.', array['Cubique', 'Maille', 'Structure cristalline']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Fer natif']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'cubique-centre');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Cubique à faces centrées', 'cubique-a-faces-centrees', 'cristallographie', 'Structure où les atomes occupent les sommets d''un cube et le centre de chacune de ses faces. L''or, l''argent et le cuivre natifs la partagent.', array['Cubique', 'Maille', 'Structure cristalline']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Or', 'Argent', 'Cuivre']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'cubique-a-faces-centrees');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Hexagonal compact', 'hexagonal-compact', 'cristallographie', 'Empilement de couches d''atomes serrées au maximum, disposées en alternance, qui forme un réseau hexagonal. Le magnésium et le zinc en sont des exemples.', array['Hexagonal', 'Structure cristalline', 'Maille']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'hexagonal-compact');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Coordinence', 'coordinence', 'cristallographie', 'Nombre d''atomes ou d''ions voisins directs qui entourent un atome dans un cristal. Dans les silicates, le silicium est entouré de quatre oxygènes.', array['Structure cristalline', 'Tétraèdre', 'Octaèdre']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'coordinence');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Liaison ionique', 'liaison-ionique', 'cristallographie', 'Liaison qui tient ensemble des ions de charges opposées. Elle domine dans la halite et dans la fluorine, donne des minéraux cassants et souvent solubles.', array['Ion', 'Halogénure', 'Structure cristalline']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Halite', 'Fluorite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'liaison-ionique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Liaison covalente', 'liaison-covalente', 'cristallographie', 'Liaison où deux atomes partagent des électrons. Elle donne des cristaux très durs et peu solubles, comme le diamant.', array['Atome', 'Dureté', 'Structure cristalline']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Diamant', 'Quartz']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'liaison-covalente');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Liaison métallique', 'liaison-metallique', 'cristallographie', 'Liaison où les électrons circulent librement entre les atomes. Elle explique l''éclat métallique, la conduction de l''électricité et la ductilité des métaux natifs.', array['Élément natif', 'Éclat métallique', 'Ductile']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Or', 'Cuivre', 'Argent']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'liaison-metallique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Classe de symétrie', 'classe-de-symetrie', 'cristallographie', 'Chacun des 32 groupes que forment les éléments de symétrie possibles d''un cristal (axes, plans, centre). Elle détermine les formes cristallines qu''un minéral peut prendre.', array['Classe cristalline', 'Symétrie', 'Système cristallin']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'classe-de-symetrie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Axe hélicoïdal', 'axe-helicoidal', 'cristallographie', 'Élément de symétrie qui combine une rotation et un déplacement le long d''un axe, comme une vis. On ne le voit pas sur le cristal entier, il agit à l''échelle des atomes.', array['Symétrie', 'Groupe d''espace', 'Axe de symétrie']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'axe-helicoidal');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Plan de glissement', 'plan-de-glissement', 'cristallographie', 'Élément de symétrie qui combine un miroir et un déplacement parallèle à ce miroir. Il intervient à l''échelle des atomes et ne se voit pas sur les faces.', array['Symétrie', 'Groupe d''espace', 'Plan de symétrie']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'plan-de-glissement');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Groupe ponctuel', 'groupe-ponctuel', 'cristallographie', 'Ensemble des éléments de symétrie qui laissent un cristal identique à lui-même en un point fixe. Il en existe 32, ce sont les classes cristallines.', array['Classe cristalline', 'Symétrie', 'Groupe d''espace']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'groupe-ponctuel');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Holoédrie', 'holoedrie', 'cristallographie', 'Symétrie complète d''un système cristallin : le cristal porte toutes les faces que son système permet. Un cube avec ses six faces et un octaèdre avec ses huit faces sont holoédriques.', array['Hémiédrie', 'Classe cristalline', 'Symétrie']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'holoedrie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Hémiédrie', 'hemiedrie', 'cristallographie', 'Symétrie réduite de moitié : le cristal ne montre qu''une partie des faces de la forme complète. Le tétraèdre est la moitié d''un octaèdre.', array['Holoédrie', 'Tétraèdre', 'Classe cristalline']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'hemiedrie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Forme simple', 'forme-simple', 'cristallographie', 'Ensemble de faces qui se déduisent toutes les unes des autres par la symétrie du cristal : toutes les faces d''un cube, ou d''un octaèdre.', array['Forme cristalline', 'Combinaison de formes', 'Face']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'forme-simple');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Combinaison de formes', 'combinaison-de-formes', 'cristallographie', 'Cristal limité par plusieurs formes simples à la fois, par exemple un cube dont les angles sont tronqués par un octaèdre.', array['Forme simple', 'Forme cristalline', 'Cubo-octaèdre']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'combinaison-de-formes');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Forme ouverte', 'forme-ouverte', 'cristallographie', 'Forme cristalline dont les faces ne peuvent pas enfermer un espace à elles seules, comme un prisme ou un pinacoïde. Elle doit s''associer à d''autres faces.', array['Forme fermée', 'Prisme', 'Pinacoïde']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'forme-ouverte');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Forme fermée', 'forme-fermee', 'cristallographie', 'Forme cristalline dont les faces enferment à elles seules un volume : cube, octaèdre, tétraèdre, bipyramide.', array['Forme ouverte', 'Octaèdre', 'Bipyramide']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'forme-fermee');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Face vicinale', 'face-vicinale', 'cristallographie', 'Face très peu inclinée par rapport à une face principale, qui forme sur elle de petites marches. Elle donne un aspect bombé ou strié à la face.', array['Face', 'Figure de croissance', 'Stries']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'face-vicinale');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Angle dièdre', 'angle-diedre', 'cristallographie', 'Angle entre deux faces d''un cristal. Sa mesure à l''aide d''un goniomètre permet d''identifier l''espèce.', array['Goniomètre', 'Loi de Sténon', 'Face']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'angle-diedre');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Zone cristalline', 'zone-cristalline', 'cristallographie', 'Ensemble de faces dont les arêtes sont toutes parallèles à une même direction. Les faces d''un prisme forment une zone.', array['Prisme', 'Face', 'Axe cristallographique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'zone-cristalline');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Pédion', 'pedion', 'cristallographie', 'Forme cristalline réduite à une seule face, sans face parallèle qui lui corresponde.', array['Pinacoïde', 'Face', 'Forme simple']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'pedion');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Dôme', 'dome', 'cristallographie', 'Forme cristalline à deux faces qui se rejoignent en toit et sont parallèles à un axe horizontal. On la trouve dans les systèmes de basse symétrie.', array['Prisme', 'Pinacoïde', 'Forme simple']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'dome');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Sphénoïde', 'sphenoide', 'cristallographie', 'Forme cristalline à deux faces inclinées l''une vers l''autre, comme un coin, issue d''une symétrie réduite.', array['Dôme', 'Pinacoïde', 'Forme simple']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'sphenoide');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Bisphénoïde', 'bisphenoide', 'cristallographie', 'Forme à quatre faces triangulaires, qui ressemble à un tétraèdre allongé ou aplati. On la trouve dans les systèmes quadratique et orthorhombique.', array['Tétraèdre', 'Forme simple', 'Quadratique']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Chalcopyrite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'bisphenoide');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Hexoctaèdre', 'hexoctaedre', 'cristallographie', 'Forme cristalline du système cubique à 48 faces triangulaires. On l''observe sur le diamant, entre autres.', array['Cubique', 'Octaèdre', 'Forme simple']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Diamant']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'hexoctaedre');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Trioctaèdre', 'trioctaedre', 'cristallographie', 'Forme cristalline du système cubique à 24 faces, trois par face d''octaèdre, qui ressemble à un octaèdre aux faces bombées en pyramide.', array['Octaèdre', 'Icositétraèdre', 'Forme simple']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'trioctaedre');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Tétrahexaèdre', 'tetrahexaedre', 'cristallographie', 'Forme cristalline du système cubique à 24 faces triangulaires, qui ressemble à un cube dont chaque face porte une pyramide basse.', array['Cube', 'Cubique', 'Forme simple']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Fluorite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'tetrahexaedre');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Hexatétraèdre', 'hexatetraedre', 'cristallographie', 'Forme cristalline du système cubique à 24 faces triangulaires, qui dérive du tétraèdre. On la trouve dans la tétraédrite et la sphalérite.', array['Tétraèdre', 'Cubique', 'Forme simple']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Tétraédrite', 'Sphalérite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'hexatetraedre');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Cristal uniaxe', 'cristal-uniaxe', 'cristallographie', 'Cristal qui possède une seule direction (un axe optique) le long de laquelle la lumière ne se dédouble pas. Les cristaux quadratiques, hexagonaux et trigonaux sont uniaxes.', array['Cristal biaxe', 'Biréfringence', 'Axe optique']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Quartz', 'Calcite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'cristal-uniaxe');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Cristal biaxe', 'cristal-biaxe', 'cristallographie', 'Cristal qui possède deux axes optiques. Les cristaux orthorhombiques, monocliniques et tricliniques sont biaxes.', array['Cristal uniaxe', 'Biréfringence', 'Axe optique']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Topaze', 'Feldspath']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'cristal-biaxe');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Axe optique', 'axe-optique', 'cristallographie', 'Direction dans un cristal le long de laquelle la lumière traverse sans se dédoubler. Les cristaux uniaxes en ont un, les cristaux biaxes deux.', array['Biréfringence', 'Cristal uniaxe', 'Cristal biaxe']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'axe-optique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Extinction', 'extinction', 'cristallographie', 'Disparition de la lumière d''un minéral observé entre deux filtres polarisants croisés, à certains angles de rotation. L''angle d''extinction aide à l''identifier.', array['Lumière polarisée', 'Microscope polarisant', 'Biréfringence']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'extinction');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Lumière polarisée', 'lumiere-polarisee', 'cristallographie', 'Lumière dont les vibrations se font dans un seul plan. Les minéralogistes l''utilisent, avec des filtres, pour étudier les propriétés optiques des minéraux.', array['Polariscope', 'Biréfringence', 'Microscope polarisant']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'lumiere-polarisee');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Anisotropie', 'anisotropie', 'cristallographie', 'Propriété d''un cristal dont les caractéristiques (dureté, indice de réfraction, conduction) varient selon la direction. La plupart des cristaux sont anisotropes.', array['Anisotrope', 'Isotrope', 'Biréfringence']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'anisotropie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Isotypie', 'isotypie', 'cristallographie', 'Parenté de structure de deux minéraux de composition chimique différente qui s''organisent de la même façon, comme la halite et la galène.', array['Isomorphisme', 'Structure cristalline', 'Polymorphisme']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Halite', 'Galène']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'isotypie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Dimorphisme', 'dimorphisme', 'cristallographie', 'Cas où une même substance existe sous deux structures cristallines différentes. Le carbonate de calcium est dimorphe : calcite et aragonite.', array['Polymorphisme', 'Polytype', 'Structure cristalline']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Calcite', 'Aragonite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'dimorphisme');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Atome', 'atome', 'cristallographie', 'Plus petite unité d''un élément chimique. Un minéral est un assemblage régulier d''atomes.', array['Ion', 'Élément chimique', 'Structure cristalline']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'atome');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Ion', 'ion', 'cristallographie', 'Atome ou groupe d''atomes qui porte une charge électrique, positive ou négative. Les cristaux ioniques sont faits d''ions rangés régulièrement.', array['Cation', 'Anion', 'Liaison ionique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'ion');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Cation', 'cation', 'cristallographie', 'Ion de charge positive, comme le calcium, le fer ou le cuivre. Il se lie aux anions pour former les minéraux.', array['Ion', 'Anion', 'Liaison ionique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'cation');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Anion', 'anion', 'cristallographie', 'Ion de charge négative, comme l''oxygène, le soufre, le chlore ou les groupes carbonate et sulfate. Les minéraux sont classés selon leur anion principal.', array['Ion', 'Cation', 'Carbonate', 'Sulfate']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'anion');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Élément chimique', 'element-chimique', 'cristallographie', 'Substance qui ne peut pas être décomposée en d''autres par réaction chimique, définie par le nombre de protons de son atome. Une centaine d''éléments entrent dans la composition des minéraux.', array['Atome', 'Formule chimique', 'Élément natif']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'element-chimique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Minéralogie', 'mineralogie', 'mineralogie', 'Science qui étudie les minéraux : leur composition, leur structure, leurs propriétés, leur origine et leur classement.', array['Minéral', 'Espèce minérale', 'Cristallographie', 'Gisement']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'mineralogie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Gemmologie', 'gemmologie', 'mineralogie', 'Étude des gemmes : leur identification, leur évaluation, leurs traitements et leurs imitations. Elle s''appuie sur la minéralogie mais s''intéresse surtout aux pierres taillées.', array['Gemme', 'Pierre précieuse', 'Traitement', 'Synthétique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'gemmologie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Cristallochimie', 'cristallochimie', 'mineralogie', 'Étude des liens entre la composition chimique d''un minéral et la structure de son cristal. Elle explique, par exemple, pourquoi deux minéraux voisins ont des propriétés différentes.', array['Structure cristalline', 'Isomorphisme', 'Formule chimique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'cristallochimie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Classification de Strunz', 'classification-de-strunz', 'mineralogie', 'Système de classement des minéraux fondé sur leur composition chimique et leur structure. Il distingue notamment les éléments natifs, les sulfures, les halogénures, les oxydes, les carbonates, les sulfates, les phosphates et les silicates.', array['Espèce minérale', 'Élément natif', 'Silicate']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'classification-de-strunz');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Classification de Dana', 'classification-de-dana', 'mineralogie', 'Système de classement des minéraux fondé sur leur composition chimique, créé aux États-Unis par la famille Dana. Il sert de référence, comme la classification de Strunz.', array['Classification de Strunz', 'Espèce minérale']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'classification-de-dana');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Nomenclature minérale', 'nomenclature-minerale', 'mineralogie', 'Règles qui encadrent le nom des minéraux. L''IMA valide chaque nouveau nom et la description de l''espèce.', array['IMA', 'Espèce minérale', 'Éponyme']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'nomenclature-minerale');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Éponyme', 'eponyme', 'mineralogie', 'Se dit d''un nom de minéral donné en hommage à une personne, à un lieu ou à une institution. La goethite honore Goethe, et la franklinite la ville de Franklin.', array['Nomenclature minérale', 'IMA', 'Localité type']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Goethite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'eponyme');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Minéral discrédité', 'mineral-discredite', 'mineralogie', 'Espèce dont l''IMA a retiré la reconnaissance, parce qu''elle s''est révélée être un mélange, un synonyme ou une erreur d''analyse. Son nom ne doit plus servir d''espèce.', array['IMA', 'Espèce minérale', 'Variété']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'mineral-discredite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Holotype', 'holotype', 'mineralogie', 'Échantillon unique sur lequel une espèce minérale nouvelle a été décrite. Il est conservé dans un musée ou une collection publique.', array['Localité type', 'Espèce minérale', 'IMA']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'holotype');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Synonyme', 'synonyme', 'mineralogie', 'Autre nom donné au même minéral. Un synonyme ancien ou régional peut subsister dans les collections alors que l''IMA n''en retient qu''un.', array['Variété', 'Espèce minérale', 'Nomenclature minérale']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'synonyme');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Sous-groupe', 'sous-groupe', 'mineralogie', 'Division d''un groupe minéral qui rassemble les espèces les plus proches par leur composition. Dans le groupe des grenats, on distingue par exemple les grenats alumineux.', array['Groupe minéral', 'Espèce minérale', 'Série']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Grenat']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'sous-groupe');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Pôle d''une série', 'pole-d-une-serie', 'mineralogie', 'Composition extrême d''une série de solution solide. Les termes intermédiaires se situent entre deux pôles.', array['Série', 'Solution solide', 'Isomorphisme']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'pole-d-une-serie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Minéral accessoire', 'mineral-accessoire', 'mineralogie', 'Minéral présent en très petite quantité dans une roche, comme le zircon ou l''apatite dans un granite. Il ne définit pas la roche.', array['Minéral', 'Roche', 'Minéral essentiel']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Zircon', 'Apatite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'mineral-accessoire');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Minéral essentiel', 'mineral-essentiel', 'mineralogie', 'Minéral qui définit une roche, parce qu''il en forme une part importante. Le quartz, le feldspath et le mica sont les minéraux essentiels du granite.', array['Minéral accessoire', 'Roche', 'Granite']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Quartz', 'Mica']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'mineral-essentiel');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Chromophore', 'chromophore', 'mineralogie', 'Élément chimique, ou défaut du cristal, responsable de la couleur d''un minéral : fer, chrome, cuivre, manganèse, titane.', array['Couleur', 'Allochromatique', 'Idiochromatique', 'Centre coloré']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'chromophore');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Pseudochromatique', 'pseudochromatique', 'mineralogie', 'Se dit d''une couleur due non à la composition chimique mais à des phénomènes physiques : fines inclusions, réseau, diffraction, interférences. L''opale précieuse en offre un exemple.', array['Idiochromatique', 'Allochromatique', 'Irisation']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Opale']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'pseudochromatique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Dichroïsme', 'dichroisme', 'mineralogie', 'Propriété d''un cristal qui montre deux couleurs différentes selon la direction d''observation. C''est un cas particulier du pléochroïsme.', array['Pléochroïsme', 'Cristal uniaxe', 'Dichroscope']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Cordiérite', 'Tourmaline']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'dichroisme');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Trichroïsme', 'trichroisme', 'mineralogie', 'Propriété d''un cristal qui montre trois couleurs différentes selon la direction d''observation. Elle concerne les cristaux biaxes.', array['Pléochroïsme', 'Dichroïsme', 'Cristal biaxe']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Cordiérite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'trichroisme');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Photosensibilité', 'photosensibilite', 'mineralogie', 'Propriété d''un minéral dont la couleur change ou s''estompe à la lumière ou à la chaleur. Certains quartz roses, certaines améthystes et certaines kunzites pâlissent au soleil.', array['Couleur', 'Centre coloré', 'Ultraviolets']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Quartz rose', 'Améthyste', 'Kunzite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'photosensibilite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Thermoluminescence', 'thermoluminescence', 'mineralogie', 'Lumière émise par un minéral chauffé doucement après avoir été irradié. Certaines fluorines et certaines calcites s''illuminent ainsi.', array['Luminescence', 'Fluorescence', 'Triboluminescence']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Fluorite', 'Calcite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'thermoluminescence');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Cathodoluminescence', 'cathodoluminescence', 'mineralogie', 'Lumière émise par un minéral bombardé d''électrons. Elle sert en laboratoire à révéler les zones de croissance des cristaux.', array['Luminescence', 'Zonage', 'Fluorescence']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'cathodoluminescence');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Aventurescence', 'aventurescence', 'mineralogie', 'Scintillement dû à de minuscules inclusions de paillettes qui réfléchissent la lumière à l''intérieur de la pierre. La pierre de soleil et l''aventurine en sont deux exemples.', array['Inclusion', 'Paillette', 'Chatoyance']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Aventurine', 'Pierre de soleil']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'aventurescence');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Opalescence', 'opalescence', 'mineralogie', 'Reflet laiteux et bleuté d''une pierre, dû à la diffusion de la lumière par de très fines particules. L''opale commune laiteuse en montre.', array['Adularescence', 'Irisation', 'Translucide']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Opale']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'opalescence');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Schiller', 'schiller', 'mineralogie', 'Reflet métallique ou nacré qui se déplace à la surface d''un minéral selon l''éclairage, dû à des lamelles minuscules à l''intérieur. Il est typique de l''hypersthène et du labrador.', array['Labradorescence', 'Adularescence', 'Chatoyance']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Labradorite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'schiller');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Diaphane', 'diaphane', 'mineralogie', 'Se dit d''un minéral qui laisse passer la lumière sans permettre de distinguer nettement les objets qu''on regarde au travers. Synonyme de translucide.', array['Translucide', 'Transparent', 'Opaque']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'diaphane');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Hyalin', 'hyalin', 'mineralogie', 'Se dit d''un minéral clair et transparent comme du verre. On appelle ainsi le quartz hyalin, ou cristal de roche.', array['Transparent', 'Éclat vitreux', 'Limpide']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Quartz']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'hyalin');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Limpide', 'limpide', 'mineralogie', 'Se dit d''un cristal parfaitement clair, sans fêlure ni inclusion visible.', array['Transparent', 'Hyalin', 'Qualité gemme']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'limpide');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Laiteux', 'laiteux', 'mineralogie', 'Se dit d''un minéral blanc et translucide comme du lait, à cause de fines inclusions ou de bulles de fluide.', array['Translucide', 'Inclusion fluide', 'Opalescence']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Quartz']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'laiteux');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Qualité gemme', 'qualite-gemme', 'mineralogie', 'Qualité d''un cristal transparent et net, assez pur pour être taillé en gemme. On dit qu''un cristal est gemmé.', array['Gemme', 'Transparent', 'Limpide']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'qualite-gemme');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Masse volumique', 'masse-volumique', 'mineralogie', 'Masse d''un minéral par unité de volume, exprimée en grammes par centimètre cube. Divisée par la masse volumique de l''eau, elle donne la densité.', array['Densité', 'Poids spécifique', 'Balance hydrostatique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'masse-volumique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Poids spécifique', 'poids-specifique', 'mineralogie', 'Autre nom de la densité d''un minéral : rapport entre sa masse et celle d''un même volume d''eau.', array['Densité', 'Masse volumique', 'Balance hydrostatique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'poids-specifique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Balance hydrostatique', 'balance-hydrostatique', 'mineralogie', 'Balance qui pèse un minéral dans l''air puis dans l''eau, ce qui permet de calculer sa densité par la différence des deux pesées.', array['Densité', 'Masse volumique', 'Liqueur dense']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'balance-hydrostatique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Liqueur dense', 'liqueur-dense', 'mineralogie', 'Liquide très dense dans lequel on plonge un minéral pour estimer sa densité : il flotte ou coule selon qu''il est plus ou moins dense que le liquide. Elle sert aussi à séparer des minéraux.', array['Densité', 'Balance hydrostatique', 'Masse volumique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'liqueur-dense');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Solubilité', 'solubilite', 'mineralogie', 'Capacité d''un minéral à se dissoudre dans un liquide, l''eau le plus souvent. La halite se dissout dans l''eau, le quartz presque pas.', array['Hygroscopique', 'Efflorescence', 'Dissolution']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Halite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'solubilite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Hygroscopique', 'hygroscopique', 'mineralogie', 'Se dit d''un minéral qui absorbe l''humidité de l''air. Il doit être conservé au sec.', array['Solubilité', 'Déliquescent', 'Efflorescence']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Halite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'hygroscopique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Déliquescent', 'deliquescent', 'mineralogie', 'Se dit d''un minéral qui absorbe tant d''humidité de l''air qu''il finit par se dissoudre dans cette eau.', array['Hygroscopique', 'Solubilité', 'Efflorescence']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'deliquescent');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Minéral hydraté', 'mineral-hydrate', 'mineralogie', 'Minéral qui contient de l''eau dans sa structure, sous forme de molécules ou de groupes hydroxyle. Le gypse et la turquoise sont hydratés.', array['Eau de cristallisation', 'Anhydre', 'Hydroxyde']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Gypse', 'Turquoise']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'mineral-hydrate');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Eau de cristallisation', 'eau-de-cristallisation', 'mineralogie', 'Molécules d''eau intégrées à la structure d''un cristal. Un minéral qui en perd par la chaleur ou la sécheresse peut s''altérer.', array['Minéral hydraté', 'Anhydre', 'Déshydratation']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Gypse']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'eau-de-cristallisation');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Anhydre', 'anhydre', 'mineralogie', 'Se dit d''un minéral qui ne contient pas d''eau dans sa structure. L''anhydrite est le sulfate de calcium sans eau, par opposition au gypse.', array['Minéral hydraté', 'Eau de cristallisation', 'Sulfate']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Anhydrite', 'Gypse']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'anhydre');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Déshydratation', 'deshydratation', 'mineralogie', 'Perte d''eau d''un minéral hydraté, par la chaleur ou l''air sec. Elle peut le faire changer d''aspect, de couleur ou de forme.', array['Eau de cristallisation', 'Minéral hydraté', 'Efflorescence']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'deshydratation');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Fusibilité', 'fusibilite', 'mineralogie', 'Facilité avec laquelle un minéral fond à la flamme. Une échelle à six degrés, dite de von Kobell, permet de la comparer.', array['Test au chalumeau', 'Test à la flamme']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'fusibilite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Test à la flamme', 'test-a-la-flamme', 'mineralogie', 'Observation de la couleur que prend une flamme quand on y chauffe un fragment de minéral. Le cuivre colore la flamme en vert, le sodium en jaune, le strontium en rouge.', array['Test au chalumeau', 'Fusibilité']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Malachite', 'Halite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'test-a-la-flamme');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Test au chalumeau', 'test-au-chalumeau', 'mineralogie', 'Chauffage d''un fragment de minéral à l''aide d''un chalumeau pour observer comment il fond, change de couleur ou dégage une odeur. Les minéralogistes l''utilisaient beaucoup avant les analyses modernes.', array['Fusibilité', 'Test à la flamme']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'test-au-chalumeau');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Test à l''acide', 'test-a-l-acide', 'mineralogie', 'Dépôt d''une goutte d''acide dilué sur un minéral pour observer s''il fait de la mousse. Les carbonates, comme la calcite, effervescent.', array['Effervescence', 'Carbonate']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Calcite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'test-a-l-acide');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Plaque de porcelaine', 'plaque-de-porcelaine', 'mineralogie', 'Plaquette de porcelaine blanche non émaillée sur laquelle on frotte un minéral pour observer la couleur de sa poudre, ou trait.', array['Trait', 'Couleur', 'Dureté']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'plaque-de-porcelaine');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Pointe de dureté', 'pointe-de-durete', 'mineralogie', 'Petit outil à pointe (crayon d''acier ou de minéral) dont la dureté est connue et qui sert à rayer un minéral pour situer sa dureté sur l''échelle de Mohs.', array['Dureté', 'Échelle de Mohs']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'pointe-de-durete');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Paramagnétisme', 'paramagnetisme', 'mineralogie', 'Propriété d''un minéral faiblement attiré par un aimant très puissant, mais pas par un simple aimant de poche. Beaucoup de minéraux riches en fer en font preuve.', array['Magnétisme', 'Ferromagnétisme']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'paramagnetisme');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Ferromagnétisme', 'ferromagnetisme', 'mineralogie', 'Propriété d''un minéral fortement attiré par un aimant ordinaire. La magnétite est le minéral ferromagnétique le plus courant.', array['Magnétisme', 'Paramagnétisme']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Magnétite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'ferromagnetisme');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Fragile', 'fragile', 'mineralogie', 'Se dit d''un minéral qui se brise ou s''effrite sous un choc ou une pression. C''est la ténacité la plus courante chez les minéraux.', array['Ténacité', 'Friable', 'Ductile']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Quartz']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'fragile');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Friable', 'friable', 'mineralogie', 'Se dit d''un minéral qui s''écrase facilement en poudre entre les doigts.', array['Fragile', 'Ténacité', 'Pulvérulent']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'friable');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Ductile', 'ductile', 'mineralogie', 'Se dit d''un minéral qui peut s''étirer en fil sans casser. Le cuivre natif et l''or le sont.', array['Malléable', 'Ténacité', 'Élément natif']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Or', 'Cuivre']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'ductile');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Tenace', 'tenace', 'mineralogie', 'Se dit d''un minéral qui résiste aux chocs et qui est difficile à casser. La jadéite et la néphrite sont remarquablement tenaces.', array['Ténacité', 'Fragile', 'Dureté']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Jadéite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'tenace');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Cassure crochue', 'cassure-crochue', 'mineralogie', 'Cassure qui laisse une surface déchiquetée, à pointes coupantes. Elle est typique des métaux natifs ductiles, comme le cuivre natif.', array['Cassure', 'Ductile', 'Élément natif']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Cuivre']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'cassure-crochue');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Cassure fibreuse', 'cassure-fibreuse', 'mineralogie', 'Cassure qui se fait en fibres ou en esquilles très fines, comme dans le bois. On l''observe dans la serpentine fibreuse ou le gypse fibreux.', array['Cassure', 'Cassure esquilleuse', 'Fibreux']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Gypse']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'cassure-fibreuse');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Clivage cubique', 'clivage-cubique', 'mineralogie', 'Trois directions de clivage à angle droit, qui produisent des fragments en forme de cubes. La halite et la galène se clivent ainsi.', array['Clivage', 'Clivage parfait', 'Cubique']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Halite', 'Galène']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'clivage-cubique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Clivage prismatique', 'clivage-prismatique', 'mineralogie', 'Clivage parallèle aux faces d''un prisme, qui produit des fragments allongés à section en losange ou en rectangle. Il est typique des amphiboles.', array['Clivage', 'Prisme', 'Amphibole']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Hornblende']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'clivage-prismatique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Clivage pinacoïdal', 'clivage-pinacoidal', 'mineralogie', 'Clivage parallèle à une paire de faces opposées, qui produit de grandes lames planes. Le mica et le gypse se clivent ainsi.', array['Clivage', 'Clivage basal', 'Pinacoïde']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Mica', 'Gypse']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'clivage-pinacoidal');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Clivage dodécaédrique', 'clivage-dodecaedrique', 'mineralogie', 'Clivage en six directions, parallèle aux faces d''un dodécaèdre. Il est caractéristique de la sphalérite.', array['Clivage', 'Dodécaèdre', 'Rhombododécaèdre']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Sphalérite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'clivage-dodecaedrique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Mamelonné', 'mamelonne', 'mineralogie', 'Se dit d''une surface formée de petites bosses arrondies, comme la malachite, la goethite ou l''hématite.', array['Botryoïdal', 'Réniforme', 'Habitus']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Malachite', 'Goethite', 'Hématite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'mamelonne');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Coralloïde', 'coralloide', 'mineralogie', 'Se dit d''un minéral aux branches arrondies comme un corail. L''aragonite en « fleur de fer » en est un exemple.', array['Habitus', 'Dendrite', 'Stalactite']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Aragonite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'coralloide');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Filiforme', 'filiforme', 'mineralogie', 'Se dit d''un minéral en fils fins, flexibles ou raides. Le cuivre natif et l''argent natif forment souvent des cristaux filiformes.', array['Capillaire', 'Aciculaire', 'Habitus']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Cuivre', 'Argent']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'filiforme');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Arborescent', 'arborescent', 'mineralogie', 'Se dit d''un groupe de cristaux ramifiés comme un arbre. Les dendrites, le cuivre natif et l''argent natif prennent cette forme.', array['Dendrite', 'Habitus', 'Filiforme']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Cuivre', 'Argent']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'arborescent');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Colonnaire', 'colonnaire', 'mineralogie', 'Se dit d''un minéral formé de colonnes serrées, parallèles ou en éventail, comme certains agrégats de calcite, de tourmaline ou de béryl.', array['Prismatique', 'Habitus', 'Agrégat cristallin']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Calcite', 'Tourmaline']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'colonnaire');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Sphérolitique', 'spherolitique', 'mineralogie', 'Se dit d''un minéral en petites sphères formées de fibres rayonnant depuis un centre. La malachite et la wavellite en donnent des exemples.', array['Fibro-radié', 'Rosette', 'Habitus']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Wavellite', 'Malachite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'spherolitique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Pisolitique', 'pisolitique', 'mineralogie', 'Se dit d''un minéral formé de petites boules de la taille d''un pois, faites de couches concentriques, comme certaines bauxites.', array['Oolithique', 'Concrétion', 'Habitus']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'pisolitique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Oolithique', 'oolithique', 'mineralogie', 'Se dit d''un minéral ou d''une roche formés de grains minuscules arrondis, faits de couches concentriques, comme les œufs d''un poisson.', array['Pisolitique', 'Concrétion', 'Habitus']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'oolithique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Squelettique', 'squelettique', 'mineralogie', 'Se dit d''un cristal dont les arêtes ont grandi plus vite que les faces, ce qui laisse des creux.', array['Cristal squelettique', 'Croissance en trémie', 'Habitus']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'squelettique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Pulvérulent', 'pulverulent', 'mineralogie', 'Se dit d''un minéral en poudre fine, sans cohésion, qui se dépose en enduit ou en croûte.', array['Friable', 'Enduit', 'Habitus']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'pulverulent');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Radié', 'radie', 'mineralogie', 'Se dit d''un agrégat dont les cristaux rayonnent à partir d''un centre, comme les rayons d''une roue.', array['Fibro-radié', 'Rosette', 'Gerbe']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Stibine', 'Pyrite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'radie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Équant', 'equant', 'mineralogie', 'Se dit d''un cristal dont les trois dimensions sont à peu près égales, comme un cube ou un octaèdre, par opposition aux cristaux allongés ou aplatis.', array['Habitus', 'Cubique', 'Octaèdre']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'equant');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Bacillaire', 'bacillaire', 'mineralogie', 'Se dit d''un cristal allongé en bâtonnet, plus épais qu''une aiguille.', array['Aciculaire', 'Prismatique', 'Habitus']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'bacillaire');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Géodique', 'geodique', 'mineralogie', 'Se dit d''un minéral qui tapisse l''intérieur d''une cavité, ou d''une roche creuse comme une géode.', array['Géode', 'Druse', 'Amygdale']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Quartz', 'Améthyste']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'geodique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Étoilé', 'etoile', 'mineralogie', 'Se dit d''un agrégat de cristaux disposés en étoile autour d''un point, comme les macles cycliques de certains minéraux.', array['Macle cyclique', 'Radié', 'Rosette']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'etoile');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Rubané', 'rubane', 'mineralogie', 'Se dit d''un minéral ou d''une roche qui montre des bandes parallèles de couleurs ou de textures différentes, comme l''agate ou l''onyx.', array['Zonage', 'Concrétion', 'Couleur']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Agate', 'Onyx']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'rubane');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Cristallin', 'cristallin', 'mineralogie', 'Se dit d''un minéral ou d''une roche constitués de cristaux visibles, par opposition à une substance sans forme cristalline.', array['Cryptocristallin', 'Microcristallin', 'Amorphe']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'cristallin');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Microcristallin', 'microcristallin', 'mineralogie', 'Se dit d''un minéral formé de cristaux trop petits pour être vus à l''œil nu, mais visibles au microscope ou à la loupe.', array['Cryptocristallin', 'Cristallin', 'Granulaire']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Calcédoine']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'microcristallin');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Cryptocristallin', 'cryptocristallin', 'mineralogie', 'Se dit d''un minéral formé de cristaux si petits qu''ils ne se distinguent même pas au microscope ordinaire. La calcédoine en est un exemple.', array['Microcristallin', 'Amorphe', 'Cristallin']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Calcédoine']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'cryptocristallin');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Oxyde', 'oxyde', 'mineralogie', 'Minéral où un ou plusieurs métaux sont combinés à de l''oxygène. L''hématite, la magnétite, le corindon et la cuprite en sont des exemples.', array['Oxyde et hydroxyde', 'Hydroxyde', 'Élément natif']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Hématite', 'Magnétite', 'Corindon']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'oxyde');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Hydroxyde', 'hydroxyde', 'mineralogie', 'Minéral où un métal est combiné au groupe hydroxyle OH. La goethite et la brucite sont des hydroxydes.', array['Oxyde', 'Oxyde et hydroxyde', 'Minéral hydraté']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Goethite', 'Brucite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'hydroxyde');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Chlorure', 'chlorure', 'mineralogie', 'Halogénure où un métal est combiné au chlore. La halite et la sylvite sont des chlorures.', array['Halogénure', 'Fluorure', 'Évaporite']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Halite', 'Sylvite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'chlorure');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Fluorure', 'fluorure', 'mineralogie', 'Halogénure où un métal est combiné au fluor. La fluorine est le fluorure le plus connu.', array['Halogénure', 'Chlorure', 'Fluorescence']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Fluorite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'fluorure');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Arséniate', 'arseniate', 'mineralogie', 'Minéral dont l''anion principal est le groupe AsO₄, voisin du phosphate. Beaucoup d''arséniates, secondaires et colorés, se forment dans la zone d''oxydation des gisements.', array['Phosphate', 'Vanadate', 'Zone d''oxydation']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Érythrite', 'Annabergite', 'Mimétite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'arseniate');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Vanadate', 'vanadate', 'mineralogie', 'Minéral dont l''anion principal est le groupe VO₄. La vanadinite en est l''exemple le plus connu.', array['Phosphate', 'Arséniate', 'Zone d''oxydation']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Vanadinite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'vanadate');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Chromate', 'chromate', 'mineralogie', 'Minéral dont l''anion principal est le groupe CrO₄. La crocoïte, rouge orangé, est un chromate de plomb.', array['Sulfate', 'Zone d''oxydation', 'Oxyde']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Crocoïte']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'chromate');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Tungstate', 'tungstate', 'mineralogie', 'Minéral dont l''anion principal est le groupe WO₄. La scheelite et la wolframite sont les principaux tungstates, minerais de tungstène.', array['Molybdate', 'Minerai', 'Fluorescence']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Scheelite', 'Wolframite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'tungstate');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Molybdate', 'molybdate', 'mineralogie', 'Minéral dont l''anion principal est le groupe MoO₄. La wulfénite, orange à jaune, est un molybdate de plomb.', array['Tungstate', 'Chromate', 'Zone d''oxydation']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Wulfénite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'molybdate');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Nitrate', 'nitrate', 'mineralogie', 'Minéral dont l''anion principal est le groupe NO₃. Très solubles, les nitrates se forment surtout dans les régions très sèches.', array['Évaporite', 'Solubilité', 'Sulfate']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'nitrate');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Séléniure', 'seleniure', 'mineralogie', 'Minéral où le sélénium est combiné à des métaux. Les séléniures sont rares et souvent associés aux sulfures.', array['Sulfure', 'Tellurure', 'Sulfosel']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'seleniure');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Tellurure', 'tellurure', 'mineralogie', 'Minéral où le tellure est combiné à des métaux. Les tellurures sont parmi les minerais d''or et d''argent de certains gisements.', array['Sulfure', 'Séléniure', 'Élément natif']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'tellurure');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Arséniure', 'arseniure', 'mineralogie', 'Minéral où l''arsenic est combiné à des métaux. La nickéline et la skutterudite sont des arséniures.', array['Sulfure', 'Sulfosel', 'Élément natif']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Nickeline']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'arseniure');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Sulfarséniure', 'sulfarseniure', 'mineralogie', 'Minéral où le soufre et l''arsenic sont combinés à un métal. L''arsénopyrite et la cobaltite en sont des exemples.', array['Sulfure', 'Arséniure', 'Sulfosel']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Arsénopyrite', 'Cobaltite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'sulfarseniure');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Aluminosilicate', 'aluminosilicate', 'mineralogie', 'Silicate qui contient de l''aluminium dans sa structure. Les feldspaths, les micas, les grenats et les zéolites en sont.', array['Silicate', 'Feldspath', 'Mica']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Feldspath', 'Mica']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'aluminosilicate');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Silice', 'silice', 'mineralogie', 'Dioxyde de silicium, de formule SiO₂. Elle forme le quartz et ses variétés, la calcédoine, l''opale et les verres naturels.', array['Silicate', 'Silex', 'Quartzite']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Quartz', 'Opale']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'silice');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Métal natif', 'metal-natif', 'mineralogie', 'Métal présent à l''état pur dans la nature, comme l''or, l''argent, le cuivre, le platine ou le fer.', array['Élément natif', 'Pépite', 'Ductile']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Or', 'Argent', 'Cuivre']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'metal-natif');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Semi-métal', 'semi-metal', 'mineralogie', 'Élément aux propriétés intermédiaires entre un métal et un non-métal, comme l''arsenic, l''antimoine, le bismuth ou le tellure. On les trouve parfois natifs.', array['Élément natif', 'Métal natif']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Arsenic', 'Antimoine', 'Bismuth']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'semi-metal');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Métal précieux', 'metal-precieux', 'mineralogie', 'Métal rare, résistant à la corrosion et très recherché : or, argent, platine et métaux de la même famille.', array['Métal natif', 'Pépite', 'Placer']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Or', 'Argent', 'Platine']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'metal-precieux');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Terres rares', 'terres-rares', 'mineralogie', 'Groupe de 17 éléments chimiques aux propriétés voisines (lanthane, cérium, néodyme…). Ils se concentrent dans quelques minéraux comme la monazite et la bastnaésite.', array['Élément chimique', 'Minerai', 'Radioactivité']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Monazite', 'Bastnäsite-(Ce)']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'terres-rares');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Substitution', 'substitution', 'mineralogie', 'Remplacement d''un atome par un autre de taille et de charge voisines dans la structure d''un cristal. Elle explique les séries de solution solide et les différences de couleur.', array['Isomorphisme', 'Solution solide', 'Série']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'substitution');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Impureté', 'impurete', 'mineralogie', 'Atome étranger présent en petite quantité dans un cristal. Elle peut colorer le minéral sans changer son espèce.', array['Chromophore', 'Allochromatique', 'Substitution']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'impurete');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Élément trace', 'element-trace', 'mineralogie', 'Élément présent en très faible quantité dans un minéral, souvent quelques grammes par tonne. Il renseigne sur l''origine du cristal.', array['Impureté', 'Substitution', 'Élément chimique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'element-trace');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Polariscope', 'polariscope', 'mineralogie', 'Instrument à deux filtres polarisants qui permet de savoir si une pierre est simplement ou doublement réfractante, donc de distinguer un verre d''un cristal.', array['Lumière polarisée', 'Biréfringence', 'Isotrope']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'polariscope');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Réfractomètre', 'refractometre', 'mineralogie', 'Instrument qui mesure l''indice de réfraction d''une gemme à facette plane. Il aide à identifier la pierre.', array['Indice de réfraction', 'Gemmologie', 'Biréfringence']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'refractometre');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Dichroscope', 'dichroscope', 'mineralogie', 'Petit instrument à loupe qui montre côte à côte les deux couleurs d''une pierre dichroïque. Il aide à identifier les gemmes.', array['Dichroïsme', 'Pléochroïsme', 'Gemmologie']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'dichroscope');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Spectroscope', 'spectroscope', 'mineralogie', 'Instrument qui décompose la lumière traversant une pierre pour montrer les raies sombres d''absorption. Ces raies aident à identifier certaines gemmes.', array['Gemmologie', 'Couleur', 'Chromophore']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'spectroscope');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Microscope polarisant', 'microscope-polarisant', 'mineralogie', 'Microscope muni de deux filtres polarisants, utilisé pour observer des minéraux en lame mince ou en grains et déterminer leurs propriétés optiques.', array['Lame mince', 'Lumière polarisée', 'Extinction']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'microscope-polarisant');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Lame mince', 'lame-mince', 'mineralogie', 'Tranche de roche collée sur du verre et amincie à 30 millièmes de millimètre, assez fine pour laisser passer la lumière. On l''observe au microscope polarisant.', array['Microscope polarisant', 'Roche', 'Pétrologie']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'lame-mince');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Section polie', 'section-polie', 'mineralogie', 'Surface de roche ou de minerai polie en miroir pour observer ses minéraux opaques au microscope en lumière réfléchie.', array['Lame mince', 'Minerai', 'Opaque']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'section-polie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Spectroscopie Raman', 'spectroscopie-raman', 'mineralogie', 'Technique d''analyse qui envoie un laser sur un minéral et mesure la lumière qu''il renvoie. Chaque espèce renvoie une signature, ce qui permet de l''identifier sans l''abîmer.', array['Diffraction des rayons X', 'Analyse chimique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'spectroscopie-raman');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Microsonde électronique', 'microsonde-electronique', 'mineralogie', 'Appareil qui envoie un faisceau d''électrons sur un point minuscule d''un minéral pour en mesurer la composition chimique.', array['Analyse chimique', 'Formule chimique', 'Microscopie électronique à balayage']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'microsonde-electronique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Microscopie électronique à balayage', 'microscopie-electronique-a-balayage', 'mineralogie', 'Technique qui balaie un minéral avec un faisceau d''électrons pour en produire des images très agrandies, jusqu''à plusieurs dizaines de milliers de fois. Elle porte aussi le sigle MEB.', array['Microsonde électronique', 'Analyse chimique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'microscopie-electronique-a-balayage');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Fluorescence X', 'fluorescence-x', 'mineralogie', 'Technique d''analyse qui éclaire un minéral par des rayons X et mesure les rayons secondaires qu''il émet, ce qui donne sa composition chimique sans l''abîmer.', array['Analyse chimique', 'Diffraction des rayons X']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'fluorescence-x');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Analyse chimique', 'analyse-chimique', 'mineralogie', 'Mesure des éléments qui composent un minéral. Elle permet de confirmer l''espèce et d''établir sa formule chimique.', array['Formule chimique', 'Microsonde électronique', 'Fluorescence X']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'analyse-chimique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Facette', 'facette', 'mineralogie', 'Petite face plane polie sur une gemme taillée. Leur nombre et leur disposition déterminent l''éclat de la pierre.', array['Taille', 'Gemme', 'Taille brillant']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'facette');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Table', 'table', 'mineralogie', 'Grande facette plane au sommet d''une gemme taillée, par laquelle on regarde la pierre.', array['Facette', 'Couronne', 'Pavillon']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'table');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Couronne', 'couronne', 'mineralogie', 'Partie supérieure d''une gemme taillée, située au-dessus du rondiste, entre la table et le bord de la pierre.', array['Table', 'Pavillon', 'Rondiste']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'couronne');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Pavillon', 'pavillon', 'mineralogie', 'Partie inférieure d''une gemme taillée, sous le rondiste, qui se termine en pointe ou en arête.', array['Couronne', 'Rondiste', 'Table']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'pavillon');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Rondiste', 'rondiste', 'mineralogie', 'Tranche étroite qui sépare la couronne et le pavillon d''une gemme taillée et qui permet de la sertir.', array['Couronne', 'Pavillon', 'Facette']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'rondiste');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Taille brillant', 'taille-brillant', 'mineralogie', 'Taille à 57 ou 58 facettes, conçue pour renvoyer le maximum de lumière. Elle est la plus courante pour le diamant.', array['Taille', 'Facette', 'Éclat adamantin']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Diamant']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'taille-brillant');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Taille émeraude', 'taille-emeraude', 'mineralogie', 'Taille rectangulaire à pans coupés et facettes parallèles, en escalier, qui met en valeur la couleur et la transparence. Elle est classique pour l''émeraude.', array['Taille', 'Facette', 'Gemme']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Émeraude']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'taille-emeraude');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Pureté', 'purete', 'mineralogie', 'Degré de netteté d''une gemme : absence ou présence d''inclusions et de défauts visibles. Elle compte avec la couleur, la taille et le poids pour évaluer une pierre.', array['Inclusion', 'Gemme', 'Carat']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'purete');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Imitation', 'imitation', 'mineralogie', 'Matière qui ressemble à une gemme sans en avoir la nature : verre, plastique ou autre minéral. À distinguer de la pierre synthétique, qui a la même composition que la gemme naturelle.', array['Synthétique', 'Gemmologie', 'Gemme']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'imitation');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Doublet', 'doublet', 'mineralogie', 'Pierre assemblée de deux parties collées l''une à l''autre, par exemple une fine tranche de gemme sur un support de verre.', array['Triplet', 'Imitation', 'Gemmologie']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'doublet');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Triplet', 'triplet', 'mineralogie', 'Pierre assemblée de trois parties collées : généralement une tranche de pierre naturelle, un support et une coiffe transparente.', array['Doublet', 'Imitation', 'Gemmologie']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'triplet');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Pierre de couleur', 'pierre-de-couleur', 'mineralogie', 'Gemme autre que le diamant, appréciée pour sa couleur : saphir, émeraude, rubis, tourmaline, grenat, topaze.', array['Gemme', 'Pierre précieuse', 'Pierre fine']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Saphir', 'Émeraude', 'Rubis']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'pierre-de-couleur');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Gemme organique', 'gemme-organique', 'mineralogie', 'Matière d''origine vivante utilisée en joaillerie : perle, corail, ambre, jais. Elle n''est pas un minéral, ou seulement en partie.', array['Gemme', 'Minéraloïde', 'Ambre']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'gemme-organique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Ambre', 'ambre', 'mineralogie', 'Résine fossile d''arbres, vieille de plusieurs dizaines de millions d''années, qui contient parfois des insectes. Ce n''est pas un minéral mais un minéraloïde.', array['Minéraloïde', 'Gemme organique', 'Fossile']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'ambre');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Huilage', 'huilage', 'mineralogie', 'Traitement qui remplit les fissures d''une gemme avec de l''huile pour les rendre moins visibles. Il est courant sur les émeraudes.', array['Traitement', 'Gemmologie', 'Inclusion']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Émeraude']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'huilage');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Comblement', 'comblement', 'mineralogie', 'Traitement qui remplit les fissures ou les cavités d''une gemme avec du verre ou une résine pour améliorer son aspect. Il doit être signalé à l''acheteur.', array['Traitement', 'Huilage', 'Gemmologie']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'comblement');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Irradiation', 'irradiation', 'mineralogie', 'Exposition d''une pierre à des rayonnements pour changer sa couleur. Elle existe dans la nature et se pratique aussi en laboratoire.', array['Traitement', 'Centre coloré', 'Photosensibilité']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Topaze', 'Quartz']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'irradiation');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Certificat gemmologique', 'certificat-gemmologique', 'mineralogie', 'Document établi par un laboratoire qui identifie une gemme, décrit ses caractéristiques et indique si elle a été traitée.', array['Gemmologie', 'Traitement', 'Carat']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'certificat-gemmologique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Provenance', 'provenance', 'mineralogie', 'Lieu d''où vient un spécimen, et par extension le parcours de la pièce depuis sa découverte. Elle est essentielle pour le collectionneur (la collectionneuse) et pour la documentation.', array['Localité type', 'Étiquette', 'Spécimen']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'provenance');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Pièce de cabinet', 'piece-de-cabinet', 'mineralogie', 'Spécimen de belle taille, esthétique, destiné à être montré dans une vitrine. Il se situe entre le format miniature et la grande pièce de musée.', array['Formats de collection', 'Spécimen', 'Micromonté']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'piece-de-cabinet');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Préparation', 'preparation', 'mineralogie', 'Travail qui dégage un cristal ou un spécimen de sa gangue ou nettoie sa surface, à l''outil, à l''air comprimé ou avec des produits adaptés. Elle demande de la patience et du soin.', array['Nettoyage', 'Gangue', 'Spécimen']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'preparation');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Réparation', 'reparation', 'mineralogie', 'Collage d''un cristal cassé ou recollage d''un fragment sur sa matrice avec une colle adaptée. Elle doit être invisible et signalée dans l''étiquette du spécimen.', array['Spécimen', 'Étiquette', 'Nettoyage']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'reparation');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Soclage', 'soclage', 'mineralogie', 'Fixation d''un spécimen sur un socle, en bois, en pierre ou en acrylique, pour le présenter sans l''abîmer.', array['Spécimen', 'Pièce de cabinet', 'Étiquette']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'soclage');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Numéro d''inventaire', 'numero-d-inventaire', 'mineralogie', 'Numéro unique attribué à chaque spécimen de collection, noté sur la pièce et dans le catalogue pour l''identifier et suivre son histoire.', array['Étiquette', 'Provenance', 'Spécimen']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'numero-d-inventaire');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Cabinet de minéralogie', 'cabinet-de-mineralogie', 'mineralogie', 'Collection de minéraux conservée dans un meuble ou une salle, à l''origine par des amateurs éclairés du XVIIIᵉ siècle, aujourd''hui dans les musées et les universités.', array['Spécimen', 'Pièce de cabinet']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'cabinet-de-mineralogie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Conservation des minéraux', 'conservation-des-mineraux', 'mineralogie', 'Ensemble des précautions qui préservent les spécimens : éviter la lumière directe, l''humidité, la chaleur et les chocs, et isoler les minéraux fragiles ou instables.', array['Photosensibilité', 'Maladie de la pyrite', 'Hygroscopique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'conservation-des-mineraux');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Minéral toxique', 'mineral-toxique', 'mineralogie', 'Minéral qui contient un élément dangereux (arsenic, plomb, mercure, amiante…). Il se manipule avec précaution, on se lave les mains après et on ne le met jamais en bouche.', array['Amiante', 'Radioactivité', 'Conservation des minéraux']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'mineral-toxique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Géologie', 'geologie', 'geologie', 'Science qui étudie la Terre : sa structure, ses roches, son histoire et les phénomènes qui la transforment.', array['Roche', 'Minéral', 'Tectonique des plaques', 'Échelle des temps géologiques']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'geologie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Pétrologie', 'petrologie', 'geologie', 'Étude des roches : leur composition, leur texture, leur origine et leur évolution.', array['Roche', 'Roche magmatique', 'Roche sédimentaire', 'Roche métamorphique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'petrologie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Géochimie', 'geochimie', 'geologie', 'Étude de la répartition et du comportement des éléments chimiques dans la Terre, les roches et les minéraux.', array['Élément chimique', 'Élément trace', 'Isotope']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'geochimie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Paléontologie', 'paleontologie', 'geologie', 'Science qui étudie les êtres vivants du passé à travers leurs fossiles.', array['Fossile', 'Fossilisation', 'Échelle des temps géologiques']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'paleontologie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Stratigraphie', 'stratigraphie', 'geologie', 'Étude de la succession des couches de roches et de leur âge, qui permet de reconstituer l''histoire d''une région.', array['Strate', 'Fossile stratigraphique', 'Échelle des temps géologiques']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'stratigraphie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Tectonique', 'tectonique', 'geologie', 'Étude des déformations de la croûte terrestre : plis, failles, chaînes de montagnes.', array['Tectonique des plaques', 'Faille', 'Pli']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'tectonique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Volcanologie', 'volcanologie', 'geologie', 'Étude des volcans, des éruptions et des roches volcaniques.', array['Volcanisme', 'Lave', 'Roche volcanique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'volcanologie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Sédimentologie', 'sedimentologie', 'geologie', 'Étude des sédiments et des roches sédimentaires : leur origine, leur transport, leur dépôt.', array['Sédiment', 'Sédimentation', 'Roche sédimentaire']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'sedimentologie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Gîtologie', 'gitologie', 'geologie', 'Étude des gisements de minéraux utiles : leur formation, leur forme, leur répartition et les moyens de les trouver.', array['Gisement', 'Gîte', 'Minerai']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'gitologie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Métallogénie', 'metallogenie', 'geologie', 'Étude de l''origine des gisements de métaux et des conditions géologiques qui les ont concentrés.', array['Gîtologie', 'Gisement', 'Minerai']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'metallogenie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Géophysique', 'geophysique', 'geologie', 'Étude de la Terre par des mesures physiques : ondes sismiques, gravité, magnétisme, chaleur.', array['Sismologie', 'Lithosphère', 'Noyau terrestre']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'geophysique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Sismologie', 'sismologie', 'geologie', 'Étude des séismes et de la propagation des ondes qu''ils produisent dans la Terre. Elle a révélé la structure interne du globe.', array['Séisme', 'Faille', 'Géophysique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'sismologie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Géomorphologie', 'geomorphologie', 'geologie', 'Étude des formes du relief et des processus qui les façonnent : érosion, glaciers, rivières, volcans.', array['Érosion', 'Karst', 'Moraine']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'geomorphologie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Hydrogéologie', 'hydrogeologie', 'geologie', 'Étude des eaux souterraines : leur circulation dans les roches et leur rôle dans la formation de certains minéraux.', array['Karst', 'Source thermale', 'Spéléothème']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'hydrogeologie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Géologie structurale', 'geologie-structurale', 'geologie', 'Étude de la forme et de la déformation des corps de roche : plis, failles, joints, schistosité.', array['Tectonique', 'Pli', 'Faille']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'geologie-structurale');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Carte géologique', 'carte-geologique', 'geologie', 'Carte qui montre la nature et l''âge des roches qui affleurent à la surface du sol. En France, elle est éditée par le BRGM, au 1/50 000.', array['Affleurement', 'Coupe géologique', 'Roche']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'carte-geologique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Coupe géologique', 'coupe-geologique', 'geologie', 'Dessin qui montre la succession des couches de roches en profondeur le long d''une ligne, comme une tranche du sous-sol.', array['Carte géologique', 'Strate', 'Pendage']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'coupe-geologique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Marteau de géologue', 'marteau-de-geologue', 'geologie', 'Marteau à tête plate d''un côté et pointue ou en burin de l''autre, outil de base pour détacher des échantillons de roche.', array['Massette', 'Burin', 'Échantillon']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'marteau-de-geologue');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Échantillon', 'echantillon', 'geologie', 'Morceau de roche ou de minéral prélevé pour être étudié, analysé ou conservé.', array['Spécimen', 'Marteau de géologue', 'Étiquette']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'echantillon');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Carotte', 'carotte', 'geologie', 'Cylindre de roche extrait du sous-sol par un forage, qui permet d''étudier les couches traversées.', array['Sondage', 'Strate', 'Gisement']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'carotte');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Sondage', 'sondage', 'geologie', 'Forage destiné à reconnaître le sous-sol, à rechercher un gisement ou à prélever des échantillons.', array['Carotte', 'Prospection', 'Gisement']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'sondage');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Lithosphère', 'lithosphere', 'geologie', 'Enveloppe rigide de la Terre, formée de la croûte et de la partie supérieure du manteau, découpée en plaques qui se déplacent.', array['Croûte continentale', 'Croûte océanique', 'Tectonique des plaques', 'Asthénosphère']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'lithosphere');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Asthénosphère', 'asthenosphere', 'geologie', 'Couche du manteau située sous la lithosphère, assez ductile pour s''écouler très lentement. Les plaques glissent dessus.', array['Lithosphère', 'Manteau', 'Tectonique des plaques']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'asthenosphere');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Noyau terrestre', 'noyau-terrestre', 'geologie', 'Partie centrale de la Terre, faite surtout de fer et de nickel, avec une partie externe liquide et une graine interne solide.', array['Manteau', 'Croûte continentale', 'Géophysique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'noyau-terrestre');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Croûte continentale', 'croute-continentale', 'geologie', 'Partie superficielle des continents, épaisse en moyenne de 30 à 40 kilomètres, faite surtout de roches granitiques et métamorphiques.', array['Croûte océanique', 'Lithosphère', 'Granite']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'croute-continentale');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Croûte océanique', 'croute-oceanique', 'geologie', 'Partie superficielle du fond des océans, épaisse de 6 à 7 kilomètres, faite surtout de basalte et de gabbro. Elle est plus dense et plus jeune que la croûte continentale.', array['Croûte continentale', 'Basalte', 'Gabbro', 'Dorsale océanique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'croute-oceanique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Discontinuité de Mohorovičić', 'discontinuite-de-mohorovicic', 'geologie', 'Limite entre la croûte et le manteau, repérée par un changement brutal de vitesse des ondes sismiques. On l''appelle aussi Moho.', array['Croûte continentale', 'Manteau', 'Sismologie']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'discontinuite-de-mohorovicic');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Gradient géothermique', 'gradient-geothermique', 'geologie', 'Augmentation de la température avec la profondeur, de 25 à 30 °C par kilomètre en moyenne dans la croûte.', array['Hydrothermal', 'Métamorphisme', 'Magma']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'gradient-geothermique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Plaque lithosphérique', 'plaque-lithospherique', 'geologie', 'Grand morceau rigide de lithosphère qui se déplace de quelques centimètres par an. Une quinzaine de plaques recouvrent le globe.', array['Tectonique des plaques', 'Lithosphère', 'Subduction']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'plaque-lithospherique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Dorsale océanique', 'dorsale-oceanique', 'geologie', 'Chaîne volcanique sous-marine où deux plaques s''écartent et où naît de la croûte océanique nouvelle.', array['Croûte océanique', 'Tectonique des plaques', 'Rift']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'dorsale-oceanique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Fosse océanique', 'fosse-oceanique', 'geologie', 'Dépression très profonde du fond de l''océan, qui marque l''endroit où une plaque plonge sous une autre.', array['Subduction', 'Plaque lithosphérique', 'Tectonique des plaques']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'fosse-oceanique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Point chaud', 'point-chaud', 'geologie', 'Remontée localisée de matière très chaude du manteau, qui perce la lithosphère et forme une chaîne de volcans : Hawaï, La Réunion.', array['Manteau', 'Volcanisme', 'Basalte']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'point-chaud');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Rift', 'rift', 'geologie', 'Zone où la croûte continentale se fend et s''étire, formant un fossé bordé de failles. Si elle s''élargit, elle peut donner naissance à un océan.', array['Fossé d''effondrement', 'Graben', 'Faille']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'rift');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Craton', 'craton', 'geologie', 'Partie très ancienne et stable d''un continent, formée de roches de plus de 2 milliards d''années, qui n''a presque pas été déformée depuis.', array['Socle', 'Croûte continentale', 'Précambrien']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'craton');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Socle', 'socle', 'geologie', 'Ensemble de roches anciennes, souvent cristallines et métamorphiques, qui forment la base d''une région et sur lesquelles reposent les roches plus récentes.', array['Couverture sédimentaire', 'Granite', 'Gneiss']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'socle');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Socle hercynien', 'socle-hercynien', 'geologie', 'Roches du socle formées lors de l''orogenèse hercynienne, il y a plus de 300 millions d''années. On les trouve dans le Massif central, les Vosges, la Bretagne.', array['Orogenèse hercynienne', 'Massif central', 'Socle']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'socle-hercynien');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Couverture sédimentaire', 'couverture-sedimentaire', 'geologie', 'Ensemble de couches sédimentaires déposées sur le socle. Elle est épaisse dans les bassins, absente ou mince ailleurs.', array['Socle', 'Bassin sédimentaire', 'Strate']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'couverture-sedimentaire');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Bassin sédimentaire', 'bassin-sedimentaire', 'geologie', 'Vaste dépression qui s''est enfoncée lentement et s''est remplie de sédiments sur des millions d''années. Le Bassin parisien et le Bassin aquitain en sont deux exemples.', array['Couverture sédimentaire', 'Sédiment', 'Roche sédimentaire']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'bassin-sedimentaire');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Fossé d''effondrement', 'fosse-d-effondrement', 'geologie', 'Zone où le sol s''est affaissé entre deux failles. La Limagne et le fossé rhénan en sont deux exemples.', array['Graben', 'Horst', 'Faille']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'fosse-d-effondrement');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Horst', 'horst', 'geologie', 'Bloc de la croûte surélevé entre deux failles, par rapport aux blocs voisins qui se sont affaissés.', array['Graben', 'Fossé d''effondrement', 'Faille']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'horst');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Graben', 'graben', 'geologie', 'Bloc de la croûte affaissé entre deux failles, qui forme un fossé. La Limagne est un graben.', array['Horst', 'Fossé d''effondrement', 'Rift']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'graben');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Marge continentale', 'marge-continentale', 'geologie', 'Bordure d''un continent qui plonge sous la mer, de la plateforme côtière jusqu''aux grands fonds.', array['Croûte continentale', 'Croûte océanique', 'Bassin sédimentaire']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'marge-continentale');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Orogenèse alpine', 'orogenese-alpine', 'geologie', 'Formation des Alpes et des chaînes voisines, par la convergence entre l''Afrique, l''Italie et l''Europe, commencée il y a environ 100 millions d''années, avec des déformations majeures il y a 50 à 20 millions d''années environ.', array['Orogenèse', 'Fente alpine', 'Subduction']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Quartz']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'orogenese-alpine');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Orogenèse pyrénéenne', 'orogenese-pyreneenne', 'geologie', 'Formation des Pyrénées par la collision entre la plaque ibérique et la plaque européenne, il y a environ 70 à 30 millions d''années.', array['Orogenèse', 'Tectonique des plaques', 'Chevauchement']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'orogenese-pyreneenne');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Massif armoricain', 'massif-armoricain', 'geologie', 'Ancien massif de roches cristallines et de schistes qui forme la Bretagne, le Cotentin et l''ouest de la Normandie, issu des orogenèses cadomienne et hercynienne.', array['Socle hercynien', 'Orogenèse hercynienne', 'Granite']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'massif-armoricain');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Massif vosgien', 'massif-vosgien', 'geologie', 'Massif ancien du nord-est de la France, fait de granites et de gneiss de la chaîne hercynienne, bordé à l''est par le fossé rhénan.', array['Socle hercynien', 'Orogenèse hercynienne', 'Granite']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'massif-vosgien');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Bassin parisien', 'bassin-parisien', 'geologie', 'Grand bassin sédimentaire du nord de la France, rempli de couches de calcaire, d''argile et de sable déposées sur plus de 250 millions d''années.', array['Bassin sédimentaire', 'Couverture sédimentaire', 'Calcaire']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'bassin-parisien');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Bassin aquitain', 'bassin-aquitain', 'geologie', 'Grand bassin sédimentaire du sud-ouest de la France, entre le Massif central et les Pyrénées.', array['Bassin sédimentaire', 'Couverture sédimentaire', 'Calcaire']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'bassin-aquitain');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Chaîne des Puys', 'chaine-des-puys', 'geologie', 'Alignement d''environ quatre-vingts volcans récents en Auvergne, actifs entre 95 000 et 7 000 ans environ, le long de la faille de Limagne. Le puy de Dôme en est le plus connu.', array['Volcanisme', 'Massif central', 'Faille de Limagne']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'chaine-des-puys');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Limagne', 'limagne', 'geologie', 'Plaine d''Auvergne installée dans un fossé d''effondrement formé à l''Oligocène, rempli de sédiments, et bordée à l''ouest par la faille de Limagne.', array['Fossé d''effondrement', 'Graben', 'Oligocène']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'limagne');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Faille de Limagne', 'faille-de-limagne', 'geologie', 'Grande faille qui borde à l''ouest le fossé de la Limagne en Auvergne. Des filons de baryte s''alignent le long de cette faille.', array['Limagne', 'Faille', 'Filon']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Baryte']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'faille-de-limagne');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Rift ouest-européen', 'rift-ouest-europeen', 'geologie', 'Ensemble de fossés d''effondrement formés à l''Oligocène en Europe de l''Ouest, de la Limagne et la Bresse au fossé rhénan.', array['Rift', 'Fossé d''effondrement', 'Limagne']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'rift-ouest-europeen');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Faille normale', 'faille-normale', 'geologie', 'Faille où un bloc glisse vers le bas par rapport à l''autre, sous l''effet d''un étirement de la croûte.', array['Faille', 'Faille inverse', 'Graben']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'faille-normale');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Faille inverse', 'faille-inverse', 'geologie', 'Faille où un bloc est poussé vers le haut par rapport à l''autre, sous l''effet d''une compression de la croûte.', array['Faille', 'Faille normale', 'Chevauchement']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'faille-inverse');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Décrochement', 'decrochement', 'geologie', 'Faille où les deux blocs glissent horizontalement l''un par rapport à l''autre, comme la faille de San Andreas.', array['Faille', 'Faille normale', 'Faille inverse']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'decrochement');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Chevauchement', 'chevauchement', 'geologie', 'Faille inverse peu inclinée, le long de laquelle un ensemble de roches est poussé sur d''autres.', array['Nappe de charriage', 'Faille inverse', 'Orogenèse']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'chevauchement');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Nappe de charriage', 'nappe-de-charriage', 'geologie', 'Grande masse de roches déplacée sur des dizaines de kilomètres par un chevauchement, qui repose sur des terrains plus jeunes.', array['Chevauchement', 'Orogenèse', 'Pli']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'nappe-de-charriage');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Discordance', 'discordance', 'geologie', 'Surface qui sépare deux ensembles de couches d''orientations différentes : des couches ont été plissées et érodées avant qu''on dépose les autres.', array['Strate', 'Érosion', 'Stratigraphie']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'discordance');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Anticlinal', 'anticlinal', 'geologie', 'Pli en forme de voûte, dont les couches les plus anciennes se trouvent au cœur.', array['Synclinal', 'Pli', 'Strate']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'anticlinal');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Synclinal', 'synclinal', 'geologie', 'Pli en forme de cuvette, dont les couches les plus récentes se trouvent au cœur.', array['Anticlinal', 'Pli', 'Strate']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'synclinal');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Plissement', 'plissement', 'geologie', 'Déformation des couches de roche qui se courbent sans se rompre, sous l''effet d''une compression lente.', array['Pli', 'Anticlinal', 'Synclinal', 'Orogenèse']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'plissement');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Déformation ductile', 'deformation-ductile', 'geologie', 'Déformation d''une roche qui s''étire ou se plisse sans se rompre, en profondeur où il fait chaud et où la pression est forte.', array['Déformation cassante', 'Pli', 'Métamorphisme']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'deformation-ductile');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Déformation cassante', 'deformation-cassante', 'geologie', 'Déformation d''une roche qui se casse en formant des failles ou des diaclases, près de la surface où elle est plus froide.', array['Déformation ductile', 'Faille', 'Diaclase']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'deformation-cassante');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Fracture', 'fracture', 'geologie', 'Cassure d''une roche, avec ou sans déplacement des deux côtés. Elle est appelée faille quand les blocs ont glissé et diaclase quand ils ne bougent pas.', array['Faille', 'Diaclase', 'Filon']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'fracture');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Schistosité', 'schistosite', 'geologie', 'Aptitude d''une roche à se débiter en feuillets, due à l''alignement de minéraux plats comme les micas sous l''effet d''une forte pression.', array['Schiste', 'Foliation', 'Métamorphisme']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'schistosite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Foliation', 'foliation', 'geologie', 'Structure en feuillets ou en bandes d''une roche métamorphique, due à l''alignement des minéraux. Le gneiss est foliacé.', array['Schistosité', 'Gneiss', 'Métamorphisme']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'foliation');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Mylonite', 'mylonite', 'geologie', 'Roche très finement broyée et étirée le long d''une faille profonde, de grain fin et souvent rubanée.', array['Faille', 'Déformation ductile', 'Métamorphisme']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'mylonite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Brèche tectonique', 'breche-tectonique', 'geologie', 'Brèche formée par le broyage des roches le long d''une faille. Ses fragments anguleux sont ensuite cimentés par des minéraux qui circulent dans la faille.', array['Brèche', 'Faille', 'Filon']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'breche-tectonique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Miroir de faille', 'miroir-de-faille', 'geologie', 'Surface lisse, brillante et striée, polie par le frottement des deux blocs le long d''une faille. Elle est souvent couverte d''un film de quartz, de calcite ou de chlorite.', array['Faille', 'Stries', 'Fracture']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Quartz', 'Calcite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'miroir-de-faille');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Séisme', 'seisme', 'geologie', 'Secousse du sol provoquée par une rupture brutale le long d''une faille, qui libère de l''énergie sous forme d''ondes.', array['Faille', 'Sismologie', 'Tectonique des plaques']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'seisme');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Intrusion', 'intrusion', 'geologie', 'Masse de magma qui s''est introduite dans des roches existantes et qui s''y est refroidie lentement, formant une roche à gros grains.', array['Pluton', 'Batholite', 'Roche plutonique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'intrusion');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Extrusion', 'extrusion', 'geologie', 'Montée du magma jusqu''à la surface, où il se répand et se refroidit rapidement pour former des roches volcaniques.', array['Lave', 'Roche volcanique', 'Intrusion']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'extrusion');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Pluton', 'pluton', 'geologie', 'Masse de roche magmatique cristallisée en profondeur, de forme arrondie ou allongée, comme un massif de granite.', array['Batholite', 'Intrusion', 'Roche plutonique']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Quartz']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'pluton');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Batholite', 'batholite', 'geologie', 'Très grand massif de roche plutonique, comme le granite, cristallisé en profondeur et qui peut s''étendre sur des centaines de kilomètres.', array['Pluton', 'Granite', 'Intrusion']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'batholite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Dyke', 'dyke', 'geologie', 'Lame de roche magmatique qui recoupe les couches ou les roches encaissantes en profondeur. On dit aussi filon.', array['Filon', 'Sill', 'Intrusion']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'dyke');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Sill', 'sill', 'geologie', 'Lame de roche magmatique injectée parallèlement aux couches de roche encaissantes, entre deux strates. On dit aussi filon-couche.', array['Dyke', 'Intrusion', 'Strate']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'sill');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Laccolite', 'laccolite', 'geologie', 'Masse de magma injectée entre des couches qui se bombent au-dessus d''elle, donnant une intrusion en forme de lentille.', array['Intrusion', 'Sill', 'Pluton']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'laccolite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Chambre magmatique', 'chambre-magmatique', 'geologie', 'Réservoir de magma situé dans la croûte, sous un volcan ou une intrusion, où le magma s''accumule et cristallise en partie.', array['Magma', 'Volcanisme', 'Cristallisation fractionnée']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'chambre-magmatique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Cristallisation fractionnée', 'cristallisation-fractionnee', 'geologie', 'Processus au cours duquel les minéraux se forment dans un magma qui refroidit et se séparent du liquide restant, qui change alors de composition.', array['Magma', 'Différenciation magmatique', 'Chambre magmatique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'cristallisation-fractionnee');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Différenciation magmatique', 'differenciation-magmatique', 'geologie', 'Ensemble des processus qui produisent, à partir d''un magma initial, des roches de compositions variées.', array['Cristallisation fractionnée', 'Magma', 'Roche magmatique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'differenciation-magmatique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Fusion partielle', 'fusion-partielle', 'geologie', 'Fusion d''une partie seulement d''une roche, des minéraux les plus fusibles, qui donne un magma de composition différente de la roche d''origine.', array['Magma', 'Manteau', 'Roche magmatique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'fusion-partielle');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Phénocristal', 'phenocristal', 'geologie', 'Gros cristal visible à l''œil nu dans une roche volcanique ou filonienne à grain fin, formé avant le refroidissement final du magma.', array['Texture porphyrique', 'Porphyre', 'Microlite']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'phenocristal');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Microlite', 'microlite', 'geologie', 'Petit cristal aciculaire ou en bâtonnet, visible seulement au microscope, qui forme la pâte de nombreuses roches volcaniques.', array['Phénocristal', 'Texture microlitique', 'Roche volcanique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'microlite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Texture grenue', 'texture-grenue', 'geologie', 'Texture d''une roche formée de cristaux visibles à l''œil nu, serrés les uns contre les autres. Elle caractérise les roches plutoniques comme le granite.', array['Roche plutonique', 'Granite', 'Texture porphyrique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'texture-grenue');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Texture microlitique', 'texture-microlitique', 'geologie', 'Texture d''une roche volcanique dont la pâte est faite de microlites, avec parfois quelques phénocristaux plus gros.', array['Microlite', 'Roche volcanique', 'Texture porphyrique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'texture-microlitique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Texture porphyrique', 'texture-porphyrique', 'geologie', 'Texture d''une roche qui contient de gros cristaux dans une pâte à grain fin, signe d''un refroidissement en deux temps.', array['Porphyre', 'Phénocristal', 'Texture grenue']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'texture-porphyrique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Porphyre', 'porphyre', 'geologie', 'Roche à texture porphyrique : de gros cristaux, comme les feldspaths ou le quartz, noyés dans une pâte à grain fin.', array['Texture porphyrique', 'Phénocristal', 'Filon']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'porphyre');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Vésicule', 'vesicule', 'geologie', 'Bulle de gaz figée dans une lave solidifiée, qui laisse une cavité arrondie. La ponce et les scories en sont pleines.', array['Amygdale', 'Lave', 'Ponce']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'vesicule');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Amygdale', 'amygdale', 'geologie', 'Vésicule d''une roche volcanique remplie ensuite par des minéraux, comme la calcédoine, le quartz, les zéolites ou la calcite. Les agates se forment souvent ainsi.', array['Vésicule', 'Géode', 'Zéolite']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Agate', 'Calcédoine', 'Quartz']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'amygdale');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Roche acide', 'roche-acide', 'geologie', 'Roche magmatique riche en silice, à plus de 65 %, claire en général : granite, rhyolite.', array['Roche basique', 'Granite', 'Silice']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'roche-acide');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Roche intermédiaire', 'roche-intermediaire', 'geologie', 'Roche magmatique à teneur moyenne en silice, entre 52 et 65 %, comme la diorite et l''andésite.', array['Roche acide', 'Roche basique', 'Diorite']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'roche-intermediaire');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Roche basique', 'roche-basique', 'geologie', 'Roche magmatique pauvre en silice, de 45 à 52 %, sombre en général, riche en fer et en magnésium : basalte, gabbro.', array['Roche acide', 'Roche ultrabasique', 'Basalte']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'roche-basique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Roche ultrabasique', 'roche-ultrabasique', 'geologie', 'Roche magmatique très pauvre en silice, à moins de 45 %, presque entièrement faite de minéraux sombres : péridotite, dunite.', array['Roche basique', 'Péridotite', 'Manteau']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'roche-ultrabasique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Rhyolite', 'rhyolite', 'geologie', 'Roche volcanique claire, riche en silice, équivalent volcanique du granite, au grain très fin.', array['Granite', 'Roche acide', 'Roche volcanique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'rhyolite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Dacite', 'dacite', 'geologie', 'Roche volcanique de composition intermédiaire entre l''andésite et la rhyolite, grise à rosée, fréquente dans les volcans de zones de subduction.', array['Andésite', 'Rhyolite', 'Roche volcanique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'dacite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Andésite', 'andesite', 'geologie', 'Roche volcanique grise de composition intermédiaire, typique des volcans de zones de subduction. Son nom vient des Andes.', array['Roche intermédiaire', 'Roche volcanique', 'Subduction']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'andesite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Trachyte', 'trachyte', 'geologie', 'Roche volcanique claire, riche en feldspath alcalin, à grain fin et au toucher rugueux. Le puy de Dôme est un dôme de trachyte.', array['Roche volcanique', 'Feldspath', 'Phonolite']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'trachyte');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Phonolite', 'phonolite', 'geologie', 'Roche volcanique claire, riche en feldspath alcalin et en feldspathoïdes, qui résonne comme une cloche quand on la frappe, d''où son nom.', array['Trachyte', 'Roche volcanique', 'Feldspath']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'phonolite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Dolérite', 'dolerite', 'geologie', 'Roche magmatique sombre, au grain fin à moyen, de même composition que le basalte et le gabbro. On la trouve souvent en filons ou en sills.', array['Basalte', 'Gabbro', 'Dyke']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'dolerite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Diorite', 'diorite', 'geologie', 'Roche plutonique à grain grossier, de composition intermédiaire, faite surtout de plagioclase et d''amphibole.', array['Granite', 'Gabbro', 'Roche intermédiaire']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'diorite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Granodiorite', 'granodiorite', 'geologie', 'Roche plutonique proche du granite mais plus riche en plagioclase que de feldspath potassique, qui forme une grande part des batholites.', array['Granite', 'Diorite', 'Batholite']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'granodiorite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Microgranite', 'microgranite', 'geologie', 'Roche de même composition que le granite mais à grain plus fin, qui s''est refroidie plus rapidement, près de la surface ou en filon.', array['Granite', 'Texture grenue', 'Porphyre']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'microgranite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Aplite', 'aplite', 'geologie', 'Roche filonienne claire, à grain fin et sucré, de composition proche du granite, souvent associée à la pegmatite.', array['Granite', 'Pegmatite', 'Filon']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'aplite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Obsidienne', 'obsidienne', 'geologie', 'Verre volcanique noir ou brun, issu d''une lave riche en silice refroidie très vite, sans cristaux. Elle se casse en surfaces conchoïdales aux bords coupants.', array['Roche volcanique', 'Cassure conchoïdale', 'Minéraloïde']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'obsidienne');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Ponce', 'ponce', 'geologie', 'Roche volcanique très légère et pleine de bulles, qui flotte sur l''eau, faite de verre riche en silice projeté et refroidi brusquement.', array['Vésicule', 'Roche volcanique', 'Pyroclastite']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'ponce');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Scorie', 'scorie', 'geologie', 'Fragment de lave sombre, rugueux et criblé de bulles, projeté lors d''une éruption. Les cônes de scories de la Chaîne des Puys en sont faits.', array['Vésicule', 'Lave', 'Chaîne des Puys']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'scorie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Téphra', 'tephra', 'geologie', 'Ensemble des fragments de roche projetés dans l''air lors d''une éruption : cendres, lapilli, bombes.', array['Pyroclastite', 'Cendre volcanique', 'Lapilli']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'tephra');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Pyroclastite', 'pyroclastite', 'geologie', 'Roche formée de fragments de lave projetés et déposés par une éruption, comme les tufs et les ignimbrites.', array['Téphra', 'Tuf volcanique', 'Ignimbrite']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'pyroclastite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Cendre volcanique', 'cendre-volcanique', 'geologie', 'Fragments de lave de moins de 2 millimètres projetés par un volcan lors d''une éruption explosive.', array['Téphra', 'Lapilli', 'Éruption']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'cendre-volcanique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Lapilli', 'lapilli', 'geologie', 'Petits fragments de lave solidifiée, de 2 à 64 millimètres, projetés lors d''une éruption.', array['Téphra', 'Cendre volcanique', 'Pyroclastite']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'lapilli');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Bombe volcanique', 'bombe-volcanique', 'geologie', 'Fragment de lave encore pâteuse, de plus de 64 millimètres, projeté et solidifié dans l''air, qui prend souvent une forme en fuseau.', array['Téphra', 'Lapilli', 'Éruption']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'bombe-volcanique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Tuf volcanique', 'tuf-volcanique', 'geologie', 'Roche formée de cendres volcaniques déposées puis consolidées, tendre et souvent poreuse.', array['Pyroclastite', 'Cendre volcanique', 'Ignimbrite']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'tuf-volcanique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Ignimbrite', 'ignimbrite', 'geologie', 'Roche formée par le dépôt et la soudure de cendres et de fragments chauds d''une coulée pyroclastique.', array['Pyroclastite', 'Coulée pyroclastique', 'Tuf volcanique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'ignimbrite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Coulée pyroclastique', 'coulee-pyroclastique', 'geologie', 'Avalanche brûlante de gaz, de cendres et de fragments de roche qui dévale les pentes d''un volcan à grande vitesse.', array['Ignimbrite', 'Éruption', 'Cendre volcanique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'coulee-pyroclastique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Coulée de lave', 'coulee-de-lave', 'geologie', 'Écoulement de lave sur le sol, qui se refroidit et se fige en roche volcanique. Sa forme dépend de la composition de la lave.', array['Lave', 'Volcan', 'Basalte']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'coulee-de-lave');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Volcanisme', 'volcanisme', 'geologie', 'Ensemble des phénomènes liés à la montée du magma jusqu''à la surface : éruptions, coulées, projections de cendres et de gaz.', array['Magma', 'Lave', 'Volcan']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'volcanisme');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Volcan', 'volcan', 'geologie', 'Relief formé par l''accumulation de produits d''éruption autour d''une bouche par laquelle le magma remonte.', array['Volcanisme', 'Cratère', 'Cheminée volcanique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'volcan');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Stratovolcan', 'stratovolcan', 'geologie', 'Grand volcan conique formé par l''empilement de coulées de lave et de couches de cendres, comme le Vésuve ou le Fuji.', array['Volcan', 'Pyroclastite', 'Éruption']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'stratovolcan');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Volcan bouclier', 'volcan-bouclier', 'geologie', 'Volcan très large aux pentes douces, formé de coulées de lave très fluides, comme ceux d''Hawaï ou le piton de la Fournaise.', array['Volcan', 'Basalte', 'Point chaud']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'volcan-bouclier');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Cheminée volcanique', 'cheminee-volcanique', 'geologie', 'Conduit par lequel le magma, les gaz et les cendres remontent jusqu''à la bouche d''un volcan.', array['Volcan', 'Cratère', 'Chambre magmatique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'cheminee-volcanique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Cratère', 'cratere', 'geologie', 'Dépression en forme d''entonnoir, au sommet ou sur les flancs d''un volcan, par laquelle sortent les produits d''éruption.', array['Volcan', 'Cheminée volcanique', 'Caldeira']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'cratere');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Caldeira', 'caldeira', 'geologie', 'Vaste dépression circulaire formée par l''effondrement d''un volcan vidé de son magma, bien plus large qu''un cratère.', array['Cratère', 'Volcan', 'Chambre magmatique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'caldeira');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Maar', 'maar', 'geologie', 'Cratère large et peu profond, souvent occupé par un lac, creusé par une explosion due au contact entre magma et eau souterraine.', array['Cratère', 'Volcan', 'Éruption']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'maar');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Dôme volcanique', 'dome-volcanique', 'geologie', 'Relief bombé formé par une lave très visqueuse qui s''accumule au-dessus de la bouche sans pouvoir s''écouler. Le puy de Dôme en est un.', array['Trachyte', 'Lave', 'Chaîne des Puys']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'dome-volcanique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Éruption', 'eruption', 'geologie', 'Sortie de lave, de gaz et de fragments de roche par un volcan. Elle est dite effusive quand la lave coule et explosive quand elle est projetée.', array['Volcan', 'Lave', 'Téphra']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'eruption');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Solfatare', 'solfatare', 'geologie', 'Émission de gaz soufrés chauds par un volcan peu actif, qui dépose du soufre et des sulfates sur les roches.', array['Fumerolle', 'Volcanisme', 'Sulfure']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Soufre']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'solfatare');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Geyser', 'geyser', 'geologie', 'Source d''eau chaude qui jaillit par intermittence, chauffée par une roche volcanique en profondeur.', array['Source thermale', 'Hydrothermal', 'Volcanisme']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'geyser');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Source thermale', 'source-thermale', 'geologie', 'Source dont l''eau sort plus chaude que l''air ambiant, réchauffée en profondeur par la chaleur de la Terre. Elle dépose souvent des minéraux.', array['Hydrothermal', 'Source minérale', 'Travertin']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'source-thermale');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Source minérale', 'source-minerale', 'geologie', 'Source dont l''eau est chargée en sels minéraux dissous, comme le calcium, le magnésium ou le sodium.', array['Source thermale', 'Dissolution', 'Hydrothermal']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'source-minerale');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Fumeur noir', 'fumeur-noir', 'geologie', 'Cheminée hydrothermale sous-marine qui rejette de l''eau très chaude et noire, chargée de sulfures de fer, de cuivre et de zinc, qui précipitent en se refroidissant.', array['Hydrothermal', 'Dorsale océanique', 'Sulfure']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Pyrite', 'Chalcopyrite', 'Sphalérite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'fumeur-noir');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Fluide hydrothermal', 'fluide-hydrothermal', 'geologie', 'Eau chaude, riche en éléments dissous, qui circule dans les fractures de la croûte et qui dépose des minéraux dans les filons.', array['Hydrothermal', 'Filon', 'Altération hydrothermale']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'fluide-hydrothermal');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Altération hydrothermale', 'alteration-hydrothermale', 'geologie', 'Transformation d''une roche par un fluide chaud qui la traverse. Elle change ses minéraux et dépose des minéraux nouveaux.', array['Hydrothermal', 'Fluide hydrothermal', 'Métasomatisme']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'alteration-hydrothermale');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Silicification', 'silicification', 'geologie', 'Remplacement ou enrobage d''une roche, d''un fossile ou d''un bois par de la silice. Elle donne le bois pétrifié et certaines brèches.', array['Silice', 'Pétrification', 'Bois pétrifié']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Quartz', 'Calcédoine']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'silicification');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Sédiment', 'sediment', 'geologie', 'Matière détachée d''une roche par l''érosion, transportée puis déposée par l''eau, le vent ou la glace : sable, argile, galets, boue.', array['Sédimentation', 'Roche sédimentaire', 'Érosion']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'sediment');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Sédimentation', 'sedimentation', 'geologie', 'Dépôt de sédiments, couche après couche, par l''eau, le vent ou la glace, ou par précipitation et accumulation de matière.', array['Sédiment', 'Strate', 'Diagenèse']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'sedimentation');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Compaction', 'compaction', 'geologie', 'Tassement des sédiments sous le poids des couches qui s''empilent au-dessus d''eux, qui chasse l''eau et réduit le volume.', array['Diagenèse', 'Lithification', 'Sédiment']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'compaction');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Cimentation', 'cimentation', 'geologie', 'Dépôt de minéraux entre les grains d''un sédiment, qui les soude et le transforme en roche. Le calcaire, la silice et l''oxyde de fer sont des ciments courants.', array['Lithification', 'Diagenèse', 'Grès']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'cimentation');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Lithification', 'lithification', 'geologie', 'Transformation d''un sédiment meuble en roche dure, par compaction et cimentation.', array['Compaction', 'Cimentation', 'Diagenèse']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'lithification');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Précipitation', 'precipitation', 'geologie', 'Dépôt d''une substance solide à partir d''une solution devenue trop concentrée ou dont les conditions ont changé. Elle forme beaucoup de minéraux.', array['Dissolution', 'Cristallisation', 'Évaporite']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'precipitation');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Dissolution', 'dissolution', 'geologie', 'Passage d''un minéral en solution dans l''eau. Elle creuse le calcaire, les gypses et le sel, et alimente la formation de nouveaux minéraux ailleurs.', array['Précipitation', 'Karst', 'Solubilité']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'dissolution');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Recristallisation', 'recristallisation', 'geologie', 'Transformation d''un minéral en cristaux plus gros ou mieux formés, sous l''effet de la chaleur, de la pression ou d''un fluide, sans changer de composition.', array['Métamorphisme', 'Cristallisation', 'Marbre']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'recristallisation');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Lessivage', 'lessivage', 'geologie', 'Entraînement d''éléments dissous par l''eau qui traverse une roche ou un sol, qui s''appauvrit en certains éléments et s''enrichit en d''autres.', array['Dissolution', 'Latérite', 'Altération']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'lessivage');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Stratification', 'stratification', 'geologie', 'Disposition en couches parallèles des roches sédimentaires, qui correspond aux dépôts successifs.', array['Strate', 'Sédimentation', 'Stratigraphie']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'stratification');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Strate', 'strate', 'geologie', 'Couche de roche sédimentaire déposée en une seule fois, délimitée par deux surfaces. On dit aussi banc ou couche.', array['Stratification', 'Stratigraphie', 'Roche sédimentaire']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'strate');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Banc', 'banc', 'geologie', 'Couche épaisse et homogène de roche sédimentaire, séparée de la suivante par un joint.', array['Strate', 'Stratification', 'Calcaire']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'banc');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Brèche', 'breche', 'geologie', 'Roche formée de fragments anguleux cimentés ensemble, dont l''angularité montre qu''ils n''ont pas beaucoup voyagé.', array['Conglomérat', 'Brèche tectonique', 'Roche sédimentaire']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'breche');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Conglomérat', 'conglomerat', 'geologie', 'Roche formée de galets arrondis cimentés, dont la forme indique qu''ils ont été roulés par l''eau.', array['Brèche', 'Galet', 'Roche sédimentaire']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'conglomerat');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Arkose', 'arkose', 'geologie', 'Grès riche en feldspath, issu de la destruction rapide d''un granite. Sa couleur est souvent rosée ou ocre.', array['Grès', 'Feldspath', 'Granite']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Feldspath']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'arkose');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Grauwacke', 'grauwacke', 'geologie', 'Grès sombre, mal trié, riche en fragments de roches et en argile, déposé rapidement en mer profonde.', array['Grès', 'Roche sédimentaire', 'Argile']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'grauwacke');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Argilite', 'argilite', 'geologie', 'Roche sédimentaire à grain très fin, formée d''argile consolidée, qui ne se délite pas en feuillets.', array['Argile', 'Roche sédimentaire', 'Schiste']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'argilite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Marne', 'marne', 'geologie', 'Roche sédimentaire faite d''un mélange d''argile et de calcaire, tendre et souvent grise ou beige.', array['Calcaire', 'Argile', 'Roche sédimentaire']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'marne');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Dolomie', 'dolomie', 'geologie', 'Roche carbonatée faite surtout du minéral dolomite, de composition proche du calcaire mais plus riche en magnésium.', array['Calcaire', 'Carbonate', 'Roche carbonatée']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Dolomite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'dolomie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Craie', 'craie', 'geologie', 'Calcaire blanc, tendre et poreux, formé de coquilles microscopiques d''algues marines déposées au Crétacé.', array['Calcaire', 'Silex', 'Crétacé']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Calcite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'craie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Roche carbonatée', 'roche-carbonatee', 'geologie', 'Roche sédimentaire formée de plus de la moitié de carbonates : calcaire, craie, dolomie.', array['Calcaire', 'Dolomie', 'Carbonate']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Calcite', 'Dolomite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'roche-carbonatee');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Roche détritique', 'roche-detritique', 'geologie', 'Roche sédimentaire formée de fragments d''autres roches, comme le grès, le conglomérat ou l''argilite.', array['Sédiment', 'Grès', 'Conglomérat']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'roche-detritique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Sable', 'sable', 'geologie', 'Ensemble de grains de roche ou de minéral de 0,06 à 2 millimètres, le plus souvent du quartz.', array['Sédiment', 'Grès', 'Alluvion']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Quartz']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'sable');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Galet', 'galet', 'geologie', 'Fragment de roche arrondi par le transport dans l''eau, de 2 à 25 centimètres environ.', array['Conglomérat', 'Alluvion', 'Sédiment']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'galet');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Houille', 'houille', 'geologie', 'Charbon noir et dur, formé par la transformation de végétaux accumulés dans des marécages il y a plus de 300 millions d''années.', array['Charbon', 'Lignite', 'Carbonifère']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'houille');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Charbon', 'charbon', 'geologie', 'Roche sédimentaire combustible, formée par la transformation de débris de végétaux enfouis. Elle va de la tourbe à l''anthracite.', array['Houille', 'Lignite', 'Tourbe']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'charbon');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Lignite', 'lignite', 'geologie', 'Charbon brun, jeune et peu dur, issu de végétaux enfouis depuis quelques dizaines de millions d''années.', array['Charbon', 'Houille', 'Tourbe']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'lignite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Tourbe', 'tourbe', 'geologie', 'Matière brune formée de végétaux partiellement décomposés dans des marais, premier stade de la formation du charbon.', array['Charbon', 'Lignite', 'Houille']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'tourbe');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Oolithe', 'oolithe', 'geologie', 'Petite sphère de carbonate, de la taille d''un grain de sable, formée par dépôt de couches concentriques autour d''un noyau dans une eau agitée.', array['Oolithique', 'Calcaire', 'Concrétion']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Calcite', 'Aragonite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'oolithe');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Pisolithe', 'pisolithe', 'geologie', 'Concrétion sphérique de la taille d''un pois, faite de couches concentriques de carbonate de calcium, que l''on trouve dans les grottes et les sources.', array['Pisolitique', 'Oolithe', 'Concrétion']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Calcite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'pisolithe');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Septaria', 'septaria', 'geologie', 'Gros nodule d''argile ou de marne, fendu en polygones et dont les fentes sont remplies de calcite.', array['Nodule', 'Concrétion']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Calcite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'septaria');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Sel gemme', 'sel-gemme', 'geologie', 'Roche faite de halite, déposée par l''évaporation d''anciennes mers ou lagunes.', array['Évaporite', 'Sulfate']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Halite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'sel-gemme');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Travertin', 'travertin', 'geologie', 'Roche calcaire déposée par des sources chargées en carbonate, souvent poreuse et finement litée. Elle se forme encore aux sources thermales.', array['Source thermale', 'Calcaire', 'Spéléothème']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Calcite', 'Aragonite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'travertin');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Loess', 'loess', 'geologie', 'Dépôt de poussières très fines, jaunâtres, apportées par le vent pendant les périodes glaciaires. Il forme des sols très fertiles.', array['Sédiment', 'Quaternaire', 'Moraine']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'loess');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Moraine', 'moraine', 'geologie', 'Amas de blocs, de graviers et de sable déposés par un glacier, qui garde la forme du glacier qui l''a laissé.', array['Sédiment', 'Quaternaire', 'Érosion']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'moraine');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Terrasse alluviale', 'terrasse-alluviale', 'geologie', 'Replat dans une vallée, formé par d''anciennes alluvions déposées par une rivière qui s''est ensuite enfoncée.', array['Alluvion', 'Galet', 'Placer']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'terrasse-alluviale');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Éluvion', 'eluvion', 'geologie', 'Matériaux altérés qui sont restés sur place, au-dessus de la roche dont ils proviennent. Ils peuvent concentrer des minéraux résistants.', array['Colluvion', 'Alluvion', 'Altération']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'eluvion');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Colluvion', 'colluvion', 'geologie', 'Matériaux déplacés par la gravité, la pluie ou le ruissellement sur un versant, et accumulés en bas de pente.', array['Éluvion', 'Alluvion', 'Érosion']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'colluvion');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Doline', 'doline', 'geologie', 'Dépression fermée, en forme de cuvette ou d''entonnoir, due à la dissolution du calcaire ou à l''effondrement d''une cavité.', array['Karst', 'Dissolution', 'Spéléothème']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'doline');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Grotte', 'grotte', 'geologie', 'Cavité naturelle souterraine, creusée surtout dans le calcaire par la dissolution due à l''eau.', array['Karst', 'Spéléothème', 'Stalactite']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'grotte');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Spéléothème', 'speleotheme', 'geologie', 'Toute concrétion formée dans une grotte : stalactite, stalagmite, draperie, colonne ou excentrique.', array['Stalactite', 'Stalagmite', 'Grotte', 'Concrétion']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Calcite', 'Aragonite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'speleotheme');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Faciès métamorphique', 'facies-metamorphique', 'geologie', 'Ensemble de roches métamorphiques formées dans les mêmes conditions de pression et de température, qui contiennent donc les mêmes minéraux caractéristiques.', array['Métamorphisme', 'Minéral index', 'Schiste bleu']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'facies-metamorphique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Minéral index', 'mineral-index', 'geologie', 'Minéral dont la présence indique des conditions de température et de pression précises dans une roche métamorphique, comme la chlorite, le grenat, la staurotide ou la sillimanite.', array['Isograde', 'Faciès métamorphique', 'Métamorphisme']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Grenat', 'Staurotide']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'mineral-index');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Isograde', 'isograde', 'geologie', 'Ligne qui, sur une carte, joint les points où apparaît le même minéral index dans les roches métamorphiques.', array['Minéral index', 'Faciès métamorphique', 'Métamorphisme']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'isograde');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Amphibolite', 'amphibolite', 'geologie', 'Roche métamorphique sombre, faite surtout d''amphibole et de plagioclase, issue de basalte ou de gabbro transformé.', array['Métamorphisme', 'Amphibole', 'Roche métamorphique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'amphibolite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Cornéenne', 'corneenne', 'geologie', 'Roche très dure, à grain fin, formée autour d''une intrusion par la chaleur qui transforme les roches voisines.', array['Métamorphisme de contact', 'Auréole de contact', 'Roche métamorphique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'corneenne');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Migmatite', 'migmatite', 'geologie', 'Roche formée d''un mélange de roche métamorphique et de roche issue de sa fusion partielle, qui donne des bandes claires et sombres.', array['Anatexie', 'Gneiss', 'Granite']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'migmatite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Anatexie', 'anatexie', 'geologie', 'Fusion partielle de roches de la croûte à haute température, qui produit un magma granitique et des migmatites.', array['Migmatite', 'Fusion partielle', 'Granite']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'anatexie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Granulite', 'granulite', 'geologie', 'Roche métamorphique de haute température, claire et à grain fin, formée à grande profondeur dans la croûte continentale.', array['Gneiss', 'Métamorphisme', 'Roche métamorphique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'granulite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Protolithe', 'protolithe', 'geologie', 'Roche d''origine avant qu''elle soit transformée par le métamorphisme. Le calcaire est le protolithe du marbre.', array['Métamorphisme', 'Marbre', 'Roche métamorphique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'protolithe');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Auréole de contact', 'aureole-de-contact', 'geologie', 'Zone autour d''une intrusion où les roches voisines ont été transformées par la chaleur du magma. Elle peut être riche en minéraux de skarn ou en cornéennes.', array['Métamorphisme de contact', 'Cornéenne', 'Skarn']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'aureole-de-contact');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Roche encaissante', 'roche-encaissante', 'geologie', 'Roche qui entoure et contient un filon, une intrusion ou un gisement.', array['Filon', 'Intrusion', 'Éponte']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'roche-encaissante');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Roche mère', 'roche-mere', 'geologie', 'Roche dont dérivent un sol, un sédiment ou une autre roche. Elle peut aussi désigner celle où se forme le pétrole.', array['Protolithe', 'Altération', 'Sédiment']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'roche-mere');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Veine', 'veine', 'geologie', 'Mince filon de minéraux qui remplit une fracture dans une roche. On parle de veines de quartz, de calcite ou de minerai.', array['Filon', 'Fracture', 'Stockwerk']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Quartz', 'Calcite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'veine');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Stockwerk', 'stockwerk', 'geologie', 'Réseau dense de petits filons entrecroisés dans une roche, qui forme une masse minéralisée.', array['Veine', 'Filon', 'Gisement']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'stockwerk');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Éponte', 'eponte', 'geologie', 'Paroi d''un filon, au contact de la roche encaissante. On distingue l''éponte supérieure, ou toit, et l''éponte inférieure, ou mur.', array['Filon', 'Roche encaissante', 'Salbande']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'eponte');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Salbande', 'salbande', 'geologie', 'Bande de roche altérée ou de minéraux argileux le long de la paroi d''un filon, entre le filon et la roche encaissante.', array['Éponte', 'Filon', 'Roche encaissante']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'salbande');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Pendage', 'pendage', 'geologie', 'Inclinaison d''une couche, d''une faille ou d''un filon par rapport à l''horizontale, mesurée en degrés.', array['Strate', 'Filon', 'Faille']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'pendage');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Teneur', 'teneur', 'geologie', 'Proportion de métal ou de substance utile dans un minerai, exprimée en pourcentage ou en grammes par tonne.', array['Minerai', 'Gisement', 'Gangue']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'teneur');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Stérile', 'sterile', 'geologie', 'Roche sans valeur extraite d''une mine en même temps que le minerai, qui est mise en haldes.', array['Gangue', 'Halde', 'Minerai']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'sterile');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Descenderie', 'descenderie', 'geologie', 'Galerie inclinée qui descend vers les travaux d''une mine, en pente moins raide qu''un puits.', array['Galerie', 'Puits', 'Mine']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'descenderie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Front de taille', 'front-de-taille', 'geologie', 'Surface de roche en cours d''exploitation dans une mine ou une carrière, d''où l''on abat le minerai ou la pierre.', array['Mine', 'Carrière', 'Galerie']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'front-de-taille');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Boisage', 'boisage', 'geologie', 'Soutènement en bois qui retient les parois et le plafond d''une galerie de mine pour éviter les éboulements.', array['Galerie', 'Mine', 'Puits']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'boisage');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Mine à ciel ouvert', 'mine-a-ciel-ouvert', 'geologie', 'Exploitation en carrière géante, où l''on enlève les roches de surface pour atteindre le minerai en gradins.', array['Mine', 'Carrière', 'Mine souterraine']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'mine-a-ciel-ouvert');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Mine souterraine', 'mine-souterraine', 'geologie', 'Exploitation par puits et galeries qui suit le minerai en profondeur.', array['Mine', 'Galerie', 'Puits']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'mine-souterraine');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Ardoisière', 'ardoisiere', 'geologie', 'Exploitation d''ardoise, roche métamorphique qui se débite en minces plaques grâce à sa schistosité.', array['Schistosité', 'Carrière', 'Schiste']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'ardoisiere');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Exploration minière', 'exploration-miniere', 'geologie', 'Ensemble des travaux de recherche d''un gisement : cartes, mesures, prélèvements, sondages.', array['Prospection', 'Sondage', 'Gisement']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'exploration-miniere');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Concession minière', 'concession-miniere', 'geologie', 'Droit d''exploiter les minéraux d''un secteur, accordé par l''État. En France, les mines relèvent du code minier.', array['Mine', 'Gisement', 'Prospection']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'concession-miniere');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Orpaillage', 'orpaillage', 'geologie', 'Recherche de l''or dans les alluvions par lavage à la batée, à la sluice ou à l''aide d''autres outils.', array['Placer', 'Batée', 'Pépite']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Or']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'orpaillage');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Gisement filonien', 'gisement-filonien', 'geologie', 'Gisement formé de minéraux déposés dans des fractures par des fluides chauds, sous forme de filons.', array['Filon', 'Gisement', 'Hydrothermal']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'gisement-filonien');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Gisement alluvionnaire', 'gisement-alluvionnaire', 'geologie', 'Gisement de minéraux denses ou précieux concentrés par une rivière : or, étain, diamant, gemmes.', array['Placer', 'Alluvion', 'Orpaillage']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Or', 'Cassitérite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'gisement-alluvionnaire');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Gisement stratiforme', 'gisement-stratiforme', 'geologie', 'Gisement de minerai disposé en couche, parallèlement aux strates de la roche qui l''encaisse.', array['Strate', 'Minerai', 'Gisement']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'gisement-stratiforme');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Gisement magmatique', 'gisement-magmatique', 'geologie', 'Gisement formé par la cristallisation d''un magma, qui concentre certains minéraux utiles : chromite, platine, diamant dans les kimberlites.', array['Magma', 'Kimberlite', 'Gisement']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Chromite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'gisement-magmatique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Gisement hydrothermal', 'gisement-hydrothermal', 'geologie', 'Gisement formé par le dépôt de minéraux issus de fluides chauds qui circulent dans la croûte.', array['Hydrothermal', 'Fluide hydrothermal', 'Filon']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'gisement-hydrothermal');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Laverie', 'laverie', 'geologie', 'Installation où l''on lave et trie le minerai broyé pour en séparer les minéraux utiles de la gangue.', array['Minerai', 'Gangue', 'Mine']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'laverie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Patrimoine minier', 'patrimoine-minier', 'geologie', 'Ensemble des traces laissées par l''activité minière passée : galeries, bâtiments, haldes, outils, archives, paysages et savoir-faire.', array['Mine', 'Halde', 'Galerie']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'patrimoine-minier');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Météorite', 'meteorite', 'geologie', 'Roche ou métal venu de l''espace et tombé sur Terre. On les range en météorites pierreuses, ferreuses et mixtes.', array['Chondrite', 'Achondrite', 'Pallasite']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'meteorite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Chondrite', 'chondrite', 'geologie', 'Météorite pierreuse contenant de petites sphères, les chondres. Elle fait partie des matières les plus anciennes du système solaire, âgée d''environ 4,5 milliards d''années.', array['Météorite', 'Achondrite', 'Datation']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'chondrite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Achondrite', 'achondrite', 'geologie', 'Météorite pierreuse sans chondres, issue d''un astre qui a fondu et s''est différencié, comme les météorites de la Lune ou de Mars.', array['Météorite', 'Chondrite', 'Pallasite']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'achondrite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Pallasite', 'pallasite', 'geologie', 'Météorite mixte de fer-nickel dans lequel sont enchâssés des cristaux d''olivine verts, parfois de qualité gemme.', array['Météorite', 'Gemme']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Olivine']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'pallasite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Tectite', 'tectite', 'geologie', 'Petit verre naturel, formé par la fusion de roches terrestres lors de l''impact d''une météorite et projeté à grande distance. La moldavite en est une.', array['Impactite', 'Minéraloïde', 'Météorite']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'tectite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Impactite', 'impactite', 'geologie', 'Roche transformée par le choc d''une météorite : roche fondue, brèche d''impact ou roche aux minéraux déformés.', array['Cratère d''impact', 'Tectite', 'Brèche']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'impactite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Cratère d''impact', 'cratere-d-impact', 'geologie', 'Dépression creusée par la chute d''une météorite. En France, celui de Rochechouart (Charente) est l''un des plus grands d''Europe.', array['Impactite', 'Météorite', 'Astroblème']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'cratere-d-impact');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Astroblème', 'astrobleme', 'geologie', 'Structure circulaire très ancienne, usée par l''érosion, qui marque la place d''un cratère d''impact.', array['Cratère d''impact', 'Impactite', 'Météorite']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'astrobleme');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Fulgurite', 'fulgurite', 'geologie', 'Tube de verre formé quand la foudre frappe le sable ou la roche et la fait fondre sur son passage.', array['Minéraloïde', 'Silice']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'fulgurite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Fossilisation', 'fossilisation', 'geologie', 'Ensemble des processus qui conservent un être vivant, ou la trace de sa vie, dans une roche.', array['Fossile', 'Pétrification', 'Empreinte']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'fossilisation');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Pétrification', 'petrification', 'geologie', 'Transformation d''un organisme en pierre : ses tissus sont remplacés par des minéraux, comme le quartz ou la calcite, qui gardent sa forme.', array['Fossilisation', 'Silicification', 'Bois pétrifié']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Quartz', 'Calcite']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'petrification');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Bois pétrifié', 'bois-petrifie', 'geologie', 'Bois fossile dont les cellules ont été remplacées par de la silice, de l''opale ou de la calcédoine, qui conservent souvent les cernes de l''arbre.', array['Pétrification', 'Silicification', 'Fossile']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Quartz', 'Opale', 'Calcédoine']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'bois-petrifie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Empreinte', 'empreinte', 'geologie', 'Trace en creux ou en relief d''un organisme, d''une feuille ou d''un pas, conservée dans une roche sédimentaire.', array['Fossile', 'Fossilisation', 'Roche sédimentaire']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'empreinte');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Ammonite', 'ammonite', 'geologie', 'Mollusque marin fossile à coquille enroulée en spirale, éteint à la fin du Crétacé. Elle sert de fossile stratigraphique.', array['Fossile', 'Fossile stratigraphique', 'Mésozoïque']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'ammonite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Trilobite', 'trilobite', 'geologie', 'Arthropode marin fossile du Paléozoïque, au corps divisé en trois lobes, éteint il y a environ 250 millions d''années.', array['Fossile', 'Paléozoïque', 'Fossile stratigraphique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'trilobite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Bélemnite', 'belemnite', 'geologie', 'Fossile en forme de balle, partie solide du squelette d''un mollusque marin voisin de la seiche, éteint à la fin du Crétacé.', array['Fossile', 'Mésozoïque', 'Crétacé']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'belemnite');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Fossile stratigraphique', 'fossile-stratigraphique', 'geologie', 'Fossile d''une espèce qui a vécu peu de temps mais sur une grande surface, et qui permet de dater la couche de roche dans laquelle on le trouve.', array['Stratigraphie', 'Fossile', 'Datation']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'fossile-stratigraphique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Datation radiométrique', 'datation-radiometrique', 'geologie', 'Méthode qui mesure l''âge d''une roche ou d''un minéral grâce à la désintégration régulière d''éléments radioactifs qu''il contient.', array['Demi-vie', 'Datation', 'Isotope']::text[], coalesce((select array_agg(name order by name) from public.minerals where publication_status = 'published' and name = any(array['Zircon']::text[])), '{}'::text[])
where not exists (select 1 from public.glossary_terms where slug = 'datation-radiometrique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Demi-vie', 'demi-vie', 'geologie', 'Temps nécessaire pour que la moitié des atomes d''un élément radioactif se désintègre. Elle sert de chronomètre pour dater les roches.', array['Datation radiométrique', 'Radioactivité', 'Isotope']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'demi-vie');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Isotope', 'isotope', 'geologie', 'Variante d''un élément chimique dont le noyau compte un nombre différent de neutrons. Certains sont radioactifs et servent à dater les roches.', array['Datation radiométrique', 'Élément chimique', 'Demi-vie']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'isotope');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Précambrien', 'precambrien', 'geologie', 'Temps géologique qui précède le Cambrien : de la formation de la Terre, il y a 4,5 milliards d''années, à environ 539 millions d''années. Il couvre près de 90 % de l''histoire de la Terre.', array['Échelle des temps géologiques', 'Archéen', 'Protérozoïque']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'precambrien');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Archéen', 'archeen', 'geologie', 'Éon géologique qui s''étend d''environ 4 à 2,5 milliards d''années. Les plus vieux continents et les premières traces de vie datent de cette époque.', array['Précambrien', 'Craton', 'Échelle des temps géologiques']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'archeen');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Protérozoïque', 'proterozoique', 'geologie', 'Éon géologique compris entre 2,5 milliards d''années et 539 millions d''années, marqué par l''apparition de l''oxygène dans l''atmosphère et des premiers êtres pluricellulaires.', array['Précambrien', 'Archéen', 'Échelle des temps géologiques']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'proterozoique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Paléozoïque', 'paleozoique', 'geologie', 'Ère géologique de 539 à 252 millions d''années, de l''explosion de la vie au Cambrien jusqu''à la grande extinction du Permien. L''orogenèse hercynienne s''y déroule.', array['Échelle des temps géologiques', 'Cambrien', 'Permien']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'paleozoique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Mésozoïque', 'mesozoique', 'geologie', 'Ère géologique de 252 à 66 millions d''années, qui comprend le Trias, le Jurassique et le Crétacé, l''âge des dinosaures.', array['Échelle des temps géologiques', 'Trias', 'Crétacé']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'mesozoique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Cénozoïque', 'cenozoique', 'geologie', 'Ère géologique qui commence il y a 66 millions d''années, après la disparition des dinosaures, et qui se poursuit aujourd''hui. Elle comprend le Paléogène, le Néogène et le Quaternaire.', array['Échelle des temps géologiques', 'Paléogène', 'Quaternaire']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'cenozoique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Cambrien', 'cambrien', 'geologie', 'Première période du Paléozoïque, de 539 à 485 millions d''années, marquée par l''apparition de la plupart des grands groupes d''animaux.', array['Paléozoïque', 'Échelle des temps géologiques', 'Trilobite']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'cambrien');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Ordovicien', 'ordovicien', 'geologie', 'Période géologique de 485 à 444 millions d''années, marquée par un essor de la vie marine et par une glaciation à la fin.', array['Paléozoïque', 'Silurien', 'Échelle des temps géologiques']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'ordovicien');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Silurien', 'silurien', 'geologie', 'Période géologique de 444 à 419 millions d''années, durant laquelle les premières plantes colonisent les terres.', array['Paléozoïque', 'Ordovicien', 'Dévonien']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'silurien');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Dévonien', 'devonien', 'geologie', 'Période géologique de 419 à 359 millions d''années, souvent appelée âge des poissons, qui voit apparaître les premières forêts.', array['Paléozoïque', 'Silurien', 'Carbonifère']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'devonien');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Carbonifère', 'carbonifere', 'geologie', 'Période géologique de 359 à 299 millions d''années, au cours de laquelle de vastes forêts donnent les grands gisements de houille.', array['Paléozoïque', 'Houille', 'Orogenèse hercynienne']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'carbonifere');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Permien', 'permien', 'geologie', 'Dernière période du Paléozoïque, de 299 à 252 millions d''années, qui se termine par la plus grande extinction de masse connue.', array['Paléozoïque', 'Carbonifère', 'Trias']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'permien');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Trias', 'trias', 'geologie', 'Première période du Mésozoïque, de 252 à 201 millions d''années, qui voit apparaître les premiers dinosaures et les premiers mammifères.', array['Mésozoïque', 'Permien', 'Jurassique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'trias');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Jurassique', 'jurassique', 'geologie', 'Période géologique de 201 à 145 millions d''années, qui tire son nom du Jura. Les dinosaures y dominent, et l''océan Atlantique commence à s''ouvrir.', array['Mésozoïque', 'Trias', 'Crétacé']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'jurassique');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Crétacé', 'cretace', 'geologie', 'Dernière période du Mésozoïque, de 145 à 66 millions d''années, qui tire son nom de la craie, et qui se termine par la disparition des dinosaures.', array['Mésozoïque', 'Craie', 'Jurassique']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'cretace');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Paléogène', 'paleogene', 'geologie', 'Première période du Cénozoïque, de 66 à 23 millions d''années, qui comprend le Paléocène, l''Éocène et l''Oligocène.', array['Cénozoïque', 'Oligocène', 'Néogène']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'paleogene');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Oligocène', 'oligocene', 'geologie', 'Dernière époque du Paléogène, de 34 à 23 millions d''années. C''est à cette époque que se creusent la Limagne et les fossés de l''ouest de l''Europe.', array['Paléogène', 'Limagne', 'Rift ouest-européen']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'oligocene');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Néogène', 'neogene', 'geologie', 'Période géologique de 23 à 2,6 millions d''années, qui comprend le Miocène et le Pliocène.', array['Cénozoïque', 'Paléogène', 'Quaternaire']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'neogene');
insert into public.glossary_terms (term, slug, domain, definition, see_also, related_minerals)
select 'Quaternaire', 'quaternaire', 'geologie', 'Période géologique qui commence il y a 2,6 millions d''années et se poursuit aujourd''hui, marquée par les glaciations et par l''apparition de l''espèce humaine.', array['Cénozoïque', 'Moraine', 'Loess']::text[], '{}'::text[]
where not exists (select 1 from public.glossary_terms where slug = 'quaternaire');
