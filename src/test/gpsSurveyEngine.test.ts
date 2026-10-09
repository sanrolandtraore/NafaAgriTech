import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateDistanceM,
  calculateBearingDeg,
  calculatePolygonAreaM2,
  calculatePerimeterM,
  calculateCentroid,
  toDMS,
  parseDMSToDD,
  toApproximateUtmZone30N,
  enrichWaypoints,
  gpsSurveyStorage,
  exportToGeoJson,
  exportToGpx,
  exportToKml,
  exportToCsv,
  generateGpsSurveyPdf,
  type SurveyWaypoint,
  type GpsSurveySession,
} from "@/lib/gpsSurveyEngine";

describe("GPS Survey Engine — Calculs Géodésiques & Arpentage WGS84", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("calcule avec précision la distance orthodromique entre 2 points GPS", () => {
    // 2 points à Ouagadougou séparés d'environ 111 mètres
    const p1 = { lat: 12.371428, lng: -1.519725 };
    const p2 = { lat: 12.372428, lng: -1.519725 }; // Différence de 0.001° de latitude
    const dist = calculateDistanceM(p1, p2);

    expect(dist).toBeGreaterThan(110);
    expect(dist).toBeLessThan(112);
  });

  it("calcule le gisement / azimut (cap) vers le Nord", () => {
    const p1 = { lat: 12.0, lng: -1.5 };
    const p2 = { lat: 13.0, lng: -1.5 }; // Plein Nord
    const bearing = calculateBearingDeg(p1, p2);

    expect(bearing).toBe(0);
  });

  it("convertit les coordonnées DD en DMS et réciproquement", () => {
    const lat = 12.371428;
    const dms = toDMS(lat, true);

    expect(dms).toContain("12°");
    expect(dms).toContain("22'");
    expect(dms).toContain("N");

    const parsed = parseDMSToDD(dms);
    expect(parsed).toBeCloseTo(lat, 4);
  });

  it("projette approximativement en coordonnées UTM Zone 30N pour le Burkina Faso", () => {
    const lat = 12.3714;
    const lng = -1.5197;
    const utm = toApproximateUtmZone30N(lat, lng);

    expect(utm.zone).toBe("30N");
    expect(utm.easting).toBeGreaterThan(600000);
    expect(utm.northing).toBeGreaterThan(1300000);
  });

  it("calcule la surface et le périmètre d'une parcelle géométrique", () => {
    // Carré fictif d'environ 100m x 100m (~ 1 hectare)
    const points = [
      { lat: 12.37, lng: -1.52 },
      { lat: 12.3709, lng: -1.52 },
      { lat: 12.3709, lng: -1.5191 },
      { lat: 12.37, lng: -1.5191 },
    ];

    const areaM2 = calculatePolygonAreaM2(points);
    const perimeterM = calculatePerimeterM(points);

    expect(areaM2).toBeGreaterThan(8000);
    expect(areaM2).toBeLessThan(12000);
    expect(perimeterM).toBeGreaterThan(350);
    expect(perimeterM).toBeLessThan(450);
  });

  it("enrichit les sommets avec les distances et caps consécutifs", () => {
    const waypoints: SurveyWaypoint[] = [
      { id: "1", index: 1, label: "P1", category: "borne", lat: 12.37, lng: -1.52, timestamp: Date.now() },
      { id: "2", index: 2, label: "P2", category: "borne", lat: 12.371, lng: -1.52, timestamp: Date.now() },
      { id: "3", index: 3, label: "P3", category: "borne", lat: 12.371, lng: -1.519, timestamp: Date.now() },
    ];

    const enriched = enrichWaypoints(waypoints, true);

    expect(enriched[0].distanceToNextM).toBeGreaterThan(100);
    expect(enriched[0].bearingToNextDeg).toBeDefined();
    // Le dernier point boucle sur le premier car polygone fermé
    expect(enriched[2].distanceToNextM).toBeGreaterThan(100);
  });

  it("génère des exports SIG valides (GeoJSON, GPX, KML, CSV)", () => {
    const mockSession: GpsSurveySession = {
      id: "survey_test_123",
      title: "Levé Test Maraîchage",
      parcelName: "Parcelle Bama N°1",
      clientName: "Issa Ouédraogo",
      locality: "Bama",
      surveyDate: new Date().toISOString(),
      mode: "polygon",
      waypoints: [
        { id: "1", index: 1, label: "P1", category: "borne", lat: 12.37, lng: -1.52, timestamp: Date.now() },
        { id: "2", index: 2, label: "P2", category: "borne", lat: 12.371, lng: -1.52, timestamp: Date.now() },
        { id: "3", index: 3, label: "P3", category: "borne", lat: 12.371, lng: -1.519, timestamp: Date.now() },
      ],
      areaM2: 10000,
      areaHa: 1.0,
      perimeterM: 400,
      centroid: { lat: 12.3705, lng: -1.5195 },
      averageAccuracyM: 2.5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // GeoJSON
    const geoJsonStr = exportToGeoJson(mockSession);
    const parsedGeoJson = JSON.parse(geoJsonStr);
    expect(parsedGeoJson.type).toBe("FeatureCollection");
    expect(parsedGeoJson.features.length).toBe(4); // 3 points + 1 polygon

    // GPX
    const gpxStr = exportToGpx(mockSession);
    expect(gpxStr).toContain("<gpx");
    expect(gpxStr).toContain("<wpt");
    expect(gpxStr).toContain("<trk>");

    // KML
    const kmlStr = exportToKml(mockSession);
    expect(kmlStr).toContain("<kml");
    expect(kmlStr).toContain("<Polygon>");

    // CSV
    const csvStr = exportToCsv(mockSession);
    expect(csvStr).toContain("Identifiant_Borne;Type;Latitude_DD");
    expect(csvStr).toContain('"P1"');
  });

  it("persiste et restaure un levé GPS dans le stockage local", () => {
    const mockSession: GpsSurveySession = {
      id: "survey_persisted",
      title: "Levé Borne Cadastre",
      parcelName: "Zone A",
      clientName: "Coopérative",
      locality: "Koudougou",
      surveyDate: new Date().toISOString(),
      mode: "polygon",
      waypoints: [
        { id: "1", index: 1, label: "B1", category: "borne", lat: 12.25, lng: -2.36, timestamp: Date.now() },
        { id: "2", index: 2, label: "B2", category: "borne", lat: 12.26, lng: -2.36, timestamp: Date.now() },
      ],
      areaM2: 5000,
      areaHa: 0.5,
      perimeterM: 300,
      centroid: { lat: 12.255, lng: -2.36 },
      averageAccuracyM: 3.1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    gpsSurveyStorage.save(mockSession);
    const retrieved = gpsSurveyStorage.getById("survey_persisted");

    expect(retrieved).not.toBeNull();
    expect(retrieved?.parcelName).toBe("Zone A");
    expect(retrieved?.waypoints.length).toBe(2);

    gpsSurveyStorage.delete("survey_persisted");
    expect(gpsSurveyStorage.getById("survey_persisted")).toBeNull();
  });

  it("génère le document PDF officiel de levé géodésique", () => {
    const mockSession: GpsSurveySession = {
      id: "survey_pdf_test",
      title: "Procès-verbal de Bornage",
      parcelName: "Parcelle Pilote",
      clientName: "Moussa Sawadogo",
      locality: "Ouahigouya",
      surveyDate: new Date().toISOString(),
      mode: "polygon",
      waypoints: [
        { id: "1", index: 1, label: "Borne 1", category: "borne", lat: 13.58, lng: -2.42, altitude: 320, accuracy: 2, timestamp: Date.now() },
        { id: "2", index: 2, label: "Borne 2", category: "borne", lat: 13.59, lng: -2.42, altitude: 321, accuracy: 2, timestamp: Date.now() },
        { id: "3", index: 3, label: "Borne 3", category: "borne", lat: 13.59, lng: -2.41, altitude: 322, accuracy: 2, timestamp: Date.now() },
      ],
      areaM2: 15000,
      areaHa: 1.5,
      perimeterM: 520,
      centroid: { lat: 13.585, lng: -2.415 },
      averageAccuracyM: 2.0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const doc = generateGpsSurveyPdf(mockSession);
    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });
});
