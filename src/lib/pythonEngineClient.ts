/**
 * NAFA AGRITECH — Client d'intégration du Moteur Python Haute Performance
 * Connecte le frontend React aux microservices et calculs scientifiques Python
 * (PyTorch Vision, Shapely/GeoPandas 2D/3D CAO, Zootechnie Vétérinaire, Hydraulique et Arpentage UTM).
 */

export const PYTHON_ENGINE_BASE_URL =
  import.meta.env.VITE_PYTHON_ENGINE_URL || "http://127.0.0.1:8000";

export interface PythonEngineHealth {
  status: string;
  service: string;
  modules: string[];
}

export interface PythonCropPathology {
  pathology: string;
  confidence: number;
  affected_area_percentage: number;
  visual_signature: string;
  action_priority: string;
}

export interface PythonCropHealthResult {
  crop_type: string;
  overall_health_score: number;
  severity_level: "optimal" | "faible" | "modere" | "eleve" | "critique";
  ndvi_approx: number;
  vari_index: number;
  gli_index: number;
  canopy_coverage_percentage: number;
  diagnostic_summary: string;
  detected_pathologies: PythonCropPathology[];
  treatment_recommendations: Array<{
    categorie?: string;
    intitule?: string;
    application?: string;
    type?: string;
    produit?: string;
    posologie?: string;
  }>;
  metrics: Record<string, number>;
}

export interface PythonLivestockAuditResult {
  species: string;
  total_heads: number;
  enclosure_area_m2: number;
  calculated_density_heads_per_m2: number;
  recommended_density_max: number;
  density_ratio_pct: number;
  is_overcrowded: boolean;
  total_ubt: number;
  pastoral_pressure_index: string;
  bioclimatic_audit: {
    temperature_celsius: number;
    relative_humidity_pct: number;
    thi_index: number;
    thi_status: "confort" | "alerte" | "danger" | "urgence_vitale";
    water_requirements_total_liters_day: number;
    ventilation_required_m3_hour: number;
    zootechnical_alerts: string[];
    corrective_actions: string[];
  };
  veterinary_recommendations: Array<{
    domaine: string;
    mesure: string;
    urgence: string;
  }>;
}

export interface PythonParcel2DResult {
  area_m2: number;
  area_hectares: number;
  perimeter_m: number;
  centroid: [number, number];
  drip_lines_count: number;
  total_drip_pipe_length_m: number;
  topography_slope_pct: number;
  elevation_drop_m: number;
  manifold_pipe_length_m?: number;
  hydraulic_sectors_count?: number;
  polygon_geojson: Record<string, any>;
  drip_lines_geojson: Record<string, any>;
  svg_technical_plan: string;
  dxf_2d_content?: string;
}

export interface PythonBuilding3DResult {
  ground_footprint_m2: number;
  usable_air_volume_m3: number;
  developed_roof_surface_m2: number;
  rainwater_harvesting_potential_m3_year: number;
  ventilation_openings_surface_m2: number;
  vertices_count: number;
  faces_count: number;
  mesh_obj_string: string;
  mtl_string?: string;
  structural_bom?: Array<{
    element: string;
    quantite: number;
    unite: string;
    detail: string;
  }>;
  accessories_included?: Array<Record<string, any>>;
}

export interface PythonGPSPoint {
  latitude: number;
  longitude: number;
  altitude_m?: number;
}

export interface PythonLandSurveyResult {
  points_count: number;
  utm_zone: number;
  area_m2: number;
  area_hectares: number;
  perimeter_m: number;
  centroid_lat: number;
  centroid_lon: number;
  bounding_box_meters: [number, number];
  precision_gps_estimated_m: number;
}

export interface PythonHydraulicResult {
  flow_rate_m3_h: number;
  pipe_length_m: number;
  pipe_diameter_inner_mm: number;
  flow_velocity_m_s: number;
  linear_head_loss_m: number;
  christiansen_f_factor: number;
  total_head_loss_m: number;
  total_dynamic_head_hmt_m: number;
  pressure_at_critical_point_bar: number;
  required_solar_pv_power_wc: number;
  is_velocity_compliant: boolean;
  velocity_warning?: string | null;
}

export const pythonEngineClient = {
  /**
   * Vérifie la disponibilité du serveur Python en local ou distant
   */
  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${PYTHON_ENGINE_BASE_URL}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(1500),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Vérifie la santé et la liste des modules scientifiques actifs
   */
  async getHealth(): Promise<PythonEngineHealth | null> {
    try {
      const res = await fetch(`${PYTHON_ENGINE_BASE_URL}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(2000),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Analyse de santé foliaire et détection de maladies par PyTorch / Computer Vision
   */
  async analyzeCropImage(file: File | Blob, cropType: string = "general"): Promise<PythonCropHealthResult> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("crop_type", cropType);

    const res = await fetch(`${PYTHON_ENGINE_BASE_URL}/api/crops/analyze-image`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Erreur analyse vision Python : ${errorText}`);
    }

    return await res.json();
  },

  /**
   * Audit zootechnique vétérinaire : Densité animale, indice de stress thermique THI et besoins en eau
   */
  async auditLivestockDensity(params: {
    species: string;
    enclosure_area_m2: number;
    total_heads?: number;
    temperature_celsius?: number;
    relative_humidity_pct?: number;
  }): Promise<PythonLivestockAuditResult> {
    const res = await fetch(`${PYTHON_ENGINE_BASE_URL}/api/livestock/audit-density`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Erreur audit élevage Python : ${errorText}`);
    }

    return await res.json();
  },

  /**
   * Modélisation SIG & CAO 2D parcellaire (Shapely / GeoPandas) avec implantation automatique des rampes
   */
  async modelParcel2D(params: {
    boundary_coords: number[][];
    lateral_spacing_m?: number;
    emitter_spacing_m?: number;
    elevation_start_m?: number;
    elevation_end_m?: number;
  }): Promise<PythonParcel2DResult> {
    const res = await fetch(`${PYTHON_ENGINE_BASE_URL}/api/modeling/parcel-2d`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Erreur modélisation 2D Python : ${errorText}`);
    }

    return await res.json();
  },

  /**
   * Modélisation architecturale 3D de bâtiment d'élevage (Export Wavefront OBJ pour Three.js / CAD)
   */
  async modelBuilding3D(params: {
    structure_type?: string;
    length_m: number;
    width_m: number;
    wall_height_m: number;
    ridge_height_m: number;
    roof_overhang_m?: number;
    muret_height_m?: number;
    annual_rainfall_mm?: number;
  }): Promise<PythonBuilding3DResult> {
    const res = await fetch(`${PYTHON_ENGINE_BASE_URL}/api/modeling/building-3d`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Erreur modélisation 3D Python : ${errorText}`);
    }

    return await res.json();
  },

  /**
   * Arpentage géodésique GPS UTM (Fuseau 30N/31N) et calcul métrique de superficie
   */
  async surveyGPS(points: PythonGPSPoint[], utmZone: number = 30): Promise<PythonLandSurveyResult> {
    const res = await fetch(`${PYTHON_ENGINE_BASE_URL}/api/field-suite/survey-gps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points, utm_zone: utmZone }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Erreur arpentage GPS Python : ${errorText}`);
    }

    return await res.json();
  },

  /**
   * Calcul hydraulique de précision Hazen-Williams, Christiansen et dimensionnement pompe solaire
   */
  async calculateHydraulics(params: {
    flow_rate_m3_h: number;
    pipe_length_m: number;
    pipe_diameter_inner_mm: number;
    static_lift_elevation_m?: number;
    outlets_count?: number;
    material?: string;
    service_pressure_bar?: number;
  }): Promise<PythonHydraulicResult> {
    const res = await fetch(`${PYTHON_ENGINE_BASE_URL}/api/field-suite/hydraulics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Erreur hydraulique Python : ${errorText}`);
    }

    return await res.json();
  },

  /**
   * Diagnostic pathologique IA expert (cultures et élevage) avec vision et analyse épidémiologique différentielle
   */
  async diagnosePathology(params: {
    domain: "vegetal" | "animal";
    host_target: string;
    symptoms_text?: string;
    temperature_c?: number;
    humidity_pct?: number;
    file?: File | Blob;
  }): Promise<{
    domain: string;
    host_target: string;
    image_analyzed: boolean;
    visual_features?: Record<string, any> | null;
    primary_hypothesis: {
      case_id: string;
      name_fr: string;
      scientific_name: string;
      pathogen_kind: string;
      likelihood_rank: string;
      plausibility_score_pct: number;
      matching_symptoms: string[];
      differential_clues: string;
      recommended_field_test: string;
      biological_protocol?: {
        name: string;
        active_molecule: string;
        dosage: string;
        mode_of_action: string;
        pre_harvest_or_withdrawal_delay: string;
        approval_status: string;
      } | null;
      chemical_or_veterinary_protocol?: {
        name: string;
        active_molecule: string;
        dosage: string;
        mode_of_action: string;
        pre_harvest_or_withdrawal_delay: string;
        approval_status: string;
      } | null;
      prophylactic_measures: string[];
      epidemiological_risk: string;
    };
    differential_hypotheses: Array<any>;
    uncertainty_level: string;
    field_confirmation_needed: boolean;
    clarification_questions: Array<{ id: string; question: string; action: string }>;
    technical_synthesis: string;
  }> {
    const formData = new FormData();
    formData.append("domain", params.domain);
    formData.append("host_target", params.host_target);
    if (params.symptoms_text) formData.append("symptoms_text", params.symptoms_text);
    if (params.temperature_c !== undefined) formData.append("temperature_c", params.temperature_c.toString());
    if (params.humidity_pct !== undefined) formData.append("humidity_pct", params.humidity_pct.toString());
    if (params.file) formData.append("file", params.file);

    const res = await fetch(`${PYTHON_ENGINE_BASE_URL}/api/diagnosis/pathology`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Erreur diagnostic IA pathologique Python : ${errorText}`);
    }

    return await res.json();
  },

  /**
   * Diagnostic automatique instantané 1-clic à partir de la photo seule :
   * Détermine directement la spéculation, la partie atteinte (tige, racine, feuille...),
   * la maladie, l'agent causal et les symptômes mesurés.
   */
  async diagnoseAutoPhoto(
    file: File | Blob,
    options?: { temperature_c?: number; humidity_pct?: number }
  ): Promise<{
    speculation: string;
    domain: "vegetal" | "animal";
    partie_atteinte: string;
    partie_code: string;
    maladie: string;
    agent_causal: string;
    pathogen_kind: string;
    symptomes: string[];
    confidence_pct: number;
    mesures_immediates: string[];
    traitement_bio?: {
      nom: string;
      substance_active: string;
      dosage: string;
      mode_action: string;
      delai_attente: string;
      statut: string;
    } | null;
    traitement_chimique_ou_veterinaire?: {
      nom: string;
      substance_active: string;
      dosage: string;
      mode_action: string;
      delai_attente: string;
      statut: string;
    } | null;
    test_confirmation_terrain: string;
  }> {
    const formData = new FormData();
    formData.append("file", file);
    if (options?.temperature_c !== undefined) {
      formData.append("temperature_c", options.temperature_c.toString());
    }
    if (options?.humidity_pct !== undefined) {
      formData.append("humidity_pct", options.humidity_pct.toString());
    }

    const res = await fetch(`${PYTHON_ENGINE_BASE_URL}/api/diagnosis/auto-detect`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Erreur analyse photo automatique : ${errorText}`);
    }

    return await res.json();
  },
};
