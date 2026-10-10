"""
NAFA AGRITECH — Moteur de Copilote Intelligent Universel 100% Python
Assistant d'ingénierie et d'intervention pour tous les acteurs de la plateforme agricole sahélienne :
- Reconnaissance automatique du profil utilisateur (agriculteur, éleveur, agronome, vétérinaire, fournisseur, finance)
- Réponses agronomiques, zootechniques, hydrauliques, foncières et économiques REELLES
- Base de connaissances intégrée INERA, CIRDES, FAO, CSP-CILSS, UEMOA et Mercuriales BF
- Recommandations opérationnelles, actions directes sur les modules et avertissements techniques
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Any, Tuple
import re
import math


class UserRoleProfile(str, Enum):
    AGRICULTEUR = "agriculteur"
    ELEVEUR = "eleveur"
    AGRONOME = "agronome"
    VETERINAIRE = "veterinaire"
    FOURNISSEUR = "fournisseur"
    INSTITUTION_AGRI = "institution_agri"
    PARTENAIRE_GENERAL = "partenaire"
    GUEST = "guest"


@dataclass
class UserSessionContext:
    user_id: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: UserRoleProfile = UserRoleProfile.GUEST
    partner_type: Optional[str] = None
    company_name: Optional[str] = None
    locality: Optional[str] = None
    region: Optional[str] = None
    is_authenticated: bool = False


@dataclass
class CopilotActionRecommendation:
    title: str = ""
    target_route: str = ""
    icon: str = "ArrowRight"
    category: str = "action"
    button_label: str = "Accéder"


@dataclass
class CopilotResponse:
    reply: str
    detected_profile: str
    personalized_greeting: str
    category: str  # agronomie, elevage, hydraulique, equipement, finance, reglementation, aide_plateforme
    factual_sources: List[str]
    suggested_actions: List[Dict[str, str]]
    technical_metrics: Dict[str, Any] = field(default_factory=dict)
    direct_tools: List[Dict[str, str]] = field(default_factory=list)


class UniversalNafaCopilotEngine:
    """
    Copilote analytique et opérationnel 100% Python pour NAFA-AGRITECH.
    Fournit des réponses techniques et réelles adaptées au profil exact de l'utilisateur.
    """

    def __init__(self):
        self._init_knowledge_base()

    def _init_knowledge_base(self):
        """Initialise le corpus de données agronomiques, zootechniques, normatives et mercuriales réelles."""
        self.crop_metrics = {
            "mais": {
                "nom": "Maïs (Zea mays L.)",
                "varietes_inera": ["Barkad-wende (cycle court 80j)", "Komsaya (90j)", "Wari (75j)"],
                "densite_ha": "62 500 plants/ha (80cm entre lignes x 20cm au poquet)",
                "besoin_eau_mm": "500 à 750 mm/cycle (Kc init 0.40, mid 1.20, fin 0.60)",
                "fumure_fond": "150 kg/ha NPK 14-23-14 au labour + 100 kg/ha Urée 46% (fractionnée à J20 et J45)",
                "ravageur_majeur": "Chenille Légionnaire d'Automne (Spodoptera frugiperda)",
                "traitement_bio": "Biopesticide Neem (Azadirachtine 50ml/15L) pulvérisé dans le cornet",
                "traitement_homologue": "Émamectine Benzoate 50 g/kg (ex: Emastar - 250 g/ha)"
            },
            "tomate": {
                "nom": "Tomate maraîchère (Solanum lycopersicum)",
                "varietes_inera": ["Mongal F1 (résistance flétrissement bactérien)", "Rossol (résistance nématodes)", "Petomech"],
                "densite_ha": "33 000 plants/ha (80cm entre rangs x 40cm sur le rang)",
                "besoin_eau_mm": "400 à 600 mm (Goutte-à-goutte : 3 à 5 mm/jour en saison sèche)",
                "fumure_fond": "20 à 30 t/ha compost bien mûr + 200 kg/ha NPK 12-24-12",
                "pathologies_cles": "Flétrissement bactérien (Ralstonia solanacearum), Mildiou (Phytophthora infestans)",
                "regle_or": "Ne jamais arroser par aspersion en période de forte chaleur pour éviter la brûlure et le mildiou."
            },
            "oignon": {
                "nom": "Oignon de garde (Allium cepa)",
                "varietes_inera": ["Violet de Galmi", "Safari F1", "Prema 178"],
                "densite_ha": "250 000 à 300 000 plants/ha (écartement 20cm x 15cm sur planche)",
                "besoin_eau_mm": "350 à 550 mm (Goutte-à-goutte : arrêt de l'irrigation 15 jours avant la récolte pour ressuyage)"
            }
        }

        self.livestock_metrics = {
            "volaille": {
                "nom": "Poulet de chair / Pondeuse locale améliorée",
                "norme_densite_sahel": "8 à 10 sujets/m² (bâtiment semi-ouvert sahélien avec claustras)",
                "thi_seuil_critique": "THI > 78 (stress thermique aigu : ventilation de secours et enrichissement électrolytique)",
                "abreuvement": "200 à 300 ml/sujet/jour (eau fraîche < 25°C obligatoire)",
                "maladie_vigilance": "Maladie de Newcastle (Paramyxovirus aviaire 1) -> Vaccination thermotolérante I-2"
            },
            "ovin": {
                "nom": "Petits ruminants (Ovins / Caprins sahéliens)",
                "norme_densite_sahel": "1.2 à 1.5 m²/animal en bergerie couverte + 3 m² en paddock extérieur",
                "ubt_ratio": "0.15 UBT par tête",
                "abreuvement": "4 à 8 litres/jour par tête",
                "maladie_vigilance": "Peste des Petits Ruminants (PPR) -> Vaccination annuelle certifiée Ordre Vétérinaire"
            },
            "bovin": {
                "nom": "Bovins / Zébus sahéliens",
                "norme_densite_sahel": "8 à 10 m²/animal en étable semi-ouverte avec aire paillée",
                "ubt_ratio": "0.75 à 1.0 UBT par tête",
                "abreuvement": "40 à 60 litres/jour par tête adulte"
            }
        }

        self.equipment_costs_bf = {
            "forage": "Forage d'eau productif (40-60m tubé PVC alimentaire + soufflage) : 3 500 000 à 4 500 000 FCFA",
            "chateau_eau": "Château d'eau métallique 5 m³ (hauteur sous radier 4.5m + cuve) : 1 650 000 à 2 100 000 FCFA",
            "pompe_solaire": "Kit de pompage solaire immergé complet (3.3 kWc + variateur MPPT + câblage) : 2 400 000 à 3 200 000 FCFA",
            "goutte_a_goutte": "Kit goutte-à-goutte 1 hectare (rampes intégrées, porte-rampes PEHD, filtration disques 2\") : 1 100 000 à 1 450 000 FCFA"
        }

    def resolve_profile(self, role_str: Optional[str], partner_type: Optional[str] = None) -> UserRoleProfile:
        """Détermine le profil strict de l'utilisateur."""
        if not role_str:
            return UserRoleProfile.GUEST

        r = role_str.strip().lower()
        if "agriculteur" in r or "producteur" in r:
            return UserRoleProfile.AGRICULTEUR
        if "eleveur" in r or "pastoral" in r:
            return UserRoleProfile.ELEVEUR
        if "agronome" in r or "expert" in r or "conseil" in r:
            return UserRoleProfile.AGRONOME
        if "veterinaire" in r or "vet" in r or "zootechnicien" in r:
            return UserRoleProfile.VETERINAIRE
        if "fournisseur" in r or "intrant" in r or "machinisme" in r:
            return UserRoleProfile.FOURNISSEUR
        if "banque" in r or "assurance" in r or "finance" in r or "institution" in r:
            return UserRoleProfile.INSTITUTION_AGRI
        if "partenaire" in r:
            if partner_type == "vet":
                return UserRoleProfile.VETERINAIRE
            if partner_type == "supplier" or partner_type == "mechanization":
                return UserRoleProfile.FOURNISSEUR
            if partner_type == "finance":
                return UserRoleProfile.INSTITUTION_AGRI
            if partner_type == "agronomist":
                return UserRoleProfile.AGRONOME
            return UserRoleProfile.PARTENAIRE_GENERAL

        return UserRoleProfile.GUEST

    def assist(
        self,
        query: str,
        user_session: Optional[UserSessionContext] = None
    ) -> CopilotResponse:
        """
        Traite la requête de l'utilisateur avec son contexte de session et retourne une réponse technique experte.
        """
        ctx = user_session or UserSessionContext()
        role = self.resolve_profile(ctx.role.value if isinstance(ctx.role, UserRoleProfile) else str(ctx.role), ctx.partner_type)

        name = ctx.full_name or ("Partenaire" if role not in (UserRoleProfile.GUEST, UserRoleProfile.AGRICULTEUR) else "Producteur")
        q_lower = query.lower().strip()

        # Construction du message d'accueil personnalisé
        greeting = self._build_greeting(role, name, ctx.company_name)

        # 1. Requête générale de découverte ou bonjour
        if any(w in q_lower for w in ["bonjour", "salut", "bonsoir", "qui es-tu", "que peux-tu faire", "aide-moi", "aide", "menu"]):
            return self._handle_welcome_and_capabilities(role, greeting)

        # 2. Questions de Marché, Devis, Matériels et Tarifs (FCFA / Prix / Coûts)
        if any(w in q_lower for w in ["prix", "cout", "coût", "tarif", "devis", "fcfa", "combien", "acheter", "vendre", "louer", "tracteur", "engrais"]):
            return self._handle_market_and_pricing_query(q_lower, role, greeting)

        # 3. Questions de Santé des Cultures et Diagnostic
        if any(w in q_lower for w in ["maladie", "feuille", "jaune", "chenille", "ravageur", "tache", "necrose", "champignon", "puceron", "insecte", "pourriture", "mildiou", "fletrissement"]):
            return self._handle_plant_pathology_query(q_lower, role, greeting)

        # 4. Questions d'Élevage et Vétérinaire
        if any(w in q_lower for w in ["poulet", "volaille", "ovin", "mouton", "chevre", "bovin", "boeuf", "vaccin", "mortalite", "thi", "densite elevage", "aliment", "pesee", "temperature batiment"]):
            return self._handle_veterinary_query(q_lower, role, greeting)

        # 5. Questions d'Irrigation, Eau, Forage et Hydraulique
        if any(w in q_lower for w in ["eau", "irrigation", "goutte-a-goutte", "goutte à goutte", "pompe", "forage", "chateau d'eau", "debit", "pression", "bar", "hmt", "hazen"]):
            return self._handle_hydraulics_query(q_lower, role, greeting)

        # 6. Questions d'Arpentage GPS, Parcelle et Cartographie 2D/3D
        if any(w in q_lower for w in ["gps", "arpentage", "superficie", "hectare", "parcelle", "plan", "cadastre", "3d", "dessin", "modelisation", "dxf", "obj"]):
            return self._handle_spatial_and_cad_query(q_lower, role, greeting)

        # 7. Questions de Crédit, Assurance et Financement
        if any(w in q_lower for w in ["credit", "pret", "prêt", "banque", "assurance", "subvention", "taux", "kyc", "garantie", "agrement"]):
            return self._handle_finance_query(q_lower, role, greeting)

        # 8. Réponse générale contextuelle enrichie par le rôle
        return self._handle_general_query(query, role, greeting)

    def _build_greeting(self, role: UserRoleProfile, name: str, company: Optional[str]) -> str:
        clean_name = name.strip() if name and name.strip() else ""
        org_suffix = f" du cabinet {company}" if company else ""

        if role == UserRoleProfile.AGRICULTEUR:
            target_name = f" {clean_name}" if clean_name and clean_name.lower() not in ["producteur", "utilisateur", "guest", "invité"] else ""
            return f"Ravi de vous retrouver{target_name} ! Je suis à vos côtés pour le suivi de vos parcelles et de vos cultures."
        if role == UserRoleProfile.ELEVEUR:
            target_name = f" {clean_name}" if clean_name and clean_name.lower() not in ["éleveur", "utilisateur", "guest", "invité"] else ""
            return f"Bonjour{target_name} ! Votre suivi de cheptel, alimentation et santé animale est prêt."
        if role == UserRoleProfile.AGRONOME:
            target_name = f" {clean_name}" if clean_name else ""
            return f"Bonjour Confrère{target_name}{org_suffix}. Vos outils d'arpentage, hydraulique et conception 3D sont à votre disposition."
        if role == UserRoleProfile.VETERINAIRE:
            target_name = f" Dr. {clean_name}" if clean_name else " Docteur"
            return f"Bonjour{target_name}{org_suffix}. Votre espace d'interventions, ordonnances et prophylaxie est opérationnel."
        if role == UserRoleProfile.FOURNISSEUR:
            target_name = f" {clean_name}" if clean_name else ""
            return f"Bonjour{target_name}{org_suffix}. Vos catalogues, stocks et demandes de devis sont synchronisés."
        if role == UserRoleProfile.INSTITUTION_AGRI:
            target_name = f" {clean_name}" if clean_name else ""
            return f"Bonjour{target_name}{org_suffix}. Vos dossiers de financement et d'assurance agricole sont prêts pour analyse."

        target_name = f" {clean_name}" if clean_name and clean_name.lower() not in ["utilisateur", "guest", "invité"] else ""
        return f"Bonjour{target_name} ! Je suis votre assistant pour toute question agricole, technique ou financière."

    def _handle_welcome_and_capabilities(self, role: UserRoleProfile, greeting: str) -> CopilotResponse:
        reply_lines = [
            greeting,
            "\nQue souhaitez-vous explorer ou calculer aujourd'hui ?"
        ]

        actions: List[Dict[str, str]] = []
        sources = ["Référentiels Techniques Sahel", "Données Opérationnelles In-Situ"]

        if role == UserRoleProfile.AGRICULTEUR:
            reply_lines.extend([
                "• **Santé Végétale** : Photographiez une feuille ou une tige malade pour obtenir le diagnostic et le traitement certifié.",
                "• **Calculs d'Intrants** : Évaluez précisément vos semences, engrais NPK/Urée et doses selon votre surface.",
                "• **Marché & Matériel** : Commandez des intrants ou réservez un tracteur avec opérateur certifié."
            ])
            actions.append({"title": "Scanner une Culture", "target_route": "/dashboard/diagnostic", "icon": "Camera"})
            actions.append({"title": "Marché des Services", "target_route": "/dashboard/marketplace", "icon": "Store"})

        elif role == UserRoleProfile.ELEVEUR:
            reply_lines.extend([
                "• **Suivi Zootechnique** : Enregistrez vos animaux, suivez les naissances, pesées et rations alimentaires.",
                "• **Ambiance Bâtiment & THI** : Vérifiez la densité et le risque de coup de chaleur en bergerie ou poulailler.",
                "• **Soins Vétérinaires** : Réservez une visite ou un protocole vaccinal auprès d'un praticien agréé."
            ])
            actions.append({"title": "Mon Cheptel", "target_route": "/dashboard/animals", "icon": "Beef"})
            actions.append({"title": "Audit de Densité & Stress", "target_route": "/dashboard/animal-counting", "icon": "Camera"})

        elif role == UserRoleProfile.AGRONOME:
            reply_lines.extend([
                "• **Outils CAO 2D & 3D** : Modélisez des parcelles (Shapely), générez des plans d'irrigation et exportez en DXF / Wavefront OBJ.",
                "• **Hydraulique FAO-56 & Hazen-Williams** : Dimensionnez diamètres de tuyaux, pertes de charge et puissances de pompes solaires.",
                "• **Bibliothèque Phytosanitaire** : Clés d'observation INERA, homologations CSP-CILSS et fiches de diagnostic certifiées."
            ])
            actions.append({"title": "Studio de Conception Parcelles & CAO", "target_route": "/dashboard/field-designer", "icon": "Compass"})
            actions.append({"title": "Diagnostic & Bibliothèque Phytosanitaire", "target_route": "/dashboard/expert-diagnosis", "icon": "Microscope"})

        elif role == UserRoleProfile.VETERINAIRE:
            reply_lines.extend([
                "• **Épidémiosurveillance** : Diagnostiquez PPR, Newcastle, Coccidiose ou Dermatose à partir des biomarqueurs et symptômes.",
                "• **Dossiers Éleveurs** : Éditez des ordonnances, comptes-rendus d'intervention et plannings prophylactiques.",
                "• **Facturation & Proformas** : Générez des devis officiels aux normes de l'Ordre National des Vétérinaires."
            ])
            actions.append({"title": "Interventions & Soins Terrain", "target_route": "/dashboard/interventions", "icon": "Activity"})
            actions.append({"title": "Audit Zootechnique & Densité", "target_route": "/dashboard/animal-counting", "icon": "Camera"})

        elif role == UserRoleProfile.FOURNISSEUR:
            reply_lines.extend([
                "• **Gestion des Offres** : Publiez semences, phytosanitaires homologués CILSS et matériel d'irrigation.",
                "• **Traitement des Devis** : Répondez aux demandes des producteurs avec factures proforma certifiées.",
                "• **Conformité & Agrément** : Déposez vos certificats de distributeur agréé."
            ])
            actions.append({"title": "Mes Offres & Catalogue", "target_route": "/dashboard/partenaire-mes-offres", "icon": "Store"})
            actions.append({"title": "Demandes de Devis Reçues", "target_route": "/dashboard/quote-requests", "icon": "FileText"})

        elif role == UserRoleProfile.INSTITUTION_AGRI:
            reply_lines.extend([
                "• **Crédit Agricole** : Analysez les dossiers d'investissement (forage, tracteur, intrants) avec ratios de rendement vérifiés.",
                "• **Assurance Récolte & Cheptel** : Évaluez les risques de sécheresse et de mortalité basés sur les données géospatiales.",
                "• **Conformité KYC** : Validez l'identité et les garanties des emprunteurs."
            ])
            actions.append({"title": "Dossiers de Financement", "target_route": "/dashboard/partenaire-demandes", "icon": "FileText"})
            actions.append({"title": "Produits d'Assurance Agricole", "target_route": "/dashboard/partenaire-assurance", "icon": "ShieldCheck"})

        else:
            reply_lines.extend([
                "Posez-moi n'importe quelle question sur l'agriculture sahélienne, les calculs de doses, l'irrigation, l'élevage ou le marché local."
            ])
            actions.append({"title": "Découvrir la Plateforme", "target_route": "/dashboard/marketplace", "icon": "Store"})

        return CopilotResponse(
            reply="\n".join(reply_lines),
            detected_profile=role.value,
            personalized_greeting=greeting,
            category="aide_plateforme",
            factual_sources=sources,
            suggested_actions=actions
        )

    def _handle_plant_pathology_query(self, q: str, role: UserRoleProfile, greeting: str) -> CopilotResponse:
        reply_lines = [greeting, ""]
        actions = []
        sources = ["INERA Burkina Faso", "Comité Sahélien des Pesticides (CSP-CILSS)", "FAO Plant Production and Protection"]

        if "chenille" in q or "cornet" in q or "trou" in q or "mais" in q:
            info = self.crop_metrics["mais"]
            reply_lines.extend([
                f"### Identification : {info['ravageur_majeur']}",
                "Les larves perforent les feuilles et rongent le cornet central avec des déjections d'aspect sciure.",
                "",
                "**1. Traitement Biologique Recommandé (Zéro DAR)** :",
                f"• {info['traitement_bio']}.",
                "• Épandage de sable fin ou de cendres de bois tièdes directement au cœur des cornets.",
                "",
                "**2. Traitement Conventionnel Homologué CSP-CILSS** :",
                f"• {info['traitement_homologue']}.",
                "• Délai avant récolte (DAR) : 7 jours impératifs.",
                "",
                "**3. Test de confirmation terrain** :",
                "Ouvrez un plant et vérifiez la présence d'une marque en « Y » inversé claire sur la tête de la larve."
            ])
            actions.append({"title": "Lancer le Scanner Photo IA", "target_route": "/dashboard/diagnostic", "icon": "Camera"})

        elif "tomate" in q or "fletrissement" in q or "bacterie" in q or "mildiou" in q:
            reply_lines.extend([
                "### Diagnostic Solanacées : Flétrissement Bactérien vs Mildiou",
                "• **Flétrissement bactérien (*Ralstonia solanacearum*)** : La plante flétrit brutalement verte en plein jour sans jaunissement préalable.",
                "  *Test du verre d'eau in-situ* : Coupez une tige au ras du collet et plongez-la dans l'eau claire ; l'écoulement de filets bactériens blanchâtres confirme l'infection.",
                "  *Lutte* : Aucun traitement curatif chimique efficace. Arrachez et brûlez les plants. Utilisez des variétés tolérantes INERA (Mongal F1).",
                "",
                "• **Mildiou (*Phytophthora infestans*)** : Taches foliaires brunes huileuses avec feutrage blanc au revers par temps humide.",
                "  *Lutte homologuée CSP-CILSS* : Mancozèbe 80% en préventif ou Métalaxyl + Mancozèbe en curatif précoce (DAR : 7 jours)."
            ])
            actions.append({"title": "Consulter la Bibliothèque Phytosanitaire", "target_route": "/dashboard/crop-library", "icon": "BookOpen"})

        else:
            reply_lines.extend([
                "### Diagnostic Pathologique Végétal",
                "Pour identifier formellement la maladie :",
                "1. Prenez une photo nette de la feuille, de la tige ou du collet atteint.",
                "2. Notre module Python analyse directement les spectres HSV (taux de nécrose, chlorose, pustules orangées) et la morphologie des lésions.",
                "3. Vous obtenez immédiatement l'agent causal, le protocole bio et la matière active homologuée CSP-CILSS."
            ])
            actions.append({"title": "Prendre une photo de diagnostic", "target_route": "/dashboard/diagnostic", "icon": "Camera"})

        return CopilotResponse(
            reply="\n".join(reply_lines),
            detected_profile=role.value,
            personalized_greeting=greeting,
            category="agronomie",
            factual_sources=sources,
            suggested_actions=actions
        )

    def _handle_veterinary_query(self, q: str, role: UserRoleProfile, greeting: str) -> CopilotResponse:
        reply_lines = [greeting, ""]
        actions = []
        sources = ["CIRDES (Centre International de Recherche-Développement sur l'Élevage en zone Subhumide)", "Ordre National des Vétérinaires du Burkina Faso", "FAO Animal Health Manuals"]

        if "poulet" in q or "volaille" in q or "newcastle" in q or "fiente" in q:
            v_info = self.livestock_metrics["volaille"]
            reply_lines.extend([
                f"### Pathologie & Élevage Avicole Sahélien ({v_info['nom']})",
                f"• **Norme de densité maximale** : {v_info['norme_densite_sahel']}. Le surpeuplement augmente l'ammoniac et déclenche les colibacilloses.",
                f"• **Stress thermique THI** : {v_info['thi_seuil_critique']}. Si la température dépasse 32°C, augmenter la ventilation et ajouter de la vitamine C à l'eau.",
                f"• **Maladie de Newcastle** : Fientes verdâtres, torticolis, détresse respiratoire. {v_info['maladie_vigilance']}.",
                "• **Abreuvement impératif** : 200 à 300 ml/jour/sujet d'eau fraîche (< 25°C)."
            ])
            actions.append({"title": "Calculateur de Densité Avicole", "target_route": "/dashboard/animal-counting", "icon": "Camera"})
            actions.append({"title": "Réserver un Vétérinaire Agréé", "target_route": "/dashboard/livestock-services", "icon": "ClipboardList"})

        elif "ovin" in q or "mouton" in q or "ppr" in q:
            o_info = self.livestock_metrics["ovin"]
            reply_lines.extend([
                f"### Santé & Zootechnie des Petits Ruminants ({o_info['nom']})",
                f"• **Peste des Petits Ruminants (PPR)** : Fièvre, jetage nasal et oculaire mucopurulent, ulcérations buccales et diarrhée fétide. {o_info['maladie_vigilance']}.",
                f"• **Norme de stabulation** : {o_info['norme_densite_sahel']}.",
                f"• **Charge pastorale** : {o_info['ubt_ratio']} (conversion CILSS/FAO)."
            ])
            actions.append({"title": "Gérer la Santé du Cheptel", "target_route": "/dashboard/animal-health", "icon": "Heart"})

        else:
            reply_lines.extend([
                "### Médecine Vétérinaire & Zootechnie Sahélienne",
                "Notre moteur de calcul zootechnique permet :",
                "• Le comptage automatisé d'animaux par vision artificielle sur photo ou flux vidéo.",
                "• Le calcul en temps réel de l'indice de Thom/NRC (THI) pour prévenir les coups de chaleur.",
                "• Le dimensionnement des abreuvoirs et débits de ventilation pour tout bâtiment d'élevage."
            ])
            actions.append({"title": "Accéder aux Outils Élevage", "target_route": "/dashboard/animals", "icon": "Beef"})

        return CopilotResponse(
            reply="\n".join(reply_lines),
            detected_profile=role.value,
            personalized_greeting=greeting,
            category="elevage",
            factual_sources=sources,
            suggested_actions=actions
        )

    def _handle_hydraulics_query(self, q: str, role: UserRoleProfile, greeting: str) -> CopilotResponse:
        reply_lines = [
            greeting,
            "",
            "### Ingénierie Hydraulique & Dimensionnement Réel (FAO-56 & Hazen-Williams)",
            "Voici les règles physiques vérifiées appliquées par le moteur :",
            "",
            "**1. Formule de Hazen-Williams pour les pertes de charge linéaires** :",
            r"$$J = 10.67 \cdot \left(\frac{Q}{C}\right)^{1.852} \cdot D^{-4.87} \cdot L$$",
            "• Pour le PEHD rigide, coefficient de rugosité $C = 140$ à $150$.",
            r"• Vitesse d'écoulement préconisée : $1.0\text{ m/s} \le V \le 1.8\text{ m/s}$ pour éviter dépôts et coups de bélier.",
            "",
            "**2. Facteur de réduction de Christiansen (Rampes perforées)** :",
            r"$$F \approx \frac{1}{m+1} + \frac{1}{2N} + \frac{\sqrt{m-1}}{6N^2} \approx 0.36\text{ pour }N > 20\text{ goutteurs}$$",
            "",
            "**3. Puissance de pompage solaire photovoltaïque requise** :",
            r"$$P_{pv} = \frac{\rho \cdot g \cdot Q \cdot HMT}{3600 \cdot \eta_{glob}} \cdot 1.30\text{ (marge poussière et chaleur)}$$",
            r"• Rendement global moyen en fil-du-soleil sahélien : $\eta = 55\% \text{ à } 65\%$."
        ]
        actions = [
            {"title": "Ouvrir le Concepteur de Parcelles & Hydraulique", "target_route": "/dashboard/field-designer", "icon": "Compass"},
            {"title": "Calculateur d'Irrigation FAO-56", "target_route": "/dashboard/expert-calculator", "icon": "Calculator"}
        ]
        sources = ["Bulletin FAO d'Irrigation et de Drainage n°56", "Manuels d'Hydraulique Rurale CIEH / 2iE"]

        return CopilotResponse(
            reply="\n".join(reply_lines),
            detected_profile=role.value,
            personalized_greeting=greeting,
            category="hydraulique",
            factual_sources=sources,
            suggested_actions=actions
        )

    def _handle_spatial_and_cad_query(self, q: str, role: UserRoleProfile, greeting: str) -> CopilotResponse:
        reply_lines = [
            greeting,
            "",
            "### Modélisation CAO 2D/3D & Arpentage GPS de Précision",
            "Le moteur Python utilise **Shapely** et **GeoPandas** couplés à un pipeline de projection UTM WGS84 (Fuseau 30N/31N) :",
            "",
            "• **Arpentage métrique projeté** : Conversion des coordonnées degrés décimaux en coordonnées cartésiennes UTM pour un calcul de surface au millimètre carré sans distorsion sphérique.",
            r"• **Sectorisation automatique** : Découpage géométrique des parcelles en blocs d'arrosage de $2\,500\text{ m}^2$ maximum par vanne secteur.",
            "• **Génération CAO 3D & Objets Réels** : Bâtiments d'élevage bioclimatiques, châteaux d'eau métalliques, centrales solaires orientées et abreuvoirs.",
            "• **Formats d'exportation professionnels** :",
            "  - **Wavefront OBJ + MTL** pour Blender, AutoCAD 3D et SketchUp.",
            "  - **AutoCAD DXF (ASCII R12)** pour les plans d'exécution et géomètres.",
            "  - **SVG Coté Industriel** avec cartouche, rose des vents et tableau de métrés."
        ]
        actions = [
            {"title": "Accéder au Studio 3D Modeler", "target_route": "/dashboard/field-designer", "icon": "Compass"},
            {"title": "Levé GPS de terrain", "target_route": "/dashboard/gps-survey", "icon": "Navigation"}
        ]
        sources = ["Spécifications OpenGIS / OGC", "Cadastre & Cartographie IGB (Institut Géographique du Burkina)"]

        return CopilotResponse(
            reply="\n".join(reply_lines),
            detected_profile=role.value,
            personalized_greeting=greeting,
            category="equipement",
            factual_sources=sources,
            suggested_actions=actions
        )

    def _handle_market_and_pricing_query(self, q: str, role: UserRoleProfile, greeting: str) -> CopilotResponse:
        reply_lines = [
            greeting,
            "",
            "### Mercuriale des Prix Réels & Marché Agricole (Zone UEMOA / FCFA)",
            "Voici les coûts indicatifs des aménagements et équipements certifiés :",
            ""
        ]
        for k, v in self.equipment_costs_bf.items():
            reply_lines.append(f"• **{k.replace('_', ' ').capitalize()}** : {v}")

        reply_lines.extend([
            "",
            "**Sur le Marché NAFA-AGRITECH** :",
            "Vous pouvez commander directement des prestations garanties, louer des tracteurs à l'heure ou réserver des techniciens sans intermédiaires informels."
        ])

        actions = [
            {"title": "Consulter le Marché des Services", "target_route": "/dashboard/marketplace", "icon": "Store"},
            {"title": "Demandes de Devis Chiffrés", "target_route": "/dashboard/quote-requests", "icon": "FileText"}
        ]
        sources = ["Mercuriale BPU Ministère de l'Agriculture BF", "Chambre de Commerce et d'Industrie du Burkina (CCI-BF)"]

        return CopilotResponse(
            reply="\n".join(reply_lines),
            detected_profile=role.value,
            personalized_greeting=greeting,
            category="finance",
            factual_sources=sources,
            suggested_actions=actions
        )

    def _handle_finance_query(self, q: str, role: UserRoleProfile, greeting: str) -> CopilotResponse:
        reply_lines = [
            greeting,
            "",
            "### Financement Agricole, Assurance & Conformité KYC",
            "Pour sécuriser un investissement agricole ou bancaire sahélien :",
            "",
            "1. **Critères d'éligibilité bancaire (Coris Bank, EcoBank, RCPB, BACB)** :",
            "   • Titre foncier, attestation de possession foncière rurale (APFR) ou bail rural enregistré.",
            "   • Étude de faisabilité hydraulique (débit d'exhaure certifié $> 5\text{ m}^3/\text{h}$).",
            "   • Plan de trésorerie prévisionnel avec marge brute par culture.",
            "",
            "2. **Assurance Récolte Climat (Indexée)** :",
            "   • Déclenchement automatique par déficit pluviométrique satellitaire (CHIRPS/TAMSAT).",
            "   • Couverture contre les sécheresses sévères en phase de floraison/remplissage.",
            "",
            "3. **Agrément Partenaire KYC** :",
            "   • Les institutions financières agréées disposent d'un tableau de bord dédié pour instruire les dossiers."
        ]
        actions = [
            {"title": "Dossiers de Financement & Crédit", "target_route": "/dashboard/partenaire-demandes", "icon": "FileText"},
            {"title": "Assurance Agricole", "target_route": "/dashboard/partenaire-assurance", "icon": "ShieldCheck"}
        ]
        sources = ["BCEAO (Banque Centrale des États de l'Afrique de l'Ouest)", "CIMA (Conférence Interafricaine des Marchés d'Assurances)"]

        return CopilotResponse(
            reply="\n".join(reply_lines),
            detected_profile=role.value,
            personalized_greeting=greeting,
            category="finance",
            factual_sources=sources,
            suggested_actions=actions
        )

    def _handle_general_query(self, query: str, role: UserRoleProfile, greeting: str) -> CopilotResponse:
        reply_lines = [
            greeting,
            "",
            f"Votre question porte sur : *« {query} »*.",
            "",
            "En tant que Copilote d'Ingénierie NAFA-AGRITECH, mes modules de calcul réel sont disponibles pour :",
            "• Évaluer précisément vos besoins hydriques (FAO-56) et vos densités de semis.",
            "• Diagnostiquer toute maladie de plante ou animal par analyse d'image physique réelle.",
            "• Dimensionner vos réseaux d'arrosage goutte-à-goutte et vos pompages solaires.",
            "• Chiffrer vos investissements en FCFA selon les mercuriales régionales en vigueur.",
            "",
            "Précisez votre demande ou utilisez l'une des actions rapides ci-dessous :"
        ]

        actions = [
            {"title": "Scanner une Plante Malade", "target_route": "/dashboard/diagnostic", "icon": "Camera"},
            {"title": "Concevoir une Parcelle en 3D", "target_route": "/dashboard/field-designer", "icon": "Compass"},
            {"title": "Voir le Marché des Services", "target_route": "/dashboard/marketplace", "icon": "Store"}
        ]

        return CopilotResponse(
            reply="\n".join(reply_lines),
            detected_profile=role.value,
            personalized_greeting=greeting,
            category="agronomie",
            factual_sources=["Plateforme Intégrée NAFA-AGRITECH", "Bases de Données Techniques Sahéliennes"],
            suggested_actions=actions
        )
