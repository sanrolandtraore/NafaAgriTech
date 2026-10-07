/**
 * NAFA-AGRITECH — EXPORT OFFICIEL DU DOSSIER D'INGÉNIERIE HYDRAULIQUE (WCADI STYLE)
 * Génération du rapport PDF technique complet avec métrés, tuyauterie, pompage et chiffrage.
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { WcadiHydraulicProject } from "./nafaWcadiHydraulicEngine";

export function generateWcadiHydraulicPdf(project: WcadiHydraulicProject, clientName?: string, location?: string): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. En-tête officiel vert NAFA & bande dorée
  doc.setFillColor(21, 128, 61); // #15803d
  doc.rect(0, 0, pageWidth, 24, "F");

  doc.setFillColor(234, 179, 8); // #eab308
  doc.rect(0, 24, pageWidth, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("NAFA - AGRITECH", 14, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("STUDIO D'INGÉNIERIE HYDRAULIQUE & RÉSEAU AGRICOLE (STYLE WCADI)", 14, 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("DOSSIER TECHNIQUE OFFICIEL", pageWidth - 14, 15, { align: "right" });

  let currentY = 34;

  // 2. Fiche d'identification
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("1. IDENTIFICATION DU PROJET & DONNÉES PARCELLAIRES (GPS)", 14, currentY);
  currentY += 5;

  autoTable(doc, {
    startY: currentY,
    theme: "grid",
    headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: "bold" },
    styles: { fontSize: 8.5, cellPadding: 2.8 },
    body: [
      [
        { content: "Nom du projet", styles: { fontStyle: "bold" } },
        project.name,
        { content: "Client / Exploitant", styles: { fontStyle: "bold" } },
        clientName || "Exploitant Partenaire NAFA",
      ],
      [
        { content: "Superficie arpentée (GPS)", styles: { fontStyle: "bold" } },
        `${project.gpsSurvey.areaHa} ha (${project.gpsSurvey.areaM2.toLocaleString()} m²)`,
        { content: "Périmètre de clôture", styles: { fontStyle: "bold" } },
        `${project.gpsSurvey.perimeterM} mètres linéaires`,
      ],
      [
        { content: "Culture principale", styles: { fontStyle: "bold" } },
        `${project.cropParams.cropName} (Écartement ${project.cropParams.rowSpacingM}m)`,
        { content: "Source d'eau / Débit", styles: { fontStyle: "bold" } },
        `${project.waterAndEnergy.waterSource} (${project.waterAndEnergy.sourceFlowM3h} m³/h)`,
      ],
      [
        { content: "Source énergétique", styles: { fontStyle: "bold" } },
        project.waterAndEnergy.energySource.replace(/_/g, " "),
        { content: "Système retenu", styles: { fontStyle: "bold" } },
        project.hydraulicResults.systemType.toUpperCase(),
      ],
    ],
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // 3. Dimensionnement hydraulique & Tuyauterie
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("2. DIMENSIONNEMENT DU RÉSEAU & TUYAUTERIE (NORME FAO-56 & CIRAD)", 14, currentY);
  currentY += 5;

  const hr = project.hydraulicResults;
  autoTable(doc, {
    startY: currentY,
    theme: "striped",
    head: [["Composant Réseau", "Dimensionnement & Quantité", "Spécification Technique"]],
    headStyles: { fillColor: [21, 128, 61], textColor: [255, 255, 255] },
    styles: { fontSize: 8.5, cellPadding: 2.8 },
    body: [
      ["Tuyauterie Maîtresse PEHD", `${hr.mainPipeBarsCount} barres de 6m (Total: ${hr.mainPipeLengthM}m)`, `PEHD 100 Ø${hr.mainPipeDiameterMm}mm PN10 haute pression`],
      ["Tuyauterie Secondaire (Porte-rampes)", `${hr.subPipeLengthM} mètres linéaires`, `PEHD Ø${hr.subPipeDiameterMm}mm PN6 avec piquages`],
      ["Gaines Goutte-à-Goutte", `${hr.totalDripRollsCount} bobines de 1000m (${hr.totalDripTapeLengthM}m)`, `Gaine autorégulante Ø16mm (${project.cropParams.emitterSpacingM}m entre goutteurs)`],
      ["Émetteurs / Goutteurs intégrés", `${hr.totalEmittersCount.toLocaleString()} goutteurs`, `Débit unitaire nominal : ${project.cropParams.emitterFlowLh} L/h`],
      ["Longueur Max admissible rampe", `${hr.maxLateralRunLengthM} mètres`, `Uniformité d'émission garantie (EU > ${hr.emissionUniformityPct}%)`],
      ["Découpage en secteurs (Shifts)", `${hr.numSectors} secteurs indépendants`, `Débit par secteur : ${hr.sectorFlowM3h} m³/h (${hr.shiftDurationHours}h / shift)`],
      ["Hauteur Manométrique Totale", `${hr.hmtMce} mCE`, "Pertes de charge Hazen-Williams incluses (12%)"],
      ["Groupe de Pompage Solaire", `${hr.pumpPowerKw} kW (${hr.pumpPowerHp} CV)`, `${hr.solarPanelsCount550W} panneaux solaires 550W (${hr.solarPvWattsPeak} Wc)`],
    ],
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // 4. Nomenclature chiffrée des matériels (Bill of Materials)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("3. DEVIS ESTIMATIF & NOMENCLATURE DES MATÉRIELS (BOM - BURKINA FASO)", 14, currentY);
  currentY += 5;

  const bomRows: any[] = project.billOfMaterials.map((item) => [
    item.designation,
    `${item.quantity} ${item.unit}`,
    `${item.unitPriceFcfa.toLocaleString()} F`,
    `${item.totalPriceFcfa.toLocaleString()} F`,
    item.sourceSupplierName,
  ]);

  bomRows.push([
    { content: "TOTAL GÉNÉRAL DU MATÉRIEL (FCFA)", colSpan: 3, styles: { fontStyle: "bold", halign: "right" } },
    { content: `${project.financialTotalFcfa.toLocaleString()} FCFA`, styles: { fontStyle: "bold", textColor: [21, 128, 61] } },
    { content: "Fournisseurs vérifiés", styles: { fontStyle: "bold" } },
  ]);

  autoTable(doc, {
    startY: currentY,
    theme: "grid",
    head: [["Désignation du Matériel", "Quantité", "Prix Unitaire", "Total HT", "Fournisseur Agréé"]],
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    styles: { fontSize: 8, cellPadding: 2.2 },
    body: bomRows as any,
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // 5. Notes et engagements
  if (currentY < pageHeight - 35) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("Recommandations techniques de chantier :", 14, currentY);
    currentY += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(
      "- Enterrer les canalisations maîtresses PEHD à au moins 40 cm pour prévenir la photodégradation solaire et les passages d'engins.\n- Prévoir un rinçage à débit forcé avant la première mise en service pour évacuer les poussières de pose.\n- Installer le filtre à disques en amont de toute vanne de distribution de secteur.",
      14,
      currentY,
      { maxWidth: pageWidth - 28 }
    );
  }

  // Bas de page
  doc.setDrawColor(226, 232, 240);
  doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Document certifié généré par NAFA-AGRITECH • Moteur de calcul WCADI & FAO-56", 14, pageHeight - 7);
  doc.text(`Identifiant: ${project.id}`, pageWidth - 14, pageHeight - 7, { align: "right" });

  return doc;
}
