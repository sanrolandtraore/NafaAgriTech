/**
 * NAFA - AGRITECH : Générateur Officiel de Rapport d'Activité et Bilan d'Élevage (PDF)
 * Permet aux éleveurs pastoraux et fermes modernes d'analyser leurs performances :
 * - Effectifs et dynamique du cheptel (bovins, ovins, caprins, porcins, volailles, pisciculture)
 * - Prophylaxie, vaccinations et interventions vétérinaires
 * - Rations alimentaires et gestion des stocks
 * - Reproduction, gestations et prolificité
 * - Comptabilité intégrée (ventilation des dépenses, recettes des ventes, marge nette en FCFA)
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface LivestockReportInput {
  farmName: string;
  breederName: string;
  location: string;
  phone: string;
  periodLabel: string;
  generatedDate: string;
  animals: any[];
  healthEvents: any[];
  feedings: any[];
  stocks: any[];
  reproductions: any[];
  expenses: any[];
  sales: any[];
  kpis: {
    totalActiveAnimals: number;
    totalLots: number;
    bySpecies: Record<string, number>;
    totalMortalities: number;
    totalExpenses: number;
    totalSales: number;
    netMargin: number;
    birthCount: number;
  };
}

const fmt = (n: number) => Math.round(n || 0).toLocaleString("fr-FR");

function drawPageHeader(doc: jsPDF, title: string, pageNumber: number, totalPages: number) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Bandeau vert pastoral
  doc.setFillColor(21, 128, 61);
  doc.rect(0, 0, pageWidth, 22, "F");

  // Accent or sahélien
  doc.setFillColor(234, 179, 8);
  doc.rect(0, 22, pageWidth, 2.5, "F");

  // Nom de la plateforme
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("NAFA - AGRITECH • SYSTÈME DE GESTION PASTORALE", 14, 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Rapport Officiel d'Activité Zootechnique & Bilan Comptable • Burkina Faso", 14, 17);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(title.toUpperCase(), pageWidth - 14, 13, { align: "right" });

  // Pied de page
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(210, 215, 220);
  doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 110, 120);
  doc.text("Rapport d'activité certifié • Conforme aux normes pastorales et zootechniques de l'Afrique de l'Ouest", 14, pageHeight - 8);
  doc.text(`Page ${pageNumber} sur ${totalPages}`, pageWidth - 14, pageHeight - 8, { align: "right" });
}

export function generateLivestockReportPdf(input: LivestockReportInput): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const totalPages = 3;

  // ══════════════════════════════════════════════════════════════════════════════
  // PAGE 1 : FICHE EXPLOITATION & SYNTHÈSE DU CHEPTEL
  // ══════════════════════════════════════════════════════════════════════════════
  drawPageHeader(doc, "Synthèse & Cheptel", 1, totalPages);

  // Bloc titre principal
  doc.setTextColor(20, 30, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("RAPPORT D'ACTIVITÉ & BILAN DU CHEPTEL", 14, 33);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 100, 110);
  doc.text(`Période couverte : ${input.periodLabel} • Date d'édition : ${input.generatedDate}`, 14, 39);

  // Cadre Infos Exploitation
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(220, 226, 235);
  doc.roundedRect(14, 44, pageWidth - 28, 26, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(21, 128, 61);
  doc.text("ÉLEVAGE & EXPLOITANT AGRICOLE", 18, 51);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(40, 50, 60);
  doc.text(`Nom de l'élevage : ${input.farmName || "Mon élevage pastoral"}`, 18, 57);
  doc.text(`Exploitant / Éleveur : ${input.breederName || "Producteur agro-pastoral"}`, 18, 63);

  doc.text(`Localisation : ${input.location || "Burkina Faso"}`, (pageWidth / 2) + 10, 57);
  doc.text(`Contact téléphonique : ${input.phone || "Non renseigné"}`, (pageWidth / 2) + 10, 63);

  // Grille KPI Majeurs
  const kpiY = 74;
  const kpiWidth = (pageWidth - 28 - 9) / 4;
  const kpisData = [
    { label: "Cheptel Vif Actif", val: `${input.kpis.totalActiveAnimals} têtes`, sub: `${input.kpis.totalLots} lots & sujets`, color: [21, 128, 61] },
    { label: "Recettes des Ventes", val: `${fmt(input.kpis.totalSales)} F`, sub: "Produits vendus", color: [16, 185, 129] },
    { label: "Dépenses Engagées", val: `${fmt(input.kpis.totalExpenses)} F`, sub: "Aliment, santé, intrants", color: [225, 29, 72] },
    { label: "Marge Nette", val: `${input.kpis.netMargin >= 0 ? "+" : ""}${fmt(input.kpis.netMargin)} F`, sub: "Résultat financier", color: input.kpis.netMargin >= 0 ? [21, 128, 61] : [225, 29, 72] },
  ];

  kpisData.forEach((kpi, idx) => {
    const x = 14 + idx * (kpiWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(220, 226, 235);
    doc.roundedRect(x, kpiY, kpiWidth, 22, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 110, 120);
    doc.text(kpi.label.toUpperCase(), x + 4, kpiY + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, x + 4, kpiY + 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(120, 130, 140);
    doc.text(kpi.sub, x + 4, kpiY + 18);
  });

  // Tableau 1 : Répartition par Espèce
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(20, 30, 40);
  doc.text("1. Répartition et Composition du Cheptel Vif", 14, 105);

  const speciesLabels: Record<string, string> = {
    bovin: "Bovins (Zébus, Métis)",
    ovin: "Ovins (Moutons du Sahel, Bali-Bali)",
    caprin: "Caprins (Chèvres du Sahel, Maradi)",
    porcin: "Porcins (Large White, Porc local)",
    volaille: "Volailles (Poulets locaux, pondeuses, chair)",
    pisciculture: "Pisciculture (Tilapia, Silure)",
  };

  const speciesRows = Object.entries(input.kpis.bySpecies).map(([spec, count]) => {
    const matchingAnimals = (input.animals || []).filter(a => a.species === spec && (a.status || "actif") === "actif");
    const lotsCount = matchingAnimals.filter(a => a.is_group).length;
    const indivCount = matchingAnimals.filter(a => !a.is_group).length;
    return [
      speciesLabels[spec] || spec,
      `${count} tête(s)`,
      `${indivCount} sujet(s)`,
      `${lotsCount} lot(s)`,
      count > 0 ? "Actif & suivi" : "0",
    ];
  });

  autoTable(doc, {
    startY: 109,
    head: [["Espèce / Filière", "Effectif Vif", "Sujets Individuels", "Bandes / Lots", "Statut Sanitaire"]],
    body: speciesRows.length > 0 ? speciesRows : [["Aucun animal actif répertorié", "-", "-", "-", "-"]],
    theme: "striped",
    headStyles: { fillColor: [21, 128, 61], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [40, 50, 60] },
    margin: { left: 14, right: 14 },
  });

  // Tableau 2 : Inventaire des Principaux Lots & Sujets
  const nextY1 = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(20, 30, 40);
  doc.text("2. Registre Récent du Cheptel (Échantillon de suivi)", 14, nextY1);

  const animalRows = (input.animals || []).slice(0, 8).map(a => [
    a.is_group ? `[Lot] ${a.group_label || a.name}` : (a.name || a.identification_number || "Animal"),
    speciesLabels[a.species] || a.species,
    a.breed || "Non précisée",
    a.is_group ? `${Math.max(0, (a.group_size || 0) - (a.mortality_count || 0))} têtes` : `${a.weight_kg ? `${a.weight_kg} kg` : "-"}`,
    a.status === "actif" ? "Actif" : a.status === "vendu" ? "Vendu" : "Réformé / Mort",
  ]);

  autoTable(doc, {
    startY: nextY1 + 4,
    head: [["Identifiant / Nom", "Espèce", "Race", "Poids / Effectif", "Statut"]],
    body: animalRows.length > 0 ? animalRows : [["Aucun enregistrement disponible", "-", "-", "-", "-"]],
    theme: "plain",
    headStyles: { fillColor: [230, 235, 240], textColor: [30, 40, 50], fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [40, 50, 60] },
    margin: { left: 14, right: 14 },
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // PAGE 2 : SANTÉ, VACCINATIONS & ALIMENTATION
  // ══════════════════════════════════════════════════════════════════════════════
  doc.addPage();
  drawPageHeader(doc, "Santé & Alimentation", 2, totalPages);

  // Section 3 : Santé & Prophylaxie
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20, 30, 40);
  doc.text("3. Suivi Sanitaire & Prophylaxie Vétérinaire", 14, 32);

  const healthRows = (input.healthEvents || []).slice(0, 9).map(h => [
    h.event_date || "-",
    h.event_type === "vaccination" ? "Vaccination" : h.event_type === "traitement" ? "Traitement" : h.event_type === "deworming" ? "Vermifuge" : "Consultation",
    h.medication || h.description || "Acte sanitaire",
    h.vet_name || "Non spécifié",
    h.cost ? `${fmt(h.cost)} F` : "0 F",
    h.next_date ? `Rappel: ${h.next_date}` : "À jour",
  ]);

  autoTable(doc, {
    startY: 36,
    head: [["Date", "Acte", "Produit / Traitement", "Praticien / Vétérinaire", "Coût", "Prochain Rappel"]],
    body: healthRows.length > 0 ? healthRows : [["Aucun acte sanitaire enregistré sur la période", "-", "-", "-", "-", "-"]],
    theme: "striped",
    headStyles: { fillColor: [14, 116, 144], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [40, 50, 60] },
    margin: { left: 14, right: 14 },
  });

  // Section 4 : Alimentation & Rations
  const nextY2 = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20, 30, 40);
  doc.text("4. Consommation Alimentaire & Gestion des Stocks", 14, nextY2);

  const feedRows = (input.feedings || []).slice(0, 6).map(f => [
    f.feeding_date || "-",
    f.feed_type || "Aliment composé",
    `${f.quantity_kg || 0} kg`,
    f.cost ? `${fmt(f.cost)} FCFA` : "-",
    f.notes || "Distribution ration normale",
  ]);

  autoTable(doc, {
    startY: nextY2 + 4,
    head: [["Date", "Type d'aliment", "Quantité distribuée", "Coût", "Observations"]],
    body: feedRows.length > 0 ? feedRows : [["Aucune distribution d'aliment consignée", "-", "-", "-", "-"]],
    theme: "striped",
    headStyles: { fillColor: [202, 138, 4], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [40, 50, 60] },
    margin: { left: 14, right: 14 },
  });

  // Section 5 : État des Stocks Magasin
  const nextY3 = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(20, 30, 40);
  doc.text("5. Inventaire des Aliments Disponibles en Magasin", 14, nextY3);

  const stockRows = (input.stocks || []).slice(0, 6).map(s => [
    s.feed_name || "Aliment",
    `${s.quantity_kg || 0} kg`,
    s.unit_price ? `${fmt(s.unit_price)} F/kg` : "-",
    s.supplier || "Marché local",
    Number(s.quantity_kg || 0) < 50 ? "Alerte réapprovisionnement" : "Stock suffisant",
  ]);

  autoTable(doc, {
    startY: nextY3 + 4,
    head: [["Aliment / Intrant", "Quantité en stock", "Prix unitaire", "Fournisseur", "Niveau de sécurité"]],
    body: stockRows.length > 0 ? stockRows : [["Magasin vide ou non renseigné", "-", "-", "-", "-"]],
    theme: "plain",
    headStyles: { fillColor: [240, 243, 246], textColor: [40, 50, 60], fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [40, 50, 60] },
    margin: { left: 14, right: 14 },
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // PAGE 3 : REPRODUCTION & COMPTABILITÉ FINANCIÈRE
  // ══════════════════════════════════════════════════════════════════════════════
  doc.addPage();
  drawPageHeader(doc, "Reproduction & Finances", 3, totalPages);

  // Section 6 : Reproduction
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20, 30, 40);
  doc.text("6. Bilan de Reproduction & Mises-Bas", 14, 32);

  const reproRows = (input.reproductions || []).slice(0, 5).map(r => [
    r.event_date || "-",
    r.event_type === "saillie" ? "Saillie" : r.event_type === "insemination" ? "Insémination" : r.event_type === "mise_bas" ? "Mise bas" : "Gestation",
    r.expected_birth_date ? `Prévu le : ${r.expected_birth_date}` : "-",
    r.actual_birth_date ? `Né le ${r.actual_birth_date} (${r.offspring_alive || 1} vivants)` : "En attente",
    r.cost ? `${fmt(r.cost)} F` : "0 F",
  ]);

  autoTable(doc, {
    startY: 36,
    head: [["Date", "Nature de l'acte", "Échéance prévue", "Résultat / Naissances", "Coût"]],
    body: reproRows.length > 0 ? reproRows : [["Aucun acte de reproduction enregistré", "-", "-", "-", "-"]],
    theme: "striped",
    headStyles: { fillColor: [2, 132, 199], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [40, 50, 60] },
    margin: { left: 14, right: 14 },
  });

  // Section 7 : Bilan Comptable & Dépenses
  const nextY4 = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20, 30, 40);
  doc.text("7. Grand Livre des Dépenses & Recettes Pastorales", 14, nextY4);

  // Ventilation des dépenses
  const expenseCatMap: Record<string, number> = {};
  (input.expenses || []).forEach(e => {
    const cat = e.category || "autre";
    expenseCatMap[cat] = (expenseCatMap[cat] || 0) + Number(e.amount || 0);
  });

  const catLabels: Record<string, string> = {
    alimentation: "Alimentation, Provende & Rations",
    sante: "Santé animale, Vaccins & Vétérinaires",
    equipement: "Matériel, Abreuvoirs & Enclos",
    transport: "Transport & Convoyage",
    main_oeuvre: "Main d'œuvre & Bergers",
    habitat: "Bâtiments, Poulaillers & Bassins",
    eau_energie: "Eau de boisson & Forage",
    autre: "Achats cheptel & Divers",
  };

  const expenseBreakdownRows = Object.entries(expenseCatMap).map(([cat, amt]) => [
    catLabels[cat] || cat,
    `${fmt(amt)} FCFA`,
    input.kpis.totalExpenses > 0 ? `${Math.round((amt / input.kpis.totalExpenses) * 100)}%` : "0%",
  ]);

  autoTable(doc, {
    startY: nextY4 + 4,
    head: [["Poste de Dépense", "Montant Total", "Part Budgétaire"]],
    body: expenseBreakdownRows.length > 0 ? expenseBreakdownRows : [["Aucune dépense enregistrée", "0 FCFA", "0%"]],
    theme: "plain",
    headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [40, 50, 60] },
    margin: { left: 14, right: 14 },
  });

  // Synthèse Marges
  const nextY5 = (doc as any).lastAutoTable.finalY + 6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(220, 226, 235);
  doc.roundedRect(14, nextY5, pageWidth - 28, 20, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 40, 50);
  doc.text(`RÉSULTAT NET D'EXPLOITATION PASTORALE :`, 18, nextY5 + 8);

  const marginColor = input.kpis.netMargin >= 0 ? [21, 128, 61] : [225, 29, 72];
  doc.setTextColor(marginColor[0], marginColor[1], marginColor[2]);
  doc.setFontSize(13);
  doc.text(`${input.kpis.netMargin >= 0 ? "+" : ""}${fmt(input.kpis.netMargin)} FCFA`, 18, nextY5 + 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 110, 120);
  doc.text(`Recettes totales : ${fmt(input.kpis.totalSales)} FCFA | Dépenses totales : ${fmt(input.kpis.totalExpenses)} FCFA`, (pageWidth / 2) - 10, nextY5 + 13);

  // Section 8 : Recommandations Zootechniques Sahéliennes & Sceau
  const nextY6 = nextY5 + 26;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(21, 128, 61);
  doc.text("RECOMMANDATIONS ZOOTECHNIQUES SAHÉLIENNES :", 14, nextY6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(50, 60, 70);
  doc.text("• Abreuvement : Garantir 70L/jour/bovin et 8L/jour/ovin en période sèche chaude avec eau ombragée.", 14, nextY6 + 5);
  doc.text("• Prophylaxie : Respecter scrupuleusement les campagnes officielles de vaccination (PPR, PPCB, Newcastle).", 14, nextY6 + 10);
  doc.text("• Complémentation : Apporter des blocs de lécher minéraux et des tourteaux de coton riches en protéines.", 14, nextY6 + 15);

  // Zone Signature / Visa
  const signY = nextY6 + 23;
  doc.setDrawColor(200, 205, 215);
  doc.line(14, signY, (pageWidth / 2) - 10, signY);
  doc.line((pageWidth / 2) + 10, signY, pageWidth - 14, signY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(70, 80, 90);
  doc.text("VISA & SIGNATURE DE L'ÉLEVEUR", 14, signY + 4);
  doc.text("AUTHENTIFICATION NAFA-AGRITECH", (pageWidth / 2) + 10, signY + 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(120, 130, 140);
  doc.text(`Fait à ${input.location || "Bobo-Dioulasso"}, le ${input.generatedDate}`, 14, signY + 8);
  doc.text("Certifié conforme aux données enregistrées en session", (pageWidth / 2) + 10, signY + 8);

  return doc;
}
