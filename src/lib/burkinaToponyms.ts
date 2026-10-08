/**
 * NAFA-AGRITECH — Base de Données Toponymique & Noms des Lieux du Burkina Faso
 * Référentiel des chefs-lieux, communes rurales, périmètres hydro-agricoles,
 * plaines aménagées, barrages et stations de recherche de l'INERA.
 * Utilisé pour marquer visiblement les lieux sur les cartes Leaflet et faciliter l'arpentage GPS.
 */

export interface BurkinaToponym {
  id: string;
  name: string;
  category: "ville" | "pole_agricole" | "barrage_irrigation" | "station_recherche" | "commune_rurale";
  lat: number;
  lng: number;
  region: string;
  province: string;
  description?: string;
  zoomLevel?: number;
}

export const BURKINA_TOPONYMS: BurkinaToponym[] = [
  // ─── PÔLES HYDRO-AGRICOLES & PLAINES AMÉNAGÉES ───
  {
    id: "bama",
    name: "Bama (Vallée du Kou)",
    category: "pole_agricole",
    lat: 11.3912,
    lng: -4.4121,
    region: "Hauts-Bassins",
    province: "Houet",
    description: "Plaine rizicole aménagée et grand bassin maraîcher (oignon, tomate)",
    zoomLevel: 14,
  },
  {
    id: "bagre",
    name: "Bagré (Bagré Pôle)",
    category: "pole_agricole",
    lat: 11.5125,
    lng: -0.5639,
    region: "Centre-Est",
    province: "Boulgou",
    description: "Pôle de croissance agro-industriel majeur, riziculture irriguée et pisciculture",
    zoomLevel: 14,
  },
  {
    id: "sourou_di",
    name: "Sourou (Plaine de Di)",
    category: "pole_agricole",
    lat: 13.0658,
    lng: -3.0725,
    region: "Boucle du Mouhoun",
    province: "Sourou",
    description: "Grande vallée irriguée du Sourou, blé, maïs et haricot vert",
    zoomLevel: 14,
  },
  {
    id: "samendeni",
    name: "Samendeni (Barrage PDI-GBS)",
    category: "barrage_irrigation",
    lat: 11.4589,
    lng: -4.4981,
    region: "Hauts-Bassins",
    province: "Houet",
    description: "Grand barrage hydro-agricole de 1 milliard de m³, périmètre agro-pastoral",
    zoomLevel: 14,
  },
  {
    id: "banzon",
    name: "Banzon (Plaine Rizicole)",
    category: "pole_agricole",
    lat: 11.3197,
    lng: -4.8114,
    region: "Cascades",
    province: "Kénédougou",
    description: "Périmètre rizicole aménagé par submersion contrôlée",
    zoomLevel: 14,
  },
  {
    id: "karfiguela",
    name: "Karfiguéla (Cascades & Périmètre)",
    category: "pole_agricole",
    lat: 10.6789,
    lng: -4.8214,
    region: "Cascades",
    province: "Comoé",
    description: "Canal d'irrigation gravitaire, canne à sucre et arboriculture",
    zoomLevel: 14,
  },
  {
    id: "douna",
    name: "Douna (Plaine Irriguée)",
    category: "pole_agricole",
    lat: 10.6278,
    lng: -5.0864,
    region: "Cascades",
    province: "Léraba",
    description: "Périmètre irrigué maraîcher et rizicole",
    zoomLevel: 14,
  },
  {
    id: "loumbila",
    name: "Loumbila (Barrage Maraîcher)",
    category: "barrage_irrigation",
    lat: 12.5186,
    lng: -1.4019,
    region: "Plateau-Central",
    province: "Oubritenga",
    description: "Ceinture maraîchère de la capitale, production intensive d'oignon et tomate",
    zoomLevel: 14,
  },
  {
    id: "koubri",
    name: "Koubri (Zone des Barrages)",
    category: "barrage_irrigation",
    lat: 12.1864,
    lng: -1.3986,
    region: "Centre",
    province: "Kadiogo",
    description: "Réseau de 20+ retenues maraîchères, aviculture et arboriculture fruitière",
    zoomLevel: 14,
  },
  {
    id: "mogtedo",
    name: "Mogtédo (Barrage & Maraîchage)",
    category: "barrage_irrigation",
    lat: 12.2853,
    lng: -0.8353,
    region: "Plateau-Central",
    province: "Ganzourgou",
    description: "Bassin maraîcher d'oignon et de piment",
    zoomLevel: 14,
  },
  {
    id: "kompienga",
    name: "Kompienga (Barrage)",
    category: "barrage_irrigation",
    lat: 11.0819,
    lng: 0.7167,
    region: "Est",
    province: "Kompienga",
    description: "Grand lac de retenue hydroélectrique et périmètres agro-pastoraux",
    zoomLevel: 13,
  },
  {
    id: "korsimoro",
    name: "Korsimoro (Bas-fonds Maraîchers)",
    category: "commune_rurale",
    lat: 12.8167,
    lng: -1.0667,
    region: "Centre-Nord",
    province: "Sanmatenga",
    description: "Capitale maraîchère de l'oignon et des bas-fonds sahéliens",
    zoomLevel: 14,
  },

  // ─── STATIONS DE RECHERCHE INERA ───
  {
    id: "kamboise_inera",
    name: "Kamboinsé (Station INERA)",
    category: "station_recherche",
    lat: 12.4553,
    lng: -1.5583,
    region: "Centre",
    province: "Kadiogo",
    description: "Centre National de Recherches Agricoles et semences certifiées",
    zoomLevel: 15,
  },
  {
    id: "farako_ba_inera",
    name: "Farako-Bâ (Station INERA)",
    category: "station_recherche",
    lat: 11.0942,
    lng: -4.3314,
    region: "Hauts-Bassins",
    province: "Houet",
    description: "Station expérimentale agronomique et zootechnique de référence Ouest",
    zoomLevel: 15,
  },
  {
    id: "saria_inera",
    name: "Saria (Station INERA)",
    category: "station_recherche",
    lat: 12.2689,
    lng: -2.1558,
    region: "Centre-Ouest",
    province: "Boulkiemdé",
    description: "Station historique de recherche sur la fertilité des sols tropicaux",
    zoomLevel: 15,
  },

  // ─── CHEFS-LIEUX RÉGIONAUX ET PRINCIPALES VILLES AGRICOLES ───
  {
    id: "ouagadougou",
    name: "Ouagadougou",
    category: "ville",
    lat: 12.3714,
    lng: -1.5197,
    region: "Centre",
    province: "Kadiogo",
    description: "Capitale et pôle de consommation, ceintures maraîchères périurbaines",
    zoomLevel: 12,
  },
  {
    id: "bobo_dioulasso",
    name: "Bobo-Dioulasso",
    category: "ville",
    lat: 11.1772,
    lng: -4.2979,
    region: "Hauts-Bassins",
    province: "Houet",
    description: "Capitale économique et carrefour agro-industriel de l'Ouest",
    zoomLevel: 13,
  },
  {
    id: "koudougou",
    name: "Koudougou",
    category: "ville",
    lat: 12.2536,
    lng: -2.3619,
    region: "Centre-Ouest",
    province: "Boulkiemdé",
    description: "Pôle coton, maraîchage de bas-fonds et élevage de ruminants",
    zoomLevel: 13,
  },
  {
    id: "ouahigouya",
    name: "Ouahigouya",
    category: "ville",
    lat: 13.5828,
    lng: -2.4217,
    region: "Nord",
    province: "Yatenga",
    description: "Zone sahélienne, techniques Zaï, demi-lunes et maraîchage de retenues",
    zoomLevel: 13,
  },
  {
    id: "banfora",
    name: "Banfora",
    category: "ville",
    lat: 10.6333,
    lng: -4.7667,
    region: "Cascades",
    province: "Comoé",
    description: "Zone agro-écologique humide, canne à sucre, mangue, anacarde et riz",
    zoomLevel: 13,
  },
  {
    id: "dedougou",
    name: "Dédougou",
    category: "ville",
    lat: 12.4633,
    lng: -3.4606,
    region: "Boucle du Mouhoun",
    province: "Mouhoun",
    description: "Grenier céréalier du Faso, maïs, sorgho et coton",
    zoomLevel: 13,
  },
  {
    id: "kaya",
    name: "Kaya",
    category: "ville",
    lat: 13.0917,
    lng: -1.0844,
    region: "Centre-Nord",
    province: "Sanmatenga",
    description: "Pôle agropastoral sahélien, embouche bovine et ovine, niébé",
    zoomLevel: 13,
  },
  {
    id: "fada_ngourma",
    name: "Fada N'Gourma",
    category: "ville",
    lat: 12.0617,
    lng: 0.3542,
    region: "Est",
    province: "Gourma",
    description: "Grand carrefour pastoral et céréalier de l'Est sahélien",
    zoomLevel: 13,
  },
  {
    id: "dori",
    name: "Dori",
    category: "ville",
    lat: 14.0353,
    lng: -0.0344,
    region: "Sahel",
    province: "Séno",
    description: "Grand bassin d'élevage sahélien transhumant et pastoralisme",
    zoomLevel: 13,
  },
  {
    id: "tenkodogo",
    name: "Tenkodogo",
    category: "ville",
    lat: 11.7800,
    lng: -0.3697,
    region: "Centre-Est",
    province: "Boulgou",
    description: "Pôle d'arboriculture et maraîchage à proximité de Bagré",
    zoomLevel: 13,
  },
  {
    id: "manga",
    name: "Manga",
    category: "ville",
    lat: 11.6636,
    lng: -1.0731,
    region: "Centre-Sud",
    province: "Zoundwéogo",
    description: "Pôle agro-pastoral, maraîchage et aviculture",
    zoomLevel: 13,
  },
  {
    id: "gaoua",
    name: "Gaoua",
    category: "ville",
    lat: 10.3297,
    lng: -3.1764,
    region: "Sud-Ouest",
    province: "Poni",
    description: "Zone forestière et vergers d'anacardier, igname et maïs",
    zoomLevel: 13,
  },
  {
    id: "ziniare",
    name: "Ziniaré",
    category: "ville",
    lat: 12.5819,
    lng: -1.2972,
    region: "Plateau-Central",
    province: "Oubritenga",
    description: "Périmètre maraîcher et fermes intégrées agro-écologiques",
    zoomLevel: 13,
  },
  {
    id: "hounde",
    name: "Houndé",
    category: "ville",
    lat: 11.5000,
    lng: -3.5167,
    region: "Hauts-Bassins",
    province: "Tuy",
    description: "Bassin cotonnier et céréalier à forte mécanisation agricole",
    zoomLevel: 13,
  },
  {
    id: "orodara",
    name: "Orodara",
    category: "ville",
    lat: 10.9819,
    lng: -4.9339,
    region: "Hauts-Bassins",
    province: "Kénédougou",
    description: "Verger du Burkina Faso : mangue, agrumes, avocatier et anacardier",
    zoomLevel: 14,
  },
  {
    id: "titao",
    name: "Titao",
    category: "commune_rurale",
    lat: 13.7667,
    lng: -2.0667,
    region: "Nord",
    province: "Loroum",
    description: "Périmètre de bas-fonds et maraîchage de pomme de terre",
    zoomLevel: 13,
  },
  {
    id: "yako",
    name: "Yako",
    category: "ville",
    lat: 12.9592,
    lng: -2.2608,
    region: "Nord",
    province: "Passoré",
    description: "Maraîchage de contre-saison, haricot et sésame",
    zoomLevel: 13,
  },
  {
    id: "koupela",
    name: "Koupéla",
    category: "ville",
    lat: 12.1786,
    lng: -0.3542,
    region: "Centre-Est",
    province: "Kouritenga",
    description: "Carrefour commercial et productions maraîchères de barrages",
    zoomLevel: 13,
  },
  {
    id: "po",
    name: "Pô",
    category: "ville",
    lat: 11.1697,
    lng: -1.1450,
    region: "Centre-Sud",
    province: "Nahouri",
    description: "Zone soudanienne humide, arboriculture, sésame et maïs",
    zoomLevel: 13,
  },
  {
    id: "leo",
    name: "Léo",
    category: "ville",
    lat: 11.1000,
    lng: -2.1000,
    region: "Centre-Ouest",
    province: "Sissili",
    description: "Bassin majeur de production d'anacarde, coton et maïs",
    zoomLevel: 13,
  },
  {
    id: "sapouy",
    name: "Sapouy",
    category: "commune_rurale",
    lat: 11.5544,
    lng: -1.7736,
    region: "Centre-Ouest",
    province: "Ziro",
    description: "Exploitations agro-forestières et vergers d'anacardier",
    zoomLevel: 13,
  },
  {
    id: "tougan",
    name: "Tougan",
    category: "ville",
    lat: 13.0725,
    lng: -3.0694,
    region: "Boucle du Mouhoun",
    province: "Sourou",
    description: "Grand centre de production céréalière et rizicole du Sourou",
    zoomLevel: 13,
  },
  {
    id: "nouna",
    name: "Nouna",
    category: "ville",
    lat: 12.7333,
    lng: -3.8667,
    region: "Boucle du Mouhoun",
    province: "Kossi",
    description: "Pôle agricole céréalier et sésame",
    zoomLevel: 13,
  },
  {
    id: "toussiana",
    name: "Toussiana",
    category: "commune_rurale",
    lat: 10.8333,
    lng: -4.6167,
    region: "Hauts-Bassins",
    province: "Houet",
    description: "Vergers arboricoles et bananeraies irriguées",
    zoomLevel: 14,
  },
  {
    id: "sindou",
    name: "Sindou",
    category: "commune_rurale",
    lat: 10.6586,
    lng: -5.1667,
    region: "Cascades",
    province: "Léraba",
    description: "Maraîchage de bas-fond et cultures fruitières",
    zoomLevel: 14,
  },
  {
    id: "tiekoum",
    name: "Tiébélé",
    category: "commune_rurale",
    lat: 11.0964,
    lng: -0.9639,
    region: "Centre-Sud",
    province: "Nahouri",
    description: "Agro-pastoralisme, élevage bovin et volailles locales",
    zoomLevel: 13,
  },
  {
    id: "boromo",
    name: "Boromo",
    category: "ville",
    lat: 11.7500,
    lng: -2.9333,
    region: "Boucle du Mouhoun",
    province: "Balé",
    description: "Zone cotonnière et maraîchage le long du fleuve Mouhoun (Black Volta)",
    zoomLevel: 13,
  },
  {
    id: "zorgho",
    name: "Zorgho",
    category: "ville",
    lat: 12.2486,
    lng: -0.6158,
    region: "Plateau-Central",
    province: "Ganzourgou",
    description: "Bassin de petits barrages maraîchers et d'élevage",
    zoomLevel: 13,
  },
];

/**
 * Recherche textuelle parmi les toponymes du Burkina Faso
 */
export function searchBurkinaToponyms(query: string): BurkinaToponym[] {
  if (!query || query.trim().length === 0) return BURKINA_TOPONYMS.slice(0, 10);
  const q = query.toLowerCase().trim();
  return BURKINA_TOPONYMS.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.region.toLowerCase().includes(q) ||
      t.province.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
  );
}

/**
 * Trouve le toponyme le plus proche d'un point GPS donné (avec distance en km)
 */
export function findNearestToponym(
  lat: number,
  lng: number
): { toponym: BurkinaToponym; distanceKm: number } | null {
  if (BURKINA_TOPONYMS.length === 0) return null;

  let nearest = BURKINA_TOPONYMS[0];
  let minDistanceKm = Infinity;

  BURKINA_TOPONYMS.forEach((t) => {
    // Calcul de distance euclidienne / Haversine rapide
    const dLat = ((t.lat - lat) * Math.PI) / 180;
    const dLng = ((t.lng - lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat * Math.PI) / 180) *
        Math.cos((t.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distKm = 6371 * c;

    if (distKm < minDistanceKm) {
      minDistanceKm = distKm;
      nearest = t;
    }
  });

  return {
    toponym: nearest,
    distanceKm: Math.round(minDistanceKm * 10) / 10,
  };
}
