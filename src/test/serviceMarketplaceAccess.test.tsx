import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import ServiceMarketplacePage from "@/pages/dashboard/ServiceMarketplacePage";

const mockAuth = {
  user: null as any,
  primaryRole: null as string | null,
  partnerType: "fournisseur_intrants" as any,
  roles: [] as string[],
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuth,
}));

vi.mock("@/components/marketplace/ProviderMap", () => ({
  default: () => <div data-testid="provider-map">Carte Prestataires</div>,
}));

vi.mock("@/lib/partnerStorage", () => ({
  partnerStorage: {
    getOffers: vi.fn().mockResolvedValue([
      {
        id: "offer-1",
        owner_id: "partner-1",
        partner_name: "Tracteurs du Faso",
        title: "Location Tracteur 75CV",
        description: "Labour et hersage grande surface",
        category: "machinisme",
        price_indication: "50000 FCFA/ha",
        unit: "par_hectare",
        location_name: "Ouagadougou, Centre",
        contact_phone: "+226 70 00 00 00",
        is_verified: true,
      },
    ]),
  },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [] }),
        }),
      }),
    }),
  },
}));

describe("Accès direct à la Marketplace Vitrine pour Agriculteurs, Éleveurs et Visiteurs", () => {
  it("autorise un visiteur non connecté (depuis la page d'accueil) à voir la Marketplace Vitrine sans aucun blocage", async () => {
    mockAuth.user = null;
    mockAuth.primaryRole = null;
    mockAuth.partnerType = "fournisseur_intrants";

    render(
      <TooltipProvider>
        <BrowserRouter>
          <ServiceMarketplacePage />
        </BrowserRouter>
      </TooltipProvider>
    );

    // Vérifie que l'en-tête de la Marketplace Vitrine est affiché
    await waitFor(() => {
      expect(screen.getByText("Marketplace Vitrine NAFA")).toBeInTheDocument();
    });

    // Le message de blocage "Accès Réservé aux Agriculteurs & Éleveurs" NE DOIT PAS apparaître
    expect(screen.queryByText("Accès Réservé aux Agriculteurs & Éleveurs")).toBeNull();

    // L'offre de prestation est visible
    expect(await screen.findByText("Location Tracteur 75CV")).toBeInTheDocument();
  });

  it("autorise un exploitant agricole connecté (agriculteur) à accéder et commander sur la Marketplace Vitrine", async () => {
    mockAuth.user = { id: "user-agri-123" };
    mockAuth.primaryRole = "agriculteur";
    mockAuth.partnerType = "fournisseur_intrants"; // même si résiduel en cache

    render(
      <TooltipProvider>
        <BrowserRouter>
          <ServiceMarketplacePage />
        </BrowserRouter>
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Marketplace Vitrine NAFA")).toBeInTheDocument();
    });

    expect(screen.queryByText("Accès Réservé aux Agriculteurs & Éleveurs")).toBeNull();
    expect(await screen.findByText("Location Tracteur 75CV")).toBeInTheDocument();
  });

  it("autorise un éleveur connecté (eleveur) à accéder à la Marketplace Vitrine", async () => {
    mockAuth.user = { id: "user-eleveur-456" };
    mockAuth.primaryRole = "eleveur";
    mockAuth.partnerType = "fournisseur_intrants";

    render(
      <TooltipProvider>
        <BrowserRouter>
          <ServiceMarketplacePage />
        </BrowserRouter>
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Marketplace Vitrine NAFA")).toBeInTheDocument();
    });

    expect(screen.queryByText("Accès Réservé aux Agriculteurs & Éleveurs")).toBeNull();
    expect(await screen.findByText("Location Tracteur 75CV")).toBeInTheDocument();
  });
});
