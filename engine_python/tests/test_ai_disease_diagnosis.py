import numpy as np
from PIL import Image
import pytest
from nafa.ai_disease_diagnosis import (
    AIDiseaseDiagnosticEngine,
    DomainType,
    PathogenKind,
    LikelihoodRank
)


def test_plant_diagnosis_armyworm_with_image():
    engine = AIDiseaseDiagnosticEngine()
    # Image simulant une feuille de maïs verte avec perforations et nécrose brune
    w, h = 220, 220
    arr = np.zeros((h, w, 3), dtype=np.uint8)
    arr[:, :, 1] = 160  # Fond vert
    arr[:, :, 0] = 40
    arr[:, :, 2] = 30
    # Ajouter des lésions nécrotiques perforées
    arr[60:110, 80:140, 0] = 120 # Brun nécrose
    arr[60:110, 80:140, 1] = 80
    arr[60:110, 80:140, 2] = 20
    img = Image.fromarray(arr)

    res = engine.diagnose(
        domain=DomainType.PLANT,
        host_target="mais",
        image_input=img,
        observed_symptoms_text="feuilles criblées de trous avec présence de sciure dans le cornet",
        field_temperature_c=34.0,
        field_humidity_pct=60.0
    )

    assert res.domain == DomainType.PLANT
    assert res.host_target == "mais"
    assert res.primary_hypothesis.case_id == "MAIS_ARMYWORM"
    assert res.primary_hypothesis.scientific_name == "Spodoptera frugiperda"
    assert res.primary_hypothesis.plausibility_score_pct > 70.0
    assert "Y" in res.primary_hypothesis.recommended_field_test or "cornet" in res.primary_hypothesis.recommended_field_test
    assert res.primary_hypothesis.biological_protocol is not None
    assert "Neem" in res.primary_hypothesis.biological_protocol.name
    assert res.primary_hypothesis.chemical_or_veterinary_protocol is not None
    assert "Emamectine" in res.primary_hypothesis.chemical_or_veterinary_protocol.name or "benzoate" in res.primary_hypothesis.chemical_or_veterinary_protocol.active_molecule.lower()


def test_plant_diagnosis_bacterial_wilt_vs_late_blight():
    engine = AIDiseaseDiagnosticEngine()
    res = engine.diagnose(
        domain=DomainType.PLANT,
        host_target="tomate",
        observed_symptoms_text="flétrissement brutal complet en pleine journée alors que le feuillage est encore vert",
        field_temperature_c=35.0,
        field_humidity_pct=55.0
    )

    assert res.primary_hypothesis.case_id == "TOMATE_BACTERIAL_WILT"
    assert res.primary_hypothesis.scientific_name == "Ralstonia solanacearum"
    assert "VERRE D'EAU" in res.primary_hypothesis.recommended_field_test.upper()
    assert len(res.differential_hypotheses) > 0


def test_veterinary_diagnosis_ppr_small_ruminants():
    engine = AIDiseaseDiagnosticEngine()
    res = engine.diagnose(
        domain=DomainType.VETERINARY,
        host_target="ovin",
        observed_symptoms_text="forte fièvre à 41°C, jetage purulent aux naseaux, croûtes, stomatite et diarrhée profuse",
        field_temperature_c=36.0,
        field_humidity_pct=40.0
    )

    assert res.domain == DomainType.VETERINARY
    assert res.primary_hypothesis.case_id == "VET_PPR"
    assert "Morbillivirus" in res.primary_hypothesis.scientific_name
    assert res.primary_hypothesis.chemical_or_veterinary_protocol is not None
    assert "Oxytétracycline" in res.primary_hypothesis.chemical_or_veterinary_protocol.name
    assert "VACCINATION" in res.primary_hypothesis.prophylactic_measures[0].upper()


def test_veterinary_diagnosis_avian_newcastle():
    engine = AIDiseaseDiagnosticEngine()
    res = engine.diagnose(
        domain=DomainType.VETERINARY,
        host_target="poulet_chair",
        observed_symptoms_text="mortalité foudroyante dans le poulailler, torticolis, fientes verdâtres brillantes",
        field_temperature_c=32.0,
        field_humidity_pct=65.0
    )

    assert res.domain == DomainType.VETERINARY
    assert res.primary_hypothesis.case_id == "VET_NEWCASTLE"
    assert "torticolis" in res.primary_hypothesis.matching_symptoms[1].lower() or "neurologique" in res.primary_hypothesis.matching_symptoms[1].lower()
    assert "La Sota" in res.primary_hypothesis.prophylactic_measures[0] or "I-2" in res.primary_hypothesis.prophylactic_measures[0]


def test_diagnose_from_single_photo_auto_detect():
    engine = AIDiseaseDiagnosticEngine()
    # Image simulant une feuille avec perforations
    w, h = 200, 200
    arr = np.zeros((h, w, 3), dtype=np.uint8)
    arr[:, :, 1] = 170 # Vert
    arr[:, :, 0] = 30
    arr[:, :, 2] = 20
    # Nécrose de morsure
    arr[50:100, 50:100, 0] = 110
    arr[50:100, 50:100, 1] = 70
    arr[50:100, 50:100, 2] = 15
    img = Image.fromarray(arr)

    res = engine.diagnose_from_single_photo(img)

    # 1. Spéculation détectée
    assert "Maïs" in res.speculation or "Céréale" in res.speculation
    # 2. Partie atteinte
    assert "Feuille" in res.partie_atteinte
    # 3. Maladie
    assert "Chenille" in res.maladie or "Légionnaire" in res.maladie
    # 4. Agent causal
    assert "Spodoptera frugiperda" in res.agent_causal
    # 5. Symptômes
    assert len(res.symptomes) >= 2
    assert res.confidence_pct > 60.0
