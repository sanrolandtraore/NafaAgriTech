"""
NAFA AGRITECH — Outils Ultra Professionnels de Modélisation 2D & 3D
Conception CAO & SIG agricole via Shapely, GeoPandas, NumPy et génération 3D (Wavefront OBJ, SVG, GeoJSON).
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


@dataclass
class Point3D:
    x: float
    y: float
    z: float

    def to_tuple(self) -> Tuple[float, float, float]:
        return (self.x, self.y, self.z)


@dataclass
class Building3DSpecs:
    structure_type: StructureType
    length_m: float                  # Longueur (axe Est-Ouest préconisé)
    width_m: float                   # Largeur
    wall_height_m: float             # Hauteur sous sablière (murs gouttereaux)
    ridge_height_m: float            # Hauteur sous faîtage
    roof_overhang_m: float = 1.20    # Débord de toiture ombragé (protection solaire)
    muret_height_m: float = 0.50     # Hauteur muret en dur (bas)
    orientation_azimuth_deg: float = 90.0 # 90° = Est-Ouest (optimal Sahel)


@dataclass
class Mesh3D:
    vertices: List[Point3D]
    faces: List[List[int]]           # Indices 1-based pour conformité Wavefront OBJ
    normals: List[Point3D] = field(default_factory=list)

    def to_obj_string(self, object_name: str = "NafaAgriStructure") -> str:
        """Génère la représentation Wavefront OBJ standard pour Blender, AutoCAD, SketchUp."""
        lines = [
            f"# NAFA AGRITECH — Modélisation CAO 3D Professionnelle",
            f"# Objet: {object_name}",
            f"o {object_name}"
        ]
        # Sommets
        for v in self.vertices:
            lines.append(f"v {v.x:.4f} {v.y:.4f} {v.z:.4f}")
        # Faces
        for f in self.faces:
            indices_str = " ".join(str(idx) for idx in f)
            lines.append(f"f {indices_str}")
        return "\n".join(lines)


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


@dataclass
class Building3DModelingResult:
    specs: Building3DSpecs
    ground_footprint_m2: float
    usable_air_volume_m3: float
    developed_roof_surface_m2: float
    rainwater_harvesting_potential_m3_year: float # Basé sur pluviométrie sahélienne (ex: 750 mm)
    ventilation_openings_surface_m2: float
    mesh_obj_string: str
    vertices_count: int
    faces_count: int


class AgronomicCAD3DEngine:
    """Moteur de modélisation géométrique 2D et 3D de précision pour l'ingénierie rurale africaine."""

    def __init__(self):
        pass

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
        génère l'implantation automatique des rampes de goutte-à-goutte et le plan technique SVG coté.
        """
        if len(boundary_coords) < 3:
            raise ValueError("Une parcelle valide requiert au minimum 3 coordonnées de sommets.")

        poly = Polygon(boundary_coords)
        if not poly.is_valid:
            poly = poly.buffer(0)

        area_m2 = float(poly.area)
        perimeter_m = float(poly.length)
        centroid = (float(poly.centroid.x), float(poly.centroid.y))

        # Génération des rampes d'irrigation parallèles
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
                    "properties": {"line_id": idx + 1, "length_m": round(line.length, 2)}
                }
                for idx, line in enumerate(drip_lines)
            ]
        }

        # Plan SVG coté avec échelle graphique et rose des vents
        svg_plan = self._generate_technical_svg(
            poly=poly,
            drip_lines=drip_lines,
            bounds=(minx, miny, maxx, maxy),
            area_m2=area_m2,
            perimeter_m=perimeter_m,
            lines_count=len(drip_lines)
        )

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
            elevation_drop_m=round(elevation_drop, 2)
        )

    def model_bioclimatic_building_3d(
        self,
        specs: Building3DSpecs,
        annual_rainfall_mm: float = 750.0 # Moyenne Bobo-Dioulasso / Ouagadougou
    ) -> Building3DModelingResult:
        """
        Génère le modèle volumétrique 3D complet d'un bâtiment d'élevage sahélien
        (Toiture à double pente, débords d'ombrage de 1.2m, murets de soubassement et claustras).
        Produit le maillage OBJ prêt pour la 3D interactive et le calcul d'ingénierie thermique.
        """
        L = specs.length_m
        W = specs.width_m
        H_wall = specs.wall_height_m
        H_ridge = specs.ridge_height_m
        overhang = specs.roof_overhang_m
        muret_h = specs.muret_height_m

        footprint_m2 = L * W
        # Volume utile = volume parallélépipède bas + volume prisme triangulaire toiture
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
        # Q = Surface * Pluie (m) * Coeff ruissellement tôle (0.90)
        rainwater_m3 = (developed_roof_surface * (annual_rainfall_mm / 1000.0) * 0.90)

        # Surface d'ouvertures de ventilation (claustras/grillage au-dessus du muret)
        open_wall_height = max(0.0, H_wall - muret_h)
        # Deux longs pans gouttereaux ouverts
        ventilation_openings_m2 = 2.0 * (L * open_wall_height)

        # Construction du maillage 3D (Vertices & Faces)
        # Repère : X = Longueur (Est-Ouest), Y = Largeur (Nord-Sud), Z = Hauteur
        v_list: List[Point3D] = []

        # Sol (0 à 3)
        v_list.append(Point3D(0.0, 0.0, 0.0))          # 1: bas-gauche-avant
        v_list.append(Point3D(L, 0.0, 0.0))            # 2: bas-droite-avant
        v_list.append(Point3D(L, W, 0.0))              # 3: bas-droite-arrière
        v_list.append(Point3D(0.0, W, 0.0))            # 4: bas-gauche-arrière

        # Sommets murs sablière (4 à 7)
        v_list.append(Point3D(0.0, 0.0, H_wall))       # 5: haut-mur-gauche-avant
        v_list.append(Point3D(L, 0.0, H_wall))         # 6: haut-mur-droite-avant
        v_list.append(Point3D(L, W, H_wall))           # 7: haut-mur-droite-arrière
        v_list.append(Point3D(0.0, W, H_wall))         # 8: haut-mur-gauche-arrière

        # Faîtage (8 et 9)
        mid_y = W / 2.0
        v_list.append(Point3D(0.0, mid_y, H_ridge))    # 9: faîte gauche
        v_list.append(Point3D(L, mid_y, H_ridge))      # 10: faîte droite

        # Toiture avec débord (10 à 15)
        v_list.append(Point3D(-overhang, -overhang, H_wall - 0.2))            # 11: débord avant-gauche
        v_list.append(Point3D(L + overhang, -overhang, H_wall - 0.2))         # 12: débord avant-droit
        v_list.append(Point3D(L + overhang, W + overhang, H_wall - 0.2))      # 13: débord arrière-droit
        v_list.append(Point3D(-overhang, W + overhang, H_wall - 0.2))         # 14: débord arrière-gauche
        v_list.append(Point3D(-overhang, mid_y, H_ridge + 0.1))               # 15: faîte étendu gauche
        v_list.append(Point3D(L + overhang, mid_y, H_ridge + 0.1))            # 16: faîte étendu droit

        # Définition des faces (indices 1-based pour OBJ)
        faces: List[List[int]] = [
            # Dalle sol
            [1, 2, 3, 4],
            # Murs / façades pignons
            [1, 5, 9, 8, 4],  # Pignon Ouest
            [2, 3, 7, 10, 6], # Pignon Est
            # Longs pans gouttereaux
            [1, 2, 6, 5],     # Façade Sud
            [4, 8, 7, 3],     # Façade Nord
            # Toiture versant Sud
            [15, 16, 12, 11],
            # Toiture versant Nord
            [15, 14, 13, 16]
        ]

        mesh = Mesh3D(vertices=v_list, faces=faces)
        obj_content = mesh.to_obj_string(object_name=specs.structure_type.value)

        return Building3DModelingResult(
            specs=specs,
            ground_footprint_m2=round(footprint_m2, 2),
            usable_air_volume_m3=round(usable_air_volume, 2),
            developed_roof_surface_m2=round(developed_roof_surface, 2),
            rainwater_harvesting_potential_m3_year=round(rainwater_m3, 2),
            ventilation_openings_surface_m2=round(ventilation_openings_m2, 2),
            mesh_obj_string=obj_content,
            vertices_count=len(v_list),
            faces_count=len(faces)
        )

    def _generate_technical_svg(
        self,
        poly: Polygon,
        drip_lines: List[LineString],
        bounds: Tuple[float, float, float, float],
        area_m2: float,
        perimeter_m: float,
        lines_count: int
    ) -> str:
        """Génère un plan vectoriel SVG coté avec cartouche d'ingénierie agronomique."""
        minx, miny, maxx, maxy = bounds
        span_x = max(maxx - minx, 1.0)
        span_y = max(maxy - miny, 1.0)

        view_w, view_h = 800, 600
        margin = 60
        usable_w = view_w - 2 * margin
        usable_h = view_h - 2 * margin - 80 # Espace cartouche en bas

        scale = min(usable_w / span_x, usable_h / span_y)

        def transform(x: float, y: float) -> Tuple[float, float]:
            sx = margin + (x - minx) * scale
            sy = view_h - margin - 80 - (y - miny) * scale
            return sx, sy

        # Points du polygone
        pts_coords = [f"{transform(x, y)[0]:.1f},{transform(x, y)[1]:.1f}" for x, y in poly.exterior.coords]
        pts_str = " ".join(pts_coords)

        # Lignes d'irrigation
        drip_svg_lines = []
        for line in drip_lines:
            x1, y1 = transform(line.coords[0][0], line.coords[0][1])
            x2, y2 = transform(line.coords[-1][0], line.coords[-1][1])
            drip_svg_lines.append(
                f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="#0ea5e9" stroke-width="1.5" stroke-dasharray="4,2"/>'
            )

        drip_svg_str = "\n".join(drip_svg_lines)

        svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {view_w} {view_h}" width="100%" height="100%" style="background:#0f172a; font-family:sans-serif;">
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" stroke-width="0.8"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid)"/>

  <!-- Rose des vents / Flèche Nord -->
  <g transform="translate(730, 70)">
    <circle cx="0" cy="0" r="24" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
    <path d="M 0 -18 L 6 0 L 0 -4 L -6 0 Z" fill="#ef4444"/>
    <path d="M 0 18 L 6 0 L 0 4 L -6 0 Z" fill="#94a3b8"/>
    <text x="0" y="-22" text-anchor="middle" fill="#ef4444" font-size="11" font-weight="bold">N</text>
  </g>

  <!-- Polygone de la parcelle -->
  <polygon points="{pts_str}" fill="rgba(34, 197, 94, 0.15)" stroke="#22c55e" stroke-width="2.5"/>

  <!-- Rampes de goutte-à-goutte -->
  {drip_svg_str}

  <!-- Cartouche Technique d'Ingénierie -->
  <g transform="translate(30, {view_h - 75})">
    <rect width="{view_w - 60}" height="65" rx="6" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
    <text x="20" y="24" fill="#f8fafc" font-size="14" font-weight="bold">PLAN TECHNIQUE D'IMPLANTATION AGRONOMIQUE — NAFA-AGRITECH</text>
    <text x="20" y="46" fill="#94a3b8" font-size="12">Superficie : <tspan fill="#22c55e" font-weight="bold">{area_m2:.1f} m² ({(area_m2/10000.0):.3f} ha)</tspan> | Périmètre : <tspan fill="#f8fafc">{perimeter_m:.1f} m</tspan> | Rampes : <tspan fill="#0ea5e9">{lines_count} lignes</tspan></text>
    <text x="{view_w - 180}" y="36" fill="#fbbf24" font-size="11" font-weight="bold">Échelle : 1:{int(span_x*1.2)}</text>
  </g>
</svg>"""
        return svg
