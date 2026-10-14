/**
 * NAFA AGRITECH — GÉNÉRATEUR DE FICHE OFFICIELLE D'OBSERVATION BOTANIQUE
 * Conforme aux standards internationaux Pl@ntNet (CIRAD / INRAE / IRD) & INERA
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { NafaBotanicalSpecies } from "./nafaBotanicalDatabase";

export interface BotanicalObservationPdfInput {
  species: NafaBotanicalSpecies;
  organSelected: string;
  confidencePct: number;
  projectSelected: string;
  observerName?: string;
  location?: string;
  notes?: string;
  isOnlineUsed?: boolean;
}

export function generateBotanicalObservationPdf(input: BotanicalObservationPdfInput): jsPDF {
  const {
    species,
    organSelected,
    confidencePct,
    projectSelected,
    observerName = "Agronome / Technicien NAFA",
    location = "Zone Agro-Écologique Soudano-Sahélienne (Burkina Faso)",
    notes,
    isOnlineUsed = false,
  } = input;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. Bandeau supérieur vert forêt Pl@ntNet
  doc.setFillColor(20, 83, 45); // Emerald 900
  doc.rect(0, 0, pageWidth, 26, "F");

  doc.setFillColor(34, 197, 94); // Green 500
  doc.rect(0, 26, pageWidth, 2.5, "F");

  // Titres
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("NAFA AGRITECH • STUDIO BOTANIQUE PL@NTNET", 14, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("IDENTIFICATION TAXONOMIQUE • FLORE SAHÉLIENNE & ADVENTICES (CIRAD / INRAE / INERA)", 14, 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("FICHE D'OBSERVATION BOTANIQUE", pageWidth - 14, 12, { align: "right" });
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text(`Projet: ${projectSelected.toUpperCase()}`, pageWidth - 14, 18, { align: "right" });

  let currentY = 38;

  // 2. Identification taxonomique majeure
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("1. DÉTERMINATION TAXONOMIQUE & NOMENCLATURE BOTANIQUE", 14, currentY);

  currentY += 6;

  autoTable(doc, {
    startY: currentY,
    theme: "plain",
    styles: { fontSize: 8.5, cellPadding: 2, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50, fillColor: [241, 245, 249] },
      1: { cellWidth: 130 },
    },
    body: [
      ["Nom scientifique (Binomial)", species.scientificName],
      ["Famille botanique", `${species.family} (${species.order || "Ordre non spécifié"})`],
      ["Genre", species.genus],
      ["Nom vernaculaire français", species.commonName],
      [
        "Noms locaux sahéliens",
        `Mooré: ${species.vernacularNames.moore || "—"} • Dioula: ${species.vernacularNames.dioula || "—"} • Peul/Fulfulde: ${species.vernacularNames.fulfulde || "—"}`,
      ],
      [
        "Catégorie agronomique",
        species.isWeed
          ? "ADVENTICE / MAUVAISE HERBE PARASITE (Alerte protection des cultures)"
          : `CULTURE VIVRIÈRE / MARAÎCHÈRE (${species.category.toUpperCase()})`,
      ],
      ["Indice de certitude Pl@ntNet", `${confidencePct.toFixed(1)} % (${isOnlineUsed ? "API Cloud Pl@ntNet" : "Moteur Local CIRAD/INERA"})`],
      ["Organe ciblé par le cliché", organSelected.toUpperCase()],
      ["Observateur de terrain", observerName],
      ["Localisation / Terroir", location],
    ],
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // 3. Descripteurs morphologiques des organes (Norme Pl@ntNet)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("2. DESCRIPTEURS MORPHOLOGIQUES CARACTÉRISTIQUES", 14, currentY);

  currentY += 5;

  const leaf = species.organs.leaf;
  autoTable(doc, {
    startY: currentY,
    theme: "striped",
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.2 },
    head: [["Caractère Botanique", "Observation & Typologie", "Spécificité d'Afrique de l'Ouest"]],
    body: [
      ["Morphologie foliaire", `${leaf.shape || "Caractéristique"} (${leaf.margin || "Marge entière"})`, leaf.arrangement || "Alternes"],
      ["Nervation & Texture", `${leaf.venation || "Pennée"} • ${leaf.texture || "Coriace"}`, leaf.colorTypical || "Vert franc"],
      ["Inflorescence & Fleur", species.organs.flower ? `${species.organs.flower.inflorescence} (${species.organs.flower.symmetry})` : "Non déterminante", species.organs.flower?.color || "—"],
      ["Fructification / Graine", species.organs.fruit ? `${species.organs.fruit.type} (Maturité: ${species.organs.fruit.colorMaturity})` : "Non observée", species.organs.fruit?.edible ? "Comestible" : "Non consommable"],
    ],
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // 4. Alertes de Protection des Végétaux & Clés INERA
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("3. IMPLICATIONS AGRONOMIQUES & PHYTOSANITAIRES", 14, currentY);

  currentY += 5;

  const phytoText = species.isWeed
    ? `ATTENTION : Cette espèce est classée comme adventice compétitrice ou parasite obligatoire (ex: Striga). Cultures hôtes menacées : ${species.targetCrops?.join(", ") || "Céréales & Légumineuses"}. Une intervention de sarclage précoce ou désherbage intégré conforme CILSS est requise.`
    : `Culture d'intérêt économique et vivrier. Cycle végétatif moyen : ${species.cycleDaysRange ? `${species.cycleDaysRange[0]} à ${species.cycleDaysRange[1]} jours` : "Standard"}. Plantes compagnes recommandées : ${species.companionCrops?.join(", ") || "Associations culturales sahéliennes"}.`;

  doc.setFillColor(species.isWeed ? 254 : 240, species.isWeed ? 242 : 253, species.isWeed ? 242 : 244);
  doc.setDrawColor(species.isWeed ? 239 : 34, species.isWeed ? 68 : 197, species.isWeed ? 68 : 94);
  doc.roundedRect(14, currentY, pageWidth - 28, 22, 2, 2, "FD");

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(species.isWeed ? 185 : 21, species.isWeed ? 28 : 128, species.isWeed ? 28 : 61);
  const splitPhyto = doc.splitTextToSize(phytoText, pageWidth - 36);
  doc.text(splitPhyto, 18, currentY + 6);

  currentY += 28;

  if (notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("Observations de terrain complémentaires :", 14, currentY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const splitNotes = doc.splitTextToSize(notes, pageWidth - 28);
    doc.text(splitNotes, 14, currentY + 5);
  }

  // Bas de page
  doc.setDrawColor(203, 213, 225);
  doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Référentiels : Pl@ntNet (CIRAD / INRAE / Inria / IRD) • INERA Farako-Bâ • FAO EcoCrop • GBIF Taxonomic Backbone",
    14,
    pageHeight - 9
  );
  doc.text(
    `Date d'émission : ${new Date().toLocaleDateString("fr-FR")}`,
    pageWidth - 14,
    pageHeight - 9,
    { align: "right" }
  );

  return doc;
}
