"""
NAFA AGRITECH — API REST FastAPI pour le Moteur Scientifique & Ingénierie
Expose l'ensemble des modules Agronome, Vétérinaire, CAO 2D/3D et Intervention Terrain.
"""

from typing import List, Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .crops_vision import CropVisionAnalyzer, CropType
from .livestock_density import LivestockDensityEngine, AnimalSpecies
from .modeling_2d_3d import AgronomicCAD3DEngine, StructureType, Building3DSpecs
from .field_suite import (
    AfricanFieldSuiteEngine,
    GeodesicGPSPoint,
    AfricanUTMZone,
    PipeMaterial,
    IrrigationMethod,
    LandSurveyResult
)
from .ai_disease_diagnosis import AIDiseaseDiagnosticEngine, DomainType

app = FastAPI(
    title="NAFA AGRITECH — Scientific & Engineering Engine API",
    description="API haute performance pour la santé des cultures, la zootechnie vétérinaire, la modélisation 2D/3D et l'intervention terrain en Afrique.",
    version="1.0.0"
)

# CORS pour autoriser l'UI React (Vite / localhost et production nafaagritech.app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

crops_analyzer = CropVisionAnalyzer()
livestock_engine = LivestockDensityEngine()
cad_engine = AgronomicCAD3DEngine()
field_engine = AfricanFieldSuiteEngine()
diagnosis_engine = AIDiseaseDiagnosticEngine()


# =============================================================================
# SCHEMAS PYDANTIC
# =============================================================================
class GPSPointSchema(BaseModel):
    latitude: float
    longitude: float
    altitude_m: float = 0.0


class LandSurveyRequest(BaseModel):
    points: List[GPSPointSchema]
    utm_zone: int = 30


class FAO56Request(BaseModel):
    crop_name: str = "mais"
    growth_stage: str = "mi_saison"
    plot_area_m2: float = 10000.0
    temp_max_c: float = 38.0
    temp_min_c: float = 24.0
    radiation_ra_mj_m2_day: float = 38.0
    irrigation_method: str = "goutte_a_goutte"
    pump_flow_rate_m3_h: float = 5.0


class HydraulicRequest(BaseModel):
    flow_rate_m3_h: float = 5.0
    pipe_length_m: float = 120.0
    pipe_diameter_inner_mm: float = 45.0
    static_lift_elevation_m: float = 15.0
    outlets_count: int = 25
    material: str = "pehd"
    service_pressure_bar: float = 1.0


class Building3DRequest(BaseModel):
    structure_type: str = "poulailler_bioclimatique"
    length_m: float = 24.0
    width_m: float = 8.0
    wall_height_m: float = 2.40
    ridge_height_m: float = 3.60
    roof_overhang_m: float = 1.20
    muret_height_m: float = 0.50
    annual_rainfall_mm: float = 750.0


class Parcel2DRequest(BaseModel):
    boundary_coords: List[List[float]]
    lateral_spacing_m: float = 1.0
    emitter_spacing_m: float = 0.30
    elevation_start_m: float = 300.0
    elevation_end_m: float = 298.5


class LivestockDensityRequest(BaseModel):
    species: str = "poulet_chair"
    enclosure_area_m2: float = 120.0
    total_heads: Optional[int] = 1200
    temperature_celsius: float = 34.0
    relative_humidity_pct: float = 50.0


# =============================================================================
# ENDPOINTS
# =============================================================================
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "NAFA-AGRITECH Scientific & Engineering Engine",
        "modules": [
            "crops_vision (PyTorch, TorchVision)",
            "livestock_density (Zootechnie, THI, UBT)",
            "modeling_2d_3d (Shapely, GeoPandas, Wavefront OBJ)",
            "field_suite (GPS UTM, FAO-56, Hazen-Williams, BPU FCFA)"
        ]
    }


# --- AGRONOMIE & VISION ---
@app.post("/api/crops/analyze-image")
async def analyze_crop_image(
    file: UploadFile = File(...),
    crop_type: str = Form("general")
):
    try:
        content = await file.read()
        res = crops_analyzer.analyze_rgb_image(
            image_input=content,
            crop_type=CropType(crop_type)
        )
        return {
            "crop_type": res.crop_type.value,
            "overall_health_score": res.overall_health_score,
            "severity_level": res.severity_level.value,
            "ndvi_approx": res.ndvi_approx,
            "vari_index": res.vari_index,
            "gli_index": res.gli_index,
            "canopy_coverage_percentage": res.canopy_coverage_percentage,
            "diagnostic_summary": res.diagnostic_summary,
            "detected_pathologies": [
                {
                    "pathology": p.pathology.value,
                    "confidence": p.confidence,
                    "affected_area_percentage": p.affected_area_percentage,
                    "visual_signature": p.visual_signature,
                    "action_priority": p.action_priority
                }
                for p in res.detected_pathologies
            ],
            "treatment_recommendations": res.treatment_recommendations,
            "metrics": res.metrics
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# --- VÉTÉRINAIRE & ÉLEVAGE ---
@app.post("/api/livestock/audit-density")
def audit_livestock_density(req: LivestockDensityRequest):
    try:
        species_enum = AnimalSpecies(req.species)
        res = livestock_engine.analyze_density(
            species=species_enum,
            enclosure_area_m2=req.enclosure_area_m2,
            total_heads=req.total_heads,
            temperature_celsius=req.temperature_celsius,
            relative_humidity_pct=req.relative_humidity_pct
        )
        return {
            "species": res.species.value,
            "total_heads": res.total_heads,
            "enclosure_area_m2": res.enclosure_area_m2,
            "calculated_density_heads_per_m2": res.calculated_density_heads_per_m2,
            "recommended_density_max": res.recommended_density_max,
            "density_ratio_pct": res.density_ratio_pct,
            "is_overcrowded": res.is_overcrowded,
            "total_ubt": res.total_ubt,
            "pastoral_pressure_index": res.pastoral_pressure_index,
            "bioclimatic_audit": {
                "temperature_celsius": res.bioclimatic_audit.temperature_celsius,
                "relative_humidity_pct": res.bioclimatic_audit.relative_humidity_pct,
                "thi_index": res.bioclimatic_audit.thi_index,
                "thi_status": res.bioclimatic_audit.thi_status.value,
                "water_requirements_total_liters_day": res.bioclimatic_audit.water_requirements_total_liters_day,
                "ventilation_required_m3_hour": res.bioclimatic_audit.ventilation_required_m3_hour,
                "zootechnical_alerts": res.bioclimatic_audit.zootechnical_alerts,
                "corrective_actions": res.bioclimatic_audit.corrective_actions
            },
            "veterinary_recommendations": res.veterinary_recommendations
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# --- MODÉLISATION 2D & 3D ---
@app.post("/api/modeling/parcel-2d")
def model_parcel_2d(req: Parcel2DRequest):
    try:
        coords = [(pt[0], pt[1]) for pt in req.boundary_coords]
        res = cad_engine.model_parcel_and_irrigation_2d(
            boundary_coords=coords,
            lateral_spacing_m=req.lateral_spacing_m,
            emitter_spacing_m=req.emitter_spacing_m,
            elevation_start_m=req.elevation_start_m,
            elevation_end_m=req.elevation_end_m
        )
        return {
            "area_m2": res.area_m2,
            "area_hectares": res.area_hectares,
            "perimeter_m": res.perimeter_m,
            "centroid": res.centroid,
            "drip_lines_count": res.drip_lines_count,
            "total_drip_pipe_length_m": res.total_drip_pipe_length_m,
            "topography_slope_pct": res.topography_slope_pct,
            "elevation_drop_m": res.elevation_drop_m,
            "polygon_geojson": res.polygon_geojson,
            "drip_lines_geojson": res.drip_lines_geojson,
            "svg_technical_plan": res.svg_technical_plan
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/modeling/building-3d")
def model_building_3d(req: Building3DRequest):
    try:
        specs = Building3DSpecs(
            structure_type=StructureType(req.structure_type),
            length_m=req.length_m,
            width_m=req.width_m,
            wall_height_m=req.wall_height_m,
            ridge_height_m=req.ridge_height_m,
            roof_overhang_m=req.roof_overhang_m,
            muret_height_m=req.muret_height_m
        )
        res = cad_engine.model_bioclimatic_building_3d(
            specs=specs,
            annual_rainfall_mm=req.annual_rainfall_mm
        )
        return {
            "ground_footprint_m2": res.ground_footprint_m2,
            "usable_air_volume_m3": res.usable_air_volume_m3,
            "developed_roof_surface_m2": res.developed_roof_surface_m2,
            "rainwater_harvesting_potential_m3_year": res.rainwater_harvesting_potential_m3_year,
            "ventilation_openings_surface_m2": res.ventilation_openings_surface_m2,
            "vertices_count": res.vertices_count,
            "faces_count": res.faces_count,
            "mesh_obj_string": res.mesh_obj_string
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# --- SUITE TERRAIN AFRICAINE ---
@app.post("/api/field-suite/survey-gps")
def survey_gps(req: LandSurveyRequest):
    try:
        pts = [GeodesicGPSPoint(latitude=p.latitude, longitude=p.longitude, altitude_m=p.altitude_m) for p in req.points]
        res = field_engine.survey_land_gps(pts, utm_zone=AfricanUTMZone(req.utm_zone))
        return {
            "points_count": res.points_count,
            "utm_zone": res.utm_zone.value,
            "area_m2": res.area_m2,
            "area_hectares": res.area_hectares,
            "perimeter_m": res.perimeter_m,
            "centroid_lat": res.centroid_lat,
            "centroid_lon": res.centroid_lon,
            "bounding_box_meters": res.bounding_box_meters,
            "precision_gps_estimated_m": res.precision_gps_estimated_m
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/field-suite/fao56-water")
def calculate_water_needs(req: FAO56Request):
    try:
        res = field_engine.calculate_fao56_water_needs(
            crop_name=req.crop_name,
            growth_stage=req.growth_stage,
            plot_area_m2=req.plot_area_m2,
            temp_max_c=req.temp_max_c,
            temp_min_c=req.temp_min_c,
            radiation_ra_mj_m2_day=req.radiation_ra_mj_m2_day,
            irrigation_method=IrrigationMethod(req.irrigation_method),
            pump_flow_rate_m3_h=req.pump_flow_rate_m3_h
        )
        return {
            "crop_name": res.crop_name,
            "growth_stage": res.growth_stage,
            "kc_coefficient": res.kc_coefficient,
            "et0_reference_mm_day": res.et0_reference_mm_day,
            "etc_crop_water_need_mm_day": res.etc_crop_water_need_mm_day,
            "daily_volume_m3_hectare": res.daily_volume_m3_hectare,
            "total_volume_for_plot_m3_day": res.total_volume_for_plot_m3_day,
            "gross_volume_required_m3_day": res.gross_volume_required_m3_day,
            "recommended_watering_duration_hours": res.recommended_watering_duration_hours
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/field-suite/hydraulics")
def calculate_hydraulics(req: HydraulicRequest):
    try:
        res = field_engine.calculate_hydraulics_and_solar(
            flow_rate_m3_h=req.flow_rate_m3_h,
            pipe_length_m=req.pipe_length_m,
            pipe_diameter_inner_mm=req.pipe_diameter_inner_mm,
            static_lift_elevation_m=req.static_lift_elevation_m,
            outlets_count=req.outlets_count,
            material=PipeMaterial(req.material),
            service_pressure_bar=req.service_pressure_bar
        )
        return {
            "flow_rate_m3_h": res.flow_rate_m3_h,
            "pipe_length_m": res.pipe_length_m,
            "pipe_diameter_inner_mm": res.pipe_diameter_inner_mm,
            "flow_velocity_m_s": res.flow_velocity_m_s,
            "linear_head_loss_m": res.linear_head_loss_m,
            "christiansen_f_factor": res.christiansen_f_factor,
            "total_head_loss_m": res.total_head_loss_m,
            "total_dynamic_head_hmt_m": res.total_dynamic_head_hmt_m,
            "pressure_at_critical_point_bar": res.pressure_at_critical_point_bar,
            "required_solar_pv_power_wc": res.required_solar_pv_power_wc,
            "is_velocity_compliant": res.is_velocity_compliant,
            "velocity_warning": res.velocity_warning
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# --- DIAGNOSTIC PATHOLOGIQUE IA EXPERT (VÉGÉTAL & VÉTÉRINAIRE) ---
@app.post("/api/diagnosis/pathology")
async def diagnose_pathology(
    domain: str = Form("vegetal"),
    host_target: str = Form("mais"),
    symptoms_text: Optional[str] = Form(None),
    temperature_c: float = Form(33.0),
    humidity_pct: float = Form(65.0),
    file: Optional[UploadFile] = File(None)
):
    try:
        content = await file.read() if file else None
        res = diagnosis_engine.diagnose(
            domain=DomainType(domain),
            host_target=host_target,
            image_input=content,
            observed_symptoms_text=symptoms_text,
            field_temperature_c=temperature_c,
            field_humidity_pct=humidity_pct
        )

        visual_feat = None
        if res.visual_features:
            visual_feat = {
                "canopy_or_tissue_pixels": res.visual_features.canopy_or_tissue_pixels,
                "lesion_coverage_pct": res.visual_features.lesion_coverage_pct,
                "chlorosis_pct": res.visual_features.chlorosis_pct,
                "necrosis_pct": res.visual_features.necrosis_pct,
                "rust_pct": res.visual_features.rust_pct,
                "concentric_rings_detected": res.visual_features.concentric_rings_detected,
                "linear_streak_detected": res.visual_features.linear_streak_detected,
                "jagged_perforations_detected": res.visual_features.jagged_perforations_detected,
                "texture_roughness_score": res.visual_features.texture_roughness_score,
                "dominant_rgb_lesion": list(res.visual_features.dominant_rgb_lesion),
                "hsv_hue_mean": res.visual_features.hsv_hue_mean,
            }

        def serialize_hypo(h):
            return {
                "case_id": h.case_id,
                "name_fr": h.name_fr,
                "scientific_name": h.scientific_name,
                "pathogen_kind": h.pathogen_kind.value,
                "likelihood_rank": h.likelihood_rank.value,
                "plausibility_score_pct": h.plausibility_score_pct,
                "matching_symptoms": h.matching_symptoms,
                "differential_clues": h.differential_clues,
                "recommended_field_test": h.recommended_field_test,
                "biological_protocol": {
                    "name": h.biological_protocol.name,
                    "active_molecule": h.biological_protocol.active_molecule,
                    "dosage": h.biological_protocol.dosage,
                    "mode_of_action": h.biological_protocol.mode_of_action,
                    "pre_harvest_or_withdrawal_delay": h.biological_protocol.pre_harvest_or_withdrawal_delay,
                    "approval_status": h.biological_protocol.approval_status
                } if h.biological_protocol else None,
                "chemical_or_veterinary_protocol": {
                    "name": h.chemical_or_veterinary_protocol.name,
                    "active_molecule": h.chemical_or_veterinary_protocol.active_molecule,
                    "dosage": h.chemical_or_veterinary_protocol.dosage,
                    "mode_of_action": h.chemical_or_veterinary_protocol.mode_of_action,
                    "pre_harvest_or_withdrawal_delay": h.chemical_or_veterinary_protocol.pre_harvest_or_withdrawal_delay,
                    "approval_status": h.chemical_or_veterinary_protocol.approval_status
                } if h.chemical_or_veterinary_protocol else None,
                "prophylactic_measures": h.prophylactic_measures,
                "epidemiological_risk": h.epidemiological_risk
            }

        return {
            "domain": res.domain.value,
            "host_target": res.host_target,
            "image_analyzed": res.image_analyzed,
            "visual_features": visual_feat,
            "primary_hypothesis": serialize_hypo(res.primary_hypothesis),
            "differential_hypotheses": [serialize_hypo(h) for h in res.differential_hypotheses],
            "uncertainty_level": res.uncertainty_level,
            "field_confirmation_needed": res.field_confirmation_needed,
            "clarification_questions": res.clarification_questions,
            "technical_synthesis": res.technical_synthesis
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
