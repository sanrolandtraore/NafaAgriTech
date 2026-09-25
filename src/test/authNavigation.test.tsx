import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Auth from "@/pages/Auth";
import { AuthProvider } from "@/contexts/AuthContext";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Page d'Authentification & Inscription — Navigation & Retour Accueil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche le bouton 'Retour sur la page d'accueil' et redirige vers '/' au clic", () => {
    render(
      <MemoryRouter initialEntries={["/auth"]}>
        <AuthProvider>
          <Auth />
        </AuthProvider>
      </MemoryRouter>
    );

    const backHomeBtn = screen.getByRole("button", { name: /Retour sur la page d'accueil/i });
    expect(backHomeBtn).toBeInTheDocument();

    fireEvent.click(backHomeBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("affiche les onglets 'Connexion' et 'S'inscrire' et permet de basculer", () => {
    render(
      <MemoryRouter initialEntries={["/auth"]}>
        <AuthProvider>
          <Auth />
        </AuthProvider>
      </MemoryRouter>
    );

    const loginTab = screen.getByRole("button", { name: /^Connexion$/i });
    const registerTab = screen.getByRole("button", { name: /^S'inscrire$/i });

    expect(loginTab).toBeInTheDocument();
    expect(registerTab).toBeInTheDocument();

    // Basculer vers S'inscrire
    fireEvent.click(registerTab);
    expect(screen.getByText(/Inscription instantanée par numéro WhatsApp/i)).toBeInTheDocument();
  });

  it("s'ouvre directement en mode inscription lorsque l'URL contient '?mode=register'", () => {
    render(
      <MemoryRouter initialEntries={["/auth?mode=register"]}>
        <AuthProvider>
          <Auth />
        </AuthProvider>
      </MemoryRouter>
    );

    // Vérifie que le mode inscription est actif d'emblée
    expect(screen.getByText(/Inscription instantanée par numéro WhatsApp/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^S'inscrire$/i })).toHaveClass("bg-primary");
  });
});
