import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import * as AuthContextModule from "@/contexts/AuthContext";
import NafaGeniusPage from "@/pages/dashboard/NafaGeniusPage";

describe("NafaGeniusPage & NafaGeniusStudio", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: { id: "user-agronome-1", email: "agronome@sahel.bf" } as any,
      profile: {
        id: "user-agronome-1",
        role: "agronome" as any,
        full_name: "Dr. Oumarou Sawadogo",
        phone: "+226 70 20 30 40",
        city: "Ouagadougou",
      } as any,
      role: "agronome" as any,
      loading: false,
      session: {} as any,
      userRoles: ["agronome"],
      activeRole: "agronome",
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      updateProfile: vi.fn(),
      switchRole: vi.fn(),
      hasRole: vi.fn().mockReturnValue(true),
      isOffline: false,
      isLoaded: true,
    } as any);
  });

  it("se charge et monte correctement sans aucune exception runtime sur l'onglet IRRIS par défaut", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/genius"]}>
        <NafaGeniusPage />
      </MemoryRouter>
    );

    // Titre principal NAFA Genius
    expect(screen.getByRole("heading", { name: /NAFA Genius/i })).toBeInTheDocument();

    // Les 3 onglets principaux d'ingénierie
    expect(screen.getByRole("tab", { name: /1\. Modèle IRRIS/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /2\. Devis Express en FCFA/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /3\. Dossier & Devis PDF/i })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Diagnostic/i })).not.toBeInTheDocument();

    // Vérifie le contenu de l'onglet 1 (Modèle IRRIS)
    expect(screen.getByText(/Modèle IRRIS — Conception/i)).toBeInTheDocument();
  });

  it("ouvre et affiche l'onglet Devis Express en FCFA via le paramètre URL tab=validation_devis", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/genius?tab=validation_devis"]}>
        <NafaGeniusPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/DEVIS ESTIMATIF ET QUANTITATIF/i)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /2\. Devis Express en FCFA/i })).toHaveAttribute("data-state", "active");
  });

  it("ouvre et affiche l'onglet Dossier & Devis PDF via le paramètre URL tab=export_pro", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/genius?tab=export_pro"]}>
        <NafaGeniusPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Dossier Technique & Devis Prêt à Imprimer/i)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /3\. Dossier & Devis PDF/i })).toHaveAttribute("data-state", "active");
  });

  it("gère de manière sécurisée les paramètres URL sans onglet diagnostic", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/genius?tab=diagnostic"]}>
        <NafaGeniusPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /NAFA Genius/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /1\. Modèle IRRIS/i })).toHaveAttribute("data-state", "active");
    expect(screen.queryByRole("tab", { name: /Diagnostic/i })).not.toBeInTheDocument();
  });

  it("exécute le recalcul IRRIS et met à jour le projet et le devis sans crash", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/genius"]}>
        <NafaGeniusPage />
      </MemoryRouter>
    );

    const recalculerBtn = screen.getByRole("button", { name: /Recalculer/i });
    expect(recalculerBtn).toBeInTheDocument();
    
    // Clic sur Recalculer déclenche handleIrrisCalculated sans erreur
    recalculerBtn.click();
    
    expect(screen.getByText(/Modèle IRRIS — Conception/i)).toBeInTheDocument();
  });

  it("affiche la section de personnalisation expert (Énergie, Pompe, Tuyauterie & Marketplace)", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/genius"]}>
        <NafaGeniusPage />
      </MemoryRouter>
    );

    // Section 4 de personnalisation avancée
    expect(screen.getByText(/4\. Personnalisation Ingénieur/i)).toBeInTheDocument();
    expect(screen.getByText(/A\. Source d'Énergie du Projet/i)).toBeInTheDocument();
    expect(screen.getByText(/B\. Pompe & Motorisation/i)).toBeInTheDocument();
    expect(screen.getByText(/C\. Tuyauterie, Conduites & Goutteurs/i)).toBeInTheDocument();

    // Bordereau Marketplace interactif
    expect(screen.getByText(/Bordereau & Prix Marketplace Interactifs/i)).toBeInTheDocument();
    expect(screen.getAllByText(/FASO SOLAIRE & POMPAGE SARL/i).length).toBeGreaterThan(0);
  });
});

