import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, renderHook, act } from "@testing-library/react";
import { HydraulicPanel } from "@/components/irrigation/HydraulicPanel";
import { useHydraulicAnalysis } from "@/hooks/useHydraulicAnalysis";
import { Field } from "@/types/fieldDesigner";

// Mock resize observer
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("Intégration Moteur Hydraulique & Hook useHydraulicAnalysis", () => {
  const dummyField: Field = {
    id: "fld_irrigation_1",
    farmId: "farm_test",
    name: "Parcelle Maraîchère Kamboinsé",
    points: [
      { lat: 12.4, lng: -1.5, alt: 310 },
      { lat: 12.405, lng: -1.5, alt: 315 },
      { lat: 12.405, lng: -1.495, alt: 312 },
      { lat: 12.4, lng: -1.495, alt: 310 },
    ],
    areaM2: 10000,
    areaHa: 1.0,
    perimeterM: 400,
    status: "active",
    syncStatus: "synced",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe("Hook useHydraulicAnalysis", () => {
    it("initialise un dimensionnement complet et calcule les résultats sans mock", () => {
      const { result } = renderHook(() => useHydraulicAnalysis({ field: dummyField }));

      expect(result.current.isComplete).toBe(true);
      expect(result.current.missingFields.length).toBe(0);
      expect(result.current.result).not.toBeNull();
      expect(result.current.result?.velocity).toBeGreaterThan(0);
      expect(result.current.result?.christiansenFactor).toBeGreaterThan(0);
      expect(result.current.result?.residualPressureBar).toBeDefined();
    });

    it("détecte le statut incomplet et liste les champs manquants si un champ requis est mis à zéro ou vidé", () => {
      const { result } = renderHook(() => useHydraulicAnalysis({ field: dummyField }));

      act(() => {
        result.current.updateField("flowRate", 0);
      });

      expect(result.current.isComplete).toBe(false);
      expect(result.current.missingFields).toContain("Débit source (m³/h)");
      expect(result.current.result).toBeNull();
    });

    it("met à jour les paramètres réactifs et recalcule immédiatement", () => {
      const { result } = renderHook(() => useHydraulicAnalysis({ field: dummyField }));

      const initialVelocity = result.current.result?.velocity;

      // Augmentation du diamètre : la vitesse doit baisser
      act(() => {
        result.current.updateField("internalDiameter", 90);
      });

      expect(result.current.result?.velocity).toBeLessThan(initialVelocity!);
    });
  });

  describe("Interface Utilisateur HydraulicPanel", () => {
    it("affiche les sections Entrées Techniques, Résultats et Unités sans aucun mock", () => {
      render(<HydraulicPanel field={dummyField} />);

      // Titres et en-têtes
      expect(screen.getByText(/Calculateur & Bilan Hydraulique \(Hazen-Williams\)/i)).toBeInTheDocument();
      expect(screen.getByText(/1\. Variables d'Entrée & Hydraulique Source/i)).toBeInTheDocument();
      expect(screen.getByText(/2\. Bilan Énergétique & Résolution au Point Critique/i)).toBeInTheDocument();

      // Unités clairement explicitées
      expect(screen.getAllByText(/m³\/h/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Bar/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/mm/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/sorties/i).length).toBeGreaterThan(0);

      // Indicateurs clés du bilan énergétique
      expect(screen.getByText(/Vitesse fluide \(v\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Pertes Linéaires \(hf\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Pression Résiduelle/i)).toBeInTheDocument();
      expect(screen.getByText(/Calcul Actif \(Temps Réel\)/i)).toBeInTheDocument();
    });

    it("affiche le bandeau 'Dimensionnement incomplet' si un champ obligatoire est vidé", () => {
      render(<HydraulicPanel field={dummyField} />);

      // On vide le champ longueur
      const lengthInput = screen.getByPlaceholderText(/Ex: 100/i);
      fireEvent.change(lengthInput, { target: { value: "" } });

      expect(screen.getAllByText(/Dimensionnement incomplet/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Longueur de conduite \(m\)/i)).toBeInTheDocument();
    });

    it("déclenche un bandeau d'alerte rouge si la pression résiduelle est insuffisante", () => {
      render(<HydraulicPanel field={dummyField} />);

      // On force une pression statique très faible (ex: 0.2 Bar) et une pression requise élevée (3.0 Bar)
      const staticPressureInput = screen.getByPlaceholderText(/Ex: 2\.5/i);
      fireEvent.change(staticPressureInput, { target: { value: "0.2" } });

      const requiredPressureInput = screen.getByPlaceholderText("1.0");
      fireEvent.change(requiredPressureInput, { target: { value: "3.0" } });

      // Bandeau d'alerte rouge non bloquant
      expect(screen.getByText(/Alerte Rouge : Pression résiduelle critique insuffisante/i)).toBeInTheDocument();
    });

    it("permet de basculer l'unité de pression entre Bar et mCE", () => {
      render(<HydraulicPanel field={dummyField} />);

      const mceButton = screen.getByRole("button", { name: "mCE" });
      fireEvent.click(mceButton);

      // L'étiquette de l'unité passe à mCE
      expect(screen.getAllByText("mCE").length).toBeGreaterThan(0);
    });
  });
});
