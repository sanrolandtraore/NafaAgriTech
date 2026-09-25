/**
 * NAFA-AGRITECH : Moteur d'Exportation Vectorielle & SIG de Haute Précision
 * Inspiré d'AutoCAD (DXF R12/2000), QGIS (GeoJSON WGS84/UTM) et Netafim (BOM Hydraulique)
 */

export interface CadExportPoint {
  x: number; // en mètres
  y: number; // en mètres
  z?: number; // altitude en mètres
  lat?: number;
  lng?: number;
  label?: string;
}

export interface CadExportPipe {
  id: string;
  from: CadExportPoint;
  to: CadExportPoint;
  diameterMm: number;
  nominalPressure: string; // PN6, PN10, PN16
  material: "PEHD" | "PVC" | "GOUTTE_A_GOUTTE";
  type: "principale" | "secondaire" | "rampe" | "aspiration";
  flowM3h?: number;
  velocityMs?: number;
  headLossM?: number;
  netafimRef?: string;
}

export interface CadExportEquipment {
  id: string;
  x: number;
  y: number;
  z: number;
  name: string;
  category: "forage" | "pompe_solaire" | "chateau_eau" | "station_filtration" | "fertigation" | "vanne_secteur" | "serre";
  netafimRef?: string;
  widthM?: number;
  lengthM?: number;
  heightM?: number;
}

export interface CadProjectExportData {
  projectName: string;
  clientName: string;
  clientPhone: string;
  location: string;
  expertName: string;
  date: string;
  scaleStr: string; // ex: "1:1000"
  crs: string; // ex: "EPSG:32630 (UTM Zone 30N WGS84)"
  areaHa: number;
  perimeterM: number;
  boundary: CadExportPoint[];
  contourLines?: { elevation: number; points: CadExportPoint[] }[];
  pipes: CadExportPipe[];
  equipments: CadExportEquipment[];
}

/**
 * 1. GÉNÉRATEUR DXF AUTOCAD (Standard ASCII Release 12 / 2000)
 * Compatible Autodesk AutoCAD, Civil 3D, LibreCAD, QGIS, DraftSight
 */
export function generateAutoCadDxf(data: CadProjectExportData): string {
  const lines: string[] = [];

  const add = (code: number, value: string | number) => {
    lines.push(code.toString());
    lines.push(value.toString());
  };

  // ── HEADER SECTION ──
  add(0, "SECTION");
  add(2, "HEADER");
  add(9, "$ACADVER");
  add(1, "AC1009"); // AutoCAD R12 standard (universellement compatible)
  add(9, "$INSUNITS");
  add(70, 6); // 6 = Mètres
  add(9, "$MEASUREMENT");
  add(70, 1); // 1 = Métrique (ISO)
  add(0, "ENDSEC");

  // ── TABLES SECTION (CALQUES AUTOCAD / LAYERS) ──
  add(0, "SECTION");
  add(2, "TABLES");
  add(0, "TABLE");
  add(2, "LAYER");
  add(70, 8); // Nombre de calques

  const defineLayer = (name: string, color: number) => {
    add(0, "LAYER");
    add(2, name);
    add(70, 0);
    add(62, color); // Code couleur AutoCAD ACI
    add(6, "CONTINUOUS");
  };

  defineLayer("0", 7); // Blanc
  defineLayer("CADASTRE_LIMITES", 2); // 2 = Jaune
  defineLayer("MNT_TOPOGRAPHIE", 30); // 30 = Orange terre
  defineLayer("NETAFIM_ADDUCTION_PEHD", 4); // 4 = Cyan
  defineLayer("NETAFIM_DISTRIBUTION", 140); // 140 = Bleu clair
  defineLayer("NETAFIM_DRIP_RAMPES", 3); // 3 = Vert
  defineLayer("OUVRAGES_EQUIPEMENTS", 1); // 1 = Rouge
  defineLayer("COTATIONS_DIMENSIONS", 5); // 5 = Bleu royal
  defineLayer("CARTOUCHE_ISO", 7); // 7 = Blanc/Noir

  add(0, "ENDTAB");
  add(0, "ENDSEC");

  // ── ENTITIES SECTION (OBJETS GÉOMÉTRIQUES) ──
  add(0, "SECTION");
  add(2, "ENTITIES");

  // A. Limites Parcellaires (Polygone Cadastre)
  if (data.boundary.length >= 3) {
    for (let i = 0; i < data.boundary.length; i++) {
      const p1 = data.boundary[i];
      const p2 = data.boundary[(i + 1) % data.boundary.length];
      add(0, "LINE");
      add(8, "CADASTRE_LIMITES");
      add(10, p1.x.toFixed(3));
      add(20, p1.y.toFixed(3));
      add(30, (p1.z || 0).toFixed(3));
      add(11, p2.x.toFixed(3));
      add(21, p2.y.toFixed(3));
      add(31, (p2.z || 0).toFixed(3));

      // Bornes d'angle (cercles et textes)
      add(0, "CIRCLE");
      add(8, "CADASTRE_LIMITES");
      add(10, p1.x.toFixed(3));
      add(20, p1.y.toFixed(3));
      add(30, (p1.z || 0).toFixed(3));
      add(40, 0.8); // Rayon de borne 80cm

      add(0, "TEXT");
      add(8, "CADASTRE_LIMITES");
      add(10, (p1.x + 1.2).toFixed(3));
      add(20, (p1.y + 1.2).toFixed(3));
      add(30, (p1.z || 0).toFixed(3));
      add(40, 1.2); // Hauteur texte
      add(1, p1.label || `Borne B${i + 1} (${p1.z ? p1.z.toFixed(1) + "m" : ""})`);
    }
  }

  // B. Courbes de niveau topographiques MNT (si fournies)
  if (data.contourLines) {
    for (const contour of data.contourLines) {
      for (let i = 0; i < contour.points.length - 1; i++) {
        const pt1 = contour.points[i];
        const pt2 = contour.points[i + 1];
        add(0, "LINE");
        add(8, "MNT_TOPOGRAPHIE");
        add(10, pt1.x.toFixed(3));
        add(20, pt1.y.toFixed(3));
        add(30, contour.elevation.toFixed(3));
        add(11, pt2.x.toFixed(3));
        add(21, pt2.y.toFixed(3));
        add(31, contour.elevation.toFixed(3));
      }
    }
  }

  // C. Canalisations Hydrauliques Netafim
  for (const pipe of data.pipes) {
    const layer =
      pipe.type === "principale"
        ? "NETAFIM_ADDUCTION_PEHD"
        : pipe.type === "secondaire"
        ? "NETAFIM_DISTRIBUTION"
        : "NETAFIM_DRIP_RAMPES";

    add(0, "LINE");
    add(8, layer);
    add(10, pipe.from.x.toFixed(3));
    add(20, pipe.from.y.toFixed(3));
    add(30, (pipe.from.z || 0).toFixed(3));
    add(11, pipe.to.x.toFixed(3));
    add(21, pipe.to.y.toFixed(3));
    add(31, (pipe.to.z || 0).toFixed(3));

    // Annotation technique du tuyau (Diamètre et PN)
    const midX = (pipe.from.x + pipe.to.x) / 2;
    const midY = (pipe.from.y + pipe.to.y) / 2;
    add(0, "TEXT");
    add(8, "COTATIONS_DIMENSIONS");
    add(10, midX.toFixed(3));
    add(20, midY.toFixed(3));
    add(30, 0);
    add(40, 0.9);
    add(1, `${pipe.material} O${pipe.diameterMm} ${pipe.nominalPressure}`);
  }

  // D. Équipements et Ouvrages d'Ingénierie
  for (const eq of data.equipments) {
    add(0, "CIRCLE");
    add(8, "OUVRAGES_EQUIPEMENTS");
    add(10, eq.x.toFixed(3));
    add(20, eq.y.toFixed(3));
    add(30, eq.z.toFixed(3));
    add(40, 2.5); // Rayon d'emprise

    add(0, "TEXT");
    add(8, "OUVRAGES_EQUIPEMENTS");
    add(10, (eq.x + 3.0).toFixed(3));
    add(20, (eq.y + 1.0).toFixed(3));
    add(30, eq.z.toFixed(3));
    add(40, 1.5);
    add(1, `[${eq.category.toUpperCase()}] ${eq.name} ${eq.netafimRef ? "(" + eq.netafimRef + ")" : ""}`);
  }

  // E. Cartouche Technique Normalisé ISO (Dessiné en coordonnées réelles)
  const cartX = 0;
  const cartY = -35;
  const cartW = 120;
  const cartH = 28;

  // Cadre du cartouche
  add(0, "LINE"); add(8, "CARTOUCHE_ISO"); add(10, cartX); add(20, cartY); add(11, cartX + cartW); add(21, cartY);
  add(0, "LINE"); add(8, "CARTOUCHE_ISO"); add(10, cartX + cartW); add(20, cartY); add(11, cartX + cartW); add(21, cartY + cartH);
  add(0, "LINE"); add(8, "CARTOUCHE_ISO"); add(10, cartX + cartW); add(20, cartY + cartH); add(11, cartX); add(21, cartY + cartH);
  add(0, "LINE"); add(8, "CARTOUCHE_ISO"); add(10, cartX); add(20, cartY + cartH); add(11, cartX); add(21, cartY);

  add(0, "TEXT"); add(8, "CARTOUCHE_ISO"); add(10, cartX + 3); add(20, cartY + 22); add(40, 2.2); add(1, `PROJET : ${data.projectName.toUpperCase()}`);
  add(0, "TEXT"); add(8, "CARTOUCHE_ISO"); add(10, cartX + 3); add(20, cartY + 16); add(40, 1.6); add(1, `CLIENT : ${data.clientName} | TEL : ${data.clientPhone}`);
  add(0, "TEXT"); add(8, "CARTOUCHE_ISO"); add(10, cartX + 3); add(20, cartY + 10); add(40, 1.4); add(1, `LOCALISATION : ${data.location}`);
  add(0, "TEXT"); add(8, "CARTOUCHE_ISO"); add(10, cartX + 3); add(20, cartY + 4); add(40, 1.4); add(1, `ECHELLE : ${data.scaleStr} | DATE : ${data.date} | CRS : ${data.crs}`);

  add(0, "ENDSEC");
  add(0, "EOF");

  return lines.join("\n");
}

/**
 * 2. GÉNÉRATEUR GEOJSON GÉORÉFÉRENCÉ QGIS (RFC 7946)
 * Ouvre directement dans QGIS / ArcGIS avec tables d'attributs complètes
 */
export function generateQgisGeoJson(data: CadProjectExportData): string {
  const features: any[] = [];

  // A. Polygone Parcelle Cadastrée
  if (data.boundary.length >= 3) {
    const coords = data.boundary.map((pt) => [pt.lng || pt.x / 100000, pt.lat || pt.y / 100000]);
    // Fermer le polygone
    coords.push(coords[0]);

    features.push({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [coords],
      },
      properties: {
        layer: "Cadastre_Parcelle",
        nom: data.projectName,
        superficie_ha: data.areaHa,
        perimetre_m: data.perimeterM,
        client: data.clientName,
        commune: data.location,
        type: "Périmètre Exploitation",
      },
    });
  }

  // B. Bornes géodésiques
  data.boundary.forEach((pt, idx) => {
    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [pt.lng || pt.x / 100000, pt.lat || pt.y / 100000, pt.z || 0],
      },
      properties: {
        layer: "Bornes_Geodesiques",
        borne_id: `B${idx + 1}`,
        nom: pt.label || `Borne B${idx + 1}`,
        altitude_ngf_m: pt.z || 300,
        x_utm_m: pt.x,
        y_utm_m: pt.y,
      },
    });
  });

  // C. Réseau Hydraulique Netafim (Canalisations LineString)
  for (const pipe of data.pipes) {
    features.push({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [pipe.from.lng || pipe.from.x / 100000, pipe.from.lat || pipe.from.y / 100000],
          [pipe.to.lng || pipe.to.x / 100000, pipe.to.lat || pipe.to.y / 100000],
        ],
      },
      properties: {
        layer: "Reseau_Netafim_Canalisations",
        id_troncon: pipe.id,
        materiau: pipe.material,
        diametre_nominal_mm: pipe.diameterMm,
        pression_nominale: pipe.nominalPressure,
        type_reseau: pipe.type,
        debit_m3h: pipe.flowM3h || 6.5,
        vitesse_ms: pipe.velocityMs || 1.35,
        perte_charge_m: pipe.headLossM || 1.2,
        reference_netafim: pipe.netafimRef || "NETAFIM-PIPE-HDPE-PE100",
      },
    });
  }

  // D. Équipements & Station de Tête (Points)
  for (const eq of data.equipments) {
    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [eq.x / 100000, eq.y / 100000, eq.z],
      },
      properties: {
        layer: "Equipements_Ouvrages",
        id_equipement: eq.id,
        nom: eq.name,
        categorie: eq.category,
        reference_netafim: eq.netafimRef || "NETAFIM-EQUIP-STD",
        altitude_m: eq.z,
      },
    });
  }

  const geoJson = {
    type: "FeatureCollection",
    name: `NAFA_AGRITECH_${data.projectName.replace(/\s+/g, "_")}`,
    crs: {
      type: "name",
      properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" },
    },
    features,
  };

  return JSON.stringify(geoJson, null, 2);
}

/**
 * 3. NOMENCLATURE TECHNIQUE NETAFIM (BOM - Bill of Materials) AU FORMAT CSV
 */
export function generateNetafimBomCsv(data: CadProjectExportData): string {
  const rows: string[] = [
    "Référence Netafim;Désignation Matériel;Catégorie;Diamètre/Spécification;Quantité;Unité;Prix Unit. (FCFA);Prix Total (FCFA);Fournisseur Agréé",
  ];

  // Regroupement des tuyaux par diamètre
  const pipeGroups: Record<string, { len: number; mat: string; pn: string; ref: string }> = {};
  for (const pipe of data.pipes) {
    const dx = pipe.to.x - pipe.from.x;
    const dy = pipe.to.y - pipe.from.y;
    const lengthM = Math.sqrt(dx * dx + dy * dy);
    const key = `${pipe.material}-${pipe.diameterMm}-${pipe.nominalPressure}`;

    if (!pipeGroups[key]) {
      pipeGroups[key] = {
        len: 0,
        mat: pipe.material,
        pn: pipe.nominalPressure,
        ref: pipe.netafimRef || `NETAFIM-${pipe.material}-DN${pipe.diameterMm}`,
      };
    }
    pipeGroups[key].len += lengthM;
  }

  // Tarifs indicatifs mercuriale Burkina Faso Netafim
  const getUnitPrice = (key: string): number => {
    if (key.includes("90")) return 3200;
    if (key.includes("75")) return 2600;
    if (key.includes("63")) return 1950;
    if (key.includes("50")) return 1450;
    if (key.includes("40")) return 1100;
    if (key.includes("32")) return 850;
    if (key.includes("GOUTTE")) return 180;
    return 1200;
  };

  Object.entries(pipeGroups).forEach(([key, group]) => {
    const roundedM = Math.ceil(group.len);
    const unitPrice = getUnitPrice(key);
    const total = roundedM * unitPrice;
    rows.push(
      `${group.ref};Tuyauterie pression ${group.mat} ${group.pn};Canalisation;DN${key.split("-")[1]} mm;${roundedM};mètres;${unitPrice};${total};SODIMEX / AGRODIA`
    );
  });

  // Équipements de tête Netafim
  const equipmentSpecs: Record<string, { desc: string; price: number; ref: string }> = {
    station_filtration: {
      desc: "Batterie filtration à disques manuelle SpinKlin 120 mesh / 130 microns",
      price: 485000,
      ref: "NETAFIM-SPINKLIN-2D",
    },
    fertigation: {
      desc: "Kit injecteur Venturi de fertilisation proportionnelle 3/4\" avec débitmètre",
      price: 135000,
      ref: "NETAFIM-VENTURI-KIT-75",
    },
    pompe_solaire: {
      desc: "Pompe immergée solaire à rotor hélicoïdal avec onduleur MPPT intégré",
      price: 1850000,
      ref: "LORENTZ-PS2-1800",
    },
    chateau_eau: {
      desc: "Réservoir polyéthylène armé 10 000L sur tour métallique H=6.0m",
      price: 2450000,
      ref: "NAFA-TOWER-10M3-H6",
    },
    vanne_secteur: {
      desc: "Vanne papillon / vanne à boule PVC pression Ø50 PN10 avec manomètre",
      price: 32000,
      ref: "NETAFIM-BALL-VALVE-50",
    },
    serre: {
      desc: "Serre tunnel maraîchère tropicalisée 8x30m (240 m²) avec filet anti-insectes",
      price: 1950000,
      ref: "NAFA-GREENHOUSE-TUNNEL-240",
    },
    forage: {
      desc: "Équipement de tête de forage, tubage PVC plein/crépiné et margelle béton",
      price: 350000,
      ref: "FORAGE-WELLHEAD-BOREHOLE",
    },
  };

  data.equipments.forEach((eq) => {
    const spec = equipmentSpecs[eq.category] || {
      desc: eq.name,
      price: 50000,
      ref: eq.netafimRef || "NETAFIM-CUSTOM-PART",
    };
    rows.push(
      `${spec.ref};${spec.desc};Ouvrage d'ingénierie;${eq.category.toUpperCase()};1;unité;${spec.price};${spec.price};FASO SOLAIRE / SODIMEX`
    );
  });

  return "\uFEFF" + rows.join("\n");
}
