/**
 * Tests Unitaires & Intégration :
 * 1. Élimination des Données Fictives & Compteurs Dynamiques Réels (Agriculteurs, Éleveurs, Partenaires)
 * 2. Bande Défilante des Partenaires (Logo Ticker)
 * 3. Module & Section de Témoignages Réels Utilisateurs
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import React from "react";
import {
  calculatePlatformMetrics,
  getCachedPlatformMetrics,
  usePlatformMetrics,
} from "@/lib/platformMetrics";
import { testimonialsStorage } from "@/lib/testimonialsStorage";
import { PartnerLogoTicker } from "@/components/landing/PartnerLogoTicker";
import { UserTestimonialsSection } from "@/components/landing/UserTestimonialsSection";
import { RealPlatformMetricsCounter } from "@/components/landing/RealPlatformMetricsCounter";

describe("Compteurs Réels & Zéro Donnée Fictive", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("calcule avec exactitude les entreprises partenaires sans gonfler artificiellement les chiffres", async () => {
    const metrics = await calculatePlatformMetrics();
    expect(metrics.isRealData).toBe(true);
    // Les entreprises partenaires réelles de base sont répertoriées dans partnerStorage (au moins 8 partenaires)
    expect(metrics.partnersCount).toBeGreaterThanOrEqual(8);
    // Les chiffres d'agriculteurs et éleveurs reflètent les données locales/distantes réelles
    expect(metrics.farmersCount).toBeGreaterThanOrEqual(0);
    expect(metrics.breedersCount).toBeGreaterThanOrEqual(0);
    expect(metrics.totalActors).toBe(
      metrics.farmersCount + metrics.breedersCount + metrics.partnersCount + metrics.expertsCount
    );
  });

  it("met à jour dynamiquement les comptes lors de l'enregistrement de profils réels", async () => {
    // Simuler l'enregistrement de deux exploitants réels dans le registre local
    const simulatedAccounts = {
      "+22670112233": {
        userId: "c8e23b61-4171-464a-9ceb-789a617650f1",
        email: "+22670112233@nafa.local",
        phone: "+22670112233",
        fullName: "Issa Ouedraogo",
        roles: ["agriculteur"],
        profile: { full_name: "Issa Ouedraogo", phone: "+22670112233", email: null, avatar_url: null },
        savedAt: Date.now(),
      },
      "+22678998877": {
        userId: "d9e23b61-4171-464a-9ceb-789a617650f2",
        email: "+22678998877@nafa.local",
        phone: "+22678998877",
        fullName: "Amadou Diallo",
        roles: ["eleveur"],
        profile: { full_name: "Amadou Diallo", phone: "+22678998877", email: null, avatar_url: null },
        savedAt: Date.now(),
      },
    };
    localStorage.setItem("nafa_phone_accounts_v1", JSON.stringify(simulatedAccounts));

    const metrics = await calculatePlatformMetrics();
    expect(metrics.farmersCount).toBeGreaterThanOrEqual(1);
    expect(metrics.breedersCount).toBeGreaterThanOrEqual(1);
  });

  it("met en cache les métriques pour un chargement instantané sans blocage réseau", async () => {
    await calculatePlatformMetrics();
    const cached = getCachedPlatformMetrics();
    expect(cached).not.toBeNull();
    expect(cached?.isRealData).toBe(true);
    expect(cached?.partnersCount).toBeGreaterThanOrEqual(8);
  });
});

describe("Composant RealPlatformMetricsCounter", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("affiche les 4 blocs de comptage dynamique avec badge de données réelles", async () => {
    render(<RealPlatformMetricsCounter />);

    expect(screen.getByText(/Écosystème Actif NAFA-AGRITECH/i)).toBeInTheDocument();
    expect(screen.getByText(/Données Réelles/i)).toBeInTheDocument();
    expect(screen.getByText(/Agriculteurs/i)).toBeInTheDocument();
    expect(screen.getByText(/Éleveurs/i)).toBeInTheDocument();
    expect(screen.getByText(/Partenaires/i)).toBeInTheDocument();
    expect(screen.getByText(/Experts Métiers/i)).toBeInTheDocument();
  });
});

describe("Bande Défilante des Partenaires (PartnerLogoTicker)", () => {
  it("affiche la bande défilante avec les entreprises partenaires réelles", async () => {
    render(
      <BrowserRouter>
        <PartnerLogoTicker />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Réseau des Entreprises & Partenaires Officiels Agréés/i)
      ).toBeInTheDocument();
    });

    // Vérifier la présence d'au moins un grand partenaire officiel
    const saphytoElements = screen.getAllByText(/SAPHYTO/i);
    expect(saphytoElements.length).toBeGreaterThan(0);
  });
});

describe("Gestion des Témoignages Réels (Zéro Avis Fictif)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("garantit un état initial transparent sans aucun faux avis préfabriqué", async () => {
    const list = testimonialsStorage.getLocalTestimonials();
    expect(list).toEqual([]);
  });

  it("permet à un utilisateur réel de soumettre son témoignage et le persiste localement", async () => {
    const created = await testimonialsStorage.submitTestimonial({
      author_name: "Boureima Traoré",
      author_role: "agriculteur",
      location: "Bama, Hauts-Bassins",
      organization: "Union Maraîchère de Bama",
      rating: 5,
      comment: "Le diagnostic mildiou sur mes oignons nous a évité une perte de récolte majeure.",
    });

    expect(created.id).toContain("testi-");
    expect(created.author_name).toBe("Boureima Traoré");
    expect(created.is_verified).toBe(true);

    const stored = testimonialsStorage.getLocalTestimonials();
    expect(stored.length).toBe(1);
    expect(stored[0].comment).toContain("diagnostic mildiou");
  });

  it("affiche l'interface de témoignages et permet d'ouvrir le formulaire d'avis", async () => {
    render(<UserTestimonialsSection />);

    expect(
      screen.getByText(/La voix des exploitants et partenaires du terrain/i)
    ).toBeInTheDocument();

    const ctaButton = screen.getByRole("button", { name: /Partager mon expérience/i });
    expect(ctaButton).toBeInTheDocument();

    fireEvent.click(ctaButton);

    await waitFor(() => {
      expect(screen.getByText(/Déposer un retour d'expérience réel/i)).toBeInTheDocument();
    });
  });
});
