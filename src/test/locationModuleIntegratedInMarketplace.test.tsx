import { describe, it, expect, vi } from "vitest";
import { machinismeNav, getNavLabel } from "@/components/RoleSidebar";
import { SUBSCRIPTION_PLANS } from "@/lib/providerSubscription";

// Mock Supabase & navigation
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [] }),
        }),
      }),
    }),
  },
}));

vi.mock("@/lib/partnerStorage", () => ({
  partnerStorage: {
    getOffers: vi.fn().mockResolvedValue([
      {
        id: "offer-tracteur-1",
        owner_id: "prov-1",
        partner_name: "Faso Machinisme",
        title: "Tracteur Massey Ferguson 75CV",
        category: "machinisme",
        description: "Labour et hersage grande culture",
        price_indication: "25 000 FCFA / ha",
        unit: "hectare",
        location_name: "Bobo-Dioulasso, Hauts-Bassins",
        contact_phone: "+226 70 11 22 33",
      },
      {
        id: "offer-intrant-1",
        owner_id: "prov-2",
        partner_name: "AgriFaso Intrants",
        title: "Engrais NPK 14-23-14",
        category: "intrants_semences",
        description: "Sac de 50kg certifié",
        price_indication: "22 500 FCFA",
        unit: "sac",
        location_name: "Ouagadougou, Centre",
        contact_phone: "+226 70 44 55 66",
      },
    ]),
  },
}));

describe("Exigence Métier : Retrait complet du module Location autonome et intégration dans Achat d'intrants & Produits", () => {
  it("1. La navigation Machinisme ne contient plus de route isolée /dashboard/equipment mais pointe vers le catalogue unifié", () => {
    const equipNav = machinismeNav.find((item) => item.to === "/dashboard/equipment");
    expect(equipNav).toBeUndefined();

    const unifiedNav = machinismeNav.find((item) => item.to.includes("/dashboard/marketplace?cat=machinisme"));
    expect(unifiedNav).toBeDefined();
    expect(unifiedNav?.labelKey).toBe("Matériel & Intrants (Vente & Location)");
    expect(getNavLabel(unifiedNav!)).toBe("Matériel & Intrants (Vente & Location)");
  });

  it("2. Le pack pro prestataire référence le catalogue Matériel & Intrants (Vente & Location)", () => {
    const proPlan = SUBSCRIPTION_PLANS.find((p) => p.id === "pro_prestataire");
    expect(proPlan).toBeDefined();
    const tool = proPlan?.toolsIncluded.find((t) => t.route.includes("marketplace?cat=machinisme"));
    expect(tool).toBeDefined();
    expect(tool?.name).toBe("Matériel & Intrants (Vente & Location)");
  });
});
