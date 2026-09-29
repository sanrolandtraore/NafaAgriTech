import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Index from "@/pages/Index";

// Mock des composants et assets lourds
vi.mock("@/assets/logo.png", () => ({ default: "logo.png" }));
vi.mock("@/assets/gallery/farm-field.jpg", () => ({ default: "farm-field.jpg" }));
vi.mock("@/assets/gallery/livestock.jpg", () => ({ default: "livestock.jpg" }));
vi.mock("@/assets/gallery/digital-farming.jpg", () => ({ default: "digital-farming.jpg" }));
vi.mock("@/assets/gallery/irrigation.jpg", () => ({ default: "irrigation.jpg" }));
vi.mock("@/assets/gallery/harvest.jpg", () => ({ default: "harvest.jpg" }));
vi.mock("@/assets/gallery/formation.jpg", () => ({ default: "formation.jpg" }));

vi.mock("@/lib/partnerStorage", () => ({
  partnerStorage: {
    getEntries: vi.fn().mockResolvedValue([]),
    getOffers: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("@/components/ThemeToggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Accès à la Marketplace Vitrine depuis la page d'accueil", () => {
  it("affiche les boutons d'accès direct vers la Marketplace Vitrine pour les agriculteurs et éleveurs", () => {
    render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );

    // 1. Boutons d'accès direct (Header & Hero)
    const vitrineBtns = screen.getAllByRole("button", { name: /Marketplace Vitrine/i });
    expect(vitrineBtns.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(vitrineBtns[0]);
    expect(mockNavigate).toHaveBeenCalledWith("/marketplace?role=producteurs");

    // 3. Espace Agriculteurs & Éleveurs dans la grille
    expect(screen.getByText("Agriculteurs & Éleveurs")).toBeInTheDocument();

    // 4. Bannière dédiée d'accès direct
    expect(screen.getByText(/Accès direct à la Marketplace Vitrine/i)).toBeInTheDocument();
    const openVitrineBtn = screen.getByRole("button", { name: /Ouvrir la Marketplace Vitrine/i });
    expect(openVitrineBtn).toBeInTheDocument();
    fireEvent.click(openVitrineBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/marketplace?role=producteurs");
  });
});
