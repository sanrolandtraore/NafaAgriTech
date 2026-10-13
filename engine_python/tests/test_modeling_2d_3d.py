import pytest
from nafa.modeling_2d_3d import (
    AgronomicCAD3DEngine,
    StructureType,
    Building3DSpecs,
    Point3D,
    Mesh3D,
    RealCADAccessoriesLibrary
)


def test_parcel_2d_modeling_and_drip():
    engine = AgronomicCAD3DEngine()
    # Parcelle rectangulaire 100m x 50m (5000 m² = 0.5 ha)
    coords = [(0.0, 0.0), (100.0, 0.0), (100.0, 50.0), (0.0, 50.0), (0.0, 0.0)]
    res = engine.model_parcel_and_irrigation_2d(
        boundary_coords=coords,
        lateral_spacing_m=1.0,
        emitter_spacing_m=0.30,
        elevation_start_m=300.0,
        elevation_end_m=298.0
    )

    assert res.area_m2 == 5000.0
    assert res.area_hectares == 0.5
    assert res.perimeter_m == 300.0
    assert res.drip_lines_count > 40
    assert res.total_drip_pipe_length_m > 4000.0
    assert res.topography_slope_pct > 0.0
    assert "<svg" in res.svg_technical_plan
    assert "polygon_geojson" in res.__dict__
    assert res.manifold_pipe_length_m > 0
    assert res.hydraulic_sectors_count >= 2
    assert "SECTION" in res.dxf_2d_content


def test_building_3d_modeling_and_obj_export():
    engine = AgronomicCAD3DEngine()
    # Poulailler bioclimatique 24m x 8m, hauteur gouttereau 2.4m, faîtage 3.6m
    specs = Building3DSpecs(
        structure_type=StructureType.BIOCLIMATIC_POULTRY_HOUSE,
        length_m=24.0,
        width_m=8.0,
        wall_height_m=2.40,
        ridge_height_m=3.60,
        roof_overhang_m=1.20,
        include_accessories=True
    )
    res = engine.model_bioclimatic_building_3d(specs, annual_rainfall_mm=800.0)

    assert res.ground_footprint_m2 == 192.0  # 24 * 8
    assert res.usable_air_volume_m3 > 500.0
    assert res.developed_roof_surface_m2 > 200.0
    assert res.rainwater_harvesting_potential_m3_year > 100.0
    assert res.ventilation_openings_surface_m2 > 50.0

    # Vérification syntaxe Wavefront OBJ et MTL
    obj_str = res.mesh_obj_string
    assert "o poulailler_bioclimatique" in obj_str
    assert "v " in obj_str
    assert "f " in obj_str
    assert res.vertices_count >= 10
    assert res.faces_count >= 5
    assert "newmtl" in res.mtl_string

    # Vérification des composants et de la nomenclature (BOM)
    assert len(res.structural_bom) >= 5
    assert any("béton armé" in item["element"] for item in res.structural_bom)
    assert len(res.accessories_included) >= 2


def test_cad_real_accessories_library():
    lib = RealCADAccessoriesLibrary()

    # Château d'eau
    wt = lib.create_water_tower(height_stand_m=5.0, tank_diameter_m=2.2, tank_height_m=2.0)
    assert len(wt.vertices) > 20
    assert len(wt.faces) > 10
    assert wt.material_name == "acier_galvanise"

    # Champ solaire
    pv = lib.create_solar_panel_array(panel_count=6, tilt_angle_deg=15.0)
    assert len(pv.vertices) > 8
    assert pv.material_name == "silicium_solaire"

    # Tête de réseau irrigation
    head = lib.create_irrigation_head_unit()
    assert len(head.vertices) > 16
    assert head.material_name == "pehd_fonte_irrigation"
