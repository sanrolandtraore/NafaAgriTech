import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";
import Footer from "@/components/Footer";

const PolitiqueConfidentialite = () => (
  <div className="min-h-screen bg-background flex flex-col justify-between">
    <div>
      <header className="border-b border-border py-4 bg-card/80 backdrop-blur-md">
        <div className="container max-w-4xl mx-auto px-4 flex items-center gap-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <img src={logo} alt="NAFA - AGRITECH" className="h-8 w-auto" />
        </div>
      </header>
      <main className="container max-w-4xl mx-auto px-4 py-12 prose prose-headings:text-foreground prose-p:text-muted-foreground max-w-none">
        <h1 className="text-3xl font-heading font-bold text-foreground">Politique de Confidentialité</h1>
        <p className="text-sm text-muted-foreground">Dernière mise à jour : 8 mars 2026</p>

        <h2 className="text-xl font-semibold text-foreground mt-8">1. Responsable du traitement</h2>
        <p>
          Le responsable du traitement des données est la société NAFA - AGRITECH SARL, 
          Bobo-Dioulasso, Burkina Faso.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">2. Données collectées</h2>
        <p>Nous collectons les catégories de données suivantes :</p>
        <ul className="text-muted-foreground">
          <li><strong>Données d'identification :</strong> nom, prénom, email, téléphone</li>
          <li><strong>Données agricoles :</strong> exploitations, parcelles, cultures, élevages, récoltes</li>
          <li><strong>Données financières :</strong> coûts, revenus, investissements</li>
          <li><strong>Données de géolocalisation :</strong> coordonnées GPS des parcelles (avec consentement)</li>
          <li><strong>Données de connexion :</strong> journaux d'accès, appareil utilisé</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground mt-8">3. Finalités du traitement</h2>
        <p>Vos données sont traitées pour :</p>
        <ul className="text-muted-foreground">
          <li>La fourniture et l'amélioration de nos services</li>
          <li>La gestion de votre compte utilisateur</li>
          <li>L'analyse et l'optimisation de vos activités agricoles</li>
          <li>La communication relative à votre compte et nos services</li>
          <li>Le respect de nos obligations légales</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground mt-8">4. Base légale</h2>
        <p>
          Le traitement de vos données est fondé sur l'exécution du contrat (CGU), 
          votre consentement et nos intérêts légitimes, conformément à la loi n°001-2021/AN 
          du Burkina Faso sur la protection des données personnelles.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">5. Partage des données</h2>
        <p>
          Vos données ne sont jamais vendues à des tiers. Elles peuvent être partagées avec :
        </p>
        <ul className="text-muted-foreground">
          <li>Les partenaires dont vous sollicitez les services (données strictement nécessaires)</li>
          <li>Nos sous-traitants techniques (hébergement, maintenance) soumis à des obligations de confidentialité</li>
          <li>Les autorités compétentes en cas d'obligation légale</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground mt-8">6. Durée de conservation</h2>
        <p>
          Vos données sont conservées pendant la durée de votre utilisation de la plateforme 
          et pendant 5 ans après la suppression de votre compte, conformément aux obligations 
          légales en vigueur au Burkina Faso.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">7. Vos droits</h2>
        <p>Vous disposez des droits suivants :</p>
        <ul className="text-muted-foreground">
          <li><strong>Droit d'accès :</strong> obtenir une copie de vos données</li>
          <li><strong>Droit de rectification :</strong> corriger vos données inexactes</li>
          <li><strong>Droit de suppression :</strong> demander l'effacement de vos données</li>
          <li><strong>Droit d'opposition :</strong> vous opposer à certains traitements</li>
          <li><strong>Droit à la portabilité :</strong> exporter vos données dans un format standard</li>
        </ul>
        <p>
          Pour exercer ces droits : <a href="mailto:nafaagritech@gmail.com" className="text-primary">nafaagritech@gmail.com</a>
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">8. Sécurité</h2>
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger 
          vos données : chiffrement en transit (TLS) et au repos, contrôle d'accès strict, 
          sauvegardes régulières et surveillance continue.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">9. Cookies</h2>
        <p>
          NAFA - AGRITECH utilise uniquement des cookies techniques nécessaires au fonctionnement de 
          la plateforme (session, authentification). Aucun cookie publicitaire ou de traçage n'est utilisé.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">10. Contact</h2>
        <p>
          Pour toute question relative à la protection de vos données :<br />
          Délégué à la Protection des Données<br />
          Email : <a href="mailto:nafaagritech@gmail.com" className="text-primary">nafaagritech@gmail.com</a><br />
          Adresse : Bobo-Dioulasso, Burkina Faso<br />
          Téléphone : +226 75 77 48 52 / +226 50 13 49 20
        </p>
        <p>
          Vous pouvez également adresser une réclamation à la Commission de l'Informatique et 
          des Libertés (CIL) du Burkina Faso.
        </p>
      </main>
    </div>
    <Footer />
  </div>
);

export default PolitiqueConfidentialite;
