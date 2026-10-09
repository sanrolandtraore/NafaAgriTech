# NAFA - AGRITECH: Farm Forward

Construire une plateforme SaaS de gestion agricole full-stack prête pour utilisation et destinée au marché africain (burkinabè), nommée 'NAFA - AGRITECH'.

‎• La plateforme doit être :

‎• 100% fonctionnelle

‎• Sans données mockées

‎• Full-stack

‎• Production-ready

‎• Architecture scalable

‎• Code propre, modulaire, maintenable.

‎

‎EXIGENCES GÉNÉRALES NON NÉGOCIABLES

‎Chaque bouton doit :

‎• Déclencher une action réelle

‎• Appeler un endpoint backend réel

‎• Modifier la base PostgreSQL

‎• Rafraîchir l’UI dynamiquement

‎• Gérer erreurs serveur

‎• Gérer erreurs validation

‎• Respecter les rôles utilisateurs

‎• Aucun mock.

‎• Aucun fake endpoint.

‎• Authentification sécurisée JWT.

‎• RBAC strict.

‎• Journalisation (audit log).

‎• Code structuré par domaine (DDD-lite).

‎• Docker ready.

‎• Documentation API auto-générée (Swagger).

‎

‎STACK TECH OBLIGATOIRE

‎• Frontend :

‎Flutter (Android-first)

‎State management propre (Riverpod ou Bloc)

‎etc.... .

‎• Backend :

‎Node.js avec NestJS

‎Architecture modulaire

‎REST API

‎Validation DTO stricte

‎etc... .

‎• Database :

‎PostgreSQL

‎PostGIS (géolocalisation)

‎Infrastructure :

‎Docker

‎CI/CD ready

‎etc... .

‎

‎6 MODULES À DÉVELOPPER

‎MODULE 1(Offline first) — Gestion Exploitation Agricole 

‎Entités

‎• User

‎• Farm

‎• Parcel (geom polygon PostGIS)

‎• CropCycle

‎• ActivityLog

‎• CostEntry

‎• InvestmentPlan

‎• InputRequirement

‎• CropReference

‎• ClimateZone

‎• Implémente moteur de calcul :

‎• Calcul du nombre de plants fruitier (Densité)

‎• Quantité intrants

‎• Projection rendement

‎• Projection revenu

‎• ROI dynamique

‎Tous les calculs doivent être exécutés côté backend et stockés.

‎Règles métier

‎• Estimation rendement = surface × moyenne culture × coefficient climat

‎• Coût total = somme CostEntry

‎• Historique saisonnier consultable

‎• GPS doit enregistrer géométrie réelle

‎

‎MODULE 2 (Offline first) — GESTION D’ÉLEVAGE (Livestock Management)

‎

‎Objectif :

‎Offrir un module complet de suivi des élevages (bovins, caprins, ovins, volailles, porcs, poissons etc.) avec les mêmes exigences production-ready que le reste de NAFA - AGRITECH.

‎

‎MODULE 3— Location d’Actifs Agricoles

‎Plateforme native de réservation et mutualisation d'équipements agricoles et pastoraux.

‎Entités

‎• Equipment

‎• EquipmentAvailability

‎• Booking

‎• Payment

‎• SecurityDeposit

‎• Rating

‎• Règles

‎• Vérification disponibilité avant confirmation

‎• Paiement Mobile Money simulé via

‎• provider configurable

‎• Dépôt bloqué jusqu’à validation fin location

‎• Système de litige

‎• Notation après transaction.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
