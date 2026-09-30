import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";
import Footer from "@/components/Footer";

const ConditionsUtilisation = () => (
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
        <h1 className="text-3xl font-heading font-bold text-foreground">Conditions Générales d'Utilisation</h1>
        <p className="text-sm text-muted-foreground">Dernière mise à jour : 8 mars 2026</p>

        <h2 className="text-xl font-semibold text-foreground mt-8">1. Objet</h2>
        <p>
          Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de la plateforme 
          NAFA - AGRITECH, accessible à l'adresse nafa-agritech.com et via l'application mobile progressive (PWA). 
          En utilisant la plateforme, vous acceptez sans réserve les présentes CGU.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">2. Description du service</h2>
        <p>
          NAFA - AGRITECH est une plateforme numérique de gestion agricole qui permet aux agriculteurs, éleveurs, 
          experts agronomes et partenaires de :
        </p>
        <ul className="text-muted-foreground">
          <li>Gérer leurs exploitations agricoles et parcelles</li>
          <li>Suivre les cycles culturaux et l'élevage</li>
          <li>Planifier et optimiser les activités agricoles</li>
          <li>Gérer les coûts et la comptabilité</li>
          <li>Accéder à un marketplace de services agricoles</li>
          <li>Suivre des formations en agriculture et élevage</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground mt-8">3. Inscription et compte</h2>
        <p>
          L'accès à la plateforme nécessite la création d'un compte utilisateur. L'utilisateur s'engage 
          à fournir des informations exactes et à maintenir la confidentialité de ses identifiants. 
          Toute activité réalisée depuis un compte est sous la responsabilité du titulaire.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">4. Accès au service</h2>
        <p>
          NAFA - AGRITECH est proposé gratuitement : toutes les fonctionnalités de la plateforme sont
          accessibles sans abonnement ni frais.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">5. Propriété des données</h2>
        <p>
          Les données saisies par l'utilisateur restent sa propriété exclusive. NAFA - AGRITECH s'engage à ne 
          pas vendre, céder ou partager ces données à des tiers sans consentement explicite. L'utilisateur 
          peut exporter et supprimer ses données à tout moment.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">6. Responsabilités</h2>
        <p>
          NAFA - AGRITECH met tout en œuvre pour assurer la disponibilité et la fiabilité de la plateforme. 
          Toutefois, NAFA - AGRITECH ne saurait être tenu responsable des :
        </p>
        <ul className="text-muted-foreground">
          <li>Interruptions de service dues à des cas de force majeure</li>
          <li>Pertes de données liées à des événements échappant à son contrôle</li>
          <li>Décisions agricoles prises sur la base des données de la plateforme</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground mt-8">7. Utilisation acceptable</h2>
        <p>L'utilisateur s'engage à ne pas :</p>
        <ul className="text-muted-foreground">
          <li>Utiliser la plateforme à des fins illégales</li>
          <li>Tenter de contourner les mesures de sécurité</li>
          <li>Partager ses identifiants avec des tiers non autorisés</li>
          <li>Introduire des contenus malveillants</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground mt-8">8. Résiliation</h2>
        <p>
          L'utilisateur peut résilier son compte à tout moment depuis les paramètres de l'application. 
          NAFA - AGRITECH se réserve le droit de suspendre ou résilier un compte en cas de violation des présentes CGU.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">9. Droit applicable et juridiction</h2>
        <p>
          Les présentes CGU sont soumises au droit burkinabè. Tout litige sera de la compétence exclusive 
          des tribunaux de Bobo-Dioulasso, Burkina Faso.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">10. Contact</h2>
        <p>
          Pour toute question relative aux présentes CGU :<br />
          Email : <a href="mailto:nafaagritech@gmail.com" className="text-primary">nafaagritech@gmail.com</a><br />
          Adresse : Bobo-Dioulasso, Burkina Faso<br />
          Téléphone : +226 75 77 48 52 / +226 50 13 49 20
        </p>
      </main>
    </div>
    <Footer />
  </div>
);

export default ConditionsUtilisation;
