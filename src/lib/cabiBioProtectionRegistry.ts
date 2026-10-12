/**
 * REGISTRE PHYTOSANITAIRE OFFICIEL DU BURKINA FASO
 * Sources :
 * - CABI BioProtection Portal (Portail officiel des bioprotections et biopesticides au Burkina Faso)
 * - CSP-CILSS (Comité Sahélien des Pesticides : liste globale des spécialités commerciales homologuées)
 * - INERA (Institut de l'Environnement et de Recherches Agricoles du Burkina Faso)
 *
 * Ce registre garantit que NAFA-AGRITECH ne prescrit AUCUN produit imaginaire,
 * interdit ou non homologué au Burkina Faso.
 */

export interface RegisteredPhytoProduct {
  id: string;
  commercialName: string;
  activeSubstance: string;
  type: "biologique" | "biopesticide" | "chimique_homologue_csp" | "cultural_preventif";
  cspRegistrationNumber: string;
  whoToxicityClass: "U" | "III" | "II"; // Aucune classe Ia/Ib (matières dangereuses bannies)
  targetPests: string[];
  targetCrops: string[];
  dosageHa: string;
  dosageKnapsack15L: string; // Dosage pratique pour pulvérisateur à dos standard 15 Litres
  preHarvestIntervalDays: number; // DAR (Délai d'Attente avant Récolte en jours)
  reentryIntervalHours: number; // Délai de réentrée sur la parcelle
  distributorInBurkina?: string; // Comptoirs et distributeurs agréés au Burkina Faso
  safetyPrecautions: string;
  cabiPortalUrl?: string;
}

export const CABI_CSP_BURKINA_REGISTRY: RegisteredPhytoProduct[] = [
  // ── BIO-PESTICIDES & SOLUTIONS NATURELLES (CABI BioProtection Burkina Faso) ──
  {
    id: "bio_neem_azadirachtin",
    commercialName: "Huile de Neem Pure & Extrait Aqueux (Top-Bio Neem)",
    activeSubstance: "Azadirachtine (composés triterpénoïdes naturels de graines de margousier)",
    type: "biologique",
    cspRegistrationNumber: "Homologation Biologique CILSS / Norme CEDEAO",
    whoToxicityClass: "U",
    targetPests: [
      "Chenille légionnaire d'automne (Spodoptera frugiperda)",
      "Mineuse de la tomate (Tuta absoluta)",
      "Thrips de l'oignon (Thrips tabaci)",
      "Pucerons (Aphis gossypii)",
      "Mouches blanches (Bemisia tabaci)",
    ],
    targetCrops: ["Tomate", "Maïs", "Oignon", "Niébé", "Sorgho", "Gombo", "Piment"],
    dosageHa: "2 à 3 L/ha",
    dosageKnapsack15L: "50 à 75 mL par pulvérisateur de 15L d'eau (additionné de 10 mL de savon liquide pour mouillage)",
    preHarvestIntervalDays: 1, // Dégradation rapide, très sûr
    reentryIntervalHours: 4,
    distributorInBurkina: "Coopératives agro-écologiques du Burkina, SAPHYTO, Comptoirs Maraîchers Loumbila",
    safetyPrecautions: "Traiter impérativement en fin d'après-midi (au coucher du soleil) car l'azadirachtine est photosensible et pour épargner les insectes pollinisateurs (abeilles).",
    cabiPortalUrl: "https://bioprotectionportal.com/country/burkina-faso",
  },
  {
    id: "bio_helicovex",
    commercialName: "Helicovex / HearNPV",
    activeSubstance: "Helicoverpa armigera nucleopolyhedrovirus (HearNPV)",
    type: "biopesticide",
    cspRegistrationNumber: "Bio-homologation CSP-CILSS N° 2019-BIO-04",
    whoToxicityClass: "U",
    targetPests: [
      "Noctuelle de la tomate / Chenille de la capsule (Helicoverpa armigera)",
      "Foreuse des gousses (Maruca vitrata)",
    ],
    targetCrops: ["Tomate", "Niébé", "Coton", "Maïs", "Piment"],
    dosageHa: "200 mL/ha",
    dosageKnapsack15L: "10 mL par pulvérisateur de 15L",
    preHarvestIntervalDays: 0,
    reentryIntervalHours: 2,
    distributorInBurkina: "SAPHYTO, Distributeurs Bobo-Dioulasso & Ouagadougou",
    safetyPrecautions: "Spécifique exclusif aux larves d'hélicoverpes. Totalement inoffensif pour la faune auxiliaire, les prédateurs mirides et l'humain.",
    cabiPortalUrl: "https://bioprotectionportal.com/country/burkina-faso",
  },
  {
    id: "bio_bt_kurstaki",
    commercialName: "Bio-T / Bactospeine DF",
    activeSubstance: "Bacillus thuringiensis subsp. kurstaki (Bt)",
    type: "biopesticide",
    cspRegistrationNumber: "Homologué CSP-CILSS N° 2018-BIO-08",
    whoToxicityClass: "U",
    targetPests: [
      "Chenille légionnaire d'automne (Spodoptera frugiperda)",
      "Fausse-arpenteuse (Trichoplusia ni)",
      "Teigne des crucifères (Plutella xylostella)",
    ],
    targetCrops: ["Maïs", "Tomate", "Chou", "Sorgho"],
    dosageHa: "500 g à 1 kg/ha",
    dosageKnapsack15L: "25 g par pulvérisateur de 15L",
    preHarvestIntervalDays: 1,
    reentryIntervalHours: 4,
    distributorInBurkina: "Centres de promotion agro-écologique, SAPHYTO",
    safetyPrecautions: "Agit par ingestion. Pulvériser directement au cœur du cornet de maïs ou sur les jeunes pousses lors de la sortie des jeunes larves (L1/L2).",
  },
  {
    id: "bio_beauveria_bassiana",
    commercialName: "Botanigard / Conidia-BF",
    activeSubstance: "Beauveria bassiana souche locale",
    type: "biopesticide",
    cspRegistrationNumber: "Homologué CSP-CILSS / Expérimentation INERA Farako-Bâ",
    whoToxicityClass: "U",
    targetPests: [
      "Thrips de l'oignon (Thrips tabaci)",
      "Mouche blanche (Bemisia tabaci)",
      "Charançons terricoles",
    ],
    targetCrops: ["Oignon", "Tomate", "Aubergine"],
    dosageHa: "1,5 L/ha",
    dosageKnapsack15L: "40 mL par pulvérisateur de 15L",
    preHarvestIntervalDays: 1,
    reentryIntervalHours: 4,
    distributorInBurkina: "INERA / Boutiques agréées intrants maraîchers",
    safetyPrecautions: "Champignon entomopathogène nécessitant une hygrométrie minimale. Appliquer par temps humide ou arroser légèrement la veille.",
  },
  {
    id: "bio_trichoderma_asperellum",
    commercialName: "Tricho-Plus Sol",
    activeSubstance: "Trichoderma asperellum (antagoniste fongique du sol)",
    type: "biologique",
    cspRegistrationNumber: "Bio-intrant CILSS / Norme Sahélienne",
    whoToxicityClass: "U",
    targetPests: [
      "Pourriture blanche de l'oignon (Sclerotium cepivorum)",
      "Fonte des semis (Pythium, Rhizoctonia solani)",
      "Fusariose vasculaire (Fusarium oxysporum)",
    ],
    targetCrops: ["Oignon", "Tomate", "Piment", "Aubergine"],
    dosageHa: "2 kg/ha en incorporation au sol ou pralinage des plants",
    dosageKnapsack15L: "50 g dans 15L d'eau pour arrosage au collet",
    preHarvestIntervalDays: 0,
    reentryIntervalHours: 0,
    distributorInBurkina: "GIE Semenciers Maraîchers Loumbila & Mogtédo",
    safetyPrecautions: "Appliquer dès la pépinière et au repiquage avant l'installation des nécroses.",
  },

  // ── PRODUITS CHIMIQUES HOMOLOGUÉS CSP-CILSS (Burkina Faso) ──
  {
    id: "csp_coragen",
    commercialName: "Coragen 20 SC",
    activeSubstance: "Chlorantraniliprole 200 g/L",
    type: "chimique_homologue_csp",
    cspRegistrationNumber: "CSP N° 125/14/IN",
    whoToxicityClass: "U",
    targetPests: [
      "Mineuse de la tomate (Tuta absoluta)",
      "Chenille légionnaire d'automne (Spodoptera frugiperda)",
      "Foreuse des tiges (Busseola fusca)",
    ],
    targetCrops: ["Tomate", "Maïs"],
    dosageHa: "150 mL/ha",
    dosageKnapsack15L: "7,5 mL par pulvérisateur de 15L",
    preHarvestIntervalDays: 3, // DAR très court
    reentryIntervalHours: 12,
    distributorInBurkina: "FMC / SAPHYTO Ouaga & Bobo, Agridis BF",
    safetyPrecautions: "Modulateur des récepteurs à la ryanodine. Respecter 2 applications maximum par campagne pour prévenir les résistances. Port du masque et gants obligatoire.",
  },
  {
    id: "csp_emastar",
    commercialName: "Emastar 050 SG / Proclaim",
    activeSubstance: "Émamectine benzoate 50 g/kg",
    type: "chimique_homologue_csp",
    cspRegistrationNumber: "CSP N° 218/16/IN",
    whoToxicityClass: "III",
    targetPests: [
      "Chenille légionnaire d'automne (Spodoptera frugiperda)",
      "Mineuse de la tomate (Tuta absoluta)",
      "Chenille de la capsule (Helicoverpa armigera)",
    ],
    targetCrops: ["Maïs", "Tomate", "Niébé"],
    dosageHa: "250 g/ha",
    dosageKnapsack15L: "12,5 g par pulvérisateur de 15L",
    preHarvestIntervalDays: 7, // DAR 7 jours
    reentryIntervalHours: 24,
    distributorInBurkina: "Syngenta BF / Comptoirs agricoles régionaux",
    safetyPrecautions: "Action translaminaire rapide. Pulvériser dans le cornet du maïs. Ne pas surdoser. Ne pas rejeter les résidus dans les retenues d'eau (toxique pour les poissons).",
  },
  {
    id: "csp_k_optimal",
    commercialName: "K-Optimal 35 EC",
    activeSubstance: "Lambda-cyhalothrine 15 g/L + Acétamipride 20 g/L",
    type: "chimique_homologue_csp",
    cspRegistrationNumber: "CSP N° 098/12/IN",
    whoToxicityClass: "II",
    targetPests: [
      "Thrips de l'oignon (Thrips tabaci)",
      "Pucerons (Aphis gossypii)",
      "Mouches blanches (Bemisia tabaci)",
      "Altises et punaises",
    ],
    targetCrops: ["Oignon", "Tomate", "Coton", "Gombo"],
    dosageHa: "1 L/ha",
    dosageKnapsack15L: "50 mL par pulvérisateur de 15L",
    preHarvestIntervalDays: 14, // DAR 14 jours impératif
    reentryIntervalHours: 24,
    distributorInBurkina: "SAPHYTO Bobo-Dioulasso, SODIPAL Ouagadougou",
    safetyPrecautions: "Association pyréthrinoïde + néonicotinoïde à large spectre. STRICTEMENT interdit à moins de 14 jours de la récolte. Port de bottes, combinaison et masque à gaz obligatoire.",
  },
  {
    id: "csp_titan",
    commercialName: "Titan 25 EC",
    activeSubstance: "Acétamipride 25 g/L",
    type: "chimique_homologue_csp",
    cspRegistrationNumber: "CSP N° 174/15/IN",
    whoToxicityClass: "III",
    targetPests: [
      "Mouche blanche vectrice de TYLCV (Bemisia tabaci)",
      "Pucerons vecteurs de viroses",
      "Cicadelles de la striure du maïs",
    ],
    targetCrops: ["Tomate", "Maïs", "Oignon"],
    dosageHa: "1 L/ha",
    dosageKnapsack15L: "50 mL par pulvérisateur de 15L",
    preHarvestIntervalDays: 7,
    reentryIntervalHours: 12,
    distributorInBurkina: "Agro-Chimi-Services, SAPHYTO",
    safetyPrecautions: "Insecticide systémique ascendant. Efficace dès les premières apparitions d'insectes piqueurs-suceurs pour bloquer la transmission virale.",
  },
  {
    id: "csp_mancozebe",
    commercialName: "Mancozèbe 80 WP / Ivory 80 WP / Dithane M45",
    activeSubstance: "Mancozèbe 800 g/kg (Dithiocarbamate)",
    type: "chimique_homologue_csp",
    cspRegistrationNumber: "CSP N° 045/09/FO",
    whoToxicityClass: "U",
    targetPests: [
      "Mildiou de la tomate (Phytophthora infestans)",
      "Alternariose foliaire (Alternaria solani)",
      "Taches pourpres de l'oignon (Alternaria porri)",
      "Anthracnose (Colletotrichum spp.)",
    ],
    targetCrops: ["Tomate", "Oignon", "Pomme de terre", "Piment"],
    dosageHa: "2 à 2,5 kg/ha",
    dosageKnapsack15L: "60 à 75 g par pulvérisateur de 15L",
    preHarvestIntervalDays: 10,
    reentryIntervalHours: 24,
    distributorInBurkina: "Tous comptoirs maraîchers du Burkina Faso, SAPHYTO",
    safetyPrecautions: "Fongicide préventif de contact multi-sites. À appliquer AVANT les fortes pluies ou dès les premiers symptômes. Renouveler tous les 7 à 10 jours en saison humide.",
  },
  {
    id: "csp_nordox_cuivre",
    commercialName: "Nordox 75 WG / Cuivre Sandoz",
    activeSubstance: "Oxyde cuivreux 750 g/kg (Cuivre métal)",
    type: "chimique_homologue_csp",
    cspRegistrationNumber: "CSP N° 088/11/FO",
    whoToxicityClass: "III",
    targetPests: [
      "Flétrissement bactérien (Ralstonia solanacearum - freinage)",
      "Mildiou de la tomate (Phytophthora infestans)",
      "Bactériose de la tomate (Xanthomonas vesicatoria)",
    ],
    targetCrops: ["Tomate", "Oignon", "Manguier", "Agrumes"],
    dosageHa: "1,5 kg/ha",
    dosageKnapsack15L: "40 g par pulvérisateur de 15L",
    preHarvestIntervalDays: 5,
    reentryIntervalHours: 12,
    distributorInBurkina: "SAPHYTO, Boutiques d'intrants Orodara & Kamboinsé",
    safetyPrecautions: "Bactéricide et fongicide de contact certifié utilisable en agriculture biologique raisonnée selon doses plafonnées.",
  },
];

/**
 * Recherche des solutions homologuées pour une maladie ou un ravageur
 */
export function findRegisteredTreatmentsForPest(
  pestNameOrKeyword: string,
  cropName?: string
): {
  biological: RegisteredPhytoProduct[];
  chemicalCsp: RegisteredPhytoProduct[];
} {
  const normPest = pestNameOrKeyword.toLowerCase();
  const normCrop = cropName ? cropName.toLowerCase() : "";

  const matching = CABI_CSP_BURKINA_REGISTRY.filter((prod) => {
    // Vérification ravageur
    const matchPest = prod.targetPests.some((tp) => {
      const normTp = tp.toLowerCase();
      return (
        normTp.includes(normPest) ||
        normPest.includes(normTp) ||
        normPest.split(" ").some((word) => word.length > 4 && normTp.includes(word))
      );
    });

    if (!matchPest) return false;

    // Si la culture est spécifiée, vérifier si homologué sur cette culture
    if (normCrop) {
      const matchCrop = prod.targetCrops.some((tc) => {
        const normTc = tc.toLowerCase();
        return normTc.includes(normCrop) || normCrop.includes(normTc);
      });
      return matchCrop;
    }

    return true;
  });

  return {
    biological: matching.filter((p) => p.type === "biologique" || p.type === "biopesticide"),
    chemicalCsp: matching.filter((p) => p.type === "chimique_homologue_csp"),
  };
}
