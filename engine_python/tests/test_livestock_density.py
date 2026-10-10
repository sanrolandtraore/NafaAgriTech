import numpy as np
from PIL import Image
import pytest
from nafa.livestock_density import LivestockDensityEngine, AnimalSpecies, THIStatus


def test_livestock_density_optimal():
    engine = LivestockDensityEngine()
    # 500 poulets de chair dans 100 m² (densité = 5.0 sujets/m² <= 10.0 max)
    res = engine.analyze_density(
        species=AnimalSpecies.POULTRY_BROILER,
        enclosure_area_m2=100.0,
        total_heads=500,
        temperature_celsius=29.0,
        relative_humidity_pct=40.0
    )

    assert not res.is_overcrowded
    assert res.calculated_density_heads_per_m2 == 5.0
    assert res.recommended_density_max == 10.0
    assert res.total_ubt == 5.0  # 500 * 0.010 = 5.0 UBT
    assert res.bioclimatic_audit.thi_status in (THIStatus.COMFORT, THIStatus.ALERT)


def test_livestock_density_overcrowding():
    engine = LivestockDensityEngine()
    # 1500 poulets de chair dans 100 m² (densité = 15.0 > 10.0 max)
    res = engine.analyze_density(
        species=AnimalSpecies.POULTRY_BROILER,
        enclosure_area_m2=100.0,
        total_heads=1500,
        temperature_celsius=38.0,
        relative_humidity_pct=60.0
    )

    assert res.is_overcrowded
    assert res.calculated_density_heads_per_m2 == 15.0
    assert res.density_ratio_pct > 100.0
    # THI à 38°C et 60% HR
    assert res.bioclimatic_audit.thi_status in (THIStatus.DANGER, THIStatus.EMERGENCY)
    assert len(res.bioclimatic_audit.zootechnical_alerts) > 0
    assert any("Délester" in r["mesure"] for r in res.veterinary_recommendations)


def test_livestock_visual_counting():
    # Synthèse d'une image avec plusieurs points d'animaux clairs sur fond sombre
    w, h = 300, 300
    arr = np.full((h, w), 30, dtype=np.uint8)
    # Ajouter des silhouettes
    for cx, cy in [(50, 50), (120, 80), (200, 60), (100, 200), (220, 220)]:
        arr[cy-8:cy+8, cx-8:cx+8] = 230
    img = Image.fromarray(arr)

    engine = LivestockDensityEngine()
    count_res = engine.detect_and_count_from_image(img, species=AnimalSpecies.POULTRY_BROILER)

    assert count_res.head_count >= 3
    assert count_res.confidence_mean > 0.60
    assert len(count_res.detections) == count_res.head_count
