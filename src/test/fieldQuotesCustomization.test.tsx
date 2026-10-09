import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FieldQuotesTool } from "@/components/field-designer/FieldQuotesTool";
import { Farm, FarmBuilding, IrrigationProject } from "@/types/fieldDesigner";

// Mock resize observer
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("FieldQuotesTool — Personnalisation libre des prix et fournisseurs", () => {
  const dummyFarm: Farm = {
    id: "farm_test_1",
    name: "Exploitation Test Bazèga",
    producerName: "Alassane Ouedraogo",
    producerPhone: "+226 70 12 34 56",
    boundary: [
      { lat: 12.0, lng: -1.5 },
      { lat: 12.01, lng: -1.5 },
      { lat: 12.01, lng: -1.49 },
      { lat: 12.0, lng: -1.49 },
    ],
    areaHectares: 2.5,
    perimeterMeters: 800,
    center: { lat: 12.005, lng: -1.495 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const dummyBuildings: FarmBuilding[] = [
    {
      id: "bld_1",
      farmId: "farm_test_1",
      name: "Poulailler Pondeuses 500",
      type: "poultry",
      dimensions: { length: 15, width: 8, height: 3.5, surfaceArea: 120 },
      position: { lat: 12.005, lng: -1.495 },
      rotation: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  it("affiche le tableau de chiffrage avec champs de prix unitaire et de fournisseur modifiables", () => {
    const handleSave = vi.fn();
    render(
      <FieldQuotesTool
        farm={dummyFarm}
        buildings={dummyBuildings}
        irrigationProjects={[]}
        onSaveQuote={handleSave}
        savedQuotes={[]}
      />
    );

    // Titres et en-têtes
    expect(screen.getByText(/Métrés & Estimation des Matériaux \(FCFA\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Fournisseur Retenu/i)).toBeInTheDocument();
    expect(screen.getByText(/P\.U\. \(FCFA\) & Marché/i)).toBeInTheDocument();

    // Boutons de personnalisation
    expect(screen.getByRole("button", { name: /Ajouter manuellement/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Personnalisation & Tarifs/i })).toBeInTheDocument();

    // Permet d'ouvrir le panneau de personnalisation avancée
    const customToolsBtn = screen.getByRole("button", { name: /Personnalisation & Tarifs/i });
    fireEvent.click(customToolsBtn);

    expect(screen.getByText(/Personnalisation Globale des Prix & Fournisseurs/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /-10% \(Remise\)/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /\+10% \(Marge\)/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ex: CIMBURKINA, Faso Métal\.\.\./i)).toBeInTheDocument();
  });

  it("permet d'ajouter manuellement un article et de modifier son fournisseur et son prix libre", () => {
    const handleSave = vi.fn();
    render(
      <FieldQuotesTool
        farm={dummyFarm}
        buildings={[]}
        irrigationProjects={[]}
        onSaveQuote={handleSave}
        savedQuotes={[]}
      />
    );

    // Ajout manuel
    const addManualBtn = screen.getByRole("button", { name: /Ajouter manuellement/i });
    fireEvent.click(addManualBtn);

    // Vérifie la présence de l'article ajouté
    const designationInput = screen.getByDisplayValue("Nouvelle fourniture ou prestation agricole");
    expect(designationInput).toBeInTheDocument();

    // Modification du nom
    fireEvent.change(designationInput, { target: { value: "Grillage galvanisé triple torsion" } });
    expect(designationInput).toHaveValue("Grillage galvanisé triple torsion");

    // Modification du fournisseur
    const supplierInput = screen.getByDisplayValue("Fournisseur Local / Négocié");
    fireEvent.change(supplierInput, { target: { value: "Faso Métal Ouaga" } });
    expect(supplierInput).toHaveValue("Faso Métal Ouaga");

    // Modification du prix unitaire (initialement 10000)
    const priceInput = screen.getByDisplayValue("10000");
    fireEvent.change(priceInput, { target: { value: "18500" } });
    expect(priceInput).toHaveValue(18500);

    // Montant total mis à jour : 1 * 18500 = 18 500 F
    expect(screen.getAllByText(/18\s?500/i).length).toBeGreaterThan(0);
  });

  it("applique l'attribution de fournisseur groupé à tous les articles", () => {
    const handleSave = vi.fn();
    render(
      <FieldQuotesTool
        farm={dummyFarm}
        buildings={dummyBuildings}
        irrigationProjects={[]}
        onSaveQuote={handleSave}
        savedQuotes={[]}
      />
    );

    // Ouvre les outils
    fireEvent.click(screen.getByRole("button", { name: /Personnalisation & Tarifs/i }));

    const bulkInput = screen.getByPlaceholderText(/Ex: CIMBURKINA, Faso Métal\.\.\./i);
    fireEvent.change(bulkInput, { target: { value: "Comptoir Central du Faso" } });

    const applyBulkBtn = screen.getByRole("button", { name: /Appliquer à tous/i });
    fireEvent.click(applyBulkBtn);

    // Tous les inputs fournisseur doivent avoir été mis à jour
    const updatedSuppliers = screen.getAllByDisplayValue("Comptoir Central du Faso");
    expect(updatedSuppliers.length).toBeGreaterThan(0);
  });
});
