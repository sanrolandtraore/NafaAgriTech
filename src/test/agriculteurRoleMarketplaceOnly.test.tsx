import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import {
  agriculteurNav,
  agronomeNav,
  getNavForRole,
  roleDisplayNames,
  roleIcons,
} from "@/components/RoleSidebar";
import RoleDashboardHome from "@/pages/dashboard/RoleDashboardHome";
import { Store, Microscope } from "lucide-react";

// Mock du AuthContext pour tester le rendu de RoleDashboardHome selon le rôle
const mockAuth = {
  primaryRole: "agriculteur",
  partnerType: null as string | null,
  user: { id: "test-user-id" },
  profile: { full_name: "Oumar Ouédraogo", role: "agriculteur" },
  loading: false,
  isOfflineSession: false,
  isGuestSession: false,
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuth,
}));

// Mock minimal des composants lourds
vi.mock("@/pages/dashboard/ServiceMarketplacePage", () => ({
  default: () => <div data-testid="service-marketplace-page">Marketplace des Services Agricoles</div>,
}));

vi.mock("@/pages/dashboard/ServicesPage", () => ({
  default: () => <div data-testid="agronomic-services-suite">Suite d'Outils Agronomiques (39 outils)</div>,
}));

vi.mock("@/pages/livestock/LivestockDashboardPage", () => ({
  default: () => <div data-testid="livestock-dashboard-page">Tableau de bord Cheptel</div>,
}));

vi.mock("@/pages/dashboard/partenaire/PartenaireDashboard", () => ({
  default: () => <div data-testid="partenaire-dashboard-page">Espace Partenaire</div>,
}));

describe("Exigence Métier : Séparation des rôles Agriculteur vs Agronome & Conseil", () => {
  it("1. Dans le module Agriculteur, SEUL le marketplace des services apparaît dans la navigation", () => {
    const paths = agriculteurNav.map((item) => item.to);

    // Seul le marketplace des services est présent
    expect(paths).toContain("/dashboard/marketplace");
    expect(paths.length).toBe(1);

    // Aucun outil technique agronomique
    expect(paths).not.toContain("/dashboard/crop-planning");
    expect(paths).not.toContain("/dashboard/crops");
    expect(paths).not.toContain("/dashboard/parcels");
    expect(paths).not.toContain("/dashboard/scouting");
    expect(paths).not.toContain("/dashboard/inspections");
    expect(paths).not.toContain("/dashboard/genius");
    expect(paths).not.toContain("/dashboard/crop-library");
    expect(paths).not.toContain("/dashboard/services");
    expect(paths).not.toContain("/dashboard/expert-diagnosis");
    expect(paths).not.toContain("/dashboard/expert-prescriptions");
    expect(paths).not.toContain("/dashboard/expert-calculator");
    expect(paths).not.toContain("/dashboard/expert-cartography");
  });

  it("2. L'accueil du module Agriculteur (RoleDashboardHome) affiche immédiatement le Marketplace des Services", () => {
    mockAuth.primaryRole = "agriculteur";
    mockAuth.partnerType = null;

    render(
      <BrowserRouter>
        <RoleDashboardHome />
      </BrowserRouter>
    );

    expect(screen.getByTestId("service-marketplace-page")).toBeInTheDocument();
    expect(screen.queryByTestId("agronomic-services-suite")).not.toBeInTheDocument();
  });

  it("3. Le reste des outils techniques est regroupé dans le module Agronome & Conseil", () => {
    const paths = agronomeNav.map((item) => item.to);

    // Suite complète d'ingénierie et d'outils techniques agronomiques
    expect(paths).toContain("/dashboard/services");
    expect(paths).toContain("/dashboard/crop-planning");
    expect(paths).toContain("/dashboard/parcels");
    expect(paths).toContain("/dashboard/scouting");
    expect(paths).toContain("/dashboard/inspections");
    expect(paths).toContain("/dashboard/genius");
    expect(paths).toContain("/dashboard/expert-diagnosis");
    expect(paths).toContain("/dashboard/expert-prescriptions");
    expect(paths).toContain("/dashboard/expert-calculator");
    expect(paths).toContain("/dashboard/expert-cartography");
    expect(paths).toContain("/dashboard/crop-library");
  });

  it("4. L'accueil du module Agronome & Conseil (RoleDashboardHome) affiche la Suite des Outils Agronomiques", () => {
    mockAuth.primaryRole = "expert";
    mockAuth.partnerType = null;

    render(
      <BrowserRouter>
        <RoleDashboardHome />
      </BrowserRouter>
    );

    expect(screen.getByTestId("agronomic-services-suite")).toBeInTheDocument();
    expect(screen.queryByTestId("service-marketplace-page")).not.toBeInTheDocument();
  });

  it("5. Les rôles et métadonnées sont strictement séparés", () => {
    expect(getNavForRole("agriculteur").main).toBe(agriculteurNav);
    expect(getNavForRole("farmer").main).toBe(agriculteurNav);

    expect(getNavForRole("expert").main).toBe(agronomeNav);
    expect(getNavForRole("agent_technique").main).toBe(agronomeNav);
    expect(getNavForRole("partenaire", "expert_agronome").main).toBe(agronomeNav);

    expect(roleDisplayNames.agriculteur).toBe("Agriculteur");
    expect(roleDisplayNames.expert).toBe("Agronome & Conseil");
    expect(roleDisplayNames.agent_technique).toBe("Agronome & Conseil");

    expect(roleIcons.agriculteur).toBe(Store);
    expect(roleIcons.farmer).toBe(Store);
    expect(roleIcons.expert).toBe(Microscope);
    expect(roleIcons.agent_technique).toBe(Microscope);
  });
});
