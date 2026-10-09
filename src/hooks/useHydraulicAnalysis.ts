/**
 * NAFA FIELD DESIGNER — HOOK D'ANALYSE HYDRAULIQUE DÉTERMINISTE
 * Connecte l'interface utilisateur au moteur physique strict (Hazen-Williams & Christiansen).
 * Gère la persistance IndexedDB (Dexie) hors-ligne et la détection d'anomalies en temps réel.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { Field, GeoPoint } from "@/types/fieldDesigner";
import {
  HydraulicInput,
  HydraulicResult,
  HydraulicWarning,
  calculateHydraulics,
  validateHydraulicInput,
} from "@/utils/hydraulics/engine";
import { db } from "@/lib/dexieDb";

export interface UseHydraulicAnalysisOptions {
  field?: Field | null;
  initialInput?: Partial<HydraulicInput>;
  storageKey?: string;
  autoSave?: boolean;
}

export interface UseHydraulicAnalysisReturn {
  input: Partial<HydraulicInput>;
  result: HydraulicResult | null;
  missingFields: string[];
  warnings: HydraulicWarning[];
  isComplete: boolean;
  isLoading: boolean;
  updateField: <K extends keyof HydraulicInput>(key: K, value: HydraulicInput[K]) => void;
  setInput: (newInput: Partial<HydraulicInput> | ((prev: Partial<HydraulicInput>) => Partial<HydraulicInput>)) => void;
  resetToDefaults: () => void;
  hasCriticalAlert: boolean;
}

const DEFAULT_HYDRAULIC_INPUT: HydraulicInput = {
  flowRate: 6.0,
  staticPressure: 2.5,
  length: 100,
  internalDiameter: 50,
  material: "PEHD",
  elevationDifference: 0,
  outletsCount: 20,
  requiredPressure: 1.0,
};

/**
 * Déduit le dénivelé topographique potentiel depuis les altitudes GPS si disponibles
 */
function extractElevationFromPoints(points?: GeoPoint[]): number {
  if (!points || points.length < 2) return 0;
  const altitudes = points
    .map((p) => p.alt)
    .filter((a): a is number => typeof a === "number" && !Number.isNaN(a));

  if (altitudes.length < 2) return 0;
  const minAlt = Math.min(...altitudes);
  const maxAlt = Math.max(...altitudes);
  return Math.round((maxAlt - minAlt) * 10) / 10;
}

export function useHydraulicAnalysis(options: UseHydraulicAnalysisOptions = {}): UseHydraulicAnalysisReturn {
  const { field, initialInput, storageKey: customStorageKey, autoSave = true } = options;
  const storageId = customStorageKey || `hydraulic_state_${field?.id || "default"}`;

  const [isLoading, setIsLoading] = useState(true);

  // Initialisation des données avec fusion parcelle / valeurs par défaut
  const [input, setInputState] = useState<Partial<HydraulicInput>>(() => {
    const topoDelta = extractElevationFromPoints(field?.points);
    const approxLength = field?.areaM2 ? Math.round(Math.sqrt(field.areaM2)) : 100;

    return {
      ...DEFAULT_HYDRAULIC_INPUT,
      length: approxLength > 0 ? approxLength : DEFAULT_HYDRAULIC_INPUT.length,
      elevationDifference: topoDelta,
      ...initialInput,
    };
  });

  // Chargement depuis IndexedDB (Dexie) ou localStorage au montage
  useEffect(() => {
    let isMounted = true;

    async function loadStoredState() {
      try {
        // Tentative de lecture depuis Dexie
        const cached = await db.cachedEntities.get(storageId);
        if (cached && cached.data && isMounted) {
          setInputState((prev) => ({
            ...prev,
            ...cached.data,
          }));
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Erreur de lecture IndexedDB pour l'analyse hydraulique, bascule sur localStorage :", err);
      }

      // Fallback localStorage
      try {
        const local = localStorage.getItem(`nafa_${storageId}`);
        if (local && isMounted) {
          const parsed = JSON.parse(local);
          setInputState((prev) => ({
            ...prev,
            ...parsed,
          }));
        }
      } catch {
        // Ignorer les erreurs de parsing
      }

      if (isMounted) {
        setIsLoading(false);
      }
    }

    loadStoredState();

    return () => {
      isMounted = false;
    };
  }, [storageId]);

  // Validation déterministe des champs requis
  const missingFields = useMemo(() => {
    return validateHydraulicInput(input);
  }, [input]);

  const isComplete = missingFields.length === 0;

  // Calcul physique strict déterministe
  const result = useMemo<HydraulicResult | null>(() => {
    if (!isComplete) return null;
    return calculateHydraulics(input as HydraulicInput);
  }, [input, isComplete]);

  const warnings = useMemo(() => {
    return result ? result.warnings : [];
  }, [result]);

  const hasCriticalAlert = useMemo(() => {
    return warnings.some((w) => w.level === "danger");
  }, [warnings]);

  // Sauvegarde automatique réactive dans Dexie (IndexedDB) et localStorage
  useEffect(() => {
    if (!autoSave || isLoading) return;

    const timeout = setTimeout(async () => {
      try {
        await db.cachedEntities.put({
          id: storageId,
          table: "hydraulic_analysis",
          data: input,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        // Fallback localStorage si IndexedDB est restreint
        try {
          localStorage.setItem(`nafa_${storageId}`, JSON.stringify(input));
        } catch {
          // Ignorer
        }
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [input, autoSave, isLoading, storageId]);

  // Méthode de mise à jour sécurisée d'un champ avec assainissement typé
  const updateField = useCallback(<K extends keyof HydraulicInput>(key: K, value: HydraulicInput[K]) => {
    setInputState((prev) => {
      // Pour les nombres, on s'assure qu'ils ne soient pas négatifs (sauf elevationDifference)
      let sanitizedValue = value;
      if (typeof value === "number") {
        if (key !== "elevationDifference" && value < 0) {
          sanitizedValue = 0 as HydraulicInput[K];
        }
      }
      return {
        ...prev,
        [key]: sanitizedValue,
      };
    });
  }, []);

  const setInput = useCallback(
    (newInput: Partial<HydraulicInput> | ((prev: Partial<HydraulicInput>) => Partial<HydraulicInput>)) => {
      setInputState((prev) => (typeof newInput === "function" ? newInput(prev) : { ...prev, ...newInput }));
    },
    []
  );

  const resetToDefaults = useCallback(() => {
    const topoDelta = extractElevationFromPoints(field?.points);
    setInputState({
      ...DEFAULT_HYDRAULIC_INPUT,
      elevationDifference: topoDelta,
    });
  }, [field]);

  return {
    input,
    result,
    missingFields,
    warnings,
    isComplete,
    isLoading,
    updateField,
    setInput,
    resetToDefaults,
    hasCriticalAlert,
  };
}
