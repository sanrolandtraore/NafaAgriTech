import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter, MemoryRouter, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";

describe("Obligation de créer un compte pour utiliser les fonctionnalités", () => {
  beforeEach(() => {
    window.scrollTo = () => {};
    localStorage.clear();
  });

  it("affiche les outils et lanceurs d'accès direct sur la page d'accueil", () => {
    render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );

    // Bouton de lancement rapide de toute la suite d'outils
    expect(screen.getByText(/Accéder à la suite complète NAFA FIELD DESIGNER/i)).toBeInTheDocument();

    // Outils intelligents accessibles directement
    expect(screen.getByText("GPS")).toBeInTheDocument();
    expect(screen.getByText("Inspection")).toBeInTheDocument();
    expect(screen.getByText("Diagnostic")).toBeInTheDocument();
    expect(screen.getByText("Irrigation")).toBeInTheDocument();
    expect(screen.getByText("Devis")).toBeInTheDocument();
    expect(screen.getByText("Cartographie")).toBeInTheDocument();
  });

  it("exige qu'un utilisateur crée d'abord un compte en le redirigeant vers /auth?mode=register pour utiliser les fonctionnalités", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/smart-inspection"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/dashboard/smart-inspection"
              element={
                <ProtectedRoute>
                  <div data-testid="feature-content">Module Inspection Intelligente Terrain</div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/auth"
              element={<div data-testid="auth-page">Création de compte requise / Connexion</div>}
            />
            <Route
              path="/connexion"
              element={<div data-testid="auth-page">Création de compte requise / Connexion</div>}
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Vérifie que l'utilisateur non connecté est redirigé vers la page d'authentification pour créer son compte
    const authPage = await screen.findByTestId("auth-page", {}, { timeout: 10000 });
    expect(authPage).toBeInTheDocument();
    expect(screen.queryByTestId("feature-content")).not.toBeInTheDocument();
  });

  it("bloque l'accès aux services agronomiques tant que l'utilisateur n'a pas créé de compte ou ne s'est pas connecté", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/services"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/dashboard/services"
              element={
                <ProtectedRoute>
                  <div data-testid="agronomic-services-content">Suite Professionnelle d'Ingénierie</div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/auth"
              element={<div data-testid="auth-page">Création de compte requise / Connexion</div>}
            />
            <Route
              path="/connexion"
              element={<div data-testid="auth-page">Création de compte requise / Connexion</div>}
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    const authPage = await screen.findByTestId("auth-page", {}, { timeout: 10000 });
    expect(authPage).toBeInTheDocument();
    expect(screen.queryByTestId("agronomic-services-content")).not.toBeInTheDocument();
  });
});
