import pytest
from nafa.field_suite import (
    AfricanFieldSuiteEngine,
    GeodesicGPSPoint,
    AfricanUTMZone,
    PipeMaterial,
    IrrigationMethod
)


def test_gps_surveying_precision():
    engine = AfricanFieldSuiteEngine()
    # Polygone GPS autour de Bobo-Dioulasso (Zone 30N) ~ 1 hectare
    pts = [
        GeodesicGPSPoint(latitude=11.1780, longitude=-4.2980),
        GeodesicGPSPoint(latitude=11.1790, longitude=-4.2980),
        GeodesicGPSPoint(latitude=11.1790, longitude=-4.2970),
        GeodesicGPSPoint(latitude=11.1780, longitude=-4.2970),
    ]
    res = engine.survey_land_gps(pts, utm_zone=AfricanUTMZone.ZONE_30N)

    assert res.points_count == 4
    assert res.area_m2 > 8000.0
    assert res.area_hectares > 0.8
    assert res.perimeter_m > 300.0
    assert 11.1780 <= res.centroid_lat <= 11.1790
    assert -4.2980 <= res.centroid_lon <= -4.2970


def test_fao56_water_needs_calculation():
    engine = AfricanFieldSuiteEngine()
    res = engine.calculate_fao56_water_needs(
        crop_name="mais",
        growth_stage="mi_saison",
        plot_area_m2=10000.0, # 1 ha
        temp_max_c=36.0,
        temp_min_c=22.0,
        irrigation_method=IrrigationMethod.DRIP,
        pump_flow_rate_m3_h=6.0
    )

    assert res.kc_coefficient == 1.20
    assert res.et0_reference_mm_day > 4.0
    assert res.etc_crop_water_need_mm_day > 4.5
    assert res.gross_volume_required_m3_day > 40.0
    assert res.recommended_watering_duration_hours > 5.0


def test_hydraulics_and_solar_sizing():
    engine = AfricanFieldSuiteEngine()
    res = engine.calculate_hydraulics_and_solar(
        flow_rate_m3_h=8.0,
        pipe_length_m=150.0,
        pipe_diameter_inner_mm=45.0,
        static_lift_elevation_m=20.0,
        outlets_count=20,
        material=PipeMaterial.PEHD,
        service_pressure_bar=1.0
    )

    assert res.flow_velocity_m_s > 0.5  # Vitesse anti-sédimentation
    assert res.is_velocity_compliant
    assert res.linear_head_loss_m > 0.0
    assert res.christiansen_f_factor < 1.0  # F < 1 pour multi-sorties
    assert res.total_dynamic_head_hmt_m > 25.0
    assert res.required_solar_pv_power_wc > 1000  # Puissance solaire cohérente


def test_engineering_quote_and_full_report():
    engine = AfricanFieldSuiteEngine()
    pts = [
        GeodesicGPSPoint(latitude=12.350, longitude=-1.520),
        GeodesicGPSPoint(latitude=12.351, longitude=-1.520),
        GeodesicGPSPoint(latitude=12.351, longitude=-1.519),
        GeodesicGPSPoint(latitude=12.350, longitude=-1.519),
    ]
    survey = engine.survey_land_gps(pts)
    hydraulics = engine.calculate_hydraulics_and_solar(
        flow_rate_m3_h=5.0,
        pipe_length_m=100.0,
        pipe_diameter_inner_mm=45.0
    )
    quote = engine.generate_engineering_quote(
        client_name="Oumar Ouedraogo",
        project_location="Kamboinsé, Burkina Faso",
        survey=survey,
        hydraulics=hydraulics,
        drip_pipe_meters=4500.0,
        include_solar=True
    )

    assert quote.total_ttc_fcfa > 1000000  # Devis réaliste en FCFA
    assert len(quote.items) >= 5

    water = engine.calculate_fao56_water_needs(
        crop_name="tomate",
        growth_stage="mi_saison",
        plot_area_m2=survey.area_m2
    )

    report = engine.build_full_intervention_report(
        expert_name="Dr. Idrissa Traore",
        expert_title="Ingénieur Agronome Principal",
        client_name="Oumar Ouedraogo",
        project_location="Kamboinsé",
        survey=survey,
        water_needs=water,
        hydraulics=hydraulics,
        quote=quote
    )

    assert "RAPPORT OFFICIEL D'INTERVENTION" in report.markdown_content
    assert str(quote.total_ttc_fcfa) in report.markdown_content or f"{quote.total_ttc_fcfa:,}" in report.markdown_content
