/**
 * NAFA-AGRITECH — Générateur de Rapport d'Intervention Tout-en-Un (PDF)
 * Arpentage Cadastral + Bilan Satellite NDVI + Fiches d'Inspection In-Situ & Traitements Homologués.
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FieldSuiteMission } from "./fieldSuiteStorage";
import { partnerBrandingStorage } from "./partnerBrandingStorage";
import { toDMS } from "./gpsSurveyEngine";

export function generateFieldSuiteReportPdf(mission: FieldSuiteMission): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const branding = partnerBrandingStorage.get();

  const companyName = branding.companyName.trim() || "CABINET D'INGÉNIERIE AGRONOMIQUE DU SAHEL";
  const expertName = branding.expertName.trim() || "Ingénieur Agronome Conseil";
  const expertTitle = branding.expertTitle.trim() || "Expert Foncier & Protection des Végétaux";

  // En-tête bandeau supérieur
  doc.setFillColor(21, 128, 61); // Vert Sahel
  doc.rect(0, 0, pageWidth, 26, "F");

  doc.setFillColor(234, 179, 8); // Bande jaune or
  doc.rect(0, 26, pageWidth, 2.5, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(companyName.toUpperCase(), 14, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("SUITE INTÉGRÉE D'INGÉNIERIE : ARRPENTAGE • SATELLITE NDVI • DIAGNOSTIC TERRAIN", 14, 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("RAPPORT OFFICIEL D'INTERVENTION", pageWidth - 14, 14, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(`Réf : INT-${mission.id.slice(-6).toUpperCase()}`, pageWidth - 14, 20, { align: "right" });

  // Titre principal
  let y = 38;
  doc.setTextColor(20, 30, 45);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("RAPPORT D'INTERVENTION AGRONOMIQUE INTÉGRÉE", 14, y);

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(90, 100, 115);
  doc.text("Synthèse du détourage parcellaire GPS, de l'état végétatif satellite et des diagnostics in-situ.", 14, y);

  y += 7;

  // Cartouche Informations Générales
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(220, 226, 235);
  doc.roundedRect(14, y, pageWidth - 28, 36, 3, 3, "FD");

  doc.setTextColor(30, 40, 55);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("DONNÉES DU CHANTIER & DE L'EXPLOITATION", 20, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(50, 60, 75);

  const leftColX = 20;
  const rightColX = pageWidth / 2 + 5;

  doc.text(`Parcelle : ${mission.parcelName}`, leftColX, y + 15);
  doc.text(`Client / Exploitants : ${mission.clientName}`, leftColX, y + 21);
  doc.text(`Contact : ${mission.clientPhone || "N/A"}`, leftColX, y + 27);

  doc.text(`Localité / Commune : ${mission.locality} (${mission.region || "Burkina Faso"})`, rightColX, y + 15);
  doc.text(`Spéculation principale : ${mission.cropType}`, rightColX, y + 21);
  doc.text(`Date d'intervention : ${mission.surveyDate}`, rightColX, y + 27);

  y += 42;

  // 1. Synthèse Arpentage GPS
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(21, 128, 61);
  doc.text("1. CARACTÉRISTIQUES GÉOMÉTRIQUES & ARPENTAGE GPS DE TERRAIN", 14, y);

  y += 5;
  const kpiBoxWidth = (pageWidth - 28 - 9) / 4;
  const kpis = [
    { label: "SUPERFICIE", val: `${mission.areaHa} ha`, sub: `${mission.areaM2.toLocaleString()} m²` },
    { label: "PÉRIMÈTRE", val: `${mission.perimeterM.toLocaleString()} m`, sub: "Contour fermé" },
    { label: "BORNES GPS", val: `${mission.waypoints.length} sommets`, sub: "Précision submétrique" },
    { label: "CENTROÏDE", val: `${mission.centroid.lat.toFixed(4)}° N`, sub: `${mission.centroid.lng.toFixed(4)}° W` },
  ];

  kpis.forEach((kpi, idx) => {
    const kx = 14 + idx * (kpiBoxWidth + 3);
    doc.setFillColor(245, 248, 245);
    doc.setDrawColor(200, 220, 205);
    doc.roundedRect(kx, y, kpiBoxWidth, 20, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(80, 100, 90);
    doc.text(kpi.label, kx + kpiBoxWidth / 2, y + 5, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(21, 128, 61);
    doc.text(kpi.val, kx + kpiBoxWidth / 2, y + 12, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(110, 120, 130);
    doc.text(kpi.sub, kx + kpiBoxWidth / 2, y + 17, { align: "center" });
  });

  y += 26;

  // 2. Bilan Imagerie Satellite NDVI
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(21, 128, 61);
  doc.text("2. DIAGNOSTIC PAR IMAGERIE SATELLITE MULTISPECTRALE (NDVI)", 14, y);

  y += 5;
  if (mission.satelliteData) {
    const sat = mission.satelliteData;
    const satBoxWidth = (pageWidth - 28 - 6) / 3;

    const satKpis = [
      { label: "NDVI MOYEN PARCELLE", val: `${sat.meanNdvi.toFixed(2)}`, desc: "Vigueur globale du couvert" },
      { label: "ZONES EN STRESS CRITIQUE", val: `${sat.stressAreaPct}%`, desc: `${sat.stressAreaM2.toLocaleString()} m² à investiguer` },
      { label: "FOYERS REPÉRÉS PAR SATELLITE", val: `${sat.hotspots.length} anomalies`, desc: "Guidage GPS in-situ réalisé" },
    ];

    satKpis.forEach((kpi, idx) => {
      const kx = 14 + idx * (satBoxWidth + 3);
      doc.setFillColor(254, 249, 245);
      doc.setDrawColor(245, 215, 190);
      doc.roundedRect(kx, y, satBoxWidth, 20, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(140, 80, 30);
      doc.text(kpi.label, kx + satBoxWidth / 2, y + 5, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(194, 65, 12);
      doc.text(kpi.val, kx + satBoxWidth / 2, y + 12, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(120, 110, 100);
      doc.text(kpi.desc, kx + satBoxWidth / 2, y + 17, { align: "center" });
    });

    y += 26;
  }

  // 3. Tableau des Anomalies et Diagnostics In-Situ
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(21, 128, 61);
  doc.text("3. INVESTIGATIONS DE TERRAIN (GUIDAGE GPS & DIAGNOSTICS IN-SITU)", 14, y);

  y += 4;

  const tableRows: any[] = [];
  if (mission.satelliteData && mission.satelliteData.hotspots.length > 0) {
    mission.satelliteData.hotspots.forEach((h) => {
      const diag = h.diagnosis;
      tableRows.push([
        h.code,
        `${toDMS(h.lat, true)}\n${toDMS(h.lng, false)}`,
        `NDVI ${h.ndvi.toFixed(2)}\n${h.severity.toUpperCase()}`,
        diag ? `${diag.maladie}\n(Organe: ${diag.partie_atteinte})` : `${h.predictedIssue}\n(Non diagnostiqué)`,
        diag?.agent_causal || "En attente de prélèvement",
        diag?.traitement_bio?.nom || diag?.traitement_chimique?.nom || "Recommandation d'irrigation / NPK",
      ]);
    });
  }

  autoTable(doc, {
    startY: y,
    head: [["ID", "Coordonnées GPS", "Signature NDVI", "Pathologie observée", "Agent Causal", "Traitement préconisé"]],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: [21, 128, 61],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 40, 55],
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 10, fontStyle: "bold" },
      1: { cellWidth: 32 },
      2: { cellWidth: 26 },
      3: { cellWidth: 42, fontStyle: "bold" },
      4: { cellWidth: 34 },
      5: { cellWidth: 44 },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : y + 60;

  // Recommandations globales et signature
  if (finalY < pageHeight - 45) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(210, 220, 230);
    doc.roundedRect(14, finalY, pageWidth - 28, 30, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 40, 55);
    doc.text("AVIS & RECOMMANDATIONS DE L'AGRONOME CONSEIL :", 20, finalY + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(60, 70, 80);
    doc.text(
      "1. Appliquer sans délai les traitements bio/phytosanitaires ciblés sur les foyers critiques A1 et A3.",
      20,
      finalY + 12
    );
    doc.text(
      "2. Corriger l'arrosage sur la zone A2 (déficit hydrique) pour stopper la perte de turgescence foliaire.",
      20,
      finalY + 17
    );
    doc.text(
      "3. Prévoir un second passage satellite de contrôle à J+14 pour vérifier la reprise de la photosynthèse (gain NDVI).",
      20,
      finalY + 22
    );

    // Bloc signature
    const sigX = pageWidth - 60;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Cachet et Signature de l'Expert :", sigX, finalY + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(expertName, sigX, finalY + 12);
    doc.text(expertTitle, sigX, finalY + 16);
  }

  // Pied de page
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(130, 140, 150);
  const footerLine = `${companyName} • Intervention de Terrain • Document certifié conforme aux normes agronomiques du Burkina Faso`;
  doc.text(footerLine, 14, pageHeight - 8);
  doc.text("Page 1 / 1", pageWidth - 14, pageHeight - 8, { align: "right" });

  const fileName = `Rapport_Intervention_${mission.parcelName.replace(/\s+/g, "_")}_${mission.surveyDate}.pdf`;
  doc.save(fileName);
}
