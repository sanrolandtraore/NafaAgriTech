import numpy as np
from PIL import Image
import pytest
from nafa.crops_vision import CropVisionAnalyzer, CropType, PathologyType, SeverityLevel


def test_crops_vision_healthy_image():
    # Création d'une image synthétique verte saine
    w, h = 200, 200
    arr = np.zeros((h, w, 3), dtype=np.uint8)
    arr[:, :, 1] = 180  # Vert dominant
    arr[:, :, 0] = 40   # Rouge faible
    arr[:, :, 2] = 30   # Bleu faible
    img = Image.fromarray(arr)

    analyzer = CropVisionAnalyzer()
    res = analyzer.analyze_rgb_image(img, crop_type=CropType.MAIZE)

    assert res.crop_type == CropType.MAIZE
    assert res.overall_health_score > 70.0
    assert res.canopy_coverage_percentage > 90.0
    assert res.severity_level in (SeverityLevel.OPTIMAL, SeverityLevel.LOW)
    assert len(res.treatment_recommendations) > 0


def test_crops_vision_chlorosis_detection():
    # Création d'une image avec jaunissement prononcé (chlorose : R élevé, G élevé, B bas)
    w, h = 200, 200
    arr = np.zeros((h, w, 3), dtype=np.uint8)
    arr[:, :, 0] = 200  # Rouge
    arr[:, :, 1] = 195  # Vert (jaune)
    arr[:, :, 2] = 40   # Bleu bas
    img = Image.fromarray(arr)

    analyzer = CropVisionAnalyzer()
    res = analyzer.analyze_rgb_image(img, crop_type=CropType.TOMATO)

    patho_types = [p.pathology for p in res.detected_pathologies]
    assert PathologyType.CHLOROSIS in patho_types
    assert res.metrics["chlorosis_pct"] > 10.0
    assert any("Urée" in r["intitule"] or "Azote" in r["intitule"] for r in res.treatment_recommendations)


def test_crops_vision_empty_or_dry_soil():
    # Image sans végétation (sol nu noir/gris)
    w, h = 100, 100
    arr = np.full((h, w, 3), 40, dtype=np.uint8)
    img = Image.fromarray(arr)

    analyzer = CropVisionAnalyzer()
    res = analyzer.analyze_rgb_image(img, crop_type=CropType.COWPEA)

    assert res.canopy_coverage_percentage == 0.0
    assert res.overall_health_score == 0.0
    assert res.severity_level == SeverityLevel.CRITICAL
