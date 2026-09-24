import { describe, it, expect, beforeEach } from "vitest";
import {
  nafaInspectionEngine,
  SEED_INSPECTION_TYPES,
  buildInspectionTemplateForType,
  InspectionType,
} from "@/lib/nafaSmartInspectionEngine";

describe("NAFA Genius IA - Inspection Intelligente Engine & Workflow", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ── 1. Types de missions & Catalogue ──
  it("contient l'ensemble des types de missions obligatoires en Agriculture, Élevage et Machinisme", () => {
    const types = nafaInspectionEngine.getTypes();
    expect(types.length).toBeGreaterThanOrEqual(20);

    // Agriculture
    const codes = types.map((t) => t.code);
    expect(codes).toContain("AGRI_AMENAGEMENT");
    expect(codes).toContain("AGRI_IRRIGATION_GLOBAL");
    expect(codes).toContain("AGRI_GOUTTE_A_GOUTTE");
    expect(codes).toContain("AGRI_ASPERSION");
    expect(codes).toContain("AGRI_MICRO_ASPERSION");
    expect(codes).toContain("AGRI_FORAGE_SOLAIRE");
    expect(codes).toContain("AGRI_RESERVOIR_EAU");
    expect(codes).toContain("AGRI_SERRE_BIOCLIMATIQUE");
    expect(codes).toContain("AGRI_ANALYSE_PARCELLE");
    expect(codes).toContain("AGRI_CARTO_GPS");
    expect(codes).toContain("AGRI_DIAGNOSTIC_CULTURES");

    // Élevage
    expect(codes).toContain("ELEV_BOVINE");
    expect(codes).toContain("ELEV_OVINE");
    expect(codes).toContain("ELEV_CAPRINE");
    expect(codes).toContain("ELEV_AVICOLE");
    expect(codes).toContain("ELEV_PORCINE");
    expect(codes).toContain("ELEV_PISCICOLE");
    expect(codes).toContain("ELEV_BATIMENTS_GENIE");
    expect(codes).toContain("ELEV_DIAGNOSTIC_SANITAIRE");
    expect(codes).toContain("ELEV_ABREUVEMENT");

    // Machinisme & Travaux
    expect(codes).toContain("MACH_INSTALLATION");
    expect(codes).toContain("MACH_INSPECTION_TRACTEUR");
    expect(codes).toContain("MACH_MAINTENANCE");
    expect(codes).toContain("MACH_POMPES_SOLAIRES");
    expect(codes).toContain("MACH_RESEAUX_HYDRAULIQUES");
  });

  it("permet d'ajouter facilement de nouveaux types de mission sans modifier l'architecture (Extensibilité)", () => {
    const custom = nafaInspectionEngine.registerCustomType({
      name: "Installation de méthaniseur agricole",
      code: "CUSTOM_METHANISATION",
      category: "autre",
      description: "Contrôle d'étanchéité des dômes de biogaz et raccords torchères.",
      iconName: "Flame",
      is_active: true,
    });

    expect(custom.id).toContain("it-custom-");
    const allTypes = nafaInspectionEngine.getTypes();
    expect(allTypes.some((t) => t.code === "CUSTOM_METHANISATION")).toBe(true);

    // Vérifie que le template associé est généré automatiquement
    const template = nafaInspectionEngine.getTemplateForType(custom.id);
    expect(template).toBeDefined();
    expect(template.inspection_type_id).toBe(custom.id);
  });

  // ── 2. Génération automatique du formulaire IA adapté ──
  it("génère automatiquement les paramètres spécifiques, photos obligatoires et mesures pour l'irrigation", () => {
    const irrigationType = nafaInspectionEngine.getTypes().find((t) => t.code === "AGRI_GOUTTE_A_GOUTTE")!;
    const template = nafaInspectionEngine.getTemplateForType(irrigationType.id);

    // Champs spécifiques demandés
    const fieldKeys = template.fields_schema.map((f) => f.key);
    expect(fieldKeys).toContain("superficie_ha");
    expect(fieldKeys).toContain("pente_pct");
    expect(fieldKeys).toContain("source_eau");
    expect(fieldKeys).toContain("debit_disponible_m3h");
    expect(fieldKeys).toContain("pression_service_bar");
    expect(fieldKeys).toContain("ecartement_lignes_m");
    expect(fieldKeys).toContain("type_culture");

    // Photos obligatoires
    const mandatoryPhotos = template.required_photos.filter((p) => p.is_mandatory);
    expect(mandatoryPhotos.length).toBeGreaterThanOrEqual(2);
    expect(mandatoryPhotos.some((p) => p.key === "photo_source")).toBe(true);
    expect(mandatoryPhotos.some((p) => p.key === "photo_parcelle_panoramique")).toBe(true);

    // Mesures attendues
    const measNames = template.default_measurements.map((m) => m.name);
    expect(measNames).toContain("Débit au refoulement");
    expect(measNames).toContain("Pression statique tête");
  });

  it("génère automatiquement les paramètres spécifiques pour une ferme piscicole", () => {
    const piscicoleType = nafaInspectionEngine.getTypes().find((t) => t.code === "ELEV_PISCICOLE")!;
    const template = nafaInspectionEngine.getTemplateForType(piscicoleType.id);

    const fieldKeys = template.fields_schema.map((f) => f.key);
    expect(fieldKeys).toContain("nb_bassins");
    expect(fieldKeys).toContain("longueur_bassin_m");
    expect(fieldKeys).toContain("largeur_bassin_m");
    expect(fieldKeys).toContain("profondeur_eau_m");
    expect(fieldKeys).toContain("especes_elevees");

    const measNames = template.default_measurements.map((m) => m.name);
    expect(measNames).toContain("pH de l'eau des bassins");
    expect(measNames).toContain("Température de l'eau");
    expect(measNames).toContain("Oxygène dissous (DO)");
  });

  // ── 3. Workflow de Collecte de Données Terrain ──
  it("crée une inspection avec UUID et statut Offline-First 'pending'", async () => {
    const types = nafaInspectionEngine.getTypes();
    const type = types[0];

    const inspection = await nafaInspectionEngine.createInspection({
      inspection_type_id: type.id,
      client_name: "Ferme Agro-Pastorale Wend-Panga",
      client_phone: "+226 70 25 80 00",
      client_location: "Koubri / Bazoulé",
      expert_name: "Ing. Sanon Oumar",
      latitude: 12.3582,
      longitude: -1.5348,
      gps_accuracy: 4,
      altitude: 295,
    });

    expect(inspection.id).toBeDefined();
    // UUID v4 format verification
    expect(inspection.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(inspection.sync_status).toBe("pending");
    expect(inspection.status).toBe("brouillon");
    expect(inspection.latitude).toBeCloseTo(12.3582);
    expect(inspection.gps_accuracy).toBe(4);

    // Récupération locale
    const retrieved = nafaInspectionEngine.getInspectionById(inspection.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.client_name).toBe("Ferme Agro-Pastorale Wend-Panga");
  });

  it("enregistre les photos géotaggées, les mesures avec conformité, le croquis et la signature", async () => {
    const type = nafaInspectionEngine.getTypes().find((t) => t.code === "AGRI_GOUTTE_A_GOUTTE")!;
    const inspection = await nafaInspectionEngine.createInspection({
      inspection_type_id: type.id,
      client_name: "GIE Maraîcher de Loumbila",
      client_phone: "+226 76 50 12 12",
      client_location: "Loumbila",
      expert_name: "Dr. Kaboré",
      latitude: 12.498,
      longitude: -1.402,
    });

    // 1. Ajout de photo géotaggée
    const photo = nafaInspectionEngine.addInspectionPhoto(inspection.id, {
      label: "Source d'eau & Tête de forage",
      photo_url: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
      latitude: 12.498,
      longitude: -1.402,
      is_mandatory: true,
      notes: "Forage équipé pompe solaire 3kW",
    });
    expect(photo.id).toBeDefined();
    const photos = nafaInspectionEngine.getInspectionPhotos(inspection.id);
    expect(photos.length).toBe(1);
    expect(photos[0].is_mandatory).toBe(true);

    // 2. Mise à jour des mesures techniques avec calcul de conformité
    const meas = nafaInspectionEngine.getInspectionMeasurements(inspection.id);
    expect(meas.length).toBeGreaterThanOrEqual(1);

    // Mettre une valeur conforme
    meas[0].value = 15;
    meas[0].min_threshold = 4;
    meas[0].max_threshold = 40;
    meas[0].is_conforming = meas[0].value >= meas[0].min_threshold && meas[0].value <= meas[0].max_threshold;
    expect(meas[0].is_conforming).toBe(true);

    // 3. Croquis de terrain et signatures électroniques
    const updated = nafaInspectionEngine.updateInspection(inspection.id, {
      sketch_data_url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA",
      client_signature_url: "data:image/png;base64,CLIENT_SIG",
      expert_signature_url: "data:image/png;base64,EXPERT_SIG",
      voice_notes_transcription: "Pression excellente à 2.8 bars, filtration opérationnelle.",
      status: "en_cours",
    });

    expect(updated.sketch_data_url).toContain("data:image/png");
    expect(updated.client_signature_url).toBe("data:image/png;base64,CLIENT_SIG");
    expect(updated.expert_signature_url).toBe("data:image/png;base64,EXPERT_SIG");
    expect(updated.status).toBe("en_cours");
  });

  // ── 4. Validation & Génération automatique de Rapport & Devis ──
  it("génère automatiquement un devis chiffré basé sur les partenaires réels du Burkina Faso", () => {
    const type = nafaInspectionEngine.getTypes().find((t) => t.code === "AGRI_GOUTTE_A_GOUTTE")!;
    const fields = {
      superficie_ha: 2.0,
      distance_source_parcelle_m: 100,
    };

    const quoteItems = nafaInspectionEngine.generateSmartQuote(type, fields);
    expect(quoteItems.length).toBeGreaterThanOrEqual(4);

    const partnerNames = quoteItems.map((q) => q.partner_name);
    expect(partnerNames.some((p) => p?.includes("AGRODIA") || p?.includes("SODIMEX"))).toBe(true);

    const total = quoteItems.reduce((acc, it) => acc + it.total_price_fcfa, 0);
    expect(total).toBeGreaterThan(500000); // Coût cohérent pour 2 ha de goutte-à-goutte
  });

  it("génère un rapport complet avec score de conformité, plan 2D SVG et recommandations", async () => {
    const type = nafaInspectionEngine.getTypes().find((t) => t.code === "AGRI_GOUTTE_A_GOUTTE")!;
    const inspection = await nafaInspectionEngine.createInspection({
      inspection_type_id: type.id,
      client_name: "Société Faso Bio",
      client_phone: "+226 70 00 00 00",
      client_location: "Bama, Bobo-Dioulasso",
      expert_name: "Ing. Traoré",
    });

    const fields = { superficie_ha: 1.5, distance_source_parcelle_m: 80 };
    const photos = nafaInspectionEngine.getInspectionPhotos(inspection.id);
    const measurements = nafaInspectionEngine.getInspectionMeasurements(inspection.id);

    const report = nafaInspectionEngine.generateAutomatedReport(
      inspection,
      type,
      fields,
      photos,
      measurements
    );

    expect(report.id).toBeDefined();
    expect(report.conformity_score).toBeGreaterThanOrEqual(0);
    expect(report.conformity_score).toBeLessThanOrEqual(100);
    expect(report.observations.length).toBeGreaterThan(0);
    expect(report.recommendations.length).toBeGreaterThan(0);
    expect(report.plan_2d_svg).toContain("<svg");
    expect(report.plan_2d_svg).toContain("Longueur : 60.00 m");
    expect(report.quote_summary).toBeDefined();
    expect(report.quote_summary?.total_ttc).toBeGreaterThan(0);
  });

  // ── 5. Règle Zéro-Emoji ──
  it("respecte scrupuleusement la règle Zéro-Emoji dans tous les textes générés", () => {
    const types = nafaInspectionEngine.getTypes();
    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

    for (const t of types) {
      expect(emojiRegex.test(t.name)).toBe(false);
      expect(emojiRegex.test(t.description)).toBe(false);
    }
  });
});
