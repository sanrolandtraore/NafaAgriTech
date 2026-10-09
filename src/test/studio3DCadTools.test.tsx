import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Studio3DFarmModeler from "@/components/field-designer/Studio3DFarmModeler";
import { Farm, Field } from "@/types/fieldDesigner";

// Mock resize observer
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("Studio 3D — Suite CAO & Tracé Sur-Mesure Professionnel", () => {
  const mockFarm: Farm = {
    id: "farm-cad-test",
    name: "Domaine Agricole Sur-Mesure",
    producerName: "Ingénieur Kaboré",
    producerPhone: "+226 70 12 34 56",
    locality: "Kamboinsé",
    region: "Centre",
    province: "Kadiogo",
    commune: "Ouagadougou",
    villageSector: "Secteur 9",
    farmType: "ferme_integree",
    totalAreaHa: 10.0,
    mainCrops: ["Tomate", "Oignon"],
    livestockTypes: [],
    irrigationType: "Goutte-à-goutte solaire",
    photos: [],
    syncStatus: "synced",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockField: Field = {
    id: "field-cad-1",
    farmId: "farm-cad-test",
    name: "Périmètre Global Arpenté",
    points: [
      { lat: 12.350, lng: -1.620, alt: 300, label: "P1" },
      { lat: 12.355, lng: -1.620, alt: 301, label: "P2" },
      { lat: 12.355, lng: -1.615, alt: 302, label: "P3" },
      { lat: 12.350, lng: -1.615, alt: 300, label: "P4" },
    ],
    areaM2: 50000,
    areaHa: 5.0,
    perimeterM: 900,
    lengthM: 250,
    widthM: 200,
    orientationDeg: 0,
    soilType: "alluvial",
    currentCrop: "Maraîchage",
    status: "active",
    syncStatus: "synced",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it("affiche les 3 onglets du tiroir gauche : Catalogue, Tracer et Plan Ouvrages", () => {
    render(<Studio3DFarmModeler activeFarm={mockFarm} fields={[mockField]} />);

    expect(screen.getByRole("button", { name: /Catalogue/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Tracer$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Plan \(\d+\)/i })).toBeInTheDocument();
  });

  it("permet d'accéder à l'outil de tracé vectoriel CAO et de configurer un ouvrage", () => {
    render(<Studio3DFarmModeler activeFarm={mockFarm} fields={[mockField]} />);

    // Clic sur l'onglet Tracer
    const traceTabBtn = screen.getByRole("button", { name: /^Tracer$/i });
    fireEvent.click(traceTabBtn);

    expect(screen.getByText(/Tracé Vectoriel CAO/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Canalisation/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Clôture/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pivot 360°/i })).toBeInTheDocument();
    expect(screen.getByText(/JALONS SUR LE PLAN :/i)).toBeInTheDocument();
  });

  it("affiche la Console CAO d'Édition avec Modifier, Allonger, Arrondir et Supprimer", () => {
    render(<Studio3DFarmModeler activeFarm={mockFarm} fields={[mockField]} />);

    // Basculer vers l'onglet Liste des ouvrages du plan
    const planTabBtn = screen.getByRole("button", { name: /Plan \(\d+\)/i });
    fireEvent.click(planTabBtn);

    // Sélectionner un élément existant dans la liste
    const firstElementCard = screen.getByText(/Bâtiment Avicole Bioclimatique/i);
    fireEvent.click(firstElementCard);

    // Vérifie la console CAO inférieure
    expect(screen.getByText(/1\. Modifier \(Position & Angle\)/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Allonger & Étirer/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Arrondir & Courber/i)).toBeInTheDocument();
    expect(screen.getByText(/4\. Métrés & Actions/i)).toBeInTheDocument();

    // Vérifie les boutons Allonger
    expect(screen.getByRole("button", { name: /Allonger \+1m/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Allonger \+5m/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Allonger \+10m/i })).toBeInTheDocument();

    // Vérifie les boutons Arrondir
    expect(screen.getByRole("button", { name: /Vif \(0m\)/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Arrondi 1m/i })).toBeInTheDocument();

    // Vérifie boutons Pivoter, Dupliquer et Supprimer
    expect(screen.getByRole("button", { name: /Pivoter 45°/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Dupliquer/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /^Supprimer$/i }).length).toBeGreaterThan(0);
  });

  it("permet d'allonger la longueur d'un ouvrage sélectionné", () => {
    render(<Studio3DFarmModeler activeFarm={mockFarm} fields={[mockField]} />);

    const planTabBtn = screen.getByRole("button", { name: /Plan \(\d+\)/i });
    fireEvent.click(planTabBtn);

    const firstElement = screen.getByText(/Bâtiment Avicole Bioclimatique/i);
    fireEvent.click(firstElement);

    // Longueur initiale : 35 m
    expect(screen.getByText(/35 m/i)).toBeInTheDocument();

    // Clic sur Allonger +5m
    const plus5Btn = screen.getByTitle("Allonger +5m");
    fireEvent.click(plus5Btn);

    // La longueur doit passer à 40 m
    expect(screen.getByText(/40 m/i)).toBeInTheDocument();
  });

  it("permet d'arrondir les coins et d'activer le pivot circulaire 360°", () => {
    render(<Studio3DFarmModeler activeFarm={mockFarm} fields={[mockField]} />);

    const planTabBtn = screen.getByRole("button", { name: /Plan \(\d+\)/i });
    fireEvent.click(planTabBtn);

    const firstElement = screen.getByText(/Bâtiment Avicole Bioclimatique/i);
    fireEvent.click(firstElement);

    // Clic sur Arrondi 2.5m
    const roundBtn = screen.getByRole("button", { name: /Arrondi 2\.5m/i });
    fireEvent.click(roundBtn);
    expect(screen.getByText(/2\.5 m/i)).toBeInTheDocument();

    // Bascule pivot circulaire
    const pivotToggleBtn = screen.getByRole("button", { name: /Pivot \/ Cercle 360°/i });
    fireEvent.click(pivotToggleBtn);
    expect(screen.getByText(/Pivot 360° Actif/i)).toBeInTheDocument();
  });

  it("affiche l'onglet Plan Sur-Mesure & CAO avec export GeoJSON et JSON", () => {
    render(<Studio3DFarmModeler activeFarm={mockFarm} fields={[mockField]} />);

    const surMesureTabBtn = screen.getByRole("button", { name: /Plan Sur-Mesure & CAO/i });
    fireEvent.click(surMesureTabBtn);

    expect(screen.getByText(/Nom du Projet \/ Exploitation/i)).toBeInTheDocument();
    expect(screen.getByText(/Superficie Totale du Domaine \(Hectares\)/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Nouveau Plan Vierge Sur-Mesure/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Exporter Plan CAO \(JSON\)/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Exporter GeoJSON \(Standard SIG\)/i })).toBeInTheDocument();
    expect(screen.getByText(/Importer Plan CAO/i)).toBeInTheDocument();
  });
});
