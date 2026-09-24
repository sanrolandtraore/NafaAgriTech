import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import ScoutingPage from "@/pages/dashboard/ScoutingPage";

describe("ScoutingPage - Suivi des Parcelles & Patrouille Agronomique", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("se charge sans crash ni erreur de référence (ArrowRight, Sparkles, etc.)", async () => {
    render(
      <BrowserRouter>
        <ScoutingPage />
      </BrowserRouter>
    );

    // Titre principal
    expect(screen.getByText(/Scouting & Suivi des Parcelles/i)).toBeInTheDocument();

    // Bannière d'accès au module d'inspection avancée (contenant Sparkles et ArrowRight)
    expect(screen.getByText(/NAFA Genius IA • Module d'Inspection Avancé/i)).toBeInTheDocument();
    expect(screen.getByText(/Lancer l'Inspection IA/i)).toBeInTheDocument();

    // Boutons d'action
    expect(screen.getByRole("button", { name: /Relevé rapide/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Inspection Intelligente IA/i })).toBeInTheDocument();

    // Cartes de statistiques
    expect(screen.getByText(/Total inspections/i)).toBeInTheDocument();
    expect(screen.getByText(/Problèmes critiques/i)).toBeInTheDocument();
  });

  it("affiche l'état initial des sessions de scouting ou le message d'attente sans bloquer", async () => {
    render(
      <BrowserRouter>
        <ScoutingPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Aucune session de scouting trouvée/i)).toBeInTheDocument();
    });
  });
});
