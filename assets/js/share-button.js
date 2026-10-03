// Bouton « Partager » des fiches ouvertes : menu de partage de l'appareil (réseaux, messages…), sinon copie du lien.
const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
const pageUrl = () => document.querySelector('link[rel="canonical"]')?.href || location.href;

export function shareButton({ title, text }) {
  const button = el("button", "share-btn"); button.type = "button";
  const paint = label => { button.innerHTML = `<span class="share-icon" aria-hidden="true">↗</span><span></span>`; button.lastChild.textContent = label; };
  paint("Partager cette fiche");
  button.addEventListener("click", async () => {
    const url = pageUrl();
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); } catch { /* partage annulé */ }
      return;
    }
    try { await navigator.clipboard.writeText(url); paint("Lien copié ✓"); }
    catch { window.prompt("Copiez le lien de cette fiche :", url); return; }
    setTimeout(() => paint("Partager cette fiche"), 2500);
  });
  return button;
}
