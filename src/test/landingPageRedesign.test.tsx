import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

  it("affiche les 4 piliers du 1-Touch Launchpad pour action immédiate", () => {
    renderIndex();
    expect(screen.getByText("Diagnostiquer une plante")).toBeInTheDocument();
    expect(screen.getByText("Santé du Troupeau")).toBeInTheDocument();
    expect(screen.getByText("Boutiques & Intrants")).toBeInTheDocument();
    expect(screen.getByText("Concevoir ma Ferme")).toBeInTheDocument();
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
  });

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
});
