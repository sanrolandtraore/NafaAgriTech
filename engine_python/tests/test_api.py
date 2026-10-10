import io
import numpy as np
from PIL import Image
import pytest
from starlette.testclient import TestClient
from nafa.api import app


@pytest.fixture
def client():
    return TestClient(app)


def test_api_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert len(data["modules"]) == 4


def test_api_crops_analyze_image(client):
    arr = np.zeros((100, 100, 3), dtype=np.uint8)
    arr[:, :, 1] = 190
    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    response = client.post(
        "/api/crops/analyze-image",
        files={"file": ("leaf.jpg", buf, "image/jpeg")},
        data={"crop_type": "mais"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["crop_type"] == "mais"
    assert "overall_health_score" in data
    assert "treatment_recommendations" in data


def test_api_livestock_audit(client):
    payload = {
        "species": "poulet_chair",
        "enclosure_area_m2": 150.0,
        "total_heads": 1200,
        "temperature_celsius": 32.0,
        "relative_humidity_pct": 50.0
    }
    response = client.post("/api/livestock/audit-density", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_heads"] == 1200
    assert data["calculated_density_heads_per_m2"] == 8.0
    assert not data["is_overcrowded"]
    assert "bioclimatic_audit" in data


def test_api_modeling_building_3d(client):
    payload = {
        "structure_type": "poulailler_bioclimatique",
        "length_m": 20.0,
        "width_m": 7.0,
        "wall_height_m": 2.2,
        "ridge_height_m": 3.4
    }
    response = client.post("/api/modeling/building-3d", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["ground_footprint_m2"] == 140.0
    assert "mesh_obj_string" in data
    assert "v " in data["mesh_obj_string"]


def test_api_field_suite_survey_gps(client):
    payload = {
        "points": [
            {"latitude": 12.350, "longitude": -1.520},
            {"latitude": 12.351, "longitude": -1.520},
            {"latitude": 12.351, "longitude": -1.519},
            {"latitude": 12.350, "longitude": -1.519}
        ],
        "utm_zone": 30
    }
    response = client.post("/api/field-suite/survey-gps", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["points_count"] == 4
    assert data["area_m2"] > 5000.0
