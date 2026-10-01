import "./index.css";
import "./i18n";
import { createRoot } from "react-dom/client";
import App from "./App";
import { registerSW } from "virtual:pwa-register";

// Gestion automatique des versions et préchargements de chunks Vite
// En cas de mise à jour ou de cache CDN, évite le blocage "Unable to preload CSS/JS"
const handlePreloadError = (event: Event) => {
  console.warn("NAFA - AGRITECH : Erreur de préchargement de ressource détectée :", event);
  const now = Date.now();
  const lastReload = parseInt(sessionStorage.getItem("nafa_chunk_reload") || "0", 10);
  // Évite les boucles infinies de rechargement en attendant au moins 8 secondes
  if (now - lastReload > 8000) {
    sessionStorage.setItem("nafa_chunk_reload", String(now));
    window.location.reload();
  }
};

window.addEventListener("vite:preloadError", handlePreloadError);
window.addEventListener("vite:preload-error", handlePreloadError);

const root = document.getElementById("root");

// Enregistrement PWA automatique avec rechargement fluide
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log("NAFA - AGRITECH PWA : Nouvelle mise à jour disponible");
    },
    onOfflineReady() {
      console.log("NAFA - AGRITECH PWA : Prêt pour le fonctionnement hors-ligne");
    },
  });
}

if (!root) {
  throw new Error("NAFA - AGRITECH : élément #root introuvable");
}

createRoot(root).render(<App />);
