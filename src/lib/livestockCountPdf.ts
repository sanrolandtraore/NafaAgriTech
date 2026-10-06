/**
 * NAFA-AGRITECH — Générateur de Rapport Officiel de Comptage & Densité d'Élevage
 * Format PDF normalisé pour Éleveurs, Techniciens et Cabinets Vétérinaires
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { LivestockCountRecord } from "./livestockCountStorage";
import { LIVESTOCK_DENSITY_STANDARDS } from "./livestockVisionCounter";

export interface GenerateCountPdfInput {
  record: LivestockCountRecord;
  farmName?: string;
  location?: string;
  technicianName?: string;
  technicianTitle?: string;
}

export function generateLivestockCountPdf(input: GenerateCountPdfInput): jsPDF {
  const { record, farmName, location, technicianName, technicianTitle } = input;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. Bandeau supérieur vert NAFA
  doc.setFillColor(21, 128, 61); // #15803d
  doc.rect(0, 0, pageWidth, 24, "F");

  doc.setFillColor(234, 179, 8); // #eab308 (or doré)
  doc.rect(0, 24, pageWidth, 2, "F");

  // Titres du bandeau
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("NAFA - AGRITECH", 14, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("DÉCISION NUMÉRIQUE & ZOOTECHNIE SAHÉLIENNE", 14, 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("RAPPORT OFFICIEL DE COMPTAGE", pageWidth - 14, 15, { align: "right" });

  let currentY = 36;

  // 2. Fiche d'identification
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("1. IDENTIFICATION DE L'ÉLEVAGE & INTERVENTION", 14, currentY);

  currentY += 6;

  const dateFormatted = new Date(record.countedAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  autoTable(doc, {
    startY: currentY,
    theme: "grid",
    headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 3 },
    body: [
      [
        { content: "Élevage / Ferme", styles: { fontStyle: "bold" } },
        farmName || "Non spécifié",
        { content: "Date du relevé", styles: { fontStyle: "bold" } },
        dateFormatted,
      ],
      [
        { content: "Localisation", styles: { fontStyle: "bold" } },
        location || "Zone agro-écologique sahélienne",
        { content: "Espèce animale", styles: { fontStyle: "bold" } },
        record.species.toUpperCase(),
      ],
      [
        { content: "Opérateur / Technicien", styles: { fontStyle: "bold" } },
        technicianName || record.observerName || "Technicien NAFA",
        { content: "Titre / Rôle", styles: { fontStyle: "bold" } },
        technicianTitle || "Expert Zootechnicien",
      ],
      [
        { content: "Source de mesure", styles: { fontStyle: "bold" } },
        record.sourceType === "photo" ? "Cliché haute définition" : "Analyse vidéo séquentielle",
        { content: "Identifiant audit", styles: { fontStyle: "bold" } },
        record.id,
      ],
    ],
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // 3. Résultat du Dénombrement par Vision IA
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text("2. RÉSULTATS DU DÉNOMBREMENT & CONFIANCE IA", 14, currentY);

  currentY += 6;

  const countDiff = record.correctedCount - record.detectedCount;
  const countDiffText = countDiff === 0 ? "Aucun écart (Validé tel quel)" : countDiff > 0 ? `+${countDiff} sujets ajustés` : `${countDiff} sujets retirés`;

  autoTable(doc, {
    startY: currentY,
    theme: "striped",
    head: [["Indicateur de mesure", "Valeur enregistrée", "Interprétation & Statut"]],
    headStyles: { fillColor: [21, 128, 61], textColor: [255, 255, 255], fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 3.5 },
    body: [
      ["Effectif détecté par l'IA", `${record.detectedCount} ${record.species}`, "Reconnaissance automatisée des silhouettes"],
      ["Effectif validé (Correction humaine)", `${record.correctedCount} ${record.species}`, countDiffText],
      ["Niveau de confiance estimé", `${record.confidenceScore} % (${record.confidenceLevel.toUpperCase()})`, record.qualityWarning || "Condition lumineuse et contraste optimaux"],
      ["Suites détectés individuellement", `${record.detectionsSnapshot.length} détections`, "Positions géolocalisées sur le cliché source"],
    ],
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // 4. Analyse de Densité et Bien-être Animal
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text("3. ANALYSE ZOOTECHNIQUE DE LA DENSITÉ (M²)", 14, currentY);

  currentY += 6;

  const standard = LIVESTOCK_DENSITY_STANDARDS[record.species] || LIVESTOCK_DENSITY_STANDARDS.autre;
  const surface = record.surfaceAreaM2 ? `${record.surfaceAreaM2} m²` : "Non renseignée";
  const density = record.densityPerM2 ? `${record.densityPerM2} ${standard.unit}` : "N/A";
  const alertText = record.isOvercrowded
    ? "SURCHARGE DÉTECTÉE : Risque d'asphyxie thermique et piquage"
    : "Densité conforme aux normes climatiques d'Afrique de l'Ouest";

  autoTable(doc, {
    startY: currentY,
    theme: "grid",
    head: [["Surface Bâtiment", "Densité Mesurée", "Norme Sahélienne Max", "Diagnostic Zootechnique"]],
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    styles: { fontSize: 8.5, cellPadding: 3 },
    body: [
      [
        surface,
        density,
        `${standard.standardMaxDensityPerM2} ${standard.unit}`,
        alertText,
      ],
    ],
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // 5. Image analysée avec les boîtes si disponible
  if (record.imageThumbnailDataUrl && currentY < 210) {
    try {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("4. VISUALISATION DES DÉTECTIONS D'INDIVIDUS", 14, currentY);
      currentY += 4;
      doc.addImage(record.imageThumbnailDataUrl, "JPEG", 14, currentY, 90, 50);
      currentY += 54;
    } catch (_e) {
      // Ignoré si le format image ne peut être intégré
    }
  }

  // 6. Observations & Signatures
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("5. OBSERVATIONS DU TECHNICIEN / VÉTÉRINAIRE", 14, currentY);
  currentY += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const notes = record.technicianNotes || "Régularité de l'effectif vérifiée lors de l'audit. Prévoir un contrôle de suivi après distribution des aliments.";
  doc.text(notes, 14, currentY, { maxWidth: pageWidth - 28 });

  currentY += 15;

  // Cadre de signature
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, currentY, 80, 24);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Visa de l'Éleveur :", 16, currentY + 5);

  doc.rect(pageWidth - 94, currentY, 80, 24);
  doc.text("Signature & Cachet du Cabinet Vétérinaire / Technicien :", pageWidth - 92, currentY + 5);

  // Bas de page
  doc.setDrawColor(226, 232, 240);
  doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Document officiel édité via NAFA-AGRITECH • Modèle de Vision Zootechnique Assistée", 14, pageHeight - 7);
  doc.text("Page 1 sur 1", pageWidth - 14, pageHeight - 7, { align: "right" });

  return doc;
}
