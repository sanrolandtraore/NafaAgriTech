import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import CropLibraryPage from "@/pages/dashboard/expert/CropLibraryPage";

// Mock Supabase to return null/error so it falls back to the 235 offline sheets
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: null, error: new Error("offline") }),
      }),
    }),
  },
}));

describe("Interface Page Fiches Techniques Agronomiques (CropLibraryPage)", () => {
  it("affiche le titre avec les 235 cultures et les compteurs rapides", async () => {
    render(
      <BrowserRouter>
        <CropLibraryPage />
      </BrowserRouter>
    );

    expect(screen.getByText("Fiches Techniques Agronomiques")).toBeInTheDocument();
    expect(screen.getAllByText(/235/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/★ 188 BF Priorité/i)).toBeInTheDocument();
  });

  it("permet la recherche textuelle d'une culture", async () => {
    render(
      <BrowserRouter>
        <CropLibraryPage />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Rechercher par culture, nom scientifique/i);
    fireEvent.change(searchInput, { target: { value: "Sorgho blanc" } });

    expect(screen.getByText(/Sorgho blanc grain/i)).toBeInTheDocument();
    expect(screen.queryByText(/Tomate de pleine saison/i)).not.toBeInTheDocument();
  });

  it("supporte la sélection de cultures et affiche la barre d'action", async () => {
    render(
      <BrowserRouter>
        <CropLibraryPage />
      </BrowserRouter>
    );

    // Initialement aucune sélection visible
    expect(screen.queryByText(/culture\(s\) sélectionnée\(s\)/i)).not.toBeInTheDocument();

    // Cliquer sur le bouton 'Sélectionner ces X'
    const selectAllBtn = screen.getByText(/Sélectionner ces/i);
    fireEvent.click(selectAllBtn);

    // Maintenant la barre d'action est visible
    expect(screen.getByText(/culture\(s\) sélectionnée\(s\)/i)).toBeInTheDocument();
    expect(screen.getByText("Copier le résumé")).toBeInTheDocument();
    expect(screen.getByText("Calculer les intrants")).toBeInTheDocument();
  });

  it("déplie une fiche technique au clic pour afficher ses paramètres NPK et variétés", async () => {
    render(
      <BrowserRouter>
        <CropLibraryPage />
      </BrowserRouter>
    );

    // Cliquer sur la première carte (ex: Maïs blanc grain)
    const cropTitle = screen.getByText(/Maïs blanc grain/i);
    fireEvent.click(cropTitle);

    // Vérifier l'affichage détaillé
    expect(screen.getByText(/Formule NPK recommandée/i)).toBeInTheDocument();
    expect(screen.getByText(/Variétés homologuées/i)).toBeInTheDocument();
    expect(screen.getByText(/Ravageurs majeurs/i)).toBeInTheDocument();
  });
});
