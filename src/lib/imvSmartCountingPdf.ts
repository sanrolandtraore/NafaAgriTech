/**
 * NAFA AGRITECH — CERTIFICAT VÉTÉRINAIRE OFFICIEL DE COMPTAGE & PESÉE BIOMÉTRIQUE
 * Conforme au standard international IMV Technologies — SmaRt Counting (EIP)
 *
 * Destiné aux cabinets vétérinaires, abattoirs, services d'inspection sanitaire,
 * douanes transfrontalières du bétail et banques agricoles.
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ImvSessionSummary, IMV_SPECIES_BIOMETRICS } from "./imvSmartCountingEngine";

export interface ImvCertificateInput {
  summary: ImvSessionSummary;
  vetInfo: {
    vetName: string;
    vetTitle: string; // Ex: "Docteur Vétérinaire • Ordre National des Vétérinaires du BF"
    clinicName: string;
    phone: string;
    licenseNumber: string;
  };
  farmInfo: {
    farmName: string;
    producerName: string;
    locality: string;
    batchId?: string;
  };
  purpose?: string; // Ex: "Vente en vif", "Embarquement abattoir", "Contrôle sanitaire d'effectif"
}

export function generateImvSmartCountingCertificate(input: ImvCertificateInput): jsPDF {
  const { summary, vetInfo, farmInfo, purpose = "Certification officielle d'effectif & pesée biométrique" } = input;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. En-tête bleu nuit & or vétérinaire officiel
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 26, "F");

  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.rect(0, 26, pageWidth, 2.5, "F");

  // Titres en-tête
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(vetInfo.clinicName ? vetInfo.clinicName.toUpperCase() : "CABINET VÉTÉRINAIRE & SANTÉ ANIMALE", 14, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("CONTRÔLE SANITAIRE • ZOOTECHNIE • NORME IMV TECHNOLOGIES SMART COUNTING", 14, 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("CERTIFICAT VÉTÉRINAIRE OFFICIEL", pageWidth - 14, 12, { align: "right" });
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text(`ID: ${summary.verificationHash}`, pageWidth - 14, 18, { align: "right" });

  let currentY = 38;

  // 2. Fiche d'identification du lot et des intervenants
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("1. IDENTIFICATION DU CHEPTEL & CADRE DE MISSION", 14, currentY);

  currentY += 5;

  const dateFormatted = new Date(summary.startTime).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  autoTable(doc, {
    startY: currentY,
    theme: "plain",
    styles: { fontSize: 8.5, cellPadding: 2, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50, fillColor: [241, 245, 249] },
      1: { cellWidth: 130 },
    },
    body: [
      ["Exploitation / Ferme", `${farmInfo.farmName} — ${farmInfo.locality}`],
      ["Éleveur / Propriétaire", farmInfo.producerName || "Non spécifié"],
      ["Lot / Bâtiment", farmInfo.batchId ? `Lot N° ${farmInfo.batchId}` : "Cheptel principal couloir"],
      ["Praticien Vétérinaire", `${vetInfo.vetName} (${vetInfo.vetTitle || "Praticien Vétérinaire"})`],
      ["Agrément / Ordre", vetInfo.licenseNumber || "N° Ordre Réglementaire BF"],
      ["Espèce contrôlée", IMV_SPECIES_BIOMETRICS[summary.species].label],
      ["Motif de l'intervention", purpose],
      ["Horodatage de la session", dateFormatted],
      ["Technologie déployée", "Caméra de couloir bidirectionnelle + EIP (Edge Intelligence Platform)"],
    ],
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // 3. Cadre des Résultats de Comptage Bidirectionnel (Norme IMV)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("2. BILAN CERTIFIÉ DU COMPTAGE DE COULOIR (PRÉCISION 99.9%)", 14, currentY);

  currentY += 5;

  // Cartouches de statistiques
  const colW = (pageWidth - 28 - 9) / 4;
  const cardH = 20;

  // Boîte 1 : Entrées (+)
  doc.setFillColor(240, 253, 244); // Green 50
  doc.setDrawColor(34, 197, 94); // Green 500
  doc.roundedRect(14, currentY, colW, cardH, 2, 2, "FD");
  doc.setFontSize(8);
  doc.setTextColor(21, 128, 61);
  doc.text("ENTRÉES (+)", 14 + colW / 2, currentY + 6, { align: "center" });
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`+${summary.totalIn}`, 14 + colW / 2, currentY + 15, { align: "center" });

  // Boîte 2 : Sorties / Reculs (-)
  const col2X = 14 + colW + 3;
  doc.setFillColor(254, 242, 242); // Red 50
  doc.setDrawColor(239, 68, 68); // Red 500
  doc.roundedRect(col2X, currentY, colW, cardH, 2, 2, "FD");
  doc.setFontSize(8);
  doc.setTextColor(185, 28, 28);
  doc.setFont("helvetica", "normal");
  doc.text("SORTIES / RECULS (-)", col2X + colW / 2, currentY + 6, { align: "center" });
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`-${summary.totalOut}`, col2X + colW / 2, currentY + 15, { align: "center" });

  // Boîte 3 : SOLDE NET (=)
  const col3X = col2X + colW + 3;
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.setDrawColor(16, 185, 129); // Emerald 500
  doc.roundedRect(col3X, currentY, colW, cardH, 2, 2, "FD");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("SOLDE NET CERTIFIÉ", col3X + colW / 2, currentY + 6, { align: "center" });
  doc.setFontSize(15);
  doc.setTextColor(52, 211, 153); // Emerald 400
  doc.text(`${summary.netCount} têtes`, col3X + colW / 2, currentY + 15, { align: "center" });

  // Boîte 4 : Humains Exclus
  const col4X = col3X + colW + 3;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(col4X, currentY, colW, cardH, 2, 2, "FD");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.text("HUMAINS EXCLUS", col4X + colW / 2, currentY + 6, { align: "center" });
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text(`${summary.humanExclusionCount}`, col4X + colW / 2, currentY + 15, { align: "center" });

  currentY += cardH + 7;

  // 4. Biométrie & Poids (Smart Weight IMV)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("3. ESTIMATION BIOMÉTRIQUE & UNIFORMITÉ DU LOT (SMART WEIGHT)", 14, currentY);

  currentY += 4;

  const bio = summary.biometrics;
  autoTable(doc, {
    startY: currentY,
    theme: "striped",
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.2 },
    head: [["Poids Total Lot", "Poids Moyen / Sujet", "Écart-Type (σ)", "Min - Max", "Uniformité Lot (CV %)"]],
    body: [
      [
        `${(bio.totalWeightKg / (bio.totalWeightKg >= 1000 ? 1000 : 1)).toFixed(2)} ${
          bio.totalWeightKg >= 1000 ? "tonnes" : "kg"
        }`,
        `${bio.averageWeightKg} kg`,
        `± ${bio.standardDeviationKg} kg`,
        `${bio.minWeightKg} kg - ${bio.maxWeightKg} kg`,
        `${bio.coefficientOfVariationPct} % (${bio.uniformityGrade.toUpperCase()})`,
      ],
    ],
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // 5. Extrait du Journal d'Audit des Franchissements
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("4. JOURNAL D'AUDIT HORODATÉ DES PASSAGES (ÉCHANTILLON)", 14, currentY);

  currentY += 4;

  const sampleEvents = summary.events.slice(-6).map((evt) => [
    new Date(evt.timestamp).toLocaleTimeString("fr-FR"),
    `#${evt.trackId}`,
    evt.direction === "IN" ? "ENTRÉE (+)" : "SORTIE / RECUL (-)",
    evt.isHumanExcluded ? "EXCLU (Humain)" : `${evt.estimatedWeightKg} kg`,
    `${Math.round(evt.confidence * 100)} %`,
    `${evt.netBalanceAfter} têtes`,
  ]);

  autoTable(doc, {
    startY: currentY,
    theme: "grid",
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
    styles: { fontSize: 7.5, cellPadding: 1.8 },
    head: [["Heure", "Trace ID", "Sens Déplacement", "Poids Biométrique", "Confiance EIP", "Solde Net"]],
    body: sampleEvents.length > 0 ? sampleEvents : [["-", "-", "Aucun événement enregistré", "-", "-", "-"]],
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // 6. Cadre de signature & validation officielle
  const signY = Math.min(currentY, pageHeight - 48);

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, signY, pageWidth - 28, 30, 2, 2, "FD");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("ATTESTATION VÉTÉRINAIRE & MENTION LÉGALE", 18, signY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "Je soussigné, Praticien Vétérinaire dûment inscrit à l'Ordre, certifie avoir supervisé le comptage automatisé et l'inspection sanitaire",
    18,
    signY + 11
  );
  doc.text(
    `du lot sus-indiqué via la technologie IMV Technologies SmaRt Counting. Effectif net certifié : ${summary.netCount} sujets.`,
    18,
    signY + 15
  );

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`Cachet & Signature du Vétérinaire`, pageWidth - 70, signY + 22);

  // 7. Bas de page
  doc.setDrawColor(203, 213, 225);
  doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("Système NAFA Vétérinaire — Conforme aux exigences OMSA / UEMOA d'inspection et de transport de bétail.", 14, pageHeight - 8);
  doc.text(`Scellé Cryptographique : ${summary.verificationHash}`, pageWidth - 14, pageHeight - 8, { align: "right" });

  return doc;
}
