/**
 * NAFA AGRITECH — QGIS Export Engine Test Suite
 * Vérifie la génération GeoJSON OGC, la projection métrique UTM Zone 30N (EPSG:32630)
 * et l'importateur de parcelles QGIS.
 */

import { describe, it, expect } from "vitest";
import {
  wgs84ToUtmZone30N,
  generateQgisGeoJson,
  parseQgisGeoJson,
} from "@/lib/qgisExportEngine";
import { Farm, Field } from "@/types/fieldDesigner";

describe("QGIS Export Engine & Interoperability", () => {
  it("1. Conversion WGS84 vers UTM Zone 30N (EPSG:32630 - Sahel)", () => {
    // Coordonnées de Bobo-Dioulasso / Bama : Lat ~ 11.39° N, Lng ~ -4.41° W
    const utm = wgs84ToUtmZone30N(11.391245, -4.412154);

    expect(utm.eastingM).toBeGreaterThan(300000);
    expect(utm.eastingM).toBeLessThan(400000);
    expect(utm.northingM).toBeGreaterThan(1200000);
    expect(utm.northingM).toBeLessThan(1300000);
  });

  it("2. Génération GeoJSON QGIS conforme OGC FeatureCollection", () => {
    const demoFarm: Farm = {
      id: "farm_test",
      name: "Ferme Pilote Kou",
      producerName: "Amadou Traoré",
      producerPhone: "+226 70 00 00 00",
      locality: "Bama",
      region: "Hauts-Bassins",
      province: "Houet",
      commune: "Bama",
      villageSector: "Secteur 1",
      farmType: "maraichage",
      totalAreaHa: 2.0,
      mainCrops: ["Oignon"],
      livestockTypes: [],
      irrigationType: "Goutte-à-goutte",
      photos: [],
      syncStatus: "synced",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const demoField: Field = {
      id: "field_1",
      farmId: "farm_test",
      name: "Parcelle Nord Oignon",
      points: [
        { lat: 11.391, lng: -4.412, label: "B1" },
        { lat: 11.392, lng: -4.410, label: "B2" },
        { lat: 11.390, lng: -4.410, label: "B3" },
        { lat: 11.390, lng: -4.412, label: "B4" },
      ],
      areaM2: 20000,
      areaHa: 2.0,
      perimeterM: 600,
      status: "active",
      syncStatus: "synced",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const geojson = generateQgisGeoJson(demoFarm, [demoField]);

    expect(geojson.type).toBe("FeatureCollection");
    expect(geojson.metadata.datum).toBe("WGS 84");
    expect(geojson.metadata.projected_system).toContain("EPSG:32630");

    const polygonFeature = geojson.features.find((f: any) => f.geometry.type === "Polygon");
    expect(polygonFeature).toBeDefined();
    expect(polygonFeature.properties.nom_parcelle).toBe("Parcelle Nord Oignon");
    expect(polygonFeature.properties.superficie_ha).toBe(2.0);

    // Les bornes doivent être exportées sous forme de points
    const pointFeatures = geojson.features.filter((f: any) => f.geometry.type === "Point");
    expect(pointFeatures.length).toBe(4);
    expect(pointFeatures[0].properties.layer).toBe("Bornes_Cadastre");
    expect(pointFeatures[0].properties.utm_x).toBeGreaterThan(0);
  });

  it("3. Importation d'un GeoJSON QGIS externe", () => {
    const rawGeoJson = JSON.stringify({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [-4.412, 11.391],
                [-4.41, 11.392],
                [-4.41, 11.39],
                [-4.412, 11.391],
              ],
            ],
          },
          properties: {
            nom_parcelle: "Parcelle Importée QGIS",
            superficie_ha: 1.5,
            superficie_m2: 15000,
            perimetre_m: 500,
          },
        },
      ],
    });

    const result = parseQgisGeoJson(rawGeoJson, "farm_test_id");
    expect(result.errors.length).toBe(0);
    expect(result.fields.length).toBe(1);
    expect(result.fields[0].name).toBe("Parcelle Importée QGIS");
    expect(result.fields[0].areaHa).toBe(1.5);
    expect(result.fields[0].points.length).toBe(4);
  });
});
