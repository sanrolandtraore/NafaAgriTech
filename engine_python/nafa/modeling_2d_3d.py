"""
NAFA AGRITECH — Moteur de Modélisation CAO 2D & 3D Ultra Professionnel
Conception géométrique de précision, composants et accessoires d'ingénierie rurale sahélienne :
- Bâtiments bioclimatiques normés (fondations, poteaux BA, murets, claustras, fermes, tôles)
- Châteaux d'eau métalliques & réservoirs cylindriques (cuve, échelle crinoline, dalle)
- Systèmes de pompage solaire (panneaux photovoltaïques tiltés 12-15°, onduleurs, plots béton)
- Ouvrages d'irrigation & hydraulique (tête de réseau, filtres à disques/sable, venturi, vannes, regards)
- Accessoires zootechniques (abreuvoirs siphoïdes/automatiques, mangeoires linéaires, perchoirs)
- Ouvrages CES/DRS (cordons pierreux en courbe de niveau, diguettes filtrantes, bassins de rétention)
- Exportations industrielles standard : Wavefront OBJ avec matériaux MTL, SVG coté industriel, GeoJSON SIG et DXF (format standard AutoCAD/QGIS).
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Tuple, Any
import json
import math
import numpy as np
from shapely.geometry import Polygon, Point, LineString, MultiPolygon, mapping
from shapely.ops import unary_union

try:
    import geopandas as gpd
    GEOPANDAS_AVAILABLE = True
except ImportError:
    GEOPANDAS_AVAILABLE = False


class StructureType(str, Enum):
    BIOCLIMATIC_POULTRY_HOUSE = "poulailler_bioclimatique" # Poulailler sahélien Est-Ouest
    LIVESTOCK_SHED = "hangar_elevage"                      # Étable / Bergerie semi-ouverte
    STORAGE_WAREHOUSE = "magasin_stockage"                 # Stockage céréales et intrants
    GREENHOUSE = "serre_tunnel"                            # Serre maraîchère
    IRRIGATION_PLOT = "parcelle_irriguee"                  # Bloc de goutte-à-goutte
    WATER_TOWER = "chateau_eau_metallique"                 # Château d'eau sur trépied métallique
    SOLAR_PUMP_STATION = "station_pompage_solaire"         # Centrale solaire de pompage
    HEAD_FILTER_STATION = "station_filtration_tete"        # Tête de contrôle irrigation (filtres/venturi)
    WATER_RESERVOIR_BASIN = "bassin_retention_ces"         # Bassin d'accumulation d'eau / CES


class AccessoryCategory(str, Enum):
    HYDRAULIC = "hydraulique"       # Vannes, compteurs, filtres, venturi
    SOLAR_ENERGY = "energie_solaire"# Panneaux PV, onduleurs, structures tiltées
    STORAGE = "stockage_eau"        # Châteaux d'eau, citernes, bâches
    ZOOTECHNICAL = "zootechnie"     # Abreuvoirs, mangeoires, claies, perchoirs
    CIVIL_ENGINEERING = "genie_civil"# Regards béton, clôtures grillagées, cordons pierreux
    IRRIGATION = "irrigation"       # Portes-rampes, goutteurs, asperseurs


@dataclass
class Point3D:
    x: float
    y: float
    z: float

    def to_tuple(self) -> Tuple[float, float, float]:
        return (self.x, self.y, self.z)

    def translated(self, dx: float, dy: float, dz: float) -> "Point3D":
        return Point3D(self.x + dx, self.y + dy, self.z + dz)

    def rotated_z(self, angle_rad: float, origin: Tuple[float, float] = (0.0, 0.0)) -> "Point3D":
        ox, oy = origin
        px, py = self.x - ox, self.y - oy
        rx = px * math.cos(angle_rad) - py * math.sin(angle_rad)
        ry = px * math.sin(angle_rad) + py * math.cos(angle_rad)
        return Point3D(rx + ox, ry + oy, self.z)


@dataclass
class Mesh3D:
    vertices: List[Point3D]
    faces: List[List[int]]           # Indices 1-based pour conformité Wavefront OBJ
    normals: List[Point3D] = field(default_factory=list)
    material_name: Optional[str] = None

    def to_obj_string(self, object_name: str = "NafaAgriStructure") -> str:
        """Génère la représentation Wavefront OBJ standard pour Blender, AutoCAD, SketchUp."""
        lines = [
            f"# NAFA AGRITECH — Modélisation CAO 3D Professionnelle",
            f"# Objet: {object_name}",
            f"o {object_name}"
        ]
        if self.material_name:
            lines.append(f"usemtl {self.material_name}")

        # Sommets
        for v in self.vertices:
            lines.append(f"v {v.x:.4f} {v.y:.4f} {v.z:.4f}")
        # Faces
        for f in self.faces:
            indices_str = " ".join(str(idx) for idx in f)
            lines.append(f"f {indices_str}")
        return "\n".join(lines)


@dataclass
class Building3DSpecs:
    structure_type: StructureType
    length_m: float                        # Longueur (axe Est-Ouest préconisé)
    width_m: float                         # Largeur
    wall_height_m: float                   # Hauteur sous sablière (murs gouttereaux)
    ridge_height_m: float                  # Hauteur sous faîtage
    roof_overhang_m: float = 1.20          # Débord de toiture ombragé (protection solaire)
    muret_height_m: float = 0.50           # Hauteur muret en dur (bas)
    orientation_azimuth_deg: float = 90.0   # 90° = Est-Ouest (optimal Sahel)
    number_of_bays: int = 4                # Nombre de travées / travées structurelles
    include_accessories: bool = True       # Intégrer les accessoires réels (abreuvoirs, perchoirs, etc.)


@dataclass
class CADAccessoryItem:
    item_id: str
    name: str
    category: AccessoryCategory
    description: str
    nominal_specs: Dict[str, Any]
    mesh: Mesh3D
    unit_cost_fcfa: float


@dataclass
class Building3DModelingResult:
    specs: Building3DSpecs
    ground_footprint_m2: float
    usable_air_volume_m3: float
    developed_roof_surface_m2: float
    rainwater_harvesting_potential_m3_year: float
    ventilation_openings_surface_m2: float
    mesh_obj_string: str
    mtl_string: str
    vertices_count: int
    faces_count: int
    structural_bom: List[Dict[str, Any]]   # Nomenclature technique (BOM) détaillée
    accessories_included: List[Dict[str, Any]]
    dxf_content: Optional[str] = None


@dataclass
class Parcel2DModelingResult:
    polygon_geojson: Dict[str, Any]
    area_m2: float
    area_hectares: float
    perimeter_m: float
    centroid: Tuple[float, float]
    drip_lines_geojson: Dict[str, Any]
    drip_lines_count: int
    total_drip_pipe_length_m: float
    svg_technical_plan: str
    topography_slope_pct: float
    elevation_drop_m: float
    manifold_pipe_length_m: float
    hydraulic_sectors_count: int
    dxf_2d_content: str


# =============================================================================
# BIBLIOTHÈQUE D'ACCESSOIRES ET COMPOSANTS RÉELS ULTRA PROFESSIONNELS
# =============================================================================

class RealCADAccessoriesLibrary:
    """Bibliothèque paramétrique d'accessoires et objets d'ingénierie rurale réels."""

    @staticmethod
    def create_water_tower(
        height_stand_m: float = 6.0,
        tank_diameter_m: float = 2.40,
        tank_height_m: float = 2.20,
        capacity_m3: float = 10.0
    ) -> Mesh3D:
        """
        Château d'eau métallique sahélien :
        Pieds en treillis IPN/Cornières 80x80x8, plateforme caillebotis, cuve cylindrique en acier ou PEHD.
        """
        vertices: List[Point3D] = []
        faces: List[List[int]] = []

        half_d = tank_diameter_m / 2.0
        r_base = half_d * 1.30 # Empattement des pieds au sol

        # 4 plots béton de fondation et 4 poteaux métalliques
        angles = [0.0, math.pi / 2.0, math.pi, 3 * math.pi / 2.0]
        # Poteaux sol (1..4)
        for ang in angles:
            x = r_base * math.cos(ang)
            y = r_base * math.sin(ang)
            vertices.append(Point3D(x, y, 0.0))

        # Sommets plateforme (5..8)
        for ang in angles:
            x = half_d * 1.05 * math.cos(ang)
            y = half_d * 1.05 * math.sin(ang)
            vertices.append(Point3D(x, y, height_stand_m))

        # Faces treillis des 4 côtés
        faces.append([1, 2, 6, 5])
        faces.append([2, 3, 7, 6])
        faces.append([3, 4, 8, 7])
        faces.append([4, 1, 5, 8])

        # Plateforme supérieure
        faces.append([5, 6, 7, 8])

        # Cuve cylindrique à 12 facettes
        segments = 12
        tank_base_idx = len(vertices) + 1
        for i in range(segments):
            ang = 2 * math.pi * i / segments
            x = half_d * math.cos(ang)
            y = half_d * math.sin(ang)
            vertices.append(Point3D(x, y, height_stand_m + 0.1))

        tank_top_idx = len(vertices) + 1
        for i in range(segments):
            ang = 2 * math.pi * i / segments
            x = half_d * math.cos(ang)
            y = half_d * math.sin(ang)
            vertices.append(Point3D(x, y, height_stand_m + 0.1 + tank_height_m))

        # Dôme / Couvercle (sommet supérieur)
        dome_idx = len(vertices) + 1
        vertices.append(Point3D(0.0, 0.0, height_stand_m + 0.1 + tank_height_m + 0.40))

        # Faces latérales de la cuve
        for i in range(segments):
            next_i = (i + 1) % segments
            v_b1 = tank_base_idx + i
            v_b2 = tank_base_idx + next_i
            v_t1 = tank_top_idx + i
            v_t2 = tank_top_idx + next_i
            faces.append([v_b1, v_b2, v_t2, v_t1])
            # Triangle toiture dôme
            faces.append([v_t1, v_t2, dome_idx])

        return Mesh3D(vertices=vertices, faces=faces, material_name="acier_galvanise")

    @staticmethod
    def create_solar_panel_array(
        panel_count: int = 8,
        panel_length_m: float = 2.27, # Format 550W standard
        panel_width_m: float = 1.13,
        tilt_angle_deg: float = 15.0 # Angle optimal sahélien
    ) -> Mesh3D:
        """
        Structure support pour champ photovoltaïque orienté plein Sud (Azimut 0 / 180).
        Inclinaison 15°, rails en aluminium anodisé et micro-pieux béton.
        """
        vertices: List[Point3D] = []
        faces: List[List[int]] = []

        tilt_rad = math.radians(tilt_angle_deg)
        total_width = panel_count * (panel_width_m + 0.02)
        l_horiz = panel_length_m * math.cos(tilt_rad)
        h_lift = panel_length_m * math.sin(tilt_rad)
        base_h = 0.80 # Hauteur sol minimale anti-poussière / végétation

        # Sommets de la table solaire
        # 1: Bas-Gauche (Sud)
        vertices.append(Point3D(0.0, 0.0, base_h))
        # 2: Bas-Droit (Sud)
        vertices.append(Point3D(total_width, 0.0, base_h))
        # 3: Haut-Droit (Nord)
        vertices.append(Point3D(total_width, l_horiz, base_h + h_lift))
        # 4: Haut-Gauche (Nord)
        vertices.append(Point3D(0.0, l_horiz, base_h + h_lift))

        # Face panneaux
        faces.append([1, 2, 3, 4])

        # Piliers métalliques au sol (4 pieds télescopiques)
        # Pied 1
        p1 = len(vertices) + 1
        vertices.extend([Point3D(0.1, 0.05, 0.0), Point3D(0.1, 0.05, base_h)])
        faces.append([p1, p1 + 1, p1 + 1, p1])
        # Pied 2
        p2 = len(vertices) + 1
        vertices.extend([Point3D(total_width - 0.1, 0.05, 0.0), Point3D(total_width - 0.1, 0.05, base_h)])
        faces.append([p2, p2 + 1, p2 + 1, p2])
        # Pied 3
        p3 = len(vertices) + 1
        vertices.extend([Point3D(total_width - 0.1, l_horiz - 0.05, 0.0), Point3D(total_width - 0.1, l_horiz - 0.05, base_h + h_lift)])
        faces.append([p3, p3 + 1, p3 + 1, p3])
        # Pied 4
        p4 = len(vertices) + 1
        vertices.extend([Point3D(0.1, l_horiz - 0.05, 0.0), Point3D(0.1, l_horiz - 0.05, base_h + h_lift)])
        faces.append([p4, p4 + 1, p4 + 1, p4])

        return Mesh3D(vertices=vertices, faces=faces, material_name="silicium_solaire")

    @staticmethod
    def create_irrigation_head_unit(
        skid_length_m: float = 2.50,
        skid_width_m: float = 1.20
    ) -> Mesh3D:
        """
        Tête de réseau d'irrigation sous pression :
        Batterie de 2 filtres à disques 2\" ou 3\", injecteur Venturi Mazzei en dérivation,
        manomètres à glycérine, vanne papillon principale et purgeurs d'air.
        """
        vertices: List[Point3D] = []
        faces: List[List[int]] = []

        L, W = skid_length_m, skid_width_m
        H_socle = 0.25 # Socle béton armé

        # Dalle béton support (1..8)
        vertices.extend([
            Point3D(0.0, 0.0, 0.0), Point3D(L, 0.0, 0.0),
            Point3D(L, W, 0.0), Point3D(0.0, W, 0.0),
            Point3D(0.0, 0.0, H_socle), Point3D(L, 0.0, H_socle),
            Point3D(L, W, H_socle), Point3D(0.0, W, H_socle)
        ])
        faces.extend([
            [1, 2, 3, 4], # Bas
            [5, 6, 7, 8], # Haut
            [1, 2, 6, 5], [2, 3, 7, 6], [3, 4, 8, 7], [4, 1, 5, 8]
        ])

        # Corps des deux filtres cylindriques verticaux
        for f_idx, offset_x in enumerate([0.70, 1.70]):
            r_filtre = 0.22
            h_filtre = 0.75
            b_z = H_socle + 0.15
            sub_base = len(vertices) + 1
            for i in range(8):
                ang = 2 * math.pi * i / 8
                x = offset_x + r_filtre * math.cos(ang)
                y = (W / 2.0) + r_filtre * math.sin(ang)
                vertices.append(Point3D(x, y, b_z))
            sub_top = len(vertices) + 1
            for i in range(8):
                ang = 2 * math.pi * i / 8
                x = offset_x + r_filtre * math.cos(ang)
                y = (W / 2.0) + r_filtre * math.sin(ang)
                vertices.append(Point3D(x, y, b_z + h_filtre))
            # Faces latérales
            for i in range(8):
                n_i = (i + 1) % 8
                faces.append([sub_base + i, sub_base + n_i, sub_top + n_i, sub_top + i])
            # Chapeau supérieur
            faces.append([sub_top + 0, sub_top + 2, sub_top + 4, sub_top + 6])

        return Mesh3D(vertices=vertices, faces=faces, material_name="pehd_fonte_irrigation")

    @staticmethod
    def create_zootechnical_troughs(
        building_length_m: float = 24.0,
        trough_count: int = 6
    ) -> Mesh3D:
        """
        Ligne d'abreuvoirs automatiques à niveau constant et mangeoires linéaires anti-gaspillage.
        Conformes aux préconisations zootechniques sahéliennes.
        """
        vertices: List[Point3D] = []
        faces: List[List[int]] = []

        spacing = building_length_m / (trough_count + 1)
        r_trough = 0.25 # Abreuvoir siphoïde cloche
        h_trough = 0.35

        for i in range(trough_count):
            cx = (i + 1) * spacing
            cy = 1.50 # Aligné sur le couloir de service
            base_idx = len(vertices) + 1
            for k in range(6):
                ang = 2 * math.pi * k / 6
                vertices.append(Point3D(cx + r_trough * math.cos(ang), cy + r_trough * math.sin(ang), 0.15))
            top_idx = len(vertices) + 1
            for k in range(6):
                ang = 2 * math.pi * k / 6
                vertices.append(Point3D(cx + r_trough * math.cos(ang), cy + r_trough * math.sin(ang), 0.15 + h_trough))
            # Faces
            for k in range(6):
                nk = (k + 1) % 6
                faces.append([base_idx + k, base_idx + nk, top_idx + nk, top_idx + k])
            faces.append([top_idx, top_idx + 1, top_idx + 2, top_idx + 3, top_idx + 4, top_idx + 5])

        return Mesh3D(vertices=vertices, faces=faces, material_name="equipement_zootechnique")


# =============================================================================
# MOTEUR PRINCIPAL CAO 2D & 3D D'INGÉNIERIE AGRONOMIQUE
# =============================================================================

class AgronomicCAD3DEngine:
    """
    Moteur de modélisation géométrique 2D et 3D de précision pour l'ingénierie rurale africaine.
    Produit des plans industriels et maquettes volumétriques réalistes pour ingénieurs, agronomes et bailleurs.
    """

    def __init__(self):
        self.library = RealCADAccessoriesLibrary()

    def model_parcel_and_irrigation_2d(
        self,
        boundary_coords: List[Tuple[float, float]],
        lateral_spacing_m: float = 1.0,
        emitter_spacing_m: float = 0.30,
        elevation_start_m: float = 300.0,
        elevation_end_m: float = 298.5
    ) -> Parcel2DModelingResult:
        """
        Modélise une parcelle 2D via Shapely, calcule les dimensions cadastrales exactes,
        génère l'implantation automatique des rampes de goutte-à-goutte, le collecteur porte-rampes,
        le découpage en sous-secteurs hydrauliques et les exports SVG coté et DXF industriel.
        """
        if len(boundary_coords) < 3:
            raise ValueError("Une parcelle valide requiert au minimum 3 coordonnées de sommets.")

        poly = Polygon(boundary_coords)
        if not poly.is_valid:
            poly = poly.buffer(0)

        area_m2 = float(poly.area)
        perimeter_m = float(poly.length)
        centroid = (float(poly.centroid.x), float(poly.centroid.y))

        # Détermination de l'orientation et des rampes d'irrigation parallèles
        minx, miny, maxx, maxy = poly.bounds
        drip_lines: List[LineString] = []
        total_pipe_length = 0.0

        current_y = miny + (lateral_spacing_m / 2.0)
        while current_y < maxy:
            scan_line = LineString([(minx - 10.0, current_y), (maxx + 10.0, current_y)])
            intersection = poly.intersection(scan_line)
            if not intersection.is_empty:
                if intersection.geom_type == "LineString":
                    drip_lines.append(intersection)
                    total_pipe_length += intersection.length
                elif intersection.geom_type == "MultiLineString":
                    for part in intersection.geoms:
                        drip_lines.append(part)
                        total_pipe_length += part.length
            current_y += lateral_spacing_m

        # Collecteur principal (porte-rampes) implanté sur la ligne médiane ou la crête
        manifold_line = LineString([(minx + (maxx - minx) * 0.5, miny), (minx + (maxx - minx) * 0.5, maxy)])
        inter_manifold = poly.intersection(manifold_line)
        manifold_length = float(inter_manifold.length) if not inter_manifold.is_empty else (maxy - miny)

        # Calcul des secteurs hydrauliques (max 2 500 m² par vanne secteur standard)
        sectors_count = max(1, math.ceil(area_m2 / 2500.0))

        # Topographie et pente
        elevation_drop = abs(elevation_start_m - elevation_end_m)
        max_length = max(maxx - minx, maxy - miny, 1.0)
        slope_pct = (elevation_drop / max_length) * 100.0

        # GeoJSON
        poly_geojson = mapping(poly)
        lines_geojson = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": mapping(line),
                    "properties": {
                        "line_id": idx + 1,
                        "length_m": round(line.length, 2),
                        "emitters_count": max(1, int(line.length / emitter_spacing_m))
                    }
                }
                for idx, line in enumerate(drip_lines)
            ]
        }

        # Plan SVG coté industriel avec cartouche professionnel
        svg_plan = self._generate_technical_svg(
            poly=poly,
            drip_lines=drip_lines,
            bounds=(minx, miny, maxx, maxy),
            area_m2=area_m2,
            perimeter_m=perimeter_m,
            lines_count=len(drip_lines),
            manifold_length_m=manifold_length,
            sectors_count=sectors_count
        )

        # Génération DXF (Dessin vectoriel CAO échangeable AutoCAD / QGIS)
        dxf_content = self._generate_dxf_2d(poly, drip_lines, manifold_line)

        return Parcel2DModelingResult(
            polygon_geojson=poly_geojson,
            area_m2=round(area_m2, 2),
            area_hectares=round(area_m2 / 10000.0, 4),
            perimeter_m=round(perimeter_m, 2),
            centroid=centroid,
            drip_lines_geojson=lines_geojson,
            drip_lines_count=len(drip_lines),
            total_drip_pipe_length_m=round(total_pipe_length, 2),
            svg_technical_plan=svg_plan,
            topography_slope_pct=round(slope_pct, 2),
            elevation_drop_m=round(elevation_drop, 2),
            manifold_pipe_length_m=round(manifold_length, 2),
            hydraulic_sectors_count=sectors_count,
            dxf_2d_content=dxf_content
        )

    def model_bioclimatic_building_3d(
        self,
        specs: Building3DSpecs,
        annual_rainfall_mm: float = 750.0
    ) -> Building3DModelingResult:
        """
        Génère le modèle 3D volumétrique et structurel ultra réaliste d'un bâtiment ou ouvrage :
        - Poteaux porteurs en béton armé espacés de 3 à 4 mètres.
        - Murets de soubassement briques de terre comprimée (BTC) ou agglos 15x20x40.
        - Claustras de ventilation permanente / grillage galvanisé anti-oiseaux.
        - Charpente métallique (fermes en cornières / tubes IPN, pannes C100).
        - Toiture deux pans avec avancée d'ombrage de 1.20 m à 1.50 m.
        - Accessoires intégrés : château d'eau, centrale solaire, lignes d'abreuvement.
        """
        L = specs.length_m
        W = specs.width_m
        H_wall = specs.wall_height_m
        H_ridge = specs.ridge_height_m
        overhang = specs.roof_overhang_m
        muret_h = specs.muret_height_m

        footprint_m2 = L * W
        base_volume = L * W * H_wall
        roof_volume = 0.5 * W * (H_ridge - H_wall) * L
        usable_air_volume = base_volume + roof_volume

        # Surface de toiture développée avec débord
        half_w_roof = (W / 2.0) + overhang
        roof_delta_h = H_ridge - H_wall
        rafter_length = math.sqrt(half_w_roof**2 + roof_delta_h**2)
        roof_length_with_overhang = L + (2.0 * overhang)
        developed_roof_surface = 2.0 * (rafter_length * roof_length_with_overhang)

        # Potentiel de collecte d'eau de pluie annuel (m³)
        rainwater_m3 = (developed_roof_surface * (annual_rainfall_mm / 1000.0) * 0.90)

        # Ventilation naturelle
        open_wall_height = max(0.0, H_wall - muret_h)
        ventilation_openings_m2 = 2.0 * (L * open_wall_height)

        # Construction du maillage 3D géométrique détaillé
        v_list: List[Point3D] = []
        faces: List[List[int]] = []

        # 1. Dalle radier en béton (0 à 3)
        v_list.append(Point3D(0.0, 0.0, 0.0))
        v_list.append(Point3D(L, 0.0, 0.0))
        v_list.append(Point3D(L, W, 0.0))
        v_list.append(Point3D(0.0, W, 0.0))
        faces.append([1, 2, 3, 4])

        # 2. Murets de soubassement (Z = muret_h)
        v_list.append(Point3D(0.0, 0.0, muret_h)) # 5
        v_list.append(Point3D(L, 0.0, muret_h))   # 6
        v_list.append(Point3D(L, W, muret_h))     # 7
        v_list.append(Point3D(0.0, W, muret_h))   # 8

        faces.append([1, 2, 6, 5]) # Muret Sud
        faces.append([3, 4, 8, 7]) # Muret Nord
        faces.append([4, 1, 5, 8]) # Muret Ouest
        faces.append([2, 3, 7, 6]) # Muret Est

        # 3. Poteaux BA / Sablière (Z = H_wall)
        v_list.append(Point3D(0.0, 0.0, H_wall)) # 9
        v_list.append(Point3D(L, 0.0, H_wall))   # 10
        v_list.append(Point3D(L, W, H_wall))     # 11
        v_list.append(Point3D(0.0, W, H_wall))   # 12

        # Claustras / Grillage (de muret_h à H_wall)
        faces.append([5, 6, 10, 9])
        faces.append([7, 8, 12, 11])

        # 4. Pignons et Faîtage (Z = H_ridge)
        mid_y = W / 2.0
        v_list.append(Point3D(0.0, mid_y, H_ridge)) # 13: faîte Ouest
        v_list.append(Point3D(L, mid_y, H_ridge))   # 14: faîte Est

        # Pignons fermés anti-pluie battante
        faces.append([8, 5, 9, 13, 12])  # Pignon Ouest
        faces.append([6, 7, 11, 14, 10]) # Pignon Est

        # 5. Versants de Toiture avec avancée d'ombrage de 1.20 m
        v_list.append(Point3D(-overhang, -overhang, H_wall - 0.25))            # 15: débord avant-gauche
        v_list.append(Point3D(L + overhang, -overhang, H_wall - 0.25))         # 16: débord avant-droit
        v_list.append(Point3D(L + overhang, W + overhang, H_wall - 0.25))      # 17: débord arrière-droit
        v_list.append(Point3D(-overhang, W + overhang, H_wall - 0.25))         # 18: débord arrière-gauche
        v_list.append(Point3D(-overhang, mid_y, H_ridge + 0.15))               # 19: faîte débord gauche
        v_list.append(Point3D(L + overhang, mid_y, H_ridge + 0.15))            # 20: faîte débord droit

        faces.append([19, 20, 16, 15]) # Versant Sud
        faces.append([19, 18, 17, 20]) # Versant Nord

        # 6. Intégration des composants structurels réels (Poteaux intermédiaires)
        bays = max(2, specs.number_of_bays)
        bay_step = L / bays
        for b_idx in range(1, bays):
            bx = b_idx * bay_step
            # Poteaux intermédiaires gauche et droite
            p_base_idx = len(v_list) + 1
            v_list.append(Point3D(bx, 0.05, 0.0))
            v_list.append(Point3D(bx, 0.05, H_wall))
            v_list.append(Point3D(bx, W - 0.05, 0.0))
            v_list.append(Point3D(bx, W - 0.05, H_wall))
            faces.append([p_base_idx, p_base_idx + 1, p_base_idx + 1, p_base_idx])
            faces.append([p_base_idx + 2, p_base_idx + 3, p_base_idx + 3, p_base_idx + 2])

        accessories_list: List[Dict[str, Any]] = []

        # 7. Intégration des accessoires réels si demandés
        if specs.include_accessories:
            # A. Ligne d'abreuvoirs zootechniques dans le bâtiment
            troughs_mesh = RealCADAccessoriesLibrary.create_zootechnical_troughs(
                building_length_m=L,
                trough_count=max(2, int(L / 4.0))
            )
            offset_troughs = len(v_list)
            for tv in troughs_mesh.vertices:
                v_list.append(tv)
            for tf in troughs_mesh.faces:
                faces.append([idx + offset_troughs for idx in tf])
            accessories_list.append({
                "nom": "Abreuvoirs Siphoïdes Automatiques",
                "quantite": max(2, int(L / 4.0)),
                "unite": "unités",
                "spec": "Abreuvoirs automatiques à cloche suspendue régulée par dépression"
            })

            # B. Château d'eau métallique à côté du bâtiment
            water_tower_mesh = RealCADAccessoriesLibrary.create_water_tower(
                height_stand_m=4.5,
                tank_diameter_m=2.0,
                tank_height_m=1.8,
                capacity_m3=5.0
            )
            # Translation vers l'extérieur (ex: X = L + 4m, Y = W / 2)
            wt_offset = len(v_list)
            for wtv in water_tower_mesh.vertices:
                v_list.append(wtv.translated(L + 4.0, mid_y, 0.0))
            for wtf in water_tower_mesh.faces:
                faces.append([idx + wt_offset for idx in wtf])
            accessories_list.append({
                "nom": "Château d'Eau Métallique 5 m³ sur Trépied",
                "hauteur_m": 4.5,
                "capacite_m3": 5.0,
                "spec": "Structure cornières 80x80x8 galvanisées, cuve PEHD qualité alimentaire"
            })

            # C. Centrale solaire de toiture ou au sol
            solar_mesh = RealCADAccessoriesLibrary.create_solar_panel_array(
                panel_count=6,
                tilt_angle_deg=15.0
            )
            solar_offset = len(v_list)
            for sv in solar_mesh.vertices:
                v_list.append(sv.translated(L + 3.0, -4.0, 0.0))
            for sf in solar_mesh.faces:
                faces.append([idx + solar_offset for idx in sf])
            accessories_list.append({
                "nom": "Champ Solaire Photovoltaïque 6 Modules (3.3 kWc)",
                "puissance_wc": 3300,
                "tilt_deg": 15.0,
                "spec": "Modules monocristallins PERC 550W, structure inclinée anti-soulèvement"
            })

        mesh = Mesh3D(vertices=v_list, faces=faces, material_name="batiment_bioclimatique")
        obj_content = mesh.to_obj_string(object_name=specs.structure_type.value)
        mtl_content = self._generate_mtl_material_library()

        # Nomenclature technique (BOM) d'ingénierie
        bom = self._calculate_structural_bom(
            length_m=L,
            width_m=W,
            wall_h=H_wall,
            ridge_h=H_ridge,
            bays=bays,
            roof_surface_m2=developed_roof_surface
        )

        return Building3DModelingResult(
            specs=specs,
            ground_footprint_m2=round(footprint_m2, 2),
            usable_air_volume_m3=round(usable_air_volume, 2),
            developed_roof_surface_m2=round(developed_roof_surface, 2),
            rainwater_harvesting_potential_m3_year=round(rainwater_m3, 2),
            ventilation_openings_surface_m2=round(ventilation_openings_m2, 2),
            mesh_obj_string=obj_content,
            mtl_string=mtl_content,
            vertices_count=len(v_list),
            faces_count=len(faces),
            structural_bom=bom,
            accessories_included=accessories_list
        )

    def _calculate_structural_bom(
        self,
        length_m: float,
        width_m: float,
        wall_h: float,
        ridge_h: float,
        bays: int,
        roof_surface_m2: float
    ) -> List[Dict[str, Any]]:
        """Calcule la nomenclature matérielle chiffrée selon les normes de construction sahéliennes."""
        poteaux_count = (bays + 1) * 2
        volume_beton_dalle_m3 = length_m * width_m * 0.12 # Dalle 12 cm
        volume_beton_plots_m3 = poteaux_count * (0.4 * 0.4 * 0.6)
        total_beton_m3 = volume_beton_dalle_m3 + volume_beton_plots_m3
        ciment_sacs_50kg = math.ceil(total_beton_m3 * 7.0) # Dosage 350 kg/m³ = 7 sacs/m³
        sable_m3 = round(total_beton_m3 * 0.45, 1)
        gravier_m3 = round(total_beton_m3 * 0.85, 1)
        acier_tor_kg = round(total_beton_m3 * 80.0, 1) # Ratio moyen ferraillage

        toles_bacs_count = math.ceil(roof_surface_m2 / (0.90 * 2.50)) # Tôle alu-zinc 2.5m utile

        return [
            {"element": "Dalle et fondations béton armé (B25)", "quantite": round(total_beton_m3, 2), "unite": "m³", "detail": f"Dalle 12cm dosée à 350 kg/m³ + {poteaux_count} plots"},
            {"element": "Ciment Portland CPJ 42.5", "quantite": ciment_sacs_50kg, "unite": "sacs de 50kg", "detail": "Liant certifié UEMOA"},
            {"element": "Sable propre de rivière (0/4)", "quantite": sable_m3, "unite": "m³", "detail": "Inerte lavé sans argile"},
            {"element": "Gravier concassé granulat (5/15)", "quantite": gravier_m3, "unite": "m³", "detail": "Granite concassé haute résistance"},
            {"element": "Aciers Haute Adhérence FeE400 (HA8, HA10, HA12)", "quantite": acier_tor_kg, "unite": "kg", "detail": "Ferraillage semelles, longrines et chaînages"},
            {"element": "Poteaux BA ou métalliques 100x100x3", "quantite": poteaux_count, "unite": "unités", "detail": f"Hauteur utile {wall_h} m"},
            {"element": "Fermes de charpente métalliques tubulaires", "quantite": bays + 1, "unite": "fermes complètes", "detail": f"Portée libre {width_m} m"},
            {"element": "Tôles bacs alu-zinc 6/10ème traitées anti-chaleur", "quantite": toles_bacs_count, "unite": "feuilles de 2.5m", "detail": "Réflectance solaire élevée"}
        ]

    def _generate_mtl_material_library(self) -> str:
        """Génère le fichier de matériaux Wavefront MTL pour un rendu photoréaliste."""
        return """# NAFA AGRITECH — Bibliothèque des Matériaux CAO 3D
newmtl beton_arme
Ka 0.2 0.2 0.2
Kd 0.65 0.65 0.65
Ks 0.1 0.1 0.1
Ns 10

newmtl tole_aluzinc
Ka 0.3 0.3 0.3
Kd 0.85 0.88 0.90
Ks 0.7 0.7 0.7
Ns 80

newmtl acier_galvanise
Ka 0.2 0.2 0.25
Kd 0.6 0.65 0.7
Ks 0.5 0.5 0.5
Ns 50

newmtl silicium_solaire
Ka 0.1 0.1 0.2
Kd 0.05 0.1 0.25
Ks 0.9 0.9 0.9
Ns 120

newmtl pehd_fonte_irrigation
Ka 0.1 0.1 0.1
Kd 0.02 0.35 0.55
Ks 0.4 0.4 0.4
Ns 30
"""

    def _generate_technical_svg(
        self,
        poly: Polygon,
        drip_lines: List[LineString],
        bounds: Tuple[float, float, float, float],
        area_m2: float,
        perimeter_m: float,
        lines_count: int,
        manifold_length_m: float,
        sectors_count: int
    ) -> str:
        """Génère un plan vectoriel SVG coté avec cartouche d'ingénierie agronomique."""
        minx, miny, maxx, maxy = bounds
        span_x = max(maxx - minx, 1.0)
        span_y = max(maxy - miny, 1.0)

        view_w, view_h = 900, 650
        margin = 60
        usable_w = view_w - 2 * margin
        usable_h = view_h - 2 * margin - 90

        scale = min(usable_w / span_x, usable_h / span_y)

        def transform(x: float, y: float) -> Tuple[float, float]:
            sx = margin + (x - minx) * scale
            sy = view_h - margin - 90 - (y - miny) * scale
            return sx, sy

        # Points du polygone
        pts_coords = [f"{transform(x, y)[0]:.1f},{transform(x, y)[1]:.1f}" for x, y in poly.exterior.coords]
        pts_str = " ".join(pts_coords)

        # Rampes d'irrigation
        drip_svg_lines = []
        for line in drip_lines:
            x1, y1 = transform(line.coords[0][0], line.coords[0][1])
            x2, y2 = transform(line.coords[-1][0], line.coords[-1][1])
            drip_svg_lines.append(
                f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="#0ea5e9" stroke-width="1.2" stroke-dasharray="4,2"/>'
            )

        drip_svg_str = "\n".join(drip_svg_lines)

        # Collecteur principal (porte-rampes)
        mx1, my1 = transform(minx + span_x * 0.5, miny)
        mx2, my2 = transform(minx + span_x * 0.5, maxy)

        svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {view_w} {view_h}" width="100%" height="100%" style="background:#0b1329; font-family:'Segoe UI',sans-serif;">
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" stroke-width="0.8"/>
    </pattern>
    <linearGradient id="polyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#16a34a" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#22c55e" stop-opacity="0.08"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid)"/>

  <!-- Rose des vents / Flèche Nord -->
  <g transform="translate({view_w - 70}, 70)">
    <circle cx="0" cy="0" r="26" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
    <path d="M 0 -20 L 7 0 L 0 -5 L -7 0 Z" fill="#ef4444"/>
    <path d="M 0 20 L 7 0 L 0 5 L -7 0 Z" fill="#94a3b8"/>
    <text x="0" y="-24" text-anchor="middle" fill="#ef4444" font-size="12" font-weight="bold">N</text>
  </g>

  <!-- Polygone de la parcelle -->
  <polygon points="{pts_str}" fill="url(#polyGrad)" stroke="#22c55e" stroke-width="2.5"/>

  <!-- Rampes de goutte-à-goutte -->
  {drip_svg_str}

  <!-- Collecteur porte-rampes principal -->
  <line x1="{mx1:.1f}" y1="{my1:.1f}" x2="{mx2:.1f}" y2="{my2:.1f}" stroke="#38bdf8" stroke-width="4.0"/>
  <circle cx="{mx1:.1f}" cy="{my1:.1f}" r="5" fill="#f59e0b" stroke="#ffffff" stroke-width="1.5"/>

  <!-- Cartouche Technique d'Ingénierie -->
  <g transform="translate(30, {view_h - 85})">
    <rect width="{view_w - 60}" height="75" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
    <text x="20" y="24" fill="#f8fafc" font-size="14" font-weight="bold">PLAN TECHNIQUE D'IMPLANTATION AGRONOMIQUE & HYDRAULIQUE — NAFA-AGRITECH</text>
    <text x="20" y="46" fill="#94a3b8" font-size="12">Superficie : <tspan fill="#22c55e" font-weight="bold">{area_m2:.1f} m² ({(area_m2/10000.0):.3f} ha)</tspan> | Périmètre : <tspan fill="#f8fafc">{perimeter_m:.1f} m</tspan> | Rampes : <tspan fill="#0ea5e9">{lines_count} lignes</tspan> | Secteurs : <tspan fill="#a855f7">{sectors_count} vannes</tspan></text>
    <text x="20" y="65" fill="#64748b" font-size="11">Collecteur porte-rampes PEHD : {manifold_length_m:.1f} m | Écartement : {1.0} m | Goutteurs intégrés tous les 30 cm</text>
    <text x="{view_w - 200}" y="36" fill="#fbbf24" font-size="11" font-weight="bold">Norme FAO-56 • Échelle 1:{int(span_x*1.2)}</text>
  </g>
</svg>"""
        return svg

    def _generate_dxf_2d(self, poly: Polygon, drip_lines: List[LineString], manifold: LineString) -> str:
        """Génère un fichier ASCII DXF AutoCAD standard R12 pour les bureaux d'études."""
        lines = [
            "0", "SECTION",
            "2", "ENTITIES"
        ]

        # Polygone parcelle (LWPOLYLINE / LINES)
        coords = list(poly.exterior.coords)
        for i in range(len(coords) - 1):
            p1 = coords[i]
            p2 = coords[i + 1]
            lines.extend([
                "0", "LINE",
                "8", "PARCELLE_CONTOUR",
                "10", f"{p1[0]:.4f}", "20", f"{p1[1]:.4f}", "30", "0.0",
                "11", f"{p2[0]:.4f}", "21", f"{p2[1]:.4f}", "31", "0.0"
            ])

        # Lignes d'irrigation
        for idx, d_line in enumerate(drip_lines):
            c = list(d_line.coords)
            lines.extend([
                "0", "LINE",
                "8", "RAMPES_GOUTTE_A_GOUTTE",
                "10", f"{c[0][0]:.4f}", "20", f"{c[0][1]:.4f}", "30", "0.0",
                "11", f"{c[-1][0]:.4f}", "21", f"{c[-1][1]:.4f}", "31", "0.0"
            ])

        # Fin section
        lines.extend([
            "0", "ENDSEC",
            "0", "EOF"
        ])

        return "\n".join(lines)
