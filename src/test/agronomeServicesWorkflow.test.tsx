import { describe, it, expect, beforeEach } from "vitest";
import {
  AGRONOME_OFFER_CATEGORIES,
} from "@/pages/provider/partnerCategories";
import {
  AGRICULTEUR_CATEGORY_TABS,
  AGRICULTEUR_ALLOWED_CATEGORIES,
} from "@/components/marketplace/ProductServiceCatalog";
import { agronomeNav } from "@/components/RoleSidebar";
import { partnerStorage, PartnerOffer } from "@/lib/partnerStorage";

describe("Workflow Intégral : Publication de Prestations par les Agronomes & Commande par les Producteurs", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("1. Le référentiel des catégories d'offres agronomiques contient les spécialités clés", () => {
    const categoryValues = AGRONOME_OFFER_CATEGORIES.map((c) => c.value);

    expect(categoryValues).toContain("diagnostic_phytosanitaire");
    expect(categoryValues).toContain("arpentage_cartographie");
    expect(categoryValues).toContain("conception_irrigation");
    expect(categoryValues).toContain("plan_fertilisation");
    expect(categoryValues).toContain("suivi_culture");
    expect(categoryValues).toContain("formation_technique");
    expect(categoryValues).toContain("expertise_agricole");
    expect(AGRONOME_OFFER_CATEGORIES.length).toBeGreaterThanOrEqual(7);
  });

  it("2. La barre de catégories du producteur (agriculteur) inclut l'onglet 'Conseil & Services d'Agronomes'", () => {
    const agroTab = AGRICULTEUR_CATEGORY_TABS.find((t) => t.value === "expertise_agronome");

    expect(agroTab).toBeDefined();
    expect(agroTab?.label).toBe("Conseil & Services d'Agronomes");
    expect(agroTab?.match).toContain("diagnostic_phytosanitaire");
    expect(agroTab?.match).toContain("arpentage_cartographie");
    expect(agroTab?.match).toContain("conception_irrigation");
    expect(agroTab?.match).toContain("plan_fertilisation");

    // Les catégories sont aussi autorisées dans le filtre agriculteur
    expect(AGRICULTEUR_ALLOWED_CATEGORIES).toContain("diagnostic_phytosanitaire");
    expect(AGRICULTEUR_ALLOWED_CATEGORIES).toContain("arpentage_cartographie");
    expect(AGRICULTEUR_ALLOWED_CATEGORIES).toContain("conception_irrigation");
  });

  it("3. La navigation de l'agronome permet de gérer ses offres et de recevoir les commandes de devis", () => {
    const paths = agronomeNav.map((item) => item.to);

    // Publication des prestations
    expect(paths).toContain("/dashboard/partenaire-mes-offres");
    // Réception et traitement des commandes
    expect(paths).toContain("/dashboard/quote-requests");

    const offerNavItem = agronomeNav.find((i) => i.to === "/dashboard/partenaire-mes-offres");
    expect(offerNavItem?.labelKey).toBe("Proposer mes Prestations & Tarifs");

    const quoteNavItem = agronomeNav.find((i) => i.to === "/dashboard/quote-requests");
    expect(quoteNavItem?.labelKey).toBe("Demandes de devis & Commandes");
  });

  it("4. Un agronome peut publier et persister une offre de service agronomique", async () => {
    const agronomeOfferInput = {
      owner_id: "agronome-pro-001",
      partner_name: "Cabinet Agro-Expert Sahel",
      category: "diagnostic_phytosanitaire",
      title: "Audit Phytosanitaire & Diagnostic des Ravageurs",
      description: "Inspection in-situ sur 5 hectares, identification des pathogènes et plan de traitement biologique.",
      price_indication: "25000",
      unit: "visite",
      location_name: "Bama / Vallée du Kou",
      contact_phone: "+226 70 12 34 56",
      contact_email: "contact@agro-expert.bf",
      is_active: true,
    };

    const savedOffer = await partnerStorage.saveOffer(agronomeOfferInput);
    expect(savedOffer).toBeDefined();
    expect(savedOffer.id).toBeTruthy();
    expect(savedOffer.category).toBe("diagnostic_phytosanitaire");
    expect(savedOffer.is_active).toBe(true);

    // Vérification de la récupération
    const allOffers = await partnerStorage.getOffers();
    const found = allOffers.find((o) => o.id === savedOffer.id);
    expect(found).toBeDefined();
    expect(found?.partner_name).toBe("Cabinet Agro-Expert Sahel");
    expect(found?.price_indication).toBe("25000");
  });

  it("5. Un producteur peut réserver/commander une intervention agronomique avec statut 'en_attente'", async () => {
    // Étape 1 : Offre publiée par un agronome
    const offer = await partnerStorage.saveOffer({
      owner_id: "agronome-pro-002",
      partner_name: "Bureau d'Études Topo & Irrigation BF",
      category: "arpentage_cartographie",
      title: "Arpentage géodésique et plan de nivellement",
      price_indication: "40000",
      unit: "ha",
      contact_phone: "+226 76 54 32 10",
      is_active: true,
    });

    // Étape 2 : Commande formulée par le producteur agricole
    const quoteOrder = await partnerStorage.saveQuote({
      offer_id: offer.id,
      requester_id: "farmer-oumar-123",
      requester_name: "Oumar Ouédraogo",
      owner_id: offer.owner_id,
      quantity: "10 ha",
      needed_by: "2026-11-01",
      contact_phone: "+226 71 00 11 22",
      message:
        "Demande d'intervention agronomique : Arpentage géodésique. Volume/Superficie : 10 ha. Parcelle : Loumbila. Cultures : Maraîchage tomate & oignon.",
      offer_title: offer.title,
      partner_name: offer.partner_name,
      status: "en_attente",
    });

    expect(quoteOrder.id).toBeTruthy();
    expect(quoteOrder.status).toBe("en_attente");
    expect(quoteOrder.owner_id).toBe("agronome-pro-002");
    expect(quoteOrder.requester_name).toBe("Oumar Ouédraogo");

    // Étape 3 : L'agronome retrouve la commande dans sa liste de devis
    const allQuotes = await partnerStorage.getQuotes();
    const agronomeQuotes = allQuotes.filter((q) => q.owner_id === "agronome-pro-002");
    expect(agronomeQuotes.length).toBe(1);
    expect(agronomeQuotes[0].offer_title).toBe("Arpentage géodésique et plan de nivellement");
    expect(agronomeQuotes[0].quantity).toBe("10 ha");

    // Étape 4 : L'agronome peut valider ou répondre à la commande
    await partnerStorage.updateQuoteStatus(
      quoteOrder.id,
      "acceptee",
      "Intervention confirmée pour le 01 Novembre à 08h00. Équipe mobilisée."
    );

    const updatedQuotes = await partnerStorage.getQuotes();
    const updated = updatedQuotes.find((q) => q.id === quoteOrder.id);
    expect(updated?.status).toBe("acceptee");
    expect(updated?.response).toContain("Intervention confirmée pour le 01 Novembre");
  });
});
