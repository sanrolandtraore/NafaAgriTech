## Objectif

Enrichir le module Expert Agronome avec une "boîte à outils" professionnelle propriétaire (registre parcellaire, traçabilité, conseils, planification), adaptée au contexte ouest-africain et intégrée à l'existant (Cartographie GPS, Scouting, Planification NPK/irrigation/phyto déjà présents).

## Constat de l'existant

Déjà en place côté expert :
- `ExpertCartographyPage` — capture GPS polygone, calcul surface
- `ScoutingPage` — observations terrain géolocalisées + PDF
- `AgronomicPlansGenerator` — calculs NPK, irrigation, phytosanitaire
- `ServiceMarketplacePage` — proposition de services (côté partenaire)
- `PartnerRequestsPage` / `PartnerProfilePage`

À ajouter : outils d'aide à la décision et de productivité quotidienne.

## Nouveaux outils proposés (Phase 1)

### 1. Hub "Boîte à outils Expert" (`/dashboard/expert-toolbox`)
Page d'accueil regroupant tous les outils expert sous forme de tuiles, avec recherche et favoris. Sert de point d'entrée unique remplaçant la navigation éclatée actuelle.

### 2. Diagnostic IA cultures (photo → diagnostic)
- Composant `CropDiagnosisTool`
- L'expert prend une photo d'une plante / feuille / parcelle
- Edge function `diagnose-crop` qui appelle **Lovable AI Gateway** (`google/gemini-2.5-pro` vision) avec un prompt agronome spécialisé Afrique de l'Ouest
- Retour structuré : maladie/ravageur/carence probable + niveau de confiance + traitement recommandé (bio + chimique) + dosage
- Sauvegarde dans `crop_diagnoses` lié à un `client_id` et optionnellement à une parcelle
- Bouton "Joindre au rapport de visite"

### 3. Calculatrice agronomique avancée
- Composant `AgroCalculator` avec onglets :
  - **Densité de semis** (graines/m² ↔ kg/ha selon PMG)
  - **Conversion d'unités** (ha↔m², kg↔t, L↔m³, ppm↔mg/L)
  - **Dose produit** (calcul volume bouillie pour surface × concentration)
  - **Besoin en eau ETc** (Kc × ETo × surface, par stade)
  - **Rendement potentiel** (composantes du rendement)
- Pas de backend : calculs côté client, mémorisation des derniers calculs en IndexedDB

### 4. Bibliothèque fiches techniques cultures
- Table `crop_technical_sheets` (mil, sorgho, maïs, niébé, arachide, riz, coton, sésame, manioc, igname, oignon, tomate)
- Champs : itinéraire technique, calendrier (semis/sarclage/récolte par zone climatique), besoins NPK, ravageurs courants, maladies, variétés recommandées, sources
- Page `CropLibraryPage` : recherche + filtres (zone, saison, durée cycle)
- L'expert peut joindre une fiche à une recommandation client

### 5. CRM clients suivis (Carnet de tournée)
- Table `expert_clients` (lien expert ↔ agriculteur/éleveur/coop suivi)
- Table `client_visits` (date, parcelle, type, observations, recommandations, prochaine action prévue)
- Page `ExpertClientsPage` : liste agriculteurs suivis, dernière visite, prochaine visite, alertes (visite > 30j)
- Vue détail client avec timeline visites + parcelles + diagnostics

### 6. Générateur d'ordonnances PDF
- Composant `PrescriptionGenerator`
- Pré-rempli depuis un diagnostic ou choisi manuellement
- En-tête expert (nom, agrément, contact), client, parcelle, produits + doses + délais avant récolte, signature
- Export PDF via `jsPDF`
- Stockage dans `expert_prescriptions`

### 7. Tableau de bord Expert
- Page `ExpertAnalyticsPage`
- KPIs : nb clients actifs, surfaces suivies (ha), nb visites ce mois, nb diagnostics, revenus services (depuis marketplace), top cultures conseillées
- Graphiques (Recharts)

## Architecture technique

```text
src/pages/dashboard/expert/
  ExpertToolboxPage.tsx           # hub tuiles
  ExpertClientsPage.tsx           # CRM
  ExpertClientDetailPage.tsx
  CropLibraryPage.tsx
  ExpertAnalyticsPage.tsx
src/components/expert/
  CropDiagnosisTool.tsx
  AgroCalculator.tsx
  PrescriptionGenerator.tsx
  ToolboxTile.tsx
supabase/functions/
  diagnose-crop/index.ts          # Lovable AI vision
```

### Migrations DB
- `crop_diagnoses` (id, expert_id, client_id, parcel_id?, image_url, ai_response jsonb, confidence, created_at) + RLS
- `crop_technical_sheets` (lecture publique authentifiée, écriture admin) + seed initial
- `expert_clients` (expert_id, client_user_id, status, notes, since)
- `client_visits` (id, expert_id, client_user_id, parcel_id?, visit_date, type, observations, recommendations, next_visit_date)
- `expert_prescriptions` (id, expert_id, client_id, content jsonb, pdf_url?)
- Bucket storage `crop-diagnoses` (privé)
- RLS : expert ne voit que ses lignes ; client voit les diagnostics/ordonnances le concernant

### Sidebar
Sous-menu "Boîte à outils" (visible uniquement si rôle = `partenaire` ou `agent_technique`) regroupant : Toolbox, Mes clients, Bibliothèque, Diagnostic IA, Calculatrice, Ordonnances, Statistiques.

## Périmètre exclu (Phase 2 ultérieure)
Météo agro, messagerie temps réel, consultation vidéo, intégration capteurs IoT, traçabilité PAC/réglementaire (non pertinent en zone CEDEAO).

## Livrables Phase 1
1. Migration SQL (5 tables + RLS + bucket + seed fiches techniques)
2. Edge function `diagnose-crop` (Lovable AI)
3. 4 nouvelles pages + 4 composants
4. Mise à jour sidebar + routes App.tsx
5. Mémoire mise à jour
