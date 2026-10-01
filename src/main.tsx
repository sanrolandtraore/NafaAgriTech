import "./index.css";
import "./i18n";
import { createRoot } from "react-dom/client";
import App from "./App";
import { registerSW } from "virtual:pwa-register";

// Gestion automatique des versions et préchargements de chunks Vite
const handlePreloadError = (event: Event) => {
  console.warn("NAFA - AGRITECH : Erreur de préchargement de ressource détectée :", event);
  const now = Date.now();
  const lastReload = parseInt(sessionStorage.getItem("nafa_chunk_reload") || "0", 10);
  if (now - lastReload > 5000) {
    sessionStorage.setItem("nafa_chunk_reload", String(now));
    if ("caches" in window) {
      caches.keys().then((names) => names.forEach((n) => caches.delete(n)));
    }
    window.location.reload();
  }
};

window.addEventListener("vite:preloadError", handlePreloadError);
window.addEventListener("vite:preload-error", handlePreloadError);

const root = document.getElementById("root");

// Enregistrement PWA automatique avec rechargement fluide
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  try {
    registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log("NAFA - AGRITECH PWA : Nouvelle mise à jour disponible");
      },
      onOfflineReady() {
        console.log("NAFA - AGRITECH PWA : Prêt pour le fonctionnement hors-ligne");
      },
    });
  } catch (swErr) {
    console.warn("ServiceWorker registration skipped:", swErr);
  }
}

if (!root) {
  throw new Error("NAFA - AGRITECH : élément #root introuvable");
}

try {
  createRoot(root).render(<App />);
} catch (mountErr: any) {
  console.error("NAFA - AGRITECH mount error:", mountErr);
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#faf8f5;font-family:system-ui,sans-serif;padding:24px">
      <div style="max-width:440px;background:#ffffff;padding:28px 24px;border-radius:24px;box-shadow:0 10px 30px rgba(0,0,0,0.06);text-align:center">
        <h2 style="color:#166534;margin-bottom:8px">NAFA - AGRITECH</h2>
        <p style="color:#6b7280;font-size:14px;margin-bottom:20px">Une actualisation du cache est nécessaire pour démarrer la plateforme.</p>
        <button onclick="window.clearNafaCacheAndReload ? window.clearNafaCacheAndReload() : window.location.reload()" style="background:#166534;color:white;border:none;padding:12px 24px;border-radius:12px;font-weight:bold;cursor:pointer">
          Actualiser la plateforme
        </button>
      </div>
    </div>
  `;
}

