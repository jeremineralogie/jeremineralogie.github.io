// Champs propres aux spécimens de la collection : poids et date de découverte saisis librement.

// Poids : « 120 » ou « 12,5 » donne aussi la valeur en grammes ; tout autre texte (« 1,2 kg », « env. 50 g ») reste du texte seul.
export function parseWeight(value) {
  const weight = String(value ?? "").trim();
  const grams = /^\d+(?:[.,]\d{1,3})?$/.test(weight) ? Number(weight.replace(",", ".")) : null;
  return { weight_grams: Number.isFinite(grams) && grams <= 9999999.999 ? grams : null };
}

// Date : « AAAA », « MM/AAAA » ou « JJ/MM/AAAA ». Une saisie non reconnue est conservée en texte, sans date exploitable.
export function parseDiscoveryDate(value) {
  const empty = { discovered_on: null, discovery_year: null, discovery_month: null };
  const date = String(value ?? "").trim();
  if (!date) return empty;
  const validYear = year => year >= 1000 && year <= 2100;
  if (/^\d{4}$/.test(date)) return { ...empty, discovery_year: validYear(Number(date)) ? Number(date) : null };
  const monthMatch = /^(\d{2})\/(\d{4})$/.exec(date);
  if (monthMatch) {
    const [, month, year] = monthMatch.map(Number);
    return month >= 1 && month <= 12 && validYear(year) ? { ...empty, discovery_year: year, discovery_month: month } : empty;
  }
  const dayMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date);
  if (!dayMatch) return empty;
  const [, day, month, year] = dayMatch.map(Number);
  const parsed = new Date(0);
  parsed.setUTCHours(0, 0, 0, 0);
  parsed.setUTCFullYear(year, month - 1, day);
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return empty;
  return { ...empty, discovered_on: `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` };
}

// Fiches anciennes sans texte de date : la date est réécrite au format de saisie.
export function formatDiscoveryDate({ discovered_on: day, discovery_year: year, discovery_month: month }) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(day || "");
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  if (day) return day;
  if (year && month) return `${String(month).padStart(2, "0")}/${year}`;
  return year ? String(year) : "";
}
