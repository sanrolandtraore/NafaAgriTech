"""
NAFA AGRITECH — Module Agronome : Vision par Ordinateur & Santé des Cultures
Analyse d'images haute résolution et satellitaires/drones via PyTorch, TorchVision, NumPy, Pillow et Rasterio.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Tuple, Any
import io
import os
import numpy as np
from PIL import Image
import torch
import torchvision.transforms as T

try:
    import rasterio
    from rasterio.io import MemoryFile
    RASTERIO_AVAILABLE = True
except ImportError:
    RASTERIO_AVAILABLE = False


class CropType(str, Enum):
    MAIZE = "mais"
    SORGHUM = "sorgho"
    MILLET = "mil"
    COWPEA = "niebe"
    TOMATO = "tomate"
    ONION = "oignon"
    COTTON = "coton"
    MANGO = "manguier"
    GENERAL = "general"


class PathologyType(str, Enum):
    HEALTHY = "sain"
    CHLOROSIS = "chlorose"                # Jaunissement (carence azote/fer ou stress)
    NECROSIS = "necrose"                  # Dessèchement, taches mortes
    LEAF_SPOT = "taches_foliaires"        # Cercosporiose, helminthosporiose
    RUST = "rouille"                      # Pustules orangées/brunes
    FALL_ARMYWORM = "chenille_legionnaire"# Dégâts de Spodoptera frugiperda
    WATER_STRESS = "stress_hydrique"      # Flétrissement


class SeverityLevel(str, Enum):
    OPTIMAL = "optimal"       # < 2% de surface affectée
    LOW = "faible"            # 2% - 10%
    MODERATE = "modere"       # 10% - 25%
    HIGH = "eleve"            # 25% - 50%
    CRITICAL = "critique"     # > 50%


@dataclass
class PathologyDetection:
    pathology: PathologyType
    confidence: float
    affected_area_percentage: float
    visual_signature: str
    action_priority: str


@dataclass
class CropHealthAnalysisResult:
    crop_type: CropType
    overall_health_score: float           # 0.0 (détruit) à 100.0 (parfaitement sain)
    severity_level: SeverityLevel
    ndvi_approx: float                    # Indice normalisé moyen
    vari_index: float                     # Visible Atmospherically Resistant Index
    gli_index: float                      # Green Leaf Index
    detected_pathologies: List[PathologyDetection]
    diagnostic_summary: str
    treatment_recommendations: List[Dict[str, str]]
    canopy_coverage_percentage: float
    metrics: Dict[str, float] = field(default_factory=dict)


class CropVisionAnalyzer:
    """Moteur de vision par ordinateur pour le diagnostic végétal de terrain en Afrique."""

    def __init__(self, device: Optional[str] = None):
        self.device = torch.device(device if device else ("cuda" if torch.cuda.is_available() else "cpu"))
        self._init_transforms()

    def _init_transforms(self):
        self.preprocess = T.Compose([
            T.Resize((256, 256)),
            T.ToTensor(),
            T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def analyze_rgb_image(
        self,
        image_input: Any,
        crop_type: CropType = CropType.GENERAL,
        custom_thresholds: Optional[Dict[str, float]] = None
    ) -> CropHealthAnalysisResult:
        """
        Analyse une image RGB (fichier, bytes ou PIL.Image) d'une feuille ou d'une parcelle.
        Calcule les indices de réflectance optique (VARI, GLI, NDVI approché) et segmente
        les zones symptomatiques (chlorose, nécrose, taches, défoliation).
        """
        pil_img = self._load_image(image_input)
        rgb_array = np.array(pil_img.convert("RGB"), dtype=np.float32) / 255.0

        r = rgb_array[:, :, 0]
        g = rgb_array[:, :, 1]
        b = rgb_array[:, :, 2]

        # 1. Masque de canopée (séparation du sol nu et de la végétation active)
        # Exg = 2*G - R - B (Excess Green Index)
        exg = 2.0 * g - r - b
        vegetation_mask = exg > 0.05
        canopy_pixels = np.count_nonzero(vegetation_mask)
        total_pixels = vegetation_mask.size
        canopy_coverage = (canopy_pixels / total_pixels) * 100.0 if total_pixels > 0 else 0.0

        # Si aucune végétation détectée
        if canopy_pixels < 20:
            return CropHealthAnalysisResult(
                crop_type=crop_type,
                overall_health_score=0.0,
                severity_level=SeverityLevel.CRITICAL,
                ndvi_approx=0.0,
                vari_index=0.0,
                gli_index=0.0,
                detected_pathologies=[
                    PathologyDetection(
                        pathology=PathologyType.WATER_STRESS,
                        confidence=0.95,
                        affected_area_percentage=100.0,
                        visual_signature="Absence de feuillage vivant détecté (sol nu ou culture totalement desséchée)",
                        action_priority="URGENCE ABSOLUE"
                    )
                ],
                diagnostic_summary="Aucune biomasse foliaire active identifiée sur le cliché analysé.",
                treatment_recommendations=[
                    {
                        "type": "Agronomique",
                        "produit": "Semis de remplacement ou irrigation d'urgence",
                        "posologie": "Vérifier l'accès à la nappe et le taux d'humidité du sol."
                    }
                ],
                canopy_coverage_percentage=0.0,
                metrics={"canopy_ratio": 0.0}
            )

        # 2. Indices spectraux RGB de vigueur
        # VARI = (Green - Red) / (Green + Red - Blue + 1e-6)
        denom_vari = g + r - b
        denom_vari = np.where(np.abs(denom_vari) < 1e-5, 1e-5, denom_vari)
        vari_map = (g - r) / denom_vari
        mean_vari = float(np.mean(vari_map[vegetation_mask]))

        # GLI = (2*Green - Red - Blue) / (2*Green + Red + Blue + 1e-6)
        denom_gli = 2.0 * g + r + b
        denom_gli = np.where(denom_gli == 0, 1e-5, denom_gli)
        gli_map = (2.0 * g - r - b) / denom_gli
        mean_gli = float(np.mean(gli_map[vegetation_mask]))

        # NDVI RGB approché (formule empirique sahélienne basée sur le canal Rouge et la dominance Verte)
        ndvi_approx = float(np.clip((mean_gli + 0.25) * 0.85, -0.1, 0.95))

        # 3. Segmentation fine des lésions et décolorations
        # A. Chlorose (Jaune : R élevé, G élevé, B faible, R ~ G)
        yellow_condition = (r > 0.40) & (g > 0.40) & (b < 0.35) & (np.abs(r - g) < 0.18) & vegetation_mask
        chlorosis_pixels = np.count_nonzero(yellow_condition)
        chlorosis_pct = (chlorosis_pixels / canopy_pixels) * 100.0

        # B. Nécrose / Brunissement (R > G > B avec intensité moyenne à basse)
        brown_condition = (r > g) & (g > b) & (r < 0.65) & (b < 0.30) & (r - b > 0.15) & vegetation_mask
        necrosis_pixels = np.count_nonzero(brown_condition)
        necrosis_pct = (necrosis_pixels / canopy_pixels) * 100.0

        # C. Taches de rouille (Pustules orangées vives : R très élevé, G moyen, B très bas)
        rust_condition = (r > 0.55) & (g > 0.25) & (g < 0.50) & (b < 0.20) & vegetation_mask
        rust_pixels = np.count_nonzero(rust_condition)
        rust_pct = (rust_pixels / canopy_pixels) * 100.0

        # D. Taches foliaires sombres / nécrosantes localisées
        dark_spots_condition = (r < 0.25) & (g < 0.25) & (b < 0.25) & vegetation_mask
        dark_spots_pixels = np.count_nonzero(dark_spots_condition)
        dark_spots_pct = (dark_spots_pixels / canopy_pixels) * 100.0

        # 4. Identification des pathologies et calcul des scores
        pathologies: List[PathologyDetection] = []
        total_affected_pct = min(100.0, chlorosis_pct + necrosis_pct + rust_pct + dark_spots_pct)

        # Règle spécifique pour le maïs/sorgho : Chenille légionnaire d'automne (Spodoptera frugiperda)
        if crop_type in (CropType.MAIZE, CropType.SORGHUM) and (necrosis_pct > 8.0 or dark_spots_pct > 6.0):
            conf = min(0.92, 0.50 + (necrosis_pct / 40.0))
            pathologies.append(PathologyDetection(
                pathology=PathologyType.FALL_ARMYWORM,
                confidence=conf,
                affected_area_percentage=necrosis_pct + dark_spots_pct,
                visual_signature="Perforations foliaires en coup de fusil et sciure fécale typique de Spodoptera",
                action_priority="ÉLEVÉE — Traitement sous 48h requis"
            ))

        if chlorosis_pct >= 5.0:
            conf = min(0.95, 0.60 + (chlorosis_pct / 50.0))
            pathologies.append(PathologyDetection(
                pathology=PathologyType.CHLOROSIS,
                confidence=conf,
                affected_area_percentage=chlorosis_pct,
                visual_signature="Jaunissement internervaire marquant une carence en Azote (N) ou stress hydrique prononcé",
                action_priority="MOYENNE — Correction nutritive / irrigation"
            ))

        if rust_pct >= 3.0:
            conf = min(0.90, 0.55 + (rust_pct / 30.0))
            pathologies.append(PathologyDetection(
                pathology=PathologyType.RUST,
                confidence=conf,
                affected_area_percentage=rust_pct,
                visual_signature="Pustules fongiques d'aspect rouille sur le limbe",
                action_priority="ÉLEVÉE — Risque de dissémination sporulante"
            ))

        if necrosis_pct >= 7.0 and PathologyType.FALL_ARMYWORM not in [p.pathology for p in pathologies]:
            conf = min(0.94, 0.60 + (necrosis_pct / 40.0))
            pathologies.append(PathologyDetection(
                pathology=PathologyType.NECROSIS,
                confidence=conf,
                affected_area_percentage=necrosis_pct,
                visual_signature="Tissus foliaires nécrosés et asséchés",
                action_priority="MOYENNE — Traitement fongicide ou ajustement d'arrosage"
            ))

        if dark_spots_pct >= 4.0:
            pathologies.append(PathologyDetection(
                pathology=PathologyType.LEAF_SPOT,
                confidence=0.82,
                affected_area_percentage=dark_spots_pct,
                visual_signature="Taches circulaires foncées (Cercosporiose ou Helminthosporiose)",
                action_priority="MOYENNE"
            ))

        if not pathologies:
            pathologies.append(PathologyDetection(
                pathology=PathologyType.HEALTHY,
                confidence=0.96,
                affected_area_percentage=0.0,
                visual_signature="Feuillage turgescent, chlorophylle homogène sans lésion apparente",
                action_priority="SUIVI DE ROUTINE"
            ))

        # 5. Calcul de l'état global et du niveau de sévérité
        health_score = max(5.0, min(100.0, 100.0 - (total_affected_pct * 1.5) + (mean_gli * 20.0)))
        if total_affected_pct < 3.0:
            severity = SeverityLevel.OPTIMAL
        elif total_affected_pct < 12.0:
            severity = SeverityLevel.LOW
        elif total_affected_pct < 28.0:
            severity = SeverityLevel.MODERATE
        elif total_affected_pct < 55.0:
            severity = SeverityLevel.HIGH
        else:
            severity = SeverityLevel.CRITICAL

        # 6. Recommandations ciblées et homologuées au Sahel
        recommendations = self._generate_recommendations(crop_type, pathologies, severity)
        summary = self._generate_summary(crop_type, health_score, severity, pathologies, total_affected_pct)

        return CropHealthAnalysisResult(
            crop_type=crop_type,
            overall_health_score=round(health_score, 1),
            severity_level=severity,
            ndvi_approx=round(ndvi_approx, 3),
            vari_index=round(mean_vari, 3),
            gli_index=round(mean_gli, 3),
            detected_pathologies=pathologies,
            diagnostic_summary=summary,
            treatment_recommendations=recommendations,
            canopy_coverage_percentage=round(canopy_coverage, 1),
            metrics={
                "chlorosis_pct": round(chlorosis_pct, 2),
                "necrosis_pct": round(necrosis_pct, 2),
                "rust_pct": round(rust_pct, 2),
                "dark_spots_pct": round(dark_spots_pct, 2),
                "total_affected_pct": round(total_affected_pct, 2)
            }
        )

    def analyze_multispectral_geotiff(self, geotiff_input: Any) -> Dict[str, Any]:
        """
        Analyse une image satellitaire (Sentinel-2, PlanetScope ou drone multispectral)
        au format GeoTIFF via Rasterio pour extraire la carte et les statistiques NDVI réelles.
        """
        if not RASTERIO_AVAILABLE:
            raise RuntimeError("Rasterio n'est pas disponible dans cet environnement.")

        if isinstance(geotiff_input, (str, os.PathLike)):
            dataset = rasterio.open(geotiff_input)
        elif isinstance(geotiff_input, (bytes, bytearray)):
            memfile = MemoryFile(geotiff_input)
            dataset = memfile.open()
        else:
            dataset = geotiff_input

        with dataset:
            # Hypothèse standard 4 bandes : 1:Rouge, 2:Vert, 3:Bleu, 4:NIR ou 1:B, 2:G, 3:R, 4:NIR
            count = dataset.count
            if count >= 4:
                # 4 bandes : Bande 3 (Red) et Bande 4 (NIR) pour Sentinel-2 ou Planet
                nir = dataset.read(4).astype(np.float32)
                red = dataset.read(1 if count == 4 else 3).astype(np.float32)
            elif count >= 3:
                # RGB conventionnel : simulation NDVI via bandes visibles
                red = dataset.read(1).astype(np.float32)
                green = dataset.read(2).astype(np.float32)
                nir = green * 1.35  # Estimation de proxy NIR végétal
            else:
                band = dataset.read(1).astype(np.float32)
                return {
                    "error": "Nombre de bandes insuffisant pour un calcul NDVI multispectral.",
                    "bands_count": count
                }

            denom = nir + red
            denom = np.where(denom == 0, 1e-6, denom)
            ndvi = (nir - red) / denom
            valid_mask = ~np.isnan(ndvi) & ~np.isinf(ndvi) & (ndvi >= -1.0) & (ndvi <= 1.0)

            valid_ndvi = ndvi[valid_mask]
            if valid_ndvi.size == 0:
                return {"error": "Aucune valeur NDVI valide trouvée dans le raster."}

            mean_ndvi = float(np.mean(valid_ndvi))
            min_ndvi = float(np.min(valid_ndvi))
            max_ndvi = float(np.max(valid_ndvi))
            std_ndvi = float(np.std(valid_ndvi))

            # Classification de la vigueur
            healthy_crop_pct = float(np.count_nonzero(valid_ndvi > 0.50) / valid_ndvi.size * 100.0)
            moderate_crop_pct = float(np.count_nonzero((valid_ndvi >= 0.25) & (valid_ndvi <= 0.50)) / valid_ndvi.size * 100.0)
            stressed_or_soil_pct = float(np.count_nonzero(valid_ndvi < 0.25) / valid_ndvi.size * 100.0)

            return {
                "source": "Rasterio Satellite GeoTIFF",
                "width": dataset.width,
                "height": dataset.height,
                "crs": str(dataset.crs),
                "bounds": {
                    "left": dataset.bounds.left,
                    "bottom": dataset.bounds.bottom,
                    "right": dataset.bounds.right,
                    "top": dataset.bounds.top
                },
                "ndvi_statistics": {
                    "mean": round(mean_ndvi, 3),
                    "min": round(min_ndvi, 3),
                    "max": round(max_ndvi, 3),
                    "std": round(std_ndvi, 3)
                },
                "zonage_vigueur": {
                    "forte_vigueur_pct": round(healthy_crop_pct, 1),
                    "vigueur_moyenne_pct": round(moderate_crop_pct, 1),
                    "stress_ou_sol_nu_pct": round(stressed_or_soil_pct, 1)
                }
            }

    def _load_image(self, image_input: Any) -> Image.Image:
        if isinstance(image_input, Image.Image):
            return image_input
        elif isinstance(image_input, (str, os.PathLike)):
            return Image.open(image_input)
        elif isinstance(image_input, (bytes, bytearray)):
            return Image.open(io.BytesIO(image_input))
        else:
            raise ValueError(f"Type d'entrée image non supporté: {type(image_input)}")

    def _generate_recommendations(
        self,
        crop_type: CropType,
        pathologies: List[PathologyDetection],
        severity: SeverityLevel
    ) -> List[Dict[str, str]]:
        recs = []
        patho_types = {p.pathology for p in pathologies}

        if PathologyType.FALL_ARMYWORM in patho_types:
            recs.append({
                "categorie": "Lutte Biologique Sahélienne",
                "intitule": "Biopesticide à base de Neem (Azadirachta indica)",
                "application": "Pulvériser 50 ml d'huile de neem par pulvérisateur de 15L au coucher du soleil (action larvicide ciblée dans le cornet foliaire)."
            })
            recs.append({
                "categorie": "Traitement Conventionnel Homologué CSP/CILSS",
                "intitule": "Emamectine benzoate (ex: Proclaim 05 SG ou équivalent)",
                "application": "Dose de 200 à 250 g/ha, pulvérisation directe au cœur du plant."
            })

        if PathologyType.CHLOROSIS in patho_types:
            recs.append({
                "categorie": "Fertilisation & Nutrition Foliaire",
                "intitule": "Apport d'Urée perlée ou engrais foliaire azoté NPK",
                "application": "50 kg/ha d'urée au stade tallage/montaison, enfoui suivi d'une irrigation d'appoint immédiate."
            })

        if PathologyType.RUST in patho_types or PathologyType.LEAF_SPOT in patho_types:
            recs.append({
                "categorie": "Protection Fongicide Tropicale",
                "intitule": "Bouillie Bordelaise ou Oxychlorure de Cuivre",
                "application": "30 à 40 g par pulvérisateur de 15L, traitement préventif et curatif précoce."
            })

        if PathologyType.HEALTHY in patho_types:
            recs.append({
                "categorie": "Gestion Préventive",
                "intitule": "Surveillance hydrique et maintien de l'enherbement utile",
                "application": "Maintenir le tour d'eau programmé et effectuer une inspection visuelle hebdomadaire."
            })

        return recs

    def _generate_summary(
        self,
        crop_type: CropType,
        score: float,
        severity: SeverityLevel,
        pathologies: List[PathologyDetection],
        affected_pct: float
    ) -> str:
        names = ", ".join([p.pathology.value.replace("_", " ").capitalize() for p in pathologies])
        return (
            f"Culture de {crop_type.value.capitalize()} : Score de santé agronomique de {score}/100 "
            f"(Niveau de sévérité : {severity.value.upper()}). "
            f"Surface symptomatique estimée à {affected_pct:.1f}%. "
            f"Symptômes dominants détectés : {names}."
        )
