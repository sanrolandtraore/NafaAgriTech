/**
 * Agrégateur de Paiements Multi-Opérateurs pour le Burkina Faso & Sahel — NAFA Pay
 * 
 * Permet à NAFA-AGRITECH et à TOUS ses partenaires d'accepter les paiements populaires :
 * 1. Orange Money Burkina Faso (USSD *144*4*6*Code*Montant# & Web Payment)
 * 2. Moov Money Burkina Faso / Flooz (USSD *555*6*Code*Montant#)
 * 3. Wave Burkina Faso (Paiement instantané sans frais & QR Code)
 * 4. Cartes Bancaires (Coris Bank International, Ecobank, Visa, Mastercard, GIM-UEMOA)
 * 5. Virement Bancaire & Dépôt Guichet (Coris Bank / Ecobank BF)
 * 
 * Gère deux flux cruciaux :
 * - Paiement des Abonnements Partenaires vers NAFA-AGRITECH
 * - Paiement des Commandes / Prestations sous Séquestre Garanti vers les Partenaires
 */

export type BurkinaPaymentProvider = 
  | "orange_money" 
  | "moov_money" 
  | "wave" 
  | "carte_bancaire" 
  | "virement_bancaire";

export interface PaymentProviderMeta {
  id: BurkinaPaymentProvider;
  name: string;
  shortName: string;
  tagline: string;
  popularBadge?: string;
  color: string;
  accentBg: string;
  logoText: string;
  ussdPrefix?: string;
  merchantCodeNafa: string;
  officialPhoneNafa: string;
  feePercentage: number;
}

export const BURKINA_PAYMENT_PROVIDERS: Record<BurkinaPaymentProvider, PaymentProviderMeta> = {
  orange_money: {
    id: "orange_money",
    name: "Orange Money Burkina Faso",
    shortName: "Orange Money",
    tagline: "Paiement via compte Orange Money (*144#)",
    popularBadge: "N°1 au Burkina",
    color: "#FF7900",
    accentBg: "bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-400",
    logoText: "OM",
    ussdPrefix: "*144*4*6*",
    merchantCodeNafa: "492088",
    officialPhoneNafa: "+226 75 77 48 52",
    feePercentage: 1.0,
  },
  moov_money: {
    id: "moov_money",
    name: "Moov Money Burkina Faso (Flooz)",
    shortName: "Moov Money",
    tagline: "Paiement via compte Moov Money (*555#)",
    popularBadge: "Réseau National",
    color: "#0066B3",
    accentBg: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400",
    logoText: "MOOV",
    ussdPrefix: "*555*6*",
    merchantCodeNafa: "301944",
    officialPhoneNafa: "+226 50 13 49 20",
    feePercentage: 1.0,
  },
  wave: {
    id: "wave",
    name: "Wave Burkina Faso",
    shortName: "Wave",
    tagline: "Paiement instantané avec frais réduits (1%)",
    popularBadge: "Moins de frais (1%)",
    color: "#1DC3F4",
    accentBg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-400",
    logoText: "WAVE",
    merchantCodeNafa: "WAVE-NAFA-BF",
    officialPhoneNafa: "+226 75 77 48 52",
    feePercentage: 1.0,
  },
  carte_bancaire: {
    id: "carte_bancaire",
    name: "Carte Bancaire (Coris, Ecobank, Visa, Mastercard)",
    shortName: "Carte Bancaire",
    tagline: "Paiement sécurisé 3D-Secure UEMOA",
    popularBadge: "Banques UEMOA",
    color: "#10B981",
    accentBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400",
    logoText: "VISA / GIM",
    merchantCodeNafa: "NAFA-CORIS-CB-01",
    officialPhoneNafa: "+226 75 77 48 52",
    feePercentage: 1.5,
  },
  virement_bancaire: {
    id: "virement_bancaire",
    name: "Virement Bancaire (Coris Bank / Ecobank BF)",
    shortName: "Virement Bancaire",
    tagline: "RIB officiel Coris Bank International Burkina Faso",
    popularBadge: "Grandes Entreprises",
    color: "#6B7280",
    accentBg: "bg-slate-500/10 border-slate-500/30 text-slate-700 dark:text-slate-300",
    logoText: "RIB",
    merchantCodeNafa: "BF023 01001 02145879001 45",
    officialPhoneNafa: "+226 75 77 48 52",
    feePercentage: 0.0,
  },
};

export type PaymentContext = 
  | "partner_subscription" // Abonnement partenaire vers NAFA-AGRITECH
  | "marketplace_order"    // Achat d'intrants / matériel ou service sous séquestre
  | "mechanization_job";   // Acompte pour travaux de tracteur / labour

export interface PaymentTransaction {
  id: string;
  provider: BurkinaPaymentProvider;
  context: PaymentContext;
  amount: number; // En FCFA
  fees: number;   // En FCFA
  totalAmount: number; // En FCFA
  payerPhone: string;
  payerName: string;
  payerEmail?: string;
  beneficiaryType: "nafa_agritech" | "partner";
  partnerId?: string;
  partnerName?: string;
  description: string;
  status: "reussi" | "en_sequestre" | "libere" | "echec" | "en_attente";
  operatorReference: string;
  ussdDialCode?: string;
  createdAt: string;
  validatedAt?: string;
}

export interface PartnerPayoutSettings {
  partnerId: string;
  accountType: BurkinaPaymentProvider;
  accountName: string;
  phoneNumber: string; // Ex: +226 70 XX XX XX pour OM/Moov/Wave
  bankName?: string;   // Ex: Coris Bank, Ecobank, BOA, BICIAB
  ribNumber?: string;  // Ex: BF023...
  autoEscrowRelease: boolean;
  updatedAt: string;
}

const STORAGE_TRANSACTIONS_KEY = "nafa_payment_transactions_v1";
const STORAGE_PARTNER_PAYOUTS_KEY = "nafa_partner_payout_settings_v1";

export const burkinaPaymentAggregator = {
  /**
   * Génère un code de référence unique d'opérateur burkinabè
   */
  generateOperatorReference(provider: BurkinaPaymentProvider): string {
    const prefixes: Record<BurkinaPaymentProvider, string> = {
      orange_money: "OM-BF",
      moov_money: "MOOV-BF",
      wave: "WAVE-BF",
      carte_bancaire: "CB-BF",
      virement_bancaire: "VIR-BF",
    };
    const prefix = prefixes[provider] || "PAY-BF";
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `${prefix}-${dateStr}-${rand}`;
  },

  /**
   * Construit la syntaxe USSD officielle pour l'utilisateur
   */
  getUssdDialCode(provider: BurkinaPaymentProvider, amount: number, merchantCode?: string): string | undefined {
    const meta = BURKINA_PAYMENT_PROVIDERS[provider];
    const code = merchantCode || meta.merchantCodeNafa;
    if (provider === "orange_money") {
      return `*144*4*6*${code}*${amount}#`;
    }
    if (provider === "moov_money") {
      return `*555*6*${code}*${amount}#`;
    }
    return undefined;
  },

  /**
   * Calcule les frais de transaction en fonction du moyen de paiement
   */
  calculateFees(provider: BurkinaPaymentProvider, amount: number): number {
    const meta = BURKINA_PAYMENT_PROVIDERS[provider];
    if (!meta) return 0;
    return Math.round((amount * meta.feePercentage) / 100);
  },

  /**
   * Alias pour compatibilité
   */
  generateUssdCode(provider: BurkinaPaymentProvider, amount: number, merchantCode?: string): string | undefined {
    return this.getUssdDialCode(provider, amount, merchantCode);
  },

  /**
   * Récupère la liste de toutes les transactions
   */
  getTransactions(): PaymentTransaction[] {
    try {
      const raw = localStorage.getItem(STORAGE_TRANSACTIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /**
   * Récupère les transactions d'un utilisateur ou partenaire
   */
  getTransactionsForUser(userIdOrPhone: string): PaymentTransaction[] {
    const all = this.getTransactions();
    return all.filter(
      (t) => t.partnerId === userIdOrPhone || t.payerPhone.includes(userIdOrPhone)
    );
  },

  /**
   * Initie et valide un paiement via l'agrégateur (Orange Money, Moov, Wave, Carte)
   */
  async processPayment(params: {
    provider: BurkinaPaymentProvider;
    context: PaymentContext;
    amount: number;
    payerPhone: string;
    payerName: string;
    payerEmail?: string;
    beneficiaryType: "nafa_agritech" | "partner";
    partnerId?: string;
    partnerName?: string;
    description: string;
    cardDetails?: {
      cardNumber: string;
      cardHolder: string;
      expiry: string;
      cvv: string;
    };
  }): Promise<{ success: boolean; transaction: PaymentTransaction; message: string }> {
    const meta = BURKINA_PAYMENT_PROVIDERS[params.provider];
    const fees = Math.round((params.amount * meta.feePercentage) / 100);
    const totalAmount = params.amount + fees;

    // Simulation de latence réseau opérateur (1s pour le handshake avec Orange/Moov/Wave)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const operatorRef = this.generateOperatorReference(params.provider);
    const ussdCode = this.getUssdDialCode(params.provider, params.amount);

    const transaction: PaymentTransaction = {
      id: "tx-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      provider: params.provider,
      context: params.context,
      amount: params.amount,
      fees,
      totalAmount,
      payerPhone: params.payerPhone,
      payerName: params.payerName,
      payerEmail: params.payerEmail,
      beneficiaryType: params.beneficiaryType,
      partnerId: params.partnerId,
      partnerName: params.partnerName,
      description: params.description,
      status: params.context === "marketplace_order" || params.context === "mechanization_job" 
        ? "en_sequestre" 
        : "reussi",
      operatorReference: operatorRef,
      ussdDialCode: ussdCode,
      createdAt: new Date().toISOString(),
      validatedAt: new Date().toISOString(),
    };

    // Sauvegarde de la transaction
    const transactions = this.getTransactions();
    transactions.unshift(transaction);
    try {
      localStorage.setItem(STORAGE_TRANSACTIONS_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.error("Failed to store payment transaction", e);
    }

    // Déclencher un événement système pour mise à jour immédiate
    window.dispatchEvent(new CustomEvent("nafa-payment-completed", { detail: transaction }));

    return {
      success: true,
      transaction,
      message: `Paiement de ${params.amount.toLocaleString()} FCFA validé avec succès via ${meta.name} (Réf : ${operatorRef}).`,
    };
  },

  /**
   * Libère les fonds d'un séquestre vers le compte marchand du partenaire
   */
  async releaseEscrow(transactionId: string): Promise<{ success: boolean; payoutRef: string }> {
    const transactions = this.getTransactions();
    const idx = transactions.findIndex((t) => t.id === transactionId);
    if (idx >= 0) {
      transactions[idx].status = "libere";
      transactions[idx].validatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_TRANSACTIONS_KEY, JSON.stringify(transactions));
    }

    const payoutRef = `PAYOUT-${Date.now().toString().slice(-6)}`;
    return { success: true, payoutRef };
  },

  /**
   * Récupère la configuration de versement d'un partenaire
   */
  getPartnerPayoutSettings(partnerId: string): PartnerPayoutSettings {
    try {
      const raw = localStorage.getItem(`${STORAGE_PARTNER_PAYOUTS_KEY}_${partnerId}`);
      if (raw) return JSON.parse(raw);
    } catch {
      // Fallback
    }

    return {
      partnerId,
      accountType: "orange_money",
      accountName: "Mon Entreprise Agricole",
      phoneNumber: "+226 70 00 00 00",
      bankName: "Coris Bank International",
      ribNumber: "",
      autoEscrowRelease: true,
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Enregistre les coordonnées de versement d'un partenaire
   */
  savePartnerPayoutSettings(settings: PartnerPayoutSettings): void {
    try {
      localStorage.setItem(
        `${STORAGE_PARTNER_PAYOUTS_KEY}_${settings.partnerId}`,
        JSON.stringify(settings)
      );
      window.dispatchEvent(new CustomEvent("nafa-partner-payout-updated", { detail: settings }));
    } catch (e) {
      console.error("Failed to save partner payout settings", e);
    }
  },
};
