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

describe("Landing Page Redesign - UX Architect Standards", () => {
  beforeEach(() => {
    window.scrollTo = () => {};
  });

  it("affiche la proposition de valeur principale en moins de 30 secondes", () => {
    renderIndex();
    expect(screen.getByText(/L'agriculture et l'élevage intelligents/i)).toBeInTheDocument();
    expect(screen.getByText(/à portée de main/i)).toBeInTheDocument();
    expect(screen.getByText(/100% Hors-Ligne • Certifié Sahel/i)).toBeInTheDocument();
  });

  it("détache tout diagnostic et la section 1-Touch de la page d'accueil", () => {
    renderIndex();
    // Le diagnostic doit être absent de la page d'accueil (réservé aux agronomes et vétérinaires)
    expect(screen.queryByText("Diagnostiquer une plante")).toBeNull();
    expect(screen.queryByText("Diagnostic IA")).toBeNull();
    expect(screen.queryByText("Diagnostic Plante IA")).toBeNull();
    expect(screen.queryByText(/Accès direct 1-Touch/i)).toBeNull();
    expect(screen.queryByText(/Que souhaitez-vous faire maintenant/i)).toBeNull();

    // Pour l'agriculteur, l'outil principal est Planification des Cultures
    expect(screen.getAllByText("Planification des Cultures").length).toBeGreaterThanOrEqual(1);
  });

  it("conserve impérativement les piliers officiels (Entreprises, Écosystème, Marché, Terrain)", async () => {
    renderIndex();
    // Réseau des Entreprises & Partenaires Officiels Agréés (chargé asynchronement)
    expect(await screen.findByText(/Réseau des Entreprises & Partenaires Officiels Agréés/i)).toBeInTheDocument();

    // Écosystème Actif NAFA-AGRITECH
    expect(screen.getByText(/Écosystème Actif NAFA-AGRITECH/i)).toBeInTheDocument();

    // Marché Certifié du Sahel - Matériels & Intrants de nos Partenaires
    expect(screen.getByText(/Marché Certifié du Sahel/i)).toBeInTheDocument();
    expect(screen.getByText(/Matériels & Intrants de nos Partenaires/i)).toBeInTheDocument();

    // Conçu pour le terrain - Rapide. Léger. Fonctionnel sans connexion.
    expect(screen.getByText(/Conçu pour le terrain/i)).toBeInTheDocument();
    expect(screen.getByText(/Rapide\. Léger\. Fonctionnel sans connexion\./i)).toBeInTheDocument();
  });

  it("permet de basculer dynamiquement entre les 4 personas sans rechargement", () => {
    renderIndex();

    // Default persona is Agriculteur
    expect(screen.getByText("Protégez vos récoltes et maximisez vos rendements")).toBeInTheDocument();

    // Switch to Éleveur
    const elevageBtn = screen.getByRole("button", { name: /Éleveur & Pasteur/i });
    fireEvent.click(elevageBtn);
    expect(screen.getByText("Pilotez la santé de votre cheptel et optimisez la nutrition")).toBeInTheDocument();
    expect(screen.getByText("Santé & Carnet Sanitaire")).toBeInTheDocument();

    // Switch to Agronome / Expert
    const expertBtn = screen.getByRole("button", { name: /Agronome & Vétérinaire/i });
    fireEvent.click(expertBtn);
    expect(screen.getByText("Concevez des exploitations modernes et délivrez des ordonnances")).toBeInTheDocument();
    expect(screen.getAllByText("Copilote NAFA Genius").length).toBeGreaterThanOrEqual(1);

    // Switch to Entreprise Partenaire
    const partBtn = screen.getByRole("button", { name: /Entreprise & Fournisseur/i });
    fireEvent.click(partBtn);
    expect(screen.getByText("Distribuez vos matériels et services aux producteurs du Sahel")).toBeInTheDocument();
  }, 15000);

  it("mentionne les sources scientifiques vérifiées du RAG pour garantir le zéro-hallucination", () => {
    renderIndex();
    expect(screen.getByText("INERA")).toBeInTheDocument();
    expect(screen.getByText("CIRAD")).toBeInTheDocument();
    expect(screen.getByText("FAO-56")).toBeInTheDocument();
    expect(screen.getByText("CSP-CILSS")).toBeInTheDocument();
  });

  it("intègre la barre mobile sticky 1-touch pour smartphones", () => {
    renderIndex();
    const asideMobile = screen.getByRole("complementary", { name: /Actions rapides mobiles/i });
    expect(asideMobile).toBeInTheDocument();
    expect(asideMobile).toHaveClass("md:hidden");
  });

  it("respecte la règle stricte Zéro-Emoji dans les textes affichés", () => {
    const { container } = renderIndex();
    const textContent = container.textContent || "";
    // Emoji regex checking standard unicode emoji ranges
    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(textContent)).toBe(false);
  });

  it("liste uniquement les 4 acteurs en entête (Agriculteur, Éleveur, Agronome, Entreprise)", () => {
    renderIndex();
    const nav = screen.getByRole("navigation", { name: /Acteurs NAFA-AGRITECH/i });
    expect(nav).toBeInTheDocument();

    // Vérifier la présence exclusive des 4 acteurs
    expect(within(nav).getByText("Agriculteur & Maraîcher")).toBeInTheDocument();
    expect(within(nav).getByText("Éleveur & Pasteur")).toBeInTheDocument();
    expect(within(nav).getByText("Agronome & Vétérinaire")).toBeInTheDocument();
    expect(within(nav).getByText("Entreprise & Fournisseur")).toBeInTheDocument();

    // S'assurer qu'aucun autre lien générique n'est présent dans la navigation d'entête
    expect(within(nav).queryByText(/Outils Rapides/i)).toBeNull();
    expect(within(nav).queryByText(/Solutions Métiers/i)).toBeNull();
    expect(within(nav).queryByText(/Marché Partenaires/i)).toBeNull();
  });
});
