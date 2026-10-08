/**
 * Générateur PDF pour Factures Proforma et Factures Définitives Partenaires.
 * Conforme aux normes commerciales OHADA / Burkina Faso :
 * - Cartouches Émetteur et Client soignés
 * - Récapitulatif HT, Remise, TVA et Net à payer TTC en FCFA
 * - Montant en toutes lettres
 * - Prise en compte du profil de marque partenaire (partnerBrandingStorage)
 * - Zéro emoji, aucun slash dans les chiffres ou unités
 * - 100% en français
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PartnerInvoice, amountInWordsFrench, formatFcfa } from "./partnerInvoiceStorage";
import { partnerBrandingStorage, PartnerBranding } from "./partnerBrandingStorage";

function hexToRgb(hex: string): [number, number, number] {
  const clean = (hex || "").replace("#", "");
  const num = parseInt(clean, 16);
  if (isNaN(num) || clean.length !== 6) return [21, 128, 61];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function generatePartnerInvoicePdf(invoice: PartnerInvoice, customBranding?: PartnerBranding): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const branding = customBranding || partnerBrandingStorage.get();
  const primaryRgb = hexToRgb(branding?.primaryColor || "#15803d");
  const accentRgb = hexToRgb(branding?.accentColor || "#eab308");

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const isProforma = invoice.type === "proforma";
  const docTitle = isProforma ? "FACTURE PROFORMA" : "FACTURE COMMERCIALE";

  // --- 1. BANDEAU D'EN-TÊTE SUPÉRIEUR ---
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect(0, 0, pageWidth, 24, "F");

  doc.setFillColor(accentRgb[0], accentRgb[1], accentRgb[2]);
  doc.rect(0, 24, pageWidth, 2.5, "F");

  // Nom de l'entreprise émettrice
  const companyTitle = (
    branding.companyName ||
    branding.logoText ||
    "ÉTABLISSEMENT COMMERCIAL & PRESTATIONS"
  ).toUpperCase();

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(companyTitle, margin, 11);

  // Sous-titre ou spécialité
  const tagline = branding.tagline || "FOURNITURE D'INTRANTS, MATÉRIEL & PRESTATIONS AGRICOLES";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(tagline, margin, 17);

  // Type de document à droite
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(docTitle, pageWidth - margin, 14, { align: "right" });

  let cursorY = 34;

  // --- 2. CARTOUCHES ÉMETTEUR & CLIENT ---
  const boxWidth = (pageWidth - margin * 2 - 8) / 2;
  const boxHeight = 44;

  // Boîte Émetteur (Gauche)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, cursorY, boxWidth, boxHeight, 2, 2, "FD");

  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("ÉMETTEUR / PRESTATAIRE", margin + 4, cursorY + 7);

  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  const expertDisplayName = branding.expertName
    ? `${branding.expertName} (${branding.expertTitle || "Responsable"})`
    : branding.companyName || "Service Commercial";
  doc.text(expertDisplayName, margin + 4, cursorY + 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  let emY = cursorY + 19;
  if (branding.address) {
    doc.text(`Adresse : ${branding.address}`, margin + 4, emY);
    emY += 5;
  }
  if (branding.phone) {
    doc.text(`Téléphone : ${branding.phone}`, margin + 4, emY);
    emY += 5;
  }
  if (branding.email) {
    doc.text(`Courriel : ${branding.email}`, margin + 4, emY);
    emY += 5;
  }
  if (branding.registrationNumber) {
    doc.text(`RCCM / NIF : ${branding.registrationNumber}`, margin + 4, emY);
  }

  // Boîte Client (Droite)
  const clientX = margin + boxWidth + 8;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(clientX, cursorY, boxWidth, boxHeight, 2, 2, "FD");

  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("CLIENT / FACTURÉ À", clientX + 4, cursorY + 7);

  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(invoice.client.name || "Client Particulier / Entreprise", clientX + 4, cursorY + 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  let clY = cursorY + 19;
  if (invoice.client.phone) {
    doc.text(`Téléphone : ${invoice.client.phone}`, clientX + 4, clY);
    clY += 5;
  }
  if (invoice.client.email) {
    doc.text(`Courriel : ${invoice.client.email}`, clientX + 4, clY);
    clY += 5;
  }
  if (invoice.client.address) {
    doc.text(`Adresse : ${invoice.client.address}`, clientX + 4, clY);
    clY += 5;
  }
  if (invoice.client.nifRccm) {
    doc.text(`NIF / IFU / RCCM : ${invoice.client.nifRccm}`, clientX + 4, clY);
  }

  cursorY += boxHeight + 6;

  // --- 3. BANDE D'INFORMATION DU DOCUMENT ---
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, cursorY, pageWidth - margin * 2, 12, "FD");

  doc.setTextColor(51, 65, 85);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);

  const colW = (pageWidth - margin * 2) / 4;
  doc.text(`N° ${docTitle} :`, margin + 3, cursorY + 5);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.invoiceNumber, margin + 3, cursorY + 9.5);

  doc.setFont("helvetica", "bold");
  doc.text("Date d'émission :", margin + colW + 3, cursorY + 5);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.date, margin + colW + 3, cursorY + 9.5);

  doc.setFont("helvetica", "bold");
  const dueLabel = isProforma ? "Validité de l'offre :" : "Date d'échéance :";
  doc.text(dueLabel, margin + colW * 2 + 3, cursorY + 5);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.dueDate || "30 jours", margin + colW * 2 + 3, cursorY + 9.5);

  doc.setFont("helvetica", "bold");
  doc.text("Statut du document :", margin + colW * 3 + 3, cursorY + 5);
  doc.setFont("helvetica", "normal");
  const statusLabels: Record<string, string> = {
    brouillon: "Brouillon",
    envoyee: "Envoyée",
    validee: "Validée",
    payee: "Payée",
    annulee: "Annulée",
  };
  doc.text(statusLabels[invoice.status] || "Émise", margin + colW * 3 + 3, cursorY + 9.5);

  cursorY += 16;

  // --- 4. TABLEAU DES ARTICLES / LIGNES ---
  const tableRows = invoice.items.map((item, idx) => [
    String(idx + 1),
    item.designation,
    String(item.quantity),
    item.unit || "unité",
    formatFcfa(item.unitPrice),
    formatFcfa(item.total),
  ]);

  autoTable(doc, {
    startY: cursorY,
    head: [["N°", "Désignation", "Qté", "Unité", "Prix unitaire HT", "Total HT"]],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: primaryRgb,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "left",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 16, halign: "center" },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 32, halign: "right" },
      5: { cellWidth: 34, halign: "right" },
    },
    margin: { left: margin, right: margin },
  });

  // @ts-expect-error autoTable adds lastAutoTable to doc
  cursorY = doc.lastAutoTable.finalY + 6;

  // Vérifier si un saut de page est nécessaire pour les totaux
  if (cursorY > pageHeight - 75) {
    doc.addPage();
    cursorY = 25;
  }

  // --- 5. TOTAUX ET RÉCAPITULATIF FINANCIER ---
  const totalsWidth = 85;
  const totalsX = pageWidth - margin - totalsWidth;
  const leftBlockWidth = totalsX - margin - 6;

  // Bloc de gauche : Modalités et notes
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, cursorY, leftBlockWidth, 38, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text("MODALITÉS DE RÈGLEMENT", margin + 4, cursorY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  let noteY = cursorY + 12;

  if (invoice.paymentMethod) {
    doc.text(`Mode de règlement : ${invoice.paymentMethod}`, margin + 4, noteY);
    noteY += 4.5;
  }
  if (invoice.paymentTerms) {
    doc.text(`Conditions : ${invoice.paymentTerms}`, margin + 4, noteY);
    noteY += 4.5;
  }
  if (invoice.bankDetails) {
    doc.text(`Coordonnées / Comptes : ${invoice.bankDetails}`, margin + 4, noteY);
    noteY += 4.5;
  }
  if (invoice.notes) {
    doc.setFont("helvetica", "italic");
    const splitNotes = doc.splitTextToSize(`Notes : ${invoice.notes}`, leftBlockWidth - 8);
    doc.text(splitNotes, margin + 4, noteY);
  }

  // Bloc de droite : Tableau des montants
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(totalsX, cursorY, totalsWidth, 38, 2, 2, "FD");

  let tY = cursorY + 6;
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  // Total HT Brut
  doc.setFont("helvetica", "normal");
  doc.text("Total Général HT :", totalsX + 4, tY);
  doc.text(formatFcfa(invoice.subtotal), totalsX + totalsWidth - 4, tY, { align: "right" });
  tY += 5;

  // Remise si présente
  if (invoice.discountAmount > 0) {
    doc.text(`Remise (${invoice.discountPercent} %) :`, totalsX + 4, tY);
    doc.text(`- ${formatFcfa(invoice.discountAmount)}`, totalsX + totalsWidth - 4, tY, { align: "right" });
    tY += 5;
  }

  // TVA
  const tvaLabel = invoice.taxRate > 0 ? `TVA (${invoice.taxRate} %) :` : "TVA (Exonérée / 0 %) :";
  doc.text(tvaLabel, totalsX + 4, tY);
  doc.text(formatFcfa(invoice.taxAmount), totalsX + totalsWidth - 4, tY, { align: "right" });
  tY += 7;

  // Ligne de séparation
  doc.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.setLineWidth(0.5);
  doc.line(totalsX + 3, tY - 2, totalsX + totalsWidth - 3, tY - 2);

  // NET À PAYER TTC
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect(totalsX + 1, tY, totalsWidth - 2, 10, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("NET À PAYER TTC :", totalsX + 4, tY + 6.5);
  doc.setFontSize(9.5);
  doc.text(formatFcfa(invoice.totalTtc), totalsX + totalsWidth - 4, tY + 6.5, { align: "right" });

  cursorY += 44;

  // --- 6. MONTANT EN TOUTES LETTRES ---
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 12, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text("ARRÊTÉE LA PRÉSENTE FACTURE À LA SOMME DE :", margin + 4, cursorY + 5);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  const words = amountInWordsFrench(invoice.totalTtc);
  doc.text(words, margin + 4, cursorY + 9.5);

  cursorY += 18;

  // --- 7. ZONES DE SIGNATURE ET CACHET ---
  const signWidth = (pageWidth - margin * 2 - 20) / 2;
  const signHeight = 24;

  // Signature Client
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, cursorY, signWidth, signHeight, 1.5, 1.5, "D");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("Bon pour accord et règlement (Client)", margin + 4, cursorY + 5);

  // Signature Émetteur
  const emSignX = pageWidth - margin - signWidth;
  doc.roundedRect(emSignX, cursorY, signWidth, signHeight, 1.5, 1.5, "D");
  doc.text("Signature et Cachet de l'Émetteur", emSignX + 4, cursorY + 5);

  // --- 8. PIED DE PAGE LÉGAL ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

    const footerText = branding ? partnerBrandingStorage.getFooterText() : "Document officiel d'exploitation commerciale";
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(footerText, margin, pageHeight - 9);
    doc.text(`Page ${i} sur ${totalPages}`, pageWidth - margin, pageHeight - 9, { align: "right" });
  }

  return doc;
}
