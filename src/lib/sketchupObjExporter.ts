/**
 * NAFA STUDIO 3D x ADEBEO / SKETCHUP
 * Exportateur 3D Universel Wavefront (.OBJ & .MTL)
 * 
 * Compatible nativement avec :
 * - Trimble SketchUp Pro / Make (Fichier > Importer > Modèle 3D OBJ)
 * - Autodesk AutoCAD, Revit, Civil 3D
 * - Blender, Twinmotion, Enscape, Lumion
 * 
 * Génère une hiérarchie par Balises / Calques (Tags) SketchUp :
 * - g GrosOeuvre_Maconnerie
 * - g Charpente_Toiture
 * - g Reseau_Hydraulique
 * - g Clotures_Perimetre
 * - g Vegetaux_Nova
 * - g Equipements_Solaire
 */

import { FarmElement3D } from "@/components/field-designer/Studio3DFarmModeler";

export interface ObjMeshBuffer {
  objText: string;
  mtlText: string;
  objFilename: string;
  mtlFilename: string;
}

/**
 * Génère le fichier de définition des matériaux Wavefront .MTL
 */
export function generateWavefrontMtl(): string {
  return `# NAFA AGRITECH x ADEBEO SKETCHUP MATERIAL LIBRARY (.MTL)
# Définitions physiques des matériaux sahéliens

newmtl Mat_Beton_Parpaing
Ka 0.2 0.2 0.2
Kd 0.75 0.75 0.75
Ks 0.1 0.1 0.1
Ns 10.0
illum 2

newmtl Mat_Tole_Alu
Ka 0.3 0.3 0.3
Kd 0.70 0.78 0.85
Ks 0.8 0.8 0.85
Ns 45.0
illum 2

newmtl Mat_Polycarbonate_Serre
Ka 0.2 0.3 0.2
Kd 0.85 0.95 0.85
Ks 0.9 0.9 0.9
Ns 60.0
d 0.65
illum 4

newmtl Mat_Acier_Galvanise
Ka 0.25 0.25 0.25
Kd 0.65 0.68 0.70
Ks 0.6 0.6 0.6
Ns 30.0
illum 2

newmtl Mat_Bois_Traite
Ka 0.2 0.15 0.1
Kd 0.55 0.35 0.20
Ks 0.1 0.1 0.1
Ns 8.0
illum 2

newmtl Mat_PEHD_Noir
Ka 0.1 0.1 0.1
Kd 0.15 0.15 0.15
Ks 0.3 0.3 0.3
Ns 20.0
illum 2

newmtl Mat_Panneau_Solaire
Ka 0.1 0.1 0.2
Kd 0.08 0.12 0.35
Ks 0.9 0.9 0.95
Ns 80.0
illum 2

newmtl Mat_Cuve_Eau
Ka 0.1 0.2 0.3
Kd 0.20 0.50 0.80
Ks 0.5 0.5 0.5
Ns 35.0
illum 2

newmtl Mat_Vegetaux_Nova
Ka 0.1 0.2 0.1
Kd 0.18 0.55 0.22
Ks 0.2 0.2 0.2
Ns 10.0
illum 2

newmtl Mat_Laterite_Sol
Ka 0.3 0.15 0.1
Kd 0.76 0.38 0.22
Ks 0.05 0.05 0.05
Ns 5.0
illum 1
`;
}

/**
 * Génère la géométrie Wavefront .OBJ compatible SketchUp
 */
export function generateWavefrontObj(elements: FarmElement3D[], projectName: string = "Projet_Agricole"): ObjMeshBuffer {
  const mtlFilename = `${projectName.replace(/\s+/g, "_")}.mtl`;
  const objFilename = `${projectName.replace(/\s+/g, "_")}.obj`;

  const lines: string[] = [];
  lines.push(`# NAFA AGRITECH x ADEBEO SKETCHUP 3D EXPORT`);
  lines.push(`# Projet: ${projectName}`);
  lines.push(`# Date: ${new Date().toISOString()}`);
  lines.push(`# Normes: Modélisation par calques/balises compatibles LayOut & SketchUp Pro`);
  lines.push(`mtllib ${mtlFilename}`);
  lines.push("");

  let vertexOffset = 1;

  // Fonction utilitaire pour ajouter un parallélépipède (boîte)
  const addBox = (
    groupName: string,
    materialName: string,
    cx: number,
    cy: number,
    cz: number,
    w: number,
    h: number,
    l: number,
    rotDeg: number = 0
  ) => {
    lines.push(`g ${groupName}`);
    lines.push(`usemtl ${materialName}`);

    const rad = (rotDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const hw = w / 2;
    const hl = l / 2;

    // 8 sommets relatifs avant rotation
    const localCorners = [
      [-hw, 0, -hl],
      [hw, 0, -hl],
      [hw, 0, hl],
      [-hw, 0, hl],
      [-hw, h, -hl],
      [hw, h, -hl],
      [hw, h, hl],
      [-hw, h, hl],
    ];

    // Sommets tournés et translatés
    for (const [lx, ly, lz] of localCorners) {
      const rx = lx * cos - lz * sin + cx;
      const rz = lx * sin + lz * cos + cz;
      const ry = ly + cy;
      lines.push(`v ${rx.toFixed(3)} ${ry.toFixed(3)} ${rz.toFixed(3)}`);
    }

    // 6 faces (sens trigonométrique pour normales extérieures)
    const o = vertexOffset;
    const faces = [
      [o + 0, o + 1, o + 2, o + 3], // Dessous
      [o + 4, o + 7, o + 6, o + 5], // Dessus
      [o + 0, o + 4, o + 5, o + 1], // Face Nord
      [o + 1, o + 5, o + 6, o + 2], // Face Est
      [o + 2, o + 6, o + 7, o + 3], // Face Sud
      [o + 3, o + 7, o + 4, o + 0], // Face Ouest
    ];

    for (const [v1, v2, v3, v4] of faces) {
      lines.push(`f ${v1} ${v2} ${v3} ${v4}`);
    }

    vertexOffset += 8;
  };

  // Fonction utilitaire pour toiture à double pente (gâble)
  const addPitchedRoof = (
    groupName: string,
    materialName: string,
    cx: number,
    baseY: number,
    cz: number,
    w: number,
    roofH: number,
    l: number,
    rotDeg: number = 0
  ) => {
    lines.push(`g ${groupName}`);
    lines.push(`usemtl ${materialName}`);

    const rad = (rotDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const hw = (w * 1.15) / 2; // Débord
    const hl = (l * 1.15) / 2;

    // 6 sommets : 4 sablières + 2 faîtières
    const localCorners = [
      [-hw, 0, -hl], // Sablière Nord-Ouest
      [hw, 0, -hl],  // Sablière Nord-Est
      [hw, 0, hl],   // Sablière Sud-Est
      [-hw, 0, hl],  // Sablière Sud-Ouest
      [0, roofH, -hl], // Faîtière Nord
      [0, roofH, hl],  // Faîtière Sud
    ];

    for (const [lx, ly, lz] of localCorners) {
      const rx = lx * cos - lz * sin + cx;
      const rz = lx * sin + lz * cos + cz;
      const ry = ly + baseY;
      lines.push(`v ${rx.toFixed(3)} ${ry.toFixed(3)} ${rz.toFixed(3)}`);
    }

    const o = vertexOffset;
    // 2 versants rectangulaires
    lines.push(`f ${o + 0} ${o + 4} ${o + 5} ${o + 3}`); // Versant Ouest
    lines.push(`f ${o + 1} ${o + 2} ${o + 5} ${o + 4}`); // Versant Est
    // 2 pignons triangulaires
    lines.push(`f ${o + 0} ${o + 1} ${o + 4}`); // Pignon Nord
    lines.push(`f ${o + 3} ${o + 5} ${o + 2}`); // Pignon Sud

    vertexOffset += 6;
  };

  // Traiter chaque élément de la ferme
  elements.forEach((el, index) => {
    const lowerType = `${el.type || ""} ${el.name || ""}`.toLowerCase();

    // 1. Bâtiment Avicole Bioclimatique
    if (
      el.category === "building" &&
      (lowerType.includes("avic") ||
        lowerType.includes("poulailler") ||
        lowerType.includes("elevage") ||
        lowerType.includes("bergerie") ||
        lowerType.includes("poultry") ||
        lowerType.includes("volaill"))
    ) {
      // Muret en parpaing soubassement
      addBox(
        `Batiment_Avicole_${index + 1}_Maconnerie`,
        "Mat_Beton_Parpaing",
        el.x,
        0,
        el.z,
        el.width,
        0.8,
        el.length,
        el.rotation
      );
      // Poteaux & grillages
      addBox(
        `Batiment_Avicole_${index + 1}_Aere`,
        "Mat_Acier_Galvanise",
        el.x,
        0.8,
        el.z,
        el.width * 0.95,
        el.height - 0.8,
        el.length * 0.95,
        el.rotation
      );
      // Toiture bioclimatique à double pente avec lanterneau
      addPitchedRoof(
        `Batiment_Avicole_${index + 1}_Toiture_Alu`,
        "Mat_Tole_Alu",
        el.x,
        el.height,
        el.z,
        el.width,
        1.2,
        el.length,
        el.rotation
      );
    }
    // 2. Serre Bioclimatique
    else if (
      el.category === "building" &&
      (lowerType.includes("serre") ||
        lowerType.includes("ombriere") ||
        lowerType.includes("greenhouse") ||
        lowerType.includes("dome"))
    ) {
      addBox(
        `Serre_Bioclimatique_${index + 1}_Structure`,
        "Mat_Acier_Galvanise",
        el.x,
        0,
        el.z,
        el.width,
        el.height,
        el.length,
        el.rotation
      );
      addPitchedRoof(
        `Serre_Bioclimatique_${index + 1}_Polycarbonate`,
        "Mat_Polycarbonate_Serre",
        el.x,
        el.height,
        el.z,
        el.width,
        0.8,
        el.length,
        el.rotation
      );
    }
    // 3. Château d'Eau & Station Solaire
    else if (
      lowerType.includes("chateau") ||
      lowerType.includes("reservoir") ||
      lowerType.includes("forage") ||
      lowerType.includes("water") ||
      lowerType.includes("tower") ||
      lowerType.includes("solar") ||
      lowerType.includes("pompe")
    ) {
      // Tour métallique 4 pieds
      addBox(
        `Chateau_Eau_${index + 1}_Tour_Acier`,
        "Mat_Acier_Galvanise",
        el.x,
        0,
        el.z,
        2.5,
        el.height * 0.75,
        2.5,
        el.rotation
      );
      // Cuve PEHD
      addBox(
        `Chateau_Eau_${index + 1}_Cuve_PEHD`,
        "Mat_Cuve_Eau",
        el.x,
        el.height * 0.75,
        el.z,
        3.0,
        el.height * 0.25,
        3.0,
        el.rotation
      );
      // Champ de panneaux solaires
      addBox(
        `Station_Solaire_${index + 1}_Panneaux`,
        "Mat_Panneau_Solaire",
        el.x + 4,
        0.5,
        el.z,
        3.0,
        0.2,
        4.0,
        12 // Incliné à 12 degrés Sud
      );
    }
    // 4. Canalisations d'Irrigation
    else if (el.category === "irrigation" || lowerType.includes("canalisation") || lowerType.includes("tuyau")) {
      addBox(
        `Reseau_Hydraulique_PEHD_${index + 1}`,
        "Mat_PEHD_Noir",
        el.x,
        0.05,
        el.z,
        Math.max(0.2, el.width),
        0.1,
        Math.max(1.0, el.length),
        el.rotation
      );
    }
    // 5. Clôture de Périmètre
    else if (lowerType.includes("cloture") || lowerType.includes("fence") || lowerType.includes("grillage")) {
      addBox(
        `Cloture_Perimetre_${index + 1}`,
        "Mat_Acier_Galvanise",
        el.x,
        0,
        el.z,
        el.width,
        1.8,
        el.length,
        el.rotation
      );
    }
    // 6. Arbres & Végétaux Nova
    else if (el.category === "crop" || lowerType.includes("arbre") || lowerType.includes("fruitier")) {
      // Tronc
      addBox(
        `Arbre_Nova_${index + 1}_Tronc`,
        "Mat_Bois_Traite",
        el.x,
        0,
        el.z,
        0.4,
        el.height * 0.4,
        0.4,
        0
      );
      // Feuillage
      addBox(
        `Arbre_Nova_${index + 1}_Feuillage`,
        "Mat_Vegetaux_Nova",
        el.x,
        el.height * 0.4,
        el.z,
        el.width,
        el.height * 0.6,
        el.length,
        el.rotation
      );
    }
    // 7. Hangar / Autre bâtiment générique
    else {
      addBox(
        `Ouvrage_Agricole_${index + 1}`,
        "Mat_Acier_Galvanise",
        el.x,
        0,
        el.z,
        el.width,
        el.height,
        el.length,
        el.rotation
      );
      if (el.height > 2) {
        addPitchedRoof(
          `Ouvrage_Agricole_${index + 1}_Toit`,
          "Mat_Tole_Alu",
          el.x,
          el.height,
          el.z,
          el.width,
          0.8,
          el.length,
          el.rotation
        );
      }
    }
  });

  return {
    objText: lines.join("\n"),
    mtlText: generateWavefrontMtl(),
    objFilename,
    mtlFilename,
  };
}

/**
 * Déclenche le téléchargement des fichiers .OBJ et .MTL dans le navigateur
 */
export function downloadSketchupPackage(elements: FarmElement3D[], projectName: string = "Projet_Agricole"): void {
  const { objText, mtlText, objFilename, mtlFilename } = generateWavefrontObj(elements, projectName);

  // Télécharger le fichier MTL
  const mtlBlob = new Blob([mtlText], { type: "text/plain;charset=utf-8" });
  const mtlUrl = URL.createObjectURL(mtlBlob);
  const mtlLink = document.createElement("a");
  mtlLink.href = mtlUrl;
  mtlLink.download = mtlFilename;
  mtlLink.click();
  URL.revokeObjectURL(mtlUrl);

  // Télécharger le fichier OBJ avec un léger décalage
  setTimeout(() => {
    const objBlob = new Blob([objText], { type: "text/plain;charset=utf-8" });
    const objUrl = URL.createObjectURL(objBlob);
    const objLink = document.createElement("a");
    objLink.href = objUrl;
    objLink.download = objFilename;
    objLink.click();
    URL.revokeObjectURL(objUrl);
  }, 200);
}
