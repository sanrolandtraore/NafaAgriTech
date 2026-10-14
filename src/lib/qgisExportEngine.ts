/**
 * NAFA AGRITECH — MOTEUR D'INTEROPÉRABILITÉ ET EXPORT QGIS
 * Permet l'échange bidirectionnel entre NAFA et le logiciel SIG de référence QGIS (qgis.org).
 *
 * Formats supportés :
 * - GeoJSON OGC (RFC 7946) avec table attributaire enrichie
 * - DXF métrique R12/2000 (AutoCAD / QGIS vecteur)
 * - Projection métrique UTM Zone 30N (EPSG:32630) pour le Sahel / Burkina Faso
 * - Importation de couches SIG externes vers les parcelles NAFA
 */

import { Farm, Field, IrrigationProject, FarmBuilding } from "@/types/fieldDesigner";

// Conversion WGS84 (Lat/Lng) vers UTM Zone 30N (Burkina Faso / Sahel - EPSG:32630)
export function wgs84ToUtmZone30N(lat: number, lng: number): { eastingM: number; northingM: number } {
  const a = 6378137.0; // Rayon équatorial WGS84
  const f = 1 / 298.257223563;
  const b = a * (1 - f);
  const e2 = (a * a - b * b) / (a * a);
  const ePrime2 = (a * a - b * b) / (b * b);
  const k0 = 0.9996;

  const zone = 30;
  const centralMeridian = (zone - 1) * 6 - 180 + 3; // -3° pour zone 30
  const latRad = (lat * Math.PI) / 180.0;
  const lonRad = (lng * Math.PI) / 180.0;
  const lonOriginRad = (centralMeridian * Math.PI) / 180.0;

  const N = a / Math.sqrt(1 - e2 * Math.sin(latRad) * Math.sin(latRad));
  const T = Math.tan(latRad) * Math.tan(latRad);
  const C = ePrime2 * Math.cos(latRad) * Math.cos(latRad);
  const A = Math.cos(latRad) * (lonRad - lonOriginRad);

  const M =
    a *
    ((1 - e2 / 4 - (3 * e2 * e2) / 64 - (5 * e2 * e2 * e2) / 256) * latRad -
      ((3 * e2) / 8 + (3 * e2 * e2) / 32 + (45 * e2 * e2 * e2) / 1024) * Math.sin(2 * latRad) +
      ((15 * e2 * e2) / 256 + (45 * e2 * e2 * e2) / 1024) * Math.sin(4 * latRad) -
      ((35 * e2 * e2 * e2) / 3072) * Math.sin(6 * latRad));

  const easting =
    k0 *
      N *
      (A +
        ((1 - T + C) * Math.pow(A, 3)) / 6 +
        ((5 - 18 * T + T * T + 72 * C - 58 * ePrime2) * Math.pow(A, 5)) / 120) +
    500000.0; // Faux Est

  let northing =
    k0 *
    (M +
      N *
        Math.tan(latRad) *
        ((A * A) / 2 +
          ((5 - T + 9 * C + 4 * C * C) * Math.pow(A, 4)) / 24 +
          ((61 - 58 * T + T * T + 600 * C - 330 * ePrime2) * Math.pow(A, 6)) / 720));

  if (lat < 0) {
    northing += 10000000.0; // Faux Nord hémisphère sud
  }

  return {
    eastingM: Math.round(easting * 100) / 100,
    northingM: Math.round(northing * 100) / 100,
  };
}

/**
 * Génère un FeatureCollection GeoJSON complet prêt à être ouvert dans QGIS
 */
export function generateQgisGeoJson(
  farm: Farm,
  fields: Field[],
  irrigationProjects: IrrigationProject[] = [],
  buildings: FarmBuilding[] = []
): Record<string, any> {
  const features: any[] = [];

  // 1. Couche des Parcelles (Polygones)
  fields.forEach((field) => {
    if (field.points && field.points.length >= 3) {
      const ring = field.points.map((p) => [p.lng, p.lat]);
      // Fermeture du polygone
      if (
        ring[0][0] !== ring[ring.length - 1][0] ||
        ring[0][1] !== ring[ring.length - 1][1]
      ) {
        ring.push([ring[0][0], ring[0][1]]);
      }

      features.push({
        type: "Feature",
        id: `field_${field.id}`,
        geometry: {
          type: "Polygon",
          coordinates: [ring],
        },
        properties: {
          layer: "Parcelles",
          qgis_style: "cadastre_agricole",
          id: field.id,
          nom_parcelle: field.name,
          exploitation: farm.name,
          producteur: farm.producerName,
          localite: farm.locality,
          superficie_m2: field.areaM2,
          superficie_ha: field.areaHa,
          perimetre_m: field.perimeterM,
          culture_actuelle: field.currentCrop || "Non spécifié",
          type_sol: field.soilType || "Limono-argileux alluvial",
          statut: field.status,
          date_releve: field.createdAt,
          projection: "EPSG:4326 (WGS 84) / EPSG:32630 (UTM 30N)",
        },
      });

      // Ajout des bornes cadastrales sous forme de Points
      field.points.forEach((pt, idx) => {
        const utm = wgs84ToUtmZone30N(pt.lat, pt.lng);
        features.push({
          type: "Feature",
          id: `borne_${field.id}_${idx + 1}`,
          geometry: {
            type: "Point",
            coordinates: [pt.lng, pt.lat],
          },
          properties: {
            layer: "Bornes_Cadastre",
            parcelle_id: field.id,
            borne_num: idx + 1,
            label: pt.label || `Borne B${idx + 1}`,
            altitude_m: pt.alt || 0,
            utm_x: utm.eastingM,
            utm_y: utm.northingM,
          },
        });
      });
    }
  });

  // 2. Couche des Ouvrages & Bâtiments
  buildings.forEach((bld) => {
    // Calcul de l'emprise projetée autour du centre de la ferme si coordonnées GPS disponibles
    const baseLat = farm.gps?.lat || (fields[0]?.points[0]?.lat ?? 12.37);
    const baseLng = farm.gps?.lng || (fields[0]?.points[0]?.lng ?? -1.52);

    // Déplacement métrique approximatif en degrés
    const deltaLat = (bld.posY || 0) / 111320;
    const deltaLng = (bld.posX || 0) / (111320 * Math.cos((baseLat * Math.PI) / 180));
    const widthDeg = (bld.widthM || 10) / (111320 * Math.cos((baseLat * Math.PI) / 180));
    const lengthDeg = (bld.lengthM || 20) / 111320;

    const buildingRing = [
      [baseLng + deltaLng, baseLat + deltaLat],
      [baseLng + deltaLng + widthDeg, baseLat + deltaLat],
      [baseLng + deltaLng + widthDeg, baseLat + deltaLat + lengthDeg],
      [baseLng + deltaLng, baseLat + deltaLat + lengthDeg],
      [baseLng + deltaLng, baseLat + deltaLat],
    ];

    features.push({
      type: "Feature",
      id: `bld_${bld.id}`,
      geometry: {
        type: "Polygon",
        coordinates: [buildingRing],
      },
      properties: {
        layer: "Batiments_Infrastructures",
        nom: bld.name,
        type_infrastructure: bld.buildingType,
        sous_type: bld.subType || "Standard",
        longueur_m: bld.lengthM,
        largeur_m: bld.widthM,
        hauteur_m: bld.heightM,
        surface_m2: bld.areaM2,
        orientation_deg: bld.rotationDeg || 90,
        bioclimatique: "Conforme normes sahéliennes d'aération",
      },
    });
  });

  // 3. Couche des Équipements Hydrauliques (Forages, Pompage)
  irrigationProjects.forEach((proj) => {
    const baseLat = farm.gps?.lat || (fields[0]?.points[0]?.lat ?? 12.37);
    const baseLng = farm.gps?.lng || (fields[0]?.points[0]?.lng ?? -1.52);

    features.push({
      type: "Feature",
      id: `irrig_${proj.id}`,
      geometry: {
        type: "Point",
        coordinates: [baseLng, baseLat],
      },
      properties: {
        layer: "Hydraulique_Irrigation",
        systeme: proj.systemType,
        source_eau: proj.waterSource,
        profondeur_dynamique_m: proj.dynamicWaterDepthM,
        debit_source_m3_h: proj.sourceFlowM3h,
        type_pompe: proj.pumpType,
        puissance_pompe_kw: proj.pumpPowerKw,
        conduite_principale_diam_mm: proj.mainPipeDiameterMm,
        nombre_secteurs: proj.numSectors,
        debit_total_reseau_m3_h: proj.totalFlowRateM3h,
      },
    });
  });

  return {
    type: "FeatureCollection",
    name: `NAFA_QGIS_${farm.name.replace(/\s+/g, "_")}`,
    crs: {
      type: "name",
      properties: {
        name: "urn:ogc:def:crs:OGC:1.3:CRS84",
      },
    },
    metadata: {
      generated_by: "NAFA-AGRITECH QGIS Studio Engine",
      target_software: "QGIS 3.x / ArcGIS / GDAL",
      datum: "WGS 84",
      projected_system: "UTM Zone 30N (EPSG:32630)",
      farm_id: farm.id,
      farm_name: farm.name,
      producer: farm.producerName,
      created_at: new Date().toISOString(),
    },
    features,
  };
}

/**
 * Déclenche le téléchargement d'un fichier GeoJSON QGIS
 */
export function downloadQgisGeoJson(
  farm: Farm,
  fields: Field[],
  irrigationProjects: IrrigationProject[] = [],
  buildings: FarmBuilding[] = []
): void {
  const geojson = generateQgisGeoJson(farm, fields, irrigationProjects, buildings);
  const blob = new Blob([JSON.stringify(geojson, null, 2)], {
    type: "application/geo+json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const filename = `NAFA_QGIS_${farm.name.replace(/[^a-zA-Z0-9]/g, "_")}_EPSG32630.geojson`;
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Déclenche le téléchargement d'un fichier DXF métrique compatible QGIS et AutoCAD
 */
export function downloadQgisDxf(farm: Farm, fields: Field[], buildings: FarmBuilding[] = []): void {
  let dxf = "0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1009\n0\nENDSEC\n";
  dxf += "0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n";
  dxf += "0\nLAYER\n2\nPARCELLES\n70\n0\n62\n3\n6\nCONTINUOUS\n"; // Vert
  dxf += "0\nLAYER\n2\nBORNES\n70\n0\n62\n1\n6\nCONTINUOUS\n"; // Rouge
  dxf += "0\nLAYER\n2\nBATIMENTS\n70\n0\n62\n4\n6\nCONTINUOUS\n"; // Cyan
  dxf += "0\nENDTAB\n0\nENDSEC\n";
  dxf += "0\nSECTION\n2\nENTITIES\n";

  fields.forEach((field) => {
    if (field.points && field.points.length >= 3) {
      // Écriture du polygone en coordonnées UTM métriques
      const utmPoints = field.points.map((p) => wgs84ToUtmZone30N(p.lat, p.lng));
      // Utilisation du premier point comme origine locale (0,0) pour faciliter l'ouverture CAO
      const originX = utmPoints[0].eastingM;
      const originY = utmPoints[0].northingM;

      for (let i = 0; i < utmPoints.length; i++) {
        const p1 = utmPoints[i];
        const p2 = utmPoints[(i + 1) % utmPoints.length];
        const x1 = p1.eastingM - originX;
        const y1 = p1.northingM - originY;
        const x2 = p2.eastingM - originX;
        const y2 = p2.northingM - originY;

        dxf += "0\nLINE\n8\nPARCELLES\n";
        dxf += `10\n${x1}\n20\n${y1}\n30\n0.0\n`;
        dxf += `11\n${x2}\n21\n${y2}\n31\n0.0\n`;
      }
    }
  });

  dxf += "0\nENDSEC\n0\nEOF\n";

  const blob = new Blob([dxf], { type: "application/dxf;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const filename = `NAFA_QGIS_${farm.name.replace(/[^a-zA-Z0-9]/g, "_")}.dxf`;
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Analyse et importe un fichier GeoJSON (exporté de QGIS ou GPS) vers des parcelles NAFA
 */
export function parseQgisGeoJson(
  jsonString: string,
  targetFarmId: string
): { fields: Field[]; errors: string[] } {
  const parsedFields: Field[] = [];
  const errors: string[] = [];

  try {
    const geojson = JSON.parse(jsonString);
    if (!geojson || geojson.type !== "FeatureCollection" || !Array.isArray(geojson.features)) {
      errors.push("Le fichier ne contient pas un FeatureCollection GeoJSON standard.");
      return { fields: parsedFields, errors };
    }

    geojson.features.forEach((feature: any, idx: number) => {
      const geom = feature.geometry;
      if (!geom) return;

      if (geom.type === "Polygon" && Array.isArray(geom.coordinates) && geom.coordinates.length > 0) {
        const ring = geom.coordinates[0];
        const points = ring.map((coord: any, pIdx: number) => ({
          lng: Number(coord[0]),
          lat: Number(coord[1]),
          label: `Point ${pIdx + 1}`,
        }));

        // Calcul préliminaire superficie
        const name =
          feature.properties?.nom_parcelle ||
          feature.properties?.name ||
          feature.properties?.id ||
          `Parcelle Importée ${idx + 1}`;

        const field: Field = {
          id: `field_imported_${Date.now()}_${idx}`,
          farmId: targetFarmId,
          name,
          points,
          areaM2: Number(feature.properties?.superficie_m2) || 10000,
          areaHa: Number(feature.properties?.superficie_ha) || 1.0,
          perimeterM: Number(feature.properties?.perimetre_m) || 400,
          status: "active",
          syncStatus: "synced",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        parsedFields.push(field);
      }
    });
  } catch (err: any) {
    errors.push(`Erreur de lecture GeoJSON : ${err.message}`);
  }

  return { fields: parsedFields, errors };
}
