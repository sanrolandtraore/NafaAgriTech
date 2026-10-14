/**
 * NAFA STUDIO 3D x ADEBEO / SKETCHUP
 * Exportateur CAO Vectoriel DXF (R12 / 2000 avec 3DFACE & Entités 3D)
 * 
 * Optimisé spécialement pour :
 * - Trimble SketchUp Pro (Import CAD avec génération automatique de faces 3D et Balises)
 * - Autodesk AutoCAD & Civil 3D
 * - LibreCAD & QGIS
 */

import { FarmElement3D } from "@/components/field-designer/Studio3DFarmModeler";

export interface SketchupDxfOptions {
  projectName?: string;
  clientName?: string;
  locality?: string;
  crs?: string;
  boundary?: Array<{ x: number; y: number; label?: string }>;
}

export function generateSketchupDxf(elements: FarmElement3D[], options: SketchupDxfOptions = {}): string {
  const lines: string[] = [];
  const add = (code: number, value: string | number) => {
    lines.push(code.toString());
    lines.push(value.toString());
  };

  const projectName = (options.projectName || "Projet Agricole").toUpperCase();
  const clientName = options.clientName || "Exploitant Agricole";
  const locality = options.locality || "Kadiogo, Burkina Faso";
  const crs = options.crs || "EPSG:32630 (UTM Zone 30N)";

  // ── 1. HEADER SECTION ──
  add(0, "SECTION");
  add(2, "HEADER");
  add(9, "$ACADVER");
  add(1, "AC1009"); // AutoCAD Release 12 standard (100% compatible SketchUp CAD Importer)
  add(9, "$INSUNITS");
  add(70, 6); // 6 = Mètres
  add(9, "$MEASUREMENT");
  add(70, 1); // 1 = Métrique ISO
  add(0, "ENDSEC");

  // ── 2. TABLES SECTION (CALQUES / SKETCHUP TAGS) ──
  add(0, "SECTION");
  add(2, "TABLES");
  add(0, "TABLE");
  add(2, "LAYER");
  add(70, 8); // 8 calques techniques

  const defineLayer = (name: string, color: number) => {
    add(0, "LAYER");
    add(2, name);
    add(70, 0);
    add(62, color); // Code ACI (1=Rouge, 2=Jaune, 3=Vert, 4=Cyan, 5=Bleu, 6=Magenta, 7=Blanc)
    add(6, "CONTINUOUS");
  };

  defineLayer("0", 7);
  defineLayer("0_CADASTRE_LIMITES", 2);       // Jaune
  defineLayer("BATIMENTS_MACONNERIE", 1);     // Rouge
  defineLayer("BATIMENTS_TOITURE", 5);        // Bleu
  defineLayer("OUVRAGES_HYDRAULIQUES", 4);    // Cyan
  defineLayer("CANALISATIONS_PEHD", 6);       // Magenta
  defineLayer("CLOTURES_PERIMETRE", 3);       // Vert
  defineLayer("COTATIONS_METRIQUES", 7);      // Blanc
  defineLayer("CARTOUCHE_ADEBEO", 8);         // Gris foncé

  add(0, "ENDTAB");
  add(0, "ENDSEC");

  // ── 3. ENTITIES SECTION ──
  add(0, "SECTION");
  add(2, "ENTITIES");

  // A. Polygone de limite parcellaire (si fourni)
  if (options.boundary && options.boundary.length >= 3) {
    for (let i = 0; i < options.boundary.length; i++) {
      const p1 = options.boundary[i];
      const p2 = options.boundary[(i + 1) % options.boundary.length];

      add(0, "LINE");
      add(8, "0_CADASTRE_LIMITES");
      add(10, p1.x.toFixed(3));
      add(20, p1.y.toFixed(3));
      add(30, 0);
      add(11, p2.x.toFixed(3));
      add(21, p2.y.toFixed(3));
      add(31, 0);

      // Borne cadastrale
      add(0, "CIRCLE");
      add(8, "0_CADASTRE_LIMITES");
      add(10, p1.x.toFixed(3));
      add(20, p1.y.toFixed(3));
      add(30, 0);
      add(40, 0.75); // 75 cm de rayon

      add(0, "TEXT");
      add(8, "0_CADASTRE_LIMITES");
      add(10, (p1.x + 1.0).toFixed(3));
      add(20, (p1.y + 1.0).toFixed(3));
      add(30, 0);
      add(40, 1.2);
      add(1, p1.label || `Borne B${i + 1}`);
    }
  }

  // B. Ajout d'une 3DFACE (Face surfacique directement extrudable sous SketchUp)
  const add3dFace = (
    layer: string,
    p1: [number, number, number],
    p2: [number, number, number],
    p3: [number, number, number],
    p4: [number, number, number]
  ) => {
    add(0, "3DFACE");
    add(8, layer);
    add(10, p1[0].toFixed(3)); add(20, p1[1].toFixed(3)); add(30, p1[2].toFixed(3));
    add(11, p2[0].toFixed(3)); add(21, p2[1].toFixed(3)); add(31, p2[2].toFixed(3));
    add(12, p3[0].toFixed(3)); add(22, p3[1].toFixed(3)); add(32, p3[2].toFixed(3));
    add(13, p4[0].toFixed(3)); add(23, p4[1].toFixed(3)); add(33, p4[2].toFixed(3));
  };

  // C. Ajout d'un prisme 3D complet (boîte à 6 faces)
  const add3dBox = (
    layer: string,
    cx: number,
    cz: number,
    cy: number,
    w: number,
    h: number,
    l: number,
    rotDeg: number = 0
  ) => {
    const rad = (rotDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const hw = w / 2;
    const hl = l / 2;

    const corners: Array<[number, number, number]> = [
      [-hw, -hl],
      [hw, -hl],
      [hw, hl],
      [-hw, hl],
    ].map(([lx, lz]) => {
      const rx = lx * cos - lz * sin + cx;
      const rz = lx * sin + lz * cos + cz;
      return [rx, rz, cy];
    });

    const b0 = corners[0];
    const b1 = corners[1];
    const b2 = corners[2];
    const b3 = corners[3];

    const t0: [number, number, number] = [b0[0], b0[1], cy + h];
    const t1: [number, number, number] = [b1[0], b1[1], cy + h];
    const t2: [number, number, number] = [b2[0], b2[1], cy + h];
    const t3: [number, number, number] = [b3[0], b3[1], cy + h];

    // 6 faces 3D
    add3dFace(layer, b0, b1, b2, b3); // Sol
    add3dFace(layer, t0, t3, t2, t1); // Plafond
    add3dFace(layer, b0, t0, t1, b1); // Face 1
    add3dFace(layer, b1, t1, t2, b2); // Face 2
    add3dFace(layer, b2, t2, t3, b3); // Face 3
    add3dFace(layer, b3, t3, t0, b0); // Face 4
  };

  // D. Parcourir les éléments de la ferme
  elements.forEach((el, index) => {
    const lowerType = `${el.type || ""} ${el.name || ""}`.toLowerCase();

    // 1. Bâtiment (Maçonnerie + Toiture)
    if (el.category === "building") {
      add3dBox("BATIMENTS_MACONNERIE", el.x, el.z, 0, el.width, el.height, el.length, el.rotation);
      add3dBox("BATIMENTS_TOITURE", el.x, el.z, el.height, el.width * 1.1, 0.6, el.length * 1.1, el.rotation);

      // Cotation dimensionnelle
      add(0, "TEXT");
      add(8, "COTATIONS_METRIQUES");
      add(10, el.x.toFixed(3));
      add(20, el.z.toFixed(3));
      add(30, (el.height + 1.0).toFixed(3));
      add(40, 1.2);
      add(1, `${el.name} (${el.width}m × ${el.length}m × ${el.height}m)`);
    }
    // 2. Ouvrage hydraulique / Station solaire
    else if (lowerType.includes("chateau") || lowerType.includes("forage") || lowerType.includes("reservoir")) {
      add3dBox("OUVRAGES_HYDRAULIQUES", el.x, el.z, 0, 3.0, el.height, 3.0, el.rotation);

      add(0, "TEXT");
      add(8, "COTATIONS_METRIQUES");
      add(10, el.x.toFixed(3));
      add(20, el.z.toFixed(3));
      add(30, (el.height + 0.8).toFixed(3));
      add(40, 1.2);
      add(1, `[HYDRAULIQUE] ${el.name} (H: ${el.height}m)`);
    }
    // 3. Réseau de canalisations PEHD
    else if (el.category === "irrigation" || lowerType.includes("canalisation") || lowerType.includes("pehd")) {
      add3dBox("CANALISATIONS_PEHD", el.x, el.z, 0, Math.max(0.4, el.width), 0.2, Math.max(1.0, el.length), el.rotation);

      add(0, "TEXT");
      add(8, "COTATIONS_METRIQUES");
      add(10, el.x.toFixed(3));
      add(20, el.z.toFixed(3));
      add(30, 0.4);
      add(40, 0.9);
      add(1, `PEHD PN10 L: ${Math.round(el.linearMeters || el.length)}ml`);
    }
    // 4. Clôtures de périmètre
    else if (lowerType.includes("cloture") || lowerType.includes("fence") || lowerType.includes("grillage")) {
      add3dBox("CLOTURES_PERIMETRE", el.x, el.z, 0, el.width, 1.8, el.length, el.rotation);
    }
    // 5. Autres
    else {
      add3dBox("BATIMENTS_MACONNERIE", el.x, el.z, 0, el.width, el.height, el.length, el.rotation);
    }
  });

  // E. Cartouche Officiel Adebeo / NAFA en bas à gauche
  const cx = 0;
  const cy = -30;
  const cw = 110;
  const ch = 24;

  const addCartoucheLine = (x1: number, y1: number, x2: number, y2: number) => {
    add(0, "LINE");
    add(8, "CARTOUCHE_ADEBEO");
    add(10, x1.toFixed(3)); add(20, y1.toFixed(3)); add(30, 0);
    add(11, x2.toFixed(3)); add(21, y2.toFixed(3)); add(31, 0);
  };

  addCartoucheLine(cx, cy, cx + cw, cy);
  addCartoucheLine(cx + cw, cy, cx + cw, cy + ch);
  addCartoucheLine(cx + cw, cy + ch, cx, cy + ch);
  addCartoucheLine(cx, cy + ch, cx, cy);

  add(0, "TEXT"); add(8, "CARTOUCHE_ADEBEO"); add(10, (cx + 3).toFixed(3)); add(20, (cy + 18).toFixed(3)); add(30, 0); add(40, 2.0);
  add(1, `PROJET : ${projectName} • STANDARD ADEBEO / SKETCHUP`);

  add(0, "TEXT"); add(8, "CARTOUCHE_ADEBEO"); add(10, (cx + 3).toFixed(3)); add(20, (cy + 12).toFixed(3)); add(30, 0); add(40, 1.4);
  add(1, `MAITRE D'OUVRAGE : ${clientName} | LIEU : ${locality}`);

  add(0, "TEXT"); add(8, "CARTOUCHE_ADEBEO"); add(10, (cx + 3).toFixed(3)); add(20, (cy + 6).toFixed(3)); add(30, 0); add(40, 1.2);
  add(1, `CRS : ${crs} | DATE : ${new Date().toLocaleDateString("fr-FR")} | FORMAT : DXF R12`);

  add(0, "ENDSEC");
  add(0, "EOF");

  return lines.join("\n");
}

export function downloadSketchupDxf(elements: FarmElement3D[], options: SketchupDxfOptions = {}): void {
  const dxfContent = generateSketchupDxf(elements, options);
  const filename = `Plan_CAO_Adebeo_${(options.projectName || "Projet").replace(/\s+/g, "_")}_${Date.now()}.dxf`;

  const blob = new Blob([dxfContent], { type: "application/dxf;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
