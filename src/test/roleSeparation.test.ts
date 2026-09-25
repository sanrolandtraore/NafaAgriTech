import { describe, it, expect } from "vitest";
import {
  agriculteurNav,
  agronomeNav,
  eleveurNav,
  partenaireNav,
  getNavForRole,
  getNavLabel,
  roleLabelKeys,
  roleIcons,
} from "@/components/RoleSidebar";
import { Store, Beef, Microscope } from "lucide-react";

describe("Architecture & Séparation Stricte des Rôles : Agriculteur vs Agronome & Conseil vs Éleveur vs Partenaire", () => {
  it("agriculteurNav contains STRICTLY Marketplace des Services and zero technical tools", () => {
    const paths = agriculteurNav.map((item) => item.to);

    // Seul le marketplace des services apparaît
    expect(paths).toContain("/dashboard/marketplace");
    expect(paths.length).toBe(1);

    // Zéro outil technique agronomique dans le module Agriculteur
    expect(paths).not.toContain("/dashboard/crop-planning");
    expect(paths).not.toContain("/dashboard/crops");
    expect(paths).not.toContain("/dashboard/parcels");
    expect(paths).not.toContain("/dashboard/scouting");
    expect(paths).not.toContain("/dashboard/inspections");
    expect(paths).not.toContain("/dashboard/genius");
    expect(paths).not.toContain("/dashboard/crop-library");
    expect(paths).not.toContain("/dashboard/services");
    expect(paths).not.toContain("/dashboard/expert-diagnosis");

    // Zéro bétail / médecine vétérinaire
    expect(paths).not.toContain("/dashboard/animals");
    expect(paths).not.toContain("/dashboard/animal-health");
    expect(paths).not.toContain("/dashboard/animal-feeding");
    expect(paths).not.toContain("/dashboard/animal-reproduction");
    expect(paths).not.toContain("/dashboard/livestock-services");
  });

  it("agronomeNav contains ALL technical agronomic and engineering tools for Agronome & Conseil", () => {
    const paths = agronomeNav.map((item) => item.to);

    // Tous les outils techniques d'ingénierie sont regroupés ici
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

  it("eleveurNav contains strictly Pôle Élevage features, never crops or plant irrigation", () => {
    const paths = eleveurNav.map((item) => item.to);

    // Pôle Élevage inclus
    expect(paths).toContain("/dashboard/animals");
    expect(paths).toContain("/dashboard/animal-health");
    expect(paths).toContain("/dashboard/animal-feeding");
    expect(paths).toContain("/dashboard/animal-reproduction");
    expect(paths).toContain("/dashboard/livestock-services");

    // Zéro culture / fiches végétales dans le Pôle Élevage
    expect(paths).not.toContain("/dashboard/crops");
    expect(paths).not.toContain("/dashboard/crop-planning");
    expect(paths).not.toContain("/dashboard/crop-library");
  });

  it("partenaireNav contains strictly the 11 isolated sections of the dedicated Partner Space", () => {
    const paths = partenaireNav.map((item) => item.to);

    // Les 11 sections réglementaires strictes
    expect(paths).toContain("/dashboard/partner-space?tab=dashboard");
    expect(paths).toContain("/dashboard/partner-space?tab=presentation");
    expect(paths).toContain("/dashboard/partner-space?tab=services");
    expect(paths).toContain("/dashboard/partner-space?tab=produits");
    expect(paths).toContain("/dashboard/partner-space?tab=realisations");
    expect(paths).toContain("/dashboard/partner-space?tab=galerie");
    expect(paths).toContain("/dashboard/partner-space?tab=avis");
    expect(paths).toContain("/dashboard/partner-space?tab=contact");
    expect(paths).toContain("/dashboard/partner-space?tab=devis");
    expect(paths).toContain("/dashboard/partner-space?tab=commandes");
    expect(paths).toContain("/dashboard/partner-space?tab=statistiques");
    expect(paths.length).toBe(11);
  });

  it("getNavForRole strictly separates roles: agriculteur gets marketplace, expert gets agronomeNav", () => {
    expect(getNavForRole("agriculteur").main).toBe(agriculteurNav);
    expect(getNavForRole("farmer").main).toBe(agriculteurNav);
    expect(getNavForRole("eleveur").main).toBe(eleveurNav);

    // Expert & Agent technique obtiennent la suite complète agronomique
    expect(getNavForRole("expert").main).toBe(agronomeNav);
    expect(getNavForRole("agent_technique").main).toBe(agronomeNav);
    expect(getNavForRole("partenaire", "expert_agronome").main).toBe(agronomeNav);

    // Partenaire standard
    expect(getNavForRole("partenaire").main).toBe(partenaireNav);
    expect(getNavForRole("formation").main).toBe(partenaireNav);
  });

  it("roleLabelKeys and icons correctly reflect role separation", () => {
    expect(roleLabelKeys.agriculteur).toBe("roles.agriculteur");
    expect(roleLabelKeys.partenaire).toBe("roles.partenaire");
    expect(roleLabelKeys.agent_technique).toBe("roles.partenaire");
    expect(roleLabelKeys.formation).toBe("roles.partenaire");

    expect(roleIcons.agriculteur).toBe(Store);
    expect(roleIcons.farmer).toBe(Store);
    expect(roleIcons.expert).toBe(Microscope);
    expect(roleIcons.agent_technique).toBe(Microscope);
    expect(roleIcons.eleveur).toBe(Beef);
  });

  it("ensures zero 'nav.' prefixes exist in any navigation item and translates all required keys to French", () => {
    const allNavLists = [
      ...agriculteurNav,
      ...agronomeNav,
      ...eleveurNav,
      ...partenaireNav,
    ];

    allNavLists.forEach((item) => {
      expect(item.labelKey).not.toMatch(/^nav\./);
    });

    // Required replacements test
    const requiredMappings: Record<string, string> = {
      "nav.aiDiagnosis": "Diagnostic IA",
      "nav.prescriptions": "Prescriptions",
      "nav.scouting": "Inspection terrain",
      "nav.calculator": "Calculateur agricole",
      "nav.gpsMapping": "Cartographie GPS",
      "nav.technicalSheets": "Fiches techniques",
      "nav.quoteRequests": "Demandes de devis",
      "Vitrine Publique": "Vitrine publique",
      "nav.providerSubscription": "Abonnement partenaire",
      "nav.settings": "Paramètres",
      "Marketplace des Services": "Marketplace des Services",
    };

    Object.entries(requiredMappings).forEach(([key, expectedLabel]) => {
      const resolved = getNavLabel({ to: "/dummy", labelKey: key, icon: Store });
      expect(resolved).toBe(expectedLabel);
    });
  });
});
