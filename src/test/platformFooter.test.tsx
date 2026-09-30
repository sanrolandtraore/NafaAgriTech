import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Footer from "@/components/Footer";

describe("Footer Professionnel NAFA-AGRITECH", () => {
  const renderFooter = () => {
    return render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );
  };

  it("affiche les informations officielles de NAFA-AGRITECH", () => {
    renderFooter();

    // Nom officiel
    expect(screen.getAllByText(/NAFA/i).length).toBeGreaterThanOrEqual(1);

    // Adresse officielle
    expect(screen.getAllByText(/Bobo-Dioulasso, Burkina Faso/i).length).toBeGreaterThanOrEqual(1);

    // Email officiel
    const mailLinks = screen.getAllByRole("link", { name: /nafaagritech@gmail\.com/i });
    expect(mailLinks.length).toBeGreaterThanOrEqual(1);
    expect(mailLinks[0]).toHaveAttribute("href", "mailto:nafaagritech@gmail.com");

    // Contacts téléphoniques
    const tel1 = screen.getByRole("link", { name: /\+226 75 77 48 52/i });
    expect(tel1).toHaveAttribute("href", "tel:+22675774852");

    const tel2 = screen.getByRole("link", { name: /\+226 50 13 49 20/i });
    expect(tel2).toHaveAttribute("href", "tel:+22650134920");
  });

  it("affiche la présentation officielle dans la colonne 1", () => {
    renderFooter();
    expect(
      screen.getByText(
        /Solutions agricoles, services techniques et technologies pour accompagner les producteurs, agronomes, éleveurs et entreprises agricoles en Afrique\./i
      )
    ).toBeInTheDocument();
  });

  it("intègre tous les liens obligatoires de la colonne Navigation avec routes réelles", () => {
    renderFooter();

    // Titre Navigation
    expect(screen.getByText("Navigation")).toBeInTheDocument();

    const expectedNav = [
      { text: "Accueil", href: "/" },
      { text: "À propos", href: "/a-propos" },
      { text: "Exploitations", href: "/dashboard/farms" },
      { text: "Agriculteurs", href: "/marketplace?role=producteurs" },
      { text: "Agronomes", href: "/dashboard/field-designer" },
      { text: "Éleveurs", href: "/marketplace?cat=produits_elevage&role=producteurs" },
      { text: "Partenaires", href: "/dashboard/partenaire-abonnement" },
      { text: "Marketplace", href: "/marketplace" },
      { text: "Missions terrain", href: "/dashboard/smart-inspection" },
      { text: "Contact", href: "/contact" },
    ];

    for (const item of expectedNav) {
      const link = screen.getByRole("link", { name: new RegExp(`^${item.text}$`, "i") });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", item.href);
    }
  });

  it("affiche la colonne Services avec les services proposés par NAFA-AGRITECH", () => {
    renderFooter();

    expect(screen.getByText("Services")).toBeInTheDocument();
    expect(screen.getByText(/Conception 2D & Arpentage GPS/i)).toBeInTheDocument();
    expect(screen.getByText(/Inspection intelligente hors-ligne/i)).toBeInTheDocument();
    expect(screen.getByText(/Diagnostic phytosanitaire certifié/i)).toBeInTheDocument();
    expect(screen.getByText(/Dimensionnement hydraulique & Solaire/i)).toBeInTheDocument();
    expect(screen.getByText(/Gestion du cheptel & Soins vétérinaires/i)).toBeInTheDocument();
    expect(screen.getByText(/Devis d'ingénierie chiffrés en FCFA/i)).toBeInTheDocument();
  });

  it("respecte la règle stricte Zéro-Emoji dans le contenu du footer", () => {
    const { container } = renderFooter();
    const text = container.textContent || "";
    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(text)).toBe(false);
  });
});
