// Bouton « Partager » des fiches ouvertes : menu de partage de l'appareil (réseaux, messages…), sinon copie du lien.
const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
const pageUrl = () => document.querySelector('link[rel="canonical"]')?.href || location.href;

export function shareButton({ title, text, label = "Partager cette fiche", copyPrompt = "Copiez le lien de cette fiche :" }) {
  const button = el("button", "share-btn"); button.type = "button";
  const paint = label => { button.innerHTML = `<span class="share-icon" aria-hidden="true">↗</span><span></span>`; button.lastChild.textContent = label; };
  paint(label);
  button.addEventListener("click", async () => {
    const url = pageUrl();
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); } catch { /* partage annulé */ }
      return;
    }
    try { await navigator.clipboard.writeText(url); paint("Lien copié ✓"); }
    catch { window.prompt(copyPrompt, url); return; }
    setTimeout(() => paint(label), 2500);
  });
  return button;
}
