import pytest
from nafa.universal_copilot import (
    UniversalNafaCopilotEngine,
    UserSessionContext,
    UserRoleProfile
)


def test_copilot_profile_recognition():
    engine = UniversalNafaCopilotEngine()

    assert engine.resolve_profile("agriculteur") == UserRoleProfile.AGRICULTEUR
    assert engine.resolve_profile("eleveur") == UserRoleProfile.ELEVEUR
    assert engine.resolve_profile("agronome") == UserRoleProfile.AGRONOME
    assert engine.resolve_profile("veterinaire") == UserRoleProfile.VETERINAIRE
    assert engine.resolve_profile("fournisseur") == UserRoleProfile.FOURNISSEUR
    assert engine.resolve_profile("partenaire", partner_type="finance") == UserRoleProfile.INSTITUTION_AGRI
    assert engine.resolve_profile(None) == UserRoleProfile.GUEST


def test_copilot_greeting_and_personalized_assistance():
    engine = UniversalNafaCopilotEngine()

    # Session Éleveur
    session_eleveur = UserSessionContext(
        full_name="Ousmane Diallo",
        role=UserRoleProfile.ELEVEUR,
        locality="Dori"
    )
    res_eleveur = engine.assist("Bonjour", session_eleveur)
    assert "Ousmane Diallo" in res_eleveur.personalized_greeting
    assert "cheptel" in res_eleveur.reply.lower()
    assert res_eleveur.detected_profile == "eleveur"
    assert any(a["target_route"] == "/dashboard/animals" for a in res_eleveur.suggested_actions)

    # Session Ingénieur Agronome
    session_agronome = UserSessionContext(
        full_name="Dr. Aminata Traoré",
        role=UserRoleProfile.AGRONOME,
        company_name="Bureau Sahel Agro-Conseil"
    )
    res_agronome = engine.assist("Que peux-tu faire pour moi ?", session_agronome)
    assert "Dr. Aminata Traoré" in res_agronome.personalized_greeting
    assert "CAO" in res_agronome.reply or "Shapely" in res_agronome.reply
    assert res_agronome.detected_profile == "agronome"


def test_copilot_real_disease_and_treatment_response():
    engine = UniversalNafaCopilotEngine()

    session = UserSessionContext(full_name="Seydou Sawadogo", role=UserRoleProfile.AGRICULTEUR)
    res = engine.assist("J'ai des chenilles qui mangent le cornet de mes feuilles de maïs", session)

    assert "Spodoptera frugiperda" in res.reply
    assert "Azadirachtine" in res.reply or "Neem" in res.reply
    assert "Émamectine Benzoate" in res.reply or "Emastar" in res.reply
    assert "Y" in res.reply  # Test de confirmation de la marque en Y
    assert "INERA" in res.factual_sources[0] or "CSP-CILSS" in res.factual_sources[1]


def test_copilot_real_hydraulics_response():
    engine = UniversalNafaCopilotEngine()

    session = UserSessionContext(full_name="Moussa Kaboré", role=UserRoleProfile.AGRONOME)
    res = engine.assist("Comment dimensionner les pertes de charge et la pompe solaire pour l'irrigation ?", session)

    assert "Hazen-Williams" in res.reply
    assert "Christiansen" in res.reply
    assert "HMT" in res.reply
    assert res.category == "hydraulique"


def test_copilot_real_pricing_response():
    engine = UniversalNafaCopilotEngine()

    session = UserSessionContext(full_name="Issa Ouédraogo", role=UserRoleProfile.AGRICULTEUR)
    res = engine.assist("Quel est le coût et le prix d'un forage et d'un château d'eau en FCFA ?", session)

    assert "FCFA" in res.reply
    assert "3 500 000" in res.reply or "Forage" in res.reply
    assert "Château d'eau" in res.reply
    assert res.category == "finance"
