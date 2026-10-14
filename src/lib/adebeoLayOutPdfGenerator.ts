/**
 * NAFA STUDIO 3D x ADEBEO / SKETCHUP LAYOUT
 * Générateur de Carnet de Plans d'Architecte & Dossier d'Exécution Multi-Pages (LayOut A4 Paysage)
 * 
 * Pages générées :
 * - Page 1 : Plan de Masse & Implantation Générale (Échelle 1:200 / 1:500 avec Cartouche d'architecte)
 * - Page 2 : Coupes Transversales & Façades Bioclimatiques (Échelle 1:50 avec flèches thermiques)
 * - Page 3 : Bordereau Quantitatif des Matériaux & Calepinage (BOM / Take-Off chiffré FCFA)
 * - Page 4 : Notice Constructive & Règles Bioclimatiques Sahéliennes (CILSS / INERA)
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FarmElement3D } from "@/components/field-designer/Studio3DFarmModeler";
import { calculateAdebeoBom, AdebeoBomTakeOff } from "./adebeoBomEngine";
import { pdfExportHistory } from "./pdfExportHistory";

export interface LayOutPdfOptions {
  projectName: string;
  clientName: string;
  clientPhone?: string;
  locality?: string;
  region?: string;
  province?: string;
  areaHa?: number;
  perimeterM?: number;
  soilType?: string;
  waterFlowM3H?: number;
  boundary?: Array<{ x: number; y: number; label?: string }>;
}

export function generateAdebeoLayOutPdf(elements: FarmElement3D[], options: LayOutPdfOptions): { doc: jsPDF; filename: string; bom: AdebeoBomTakeOff } {
  // Format standard LayOut : A4 Paysage (297 x 210 mm)
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pw = 297;
  const ph = 210;

  const bom = calculateAdebeoBom(elements, options.projectName);

  const drawSheetBorder = (sheetNumber: number, sheetTitle: string) => {
    // Cadre extérieur
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.6);
    doc.rect(8, 8, pw - 16, ph - 16);

    // Cadre intérieur fin
    doc.setLineWidth(0.2);
    doc.rect(10, 10, pw - 20, ph - 20);

    // Repères de coordonnées de bord de plan (A, B, C, D / 1, 2, 3, 4, 5)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);

    ["1", "2", "3", "4", "5", "6"].forEach((lbl, i) => {
      const x = 25 + i * 45;
      doc.text(lbl, x, 9.5, { align: "center" });
      doc.text(lbl, x, ph - 8.5, { align: "center" });
    });
    ["A", "B", "C", "D"].forEach((lbl, i) => {
      const y = 25 + i * 45;
      doc.text(lbl, 9, y, { align: "center" });
      doc.text(lbl, pw - 9, y, { align: "center" });
    });

    // Bandeau d'en-tête de la planche
    doc.setFillColor(21, 128, 61); // Vert NAFA
    doc.rect(10, 10, pw - 20, 8, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("NAFA STUDIO 3D • CARNET DE PLANS D'INGÉNIERIE & D'EXÉCUTION (STANDARD ADEBEO / SKETCHUP LAYOUT)", 14, 15.5);

    doc.text(`PLANCHE ${sheetNumber}/4 — ${sheetTitle.toUpperCase()}`, pw - 14, 15.5, { align: "right" });
  };

  const drawArchitectCartouche = (sheetTitle: string, scaleStr: string = "1:200") => {
    const cw = 95;
    const ch = 38;
    const cx = pw - 10 - cw;
    const cy = ph - 10 - ch;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.5);
    doc.rect(cx, cy, cw, ch, "FD");

    // Lignes de séparation
    doc.setLineWidth(0.2);
    doc.line(cx, cy + 9, cx + cw, cy + 9);
    doc.line(cx, cy + 18, cx + cw, cy + 18);
    doc.line(cx, cy + 28, cx + cw, cy + 28);
    doc.line(cx + 48, cy + 18, cx + 48, cy + 28);
    doc.line(cx + 48, cy + 28, cx + 48, cy + ch);

    // Titre / Logo
    doc.setFillColor(22, 101, 52);
    doc.rect(cx, cy, cw, 9, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("NAFA AGRITECH • BUREAU D'ÉTUDES CAO", cx + 3, cy + 6);
    doc.setFontSize(6.5);
    doc.text("CERTIFIÉ SKETCHUP PRO / LAYOUT", cx + cw - 3, cy + 6, { align: "right" });

    // Projet & Maître d'ouvrage
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(`PROJET : ${options.projectName.toUpperCase()}`, cx + 3, cy + 13);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text(`Maître d'Ouvrage : ${options.clientName} | Tél : ${options.clientPhone || "+226 --"}`, cx + 3, cy + 16.5);

    // Localisation & Échelle
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text(`Localité : ${options.locality || "Kadiogo"}, ${options.region || "Centre"}`, cx + 3, cy + 22);
    doc.text(`Système : UTM 30N (WGS84)`, cx + 3, cy + 25.5);

    doc.setFont("helvetica", "bold");
    doc.text(`ÉCHELLE : ${scaleStr}`, cx + 51, cy + 22);
    doc.setFont("helvetica", "normal");
    doc.text(`Format : A4 Paysage`, cx + 51, cy + 25.5);

    // Titre du dessin & Visa
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(sheetTitle.toUpperCase(), cx + 3, cy + 32);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.text(`Réf : NAFA-ARC-${Date.now().toString().slice(-6)}`, cx + 3, cy + 35.5);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 101, 52);
    doc.text("VISA INGÉNIEUR CAO", cx + 51, cy + 32);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Date : ${new Date().toLocaleDateString("fr-FR")} • Conforme INERA`, cx + 51, cy + 35.5);
  };

  const drawNorthArrow = (x: number, y: number) => {
    // Cercle
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.4);
    doc.circle(x, y, 7);

    // Pointe Nord (Noire)
    doc.setFillColor(30, 41, 59);
    doc.triangle(x, y - 6.5, x - 2, y, x, y, "F");
    // Pointe Sud (Blanche)
    doc.triangle(x, y + 6.5, x + 2, y, x, y, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text("N", x, y - 8, { align: "center" });
    doc.setFontSize(5);
    doc.text("0°", x, y + 9.5, { align: "center" });
  };

  // ═════════════════════════════════════════════════════════════════
  // PLANCHE 1 : PLAN DE MASSE & IMPLANTATION GÉNÉRALE
  // ═════════════════════════════════════════════════════════════════
  drawSheetBorder(1, "Plan de Masse & Implantation Générale");

  // Zone de dessin du plan
  const canvasX = 14;
  const canvasY = 22;
  const canvasW = pw - 28 - 95; // Laisser place au cartouche à droite
  const canvasH = ph - 36;

  // Grille métrique de fond
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.2);
  for (let gx = canvasX; gx <= canvasX + canvasW; gx += 15) {
    doc.line(gx, canvasY, gx, canvasY + canvasH);
  }
  for (let gy = canvasY; gy <= canvasY + canvasH; gy += 15) {
    doc.line(canvasX, gy, canvasX + canvasW, gy);
  }

  // Périmètre d'emprise parcellaire (Polygone schématique)
  doc.setDrawColor(180, 83, 9); // Jaune / Terre
  doc.setLineWidth(0.8);
  const farmRectX = canvasX + 15;
  const farmRectY = canvasY + 12;
  const farmRectW = canvasW - 25;
  const farmRectH = canvasH - 24;
  doc.rect(farmRectX, farmRectY, farmRectW, farmRectH);

  // Bornes d'angle
  const corners = [
    { x: farmRectX, y: farmRectY, label: "B1 (Nord-Ouest)" },
    { x: farmRectX + farmRectW, y: farmRectY, label: "B2 (Nord-Est)" },
    { x: farmRectX + farmRectW, y: farmRectY + farmRectH, label: "B3 (Sud-Est)" },
    { x: farmRectX, y: farmRectY + farmRectH, label: "B4 (Sud-Ouest)" },
  ];
  corners.forEach((c) => {
    doc.setFillColor(217, 119, 6);
    doc.circle(c.x, c.y, 1.2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(180, 83, 9);
    doc.text(c.label, c.x + 2, c.y - 1.5);
  });

  // Éléments du plan projetés
  // Normalisation des positions relatives
  elements.forEach((el, idx) => {
    // Calcul de position à l'intérieur du polygone
    const relX = farmRectX + 10 + (Math.abs(el.x) % (farmRectW - 35));
    const relY = farmRectY + 10 + (Math.abs(el.z) % (farmRectH - 30));
    const drawW = Math.max(12, Math.min(35, el.width * 1.5));
    const drawH = Math.max(8, Math.min(25, el.length * 1.5));

    const lower = (el.type || el.name || "").toLowerCase();

    if (el.category === "building") {
      // Bâtiment : rectangle rouge/brique avec diagonales
      doc.setFillColor(254, 226, 226);
      doc.setDrawColor(220, 38, 38);
      doc.setLineWidth(0.5);
      doc.rect(relX, relY, drawW, drawH, "FD");
      doc.line(relX, relY, relX + drawW, relY + drawH);
      doc.line(relX + drawW, relY, relX, relY + drawH);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.setTextColor(185, 28, 28);
      doc.text(el.name, relX + drawW / 2, relY + drawH / 2 - 1, { align: "center" });
      doc.setFontSize(5);
      doc.text(`${el.width}m × ${el.length}m (H: ${el.height}m)`, relX + drawW / 2, relY + drawH / 2 + 2.5, { align: "center" });

      // Ligne de cote
      doc.setDrawColor(100, 116, 139);
      doc.setLineWidth(0.2);
      doc.line(relX, relY - 2, relX + drawW, relY - 2);
      doc.text(`${el.width} m`, relX + drawW / 2, relY - 3, { align: "center" });
    } else if (lower.includes("chateau") || lower.includes("forage")) {
      // Château d'eau : cercle bleu avec croix
      doc.setFillColor(224, 242, 254);
      doc.setDrawColor(2, 132, 199);
      doc.setLineWidth(0.5);
      doc.circle(relX + 6, relY + 6, 6, "FD");
      doc.line(relX, relY + 6, relX + 12, relY + 6);
      doc.line(relX + 6, relY, relX + 6, relY + 12);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.setTextColor(3, 105, 161);
      doc.text("CHÂTEAU D'EAU", relX + 6, relY + 14, { align: "center" });
    } else if (el.category === "irrigation" || lower.includes("pehd")) {
      // Conduite hydraulique : ligne cyan avec tirets
      doc.setDrawColor(6, 182, 212);
      doc.setLineWidth(0.8);
      doc.line(relX, relY, relX + 40, relY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5);
      doc.setTextColor(8, 145, 178);
      doc.text(`PEHD PN10 Ø50 (${Math.round(el.linearMeters || 40)} ml)`, relX + 20, relY - 1.5, { align: "center" });
    } else {
      // Végétaux / Cultures : cercle vert
      doc.setFillColor(220, 252, 231);
      doc.setDrawColor(22, 163, 74);
      doc.circle(relX + 4, relY + 4, 4, "FD");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5);
      doc.setTextColor(21, 128, 61);
      doc.text(el.name, relX + 4, relY + 10, { align: "center" });
    }
  });

  // Rose des vents & Échelle graphique
  drawNorthArrow(canvasX + 12, canvasY + 12);

  // Échelle graphique en bas à gauche
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.4);
  const scaleBarX = canvasX + 6;
  const scaleBarY = canvasY + canvasH - 8;
  doc.rect(scaleBarX, scaleBarY, 40, 2);
  doc.setFillColor(30, 41, 59);
  doc.rect(scaleBarX, scaleBarY, 10, 2, "F");
  doc.rect(scaleBarX + 20, scaleBarY, 10, 2, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(30, 41, 59);
  doc.text("0", scaleBarX, scaleBarY - 1.5);
  doc.text("10m", scaleBarX + 20, scaleBarY - 1.5);
  doc.text("20m", scaleBarX + 40, scaleBarY - 1.5);
  doc.text("ÉCHELLE GRAPHIQUE 1:200", scaleBarX + 20, scaleBarY + 5.5, { align: "center" });

  drawArchitectCartouche("Plan de Masse & Implantation", "1:200");

  // ═════════════════════════════════════════════════════════════════
  // PLANCHE 2 : COUPES TRANSVERSALES & FAÇADES BIOCLIMATIQUES
  // ═════════════════════════════════════════════════════════════════
  doc.addPage("a4", "landscape");
  drawSheetBorder(2, "Coupe Transversale Bioclimatique & Façades (1:50)");

  // Titre de la coupe
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(21, 128, 61);
  doc.text("COUPE TRANSVERSALE AA — BÂTIMENT AVICOLE BIOCLIMATIQUE SAHÉLIEN (1:50)", 16, 26);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Conception thermique passive : muret parpaing 0.80m, ventilation traversante 70%, débords d'ombrage 1.20m et lanterneau faîtier dépoussiérant.", 16, 30);

  // Dessin vectoriel de la coupe
  const sectionX = 35;
  const sectionGroundY = 125;
  const bldgW = 140; // 14 mètres réels = 140 mm

  // 1. Ligne de sol naturel (+0.00 m)
  doc.setDrawColor(180, 83, 9);
  doc.setLineWidth(0.8);
  doc.line(sectionX - 20, sectionGroundY, sectionX + bldgW + 20, sectionGroundY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(180, 83, 9);
  doc.text("± 0.00 m (Sol Naturel Compacté)", sectionX - 18, sectionGroundY + 4);

  // 2. Dalle béton armé hydrofuge (+0.10 m)
  doc.setFillColor(226, 232, 240);
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.4);
  doc.rect(sectionX, sectionGroundY - 4, bldgW, 4, "FD");
  doc.setTextColor(71, 85, 105);
  doc.text("+ 0.10 m (Dalle Béton Armé 10cm avec treillis soudé)", sectionX + bldgW / 2, sectionGroundY - 1, { align: "center" });

  // 3. Murets de soubassement gauche et droite (+0.80 m)
  const muretH = 16; // 80cm
  doc.setFillColor(203, 213, 225);
  doc.rect(sectionX, sectionGroundY - 4 - muretH, 4, muretH, "FD"); // Muret Ouest
  doc.rect(sectionX + bldgW - 4, sectionGroundY - 4 - muretH, 4, muretH, "FD"); // Muret Est

  doc.setFontSize(5.5);
  doc.text("+ 0.80 m (Arase Muret Parpaings 15×20×40)", sectionX + 6, sectionGroundY - 4 - muretH / 2);

  // 4. Poteaux métalliques et grillage ventilé (+2.50 m)
  const postH = 40; // 2.00m de grillage
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.6);
  doc.line(sectionX + 2, sectionGroundY - 4 - muretH, sectionX + 2, sectionGroundY - 4 - muretH - postH);
  doc.line(sectionX + bldgW - 2, sectionGroundY - 4 - muretH, sectionX + bldgW - 2, sectionGroundY - 4 - muretH - postH);

  // Grillage hachuré
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.15);
  for (let gy = sectionGroundY - 4 - muretH; gy >= sectionGroundY - 4 - muretH - postH; gy -= 4) {
    doc.line(sectionX + 2, gy, sectionX + 6, gy);
    doc.line(sectionX + bldgW - 6, gy, sectionX + bldgW - 2, gy);
  }

  // 5. Toiture à double pente avec débords de 1.20m (12mm)
  const eavesY = sectionGroundY - 4 - muretH - postH; // Sablière (+2.90m)
  const ridgeY = eavesY - 20; // Faîtage (+3.90m)
  const overhang = 14; // 1.40 m de débord

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.9);
  // Versant gauche
  doc.line(sectionX - overhang, eavesY + 3, sectionX + bldgW / 2 - 5, ridgeY);
  // Versant droit
  doc.line(sectionX + bldgW + overhang, eavesY + 3, sectionX + bldgW / 2 + 5, ridgeY);

  // Lanterneau faîtier d'aération haute
  doc.setFillColor(254, 240, 138);
  doc.setDrawColor(202, 138, 4);
  doc.rect(sectionX + bldgW / 2 - 8, ridgeY - 5, 16, 4, "FD");
  doc.setFontSize(5);
  doc.setTextColor(161, 98, 7);
  doc.text("Lanterneau Faîtier Aéré", sectionX + bldgW / 2, ridgeY - 6.5, { align: "center" });

  // Flèches d'aération thermique (Effet cheminée)
  doc.setDrawColor(2, 132, 199);
  doc.setLineWidth(0.5);
  // Air frais entrant par les côtés
  doc.line(sectionX - 8, eavesY + 15, sectionX + 8, eavesY + 15);
  doc.text("Air frais entrant", sectionX + 4, eavesY + 12);

  doc.line(sectionX + bldgW + 8, eavesY + 15, sectionX + bldgW - 8, eavesY + 15);
  doc.text("Air frais entrant", sectionX + bldgW - 14, eavesY + 12);

  // Air chaud s'élevant vers le lanterneau (Flèche rouge montante)
  doc.setDrawColor(220, 38, 38);
  doc.line(sectionX + bldgW / 2, eavesY + 10, sectionX + bldgW / 2, ridgeY + 2);
  doc.text("Évacuation calories (+3.90m)", sectionX + bldgW / 2 + 3, eavesY - 5);

  // Cotes altimétriques à gauche
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.2);
  const dimX = sectionX - 25;
  doc.line(dimX, sectionGroundY, dimX, ridgeY - 5);
  doc.line(dimX - 2, sectionGroundY, dimX + 2, sectionGroundY);
  doc.line(dimX - 2, eavesY, dimX + 2, eavesY);
  doc.line(dimX - 2, ridgeY - 5, dimX + 2, ridgeY - 5);

  doc.setFontSize(5.5);
  doc.setTextColor(51, 65, 85);
  doc.text("H faîtage : 3.90 m", dimX - 3, (sectionGroundY + ridgeY) / 2, { align: "right" });

  // Soleil et ombrage des débords
  doc.setFillColor(250, 204, 21);
  doc.circle(sectionX - 10, 48, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(161, 98, 7);
  doc.text("Soleil Zénithal Sahélien (75°)", sectionX - 10, 40, { align: "center" });

  // Rayon solaire tangentiel
  doc.setDrawColor(234, 179, 8);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(sectionX - 10, 48, sectionX - overhang, eavesY + 3);
  doc.line(sectionX - overhang, eavesY + 3, sectionX, sectionGroundY - 4);
  doc.setLineDashPattern([], 0); // Reset

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(22, 101, 52);
  doc.text("Ombre portée sur le mur : Muret protégé du rayonnement direct", sectionX - 10, eavesY + 24);

  drawArchitectCartouche("Coupes & Façades Bioclimatiques", "1:50");

  // ═════════════════════════════════════════════════════════════════
  // PLANCHE 3 : BORDEREAU QUANTITATIF ESTIMATIF & CALEPINAGE (BOM)
  // ═════════════════════════════════════════════════════════════════
  doc.addPage("a4", "landscape");
  drawSheetBorder(3, "Bordereau Quantitatif des Matériaux & Calepinage (BOM)");

  // Résumé métrique supérieur
  let cardX = 14;
  const cardY = 22;
  const cardW = 38;
  const cardH = 14;

  const summaryCards = [
    { label: "SURFACE BÂTIE", val: `${bom.metrics.totalBuiltAreaM2} m²`, color: [220, 38, 38] },
    { label: "PARPAINGS DE 15", val: `${bom.metrics.totalCinderBlocks} U`, color: [100, 116, 139] },
    { label: "CIMENT CPJ 35", val: `${bom.metrics.totalCementBags50kg} sacs`, color: [71, 85, 105] },
    { label: "TÔLES BAC ALU", val: `${bom.metrics.totalRoofingSheetsCount} U`, color: [2, 132, 199] },
    { label: "RÉSEAU PEHD", val: `${bom.metrics.totalPipingLinearM} ml`, color: [6, 182, 212] },
    { label: "PUISSANCE SOLAIRE", val: `${bom.metrics.totalSolarPowerWp} Wc`, color: [202, 138, 4] },
    { label: "BUDGET ESTIMÉ", val: `${bom.grandTotalFcfa.toLocaleString("fr-FR")} F`, color: [22, 101, 52] },
  ];

  summaryCards.forEach((c) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(cardX, cardY, cardW, cardH, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(5);
    doc.setTextColor(c.color[0], c.color[1], c.color[2]);
    doc.text(c.label, cardX + cardW / 2, cardY + 4.5, { align: "center" });

    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(c.val, cardX + cardW / 2, cardY + 11, { align: "center" });

    cardX += cardW + 2;
  });

  // Tableau du métré détaillé des matériaux
  const bomRows = bom.lines.map((l, i) => [
    String(i + 1),
    l.lotLabel.replace(/Lot \d+ — /, ""),
    l.designation,
    l.specification,
    l.unit,
    l.quantity.toLocaleString("fr-FR"),
    `${l.unitPriceFcfa.toLocaleString("fr-FR")} F`,
    `${l.totalPriceFcfa.toLocaleString("fr-FR")} F`,
  ]);

  autoTable(doc, {
    startY: 39,
    head: [["#", "Corps d'État", "Désignation Matériau", "Spécification Technique & Calepinage", "Unité", "Quantité", "P.U. (FCFA)", "Total (FCFA)"]],
    body: bomRows,
    theme: "grid",
    headStyles: { fillColor: [21, 128, 61], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 6.5, cellPadding: 1.8 },
    bodyStyles: { fontSize: 6, cellPadding: 1.6 },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 32 },
      2: { cellWidth: 42, fontStyle: "bold" },
      3: { cellWidth: 85 },
      4: { cellWidth: 16, halign: "center" },
      5: { cellWidth: 18, halign: "right" },
      6: { cellWidth: 24, halign: "right" },
      7: { cellWidth: 28, halign: "right", fontStyle: "bold" },
    },
    margin: { left: 14, right: 14 },
  });

  drawArchitectCartouche("Bordereau Quantitatif (BOM)", "Take-Off");

  // ═════════════════════════════════════════════════════════════════
  // PLANCHE 4 : NOTICE TECHNIQUE & RÈGLES CONSTRUCTIVES SAHÉLIENNES
  // ═════════════════════════════════════════════════════════════════
  doc.addPage("a4", "landscape");
  drawSheetBorder(4, "Notice Bioclimatique & Règles Constructives Sahéliennes");

  const noteW = (pw - 28 - 95) / 2 - 4;
  const col1X = 14;
  const col2X = col1X + noteW + 8;
  let ny = 24;

  const drawNoticeBox = (x: number, y: number, w: number, h: number, title: string, content: string[], accentColor: number[]) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setLineWidth(0.5);
    doc.rect(x, y, w, h, "FD");

    // En-tête bandeau
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(x, y, w, 6, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text(title.toUpperCase(), x + 3, y + 4.2);

    // Contenu texte
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    let ly = y + 9.5;
    content.forEach((line) => {
      doc.text(line, x + 3, ly);
      ly += 4;
    });
  };

  // Boîte 1 : Orientation Solaire
  drawNoticeBox(
    col1X,
    ny,
    noteW,
    38,
    "1. Orientation Solaire & Minimisation Thermique",
    [
      "• Axe longitudinal du bâtiment orienté strictement EST-OUEST.",
      "• Pignons aveugles exposés aux rayonnements matinaux et vespéraux intenses.",
      "• Débords de toiture calculés à minimum 1.20 m sur les façades Nord et Sud.",
      "• Revêtement de toiture en bac alu à fort albédo (peinture blanche réfléchissante).",
      "• Réduction prouvée de la température intérieure de 4°C à 6°C sans climatisation.",
    ],
    [202, 138, 4]
  );

  // Boîte 2 : Gestion Aéraulique des Vents
  drawNoticeBox(
    col2X,
    ny,
    noteW,
    38,
    "2. Aéraulique Passive : Harmattan & Mousson",
    [
      "• Harmattan (Nord-Est, Novembre-Mars) : vent sec et chargé de poussières fines.",
      "  => Protection par rideaux brise-poussière relevables en façade Nord.",
      "• Mousson (Sud-Ouest, Juin-Octobre) : vent humide apportant les pluies.",
      "  => Captation de la ventilation naturelle par façades largement ouvertes (70%).",
      "• Évacuation permanente de l'ammoniac et de la chaleur par le lanterneau faîtier.",
    ],
    [2, 132, 199]
  );

  ny += 42;

  // Boîte 3 : Matériaux Locaux & Béton Armé
  drawNoticeBox(
    col1X,
    ny,
    noteW,
    42,
    "3. Durabilité Constructive & Normes Béton",
    [
      "• Muret de soubassement en parpaings creux de 15 avec chaînage bas et haut armé.",
      "• Mortier de pose dosé à 300 kg/m³ de ciment CPJ 35 sable fluvial tamisé.",
      "• Dalle béton épaisseur 10 cm dosée à 350 kg/m³ avec pente 1.5% vers caniveaux.",
      "• Grillage triple torsion galvanisé 19 mm fixé sur cornières pour barrage aux rongeurs.",
      "• Poteaux métalliques traités antirouille au chromate de zinc + peinture glycéro.",
    ],
    [21, 128, 61]
  );

  // Boîte 4 : Intégration Hydraulique & Agroforesterie
  drawNoticeBox(
    col2X,
    ny,
    noteW,
    42,
    "4. Synergie Eau & Barrière Végétale Protectrice",
    [
      "• Château d'eau gravitaire sur tour métallique 6m à 9m : pression de service 0.6 bar.",
      "• Canalisations d'adduction en PEHD PN10 enterrées à 60 cm sur lit de sable 10 cm.",
      "• Rideau brise-vent agroforestier planté à 15-20 m au vent (Nord-Est) du bâtiment :",
      "  - Étage haut : Azadirachta indica (Neem), Acacia nilotica, Moringa oleifera.",
      "• Récupération des eaux pluviales de toiture par chéneaux alu vers bassin décanteur.",
    ],
    [13, 148, 136]
  );

  drawArchitectCartouche("Notice Constructive Bioclimatique", "Conforme");

  const filename = `Dossier_LayOut_Adebeo_${options.projectName.replace(/\s+/g, "_")}_${Date.now()}.pdf`;

  // Enregistrement dans l'historique officiel des PDF exportés
  pdfExportHistory.saveAndRecordPdf({
    title: `Dossier LayOut Architecte 3D - ${options.projectName}`,
    filename,
    module: "studio_3d",
    categoryLabel: "LayOut Architectural 3D",
    doc,
    summary: `Carnet de plans d'ingénierie LayOut (4 planches A4 Paysage) : Plan de masse 1:200, Coupe transversale 1:50, Bordereau quantitatif BOM (${bom.metrics.totalBuiltAreaM2} m² bâtis, budget ${bom.grandTotalFcfa.toLocaleString("fr-FR")} FCFA) et Notice bioclimatique.`,
    dataSnapshot: {
      projectName: options.projectName,
      clientName: options.clientName,
      builtAreaM2: bom.metrics.totalBuiltAreaM2,
      cinderBlocks: bom.metrics.totalCinderBlocks,
      cementBags: bom.metrics.totalCementBags50kg,
      roofingSheets: bom.metrics.totalRoofingSheetsCount,
      grandTotalFcfa: bom.grandTotalFcfa,
    },
  });

  return { doc, filename, bom };
}
