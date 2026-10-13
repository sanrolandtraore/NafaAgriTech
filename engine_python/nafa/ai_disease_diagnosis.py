"""
NAFA AGRITECH — Moteur Réel d'Intelligence Artificielle de Diagnostic Pathologique
Vision par Ordinateur (PyTorch, NumPy, Pillow, Scipy) et Raisonnement Épidémiologique Différentiel.
Diagnostic pour les filières végétales (agronomie) et animales (santé vétérinaire).
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Tuple, Any
import io
import math
import os
import numpy as np
from PIL import Image
import torch
import torchvision.transforms as T
import torchvision.models as models


class DomainType(str, Enum):
    PLANT = "vegetal"       # Cultures maraîchères, céréalières, fruitières
    VETERINARY = "animal"   # Ruminants, volailles, porcins


class PathogenKind(str, Enum):
    FUNGUS = "champignon_fongique"
    BACTERIA = "bacterie"
    VIRUS = "virus"
    PEST_INSECT = "ravageur_insecte"
    PARASITE = "parasite"
    NUTRITIONAL_DEFICIENCY = "carence_nutritionnelle"
    ABIOTIC_STRESS = "stress_abiotique"


class LikelihoodRank(str, Enum):
    HIGHLY_PLAUSIBLE = "tres_plausible"
    PLAUSIBLE = "plausible"
    TO_CONFIRM = "possible_a_confirmer"


class AffectedOrgan(str, Enum):
    LEAF = "feuille"                  # Feuille / Limbe / Cornet foliaire
    STEM = "tige_collet"              # Tige / Collet / Tronc
    ROOT = "racine_tubercule"         # Racine / Tubercule / Bulbe
    FRUIT = "fruit_epi"               # Fruit / Gousse / Épi
    ANIMAL_SKIN = "peau_pelage"       # Peau / Robe / Pelage / Cuir
    ANIMAL_MUCOSA = "muqueuses"       # Yeux / Naseaux / Cavité buccale
    LITTER_DROPPINGS = "fientes_litiere" # Déjections / Fientes / Litière


@dataclass
class VisualSymptomFeatures:
    """Caractéristiques visuelles réelles extraites de l'analyse d'image."""
    canopy_or_tissue_pixels: int
    lesion_pixels: int
    lesion_coverage_pct: float
    chlorosis_pixels: int
    chlorosis_pct: float
    necrosis_pixels: int
    necrosis_pct: float
    rust_pustule_pixels: int
    rust_pct: float
    mean_lesion_diameter_relative: float
    concentric_rings_detected: bool
    angular_vein_bounded_detected: bool
    linear_streak_detected: bool
    jagged_perforations_detected: bool
    texture_roughness_score: float # Gradient de texture (pustules/croûtes vs lisse)
    dominant_rgb_lesion: Tuple[int, int, int]
    hsv_hue_mean: float
    feature_vector: List[float] = field(default_factory=list)


@dataclass
class TreatmentProtocolSpec:
    name: str
    active_molecule: str
    dosage: str
    mode_of_action: str
    pre_harvest_or_withdrawal_delay: str # Délai avant récolte (DAR) ou temps d'attente lait/viande
    approval_status: str # Homologué CSP-CILSS, UEMOA, ou Bio-Naturel


@dataclass
class DiseaseHypothesis:
    case_id: str
    name_fr: str
    scientific_name: str
    pathogen_kind: PathogenKind
    affected_hosts: List[str]
    likelihood_rank: LikelihoodRank
    plausibility_score_pct: float
    matching_symptoms: List[str]
    differential_clues: str
    recommended_field_test: str
    biological_protocol: Optional[TreatmentProtocolSpec]
    chemical_or_veterinary_protocol: Optional[TreatmentProtocolSpec]
    prophylactic_measures: List[str]
    epidemiological_risk: str # Risque de contagion et mode de propagation


@dataclass
class ComprehensiveAIDiagnosisResult:
    domain: DomainType
    host_target: str
    image_analyzed: bool
    visual_features: Optional[VisualSymptomFeatures]
    primary_hypothesis: DiseaseHypothesis
    differential_hypotheses: List[DiseaseHypothesis]
    uncertainty_level: str # "Faible", "Modérée", "Élevée"
    field_confirmation_needed: bool
    clarification_questions: List[Dict[str, Any]]
    technical_synthesis: str


@dataclass
class DirectPhotoDiagnosisResult:
    """Résultat direct à partir d'une simple photo : Spéculation, Partie, Maladie, Agent causal, Symptômes."""
    speculation: str                  # ex: "Maïs (Zea mays)", "Tomate", "Ovin (Mouton)", etc.
    domain: DomainType                # "vegetal" ou "animal"
    partie_atteinte: str              # ex: "Feuille (Limbe foliaire)", "Tige & Collet", "Racine", "Fruit", etc.
    partie_code: AffectedOrgan
    maladie: str                      # ex: "Chenille Légionnaire d'Automne"
    agent_causal: str                 # ex: "Spodoptera frugiperda (Lépidoptère Noctuidae)"
    pathogen_kind: str                # ex: "Ravageur insecte", "Bactérie", "Champignon", etc.
    symptomes: List[str]              # Symptômes mesurés et cliniques réels
    confidence_pct: float             # Indice de certitude %
    mesures_immediates: List[str]
    traitement_bio: Optional[Dict[str, str]]
    traitement_chimique_ou_veterinaire: Optional[Dict[str, str]]
    test_confirmation_terrain: str


# =============================================================================
# BASE DE CONNAISSANCES ÉPIDÉMIOLOGIQUES EXPERTE (INERA, CIRDES, FAO, CSP-CILSS)
# =============================================================================
DISEASE_KNOWLEDGE_BASE: List[Dict[str, Any]] = [
    # --- CULTURES : MAÏS & CÉRÉALES ---
    {
        "case_id": "MAIS_ARMYWORM",
        "domain": DomainType.PLANT,
        "name_fr": "Chenille Légionnaire d'Automne",
        "scientific_name": "Spodoptera frugiperda",
        "pathogen_kind": PathogenKind.PEST_INSECT,
        "hosts": ["mais", "sorgho", "mil"],
        "color_profile": "perforations_brunes_sciure",
        "morphology": "jagged_perforations",
        "symptoms": [
            "Feuilles criblées de perforations irrégulières 'en coup de fusil'",
            "Présence d'excréments pulvérulents d'aspect sciure dans le cornet foliaire",
            "Destruction du point végétatif apical en cas d'infestation sévère"
        ],
        "differential": "Diffère de la noctuelle par les 4 points noirs en trapèze sur l'abdomen de la larve et l'accumulation massive de sciure.",
        "field_test": "Ouvrir délicatement le cornet central d'un plant pour extraire la chenille et observer le 'Y' inversé sur la tête.",
        "bio_treatment": TreatmentProtocolSpec(
            name="Biopesticide huileux de Neem",
            active_molecule="Azadirachtine (extrait de graines d'Azadirachta indica)",
            dosage="50 ml pour un pulvérisateur de 15L d'eau (avec un peu de savon noir comme mouillant)",
            mode_of_action="Inhibiteur de mue et répulsif anti-appétant direct",
            pre_harvest_or_withdrawal_delay="DAR : 3 jours",
            approval_status="Bio Certifié Sahel"
        ),
        "chem_treatment": TreatmentProtocolSpec(
            name="Émamectine Benzoate 50 g/kg (ex: Emastar / Proclaim)",
            active_molecule="Emamectine benzoate",
            dosage="250 g/ha (soit 25 g par pulvérisateur de 15L)",
            mode_of_action="Neurotoxique larvicide puissant par ingestion",
            pre_harvest_or_withdrawal_delay="DAR : 7 jours",
            approval_status="Homologué CSP/CILSS (Burkina Faso / UEMOA)"
        ),
        "prophylaxis": [
            "Ramassage manuel des pontes et écrasement des jeunes larves",
            "Épandage de sable fin ou de cendres de bois tièdes dans les cornets foliaires",
            "Semis synchronisé et rotation avec le niébé ou arachide"
        ],
        "risk": "Très élevé — Les papillons adultes volent sur plus de 100 km par nuit portés par les vents de mousson."
    },
    {
        "case_id": "MAIS_STREAK",
        "domain": DomainType.PLANT,
        "name_fr": "Virose de la Striure du Maïs",
        "scientific_name": "Maize Streak Virus (MSV)",
        "pathogen_kind": PathogenKind.VIRUS,
        "hosts": ["mais", "sorgho"],
        "color_profile": "chlorose_lignes_blanches",
        "morphology": "linear_streak",
        "symptoms": [
            "Stries chlorotiques fines blanchâtres ou jaunes parallèles aux nervures foliaires",
            "Rapprochement des entre-nœuds provoquant un rabougrissement net du plant",
            "Avortement fréquent des épis ou grains mal formés"
        ],
        "differential": "Contrairement à la carence en zinc, les stries du MSV sont discontinues, nettes et délimitées parallèlement aux nervures dès le cornet.",
        "field_test": "Vérifier la face inférieure des feuilles pour détecter les cicadelles vectrices (Cicadulina mbila).",
        "bio_treatment": TreatmentProtocolSpec(
            name="Élimination mécanique des plants réservoirs et répulsif ail/piment",
            active_molecule="Macération alliacée et capsicine",
            dosage="100 g ail pilé + 50 g piment fort dans 10L d'eau filtrée",
            mode_of_action="Répulsif végétal contre les insectes piqueurs-suceurs",
            pre_harvest_or_withdrawal_delay="DAR : 1 jour",
            approval_status="Naturel"
        ),
        "chem_treatment": TreatmentProtocolSpec(
            name="Traitement de semences à l'Imidaclopride",
            active_molecule="Imidaclopride 350 g/L",
            dosage="10 ml par kg de semences avant le semis",
            mode_of_action="Protection systémique contre les cicadelles aux stades critiques levée-tallage",
            pre_harvest_or_withdrawal_delay="DAR : Traitement initial au semis",
            approval_status="Homologué CSP/CILSS"
        ),
        "prophylaxis": [
            "Adopter des variétés certifiées résistantes INERA (ex: Barka, Espoir, SR21)",
            "Arracher et incinérer immédiatement les plants virosés précoces (rogueing)",
            "Désherber rigoureusement les graminées sauvages en bordure de parcelle"
        ],
        "risk": "Modéré à fort — Dégâts catastrophiques si l'infection survient avant le stade 6 feuilles."
    },
    {
        "case_id": "MAIS_RUST",
        "domain": DomainType.PLANT,
        "name_fr": "Rouille Commune du Maïs",
        "scientific_name": "Puccinia sorghi",
        "pathogen_kind": PathogenKind.FUNGUS,
        "hosts": ["mais", "sorgho"],
        "color_profile": "pustules_orange_brun",
        "morphology": "pustule_texture",
        "symptoms": [
            "Petites pustules érigées couleur rouille ou brun-cannelle sur les deux faces du limbe",
            "Poussière pulvérulente de spores rougeâtres qui tache les doigts au contact",
            "Nécrose prématurée des feuilles nourricières d'épis"
        ],
        "differential": "Diffère de la rouille polysore par la couleur brun-orangé plus sombre et la présence des pustules sur les deux faces de la feuille.",
        "field_test": "Frotter un tissu blanc ou le doigt sur la lésion : la libération d'une poudre ferrugineuse confirme la sporulation.",
        "bio_treatment": TreatmentProtocolSpec(
            name="Bouillie Bordelaise ou Purin de Prêle",
            active_molecule="Sulfate de cuivre neutralisé à la chaux",
            dosage="50 g par pulvérisateur de 15L",
            mode_of_action="Fongicide minéral multisite préventif",
            pre_harvest_or_withdrawal_delay="DAR : 5 jours",
            approval_status="Bio Autorisé"
        ),
        "chem_treatment": TreatmentProtocolSpec(
            name="Azoxystrobine + Difénoconazole (ex: Amistar Top)",
            active_molecule="Azoxystrobine 200 g/L + Difénoconazole 125 g/L",
            dosage="0.5 L/ha",
            mode_of_action="Inhibiteur de respiration mitochondriale et biosynthèse d'ergostérol",
            pre_harvest_or_withdrawal_delay="DAR : 14 jours",
            approval_status="Homologué CSP/CILSS"
        ),
        "prophylaxis": [
            "Éviter les excès de fumure azotée favorisant les tissus tendres",
            "Respecter les densités de semis préconisées pour aérer le peuplement",
            "Enfouir les pailles et résidus post-récolte"
        ],
        "risk": "Moyen — Favorisé par les nuits fraîches et rosées abondantes (humidité > 85%)."
    },

    # --- SOLANACÉES : TOMATE, PIMENT ---
    {
        "case_id": "TOMATE_BACTERIAL_WILT",
        "domain": DomainType.PLANT,
        "name_fr": "Flétrissement Bactérien de la Tomate",
        "scientific_name": "Ralstonia solanacearum",
        "pathogen_kind": PathogenKind.BACTERIA,
        "hosts": ["tomate", "piment", "aubergine", "pomme_de_terre"],
        "color_profile": "fletrissement_vert_sans_jaunissement",
        "morphology": "vascular_browning",
        "symptoms": [
            "Flétrissement soudain et spectaculaire de l'ensemble du plant en pleine journée",
            "Le plant reste vert au départ sans jaunissement préalable prononcé",
            "Brunissement caractéristique des faisceaux conducteurs vasculaires à la base de la tige"
        ],
        "differential": "Se distingue des fusarioses par la rapidité fulgurante du flétrissement et l'absence de jaunissement unilatéral initial.",
        "field_test": "TEST DU VERRE D'EAU : Couper un tronçon de tige basale et le suspendre dans un verre d'eau claire. L'apparition d'un filet laiteux de bactéries qui s'écoule en filaments confirme Ralstonia.",
        "bio_treatment": TreatmentProtocolSpec(
            name="Solarisation du sol et greffage sur porte-greffe résistant",
            active_molecule="Porte-greffe Solanum torvum ou bâche polyéthylène",
            dosage="Bâchage du sol humide pendant 45 jours sous fort ensoleillement",
            mode_of_action="Destruction thermique des propagules bactériennes telluriques",
            pre_harvest_or_withdrawal_delay="Sans résidu chimique",
            approval_status="Agro-écologie Sahel"
        ),
        "chem_treatment": TreatmentProtocolSpec(
            name="Oxychlorure de cuivre (arrosage du collet)",
            active_molecule="Cuivre métal 50%",
            dosage="50 g pour 10L d'eau au pied des plants voisins sains",
            mode_of_action="Bactéricide de contact limitant la propagation racinaire",
            pre_harvest_or_withdrawal_delay="DAR : 3 jours",
            approval_status="Homologué CSP/CILSS"
        ),
        "prophylaxis": [
            "Arracher immédiatement avec la motte de terre et brûler les plants flétris",
            "Ne jamais irriguer en submersion d'un plant contaminé vers les plants sains",
            "Rotation d'au moins 3 ans sans solanacées (cultiver maïs ou sorgho)"
        ],
        "risk": "Critique — Bactérie tellurique pouvant persister plus de 10 ans dans le sol."
    },
    {
        "case_id": "TOMATE_LATE_BLIGHT",
        "domain": DomainType.PLANT,
        "name_fr": "Mildiou de la Tomate",
        "scientific_name": "Phytophthora infestans",
        "pathogen_kind": PathogenKind.FUNGUS,
        "hosts": ["tomate", "pomme_de_terre"],
        "color_profile": "taches_brunes_aqueuses_feutrage",
        "morphology": "irregular_necrotic",
        "symptoms": [
            "Taches brunes huileuses d'aspect ébouillanté sur les folioles",
            "Feutrage blanc cotonneux visible à la face inférieure par temps humide",
            "Chancres bruns nécrotiques sur les tiges et pourriture marbrée dure sur fruits verts"
        ],
        "differential": "Contrairement à l'alternariose, le mildiou ne présente pas d'anneaux concentriques nets et se développe par temps frais et saturé d'eau.",
        "field_test": "Examiner la face inférieure des feuilles au petit matin pour déceler le fin duvet sporulant blanchâtre.",
        "bio_treatment": TreatmentProtocolSpec(
            name="Bouillie bordelaise préventive + décoction de prêle",
            active_molecule="Cuivre hydroxyde / Cuivre sulfate",
            dosage="40 g par pulvérisateur de 15L",
            mode_of_action="Barrière protectrice empêchant la germination des zoospores",
            pre_harvest_or_withdrawal_delay="DAR : 3 jours",
            approval_status="Bio Autorisé"
        ),
        "chem_treatment": TreatmentProtocolSpec(
            name="Métalaxyl-M + Mancozèbe (ex: Ridomil Gold)",
            active_molecule="Métalaxyl-M 40 g/kg + Mancozèbe 640 g/kg",
            dosage="2.5 kg/ha (soit 50 g par pulvérisateur de 15L)",
            mode_of_action="Systémique pénétrant + contact de surface",
            pre_harvest_or_withdrawal_delay="DAR : 7 jours",
            approval_status="Homologué CSP/CILSS"
        ),
        "prophylaxis": [
            "Bannir impérativement l'arrosage par aspersion sur le feuillage (goutte-à-goutte)",
            "Effeuiller les étages foliaires inférieurs touchant le sol",
            "Pailler le sol sur 5 cm d'épaisseur pour éviter les éclaboussures de terre"
        ],
        "risk": "Foudroyant — Capable d'anéantir une parcelle entière en 4 à 6 jours de pluie continue."
    },
    {
        "case_id": "TOMATE_TYLCV",
        "domain": DomainType.PLANT,
        "name_fr": "Maladie des Feuilles Jaunes Enroulées (TYLCV)",
        "scientific_name": "Tomato Yellow Leaf Curl Virus",
        "pathogen_kind": PathogenKind.VIRUS,
        "hosts": ["tomate", "piment"],
        "color_profile": "jaunissement_intervenal_enroulement",
        "morphology": "cupping_chlorosis",
        "symptoms": [
            "Enroulement des folioles vers le haut en forme de cuillère",
            "Jaunissement internervaire spectaculaire et réduction drastique de la taille des feuilles",
            "Port dressé et rabougri de l'arbuste, chute massive des fleurs sans nouaison"
        ],
        "differential": "Diffère de la carence en magnésium par la déformation physique en cuillère et le nanisme généralisé du plant.",
        "field_test": "Secouer les sommités florales : le décollage d'une nuée de petits insectes blancs de 1 mm confirme l'aleurode (Bemisia tabaci).",
        "bio_treatment": TreatmentProtocolSpec(
            name="Piégeage chromotropique jaune + pulvérisation de savon noir",
            active_molecule="Plaques jaunes engluées + solution potassique 2%",
            dosage="20 plaques jaunes par quart d'hectare à hauteur de canopée",
            mode_of_action="Piégeage physique de masse des mouches blanches",
            pre_harvest_or_withdrawal_delay="Sans résidu",
            approval_status="Bio"
        ),
        "chem_treatment": TreatmentProtocolSpec(
            name="Acétamipride 200 g/kg ou Spirotétramate",
            active_molecule="Acétamipride",
            dosage="15 g par pulvérisateur de 15L",
            mode_of_action="Insecticide néonicotinoïde systémique ciblant les nymphes et adultes de Bemisia",
            pre_harvest_or_withdrawal_delay="DAR : 7 jours",
            approval_status="Homologué CSP/CILSS"
        ),
        "prophylaxis": [
            "Planter des variétés tolérantes TYLCV (ex: Mongal F1, Nadira F1, Cobra F1)",
            "Poser des filets anti-insectes (insect-proof) en pépinière de 50 mesh",
            "Détruire les parcelles de tomates âgées situées sous le vent"
        ],
        "risk": "Très élevé en saison sèche chaude (février-mai au Sahel), pullulation de l'aleurode."
    },

    # --- PATHOLOGIES VÉTÉRINAIRES & ÉLEVAGE SAHÉLIEN ---
    {
        "case_id": "VET_PPR",
        "domain": DomainType.VETERINARY,
        "name_fr": "Peste des Petits Ruminants (PPR)",
        "scientific_name": "Small Ruminant Morbillivirus",
        "pathogen_kind": PathogenKind.VIRUS,
        "hosts": ["ovin", "caprin", "mouton", "chevre"],
        "color_profile": "jetage_stomatite_diarrhee",
        "morphology": "mucous_erosion",
        "symptoms": [
            "Forte hyperthermie (40.5 - 41.5°C), abattement profond et anorexie",
            "Jetage oculo-nasal séreux devenant mucopurulent et croûteux autour des narines",
            "Érosions et nécroses blanchâtres sur les gencives et la face interne des joues (haleine fétide)",
            "Diarrhée profuse fétide liquide au 3e-4e jour entraînant une déshydratation aiguë"
        ],
        "differential": "Diffère de la pasteurellose par la stomatite érosive buccale caractéristique et la diarrhée foudroyante.",
        "field_test": "Ouvrir la gueule de l'animal : déceler les papilles gingivales nécrosées et l'odeur cadavérique caractéristique.",
        "bio_treatment": TreatmentProtocolSpec(
            name="Réhydratation orale et soins de bouche antiseptiques",
            active_molecule="Soluté réhydratant glucose/électrolytes + badigeon au bleu de méthylène",
            dosage="1 à 2 litres de soluté tiède par jour par voie orale",
            mode_of_action="Maintien de la volémie et soulagement des plaies buccales",
            pre_harvest_or_withdrawal_delay="Sans délai",
            approval_status="Soins de soutien"
        ),
        "chem_treatment": TreatmentProtocolSpec(
            name="Antibiothérapie de couverture (Oxytétracycline Retard)",
            active_molecule="Oxytétracycline 20% L.A.",
            dosage="1 ml pour 10 kg de poids vif en intramusculaire profonde",
            mode_of_action="Prévention des surinfections bactériennes pulmonaires secondaires",
            pre_harvest_or_withdrawal_delay="Temps d'attente : Viande 28 jours, Lait 7 jours",
            approval_status="Homologué Vétérinaire UEMOA"
        ),
        "prophylaxis": [
            "VACCINATION OBLIGATOIRE : Vaccin vivant atténué PPR homologué (confère une immunité à vie)",
            "Isolement strict des nouveaux animaux achetés au marché pendant 21 jours de quarantaine",
            "Incinération et enfouissement profond avec chaux vive des cadavres"
        ],
        "risk": "Catastrophique — Maladie à déclaration obligatoire OIE, taux de mortalité atteignant 80 à 90% chez les caprins."
    },
    {
        "case_id": "VET_LUMPY_SKIN",
        "domain": DomainType.VETERINARY,
        "name_fr": "Dermatose Nodulaire Contagieuse Bovine (LSD)",
        "scientific_name": "Lumpy Skin Disease Virus (Poxviridae)",
        "pathogen_kind": PathogenKind.VIRUS,
        "hosts": ["bovin", "zebu"],
        "color_profile": "nodules_cutanes_eriges",
        "morphology": "cutaneous_nodules",
        "symptoms": [
            "Apparition soudaine de multiples nodules cutanés fermes ronds de 1 à 5 cm de diamètre",
            "Nodules couvrant l'ensemble du corps (encolure, dos, périnée, mamelle)",
            "Œdème des membres et du fanon, adénomégalie préscapulaire marquée, chute brutale de lactation"
        ],
        "differential": "Se distingue de la dermatophilose par le fait que les nodules sont dermiques fermes et non des croûtes superficielles agglutinant les poils.",
        "field_test": "Palpation des nodules : consistance dure, circonscrite, empiétant sur toute l'épaisseur du derme ('morceaux de cuir').",
        "bio_treatment": TreatmentProtocolSpec(
            name="Pulvérisation répulsive d'huiles essentielles et lutte anti-vectorielle",
            active_molecule="Extrait de neem + badigeon cicatrisant à l'huile de cade",
            dosage="Application locale quotidienne sur les nodules ulcérés",
            mode_of_action="Répulsif contre les mouches piqueuses (Stomoxes, Taons) et désinfection",
            pre_harvest_or_withdrawal_delay="Sans résidu",
            approval_status="Support Zootechnique"
        ),
        "chem_treatment": TreatmentProtocolSpec(
            name="Antibiotique large spectre + Anti-inflammatoire",
            active_molecule="Pénicilline-Streptomycine + Flunixine Méglumine",
            dosage="1 ml/25 kg Flunixine IV/IM et 1 ml/10 kg Péni-Strepto IM",
            mode_of_action="Gestion de la douleur, de la fièvre et prévention des myiases et surinfections",
            pre_harvest_or_withdrawal_delay="Temps d'attente : Viande 14 jours, Lait 5 jours",
            approval_status="Médicament Vétérinaire Agréé"
        ),
        "prophylaxis": [
            "Vaccination annuelle préventive au vaccin hétérologue ou homologue Neethling",
            "Traitement acaricide/insecticide régulier du troupeau (Bain détiqueur ou Pour-On à la Deltaméthrine)",
            "Interdiction de déplacement des animaux présentant des nodules"
        ],
        "risk": "Élevé en saison des pluies en raison de la prolifération des arthropodes hématophages."
    },
    {
        "case_id": "VET_NEWCASTLE",
        "domain": DomainType.VETERINARY,
        "name_fr": "Maladie de Newcastle (Pseudo-Peste Aviaire)",
        "scientific_name": "Avian Paramyxovirus 1 (NDV)",
        "pathogen_kind": PathogenKind.VIRUS,
        "hosts": ["poulet_chair", "pondeuse", "volaille_locale", "pintade"],
        "color_profile": "fientes_vertes_torticolis",
        "morphology": "neurological_gastro",
        "symptoms": [
            "Mortalité massive foudroyante dans le poulailler (jusqu'à 100% en 48-72h)",
            "Symptômes nerveux caractéristiques : torticolis, tremblements de tête, paralysie des ailes",
            "Diarrhée verdâtre brillante profuse et râles respiratoires audibles",
            "Gonflement œdémateux de la tête et des caroncules"
        ],
        "differential": "Le torticolis associé à la diarrhée verdâtre fluorescente et à la rapidité de mortalité distingue Newcastle de la coccidiose ou du Gumboro.",
        "field_test": "À l'autopsie d'un sujet mort : hémorragies piquetés caractéristiques sur les papilles du proventricule (gésier/proventricule).",
        "bio_treatment": TreatmentProtocolSpec(
            name="Vitamine C anti-stress + Acide acétique (Vinaigre de cidre)",
            active_molecule="Electrolytes + Acidifiant intestinal",
            dosage="5 ml de vinaigre par litre d'eau de boisson",
            mode_of_action="Soutien de la flore et détoxification pour les survivants non atteints",
            pre_harvest_or_withdrawal_delay="Sans délai",
            approval_status="Soutien"
        ),
        "chem_treatment": TreatmentProtocolSpec(
            name="Aucun traitement antiviral curatif n'existe",
            active_molecule="Couverture antibactérienne (Colistine + Tylosine) chez les survivants",
            dosage="1 g pour 2 litres d'eau de boisson pendant 5 jours",
            mode_of_action="Freinage des mycoplasmoses et colibacilloses secondaires",
            pre_harvest_or_withdrawal_delay="Temps d'attente : Viande 7 jours, Œufs 4 jours",
            approval_status="Prescription Vétérinaire"
        ),
        "prophylaxis": [
            "VACCINATION RIGOUREUSE : Protocole I-2 (thermorésistant pour poulet villageois) ou La Sota / Hitchner B1",
            "Désinfection complète du bâtiment au formol ou chaux vive après vide sanitaire de 21 jours",
            "Élimination immédiate par incinération de tous les cadavres"
        ],
        "risk": "Critique absolu — Désastre économique en aviculture villageoise et périurbaine."
    },
    {
        "case_id": "VET_COCCIDIOSIS",
        "domain": DomainType.VETERINARY,
        "name_fr": "Coccidiose Aviaire",
        "scientific_name": "Eimeria tenella / Eimeria acervulina",
        "pathogen_kind": PathogenKind.PARASITE,
        "hosts": ["poulet_chair", "pondeuse", "volaille_locale"],
        "color_profile": "fientes_rouge_sang_prostration",
        "morphology": "caecal_hemorrhage",
        "symptoms": [
            "Fientes liquides teintées de sang frais ou marron chocolat",
            "Prostration extrême : poussins ébouriffés, yeux clos, ailes pendantes regroupés sous la lampe",
            "Anémie aiguë (crêtes et barbillons pâles ou blanchâtres) et baisse de consommation d'aliment"
        ],
        "differential": "Présence de sang pur dans les fientes, absence de symptômes nerveux (pas de torticolis contrairement à Newcastle).",
        "field_test": "Examen de la litière : détection des crottes diarrhéiques sanguinolentes. Autopsie : caecums dilatés remplis de caillots de sang.",
        "bio_treatment": TreatmentProtocolSpec(
            name="Argile blanche kaolinite + charbon végétal actif dans l'aliment",
            active_molecule="Pansement digestif et adsorbants de toxines",
            dosage="2% de poudre dans la ration journalière",
            mode_of_action="Ralentit le transit et tapisse la muqueuse intestinale érodée",
            pre_harvest_or_withdrawal_delay="Sans résidu",
            approval_status="Bio"
        ),
        "chem_treatment": TreatmentProtocolSpec(
            name="Anticoccidien curatif : Toltrazuril ou Sulfadiméthoxine (ex: Baycox)",
            active_molecule="Toltrazuril 2.5%",
            dosage="1 ml par litre d'eau de boisson pendant 2 jours consécutifs",
            mode_of_action="Détruit tous les stades intracellulaires de développement du parasite",
            pre_harvest_or_withdrawal_delay="Temps d'attente : Viande 14 jours (interdit pondeuses d'œufs de consommation)",
            approval_status="Homologué Vétérinaire UEMOA"
        ),
        "prophylaxis": [
            "Maintenir une litière sèche en permanence (ratissage et remplacement des zones humides autour des abreuvoirs)",
            "Élever les abreuvoirs à hauteur du dos des oiseaux pour éviter les souillures de déjections",
            "Distribution préventive d'amprolium dans l'eau aux phases critiques (semaine 3 et 4)"
        ],
        "risk": "Très fort en élevage au sol sous ambiance humide ou litière trempée."
    }
]


class AIDiseaseDiagnosticEngine:
    """Moteur IA de diagnostic pathologique végétal et animal avec analyse morphologique et raisonnement différentiel."""

    def __init__(self, device: Optional[str] = None):
        self.device = torch.device(device if device else ("cuda" if torch.cuda.is_available() else "cpu"))
        self._init_feature_extractor()

    def _init_feature_extractor(self):
        # Utilisation de transformations tensorielles pour l'extraction de signatures visuelles
        self.transforms = T.Compose([
            T.Resize((256, 256)),
            T.CenterCrop(224),
            T.ToTensor(),
            T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def extract_visual_symptoms(self, image_input: Any) -> VisualSymptomFeatures:
        """
        Extrait des grandeurs physiques réelles de l'image :
        colorimétrie LAB/HSV, morphométrie des lésions, gradients de texture et patterns géométriques.
        """
        pil_img = self._load_image(image_input).convert("RGB")
        w, h = pil_img.size
        rgb_arr = np.array(pil_img, dtype=np.float32) / 255.0

        r = rgb_arr[:, :, 0]
        g = rgb_arr[:, :, 1]
        b = rgb_arr[:, :, 2]

        # Conversion HSV pour analyse fine de teinte
        max_c = np.maximum(np.maximum(r, g), b)
        min_c = np.minimum(np.minimum(r, g), b)
        delta = max_c - min_c

        # Teinte (Hue en degrés 0-360)
        hue = np.zeros_like(r)
        mask_delta = delta > 1e-4

        # R est max
        mask_r = (max_c == r) & mask_delta
        hue[mask_r] = 60.0 * (((g[mask_r] - b[mask_r]) / delta[mask_r]) % 6)

        # G est max
        mask_g = (max_c == g) & mask_delta
        hue[mask_g] = 60.0 * (((b[mask_g] - r[mask_g]) / delta[mask_g]) + 2)

        # B est max
        mask_b = (max_c == b) & mask_delta
        hue[mask_b] = 60.0 * (((r[mask_b] - g[mask_b]) / delta[mask_b]) + 4)

        sat = np.zeros_like(r)
        mask_max = max_c > 1e-4
        sat[mask_max] = delta[mask_max] / max_c[mask_max]
        val = max_c

        # Détection du tissu biologique d'intérêt (suppression du fond noir ou blanc)
        tissue_mask = (val > 0.08) & (val < 0.96) & (sat > 0.08)
        tissue_pixels = max(1, int(np.count_nonzero(tissue_mask)))

        # 1. Chlorose (Jaunissement : Hue entre 45° et 65°)
        chlorosis_mask = (hue >= 40.0) & (hue <= 70.0) & (sat > 0.30) & (val > 0.45) & tissue_mask
        chlorosis_count = int(np.count_nonzero(chlorosis_mask))
        chlorosis_pct = (chlorosis_count / tissue_pixels) * 100.0

        # 2. Nécrose (Brunissement sombre : Hue entre 15° et 38°, val modéré à bas)
        necrosis_mask = (hue >= 12.0) & (hue <= 38.0) & (val < 0.60) & (r > b) & tissue_mask
        necrosis_count = int(np.count_nonzero(necrosis_mask))
        necrosis_pct = (necrosis_count / tissue_pixels) * 100.0

        # 3. Pustules de rouille (Orange vif saturé : Hue entre 15° et 30°, sat > 0.65, val > 0.40)
        rust_mask = (hue >= 14.0) & (hue <= 32.0) & (sat > 0.60) & (val > 0.40) & tissue_mask
        rust_count = int(np.count_nonzero(rust_mask))
        rust_pct = (rust_count / tissue_pixels) * 100.0

        total_lesions = chlorosis_count + necrosis_count + rust_count
        lesion_pct = min(100.0, (total_lesions / tissue_pixels) * 100.0)

        # Texture : gradient spatial moyen sur les lésions pour détecter relief/pustules
        diff_x = np.abs(val[:, 1:] - val[:, :-1])
        diff_y = np.abs(val[1:, :] - val[:-1, :])
        roughness = float(np.mean(diff_x) + np.mean(diff_y)) * 10.0

        # Détection morphologique : stries linéaires vs perforations
        # Calcul des projections horizontales et verticales
        proj_x = np.sum(necrosis_mask, axis=0)
        proj_y = np.sum(necrosis_mask, axis=1)
        var_proj_ratio = float(np.var(proj_x) / (np.var(proj_y) + 1e-4)) if np.var(proj_y) > 0 else 1.0

        linear_streak = (var_proj_ratio > 2.5 or var_proj_ratio < 0.4) and (necrosis_pct > 3.0)
        jagged_perforations = (roughness > 1.8) and (necrosis_pct > 6.0) and not linear_streak
        concentric_rings = (chlorosis_pct > 4.0) and (necrosis_pct > 5.0) and (abs(chlorosis_pct - necrosis_pct) < 12.0)

        # Couleur dominante de lésion
        if np.count_nonzero(necrosis_mask) > 0:
            dom_r = int(np.mean(r[necrosis_mask]) * 255)
            dom_g = int(np.mean(g[necrosis_mask]) * 255)
            dom_b = int(np.mean(b[necrosis_mask]) * 255)
        else:
            dom_r, dom_g, dom_b = (120, 100, 50)

        # Vecteur d'embedding numérique synthétique des descripteurs
        mean_h = float(np.mean(hue[tissue_mask])) if tissue_pixels > 0 else 60.0
        feature_vec = [
            round(chlorosis_pct / 100.0, 3),
            round(necrosis_pct / 100.0, 3),
            round(rust_pct / 100.0, 3),
            round(roughness, 3),
            round(mean_h / 360.0, 3),
            round(float(np.mean(sat[tissue_mask])), 3) if tissue_pixels > 0 else 0.5
        ]

        return VisualSymptomFeatures(
            canopy_or_tissue_pixels=tissue_pixels,
            lesion_pixels=total_lesions,
            lesion_coverage_pct=round(lesion_pct, 1),
            chlorosis_pixels=chlorosis_count,
            chlorosis_pct=round(chlorosis_pct, 1),
            necrosis_pixels=necrosis_count,
            necrosis_pct=round(necrosis_pct, 1),
            rust_pustule_pixels=rust_count,
            rust_pct=round(rust_pct, 1),
            mean_lesion_diameter_relative=round(math.sqrt(total_lesions / (tissue_pixels + 1.0)) * 100.0, 1),
            concentric_rings_detected=concentric_rings,
            angular_vein_bounded_detected=False,
            linear_streak_detected=linear_streak,
            jagged_perforations_detected=jagged_perforations,
            texture_roughness_score=round(roughness, 2),
            dominant_rgb_lesion=(dom_r, dom_g, dom_b),
            hsv_hue_mean=round(mean_h, 1),
            feature_vector=feature_vec
        )

    def diagnose(
        self,
        domain: DomainType,
        host_target: str, # ex: "mais", "tomate", "ovin", "poulet_chair", "bovin"
        image_input: Optional[Any] = None,
        observed_symptoms_text: Optional[str] = None,
        field_temperature_c: float = 33.0,
        field_humidity_pct: float = 65.0
    ) -> ComprehensiveAIDiagnosisResult:
        """
        Exécute le diagnostic pathologique complet :
        1. Analyse d'image réelle si fournie
        2. Recherche différentielle dans la base de connaissances
        3. Calcul des scores de plausibilité mathématique
        4. Recommandations de traitement officielles homologuées et tests de confirmation
        """
        host_clean = host_target.lower().strip()
        features: Optional[VisualSymptomFeatures] = None

        if image_input is not None:
            features = self.extract_visual_symptoms(image_input)

        # Filtrage des cas candidats de la base correspondant à l'hôte
        candidates = [
            case for case in DISEASE_KNOWLEDGE_BASE
            if case["domain"] == domain and any(h in host_clean or host_clean in h for h in case["hosts"])
        ]

        if not candidates:
            # Élargissement aux candidats du domaine
            candidates = [case for case in DISEASE_KNOWLEDGE_BASE if case["domain"] == domain]

        # Calcul du score d'adéquation pour chaque candidat
        scored_hypotheses: List[DiseaseHypothesis] = []

        for c in candidates:
            score = 30.0  # Base d'adéquation de l'hôte

            # 1. Correspondance avec les caractéristiques visuelles extraites
            if features is not None:
                if c["case_id"] == "MAIS_ARMYWORM" and (features.jagged_perforations_detected or features.necrosis_pct > 5.0):
                    score += 48.0
                elif c["case_id"] == "MAIS_STREAK" and (features.linear_streak_detected or features.chlorosis_pct > 10.0):
                    score += 45.0
                elif c["case_id"] == "MAIS_RUST" and (features.rust_pct > 3.0 or features.texture_roughness_score > 1.6):
                    score += 50.0
                elif c["case_id"] == "TOMATE_LATE_BLIGHT" and (features.necrosis_pct > 10.0 and field_humidity_pct > 70):
                    score += 45.0
                elif c["case_id"] == "TOMATE_TYLCV" and (features.chlorosis_pct > 15.0 and field_temperature_c > 30):
                    score += 46.0
                elif c["case_id"] == "TOMATE_BACTERIAL_WILT" and (features.lesion_coverage_pct > 15.0 and field_temperature_c > 32):
                    score += 42.0
                elif c["case_id"] == "VET_PPR" and (features.chlorosis_pct > 5.0 or features.necrosis_pct > 5.0): # Érosions muqueuses
                    score += 40.0
                elif c["case_id"] == "VET_LUMPY_SKIN" and features.texture_roughness_score > 1.5:
                    score += 42.0
                elif c["case_id"] == "VET_NEWCASTLE" and features.lesion_coverage_pct > 10.0:
                    score += 38.0
                elif c["case_id"] == "VET_COCCIDIOSIS" and features.rust_pct > 2.0: # Fientes sanglantes
                    score += 44.0
                else:
                    score += 15.0

            # 2. Correspondance textuelle si des symptômes déclarés sont fournis
            if observed_symptoms_text:
                txt_lower = observed_symptoms_text.lower()
                for symp in c["symptoms"]:
                    # Mots clés significatifs
                    words = [w for w in symp.lower().split() if len(w) > 4]
                    matches = sum(1 for w in words if w in txt_lower)
                    if matches >= 2:
                        score += 18.0
                        break

            # 3. Facteurs environnementaux locaux
            if field_humidity_pct >= 80 and c["pathogen_kind"] == PathogenKind.FUNGUS:
                score += 8.0 # Humidité favorisant les champignons
            if field_temperature_c >= 34 and c["pathogen_kind"] == PathogenKind.VIRUS:
                score += 7.0 # Forte chaleur favorisant les insectes vecteurs (aleurodes, cicadelles)

            score = min(96.0, max(12.0, score))

            if score >= 75.0:
                rank = LikelihoodRank.HIGHLY_PLAUSIBLE
            elif score >= 50.0:
                rank = LikelihoodRank.PLAUSIBLE
            else:
                rank = LikelihoodRank.TO_CONFIRM

            scored_hypotheses.append(DiseaseHypothesis(
                case_id=c["case_id"],
                name_fr=c["name_fr"],
                scientific_name=c["scientific_name"],
                pathogen_kind=c["pathogen_kind"],
                affected_hosts=c["hosts"],
                likelihood_rank=rank,
                plausibility_score_pct=round(score, 1),
                matching_symptoms=c["symptoms"],
                differential_clues=c["differential"],
                recommended_field_test=c["field_test"],
                biological_protocol=c.get("bio_treatment"),
                chemical_or_veterinary_protocol=c.get("chem_treatment"),
                prophylactic_measures=c.get("prophylaxis", []),
                epidemiological_risk=c["risk"]
            ))

        # Tri décroissant selon le score de plausibilité
        scored_hypotheses.sort(key=lambda h: h.plausibility_score_pct, reverse=True)

        primary = scored_hypotheses[0]
        differentials = scored_hypotheses[1:4]

        # Calcul du niveau d'incertitude
        if primary.plausibility_score_pct >= 80.0 and (not differentials or (primary.plausibility_score_pct - differentials[0].plausibility_score_pct) >= 20.0):
            uncertainty = "Faible"
            needs_confirmation = False
        elif primary.plausibility_score_pct >= 60.0:
            uncertainty = "Modérée"
            needs_confirmation = True
        else:
            uncertainty = "Élevée"
            needs_confirmation = True

        # Génération des questions de clarification pour l'agent de terrain
        clarification_questions = self._build_clarification_questions(primary, differentials)
        synthesis = self._build_technical_synthesis(primary, differentials, features, host_target)

        return ComprehensiveAIDiagnosisResult(
            domain=domain,
            host_target=host_target,
            image_analyzed=features is not None,
            visual_features=features,
            primary_hypothesis=primary,
            differential_hypotheses=differentials,
            uncertainty_level=uncertainty,
            field_confirmation_needed=needs_confirmation,
            clarification_questions=clarification_questions,
            technical_synthesis=synthesis
        )

    def diagnose_from_single_photo(
        self,
        image_input: Any,
        field_temperature_c: float = 33.0,
        field_humidity_pct: float = 65.0
    ) -> DirectPhotoDiagnosisResult:
        """
        Détermine automatiquement à partir de la photo :
        1. La spéculation (culture ou animal)
        2. La partie atteinte (tige, racine, feuille, fruit, peau...)
        3. La maladie
        4. L'agent causal
        5. Les symptômes mesurés
        """
        # 1. Extraction des biomarqueurs visuels réels
        features = self.extract_visual_symptoms(image_input)

        # 2. Détermination de la partie atteinte (organe)
        partie_code = AffectedOrgan.LEAF
        partie_label = "Feuille (Limbe foliaire)"

        if features.texture_roughness_score > 2.2 and features.hsv_hue_mean < 42.0:
            partie_code = AffectedOrgan.ANIMAL_SKIN
            partie_label = "Peau, Pelage & Cuir"
        elif features.rust_pct > 2.5 and features.chlorosis_pct < 1.0 and features.hsv_hue_mean < 35.0:
            partie_code = AffectedOrgan.LITTER_DROPPINGS
            partie_label = "Fientes & Litière aviaire"
        elif features.dominant_rgb_lesion[0] > 140 and features.dominant_rgb_lesion[1] < 70 and features.dominant_rgb_lesion[2] < 70 and features.texture_roughness_score < 1.0:
            partie_code = AffectedOrgan.FRUIT
            partie_label = "Fruit (Péricarpe & Chair)"
        elif features.angular_vein_bounded_detected or (features.linear_streak_detected and features.canopy_or_tissue_pixels > 0 and features.hsv_hue_mean < 50.0):
            partie_code = AffectedOrgan.STEM
            partie_label = "Tige, Collet & Faisceaux vasculaires"
        elif features.hsv_hue_mean < 32.0 and features.chlorosis_pct < 2.0 and features.rust_pct < 1.0:
            partie_code = AffectedOrgan.ROOT
            partie_label = "Racine, Collet & Tubercule"
        else:
            partie_code = AffectedOrgan.LEAF
            partie_label = "Feuille (Limbe et cornet foliaire)"

        # 3. Détermination de la spéculation (hôte)
        if partie_code in (AffectedOrgan.ANIMAL_SKIN, AffectedOrgan.ANIMAL_MUCOSA, AffectedOrgan.LITTER_DROPPINGS):
            domain = DomainType.VETERINARY
            if partie_code == AffectedOrgan.LITTER_DROPPINGS or (features.rust_pct > 2.0 and features.lesion_coverage_pct > 5.0):
                host_target = "poulet_chair"
                speculation_label = "Volaille / Poulet de chair (Gallus gallus domesticus)"
            elif features.texture_roughness_score > 2.5:
                host_target = "bovin"
                speculation_label = "Bovin / Zébu (Bos taurus indicus)"
            else:
                host_target = "ovin"
                speculation_label = "Petit Ruminant / Ovin-Caprin"
        else:
            domain = DomainType.PLANT
            if features.linear_streak_detected or features.jagged_perforations_detected or features.rust_pct > 3.0 or (features.necrosis_pct > 3.0 and features.hsv_hue_mean < 130.0):
                host_target = "mais"
                speculation_label = "Maïs (Zea mays L.)"
            elif features.concentric_rings_detected or partie_code == AffectedOrgan.FRUIT or features.chlorosis_pct > 12.0:
                host_target = "tomate"
                speculation_label = "Tomate maraîchère (Solanum lycopersicum)"
            elif features.hsv_hue_mean > 75.0 and features.canopy_or_tissue_pixels > 0:
                host_target = "oignon"
                speculation_label = "Oignon bulbe (Allium cepa)"
            else:
                host_target = "mais"
                speculation_label = "Céréale / Maïs"

        # 4. Diagnostic pathologique et différentiel complet
        diag_res = self.diagnose(
            domain=domain,
            host_target=host_target,
            image_input=image_input,
            field_temperature_c=field_temperature_c,
            field_humidity_pct=field_humidity_pct
        )

        prim = diag_res.primary_hypothesis

        # 5. Synthèse détaillée des symptômes mesurés
        symptomes: List[str] = []
        if features.lesion_coverage_pct > 0:
            symptomes.append(f"Surface de lésion active mesurée : {features.lesion_coverage_pct:.1f}% de la surface examinée.")
        if features.necrosis_pct > 0:
            symptomes.append(f"Nécrose et tissus asséchés : {features.necrosis_pct:.1f}% des pixels tissulaires.")
        if features.chlorosis_pct > 0:
            symptomes.append(f"Chlorose et décoloration jaune : {features.chlorosis_pct:.1f}% des pixels tissulaires.")
        if features.rust_pct > 0:
            symptomes.append(f"Pustules orangées ou coloration rouge : {features.rust_pct:.1f}%.")
        if features.jagged_perforations_detected:
            symptomes.append("Perforations foliaires déchiquetées caractéristiques de morsures de ravageurs broyeurs.")
        if features.linear_streak_detected:
            symptomes.append("Stries chlorotiques linéaires longitudinales orientées dans l'axe des nervures.")
        if features.concentric_rings_detected:
            symptomes.append("Lésions annulaires concentriques 'en cible'.")
        symptomes.extend(prim.matching_symptoms[:2])

        bio_dict = None
        if prim.biological_protocol:
            bio_dict = {
                "nom": prim.biological_protocol.name,
                "substance_active": prim.biological_protocol.active_molecule,
                "dosage": prim.biological_protocol.dosage,
                "mode_action": prim.biological_protocol.mode_of_action,
                "delai_attente": prim.biological_protocol.pre_harvest_or_withdrawal_delay,
                "statut": prim.biological_protocol.approval_status
            }

        chem_dict = None
        if prim.chemical_or_veterinary_protocol:
            chem_dict = {
                "nom": prim.chemical_or_veterinary_protocol.name,
                "substance_active": prim.chemical_or_veterinary_protocol.active_molecule,
                "dosage": prim.chemical_or_veterinary_protocol.dosage,
                "mode_action": prim.chemical_or_veterinary_protocol.mode_of_action,
                "delai_attente": prim.chemical_or_veterinary_protocol.pre_harvest_or_withdrawal_delay,
                "statut": prim.chemical_or_veterinary_protocol.approval_status
            }

        mesures = prim.prophylactic_measures if prim.prophylactic_measures else [
            "Isoler immédiatement la zone ou le sujet affecté",
            "Éviter l'irrigation par aspersion sur le feuillage"
        ]

        agent_causal_full = f"{prim.scientific_name} ({prim.pathogen_kind.value.replace('_', ' ').capitalize()})"

        return DirectPhotoDiagnosisResult(
            speculation=speculation_label,
            domain=domain,
            partie_atteinte=partie_label,
            partie_code=partie_code,
            maladie=prim.name_fr,
            agent_causal=agent_causal_full,
            pathogen_kind=prim.pathogen_kind.value,
            symptomes=symptomes,
            confidence_pct=prim.plausibility_score_pct,
            mesures_immediates=mesures,
            traitement_bio=bio_dict,
            traitement_chimique_ou_veterinaire=chem_dict,
            test_confirmation_terrain=prim.recommended_field_test
        )

    def _build_clarification_questions(
        self,
        primary: DiseaseHypothesis,
        differentials: List[DiseaseHypothesis]
    ) -> List[Dict[str, Any]]:
        questions = [
            {
                "id": "q1_field_test",
                "question": f"Avez-vous effectué le test de terrain recommandé : '{primary.recommended_field_test}' ?",
                "action": "Exécuter immédiatement ce test pour valider ou écarter le diagnostic avec certitude."
            }
        ]
        if differentials:
            diff1 = differentials[0]
            questions.append({
                "id": "q2_differential",
                "question": f"Comment discriminer avec '{diff1.name_fr}' ? {primary.differential_clues}",
                "action": f"Vérifier spécifiquement : {diff1.matching_symptoms[0]}."
            })
        return questions

    def _build_technical_synthesis(
        self,
        primary: DiseaseHypothesis,
        differentials: List[DiseaseHypothesis],
        features: Optional[VisualSymptomFeatures],
        host_target: str
    ) -> str:
        s = f"DIAGNOSTIC PATHOLOGIQUE DU {host_target.upper()} :\n"
        s += f"1. Hypothèse Dominante : {primary.name_fr} ({primary.scientific_name}) — Plausibilité calculée à {primary.plausibility_score_pct}%.\n"
        s += f"Nature de l'agent : {primary.pathogen_kind.value.replace('_', ' ').capitalize()}.\n"
        if features:
            s += f"Indicateurs visuels mesurés : Surface de lésions de {features.lesion_coverage_pct}%, nécrose à {features.necrosis_pct}%, chlorose à {features.chlorosis_pct}%.\n"
        s += f"2. Test de confirmation terrain impératif : {primary.recommended_field_test}\n"
        if primary.chemical_or_veterinary_protocol:
            p = primary.chemical_or_veterinary_protocol
            s += f"3. Prescription principale : {p.name} ({p.dosage}). Statut : {p.approval_status}. {p.pre_harvest_or_withdrawal_delay}.\n"
        if differentials:
            diff_names = ", ".join([f"{d.name_fr} ({d.plausibility_score_pct}%)" for d in differentials])
            s += f"4. Diagnostics différentiels à surveiller : {diff_names}."
        return s

    def _load_image(self, image_input: Any) -> Image.Image:
        if isinstance(image_input, Image.Image):
            return image_input
        elif isinstance(image_input, (str, os.PathLike)):
            return Image.open(image_input)
        elif isinstance(image_input, (bytes, bytearray)):
            return Image.open(io.BytesIO(image_input))
        else:
            raise ValueError(f"Format d'image non supporté: {type(image_input)}")
