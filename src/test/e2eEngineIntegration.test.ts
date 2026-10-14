// @vitest-environment node
/**
 * NAFA AGRITECH — End-to-End Engine & SaaS Integration Test Suite
 * Vérifie que les calculs et microservices scientifiques Python sont 100% réels,
 * déterministes, sans données factices, et directement consommables par le client React.
 */

import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { spawn, ChildProcess } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { pythonEngineClient } from "@/lib/pythonEngineClient";

describe("NAFA SaaS Full-Stack E2E Engine Integration", () => {
  let serverProcess: ChildProcess | null = null;
  const rootDir = path.resolve(__dirname, "../..");
  const engineDir = path.resolve(rootDir, "engine_python");

  beforeAll(async () => {
    // 1. Vérifier si le serveur tourne déjà
    const alreadyUp = await pythonEngineClient.isAvailable();
    if (alreadyUp) {
      console.log("[E2E Test] Moteur FastAPI déjà actif sur port 8000.");
      return;
    }

    // 2. Sinon, le lancer pour la suite de tests E2E
    console.log("[E2E Test] Démarrage du moteur FastAPI pour les tests d'intégration...");
    const isWin = process.platform === "win32";
    const pythonExe = isWin
      ? path.join(engineDir, ".venv", "Scripts", "python.exe")
      : path.join(engineDir, ".venv", "bin", "python");

    const execPath = fs.existsSync(pythonExe) ? pythonExe : (isWin ? "python" : "python3");

    serverProcess = spawn(
      execPath,
      ["-m", "uvicorn", "nafa.api:app", "--host", "127.0.0.1", "--port", "8000"],
      {
        cwd: engineDir,
        shell: false,
        stdio: "ignore",
      }
    );
    serverProcess.unref();

    // Attendre que le serveur soit prêt (max 15 secondes)
    let ready = false;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 500));
      if (await pythonEngineClient.isAvailable()) {
        ready = true;
        break;
      }
    }

    if (!ready) {
      throw new Error("Impossible de démarrer le moteur Python pour les tests E2E.");
    }
  }, 25000);

  afterAll(() => {
    if (serverProcess) {
      try {
        serverProcess.kill();
      } catch {}
      serverProcess = null;
    }
  });

  it("1. Health Check & Validation des modules scientifiques réels", async () => {
    const health = await pythonEngineClient.getHealth();
    expect(health).not.toBeNull();
    expect(health?.status).toBe("healthy");
    expect(health?.service).toContain("NAFA-AGRITECH");
    expect(health?.modules.some((m) => m.includes("crops_vision"))).toBe(true);
    expect(health?.modules.some((m) => m.includes("livestock_density"))).toBe(true);
    expect(health?.modules.some((m) => m.includes("modeling_2d_3d"))).toBe(true);
  });

  it("2. Nafa assistant : Salutation par prénom et assistance personnalisée", async () => {
    const res = await pythonEngineClient.chatWithCopilot({
      query: "Bonjour",
      fullName: "Roland Traoré",
      role: "agriculteur",
      isAuthenticated: true,
    });

    expect(res.reply).toBeDefined();
    expect(res.detected_profile).toBe("agriculteur");
    expect(res.personalized_greeting).toContain("Roland");
    expect(res.personalized_greeting).toContain("Nafa assistant");
    expect(res.suggested_actions.length).toBeGreaterThan(0);
  });

  it("3. Modélisation 2D Parcelle Réelle (1 Hectare carré 100m x 100m)", async () => {
    // Carré de 100m x 100m = 10 000 m² = 1.0 ha
    const squareCoords = [
      [0, 0],
      [100, 0],
      [100, 100],
      [0, 100],
      [0, 0],
    ];

    const parcel = await pythonEngineClient.modelParcel2D({
      boundary_coords: squareCoords,
      lateral_spacing_m: 1.0,
      emitter_spacing_m: 0.3,
    });

    // Tolérance géométrique stricte
    expect(parcel.area_m2).toBeCloseTo(10000, 0);
    expect(parcel.area_hectares).toBeCloseTo(1.0, 1);
    expect(parcel.perimeter_m).toBeCloseTo(400, 0);
    expect(parcel.drip_lines_count).toBeGreaterThan(50);
    expect(parcel.total_drip_pipe_length_m).toBeGreaterThan(5000);
    expect(parcel.svg_technical_plan).toContain("<svg");
    expect(parcel.dxf_2d_content).toContain("ENTITIES");
  });

  it("4. Audit Zootechnique & Confort Thermique Bâtiment (THI & Densité)", async () => {
    const audit = await pythonEngineClient.auditLivestockDensity({
      species: "poulet_chair",
      enclosure_area_m2: 100,
      total_heads: 1000, // 10 sujets/m²
      temperature_celsius: 35,
      relative_humidity_pct: 60,
    });

    expect(audit.species).toBe("poulet_chair");
    expect(audit.total_heads).toBe(1000);
    expect(audit.calculated_density_heads_per_m2).toBe(10);
    expect(audit.is_overcrowded).toBe(false); // 10 <= 10 max sahel
    expect(audit.bioclimatic_audit.thi_index).toBeGreaterThan(75);
    expect(audit.bioclimatic_audit.water_requirements_total_liters_day).toBeGreaterThan(150);
  });

  it("5. Réseau Hydraulique : Calcul Hazen-Williams et Pertes de Charge", async () => {
    const hydraulic = await pythonEngineClient.calculateHydraulics({
      flow_rate_m3_h: 6.0,
      pipe_length_m: 150,
      pipe_diameter_inner_mm: 50,
      static_lift_elevation_m: 12,
      service_pressure_bar: 1.2,
    });

    expect(hydraulic.flow_velocity_m_s).toBeGreaterThan(0.5);
    expect(hydraulic.flow_velocity_m_s).toBeLessThan(2.0);
    expect(hydraulic.is_velocity_compliant).toBe(true);
    expect(hydraulic.total_dynamic_head_hmt_m).toBeGreaterThan(20);
    expect(hydraulic.required_solar_pv_power_wc).toBeGreaterThan(500);
  });
});
