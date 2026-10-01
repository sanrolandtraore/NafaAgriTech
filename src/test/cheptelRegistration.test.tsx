import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AnimalsPage from "@/pages/livestock/AnimalsPage";
import { AuthProvider } from "@/contexts/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";

describe("Module Éleveur — Enregistrement du Cheptel", () => {
  beforeEach(() => {
    localStorage.clear();
    // Simulate active eleveur local session
    localStorage.setItem(
      "nafa_session_v1",
      JSON.stringify({
        userId: "11111111-2222-4333-8444-555555555555",
        email: "eleveur@nafa-agritech.bf",
        fullName: "Issa Traoré",
        roles: ["eleveur"],
        savedAt: Date.now(),
        profile: {
          full_name: "Issa Traoré",
          phone: "+226 70 00 00 00",
          email: "eleveur@nafa-agritech.bf",
          avatar_url: null,
        },
      })
    );
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <TooltipProvider>
        <MemoryRouter>
          <AuthProvider>
            {ui}
          </AuthProvider>
        </MemoryRouter>
      </TooltipProvider>
    );
  };

  it("affiche la page du registre du cheptel avec le bouton 'Ajouter au cheptel'", async () => {
    const { unmount } = renderWithProviders(<AnimalsPage />);

    expect(screen.getByText("Registre des Animaux & Troupeaux")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ajouter au cheptel/i })).toBeInTheDocument();
    expect(screen.getByText("Cheptel vif actif")).toBeInTheDocument();
    unmount();
  });

  it("ouvre le formulaire d'enregistrement et permet d'ajouter un bovin individuel au cheptel", async () => {
    const { unmount } = renderWithProviders(<AnimalsPage />);

    const openBtn = screen.getByRole("button", { name: /Ajouter au cheptel/i });
    fireEvent.click(openBtn);

    // Vérifie la présence du bouton de soumission
    const submitBtn = screen.getByRole("button", { name: /Enregistrer dans le cheptel/i });
    expect(submitBtn).toBeInTheDocument();

    // Renseigner le nom et le numéro d'identification
    const nameInput = screen.getByPlaceholderText(/Ex: Bella, Sultan, Rougeot/i);
    fireEvent.change(nameInput, { target: { value: "Sultan" } });

    const tagInput = screen.getByPlaceholderText(/Ex: BF-042-2026/i);
    fireEvent.change(tagInput, { target: { value: "BF-ZEBU-01" } });

    // Soumettre le formulaire
    fireEvent.click(submitBtn);

    // Vérifier que le sujet est enregistré et visible dans le registre
    await waitFor(() => {
      expect(screen.getByText("Sultan")).toBeInTheDocument();
    }, { timeout: 5000 });

    unmount();
  });

  it("permet d'enregistrer un lot de volailles avec effectif initial", async () => {
    const { unmount } = renderWithProviders(<AnimalsPage />);

    const openBtn = screen.getByRole("button", { name: /Ajouter au cheptel/i });
    fireEvent.click(openBtn);

    // Basculer sur suivi par lot
    const switchEl = screen.getByRole("switch");
    if (!switchEl.getAttribute("aria-checked") || switchEl.getAttribute("aria-checked") === "false") {
      fireEvent.click(switchEl);
    }

    // Renseigner le lot
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Ex: Lot poulets chair n°4/i)).toBeInTheDocument();
    });

    const lotNameInput = screen.getByPlaceholderText(/Ex: Lot poulets chair n°4/i);
    fireEvent.change(lotNameInput, { target: { value: "Bande Pondeuses Kamboinsin" } });

    const sizeInput = screen.getByPlaceholderText(/Ex: 500/i);
    fireEvent.change(sizeInput, { target: { value: "350" } });

    const submitBtn = screen.getByRole("button", { name: /Enregistrer dans le cheptel/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Bande Pondeuses Kamboinsin")).toBeInTheDocument();
    });

    unmount();
  });
});
