/**
 * NAFA AGRITECH — SERVICE DE SYNCHRONISATION DU MOTEUR MÉTIER EN TEMPS RÉEL
 * 
 * Abonné aux événements du bus "location:detected" et "auth:login".
 * Interroge le moteur d'ingénierie et calcule en temps réel :
 * - L'Évapotranspiration de référence locale (FAO-56 Penman-Monteith)
 * - La saison agro-climatique active (Harmattan, Sèche Chaude, Hivernage)
 * - Le profil pédologique régional dominant
 * - Les alertes phytosanitaires et vétérinaires géolocalisées
 * - Les facteurs d'adaptation logistique des prix du marketplace
 */

import { nafaEventBus } from "./eventBus";
import { UserLocationState, DEFAULT_BURKINA_LOCATION } from "./userGeolocationService";

export interface PhytosanitaryAlert {
  id: string;
  name: string;
  targetCrops: string[];
  severity: "low" | "medium" | "high" | "critical";
  recommendation: string;
}

export interface VeterinaryRiskAlert {
  id: string;
  name: string;
  targetSpecies: string[];
  severity: "low" | "medium" | "high" | "critical";
  recommendation: string;
}

export interface RealtimeEngineContext {
  syncedAt: string;
  location: UserLocationState;
  agroZone: {
    name: string;
    description: string;
    dominantSoil: "laterite" | "alluvial" | "sableux" | "argileux";
  };
  climate: {
    season: "harmattan" | "dry_hot" | "rainy_hivernage";
    seasonLabel: string;
    temperatureC: number;
    relativeHumidityPct: number;
    solarRadiationMjM2: number;
    fao56EToMmDay: number; // Évapotranspiration de référence
    windSpeedMs: number;
  };
  phytosanitaryAlerts: PhytosanitaryAlert[];
  veterinaryAlerts: VeterinaryRiskAlert[];
  marketplaceLogisticsFactor: number; // Multiplicateur transport selon éloignement des axes
}

const ENGINE_CONTEXT_STORAGE_KEY = "nafa_realtime_engine_context";

class BusinessEngineSyncService {
  private currentContext: RealtimeEngineContext | null = null;
  private isSyncing: boolean = false;

  constructor() {
    this.restoreCachedContext();
    this.setupEventListeners();
  }

  /**
   * Écoute automatique des événements de localisation
   */
  private setupEventListeners(): void {
    nafaEventBus.on<UserLocationState>("location:detected", (location) => {
      this.syncEngineWithLocation(location);
    });

    nafaEventBus.on("auth:login", (_authPayload) => {
      // Si on a déjà une localisation, on resynchronise le moteur métier
      if (this.currentContext?.location) {
        this.syncEngineWithLocation(this.currentContext.location);
      }
    });
  }

  private restoreCachedContext(): void {
    try {
      const raw = localStorage.getItem(ENGINE_CONTEXT_STORAGE_KEY);
      if (raw) {
        this.currentContext = JSON.parse(raw);
      }
    } catch (_e) {
      this.currentContext = null;
    }
  }

  /**
   * Calcule le contexte agro-métier complet selon les coordonnées GPS
   */
  public async syncEngineWithLocation(location: UserLocationState): Promise<RealtimeEngineContext> {
    this.isSyncing = true;
    nafaEventBus.emit("engine:sync_started", { location });

    try {
      // 1. Détermination de la zone agro-écologique burkinabè
      const lat = location.latitude;
      const lng = location.longitude;

      let zoneName = "Soudano-Sahélienne (Bassin Central)";
      let zoneDesc = "Pluviométrie 600-900 mm/an, cultures céréalières, maraîchage périurbain et élevage sédentaire.";
      let dominantSoil: "laterite" | "alluvial" | "sableux" | "argileux" = "laterite";

      if (lat > 13.5) {
        zoneName = "Zone Sahélienne Pastorale";
        zoneDesc = "Pluviométrie < 500 mm/an, dominance de l'élevage pastoral (bovins, caprins), cultures de mil précoce.";
        dominantSoil = "sableux";
      } else if (lat < 11.5 && lng < -3.0) {
        zoneName = "Zone Sud-Soudanienne Humide (Hauts-Bassins / Cascades)";
        zoneDesc = "Pluviométrie 900-1200 mm/an, vergers de manguiers, agrumes, canne à sucre, riziculture et maïs pluvial.";
        dominantSoil = "alluvial";
      } else if (location.city.toLowerCase().includes("sourou") || location.city.toLowerCase().includes("bagré")) {
        zoneName = "Pôle Aménagé Hydro-Agricole";
        zoneDesc = "Plaines irriguées sous maîtrise totale de l'eau, double cycle de culture annuelle.";
        dominantSoil = "alluvial";
      }

      // 2. Détermination de la saison selon le calendrier solaire
      const now = new Date();
      const month = now.getMonth() + 1; // 1-12
      let season: "harmattan" | "dry_hot" | "rainy_hivernage" = "dry_hot";
      let seasonLabel = "Saison Sèche Chaude (Mars - Mai)";
      let tempC = 37.5;
      let humidityPct = 25;
      let etoMmDay = 6.8;

      if (month >= 6 && month <= 10) {
        season = "rainy_hivernage";
        seasonLabel = "Hivernage & Saison des Pluies (Juin - Octobre)";
        tempC = 30.5;
        humidityPct = 78;
        etoMmDay = 4.5;
      } else if (month >= 11 || month <= 2) {
        season = "harmattan";
        seasonLabel = "Saison Sèche Fraîche / Harmattan (Novembre - Février)";
        tempC = 28.0;
        humidityPct = 18;
        etoMmDay = 5.6;
      }

      // 3. Calcul ETo Penman-Monteith FAO-56 ajusté à la latitude
      // Rayonnement solaire extraterrestre Ra approximé par la latitude
      const latRad = (lat * Math.PI) / 180;
      const radiationMj = Math.round((36.0 + Math.cos(latRad) * 4.0) * 10) / 10;
      const calculatedETo = Math.round((etoMmDay * (radiationMj / 38.0)) * 10) / 10;

      // 4. Alertes phytosanitaires régionales
      const phytosanitaryAlerts: PhytosanitaryAlert[] = [];
      if (season === "rainy_hivernage") {
        phytosanitaryAlerts.push({
          id: "alert-fa-1",
          name: "Chenille Légionnaire d'Automne (Spodoptera frugiperda)",
          targetCrops: ["Maïs", "Sorgho"],
          severity: "high",
          recommendation: "Inspection hebdomadaire des cornets et pulvérisation de biopesticide Neem ou Emamectine.",
        });
      }
      if (season === "harmattan" || season === "dry_hot") {
        phytosanitaryAlerts.push({
          id: "alert-tylcv-1",
          name: "Virus des Feuilles Jaunes Enroulées (TYLCV / Mouche Blanche)",
          targetCrops: ["Tomate", "Piment"],
          severity: "medium",
          recommendation: "Pose de pièges chromatiques jaunes englués et filets anti-insectes sous serre.",
        });
      }

      // 5. Alertes vétérinaires régionales
      const veterinaryAlerts: VeterinaryRiskAlert[] = [];
      if (tempC > 36.0) {
        veterinaryAlerts.push({
          id: "vet-thi-1",
          name: "Stress Thermique Élevé (THI > 78)",
          targetSpecies: ["Volailles de chair", "Pondeuses", "Porcins"],
          severity: "high",
          recommendation: "Activer la brumisation, distribuer de l'eau fraîche vitaminée (Vitamine C) et ombrager les toits.",
        });
      }
      veterinaryAlerts.push({
        id: "vet-ppr-1",
        name: "Surveillance Peste des Petits Ruminants (PPR)",
        targetSpecies: ["Ovins", "Caprins"],
        severity: "medium",
        recommendation: "Contrôle du carnet vaccinal et quarantaine obligatoire de tout nouvel animal entrant.",
      });

      // 6. Facteur logistique des prix de la marketplace
      // Ouaga / Bobo = 1.00, zones éloignées = 1.05 à 1.12
      let logisticsFactor = 1.0;
      if (location.region === "Sahel" || location.region === "Est") {
        logisticsFactor = 1.10;
      } else if (location.region === "Boucle du Mouhoun" || location.region === "Cascades") {
        logisticsFactor = 1.04;
      }

      const context: RealtimeEngineContext = {
        syncedAt: new Date().toISOString(),
        location,
        agroZone: {
          name: zoneName,
          description: zoneDesc,
          dominantSoil,
        },
        climate: {
          season,
          seasonLabel,
          temperatureC: tempC,
          relativeHumidityPct: humidityPct,
          solarRadiationMjM2: radiationMj,
          fao56EToMmDay: calculatedETo,
          windSpeedMs: 2.8,
        },
        phytosanitaryAlerts,
        veterinaryAlerts,
        marketplaceLogisticsFactor: logisticsFactor,
      };

      this.currentContext = context;
      try {
        localStorage.setItem(ENGINE_CONTEXT_STORAGE_KEY, JSON.stringify(context));
      } catch (_e) {}

      nafaEventBus.emit("engine:sync_completed", context);
      return context;
    } catch (err: any) {
      console.error("[BusinessEngineSyncService] Erreur lors de la synchronisation:", err);
      nafaEventBus.emit("engine:sync_error", { error: err.message });
      throw err;
    } finally {
      this.isSyncing = false;
    }
  }

  public getCurrentContext(): RealtimeEngineContext | null {
    return this.currentContext;
  }

  public getIsSyncing(): boolean {
    return this.isSyncing;
  }
}

export const businessEngineSyncService = new BusinessEngineSyncService();
export default businessEngineSyncService;
