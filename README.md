# NAFA AGRITECH — Plateforme Agro-Pastorale Intégrée & Ingénierie Rurale

> **La technologie au service de l'agriculture africaine.**  
> NAFA AGRITECH est une suite numérique d'aide à la décision et d'ingénierie agronomique de terrain conçue pour les producteurs, éleveurs, conseillers techniques, coopératives et institutions du Sahel et de l'Afrique de l'Ouest.

---

## 🌾 Présentation & Vision

NAFA AGRITECH unifie dans une interface moderne et réactive l'ensemble de la chaîne de valeur agro-pastorale :
- **Ingénierie de précision & modélisation de terrain** : Arpentage géodésique, conception 3D d'exploitations, dimensionnement hydraulique déterministe.
- **Conduite agronomique & protection des cultures** : Bibliothèque phytosanitaire certifiée, calendrier cultural, gestion de la fertilité des sols.
- **Gestion du cheptel & santé animale** : Suivi des effectifs, comptage d'animaux assisté par vision, calendrier vaccinal et biosécurité.
- **Gestion commerciale & partenariats** : Création de devis proforma et factures pour les partenaires, catalogue de matériels, marketplace intégrée en FCFA.
- **Résilience opérationnelle (Offline-First)** : Fonctionnement autonome sans connexion Internet grâce au stockage local (IndexedDB / Dexie), avec synchronisation transparente.

---

## 🚀 Fonctionnalités Clés

### 1. 📐 NAFA Field Designer & Studio 3D d'Exploitation
- **Cartographie & Zonage Parcellaire** : Délimitation précise des parcelles, calcul automatique des superficies (ha, m²) et périmètres.
- **Concepteur CAO 2D/3D** : Placement d'aménagements (serres, forages, châteaux d'eau, hangars avicoles, clôtures périphériques grillagées).
- **Tracé Vectoriel & Précision Métrique** : Équidistances de courbes de niveau, ajustement millimétrique des ouvrages.
- **Exports Standardisés** :
  - **CAO .DXF** (compatible logiciels de dessin vectoriel et génie civil).
  - **SIG .GeoJSON & KML** (interopérable avec les systèmes d'information géographiques).

### 2. 💧 Moteur Hydraulique Déterministe & Irrigation
- **Formules physiques strictes** : Calculs certifiés selon **Hazen-Williams** (pertes de charge linéaires et singulières) et **Christiansen** (facteur de réduction multi-sorties).
- **Dimensionnement du réseau** :
  - Conduites maîtresses et secondaires PEHD (Ø32 à Ø90 mm).
  - Rampes goutte-à-goutte avec espacement et débits des goutteurs ajustables.
- **Bilan Énergétique & Pompage Solaire** :
  - Calcul de la Hauteur Manométrique Totale (HMT en mCE).
  - Pression résiduelle au point critique et détection des vitesses inadéquates (risque de sédimentation ou de coup de bélier).
  - Dimensionnement des pompes solaires immergées et du champ photovoltaïque (Wc).
- **Zéro Mock en production** : Résultats reproductibles calculés en temps réel par le moteur TypeScript.

### 3. 🛰️ Arpentage Géodésique & GPS de Terrain
- **Relevé de parcelles multipoints** via géolocalisation GPS embarquée ou positionnement cartographique précis.
- **Toponymie & Référentiel Sahélien** : Prise en charge des communes et localités du Burkina Faso.
- **Export Multi-formats** : Fichiers `.geojson`, `.gpx` (compatible récepteurs GPS de terrain) et `.kml`.

### 4. 🌿 Diagnostic Phyto & Bibliothèque Agronomique
- **Référentiel Botanique & Phyto** : Fiches détaillées sur les principales cultures (tomate, maïs, niébé, oignon, mangue, sésame, etc.).
- **Bio-agresseurs & Maladies** : Identification des ravageurs, symptômes foliaires, mesures prophylactiques, méthodes de lutte biologique et traitements conventionnels homologués.
- **Conformité aux normes techniques certifiées** sans dépendance externe.

### 5. 🐄 Suivi d'Élevage & Outil de Comptage d'Animaux
- **Comptage d'animaux** : Outil d'analyse d'images pour le dénombrement précis des cheptels (bovins, ovins, caprins, volailles).
- **Fiches Sanitaires & Prophylaxie** : Suivi des cycles vaccinaux, alimentation bioclimatique et déparasitage.

### 6. 💼 Espace Partenaires & Facturation Proforma
- **Facturation client autonome** : Émission de devis, factures proforma et factures officielles directement par les partenaires techniques et fournisseurs.
- **Génération PDF instantanée** : Documents professionnels horodatés avec mentions légales, récapitulatif TVA/HT et signatures.
- **Personnalisation des coûts** : L'agronome ou l'exploitant configure librement les prix unitaires et sélectionne ses fournisseurs de référence.

---

## 🛠️ Stack Technique

| Domaine | Technologies |
|---|---|
| **Frontend Framework** | React 18, TypeScript, Vite |
| **Styles & Composants** | Tailwind CSS, Lucide Icons, Radix UI |
| **Cartographie & 3D** | Leaflet, OpenStreetMap, HTML5 Canvas, Three.js |
| **Gestion des données Offline** | Dexie.js (IndexedDB), LocalStorage |
| **Backend & Base de données** | Supabase (PostgreSQL, Authentification, Row-Level Security) |
| **Génération de Documents** | jsPDF, jspdf-autotable, html2canvas |
| **Tests & Qualité** | Vitest, React Testing Library, ESLint, TypeScript Strict |

---

## 📦 Installation & Démarrage

### Prérequis
- **Node.js** : version 18.x ou supérieure
- **npm** : version 9.x ou supérieure

### 1. Cloner le projet
```bash
git clone https://github.com/sanrolandtraore/koobnaaba-agro-hub.git
cd koobnaaba-agro-hub
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer les variables d'environnement
Créez un fichier `.env` à la racine du projet (sur la base de `.env.example`) :
```env
VITE_SUPABASE_URL=https://votre-instance.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon
DATABASE_URL=postgresql://postgres:votre-mot-de-passe@db.votre-instance.supabase.co:5432/postgres
```

### 4. Lancer le serveur de développement
```bash
npm run dev
```
L'application sera accessible par défaut à l'adresse `http://localhost:5173`.

---

## 🧪 Tests & Contrôle Qualité

NAFA AGRITECH intègre une suite de tests automatisés couvrant les calculs hydrauliques, l'arpentage géodésique, la facturation et les composants d'interface.

```bash
# Vérification stricte du typage TypeScript
npx tsc -p tsconfig.app.json --noEmit

# Exécution des tests unitaires et d'intégration
npm test

# Exécution ciblée des tests hydrauliques
npx vitest run src/utils/hydraulics/engine.test.ts src/test/hydraulicPanelAndHook.test.tsx

# Build de production
npm run build
```

---

## 📁 Architecture du Projet

```text
├── src/
│   ├── components/         # Composants React modulaires
│   │   ├── field-designer/ # Studio 3D, outils d'irrigation, devis et zonage
│   │   ├── genius/         # Modélisation avancée, studio CAO, comparateur de prix
│   │   ├── inspection/     # Collecte terrain, fiches dynamiques, rapports d'inspection
│   │   ├── irrigation/     # Interface utilisateur du panneau hydraulique
│   │   ├── phytosanitary/  # Interface de diagnostic et bibliothèque de santé végétale
│   │   └── ui/             # Composants d'interface (boutons, dialogues, formulaires)
│   ├── hooks/              # Hooks personnalisés (useHydraulicAnalysis, useOfflineData...)
│   ├── lib/                # Logique métier, moteurs de calcul, générateurs PDF
│   ├── pages/              # Pages et routes de l'application
│   │   ├── dashboard/      # Espace exploitant, expert et partenaire
│   │   └── public/         # Pages d'accueil, présentation et solutions
│   ├── utils/              # Noyau physique et calculs scientifiques (hydraulique, géodésie)
│   └── test/               # Suites de tests automatisés (Vitest)
├── supabase/               # Migrations et schémas PostgreSQL
├── public/                 # Assets statiques, logo et manifest PWA
└── package.json            # Scripts et dépendances
```

---

## 🔒 Sécurité & Confidentialité

- **Chiffrement & Sécurité des données** : Données transmises via HTTPS/TLS, gestion des habilitations basée sur les rôles (RBAC) et politiques de sécurité Row-Level Security (RLS) sur PostgreSQL.
- **Souveraineté des données locales** : En mode hors-ligne, les données restent confinées sur le terminal de l'exploitant jusqu'à la synchronisation autorisée.

---

## 📄 Licence & Contact

© 2026 **NAFA AGRITECH**. Tous droits réservés.  
Plateforme officielle : [https://nafaagritech.app](https://nafaagritech.app)
