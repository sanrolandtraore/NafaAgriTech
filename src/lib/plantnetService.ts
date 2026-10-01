/**
 * SERVICE DE VISION & IDENTIFICATION BOTANIQUE PROPRIÉTAIRE NAFA-AGRITECH
 * 
 * NOTE D'ARCHITECTURE CRITIQUE :
 * Ce module a été entièrement migré vers le Moteur Botanique Propriétaire NAFA-AGRITECH.
 * AUCUN APPEL RÉSEAU N'EST EFFECTUÉ VERS L'API PLANTNET.
 * 
 * L'identification s'exécute à 100% en local et hors-ligne à partir de la Base Botanique
 * Propriétaire Ouverte de NAFA-AGRITECH (Open Data FAO EcoCrop, INERA, CIRAD, GBIF, PlantVillage).
 */

export {
  identifyPlantWithNafaEngine,
  identifyPlantWithPlantNet,
  getStoredPlantNetApiKey,
  hasConfiguredPlantNetApiKey,
  savePlantNetApiKey,
  base64ToBlob,
  PLANTNET_TO_NAFA_CROP_MAP,
  PLANTNET_TO_NAFA_WEED_MAP,
  type NafaPlantIdentificationResult,
  type NafaSpeciesMatch,
  type PlantNetIdentificationResult,
  type PlantNetSpeciesMatch,
} from "./nafaPlantIdentifier";
