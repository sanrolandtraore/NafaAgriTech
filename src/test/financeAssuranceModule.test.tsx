import { describe, it, expect } from "vitest";
import { institutionNav, getNavLabel } from "@/components/RoleSidebar";
import { partnerStorage, PartnerOffer } from "@/lib/partnerStorage";

describe("Module Finance & Assurance — Isolation Métier & Création Libre d'Offres", () => {
  describe("1. Cloisonnement Strict & Retrait de toute fonctionnalité hors Finance/Assurance", () => {
    it("ne contient aucun outil agronomique, mécanique, cheptel ou devis non-financier dans institutionNav", () => {
      const paths = institutionNav.map((item) => item.to);

      // Aucune route agronomique ou technique
      expect(paths).not.toContain("/dashboard/field-designer");
      expect(paths).not.toContain("/dashboard/genius");
      expect(paths).not.toContain("/dashboard/scouting");
      expect(paths).not.toContain("/dashboard/planning");
      expect(paths).not.toContain("/dashboard/smart-inspection");

      // Aucun outil cheptel ou vétérinaire
      expect(paths).not.toContain("/dashboard/animals");
      expect(paths).not.toContain("/dashboard/animal-health");
      expect(paths).not.toContain("/dashboard/animal-reproduction");
      expect(paths).not.toContain("/dashboard/animal-feeding");

      // Aucun espace partenaire généraliste avec devis machinisme/intrants
      expect(paths).not.toContain("/dashboard/partner-space");
      expect(paths).not.toContain("/dashboard/quote-requests");
      expect(paths).not.toContain("/dashboard/partners-directory");
    });

    it("contient exclusivement les 8 axes fondamentaux de la finance, assurance, marketing et conformité", () => {
      const paths = institutionNav.map((item) => item.to);

      expect(paths).toContain("/dashboard");
      expect(paths).toContain("/dashboard/partenaire-mes-offres");
      expect(paths).toContain("/dashboard/partenaire-assurance");
      expect(paths).toContain("/dashboard/partenaire-programmes");
      expect(paths).toContain("/dashboard/partenaire-marketing");
      expect(paths).toContain("/dashboard/partenaire-demandes");
      expect(paths).toContain("/dashboard/partenaire-kyc");
      expect(paths).toContain("/dashboard/partenaire-abonnement");
      expect(paths).toContain("/dashboard/settings");

      // Exactement 9 éléments dans la navigation
      expect(institutionNav.length).toBe(9);
    });

    it("résout tous les libellés de navigation sans clé brute manquante", () => {
      institutionNav.forEach((item) => {
        const label = getNavLabel(item);
        expect(label).toBeTruthy();
        expect(label.startsWith("nav.")).toBe(false);
      });
    });
  });

  describe("2. Capacité de Création de Services, Crédits, Assurances et Campagnes Marketing", () => {
    it("permet d'enregistrer une offre de crédit agricole avec conditions complètes", async () => {
      const creditPayload: Partial<PartnerOffer> & { title: string; partner_name: string } = {
        title: "Crédit Campagne Coton & Céréales 2026",
        partner_name: "Banque Agricole du Faso",
        category: "financement",
        description: "Financement des intrants, semences certifiées et main d'œuvre pour la saison des pluies.",
        price_indication: "Taux bonifié 6.5% / an",
        unit: "Échéance 10 mois (in fine)",
        location_name: "Hauts-Bassins, Boucle du Mouhoun",
        contact_phone: "+226 20 97 00 00",
        is_active: true,
      };

      const saved = await partnerStorage.saveOffer(creditPayload);
      expect(saved.id).toBeTruthy();
      expect(saved.title).toBe("Crédit Campagne Coton & Céréales 2026");
      expect(saved.category).toBe("financement");
      expect(saved.is_active).toBe(true);
    });

    it("permet d'enregistrer une police d'assurance agricole indicielle avec couverture sécheresse", async () => {
      const assurancePayload: Partial<PartnerOffer> & { title: string; partner_name: string } = {
        title: "Assurance Indicielle Sécheresse Sahel",
        partner_name: "Compagnie d'Assurance Agricole CIMA",
        category: "financement",
        description: "Couverture indicielle basée sur les données satellites pluviométriques avec indemnisation sous 15 jours.",
        price_indication: "Prime de 4.5% du capital garanti",
        unit: "Police annuelle",
        location_name: "Sahel, Centre-Nord, Nord",
        contact_phone: "+226 25 30 00 00",
        is_active: true,
      };

      const saved = await partnerStorage.saveOffer(assurancePayload);
      expect(saved.id).toBeTruthy();
      expect(saved.title).toBe("Assurance Indicielle Sécheresse Sahel");
      expect(saved.category).toBe("financement");
    });

    it("permet de créer et diffuser une campagne publicitaire / marketing sponsorisée sur le marketplace", async () => {
      const marketingPayload: any = {
        title: "🌟 Promo Campagne 2026 : Votre crédit intrants débloqué en 48h !",
        partner_name: "Microfinance Rurale & Agricole",
        category: "financement",
        description: "Offre spéciale groupements et coopératives. Taux réduit à 5% sans frais de dossier jusqu'au 31 mai.",
        price_indication: "Taux réduit 5%",
        unit: "Campagne saisonnière",
        image_url: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&q=80",
        is_active: true,
        finance_type: "pub_marketing",
        campaign_badge: "OFFRE SPÉCIALE CAMPAGNE",
        marketing_cta: "Souscrire sur WhatsApp",
        is_sponsored: true,
      };

      const saved = await partnerStorage.saveOffer(marketingPayload);
      expect(saved.id).toBeTruthy();
      expect((saved as any).campaign_badge).toBe("OFFRE SPÉCIALE CAMPAGNE");
      expect((saved as any).is_sponsored).toBe(true);
      expect((saved as any).marketing_cta).toBe("Souscrire sur WhatsApp");
    });
  });
});
