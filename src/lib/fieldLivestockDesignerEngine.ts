/**
 * NAFA FIELD DESIGNER — CONCEPTEUR DE BÂTIMENTS D'ÉLEVAGE & FERME
 * Modèles bioclimatiques sahéliens adaptés aux fortes chaleurs :
 * - Poulailler (chair, pondeuses, poussins)
 * - Étable (bovins engraissement, laitières)
 * - Bergerie (ovins, caprins)
 * - Porcherie, Clapier cunicole, Bassin piscicole
 * - Magasin, Serre, Hangar
 * Dimensions, ventilation naturelle par lanterneau, métrés et équipements.
 */

import { BuildingType, FarmBuilding } from "@/types/fieldDesigner";

export interface LivestockModelInput {
  buildingType: BuildingType;
  subType?: string;
  targetCapacity: number; // ex: 2000 poulets, 50 bovins, etc.
}

export interface RecommendedBuildingSpecs {
  name: string;
  buildingType: BuildingType;
  subType: string;
  capacityAnimals: number;
  lengthM: number;
  widthM: number;
  heightM: number;
  areaM2: number;
  orientation: string;
  ventilation: string;
  roofType: string;
  wallMaterial: string;
  equipment: string[];
  rationale: string;
}

export function recommendLivestockBuilding(
  input: LivestockModelInput
): RecommendedBuildingSpecs {
  const cap = Math.max(10, input.targetCapacity);

  if (input.buildingType === "poulailler") {
    const isLaying = input.subType === "pondeuses";
    const isChicks = input.subType === "poussins";

    // Densité sahélienne certifiée :
    // Chair : 10 à 12 sujets / m²
    // Pondeuses : 6 à 7 sujets / m²
    // Poussins : 25 poussins / m²
    const density = isLaying ? 6.5 : isChicks ? 25.0 : 10.5;
    const requiredArea = Math.ceil(cap / density);

    // Largeur optimale au Sahel : 8 à 10 m max pour garantir la ventilation transversale passive
    const widthM = 9.0;
    const lengthM = Math.max(8.0, Math.ceil(requiredArea / widthM));
    const areaM2 = lengthM * widthM;

    return {
      name: `Bâtiment Avicole Bioclimatique (${cap} ${isLaying ? "pondeuses" : isChicks ? "poussins" : "poulets de chair"})`,
      buildingType: "poulailler",
      subType: isLaying ? "pondeuses" : isChicks ? "poussins" : "chair",
      capacityAnimals: cap,
      lengthM,
      widthM,
      heightM: 3.8, // Hauteur sous faîtage 3.8m + lanterneau thermosiphon
      areaM2,
      orientation: "Est-Ouest (Pignons Est et Ouest fermés, façades Nord et Sud ouvertes)",
      ventilation: "Lanterneau d'aération faîtier dynamique + murets bas de 60cm surmontés de grillage",
      roofType: "Tôles Bac Aluzinc isolantes avec débord de toiture 1.20m pare-soleil",
      wallMaterial: "Agglos 15cm crépis ciment pour murets bas, grillage maille 19mm anti-moineaux",
      equipment: isLaying
        ? ["Nids de ponte collectifs", "Abreuvoirs automatiques à cloche", "Mangeoires linéaires", "Éclairage photopériode LED"]
        : ["Radiants de chauffage ou poussinières", "Abreuvoirs pipettes ou siphoïdes", "Mangeoires trémies 15kg", "Pédiluve d'entrée étanche"],
      rationale: `Dimensionné pour ${cap} sujets à une densité sahélienne de ${density} sujets/m². La largeur de ${widthM}m assure une traversée naturelle de l'air sans accumulation toxique d'ammoniac.`,
    };
  }

  if (input.buildingType === "etable") {
    const isDairy = input.subType === "laitieres";
    // 4.5 m²/tête pour engraissement, 8 m² pour vaches laitières avec couloir d'alimentation
    const densityArea = isDairy ? 8.0 : 4.5;
    const requiredArea = Math.ceil(cap * densityArea);
    const widthM = 12.0; // couloir central 3m + 2 stalles de 4.5m
    const lengthM = Math.max(10.0, Math.ceil(requiredArea / widthM));
    const areaM2 = lengthM * widthM;

    return {
      name: `Étable d'élevage bovin (${cap} têtes ${isDairy ? "laitières" : "engraissement"})`,
      buildingType: "etable",
      subType: isDairy ? "laitieres" : "engraissement",
      capacityAnimals: cap,
      lengthM,
      widthM,
      heightM: 4.2,
      areaM2,
      orientation: "Est-Ouest",
      ventilation: "Bâtiment semi-ouvert avec poteaux béton/acier et bardage ventilé",
      roofType: "Tôles Bac Aluzinc avec isolation sous-toiture",
      wallMaterial: "Murs bas 1.20m en agglos pleins de 20cm, dallage béton rainuré antidérapant",
      equipment: ["Auge continue en béton poli", "Abreuvoirs à niveau constant antigaspillage", "Couloir de contention et pesée", "Fosse à lisier / fumière couverte"],
      rationale: `Offre ${densityArea} m² par bovin avec couloir d'alimentation mécanisable et évacuation gravitaire des déjections.`,
    };
  }

  if (input.buildingType === "bergerie") {
    const densityArea = 1.8; // 1.8 m² par petit ruminant
    const requiredArea = Math.ceil(cap * densityArea);
    const widthM = 8.0;
    const lengthM = Math.max(6.0, Math.ceil(requiredArea / widthM));
    const areaM2 = lengthM * widthM;

    return {
      name: `Bergerie ovine/caprine (${cap} têtes)`,
      buildingType: "bergerie",
      subType: "ovins_caprins",
      capacityAnimals: cap,
      lengthM,
      widthM,
      heightM: 3.5,
      areaM2,
      orientation: "Est-Ouest",
      ventilation: "Aération haute permanente sous toiture, sol sec surélevé",
      roofType: "Tôles ondulées avec faux-plafond paille/claies isolantes",
      wallMaterial: "Murets agglos 80cm et barreaudage bois/métal",
      equipment: ["Râteliers à foin surélevés", "Abreuvoirs automatiques ou bacs protégés", "Cases de mise bas isolables", "Bain de trempage podologique"],
      rationale: `Garantit un sol sec et aéré prévenant le piétin et les affections respiratoires ovines fréquentes au Sahel.`,
    };
  }

  if (input.buildingType === "pisciculture") {
    const volumeM3 = Math.ceil(cap * 0.05); // 20 poissons/m³
    const depthM = 1.3;
    const areaM2 = Math.ceil(volumeM3 / depthM);
    const lengthM = Math.ceil(Math.sqrt(areaM2 * 2));
    const widthM = Math.ceil(areaM2 / lengthM);

    return {
      name: `Bassin piscicole bétonné (${cap} alevins/tilapias)`,
      buildingType: "pisciculture",
      subType: "tilapia_silure",
      capacityAnimals: cap,
      lengthM,
      widthM,
      heightM: 1.5,
      areaM2: lengthM * widthM,
      orientation: "Nord-Sud",
      ventilation: "Plein air sous ombrière 50% anti-oiseaux",
      roofType: "Ombrière filet thermique perméable",
      wallMaterial: "Béton armé banché hydrofuge ou agglos à bancher avec enduit sikalite",
      equipment: ["Système vidange moine de surverse", "Aérateur venturi ou surpresseur d'oxygène", "Arrivée d'eau calibrée", "Filtre décanteur mécanique"],
      rationale: `Volume d'eau utile de ${volumeM3} m³ assurant un taux de renouvellement et une oxygénation adéquate pour Tilapia du Nil ou Silure Clarias.`,
    };
  }

  // Autres bâtiments (magasin, serre, hangar, etc.)
  return {
    name: `Magasin de stockage & intrants agricoles`,
    buildingType: "magasin",
    subType: "stockage",
    capacityAnimals: 0,
    lengthM: 12.0,
    widthM: 6.0,
    heightM: 3.5,
    areaM2: 72.0,
    orientation: "Est-Ouest",
    ventilation: "Chicanes d'aération grillagées anti-rongeurs",
    roofType: "Tôles Bac acier galvanisé",
    wallMaterial: "Agglos pleins de 15cm crépis étanches",
    equipment: ["Palettes de stockage surélevées", "Extincteur à poudre", "Porte blindée cadenassable"],
    rationale: "Bâtiment sécurisé ventilé préservant les récoltes, engrais et semences de l'humidité et des ravageurs.",
  };
}
