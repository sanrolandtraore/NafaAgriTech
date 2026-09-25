import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  generateAutoCadDxf,
  generateQgisGeoJson,
  generateNetafimBomCsv,
  CadProjectExportData,
} from "@/lib/cadExportEngine";
import {
  PrecisionCad3DStudio,
  CAD_PRESETS,
} from "@/components/genius/PrecisionCad3DStudio";

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <TooltipProvider>
      <BrowserRouter>{ui}</BrowserRouter>
    </TooltipProvider>
  );
};

const sampleProjectData: CadProjectExportData = {
  projectName: "Périmètre Maraîcher Pilote de Bama",
  clientName: "Issa Ouédraogo",
  clientPhone: "+226 75 77 48 52",
  location: "Bama, Province du Houet, Burkina Faso",
  expertName: "Dr. Oumarou Sawadogo (Ingénieur Rural Agréé)",
  date: "25/09/2026",
  scaleStr: "1:1000",
  crs: "EPSG:32630 (UTM Zone 30N WGS84)",
  areaHa: 1.5,
  perimeterM: 490,
  boundary: [
    { x: 0, y: 0, z: 312.4, lat: 11.391245, lng: -4.412154, label: "Borne B1 - Nord-Ouest (Canal)" },
    { x: 125, y: 10, z: 312.0, lat: 11.39132, lng: -4.41031, label: "Borne B2 - Nord-Est (Piste)" },
    { x: 130, y: 120, z: 310.8, lat: 11.38995, lng: -4.41022, label: "Borne B3 - Sud-Est (Bas-fond)" },
    { x: -5, y: 115, z: 311.2, lat: 11.38988, lng: -4.41208, label: "Borne B4 - Sud-Ouest (Forage)" },
  ],
  pipes: [
    {
      id: "P-MAIN",
      from: { x: 10, y: 20, z: 312.0 },
      to: { x: 25, y: 25, z: 312.2 },
      diameterMm: 63,
      nominalPressure: "PN10",
      material: "PEHD",
      type: "principale",
      flowM3h: 12.5,
      velocityMs: 1.42,
      headLossM: 1.25,
      netafimRef: "PEHD-PN10-DN63",
    },
    {
      id: "P-SECT-1",
      from: { x: 25, y: 25, z: 312.2 },
      to: { x: 80, y: 40, z: 311.6 },
      diameterMm: 50,
      nominalPressure: "PN6",
      material: "PEHD",
      type: "secondaire",
      flowM3h: 6.25,
      velocityMs: 1.18,
      headLossM: 0.95,
      netafimRef: "PEHD-PN6-DN50",
    },
  ],
  equipments: [
    {
      id: "EQ-1",
      x: 10,
      y: 20,
      z: 312.0,
      name: "Forage Positif & Tête d'Exhaure",
      category: "forage",
      netafimRef: "NETAFIM-FORAGE-65M",
    },
    {
      id: "EQ-2",
      x: 25,
      y: 25,
      z: 312.2,
      name: "Château d'Eau Métallique 30m³",
      category: "chateau_eau",
      netafimRef: "NAFA-TOWER-10M3-H6",
    },
    {
      id: "EQ-3",
      x: 15,
      y: 35,
      z: 312.1,
      name: "Station Filtration Netafim SpinKlin",
      category: "station_filtration",
      netafimRef: "NETAFIM-SPINKLIN-2D",
    },
  ],
};

// Canvas context 2D mock complet pour environnement jsdom
const setupCanvasMock = () => {
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(),
    putImageData: vi.fn(),
    createImageData: vi.fn(),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 50 }),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    setLineDash: vi.fn(),
    getLineDash: vi.fn().mockReturnValue([]),
    createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
    createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
  });
};

describe("Moteur d'Export et Modélisation CAO / SIG / IRRICAD / Netafim", () => {
  beforeEach(() => {
    setupCanvasMock();
  });

  describe("1. Générateur AutoCAD DXF R12 Standard (cadExportEngine)", () => {
    it("génère un fichier ASCII DXF valide conforme aux spécifications AutoCAD AC1009", () => {
      const dxfContent = generateAutoCadDxf(sampleProjectData);

      expect(dxfContent).toBeDefined();
      expect(typeof dxfContent).toBe("string");

      // En-tête AutoCAD standard
      expect(dxfContent).toContain("0\nSECTION");
      expect(dxfContent).toContain("2\nHEADER");
      expect(dxfContent).toContain("$ACADVER");
      expect(dxfContent).toContain("AC1009"); // DXF R12 standard

      // Table des calques professionnels (Layers)
      expect(dxfContent).toContain("2\nTABLES");
      expect(dxfContent).toContain("2\nLAYER");
      expect(dxfContent).toContain("CADASTRE_LIMITES");
      expect(dxfContent).toContain("MNT_TOPOGRAPHIE");
      expect(dxfContent).toContain("NETAFIM_ADDUCTION_PEHD");
      expect(dxfContent).toContain("CARTOUCHE_ISO");

      // Entités graphiques (Lignes et Textes)
      expect(dxfContent).toContain("2\nENTITIES");
      expect(dxfContent).toContain("LINE");
      expect(dxfContent).toContain("TEXT");

      // Cartouche d'ingénierie ISO 7200
      expect(dxfContent.toUpperCase()).toContain("PÉRIMÈTRE MARAÎCHER PILOTE DE BAMA");
      expect(dxfContent).toContain("Issa Ouédraogo");
      expect(dxfContent).toContain("EPSG:32630");

      // Fin standard de fichier DXF
      expect(dxfContent).toContain("0\nEOF");
    });
  });

  describe("2. Générateur QGIS GeoJSON WGS84 / UTM 30N (cadExportEngine)", () => {
    it("génère un FeatureCollection RFC 7946 valide pour QGIS avec CRS UTM 30N", () => {
      const geoJsonString = generateQgisGeoJson(sampleProjectData);
      expect(geoJsonString).toBeDefined();

      const parsed = JSON.parse(geoJsonString);
      expect(parsed.type).toBe("FeatureCollection");
      expect(parsed.crs).toBeDefined();
      expect(parsed.crs.properties.name).toContain("CRS84");

      // Polygone parcelle
      const polygonFeature = parsed.features.find((f: any) => f.geometry.type === "Polygon");
      expect(polygonFeature).toBeDefined();
      expect(polygonFeature.properties.type).toBe("Périmètre Exploitation");
      expect(polygonFeature.properties.superficie_ha).toBe(1.5);

      // Bornes géodésiques
      const beaconFeatures = parsed.features.filter((f: any) => f.properties.layer === "Bornes_Geodesiques");
      expect(beaconFeatures.length).toBe(4);
      expect(beaconFeatures[0].geometry.type).toBe("Point");

      // Réseau de canalisations (LineString)
      const pipeFeatures = parsed.features.filter((f: any) => f.geometry.type === "LineString");
      expect(pipeFeatures.length).toBeGreaterThanOrEqual(1);

      // Équipements de tête
      const eqFeatures = parsed.features.filter((f: any) => f.properties.layer === "Equipements_Ouvrages");
      expect(eqFeatures.length).toBe(3);
    });
  });

  describe("3. Nomenclature & Devis Netafim (BOM CSV)", () => {
    it("génère un fichier CSV UTF-8 avec références cataloguées Netafim et calcul FCFA", () => {
      const bomCsv = generateNetafimBomCsv(sampleProjectData);
      expect(bomCsv).toBeDefined();

      // En-tête UTF-8 BOM
      expect(bomCsv.startsWith("\uFEFF")).toBe(true);

      // Colonnes officielles
      expect(bomCsv).toContain("Référence Netafim;Désignation Matériel");

      // Références Netafim de référence
      expect(bomCsv).toContain("NETAFIM-SPINKLIN-2D");
      expect(bomCsv).toContain("NAFA-TOWER-10M3-H6");
      expect(bomCsv).toContain("PEHD-PN10-DN63");
    });
  });

  describe("4. Studio CAO & 3D Interactif (PrecisionCad3DStudio)", () => {
    it("affiche le studio avec les 4 onglets professionnels et le sélecteur de parcelles", () => {
      renderWithProviders(<PrecisionCad3DStudio initialPresetId="bama" initialTab="cad2d" />);

      // Titre et badges
      expect(screen.getByText(/Studio de Modélisation 2D\/3D & CAO d'Irrigation Ultra-Précise/i)).toBeInTheDocument();
      expect(screen.getByText(/AutoCAD R12\/2000/i)).toBeInTheDocument();
      expect(screen.getByText(/QGIS SIG UTM30N/i)).toBeInTheDocument();
      expect(screen.getByText(/IRRICAD Hydraulic Solver/i)).toBeInTheDocument();
      expect(screen.getByText(/Netafim Precision Drip/i)).toBeInTheDocument();

      // Vérification des 4 onglets
      expect(screen.getByRole("tab", { name: /1. Plan 2D d'Ingénierie/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /2. Maquette 3D Interactive/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /3. Analyse Hydraulique IRRICAD/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /4. Nomenclature & Devis Netafim/i })).toBeInTheDocument();
    });

    it("affiche la Maquette 3D Interactive avec les modes de rendu", () => {
      renderWithProviders(<PrecisionCad3DStudio initialPresetId="bama" initialTab="maquette3d" />);

      expect(screen.getByText(/Vues Caméra :/i)).toBeInTheDocument();
      expect(screen.getByText(/Haut \(QGIS\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Iso NE \(AutoCAD\)/i)).toBeInTheDocument();

      // Boutons de rendu
      expect(screen.getByText(/Ombré CAD/i)).toBeInTheDocument();
      expect(screen.getByText(/Filaire AutoCAD/i)).toBeInTheDocument();
      expect(screen.getByText(/IRRICAD Heatmap/i)).toBeInTheDocument();
      expect(screen.getByText(/MNT Relief/i)).toBeInTheDocument();
    });

    it("calcule avec rigueur les paramètres hydrauliques IRRICAD dans l'onglet dédié", () => {
      renderWithProviders(<PrecisionCad3DStudio initialPresetId="bama" initialTab="irricad" />);

      expect(screen.getByText(/Débit de secteur/i)).toBeInTheDocument();
      expect(screen.getByText(/Vitesse d'écoulement/i)).toBeInTheDocument();
      expect(screen.getByText(/Pertes de charge/i)).toBeInTheDocument();
      expect(screen.getByText(/Uniformité d'émission \(EU\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Hazen-Williams/i)).toBeInTheDocument();
    });

    it("affiche le catalogue officiel Netafim et son bordereau chiffré", () => {
      renderWithProviders(<PrecisionCad3DStudio initialPresetId="bama" initialTab="nomenclature" />);

      expect(screen.getByText(/Nomenclature Officielle & Chiffrage Netafim/i)).toBeInTheDocument();
      expect(screen.getByText(/NETAFIM-PE100-DN63/i)).toBeInTheDocument();
      expect(screen.getByText(/NETAFIM-DRIPNET-16/i)).toBeInTheDocument();
    });

    it("permet de changer de parcelle modèle (Koubri 3.2 ha) et actualise les calculs", async () => {
      renderWithProviders(<PrecisionCad3DStudio initialPresetId="bama" initialTab="cad2d" />);

      const koubriButton = screen.getByRole("button", { name: /Domaine Agro-Pastoral Intégré de Koubri \(3.2 ha\)/i });
      fireEvent.click(koubriButton);

      await waitFor(() => {
        expect(screen.getByText(/Koubri, Région du Centre, Burkina Faso/i)).toBeInTheDocument();
        expect(screen.getAllByText(/3.2 ha/i).length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
