import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Index from "@/pages/Index";

const renderIndex = () => {
  return render(
    <BrowserRouter>
      <Index />
    </BrowserRouter>
  );
};

describe("Landing Page Premium - Architecture UX Fulcrum", () => {
  beforeEach(() => {
    window.scrollTo = () => {};
  });

  it("affiche le premier écran Hero Premium avec son slogan exact et son action principale (< 15 mots)", () => {
    renderIndex();

    // Slogan 1 ligne obligatoire
    expect(screen.getByText("La technologie au service de l'agriculture africaine.")).toBeInTheDocument();

    // Bouton unique principal
    const startMissionBtns = screen.getAllByRole("button", { name: /Commencer une mission/i });
    expect(startMissionBtns.length).toBeGreaterThanOrEqual(1);

    // Logo & Marque
    expect(screen.getAllByAltText("NAFA-AGRITECH").length).toBeGreaterThanOrEqual(1);
  });

  it("affiche le deuxième écran avec les 4 grandes cartes d'espaces métiers", () => {
    renderIndex();

    expect(screen.getByText("Choisissez votre espace")).toBeInTheDocument();

    // Carte 1 : Agronomes & Vétérinaires
    expect(screen.getByText("Agronomes & Vétérinaires")).toBeInTheDocument();

    // Carte 2 : Partenaires
    expect(screen.getByText("Partenaires")).toBeInTheDocument();

    // Carte 3 : Agriculteurs & Éleveurs
    expect(screen.getByText("Agriculteurs & Éleveurs")).toBeInTheDocument();

    // Carte 4 : Marketplace
    expect(screen.getAllByText("Marketplace").length).toBeGreaterThanOrEqual(1);
  });

  it("affiche le troisième écran avec les 6 outils intelligents (uniquement icône + 1 mot)", () => {
    renderIndex();

    expect(screen.getByText("Outils intelligents")).toBeInTheDocument();

    // 6 outils avec exactement 1 mot
    expect(screen.getByText("GPS")).toBeInTheDocument();
    expect(screen.getByText("Inspection")).toBeInTheDocument();
    expect(screen.getByText("Diagnostic IA")).toBeInTheDocument();
    expect(screen.getByText("Irrigation")).toBeInTheDocument();
    expect(screen.getByText("Devis")).toBeInTheDocument();
    expect(screen.getByText("Cartographie")).toBeInTheDocument();
  });

  it("affiche le quatrième écran Marketplace rapide avec les 6 catégories", () => {
    renderIndex();

    expect(screen.getByText("Marketplace rapide")).toBeInTheDocument();

    expect(screen.getByText("Machinisme & Travaux")).toBeInTheDocument();
    expect(screen.getByText("Produits Agricoles")).toBeInTheDocument();
    expect(screen.getByText("Produits d'Élevage")).toBeInTheDocument();
    expect(screen.getByText("Services Agricoles")).toBeInTheDocument();
    expect(screen.getByText("Services Vétérinaires")).toBeInTheDocument();
    expect(screen.getByText("Finance & Assurance")).toBeInTheDocument();
  });

  it("affiche le cinquième écran Partenaires proches avec distance et bouton Voir", async () => {
    renderIndex();

    expect(screen.getByText("Partenaires proches")).toBeInTheDocument();

    // Attente du chargement asynchrone des partenaires
    const voirButtons = await screen.findAllByRole("button", { name: "Voir" });
    expect(voirButtons.length).toBeGreaterThanOrEqual(1);

    // Vérification de la présence d'au moins un nom de partenaire certifié
    expect(screen.getByText(/SAPHYTO/i)).toBeInTheDocument();
  });

  it("intègre la navigation inférieure fixe avec le bouton central action principale", () => {
    renderIndex();

    const nav = screen.getByRole("navigation", { name: /Navigation principale inférieure/i });
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveClass("fixed");
    expect(nav).toHaveClass("bottom-0");

    // Éléments de navigation ciblés dans la barre
    expect(within(nav).getByRole("button", { name: /Accueil/i })).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: /Marketplace/i })).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: /Messages/i })).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: /Profil/i })).toBeInTheDocument();

    // Bouton central action principale : "Commencer une mission" / "Projets"
    expect(within(nav).getByRole("button", { name: /Commencer une mission/i })).toBeInTheDocument();
    expect(within(nav).getByText("Projets")).toBeInTheDocument();
  });

  it("respecte la règle stricte Zéro-Emoji dans les textes affichés", () => {
    const { container } = renderIndex();
    const textContent = container.textContent || "";
    // Emoji regex checking standard unicode emoji ranges
    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(textContent)).toBe(false);
  });
});
