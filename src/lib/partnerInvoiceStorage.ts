/**
 * Gestion du stockage local et calculs des factures proforma et définitives des partenaires.
 * Conforme aux règles métier OHADA / Burkina Faso :
 * - Montants en FCFA
 * - Pas de slash dans les chiffres et unités (ex: kg, unité, sac, prestation)
 * - Mentions légales et conversion en toutes lettres en français
 * - Zéro emoji
 */

export type InvoiceType = "proforma" | "definitive";
export type InvoiceStatus = "brouillon" | "envoyee" | "validee" | "payee" | "annulee";

export interface InvoiceItem {
  id: string;
  designation: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface InvoiceClient {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  nifRccm?: string;
}

export interface PartnerInvoice {
  id: string;
  partnerId: string;
  type: InvoiceType;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  client: InvoiceClient;
  items: InvoiceItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxRate: number; // 0 ou 18
  taxAmount: number;
  totalTtc: number;
  paymentMethod?: string;
  paymentTerms?: string;
  bankDetails?: string;
  notes?: string;
  status: InvoiceStatus;
  convertedFromProformaId?: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_PREFIX = "nafa_partner_invoices_";

function getStorageKey(partnerId: string): string {
  const cleanId = partnerId ? partnerId.replace(/[^a-zA-Z0-9_-]/g, "_") : "default";
  return `${STORAGE_PREFIX}${cleanId}`;
}

export const partnerInvoiceStorage = {
  getAll(partnerId: string): PartnerInvoice[] {
    try {
      const data = localStorage.getItem(getStorageKey(partnerId));
      if (!data) return [];
      const list: PartnerInvoice[] = JSON.parse(data);
      return Array.isArray(list) ? list : [];
    } catch (e) {
      console.error("Erreur lecture factures partenaire:", e);
      return [];
    }
  },

  getById(partnerId: string, id: string): PartnerInvoice | undefined {
    const list = this.getAll(partnerId);
    return list.find((item) => item.id === id);
  },

  save(partnerId: string, invoice: PartnerInvoice): void {
    try {
      const list = this.getAll(partnerId);
      const index = list.findIndex((item) => item.id === invoice.id);
      const now = new Date().toISOString();
      const updatedInvoice: PartnerInvoice = {
        ...invoice,
        updatedAt: now,
      };

      if (index >= 0) {
        list[index] = updatedInvoice;
      } else {
        list.unshift(updatedInvoice);
      }

      localStorage.setItem(getStorageKey(partnerId), JSON.stringify(list));
      window.dispatchEvent(
        new CustomEvent("partner-invoices-updated", {
          detail: { partnerId, invoice: updatedInvoice },
        })
      );
    } catch (e) {
      console.error("Erreur sauvegarde facture partenaire:", e);
    }
  },

  delete(partnerId: string, id: string): void {
    try {
      const list = this.getAll(partnerId);
      const filtered = list.filter((item) => item.id !== id);
      localStorage.setItem(getStorageKey(partnerId), JSON.stringify(filtered));
      window.dispatchEvent(
        new CustomEvent("partner-invoices-updated", {
          detail: { partnerId, deletedId: id },
        })
      );
    } catch (e) {
      console.error("Erreur suppression facture partenaire:", e);
    }
  },

  generateInvoiceNumber(partnerId: string, type: InvoiceType): string {
    const list = this.getAll(partnerId);
    const year = new Date().getFullYear();
    const prefix = type === "proforma" ? "PRO" : "FAC";
    
    // Filtrer les factures du même type pour l'année en cours
    const yearMatches = list.filter((inv) => {
      return inv.type === type && inv.invoiceNumber.startsWith(`${prefix}-${year}-`);
    });

    const nextIndex = yearMatches.length + 1;
    const padded = String(nextIndex).padStart(4, "0");
    return `${prefix}-${year}-${padded}`;
  },

  convertProformaToDefinitive(partnerId: string, proformaId: string): PartnerInvoice | null {
    const proforma = this.getById(partnerId, proformaId);
    if (!proforma || proforma.type !== "proforma") return null;

    const definitiveNumber = this.generateInvoiceNumber(partnerId, "definitive");
    const today = new Date().toISOString().split("T")[0];
    const dueDate = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0];

    const definitiveInvoice: PartnerInvoice = {
      ...proforma,
      id: "inv_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      type: "definitive",
      invoiceNumber: definitiveNumber,
      date: today,
      dueDate,
      status: "envoyee",
      convertedFromProformaId: proforma.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Marquer la proforma comme validée
    this.save(partnerId, {
      ...proforma,
      status: "validee",
    });

    // Enregistrer la facture définitive
    this.save(partnerId, definitiveInvoice);

    return definitiveInvoice;
  },

  calculateTotals(
    items: InvoiceItem[],
    discountPercent: number = 0,
    taxRate: number = 0
  ): {
    subtotal: number;
    discountAmount: number;
    taxableAmount: number;
    taxAmount: number;
    totalTtc: number;
  } {
    const subtotal = items.reduce((acc, it) => acc + (it.quantity * it.unitPrice || 0), 0);
    const discountAmount = Math.round((subtotal * Math.max(0, Math.min(100, discountPercent))) / 100);
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = Math.round((taxableAmount * Math.max(0, taxRate)) / 100);
    const totalTtc = taxableAmount + taxAmount;

    return {
      subtotal,
      discountAmount,
      taxableAmount,
      taxAmount,
      totalTtc,
    };
  },
};

/**
 * Convertit un nombre entier en montant en toutes lettres en français (FCFA).
 */
export function amountInWordsFrench(amount: number): string {
  const rounded = Math.round(Math.abs(amount));
  if (rounded === 0) return "Zéro franc CFA";

  const units = [
    "",
    "un",
    "deux",
    "trois",
    "quatre",
    "cinq",
    "six",
    "sept",
    "huit",
    "neuf",
    "dix",
    "onze",
    "douze",
    "treize",
    "quatorze",
    "quinze",
    "seize",
    "dix-sept",
    "dix-huit",
    "dix-neuf",
  ];

  const tens = [
    "",
    "dix",
    "vingt",
    "trente",
    "quarante",
    "cinquante",
    "soixante",
    "soixante-dix",
    "quatre-vingts",
    "quatre-vingt-dix",
  ];

  function convertBelow100(n: number): string {
    if (n < 20) return units[n];
    const t = Math.floor(n / 10);
    const u = n % 10;

    if (t === 7) {
      return u === 1 ? "soixante et onze" : `soixante-${convertBelow100(10 + u)}`;
    }
    if (t === 8) {
      return u === 0 ? "quatre-vingts" : `quatre-vingt-${units[u]}`;
    }
    if (t === 9) {
      return `quatre-vingt-${convertBelow100(10 + u)}`;
    }
    if (u === 1 && t < 7) {
      return `${tens[t]} et un`;
    }
    return u === 0 ? tens[t] : `${tens[t]}-${units[u]}`;
  }

  function convertBelow1000(n: number): string {
    if (n < 100) return convertBelow100(n);
    const h = Math.floor(n / 100);
    const rem = n % 100;
    const hundredPrefix = h === 1 ? "cent" : `${units[h]} cents`;
    const hundredStr = rem === 0 ? hundredPrefix : hundredPrefix.replace(/cents$/, "cent");
    return rem === 0 ? hundredStr : `${hundredStr} ${convertBelow100(rem)}`;
  }

  function convert(n: number): string {
    if (n === 0) return "";
    if (n < 1000) return convertBelow1000(n);

    if (n < 1000000) {
      const thousands = Math.floor(n / 1000);
      const rem = n % 1000;
      const thousandStr = thousands === 1 ? "mille" : `${convertBelow1000(thousands)} mille`;
      return rem === 0 ? thousandStr : `${thousandStr} ${convertBelow1000(rem)}`;
    }

    if (n < 1000000000) {
      const millions = Math.floor(n / 1000000);
      const rem = n % 1000000;
      const millionStr = millions === 1 ? "un million" : `${convertBelow1000(millions)} millions`;
      return rem === 0 ? millionStr : `${millionStr} ${convert(rem)}`;
    }

    const billions = Math.floor(n / 1000000000);
    const rem = n % 1000000000;
    const billionStr = billions === 1 ? "un milliard" : `${convertBelow1000(billions)} milliards`;
    return rem === 0 ? billionStr : `${billionStr} ${convert(rem)}`;
  }

  const result = convert(rounded).trim();
  const capitalized = result.charAt(0).toUpperCase() + result.slice(1);
  return `${capitalized} francs CFA`;
}

/**
 * Formate un nombre en FCFA avec séparateurs d'espaces réguliers, sans aucun slash.
 */
export function formatFcfa(amount: number): string {
  const rounded = Math.round(amount || 0);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${formatted} FCFA`;
}
