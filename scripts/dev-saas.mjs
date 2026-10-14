/**
 * NAFA AGRITECH — SaaS Full-Stack Development Orchestrator
 * CTO Commercial Production Tooling
 *
 * Bootstraps both the Python Scientific & Engineering Engine (FastAPI on :8000)
 * and the React Frontend (Vite on :8080) in one unified command with healthcheck polling.
 */

import { spawn } from "node:child_process";
import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const engineDir = path.resolve(rootDir, "engine_python");

console.log("\x1b[32m%s\x1b[0m", "==================================================================");
console.log("\x1b[32m%s\x1b[0m", "      NAFA-AGRITECH — SUITE FULL-STACK SAAS INDUSTRIELLE        ");
console.log("\x1b[32m%s\x1b[0m", "==================================================================");

// 1. Trouver l'exécutable Python (.venv local ou système)
function resolvePython() {
  const isWin = process.platform === "win32";
  const venvPythonWin = path.join(engineDir, ".venv", "Scripts", "python.exe");
  const venvPythonUnix = path.join(engineDir, ".venv", "bin", "python");

  if (isWin && fs.existsSync(venvPythonWin)) {
    return venvPythonWin;
  }
  if (!isWin && fs.existsSync(venvPythonUnix)) {
    return venvPythonUnix;
  }
  return isWin ? "python" : "python3";
}

const pythonExe = resolvePython();
console.log(`[CTO Init] Exécutable Python : ${pythonExe}`);

// 2. Vérification de santé du backend FastAPI
function checkBackendHealth(retries = 30, delayMs = 1000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const interval = setInterval(() => {
      attempts++;
      const req = http.get("http://127.0.0.1:8000/health", (res) => {
        if (res.statusCode === 200) {
          clearInterval(interval);
          resolve(true);
        }
      });

      req.on("error", () => {
        if (attempts >= retries) {
          clearInterval(interval);
          reject(new Error("Timeout : Le moteur Python n'a pas répondu à temps sur le port 8000."));
        }
      });
    }, delayMs);
  });
}

// 3. Démarrer le moteur scientifique Python
console.log("[Engine] Démarrage de FastAPI Uvicorn sur http://127.0.0.1:8000...");
const engineProcess = spawn(
  pythonExe,
  ["-m", "uvicorn", "nafa.api:app", "--host", "127.0.0.1", "--port", "8000", "--reload"],
  {
    cwd: engineDir,
    stdio: "inherit",
    shell: process.platform === "win32",
  }
);

engineProcess.on("error", (err) => {
  console.error("\x1b[31m[Engine Error]\x1b[0m", err);
});

// 4. Attendre que le backend soit prêt avant de démarrer Vite
console.log("[Engine] Attente de la validation du serveur de calcul...");
checkBackendHealth(25, 800)
  .then(() => {
    console.log("\x1b[32m%s\x1b[0m", "✓ [Engine Ready] Moteur Python actif sur http://127.0.0.1:8000");
    console.log("[Frontend] Lancement de Vite UI sur http://localhost:8080 (Proxy /api activé)...");

    const isWin = process.platform === "win32";
    const npxCmd = isWin ? "npx.cmd" : "npx";

    const viteProcess = spawn(npxCmd, ["vite"], {
      cwd: rootDir,
      stdio: "inherit",
      shell: isWin,
    });

    viteProcess.on("error", (err) => {
      console.error("\x1b[31m[Frontend Error]\x1b[0m", err);
    });

    // Gestion propre de l'arrêt
    const cleanup = () => {
      console.log("\n[CTO Shutdown] Arrêt ordonné des services SaaS...");
      try {
        viteProcess.kill();
      } catch {}
      try {
        engineProcess.kill();
      } catch {}
      process.exit(0);
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  })
  .catch((err) => {
    console.warn("\x1b[33m%s\x1b[0m", `[Engine Warning] ${err.message}`);
    console.log("[Frontend] Lancement de Vite en mode autonome...");
    const isWin = process.platform === "win32";
    const npxCmd = isWin ? "npx.cmd" : "npx";
    spawn(npxCmd, ["vite"], {
      cwd: rootDir,
      stdio: "inherit",
      shell: isWin,
    });
  });
