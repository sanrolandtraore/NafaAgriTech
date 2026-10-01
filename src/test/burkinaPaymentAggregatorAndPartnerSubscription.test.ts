import { describe, it, expect, beforeEach } from "vitest";
import {
  burkinaPaymentAggregator,
  BURKINA_PAYMENT_PROVIDERS,
  BurkinaPaymentProvider,
} from "@/lib/burkinaPaymentAggregator";
import {
  isPartnerSubscriptionActive,
  saveProviderSubscription,
  getStoredProviderSubscription,
  ProviderSubscription,
  CERTIFIED_DEFAULT_PARTNERS,
} from "@/lib/providerSubscription";

describe("Agrégateur de Paiement Burkina Faso (Orange Money, Moov Money, Wave, Cartes)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("fournit les 5 canaux de paiement populaires du Burkina Faso avec les métadonnées officielles", () => {
    expect(BURKINA_PAYMENT_PROVIDERS.orange_money.name).toBe("Orange Money Burkina Faso");
    expect(BURKINA_PAYMENT_PROVIDERS.orange_money.ussdPrefix).toBe("*144*4*6*");

    expect(BURKINA_PAYMENT_PROVIDERS.moov_money.name).toContain("Moov Money Burkina Faso");
    expect(BURKINA_PAYMENT_PROVIDERS.moov_money.ussdPrefix).toBe("*555*6*");

    expect(BURKINA_PAYMENT_PROVIDERS.wave.name).toBe("Wave Burkina Faso");
    expect(BURKINA_PAYMENT_PROVIDERS.carte_bancaire.name).toContain("Carte Bancaire");
  });

  it("génère des codes USSD valides pour Orange Money et Moov Money", () => {
    const omCode = burkinaPaymentAggregator.generateUssdCode("orange_money", 15000);
    expect(omCode).toContain("*144*4*6*");
    expect(omCode).toContain("15000#");

    const moovCode = burkinaPaymentAggregator.generateUssdCode("moov_money", 25000);
    expect(moovCode).toContain("*555*6*");
    expect(moovCode).toContain("25000#");
  });

  it("calcule les frais de transaction avec exactitude (1% pour Mobile Money)", () => {
    const feesOM = burkinaPaymentAggregator.calculateFees("orange_money", 50000);
    expect(feesOM).toBe(500);

    const feesWave = burkinaPaymentAggregator.calculateFees("wave", 100000);
    expect(feesWave).toBe(1000);

    const feesBank = burkinaPaymentAggregator.calculateFees("virement_bancaire", 200000);
    expect(feesBank).toBe(0);
  });

  it("exécute un paiement d'abonnement partenaire réussi au profit de NAFA-AGRITECH", async () => {
    const res = await burkinaPaymentAggregator.processPayment({
      provider: "orange_money",
      amount: 15000,
      context: "partner_subscription",
      payerPhone: "+226 70 12 34 56",
      payerName: "Agro-Service Sahel",
      beneficiaryType: "nafa_agritech",
      description: "Abonnement Pack Starter 1 Mois",
    });

    expect(res.success).toBe(true);
    expect(res.transaction.status).toBe("reussi");
    expect(res.transaction.operatorReference).toMatch(/^OM-BF-/);
    expect(res.transaction.totalAmount).toBe(15150); // 15000 + 1% fees
  });

  it("exécute un paiement de commande marketplace avec consignation sous séquestre garanti", async () => {
    const res = await burkinaPaymentAggregator.processPayment({
      provider: "moov_money",
      amount: 50000,
      context: "marketplace_order",
      payerPhone: "+226 50 11 22 33",
      payerName: "Producteur Oumarou",
      beneficiaryType: "partner",
      partnerId: "partner-koudougou",
      partnerName: "Comptoir Agricole Koudougou",
      description: "Achat 2 sacs d'engrais NPK",
    });

    expect(res.success).toBe(true);
    expect(res.transaction.status).toBe("en_sequestre");
    expect(res.transaction.operatorReference).toMatch(/^MOOV-BF-/);

    // Vérification de la libération du séquestre vers le partenaire
    const releaseRes = await burkinaPaymentAggregator.releaseEscrow(res.transaction.id);
    expect(releaseRes.success).toBe(true);
    expect(releaseRes.payoutRef).toMatch(/^PAYOUT-/);

    const transactions = burkinaPaymentAggregator.getTransactions();
    const updatedTx = transactions.find((t) => t.id === res.transaction.id);
    expect(updatedTx?.status).toBe("libere");
  });

  it("permet aux partenaires de configurer et sauvegarder leurs coordonnées de versement", () => {
    const partnerId = "part-agri-007";
    burkinaPaymentAggregator.savePartnerPayoutSettings({
      partnerId,
      accountType: "orange_money",
      accountName: "Coopérative Yennenga",
      phoneNumber: "+226 76 99 88 77",
      bankName: "Coris Bank",
      ribNumber: "BF023 01001 02145879001 45",
      autoEscrowRelease: true,
      updatedAt: new Date().toISOString(),
    });

    const retrieved = burkinaPaymentAggregator.getPartnerPayoutSettings(partnerId);
    expect(retrieved.accountName).toBe("Coopérative Yennenga");
    expect(retrieved.phoneNumber).toBe("+226 76 99 88 77");
    expect(retrieved.accountType).toBe("orange_money");
  });
});

describe("Exigence d'Abonnement Réel Partenaire pour Visibilité Marketplace", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("maintient l'accès actif garanti pour les partenaires institutionnels certifiés", () => {
    expect(isPartnerSubscriptionActive("pe-fourn-1")).toBe(true);
    expect(isPartnerSubscriptionActive("pe-bank-1")).toBe(true);
    expect(isPartnerSubscriptionActive("prov-1")).toBe(true);
  });

  it("refuse la visibilité publique d'un nouveau partenaire tant qu'il n'a pas souscrit à un abonnement payant", () => {
    const newPartnerId = "nouveau-partenaire-test";
    
    // Par défaut, sans abonnement, ou avec plan Découverte gratuit
    expect(isPartnerSubscriptionActive(newPartnerId)).toBe(false);

    const defaultSub = getStoredProviderSubscription(newPartnerId);
    expect(defaultSub.tier).toBe("free");
    expect(defaultSub.isActive).toBe(false);
  });

  it("rend les offres d'un partenaire visibles dès l'activation d'un abonnement payant via l'agrégateur", () => {
    const partnerId = "partenaire-bo-farma";

    // 1. Initialement inactif
    expect(isPartnerSubscriptionActive(partnerId)).toBe(false);

    // 2. Le partenaire souscrit à la formule starter via Orange Money
    const now = new Date();
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const paidSub: ProviderSubscription = {
      tier: "starter",
      activityType: "vente_intrants",
      companyName: "BO Farma Intrants",
      phone: "+226 70 88 77 66",
      email: "bofarma@nafa.bf",
      location: "Bobo-Dioulasso",
      startDate: now.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      isActive: true,
      paymentMethod: "orange_money",
      paymentReference: "OM-BF-99281729",
      toolsUnlocked: ["marketplace_offres", "calculatrice_agro"],
    };

    saveProviderSubscription(paidSub, partnerId);

    // 3. Après paiement, la visibilité est immédiatement activée
    expect(isPartnerSubscriptionActive(partnerId)).toBe(true);
  });
});
