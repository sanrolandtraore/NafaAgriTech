import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { calculateAdebeoBom } from "@/lib/adebeoBomEngine";
import { generateWavefrontObj, generateWavefrontMtl } from "@/lib/sketchupObjExporter";
import { generateSketchupDxf } from "@/lib/sketchupDxfExporter";
import { generateAdebeoLayOutPdf } from "@/lib/adebeoLayOutPdfGenerator";
import { AdebeoBomModal } from "@/components/field-designer/AdebeoBomModal";
import { FarmElement3D } from "@/components/field-designer/Studio3DFarmModeler";
import { pdfExportHistory } from "@/lib/pdfExportHistory";

// Mock resize observer
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("Intégration Adebeo / SketchUp & LayOut dans NAFA Studio 3D", () => {
  const sampleElements: FarmElement3D[] = [
    {
      id: "elem-bldg-1",
      name: "Bâtiment Avicole Bioclimatique 1000 Sujets",
      category: "building",
      type: "building_poultry",
      x: 0,
      z: 0,
      width: 10,
      length: 25,
      height: 3.5,
      rotation: 0,
      costFcfa: 7500000,
    },
    {
      id: "elem-serre-1",
      name: "Serre Bioclimatique Polycarbonate",
      category: "building",
      type: "greenhouse_dome",
      x: 25,
      z: 0,
      width: 8,
      length: 15,
      height: 3.2,
      rotation: 0,
      costFcfa: 3800000,
    },
    {
      id: "elem-water-1",
      name: "Château d'Eau Solaire 10000L",
      category: "irrigation",
      type: "water_tower_metal",
      x: -15,
      z: -10,
      width: 5,
      length: 5,
      height: 9,
      rotation: 0,
      costFcfa: 4500000,
    },
    {
      id: "elem-pehd-1",
      name: "Canalisation Maîtresse PEHD Ø63",
      category: "irrigation",
      type: "pipe_pehd",
      x: 0,
      z: 10,
      width: 1,
      length: 80,
      height: 0.2,
      linearMeters: 80,
      rotation: 0,
      costFcfa: 250000,
    },
    {
      id: "elem-fence-1",
      name: "Clôture Périmétrique Losange",
      category: "infrastructure",
      type: "fence_wire",
      x: 0,
      z: 0,
      width: 50,
      length: 80,
      height: 1.8,
      linearMeters: 260,
      rotation: 0,
      costFcfa: 1200000,
    },
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  it("calcule avec rigueur le calepinage et le quantitatif des matériaux (BOM) selon les DTU sahéliens", () => {
    const bom = calculateAdebeoBom(sampleElements, "Ferme Agro-Écologique Kamboinsé");

    expect(bom.projectName).toBe("Ferme Agro-Écologique Kamboinsé");
    expect(bom.metrics.totalBuiltAreaM2).toBeGreaterThanOrEqual(250 + 120); // 10x25 + 8x15
    expect(bom.metrics.totalCinderBlocks).toBeGreaterThan(0); // Parpaings de muret
    expect(bom.metrics.totalCementBags50kg).toBeGreaterThan(0); // Ciment dalle + muret
    expect(bom.metrics.totalRoofingSheetsCount).toBeGreaterThan(0); // Tôles bac alu
    expect(bom.metrics.totalPipingLinearM).toBe(80);
    expect(bom.metrics.totalFencingLinearM).toBe(260);
    expect(bom.metrics.totalWaterStorageLiters).toBe(10000);
    expect(bom.metrics.totalSolarPowerWp).toBe(3600);

    // Vérification des lignes de métré
    const cinderBlockLine = bom.lines.find((l) => l.designation.includes("Parpaings creux"));
    expect(cinderBlockLine).toBeDefined();
    expect(cinderBlockLine?.lot).toBe("01_GROS_OEUVRE");
    expect(cinderBlockLine?.quantity).toBeGreaterThan(500);

    const toleLine = bom.lines.find((l) => l.designation.includes("Tôles bac alu"));
    expect(toleLine).toBeDefined();
    expect(toleLine?.lot).toBe("02_CHARPENTE_TOITURE");

    const grandTotal = bom.grandTotalFcfa;
    expect(grandTotal).toBeGreaterThan(5000000);
    expect(bom.lotsSummary.length).toBeGreaterThanOrEqual(4);
  });

  it("génère des fichiers Wavefront OBJ & MTL valides et structurés par calques/balises SketchUp", () => {
    const { objText, mtlText, objFilename, mtlFilename } = generateWavefrontObj(
      sampleElements,
      "Ferme_Modele_3D"
    );

    expect(objFilename).toBe("Ferme_Modele_3D.obj");
    expect(mtlFilename).toBe("Ferme_Modele_3D.mtl");

    // Header OBJ et inclusion MTL
    expect(objText).toContain("mtllib Ferme_Modele_3D.mtl");
    expect(objText).toContain("g Batiment_Avicole_1_Maconnerie");
    expect(objText).toContain("usemtl Mat_Beton_Parpaing");
    expect(objText).toContain("g Batiment_Avicole_1_Toiture_Alu");
    expect(objText).toContain("usemtl Mat_Tole_Alu");
    expect(objText).toContain("g Chateau_Eau_3_Tour_Acier");
    expect(objText).toContain("g Reseau_Hydraulique_PEHD_4");

    // Sommets et faces
    expect(objText).toContain("v ");
    expect(objText).toContain("f ");

    // Vérification des définitions MTL
    expect(mtlText).toContain("newmtl Mat_Beton_Parpaing");
    expect(mtlText).toContain("newmtl Mat_Tole_Alu");
    expect(mtlText).toContain("newmtl Mat_Polycarbonate_Serre");
    expect(mtlText).toContain("newmtl Mat_PEHD_Noir");
  });

  it("génère un export DXF compatible AutoCAD & Trimble SketchUp avec 3DFACE et calques vectoriels", () => {
    const dxfString = generateSketchupDxf(sampleElements, {
      projectName: "Domaine Solaire Kadiogo",
      clientName: "Oumar Sawadogo",
      locality: "Kamboinsé, Ouagadougou",
    });

    expect(dxfString).toContain("$ACADVER\n1\nAC1009"); // AutoCAD R12 universel
    expect(dxfString).toContain("BATIMENTS_MACONNERIE");
    expect(dxfString).toContain("BATIMENTS_TOITURE");
    expect(dxfString).toContain("OUVRAGES_HYDRAULIQUES");
    expect(dxfString).toContain("CANALISATIONS_PEHD");
    expect(dxfString).toContain("CARTOUCHE_ADEBEO");
    expect(dxfString).toContain("3DFACE");
    expect(dxfString).toContain("DOMAINE SOLAIRE KADIOGO");
    expect(dxfString).toContain("Oumar Sawadogo");
    expect(dxfString).toContain("EOF");
  });

  it("génère le carnet d'architecte LayOut en A4 Paysage (4 planches) avec archivage dans l'historique", () => {
    const saveSpy = vi.spyOn(pdfExportHistory, "saveAndRecordPdf");

    const result = generateAdebeoLayOutPdf(sampleElements, {
      projectName: "Aménagement Agro-Pastoral Bioclimatique",
      clientName: "Coopérative Relwendé",
      clientPhone: "+226 70 88 99 00",
      locality: "Loumbila",
      region: "Plateau-Central",
      province: "Oubritenga",
      areaHa: 4.5,
      perimeterM: 950,
      soilType: "alluvial",
      waterFlowM3H: 15,
    });

    expect(result.doc).toBeDefined();
    expect(result.filename).toContain("Dossier_LayOut_Adebeo_");
    expect(result.bom.grandTotalFcfa).toBeGreaterThan(0);

    // Vérification que le document contient 4 pages (planches)
    expect(result.doc.getNumberOfPages()).toBe(4);

    // Vérification de l'enregistrement dans l'historique PDF
    expect(saveSpy).toHaveBeenCalled();
    const callArgs = saveSpy.mock.calls[0][0];
    expect(callArgs.module).toBe("studio_3d");
    expect(callArgs.title).toContain("Dossier LayOut Architecte 3D");
  });

  it("affiche correctement le modal AdebeoBomModal avec le tableau des métrés et les filtres de lots", () => {
    const onOpenChange = vi.fn();

    render(
      <AdebeoBomModal
        open={true}
        onOpenChange={onOpenChange}
        elements={sampleElements}
        projectName="Ferme Expérimentale INERA"
      />
    );

    // Titre et standard Adebeo
    expect(screen.getByText(/Métrés, Calepinage & Quantitatifs des Matériaux \(BOM\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Standard Adebeo \/ SketchUp/i)).toBeInTheDocument();

    // Boutons d'export Pro
    expect(screen.getByRole("button", { name: /Export SketchUp \(\.OBJ\)/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Export DXF CAO/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Dossier LayOut \(4 Planches PDF\)/i })).toBeInTheDocument();

    // Badges métriques clés
    expect(screen.getByText(/Surface Bâtie/i)).toBeInTheDocument();
    expect(screen.getByText(/Parpaings de 15/i)).toBeInTheDocument();
    expect(screen.getByText(/Ciment CPJ 35/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Tôles Bac Alu/i).length).toBeGreaterThanOrEqual(1);

    // Vérifier les lignes de matériaux affichées dans la table
    expect(screen.getByText(/Parpaings creux 15×20×40/i)).toBeInTheDocument();
    expect(screen.getByText(/Tôles bac alu 6\/10ème laquées/i)).toBeInTheDocument();
  });
});
