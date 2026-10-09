import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AnimalCountingPage from "@/pages/livestock/AnimalCountingPage";
import { TooltipProvider } from "@/components/ui/tooltip";

// Mock Supabase to ensure offline resilience
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
      }),
    }),
  },
}));

describe("Module Vétérinaire & Élevage — Comptage & Densité d'Élevage (AnimalCountingPage)", () => {
  it("se charge sans crash et affiche les options de comptage et de densité", () => {
    render(
      <BrowserRouter>
        <TooltipProvider>
          <AnimalCountingPage />
        </TooltipProvider>
      </BrowserRouter>
    );

    // Titre principal
    expect(screen.getByText(/Comptage & Densité d'Élevage/i)).toBeInTheDocument();

    // Badges et boutons fonctionnels
    expect(screen.getByText(/Historique PDF/i)).toBeInTheDocument();
    expect(screen.getByText(/100% Fonctionnel Hors-ligne/i)).toBeInTheDocument();

    // Section capture
    expect(screen.getByText(/Prendre photo/i)).toBeInTheDocument();
    expect(screen.getByText(/Importer photo/i)).toBeInTheDocument();
    expect(screen.getByText(/Vidéo Tracking/i)).toBeInTheDocument();

    // Paramètres d'analyse
    expect(screen.getByText(/Espèce animale/i)).toBeInTheDocument();
    expect(screen.getByText(/Rattacher à un lot du cheptel/i)).toBeInTheDocument();
    expect(screen.getByText(/Surface du bâtiment (•|\/) enclos \(m²\)/i)).toBeInTheDocument();
  });
});
