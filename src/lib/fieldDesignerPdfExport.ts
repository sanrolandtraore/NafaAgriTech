/**
 * NAFA FIELD DESIGNER — EXPORT PDF OFFICIEL & DOSSIERS TECHNIQUES
 * Devis chiffré FCFA, Métrés, Rapports d'intervention et Plans de parcelle.
 * Intègre la personnalisation de marque partenaire (logo, nom cabinet, couleurs).
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { EngineeringQuoteDoc, FieldVisitReport, Farm, Field } from "@/types/fieldDesigner";
import { partnerBrandingStorage, PartnerBranding } from "./partnerBrandingStorage";
import { pdfExportHistory } from "./pdfExportHistory";

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  if (isNaN(num) || clean.length !== 6) return [21, 128, 61];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function drawHeader(
  doc: jsPDF,
  title: string,
  pageNumber: number,
  branding: PartnerBranding
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryRgb = hexToRgb(branding.primaryColor || "#15803d");
  const accentRgb = hexToRgb(branding.accentColor || "#eab308");

  // Bandeau supérieur
  doc.setFillColor(...primaryRgb);
  doc.rect(0, 0, pageWidth, 24, "F");

  // Liseré accent
  doc.setFillColor(...accentRgb);
  doc.rect(0, 24, pageWidth, 2.5, "F");

  // Nom entreprise / NAFA
  const displayName = branding.companyName.trim()
    ? branding.companyName.trim()
    : "NAFA FIELD DESIGNER • AFRIQUE";

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(displayName.toUpperCase(), 14, 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const tagline = branding.tagline.trim()
    ? branding.tagline.trim()
    : "CONCEPTION AGRONOMIQUE • GÉODÉSIE • HYDRAULIQUE • ÉLEVAGE";
  doc.text(tagline, 14, 18);

  // Titre du document à droite
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(title.toUpperCase(), pageWidth - 14, 14, { align: "right" });

  // Pied de page
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(220, 225, 230);
  doc.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16);

  const footerText = partnerBrandingStorage.getFooterText();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(110, 120, 130);
  doc.text(footerText, 14, pageHeight - 10);
  doc.text(`Page ${pageNumber}`, pageWidth - 14, pageHeight - 10, { align: "right" });
}

export function exportQuotePdf(
  quote: EngineeringQuoteDoc,
  farm?: Farm,
  expertName?: string
): jsPDF {
  const branding = partnerBrandingStorage.get();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  drawHeader(doc, "Devis Estimatif Officiel", 1, branding);

  let y = 36;

  // Cadre Info Client & Exploitation
  doc.setDrawColor(220, 226, 232);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 28, 30, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(`Dossier : ${quote.title || "Devis d'Aménagement Agricole"}`, 20, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Client / Promoteur : ${quote.clientName || "Non renseigné"}`, 20, y + 16);
  doc.text(`Téléphone : ${quote.clientPhone || "Non renseigné"}`, 20, y + 22);

  const farmLoc = farm ? `${farm.name} (${farm.locality}, ${farm.region})` : "Site de l'exploitation";
  doc.text(`Localisation : ${farmLoc}`, pageWidth / 2 + 10, y + 16);
  doc.text(`Date d'émission : ${new Date(quote.createdAt).toLocaleDateString("fr-FR")}`, pageWidth / 2 + 10, y + 22);

  y += 38;

  // Tableau des articles
  const tableData = quote.items.map((item, idx) => [
    (idx + 1).toString(),
    item.designation,
    item.unit,
    item.quantity.toString(),
    item.unitPriceFCFA.toLocaleString("fr-FR") + " F",
    item.totalFCFA.toLocaleString("fr-FR") + " F",
  ]);

  autoTable(doc, {
    startY: y,
    head: [["N°", "Désignation & Caractéristiques", "Unité", "Qté", "P.U. (FCFA)", "Montant (FCFA)"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: hexToRgb(branding.primaryColor || "#15803d"),
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 18, halign: "center" },
      3: { cellWidth: 16, halign: "right" },
      4: { cellWidth: 26, halign: "right" },
      5: { cellWidth: 30, halign: "right", fontStyle: "bold" },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Récapitulatif financier
  const summaryX = pageWidth - 90;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(summaryX, finalY, 76, 42, 2, 2, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  doc.text("Sous-total Matériaux :", summaryX + 4, finalY + 8);
  doc.text(`${quote.subtotalMaterialsFCFA.toLocaleString("fr-FR")} FCFA`, summaryX + 72, finalY + 8, { align: "right" });

  doc.text("Main d'œuvre qualifiée :", summaryX + 4, finalY + 16);
  doc.text(`${quote.laborCostFCFA.toLocaleString("fr-FR")} FCFA`, summaryX + 72, finalY + 16, { align: "right" });

  doc.text("Logistique & Transport :", summaryX + 4, finalY + 24);
  doc.text(`${quote.transportCostFCFA.toLocaleString("fr-FR")} FCFA`, summaryX + 72, finalY + 24, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...hexToRgb(branding.primaryColor || "#15803d"));
  doc.text("TOTAL ESTIMÉ (FCFA) :", summaryX + 4, finalY + 36);
  doc.text(`${quote.totalGeneralFCFA.toLocaleString("fr-FR")} F`, summaryX + 72, finalY + 36, { align: "right" });

  // Visa & Signature
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text("L'Agronome Responsable :", 14, finalY + 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(expertName || branding.expertName || "Ingénieur Agronome Agréé", 14, finalY + 18);
  doc.text("Visa & Cachet Technique :", 14, finalY + 26);

  return doc;
}

export function exportFieldVisitPdf(
  visit: FieldVisitReport,
  farm?: Farm,
  field?: Field
): jsPDF {
  const branding = partnerBrandingStorage.get();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  drawHeader(doc, "Rapport d'Intervention Terrain", 1, branding);

  let y = 36;

  // Cadre Info Visite
  doc.setDrawColor(220, 226, 232);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 28, 32, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(`Rapport de Visite : ${farm ? farm.name : "Exploitation Agricole"}`, 20, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Date & Heure : ${visit.visitDate} à ${visit.visitTime}`, 20, y + 16);
  doc.text(`Parcelle ciblée : ${field ? field.name : "Parcelle générale"}`, 20, y + 22);

  const gpsStr = visit.gps ? `${visit.gps.lat.toFixed(5)}°N, ${visit.gps.lng.toFixed(5)}°W` : "GPS in-situ non relevé";
  doc.text(`Coordonnées GPS : ${gpsStr}`, pageWidth / 2 + 5, y + 16);
  doc.text(`Expert / Technicien : ${visit.expertName || branding.expertName || "Agronome"}`, pageWidth / 2 + 5, y + 22);

  y += 42;

  // Culture & Stade
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...hexToRgb(branding.primaryColor || "#15803d"));
  doc.text("1. État Végétatif & Données Phénologiques", 14, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`Culture observée : ${visit.cropObserved || "Non spécifiée"}`, 16, y);
  y += 5;
  doc.text(`Stade de développement : ${visit.growthStage || "Non renseigné"}`, 16, y);
  y += 5;
  if (visit.measurements) {
    doc.text(`Mesures in-situ : ${visit.measurements}`, 16, y);
    y += 5;
  }

  y += 6;

  // Observations
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...hexToRgb(branding.primaryColor || "#15803d"));
  doc.text("2. Observations & Diagnostic Terrain", 14, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  const obsLines = doc.splitTextToSize(visit.observations || "Aucune observation particulière.", pageWidth - 32);
  doc.text(obsLines, 16, y);
  y += obsLines.length * 4.5 + 6;

  // Travaux réalisés
  if (visit.worksDone) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...hexToRgb(branding.primaryColor || "#15803d"));
    doc.text("3. Travaux & Traitements Réalisés", 14, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    const worksLines = doc.splitTextToSize(visit.worksDone, pageWidth - 32);
    doc.text(worksLines, 16, y);
    y += worksLines.length * 4.5 + 6;
  }

  // Recommandations
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...hexToRgb(branding.primaryColor || "#15803d"));
  doc.text("4. Prescriptions & Recommandations Agronomiques", 14, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  const recLines = doc.splitTextToSize(visit.recommendations || "Poursuite de l'itinéraire technique normal.", pageWidth - 32);
  doc.text(recLines, 16, y);
  y += recLines.length * 4.5 + 10;

  // Prochaine intervention
  if (visit.nextVisitDate) {
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(14, y, pageWidth - 28, 14, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(6, 95, 70);
    doc.text(`Prochaine visite programmée : ${visit.nextVisitDate}`, 20, y + 9);
  }

  return doc;
}

/**
 * Génère le devis PDF, déclenche le téléchargement et l'enregistre dans l'historique
 */
export function saveTechnicalQuotePdf(
  quote: EngineeringQuoteDoc,
  farm?: Farm,
  expertName?: string
): jsPDF {
  const doc = exportQuotePdf(quote, farm, expertName);
  const cleanTitle = quote.title || "Devis d'Aménagement Agricole";
  const filename = `devis_${(quote.title || "amenagement").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}_${Date.now()}.pdf`;

  pdfExportHistory.saveAndRecordPdf({
    title: cleanTitle,
    filename,
    module: "field_designer",
    categoryLabel: "Devis Chiffré FCFA",
    doc,
    authorName: expertName,
    clientName: quote.clientName,
    summary: `Devis d'ingénierie d'un montant total de ${quote.totalGeneralFCFA?.toLocaleString("fr-FR")} FCFA pour ${farm?.name || "l'exploitation"}.`,
    dataSnapshot: {
      quoteId: quote.id,
      totalFCFA: quote.totalGeneralFCFA,
      farmId: farm?.id,
    },
  });

  return doc;
}

/**
 * Génère le rapport d'intervention terrain PDF, déclenche le téléchargement et l'enregistre dans l'historique
 */
export function saveFieldVisitReportPdf(
  visit: FieldVisitReport,
  farm?: Farm,
  field?: Field
): jsPDF {
  const doc = exportFieldVisitPdf(visit, farm, field);
  const filename = `visite_${(farm?.name || "exploitation").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}_${Date.now()}.pdf`;

  pdfExportHistory.saveAndRecordPdf({
    title: `Rapport de Visite - ${farm?.name || "Exploitation"}`,
    filename,
    module: "field_designer",
    categoryLabel: "Intervention Terrain",
    doc,
    authorName: visit.expertName,
    summary: `Intervention du ${visit.visitDate} sur la parcelle ${field?.name || "principale"}. Culture : ${visit.cropObserved || "Générale"}.`,
    dataSnapshot: {
      visitId: visit.id,
      farmId: farm?.id,
      fieldId: field?.id,
    },
  });

  return doc;
}
