import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Index from "@/pages/Index";
import PublicExplorerPage from "@/pages/PublicExplorerPage";
import { AuthGateModal } from "@/components/auth/AuthGateModal";
import { AgroCalculator } from "@/components/expert/AgroCalculator";

describe("Modèle Hybride Découvrir avant de s'inscrire (NAFA-AGRITECH)", () => {
  beforeEach(() => {
    window.scrollTo = () => {};
    sessionStorage.clear();
    localStorage.clear();
  });

  it("affiche sur la Homepage les boutons principaux 'Explorer NAFA-AGRITECH' et 'Créer mon compte gratuitement'", () => {
    render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );

    // Bouton primaire d'exploration publique
    expect(screen.getByRole("button", { name: /Explorer NAFA-AGRITECH/i })).toBeInTheDocument();

    // Bouton secondaire d'inscription gratuite
    expect(screen.getByRole("button", { name: /Créer mon compte gratuitement/i })).toBeInTheDocument();

    // Bouton Explorer dans le header
    expect(screen.getAllByRole("button", { name: /Explorer/i }).length).toBeGreaterThanOrEqual(1);
  });

  it("permet d'accéder au Hub Public d'exploration sans compte et présente les modules clés", () => {
    render(
      <BrowserRouter>
        <PublicExplorerPage />
      </BrowserRouter>
    );

    // Titre et sous-titres vitrine
    expect(screen.getByText(/Hub de Découverte & Simulateurs/i)).toBeInTheDocument();
    expect(screen.getByText(/Découvrez la puissance de/i)).toBeInTheDocument();

    // Onglets des modules majeurs
    expect(screen.getByText(/1\. Calculateur de Projet/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. AI Copilote NAFA/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Cartographie & GPS/i)).toBeInTheDocument();
    expect(screen.getByText(/4\. Irrigation Designer/i)).toBeInTheDocument();
    expect(screen.getByText(/5\. Élevage & Zootechnie/i)).toBeInTheDocument();
    expect(screen.getByText(/6\. Fiches Techniques/i)).toBeInTheDocument();
    expect(screen.getByText(/7\. (Marché|Marketplace) & Services/i)).toBeInTheDocument();
  });

  it("fournit le simulateur agricole en accès libre avec déclencheur de sauvegarde douce (soft gate)", async () => {
    render(
      <BrowserRouter>
        <AgroCalculator />
      </BrowserRouter>
    );

    // Simulateur interactif présent
    expect(screen.getByText(/Calculatrice Agronomique Avancée/i)).toBeInTheDocument();
    expect(screen.getByText(/Sélectionner le type de culture/i)).toBeInTheDocument();
    expect(screen.getByText(/Superficie de la parcelle/i)).toBeInTheDocument();

    // Bouton de sauvegarde douce
    const saveBtn = screen.getByRole("button", { name: /Enregistrer mon résultat/i });
    expect(saveBtn).toBeInTheDocument();

    // Clic pour un visiteur non authentifié -> ouvre le modal d'inscription
    fireEvent.click(saveBtn);
    expect(await screen.findByText(/Enregistrez votre simulation & Débloquez votre espace/i)).toBeInTheDocument();
  });

  it("affiche le modal AuthGateModal avec conservation de la simulation et arguments de conversion", () => {
    const onOpenChange = () => {};
    render(
      <BrowserRouter>
        <AuthGateModal
          open={true}
          onOpenChange={onOpenChange}
          title="Sauvegardez votre simulation"
          description="Créez votre compte gratuitement pour sauvegarder vos exploitations, parcelles, diagnostics et projets."
          actionLabel="Créer mon compte gratuitement"
          simulationPayload={{ crop: "Maïs", area: 2.5 }}
        />
      </BrowserRouter>
    );

    // Arguments de valeur pour s'inscrire
    expect(screen.getByText(/Sauvegardez votre simulation/i)).toBeInTheDocument();
    expect(screen.getByText(/Créez votre compte gratuitement pour sauvegarder vos exploitations/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Créer mon compte gratuitement/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /J'ai déjà un compte/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continuer à tester/i })).toBeInTheDocument();
  });
});
