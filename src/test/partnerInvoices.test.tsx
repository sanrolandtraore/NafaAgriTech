import { describe, it, expect, beforeEach } from "vitest";
import {
  partnerInvoiceStorage,
  PartnerInvoice,
  InvoiceItem,
  amountInWordsFrench,
  formatFcfa,
} from "@/lib/partnerInvoiceStorage";
import { generatePartnerInvoicePdf } from "@/lib/partnerInvoicePdf";

describe("Module de Facturation Partenaire (Proforma & Définitive)", () => {
  const partnerId = "test_partner_123";

  beforeEach(() => {
    localStorage.clear();
  });

  it("calcule correctement les montants HT, remise, TVA et TTC", () => {
    const items: InvoiceItem[] = [
      {
        id: "1",
        designation: "Semences de maïs certifiées (sac de 25 kg)",
        quantity: 10,
        unit: "sac",
        unitPrice: 15000,
        total: 150000,
      },
      {
        id: "2",
        designation: "Engrais NPK 15-15-15",
        quantity: 5,
        unit: "sac",
        unitPrice: 24000,
        total: 120000,
      },
    ];

    // Sous-total brut = 150000 + 120000 = 270 000 FCFA
    // Remise 10% = 27 000 FCFA -> Base = 243 000 FCFA
    // TVA 18% = 43 740 FCFA -> TTC = 286 740 FCFA
    const totals = partnerInvoiceStorage.calculateTotals(items, 10, 18);

    expect(totals.subtotal).toBe(270000);
    expect(totals.discountAmount).toBe(27000);
    expect(totals.taxableAmount).toBe(243000);
    expect(totals.taxAmount).toBe(43740);
    expect(totals.totalTtc).toBe(286740);
  });

  it("gère l'exonération de TVA (0%) et absence de remise", () => {
    const items: InvoiceItem[] = [
      {
        id: "1",
        designation: "Prestation de labour mécanisé",
        quantity: 2,
        unit: "hectare",
        unitPrice: 35000,
        total: 70000,
      },
    ];

    const totals = partnerInvoiceStorage.calculateTotals(items, 0, 0);

    expect(totals.subtotal).toBe(70000);
    expect(totals.discountAmount).toBe(0);
    expect(totals.taxAmount).toBe(0);
    expect(totals.totalTtc).toBe(70000);
  });

  it("génère des numéros de factures chronologiques distincts pour proforma et définitive", () => {
    const numProforma = partnerInvoiceStorage.generateInvoiceNumber(partnerId, "proforma");
    const numDefinitive = partnerInvoiceStorage.generateInvoiceNumber(partnerId, "definitive");

    const year = new Date().getFullYear();
    expect(numProforma).toBe(`PRO-${year}-0001`);
    expect(numDefinitive).toBe(`FAC-${year}-0001`);
  });

  it("sauvegarde, récupère et supprime une facture proforma", () => {
    const invoice: PartnerInvoice = {
      id: "inv_1",
      partnerId,
      type: "proforma",
      invoiceNumber: "PRO-2026-0001",
      date: "2026-10-08",
      dueDate: "2026-11-08",
      client: {
        name: "Coopérative Faso Baara",
        phone: "+226 70 12 34 56",
        address: "Koudougou, Secteur 3",
      },
      items: [
        {
          id: "it_1",
          designation: "Pulvérisateur à pression",
          quantity: 2,
          unit: "unité",
          unitPrice: 25000,
          total: 50000,
        },
      ],
      subtotal: 50000,
      discountPercent: 0,
      discountAmount: 0,
      taxRate: 0,
      taxAmount: 0,
      totalTtc: 50000,
      status: "envoyee",
      createdAt: "2026-10-08T10:00:00Z",
      updatedAt: "2026-10-08T10:00:00Z",
    };

    partnerInvoiceStorage.save(partnerId, invoice);

    const all = partnerInvoiceStorage.getAll(partnerId);
    expect(all.length).toBe(1);
    expect(all[0].invoiceNumber).toBe("PRO-2026-0001");
    expect(all[0].client.name).toBe("Coopérative Faso Baara");

    const fetched = partnerInvoiceStorage.getById(partnerId, "inv_1");
    expect(fetched).toBeDefined();
    expect(fetched?.totalTtc).toBe(50000);

    // Suppression
    partnerInvoiceStorage.delete(partnerId, "inv_1");
    expect(partnerInvoiceStorage.getAll(partnerId).length).toBe(0);
  });

  it("convertit avec succès une proforma en facture définitive", () => {
    const proforma: PartnerInvoice = {
      id: "pro_123",
      partnerId,
      type: "proforma",
      invoiceNumber: "PRO-2026-0001",
      date: "2026-10-08",
      dueDate: "2026-11-08",
      client: {
        name: "Ferme Agro-Pastorale Neerwaya",
        phone: "+226 78 00 11 22",
      },
      items: [
        {
          id: "it_1",
          designation: "Conseil en irrigation goutte-à-goutte",
          quantity: 1,
          unit: "prestation",
          unitPrice: 150000,
          total: 150000,
        },
      ],
      subtotal: 150000,
      discountPercent: 0,
      discountAmount: 0,
      taxRate: 18,
      taxAmount: 27000,
      totalTtc: 177000,
      status: "envoyee",
      createdAt: "2026-10-08T10:00:00Z",
      updatedAt: "2026-10-08T10:00:00Z",
    };

    partnerInvoiceStorage.save(partnerId, proforma);

    const definitive = partnerInvoiceStorage.convertProformaToDefinitive(partnerId, "pro_123");
    expect(definitive).not.toBeNull();
    expect(definitive?.type).toBe("definitive");
    expect(definitive?.convertedFromProformaId).toBe("pro_123");
    expect(definitive?.invoiceNumber).toMatch(/^FAC-\d{4}-\d{4}$/);

    // L'ancienne proforma doit être passée en statut 'validee'
    const updatedProforma = partnerInvoiceStorage.getById(partnerId, "pro_123");
    expect(updatedProforma?.status).toBe("validee");
  });

  it("convertit correctement les montants en toutes lettres en français", () => {
    expect(amountInWordsFrench(0)).toBe("Zéro franc CFA");
    expect(amountInWordsFrench(1500)).toBe("Mille cinq cents francs CFA");
    expect(amountInWordsFrench(243000)).toBe("Deux cent quarante-trois mille francs CFA");
    expect(amountInWordsFrench(1000000)).toBe("Un million francs CFA");
  });

  it("formate en FCFA sans aucun slash", () => {
    const formatted = formatFcfa(150000);
    expect(formatted).toBe("150 000 FCFA");
    expect(formatted).not.toContain("/");
  });

  it("génère un document PDF complet sans erreur", () => {
    const invoice: PartnerInvoice = {
      id: "inv_pdf_1",
      partnerId,
      type: "definitive",
      invoiceNumber: "FAC-2026-0001",
      date: "2026-10-08",
      dueDate: "2026-11-08",
      client: {
        name: "Société Civile Agricole du Kadiogo",
        phone: "+226 25 30 00 00",
        email: "contact@kadiogo-agri.bf",
        address: "Zone Industrielle de Kossodo",
        nifRccm: "BF012023B001",
      },
      items: [
        {
          id: "it_1",
          designation: "Tuyaux PEHD 32mm PN10 (couronne 100m)",
          quantity: 4,
          unit: "unité",
          unitPrice: 45000,
          total: 180000,
        },
      ],
      subtotal: 180000,
      discountPercent: 5,
      discountAmount: 9000,
      taxRate: 18,
      taxAmount: 30780,
      totalTtc: 201780,
      paymentMethod: "Virement bancaire",
      paymentTerms: "30 jours date de facture",
      bankDetails: "Coris Bank International - IBAN BF01 1234 5678",
      notes: "Marchandise livrée conforme au bon de commande N° 45.",
      status: "envoyee",
      createdAt: "2026-10-08T10:00:00Z",
      updatedAt: "2026-10-08T10:00:00Z",
    };

    const doc = generatePartnerInvoicePdf(invoice);
    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });
});
