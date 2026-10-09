import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Studio3DFarmModeler from "@/components/field-designer/Studio3DFarmModeler";
import { MarketplaceMaterialPricePickerModal } from "@/components/field-designer/MarketplaceMaterialPricePickerModal";
import { materialsStorage, DEFAULT_BURKINA_PRICES } from "@/lib/fieldDesignerPrices";

// Mock resize observer
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("Studio 3D & Prix Réels Burkina Faso Marketplace", () => {
  it("initialise Studio3DFarmModeler sans crasher même si WebGL est désactivé", () => {
    // Le composant doit s'afficher sans erreur grâce au fallback automatique 2.5D universel
    render(<Studio3DFarmModeler />);
    expect(screen.getByText(/Modélisation 3D — Aménagement, Irrigation & Élevage/i)).toBeInTheDocument();
    expect(screen.getByText(/Prix Réels (Marché|Marketplace) \(BF\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Budget Aménagement Estimé/i)).toBeInTheDocument();
  });

  it("ouvre et charge la modale des prix réels Marketplace Burkina Faso", () => {
    const handleAddItem = vi.fn();
    render(
      <MarketplaceMaterialPricePickerModal
        open={true}
        onOpenChange={() => {}}
        onAddItem={handleAddItem}
      />
    );

    // Titre et description avec fournisseurs certifiés
    expect(screen.getByText(/Marketplace Matériaux & Prix Réels \(Burkina Faso\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/CIMBURKINA/i).length).toBeGreaterThan(0);

    // Vérifie la présence de prix réels comme CIMBURKINA ou Netafim
    const prices = materialsStorage.getAll();
    expect(prices.length).toBeGreaterThanOrEqual(15);
    const ciment = prices.find((p) => p.designation.includes("Ciment CPJ"));
    expect(ciment).toBeDefined();
    expect(ciment?.defaultUnitPriceFCFA).toBeGreaterThan(5000);
  });

  it("permet d'ajouter un matériel avec son prix réel en FCFA depuis le Marketplace", () => {
    const handleAddItem = vi.fn();
    render(
      <MarketplaceMaterialPricePickerModal
        open={true}
        onOpenChange={() => {}}
        onAddItem={handleAddItem}
      />
    );

    const addButtons = screen.getAllByRole("button", { name: /^Ajouter$/i });
    expect(addButtons.length).toBeGreaterThan(0);
    fireEvent.click(addButtons[0]);

    expect(handleAddItem).toHaveBeenCalledTimes(1);
    expect(handleAddItem.mock.calls[0][0]).toHaveProperty("unitPriceFCFA");
    expect(handleAddItem.mock.calls[0][0].unitPriceFCFA).toBeGreaterThan(0);
  });
});
