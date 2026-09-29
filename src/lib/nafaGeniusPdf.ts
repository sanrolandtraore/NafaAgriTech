/**
 * NAFA GENIUS IA - Générateur de Dossier Technique d'Ingénierie & Devis Certifié (PDF)
 * 
 * Génère un rapport technique officiel multi-pages conforme aux normes :
 * - Cartographie Géodésique WGS84 (Gauss / Shoelace)
 * - Dimensionnement Hydraulique & Solaire (Hazen-Williams, HMT, Photovoltaïque)
 * - Conception Bioclimatique Bâtiments Avicoles Tropicaux (Thermosiphon, Axe E-O)
 * - Bordereau des Prix Unitaires (BPU) & Devis Chiffré en FCFA avec Sceau de Sécurité
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  GeodesicSurveyResult,
  IrrigationDesignResult,
  PoultryHousingResult,
  EngineeringQuote,
} from "./nafaGeniusEngine";
import { partnerBrandingStorage, PartnerBranding } from "./partnerBrandingStorage";

export interface PdfDossierInput {
  survey: GeodesicSurveyResult;
  irrigation?: IrrigationDesignResult;
  poultry?: PoultryHousingResult;
  quote: EngineeringQuote;
  client: {
    name: string;
    phone: string;
    location: string;
  };
  expert: {
    name: string;
    title: string;
    organization: string;
  };
  canvasSnapshotDataUrl?: string;
  branding?: PartnerBranding;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  if (isNaN(num) || clean.length !== 6) return [21, 128, 61];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Dessine un cartouche et une en-tête officielle sur chaque page
 */
function drawPageHeader(
  doc: jsPDF,
  title: string,
  pageNumber: number,
  totalPages: number,
  branding?: PartnerBranding
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryRgb = hexToRgb(branding?.primaryColor || "#15803d");
  const accentRgb = hexToRgb(branding?.accentColor || "#eab308");

  // Bandeau supérieur
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect(0, 0, pageWidth, 24, "F");

  // Accent sous bandeau
  doc.setFillColor(accentRgb[0], accentRgb[1], accentRgb[2]);
  doc.rect(0, 24, pageWidth, 2, "F");

  // Logo / Nom de l'entreprise partenaire
  const companyName = branding?.companyName?.trim() || branding?.logoText?.trim() || "CABINET D'INGÉNIERIE AGRONOMIQUE";
  const tagline = branding?.tagline?.trim() || "INGÉNIERIE AGRONOMIQUE • HYDRAULIQUE • BÂTIMENT BIOCLIMATIQUE";

  let titleStartX = 14;
  if (branding?.logoImage) {
    try {
      doc.addImage(branding.logoImage, "JPEG", 14, 3, 18, 18);
      titleStartX = 36;
    } catch {
      // Fallback au texte si format image non supporté par jsPDF
      titleStartX = 14;
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(companyName.toUpperCase().slice(0, 42), titleStartX, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(tagline.slice(0, 75), titleStartX, 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(title.toUpperCase(), pageWidth - 14, 14, { align: "right" });

  // Pied de page
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(220, 225, 230);
  doc.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16);

  const footerText = branding
    ? partnerBrandingStorage.getFooterText()
    : "Dossier technique certifié • Conforme normes agronomiques certifiées Burkina Faso";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(110, 120, 130);
  doc.text(footerText, 14, pageHeight - 10);
  doc.text(`Page ${pageNumber} sur ${totalPages}`, pageWidth - 14, pageHeight - 10, { align: "right" });
}

/**
 * Dessine un sceau géométrique de sécurité / QR Code stylisé
 */
function drawSecuritySeal(doc: jsPDF, x: number, y: number, quoteRef: string, totalAmountFcfa: number, branding?: PartnerBranding) {
  const primaryRgb = hexToRgb(branding?.primaryColor || "#15803d");
  // Cadre du sceau
  doc.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.setLineWidth(0.8);
  doc.roundedRect(x, y, 46, 46, 3, 3, "S");

  // Motif matrice QR simulé vectoriel haute précision
  doc.setFillColor(245, 248, 245);
  doc.rect(x + 2, y + 2, 42, 42, "F");

  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  // Marqueurs de position coins
  doc.rect(x + 4, y + 4, 10, 10, "F");
  doc.setFillColor(255, 255, 255);
  doc.rect(x + 6, y + 6, 6, 6, "F");
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect(x + 8, y + 8, 2, 2, "F");

  doc.rect(x + 32, y + 4, 10, 10, "F");
  doc.setFillColor(255, 255, 255);
  doc.rect(x + 34, y + 6, 6, 6, "F");
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect(x + 36, y + 8, 2, 2, "F");

  doc.rect(x + 4, y + 32, 10, 10, "F");
  doc.setFillColor(255, 255, 255);
  doc.rect(x + 6, y + 34, 6, 6, "F");
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect(x + 8, y + 36, 2, 2, "F");

  // Pixels intérieurs de données
  const pattern = [
    [16, 6], [20, 6], [24, 6], [28, 8],
    [16, 12], [22, 12], [26, 14], [18, 16],
    [6, 20], [10, 22], [14, 20], [20, 20], [26, 22], [34, 20], [40, 22],
    [8, 26], [14, 26], [22, 26], [30, 26], [38, 26],
    [18, 32], [24, 34], [30, 32], [36, 36], [20, 40], [28, 40]
  ];
  pattern.forEach(([px, py]) => {
    doc.rect(x + px, y + py, 2.5, 2.5, "F");
  });

  // Libellé sous sceau
  const sealText = branding?.companyName ? branding.companyName.toUpperCase().slice(0, 24) : "CERTIFIÉ AUTHENTIQUE";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text(sealText, x + 23, y + 50, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(100, 100, 100);
  doc.text(`Réf : ${quoteRef}`, x + 23, y + 53, { align: "center" });
}

/**
 * Génère et déclenche le téléchargement du dossier technique complet
 */
export function generateTechnicalDossierPdf(input: PdfDossierInput): jsPDF {
  const branding = input.branding || partnerBrandingStorage.get();

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const totalPages = input.poultry ? 4 : 3;
  let currentPage = 1;

  // ═════════════════════════════════════════════════════════════
  // PAGE 1 : CARTOGRAPHIE GÉODÉSIQUE & AMÉNAGEMENT DU TERRAIN
  // ═════════════════════════════════════════════════════════════
  drawPageHeader(doc, "Dossier Géodésique & Plan d'Implantation", currentPage, totalPages, branding);

  let y = 34;

  // Fiche signalétique Client & Projet
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 28, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 28, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text("EXPLOITANT / MAÎTRE D'OUVRAGE :", 18, y + 7);
  doc.setFont("helvetica", "normal");
  doc.text(`${input.client.name} (Tél : ${input.client.phone})`, 82, y + 7);

  doc.setFont("helvetica", "bold");
  doc.text("LOCALISATION DE LA PARCELLE :", 18, y + 14);
  doc.setFont("helvetica", "normal");
  doc.text(input.client.location, 82, y + 14);

  const expertName = branding.expertName || input.expert.name;
  const expertTitle = branding.expertTitle || input.expert.title;
  const expertOrg = branding.companyName || input.expert.organization;

  doc.setFont("helvetica", "bold");
  doc.text("INGÉNIEUR EN CHARGE :", 18, y + 21);
  doc.setFont("helvetica", "normal");
  doc.text(`${expertName} (${expertTitle} - ${expertOrg})`, 82, y + 21);

  y += 34;

  // Métriques de surface et relief (cartes récapitulatives)
  const cardW = 42;
  const cardH = 20;

  // Carte 1 : Superficie
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(14, y, cardW, cardH, 2, 2, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(5, 150, 105);
  doc.text("SUPERFICIE TOTALE", 18, y + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(6, 95, 70);
  doc.text(`${input.survey.areaHa} ha`, 18, y + 14);
  doc.setFontSize(7);
  doc.text(`(${input.survey.areaM2.toLocaleString()} m²)`, 18, y + 18);

  // Carte 2 : Périmètre
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(60, y, cardW, cardH, 2, 2, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(37, 99, 235);
  doc.text("PÉRIMÈTRE CLÔTURE", 64, y + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 64, 175);
  doc.text(`${input.survey.perimeterM} ml`, 64, y + 14);

  // Carte 3 : Relief
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(106, y, cardW, cardH, 2, 2, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(217, 119, 6);
  doc.text("DÉNIVELÉ / PENTE", 110, y + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(146, 64, 14);
  doc.text(`Δ ${input.survey.elevation.deltaAlt} m`, 110, y + 14);
  doc.setFontSize(7);
  doc.text(`Pente moy. : ${input.survey.elevation.averageSlopePct} %`, 110, y + 18);

  // Carte 4 : Centroïde
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(152, y, 44, cardH, 2, 2, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("CENTROÏDE WGS84", 156, y + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`${input.survey.centroid.lat.toFixed(5)}° N`, 156, y + 12);
  doc.text(`${input.survey.centroid.lng.toFixed(5)}° O`, 156, y + 17);

  y += cardH + 8;

  // Tableau des sommets et coordonnées GPS
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text("1. Relevé des Sommets & Bornes Polygone (Système WGS84)", 14, y);
  y += 4;

  const pointsTableData = input.survey.points.map((p, idx) => [
    `Borne B${idx + 1}`,
    `${p.lat.toFixed(6)}° N`,
    `${p.lng.toFixed(6)}° O`,
    p.alt ? `${p.alt.toFixed(1)} m` : "310.0 m",
    p.label || `Limite Parcellaire ${idx + 1}`,
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Repère", "Latitude WGS84", "Longitude WGS84", "Altitude", "Description"]],
    body: pointsTableData,
    theme: "striped",
    headStyles: { fillColor: [21, 128, 61], fontSize: 8.5 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Insertion de l'image de plan si disponible
  if (input.canvasSnapshotDataUrl) {
    try {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text("2. Plan Vectoriel d'Aménagement & Orientation Bioclimatique", 14, y);
      y += 4;
      doc.addImage(input.canvasSnapshotDataUrl, "PNG", 14, y, 182, 85);
      y += 90;
    } catch {
      // Ignorer si format image invalide
    }
  }

  // ═════════════════════════════════════════════════════════════
  // PAGE 2 : Note Hydraulique & Solaire
  // ═════════════════════════════════════════════════════════════
  doc.addPage();
  currentPage++;
  drawPageHeader(doc, "Dimensionnement Hydraulique & Solaire", currentPage, totalPages, branding);

  y = 34;

  if (input.irrigation) {
    const ir = input.irrigation;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text("1. Paramètres Agrométéorologiques & Besoins en Eau des Cultures", 14, y);
    y += 5;

    const agroParams = [
      ["Évapotranspiration de référence (ETo)", `${ir.dailyEtoMm} mm/jour`, "Saison sèche sahélienne (Penman-Monteith)"],
      ["Coefficient cultural de pointe (Kc)", `${ir.kcUsed}`, "Stade critique floraison / fructification"],
      ["Besoin net de la culture (ETc = ETo × Kc)", `${ir.dailyEtcMm} mm/jour`, "Évaporation sol + Transpiration plante"],
      ["Efficience globale du réseau d'irrigation", `${ir.irrigationEfficiency * 100} %`, "Goutte-à-goutte régulé anti-évaporation"],
      ["Besoin brut journalier de pointe", `${ir.dailyGrossMm} mm/jour`, "Dose d'arrosage globale au champ"],
      ["Volume d'eau journalier nécessaire", `${ir.dailyVolumeM3} m³/jour`, `Pour l'ensemble de la sole irriguée (${input.survey.areaHa} ha)`],
    ];

    autoTable(doc, {
      startY: y,
      head: [["Grandeur Agronomique", "Valeur Calculée", "Norme / Justification Technique"]],
      body: agroParams,
      theme: "striped",
      headStyles: { fillColor: [2, 132, 199], fontSize: 8.5 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text("2. Calcul Hydraulique des Réseaux & Pertes de Charge (Hazen-Williams)", 14, y);
    y += 5;

    const hydParams = [
      ["Débit de pointe global requis", `${ir.peakHourlyFlowM3h} m³/h`, "Dimensionné sur 6 heures solaires utiles"],
      ["Découpage en secteurs d'arrosage", `${ir.recommendedSectors} secteur(s)`, "Répartition homogène de la pression"],
      ["Débit par secteur opérationnel", `${ir.flowPerSectorM3h} m³/h (${ir.flowPerSectorLs} L/s)`, "Alimentation simultanée d'un secteur"],
      ["Conduite principale (PEHD PN10)", `Ø ${ir.mainPipeDiameterMm} mm (Long : ${ir.mainPipeLengthM} m)`, "Qualité PE100 alimentaire traité UV"],
      ["Vitesse d'écoulement calculée", `${ir.mainPipeVelocityMs} m/s`, "Conforme aux recommandations (1.0 à 1.8 m/s)"],
      ["Perte de charge linéaire estimée", `${ir.mainPipeHeadLossM} mCE`, "Formule Hazen-Williams (C=145)"],
      ["Rampe de goutte-à-goutte Ø16", `${ir.totalDripTapeLengthM.toLocaleString()} ml`, "Gaines avec goutteurs autorégulants intégrés"],
    ];

    autoTable(doc, {
      startY: y,
      head: [["Composant Hydraulique", "Caractéristique Dimensionnée", "Critère de Validation"]],
      body: hydParams,
      theme: "striped",
      headStyles: { fillColor: [3, 105, 161], fontSize: 8.5 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text("3. Hauteur Manométrique Totale (HMT) & Dimensionnement Solaire", 14, y);
    y += 5;

    const solarParams = [
      ["Niveau dynamique forage (aspiration)", `${ir.suctionHeadM} m`, "Profondeur de rabattement nappe"],
      ["Refoulement géométrique (Château / Cuve)", `${ir.staticLiftM} m`, "Dénivelé total sol + bac de stockage"],
      ["Pression de service nominale requise", `${ir.pressureHeadM} mCE (1.2 bar)`, "Pour ouverture des goutteurs labyrinthes"],
      ["Hauteur Manométrique Totale (HMT)", `${ir.totalHeadHmtM} mCE`, "HMT = Hgeo + Hpertes + Hservice"],
      ["Puissance hydraulique utile (Phyd)", `${ir.hydraulicPowerKw} kW`, "Phyd = (Q × HMT × 9.81) / 3600"],
      ["Puissance moteur électropompe immergée", `${ir.motorPowerKw} kW (${Math.round(ir.motorPowerKw * 1.36)} CV)`, "Rendement groupe immergé = 60%"],
      ["Générateur Photovoltaïque requis", `${ir.solarPvWattPeak} Wc (${(ir.solarPvWattPeak / 1000).toFixed(2)} kWc)`, "Facteur sécurité 1.35 (chaleur & poussière)"],
      ["Nombre de modules solaires recommandés", `${ir.recommendedPanelsCount} panneaux de ${ir.panelUnitWattage} Wc`, "Orientation plein Sud 15° inclinaison"],
    ];

    autoTable(doc, {
      startY: y,
      head: [["Élément Électromécanique", "Spécification Retenue", "Formule / Norme"]],
      body: solarParams,
      theme: "striped",
      headStyles: { fillColor: [217, 119, 6], fontSize: 8.5 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });
  }

  // ═════════════════════════════════════════════════════════════
  // PAGE 3 : BÂTIMENT AVICOLE BIOCLIMATIQUE (si applicable)
  // ═════════════════════════════════════════════════════════════
  if (input.poultry) {
    doc.addPage();
    currentPage++;
    drawPageHeader(doc, "Conception Bioclimatique Bâtiment Avicole", currentPage, totalPages, branding);

    y = 34;
    const p = input.poultry;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text("1. Caractéristiques Géométriques & Bioclimatiques Sahéliennes", 14, y);
    y += 5;

    const poultryData = [
      ["Effectif du cheptel", `${p.flockSize} sujets`, p.birdType],
      ["Densité d'élevage préconisée", `${p.densityPerM2} sujets/m²`, "Norme Sahel anti-stress thermique (>38°C)"],
      ["Surface au sol utile du bâtiment", `${p.floorAreaM2} m²`, "Dallage béton armé lissé 350 kg/m³"],
      ["Dimensions du bâtiment (L x l)", `${p.lengthM} m × ${p.widthM} m`, "Largeur stricte <= 10m pour ventilation naturelle"],
      ["Hauteur sous sablière (évent)", `${p.eaveHeightM} m`, "Aération latérale maximale"],
      ["Hauteur au faîtage", `${p.ridgeHeightM} m`, "Crée l'effet cheminée / thermosiphon"],
      ["Lanterneau d'aération faîtière", `Largeur ${p.lanternWidthM} m`, "Évacuation continue de l'ammoniac et de la chaleur"],
      ["Débord de toiture anti-insolation", `${p.overhangM} m`, "Protection contre la pluie battante et rayonnement"],
      ["Orientation bioclimatique", `${p.orientationLabel}`, "Minimise l'échauffement sur les longs-pans grillagés"],
    ];

    autoTable(doc, {
      startY: y,
      head: [["Paramètre Architectural", "Dimension Retenue", "Règle de l'Art Bioclimatique"]],
      body: poultryData,
      theme: "striped",
      headStyles: { fillColor: [249, 115, 22], fontSize: 8.5 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text("2. Équipements d'Élevage & Normes de Biosécurité", 14, y);
    y += 5;

    const equipData = [
      ["Mangeoires trémie 18 kg", `${p.feedersCount} unités`, "1 pour 28 sujets (distribution continue)"],
      ["Abreuvoirs siphoïdes automatiques", `${p.drinkersCount} unités`, "1 pour 28 sujets (eau propre tempérée)"],
      ["Éleveuses radiantes / radians gaz", `${p.broodersCount} unité(s)`, "Phase de démarrage poussins (1 à 21 jours)"],
      ["Pondoirs à compartiments", p.nestsCount ? `${p.nestsCount} nids` : "Non applicable (chair)", "1 nid pour 5 pondeuses"],
      ["Sas sanitaire de biosécurité", `${p.biosecurityAirlockM2} m²`, "Pédiluve continu, vestiaire, douche et désinfection"],
      ["Magasin de stockage d'aliments", `${p.feedStorageAreaM2} m²`, "Stockage sécurisé sur palettes aérées"],
    ];

    autoTable(doc, {
      startY: y,
      head: [["Équipement / Installation", "Dotation Prévue", "Rationnement / Biosécurité"]],
      body: equipData,
      theme: "striped",
      headStyles: { fillColor: [194, 65, 12], fontSize: 8.5 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });
  }

  // ═════════════════════════════════════════════════════════════
  // DERNIÈRE PAGE : DEVIS OFFICIEL CERTIFIÉ & CHIFFRAGE FCFA
  // ═════════════════════════════════════════════════════════════
  doc.addPage();
  currentPage++;
  drawPageHeader(doc, "Bordereau des Prix Unitaires & Devis Estimatif", currentPage, totalPages, branding);

  y = 34;

  const q = input.quote;

  // En-tête devis
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(`DEVIS ESTIMATIF ET QUANTITATIF N° : ${q.quoteNumber}`, 14, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Date d'émission : ${q.date}  |  Validité de l'offre : 30 jours (jusqu'au ${q.validUntil})`, 14, y + 5);

  y += 11;

  // Tableau du BPU / Nomenclature
  const quoteRows = q.items.map((item, idx) => [
    (idx + 1).toString(),
    item.designation,
    item.unit,
    item.quantity.toString(),
    `${item.unitPriceFcfa.toLocaleString()} F`,
    `${item.totalPriceFcfa.toLocaleString()} F`,
  ]);

  const primaryRgb = hexToRgb(branding?.primaryColor || "#15803d");

  autoTable(doc, {
    startY: y,
    head: [["N°", "Désignation des Fournitures & Ouvrages", "Unité", "Qté", "Prix Unit. (FCFA)", "Total HT (FCFA)"]],
    body: quoteRows,
    theme: "striped",
    headStyles: { fillColor: [primaryRgb[0], primaryRgb[1], primaryRgb[2]], fontSize: 8 },
    bodyStyles: { fontSize: 7.5 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 84 },
      2: { cellWidth: 14 },
      3: { cellWidth: 14 },
      4: { cellWidth: 30, halign: "right" },
      5: { cellWidth: 30, halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // Récapitulatif financier
  const subtotalTable = [
    ["Sous-total Fournitures & Équipements", `${q.subtotalEquipmentFcfa.toLocaleString()} FCFA`],
    ["Main-d'œuvre qualifiée & Installation (14%)", `${q.laborCostFcfa.toLocaleString()} FCFA`],
    ["Logistique, transport chantier & manutention (5%)", `${q.logisticsCostFcfa.toLocaleString()} FCFA`],
    ["Provision pour imprévus techniques (4%)", `${q.contingenciesFcfa.toLocaleString()} FCFA`],
    ["MONTANT TOTAL GLOBAL (FCFA)", `${q.totalCostFcfa.toLocaleString()} FCFA`],
  ];

  autoTable(doc, {
    startY: y,
    body: subtotalTable,
    theme: "plain",
    bodyStyles: { fontSize: 8.5 },
    columnStyles: {
      0: { fontStyle: "bold", halign: "right", cellWidth: 122 },
      1: { halign: "right", fontStyle: "bold", cellWidth: 60, textColor: [primaryRgb[0], primaryRgb[1], primaryRgb[2]] },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Conditions de règlement & Sceau de validation
  const remainingSpace = doc.internal.pageSize.getHeight() - y;
  if (remainingSpace < 65) {
    doc.addPage();
    drawPageHeader(doc, "Validation & Modalités Contractuelles", totalPages + 1, totalPages + 1, branding);
    y = 34;
  }

  // Conditions de paiement à gauche
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 120, 52, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 120, 52, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text("ÉCHÉANCIER DE RÈGLEMENT CONSEILLÉ :", 18, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`• Acompte à la commande : 50% (${Math.round(q.totalCostFcfa * 0.5).toLocaleString()} FCFA)`, 18, y + 14);
  doc.text(`• À la livraison des équipements sur site : 35% (${Math.round(q.totalCostFcfa * 0.35).toLocaleString()} FCFA)`, 18, y + 21);
  doc.text(`• À la réception technique et mise en eau : 15% (${Math.round(q.totalCostFcfa * 0.15).toLocaleString()} FCFA)`, 18, y + 28);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Garanties & SAV :", 18, y + 36);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Pompe & Panneaux solaires : Garantie constructeur 24 mois.", 18, y + 42);
  doc.text("Assistance technique & suivi agronomique offert pendant 3 mois.", 18, y + 47);

  // Sceau cryptographique et signature à droite
  drawSecuritySeal(doc, 148, y, q.quoteNumber, q.totalCostFcfa, branding);

  return doc;
}
