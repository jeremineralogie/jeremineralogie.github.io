import { thumbPathOf } from "./image-variants.js";
import { getSupabase } from "./supabase-client.js";

export async function loadPublishedContent(section) {
  const client = getSupabase();
  if (!client) throw new Error("La connexion à Supabase n’est pas configurée.");
  let query;
  if (section === "shop") query = client.from("shop_items").select("*,mine:mines!shop_items_mine_id_fkey(name,slug),mineral:minerals!shop_items_mineral_id_fkey(name,slug,formula,crystal_system,hardness,density,colors,luster,cleavage,habit,formation),department:departments!shop_items_department_code_fkey(name,region:regions!departments_region_id_fkey(name)),region:regions!shop_items_region_id_fkey(name),locality:localities!shop_items_locality_id_fkey(name,slug),associations:shop_item_associations(mineral:minerals(name,slug)),media:shop_item_media(id,bucket_id,storage_path,alt_text,position)")
    .eq("publication_status", "published").in("sale_status", ["available", "sold"]).order("updated_at", { ascending: false });
  else if (section === "articles") query = client.from("articles").select("*,media:article_media(id,bucket_id,storage_path,alt_text,caption,position)")
    .eq("publication_status", "published").order("published_on", { ascending: false, nullsFirst: false }).order("updated_at", { ascending: false });
  else if (section === "archives") query = client.from("archive_documents").select("id,slug,title,category,description,body,summary,links,cover_bucket,cover_path,document_date,rights_note,bucket_id,storage_path,publication_status,updated_at")
    .eq("publication_status", "published").eq("bucket_id", "site-media-public").order("document_date", { ascending: false, nullsFirst: false });
  else throw new Error(`Section publique inconnue : ${section}`);
  const { data, error } = await query;
  if (error) throw error;
  // Boutique : les pièces vendues restent visibles mais passent après les pièces disponibles.
  const rows = section === "shop" ? [...(data || [])].sort((a, b) => (a.sale_status === "sold") - (b.sale_status === "sold")) : (data || []);
  return { client, data: rows };
}

// variant « thumb » : la vignette (listes, cartes) quand la photo a été allégée ; sinon la photo telle quelle.
export function publicMediaUrl(client, media, variant = "full") {
  if (!media || media.bucket_id !== "site-media-public" || !media.storage_path) return "";
  const path = variant === "thumb" ? thumbPathOf(media.storage_path) || media.storage_path : media.storage_path;
  return client.storage.from(media.bucket_id).getPublicUrl(path).data.publicUrl;
}

export function watchContent(client, section, refresh) {
  const table = section === "shop" ? "shop_items" : section === "articles" ? "articles" : "archive_documents";
  const mediaTable = section === "shop" ? "shop_item_media" : section === "articles" ? "article_media" : null;
  let queued = false;
  const queue = () => { if (queued) return; queued = true; queueMicrotask(() => { queued = false; void refresh(); }); };
  const channel = client.channel(`public-${section}-content`)
    .on("postgres_changes", { event: "*", schema: "public", table }, queue);
  if (mediaTable) channel.on("postgres_changes", { event: "*", schema: "public", table: mediaTable }, queue);
  channel.subscribe(state => { if (state === "SUBSCRIBED") queue(); else if (["CHANNEL_ERROR", "TIMED_OUT"].includes(state)) console.error(`Realtime ${section} indisponible :`, state); });
  const timer = window.setInterval(queue, 60000);
  window.addEventListener("focus", queue);
  window.addEventListener("online", queue);
  window.addEventListener("pagehide", () => { clearInterval(timer); window.removeEventListener("focus", queue); window.removeEventListener("online", queue); void client.removeChannel(channel); }, { once: true });
}

export function showLoadError(error, status, grid, label) {
  console.error(`Chargement public ${label} depuis Supabase :`, error);
  grid.replaceChildren();
  status.textContent = `Les ${label} ne peuvent pas être chargés pour le moment. Réessayez dans quelques instants.`;
  status.hidden = false;
  status.classList.add("admin-error");
}

// Nom affiché côté public pour une pièce de la boutique : le minéral, jamais le titre interne.
export function shopItemName(item) {
  return String(item?.mineral_name || item?.mineral?.name || "").trim() || String(item?.title || "").trim() || "Spécimen";
}
