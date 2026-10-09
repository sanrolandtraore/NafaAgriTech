import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";
import Footer from "@/components/Footer";

const MentionsLegales = () => (
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
        <h1 className="text-3xl font-heading font-bold text-foreground">Mentions Légales</h1>
        <p className="text-sm text-muted-foreground">Dernière mise à jour : 8 mars 2026</p>

        <h2 className="text-xl font-semibold text-foreground mt-8">1. Éditeur du site</h2>
        <p>
          <strong>NAFA - AGRITECH</strong><br />
          Société à Responsabilité Limitée (SARL)<br />
          Capital social : 1 000 000 FCFA<br />
          Siège social : Bobo-Dioulasso, Burkina Faso<br />
          RCCM : BF-BBD-01-2026-XXXXX<br />
          IFU : XXXXXXXXXX<br />
          Email : <a href="mailto:nafaagritech@gmail.com" className="text-primary">nafaagritech@gmail.com</a><br />
          Téléphone : +226 75 77 48 52 / +226 50 13 49 20
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">2. Directeur de la publication</h2>
        <p>Le Directeur de la publication est le Gérant de la société NAFA - AGRITECH.</p>

        <h2 className="text-xl font-semibold text-foreground mt-8">3. Hébergement</h2>
        <p>
          Le site est hébergé par :<br />
          <strong>Infrastructure Sécurisée NAFA AGRITECH</strong><br />
          Serveurs sécurisés avec chiffrement des données en transit et au repos.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">4. Propriété intellectuelle</h2>
        <p>
          L'ensemble du contenu du site NAFA - AGRITECH (textes, images, graphismes, logo, icônes, logiciels) 
          est la propriété exclusive de NAFA - AGRITECH ou de ses partenaires et est protégé par les lois 
          burkinabè et internationales relatives à la propriété intellectuelle.
        </p>
        <p>
          Toute reproduction, représentation, modification ou exploitation non autorisée de tout ou partie 
          du contenu est strictement interdite.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">5. Données personnelles</h2>
        <p>
          Conformément à la loi n°001-2021/AN du 30 mars 2021 portant protection des personnes à l'égard 
          du traitement des données à caractère personnel au Burkina Faso, et au Règlement de l'UEMOA 
          relatif à la protection des données personnelles, vous disposez d'un droit d'accès, de rectification, 
          de suppression et d'opposition concernant vos données personnelles.
        </p>
        <p>
          Pour exercer ces droits, contactez-nous à : <a href="mailto:nafaagritech@gmail.com" className="text-primary">nafaagritech@gmail.com</a>
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-8">6. Droit applicable</h2>
        <p>
          Les présentes mentions légales sont régies par le droit burkinabè. En cas de litige, 
          les tribunaux de Bobo-Dioulasso seront seuls compétents.
        </p>
      </main>
    </div>
    <Footer />
  </div>
);

export default MentionsLegales;
