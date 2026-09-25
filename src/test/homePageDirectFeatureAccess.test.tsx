import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter, MemoryRouter, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";

describe("Accès direct aux fonctionnalités à partir de la page d'accueil", () => {
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
    expect(screen.getByText(/Accéder à toute la suite des 39 outils agronomiques/i)).toBeInTheDocument();

    // Outils intelligents accessibles directement
    expect(screen.getByText("GPS")).toBeInTheDocument();
    expect(screen.getByText("Inspection")).toBeInTheDocument();
    expect(screen.getByText("Diagnostic IA")).toBeInTheDocument();
    expect(screen.getByText("Irrigation")).toBeInTheDocument();
    expect(screen.getByText("Devis")).toBeInTheDocument();
    expect(screen.getByText("Cartographie")).toBeInTheDocument();
  });

  it("permet à un visiteur non connecté d'accéder aux fonctionnalités sans blocage vers /auth (Mode Découverte Terrain)", async () => {
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
            <Route path="/auth" element={<div>Page Connexion</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Vérifie que l'utilisateur accède au contenu de la fonctionnalité
    const content = await screen.findByTestId("feature-content", {}, { timeout: 10000 });
    expect(content).toBeInTheDocument();

    // Vérifie la présence du bandeau Mode Découverte Terrain
    expect(screen.getByText(/Mode Découverte Terrain 100% Hors-ligne/i)).toBeInTheDocument();
  });

  it("ouvre les services agronomiques directement en mode découverte pour un visiteur", async () => {
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
            <Route path="/auth" element={<div>Page Connexion</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    const content = await screen.findByTestId("agronomic-services-content", {}, { timeout: 10000 });
    expect(content).toBeInTheDocument();
    expect(screen.getByText(/Mode Découverte Terrain 100% Hors-ligne/i)).toBeInTheDocument();
  });
});
