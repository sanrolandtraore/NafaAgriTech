/**
 * Tests de validation du moteur géodésique WGS84, projection UTM bizonale (30N/31N),
 * topologie de parcelle et propagation d'incertitude GPS.
 */

import { describe, it, expect } from "vitest";
import { vincentyInverse, calculateGeodesicPolygonArea } from "../../engineering/geodesy/wgs84Ellipsoid";
import { projectLatLonToUtm, getUtmZoneNumber, analyzeParcelUtmZone } from "../../engineering/geodesy/utmProjection";
import { validateParcelTopology, calculateParcelAreaWithUncertainty } from "../../engineering/geodesy/parcelTopology";

describe("Géodésie ellipsoïdale WGS84 (Vincenty & Karney)", () => {
  it("calcule avec une précision millimétrique la distance géodésique entre Ouagadougou et Bobo-Dioulasso", () => {
    // Coordonnées géodésiques WGS84 des repères géographiques
    const ouaga = { lat: 12.371428, lng: -1.519700 };
    const bobo = { lat: 11.177190, lng: -4.297900 };

    const result = vincentyInverse(ouaga, bobo);

    // Distance géodésique WGS84 exacte de référence ≈ 329.8 km
    expect(result.distanceM).toBeGreaterThan(329500);
    expect(result.distanceM).toBeLessThan(330500);
    expect(result.initialAzimuthDeg).toBeGreaterThan(240); // Cap Sud-Ouest
    expect(result.initialAzimuthDeg).toBeLessThan(260);
    expect(result.provenance.engine).toBe("VincentyGeodesicEngine");
  });

  it("calcule la surface géodésique exacte d'une parcelle rectangulaire de 1 hectare", () => {
    // Parcelle carrée d'environ 100m x 100m à Ouagadougou (lat ~12.37°)
    // 1 seconde d'arc en latitude ≈ 30.77 m -> ~0.0009° pour 100m
    // 1 seconde d'arc en longitude ≈ 30.77 * cos(12.37°) ≈ 30.05 m -> ~0.000925° pour 100m
    const p1 = { lat: 12.370000, lng: -1.520000 };
    const p2 = { lat: 12.370000, lng: -1.519075 };
    const p3 = { lat: 12.370900, lng: -1.519075 };
    const p4 = { lat: 12.370900, lng: -1.520000 };

    const areaRes = calculateGeodesicPolygonArea([p1, p2, p3, p4]);

    // Dimensions ~ 100 m x 100 m = ~ 10 000 m² (1.0 ha)
    expect(areaRes.areaM2).toBeGreaterThan(9900);
    expect(areaRes.areaM2).toBeLessThan(10100);
    expect(areaRes.areaHa).toBeCloseTo(1.0, 1);
    expect(areaRes.perimeterM).toBeGreaterThan(390);
    expect(areaRes.perimeterM).toBeLessThan(410);
  });
});

describe("Projection UTM bizonale (Zone 30N et Zone 31N)", () => {
  it("projette correctement Ouagadougou dans le fuseau UTM 30N (EPSG:32630)", () => {
    const ouaga = { lat: 12.371428, lng: -1.519700 };

    expect(getUtmZoneNumber(ouaga.lng)).toBe(30);

    const utm = projectLatLonToUtm(ouaga);

    expect(utm.zoneNumber).toBe(30);
    expect(utm.hemisphere).toBe("N");
    expect(utm.epsgCode).toBe("EPSG:32630");
    expect(utm.centralMeridianDeg).toBe(-3.0); // Méridien central 30N = 3° W
    // Coordonnées UTM Ouagadougou : Easting ≈ 660 840 m, Northing ≈ 1 368 400 m
    expect(utm.eastingM).toBeGreaterThan(650000);
    expect(utm.eastingM).toBeLessThan(670000);
    expect(utm.northingM).toBeGreaterThan(1360000);
    expect(utm.northingM).toBeLessThan(1380000);
    expect(utm.scaleFactorK).toBeGreaterThan(0.9995);
    expect(utm.scaleFactorK).toBeLessThan(1.0005);
  });

  it("projette correctement Fada N'Gourma dans le fuseau UTM 31N (EPSG:32631)", () => {
    // Fada N'Gourma est situé à l'Est de Greenwich (longitude positive +0.35°)
    const fada = { lat: 12.060000, lng: 0.350000 };

    expect(getUtmZoneNumber(fada.lng)).toBe(31);

    const utm = projectLatLonToUtm(fada);

    expect(utm.zoneNumber).toBe(31);
    expect(utm.hemisphere).toBe("N");
    expect(utm.epsgCode).toBe("EPSG:32631");
    expect(utm.centralMeridianDeg).toBe(3.0); // Méridien central 31N = 3° E
    expect(utm.eastingM).toBeGreaterThan(200000);
    expect(utm.eastingM).toBeLessThan(230000);
    expect(utm.northingM).toBeGreaterThan(1320000);
    expect(utm.northingM).toBeLessThan(1350000);
  });

  it("détecte le franchissement de la frontière de fuseau (méridien 0°)", () => {
    // Parcelle située sur la frontière méridiene entre Koupéla et Fada
    const westPoint = { lat: 12.10, lng: -0.05 }; // Zone 30
    const eastPoint = { lat: 12.10, lng: +0.05 }; // Zone 31
    const analysis = analyzeParcelUtmZone([westPoint, eastPoint]);

    expect(analysis.crossesZoneBoundary).toBe(true);
    expect(analysis.zonesDetected).toContain(30);
    expect(analysis.zonesDetected).toContain(31);
  });
});

describe("Topologie de parcelle & Propagation d'incertitude GPS", () => {
  it("détecte une auto-intersection (polygone croisé en nœud papillon)", () => {
    // Sommets ordonnés en sablier (1 -> 3 -> 2 -> 4)
    const butterflyVertices = [
      { lat: 12.370, lng: -1.520 },
      { lat: 12.371, lng: -1.519 },
      { lat: 12.370, lng: -1.519 },
      { lat: 12.371, lng: -1.520 },
    ];

    const topo = validateParcelTopology(butterflyVertices);

    expect(topo.hasSelfIntersections).toBe(true);
    expect(topo.isValid).toBe(false);
    expect(topo.intersections.length).toBeGreaterThan(0);
    expect(topo.warnings.some((w) => w.includes("Auto-intersection"))).toBe(true);
  });

  it("propage analytiquement l'incertitude GPS sur la surface selon la précision du capteur", () => {
    const squareVertices = [
      { lat: 12.370000, lng: -1.520000 },
      { lat: 12.370000, lng: -1.519075 },
      { lat: 12.370900, lng: -1.519075 },
      { lat: 12.370900, lng: -1.520000 },
    ];

    // 1. Simulation récepteur GPS standard smartphone (précision ± 4.0 m)
    const smartphoneVertices = squareVertices.map((v) => ({
      ...v,
      horizontalAccuracyM: 4.0,
    }));
    const resSmartphone = calculateParcelAreaWithUncertainty(smartphoneVertices);

    // Sur 1 ha (10 000 m²), une erreur de sommet de 4m donne une incertitude de surface d'environ 400 à 700 m² (0.04 à 0.07 ha)
    expect(resSmartphone.sigmaAreaM2).toBeGreaterThan(200);
    expect(resSmartphone.sigmaAreaM2).toBeLessThan(800);
    expect(resSmartphone.margin95Ha).toBeGreaterThan(0.04);
    expect(resSmartphone.surveyQualityGrade).toBe("recreational_approximate");

    // 2. Simulation récepteur GNSS RTK centimétrique professionnel (précision ± 0.02 m)
    const rtkVertices = squareVertices.map((v) => ({
      ...v,
      horizontalAccuracyM: 0.02,
    }));
    const resRtk = calculateParcelAreaWithUncertainty(rtkVertices);

    // En RTK, l'incertitude 95% tombe sous 5 m² (0.0005 ha) !
    expect(resRtk.sigmaAreaM2).toBeLessThan(3.0);
    expect(resRtk.margin95Ha).toBeLessThan(0.001);
    expect(resRtk.surveyQualityGrade).toBe("cadastral_centimetric");

    // L'intervalle de confiance encadre bien la surface réelle
    expect(resRtk.confidenceIntervalHa95[0]).toBeLessThanOrEqual(resRtk.areaHa);
    expect(resRtk.confidenceIntervalHa95[1]).toBeGreaterThanOrEqual(resRtk.areaHa);
  });
});
