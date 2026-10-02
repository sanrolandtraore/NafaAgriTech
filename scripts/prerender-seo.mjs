/**
 * scripts/prerender-seo.mjs
 * 
 * Script post-build pour le SEO technique NAFA-AGRITECH.
 * Génère des fichiers statiques dist/<route>/index.html avec balises meta canoniques,
 * Open Graph, Twitter Cards, Schema.org JSON-LD et contenu sémantique pré-rendu
 * pour garantir une indexation optimale par Googlebot, Bingbot et les crawlers sociaux.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const BASE_URL = 'https://nafaagritech.app';

const PAGES = [
  {
    path: '/',
    title: "NAFA-AGRITECH | Plateforme d'aide à la décision agricole en Afrique",
    description: "Plateforme numérique d'aide à la décision agricole et pastorale en Afrique de l'Ouest : diagnostic végétal, cartographie GPS, calcul d'irrigation, gestion d'exploitations et mise en relation avec des partenaires techniques certifiés.",
    h1: "La technologie au service de l'agriculture africaine",
    lead: "NAFA-AGRITECH est une plateforme numérique d'aide à la décision agricole et pastorale conçue pour les agriculteurs, éleveurs, agronomes et professionnels sahéliens.",
    keywords: "plateforme agricole Burkina Faso, solution agricole Afrique de l'Ouest, aide à la décision agricole, application agricole mobile",
    schemaType: "Organization",
  },
  {
    path: '/solutions',
    title: "Solutions Technologiques & Décisionnelles | NAFA-AGRITECH",
    description: "Découvrez notre suite complète d'outils numériques pour l'agriculture et l'élevage : diagnostic foliaire, arpentage GPS, dimensionnement d'irrigation, planning cultural et suivi d'élevage.",
    h1: "Nos Solutions Numériques d'Aide à la Décision",
    lead: "Des outils spécialisés conçus pour répondre aux réalités climatiques et pédologiques sahéliennes et ouest-africaines.",
    keywords: "solutions agritech, outils numériques agricoles, ingénierie agronomique sahélienne",
  },
  {
    path: '/solutions/diagnostic-agricole',
    title: "Diagnostic Agricole et Identification des Cultures | NAFA-AGRITECH",
    description: "Identifiez avec précision les cultures, adventices et maladies végétales grâce au moteur botanique NAFA Vision autonome adossé aux référentiels scientifiques INERA, FAO et PlantVillage.",
    h1: "Diagnostic Végétal et Détection des Maladies Agricoles",
    lead: "Module d'identification autonome et d'évaluation des pathologies végétales basé sur des données ouvertes et scientifiques fiables.",
    keywords: "diagnostic maladie plante, diagnostic culture, identification plante, mildiou tomate, striga maïs",
  },
  {
    path: '/solutions/cartographie-agricole',
    title: "Cartographie et GPS des Exploitations Agricoles | NAFA-AGRITECH",
    description: "Arpentage géodésique de haute précision, mesure de surface et de périmètre par GPS terrain, découpage parcellaire et export KML/GeoJSON pour agriculteurs et experts.",
    h1: "Cartographie et Arpentage GPS des Parcelles Agricoles",
    lead: "Relevez vos coordonnées GPS sur le terrain, calculez vos superficies au centimètre près et exportez vos parcelles.",
    keywords: "cartographie parcelle agricole, GPS agriculture, mesurer une parcelle agricole, arpentage terrain agricole",
  },
  {
    path: '/solutions/conseils-agronomiques',
    title: "Conseils Agronomiques et Fiches Techniques Sahéliennes | NAFA-AGRITECH",
    description: "Fiches techniques variétales certifiées INERA, itinéraires techniques culturaux, plans de fertilisation NPK/Urée et protection intégrée des cultures sahéliennes.",
    h1: "Conseil Agronomique de Précision et Recommandations Sahéliennes",
    lead: "Itinéraires techniques culturaux adaptés aux zones soudano-sahéliennes et calendriers culturaux personnalisés.",
    keywords: "conseil agricole, fiches techniques cultures Burkina, fertilisation maïs coton sésame",
  },
  {
    path: '/solutions/irrigation',
    title: "Dimensionnement Hydraulique et Conseil en Irrigation | NAFA-AGRITECH",
    description: "Calcul des besoins en eau des cultures selon la méthode FAO-56, dimensionnement de réseaux goutte-à-goutte et aspersions solaires, et mise en relation avec des installateurs certifiés.",
    h1: "Calcul des Besoins en Eau et Ingénierie d'Irrigation",
    lead: "Optimisez chaque goutte d'eau grâce au calcul d'évapotranspiration FAO-56 et découvrez nos partenaires installateurs d'irrigation.",
    keywords: "système irrigation agricole, dimensionnement goutte à goutte, calcul besoin eau culture, pompe solaire agricole",
  },
  {
    path: '/solutions/suivi-exploitation',
    title: "Suivi d'Exploitation et Gestion Technico-Économique | NAFA-AGRITECH",
    description: "Tableau de bord de gestion d'exploitation : cahier de culture numérique, enregistrement des interventions, suivi des intrants, calcul des rendements et marge brute.",
    h1: "Suivi d'Exploitation et Gestion Technico-Économique",
    lead: "Pilotez la rentabilité de votre exploitation agricole avec un cahier de culture complet et un suivi des coûts d'exploitation.",
    keywords: "gestion exploitation agricole, logiciel gestion agricole, suivi récoltes dépenses",
  },
  {
    path: '/solutions/elevage',
    title: "Gestion d'Élevage et Suivi de Santé Animale | NAFA-AGRITECH",
    description: "Suivi des troupeaux bovins, ovins, caprins et volailles : calendriers vaccinaux, prophylaxie, alimentation, reproduction et mise en relation avec des vétérinaires certifiés.",
    h1: "Pilotage Pastoral et Suivi de la Santé Animale",
    lead: "Gestion sanitaire et zootechnique de cheptel, alertes vaccinales et mise en relation avec le réseau vétérinaire partenaire.",
    keywords: "gestion élevage bovin ovin, suivi santé animale, calendrier vaccinal bétail, vétérinaire agricole",
  },
  {
    path: '/solutions/ia-copilote',
    title: "Copilote Agronomique NAFA Genius | NAFA-AGRITECH",
    description: "Assistant d'aide à la décision agronomique intégré : analyse croisée sol-climat-plante, recommandations agro-écologiques et aide à la rédaction de devis techniques.",
    h1: "Copilote Numérique d'Aide à la Décision Agronomique",
    lead: "Un copilote analytique combinant les référentiels scientifiques pour guider vos choix agricoles au quotidien.",
    keywords: "intelligence artificielle agriculture, assistant agronome, recommandations agricoles",
  },
  {
    path: '/services',
    title: "Services Techniques Proposés par nos Partenaires | NAFA-AGRITECH",
    description: "Découvrez les offres réelles des partenaires techniques certifiés : arpentage topographique, installation de forages et pompes solaires, labours mécanisés et soins vétérinaires.",
    h1: "Services Techniques Proposés par nos Partenaires",
    lead: "NAFA-AGRITECH facilite la découverte et la mise en relation avec des prestataires et techniciens agricoles qualifiés. Les interventions sont réalisées exclusivement par nos partenaires certifiés.",
    keywords: "services agricoles Burkina Faso, prestataire irrigation, travaux agricoles mécanisés, soins vétérinaires partenaires",
  },
  {
    path: '/partenaires',
    title: "Annuaire des Partenaires Techniques Certifiés | NAFA-AGRITECH",
    description: "Consultez l'annuaire officiel des partenaires enregistrés : installateurs d'irrigation, fournisseurs d'intrants certifiés, vétérinaires agréés et institutions de financement agricole.",
    h1: "Réseau et Annuaire des Partenaires NAFA-AGRITECH",
    lead: "Trouvez un partenaire technique certifié vérifié par NAFA-AGRITECH pour vous accompagner sur votre exploitation.",
    keywords: "partenaires agricoles, fournisseurs intrants certifiés, installateurs irrigation agréés, microfinance agricole",
  },
  {
    path: '/marketplace',
    title: "Marché Agricole & Intrants Certifiés | NAFA-AGRITECH",
    description: "Marché d'équipements, intrants et services proposés par les professionnels et partenaires enregistrés : semences certifiées, pompage solaire, phytosanitaires bio et outillage.",
    h1: "Marché Agricole — Offres Réelles de Partenaires",
    lead: "Consultez les offres vérifiées de semences, engrais, matériels d'irrigation et prestations de services agricoles.",
    keywords: "marché agricole, marketplace agricole, achat semences certifiées, matériel irrigation, engrais Burkina Faso",
  },
  {
    path: '/ressources',
    title: "Guides Pratiques & Ressources Agronomiques | NAFA-AGRITECH",
    description: "Guides pratiques gratuits pour agriculteurs et techniciens : méthodologie d'arpentage GPS, diagnostic foliaire, dimensionnement de pompes solaires et gestion sanitaire d'élevage.",
    h1: "Guides Pratiques et Référentiels Techniques",
    lead: "Consultez nos guides et documentations méthodologiques téléchargeables pour optimiser vos pratiques agronomiques de terrain.",
    keywords: "guide agricole gratuit, méthodologie arpentage GPS champ, guide irrigation goutte à goutte, fiches techniques agriculture",
  },
  {
    path: '/fiches-techniques',
    title: "Fiches Techniques Agronomiques Sahéliennes | NAFA-AGRITECH",
    description: "Référentiel agronomique complet sur plus de 200 cultures adaptées au climat sahélien : maïs, sorgho, niébé, sésame, tomate, oignon, manguier, anacardier.",
    h1: "Fiches Techniques des Cultures Tropicales & Sahéliennes",
    lead: "Données variétales, besoins climatiques, cycles végétatifs et itinéraires de fertilisation documentés.",
    keywords: "fiches techniques cultures, itinéraire technique maïs, culture sésame Burkina, maraîchage sahélien",
  },
  {
    path: '/a-propos',
    title: "À Propos de NAFA-AGRITECH | Notre Mission pour l'Agriculture",
    description: "NAFA-AGRITECH est une startup agritech dédiée à la modernisation de l'agriculture et de l'élevage africains à travers des technologies d'aide à la décision accessibles et souveraines.",
    h1: "À Propos de NAFA-AGRITECH",
    lead: "Notre mission : doter chaque producteur, éleveur et technicien agricole d'outils numériques fiables pour sécuriser ses rendements.",
    keywords: "startup agritech Burkina Faso, technologie agricole Afrique, équipe NAFA-AGRITECH",
  },
  {
    path: '/contact',
    title: "Contact & Support Technique | NAFA-AGRITECH",
    description: "Contactez l'équipe NAFA-AGRITECH pour toute demande d'information, de partenariat technique ou d'assistance sur la plateforme.",
    h1: "Contactez NAFA-AGRITECH",
    lead: "Notre équipe agronomique et technique est à votre écoute pour vous accompagner.",
    keywords: "contact NAFA-AGRITECH, support agricole, partenariat agritech",
  },
  {
    path: '/mentions-legales',
    title: "Mentions Légales | NAFA-AGRITECH",
    description: "Informations légales et éditoriales concernant la plateforme NAFA-AGRITECH.",
    h1: "Mentions Légales",
    lead: "Cadre légal d'utilisation de la plateforme numérique NAFA-AGRITECH.",
    keywords: "mentions légales NAFA-AGRITECH",
  },
  {
    path: '/conditions-utilisation',
    title: "Conditions Générales d'Utilisation | NAFA-AGRITECH",
    description: "Conditions générales d'utilisation de la plateforme et des services de mise en relation NAFA-AGRITECH.",
    h1: "Conditions Générales d'Utilisation",
    lead: "Modalités d'accès, d'inscription et règles applicables aux utilisateurs et partenaires techniques.",
    keywords: "CGU NAFA-AGRITECH, conditions utilisation",
  },
  {
    path: '/politique-confidentialite',
    title: "Politique de Confidentialité & Protection des Données | NAFA-AGRITECH",
    description: "Politique de protection des données personnelles et agronomiques sur la plateforme NAFA-AGRITECH.",
    h1: "Politique de Confidentialité",
    lead: "Nos engagements pour la sécurité et la souveraineté de vos données agricoles et personnelles.",
    keywords: "confidentialité données agricoles, RGPD NAFA-AGRITECH",
  },
];

function buildLdJson(page) {
  const canonicalUrl = page.path === '/' ? BASE_URL : `${BASE_URL}${page.path}`;
  
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "NAFA-AGRITECH",
    "url": BASE_URL,
    "logo": `${BASE_URL}/logo.png`,
    "description": "Plateforme numérique d'aide à la décision agricole et pastorale en Afrique de l'Ouest.",
    "email": "nafaagritech@gmail.com",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Ouagadougou",
      "addressCountry": "BF"
    },
    "sameAs": [
      "https://facebook.com/nafa-agritech",
      "https://linkedin.com/company/nafa-agritech",
      "https://twitter.com/nafa_agritech"
    ]
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Accueil",
        "item": BASE_URL
      },
      ...(page.path !== '/' ? [{
        "@type": "ListItem",
        "position": 2,
        "name": page.h1,
        "item": canonicalUrl
      }] : [])
    ]
  };

  const softwareApp = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "NAFA-AGRITECH",
    "operatingSystem": "All (Web, PWA, Android, iOS)",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "XOF"
    },
    "description": page.description
  };

  return JSON.stringify([organization, breadcrumbs, softwareApp]);
}

function prerender() {
  const templatePath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(templatePath)) {
    console.error(`[prerender-seo] Erreur: Le fichier template ${templatePath} n'existe pas. Lancez d'abord 'vite build'.`);
    process.exit(1);
  }

  const template = fs.readFileSync(templatePath, 'utf-8');
  console.log(`[prerender-seo] Démarrage du pré-rendu statique SEO pour ${PAGES.length} routes publiques...`);

  let count = 0;

  for (const page of PAGES) {
    const canonicalUrl = page.path === '/' ? BASE_URL : `${BASE_URL}${page.path}`;
    const ldJson = buildLdJson(page);

    let html = template;

    // 1. Remplacement du Title
    html = html.replace(/<title>.*?<\/title>/i, `<title>${page.title}</title>`);

    // 2. Remplacement de la Meta Description
    html = html.replace(/<meta name="description" content=".*?"\s*\/?>/i, `<meta name="description" content="${page.description}" />`);

    // 3. Mise à jour de la Canonical URL
    if (html.includes('<link rel="canonical"')) {
      html = html.replace(/<link rel="canonical" href=".*?"\s*\/?>/i, `<link rel="canonical" href="${canonicalUrl}" />`);
    } else {
      html = html.replace('</head>', `  <link rel="canonical" href="${canonicalUrl}" />\n</head>`);
    }

    // 4. Balises Open Graph
    html = html.replace(/<meta property="og:title" content=".*?"\s*\/?>/i, `<meta property="og:title" content="${page.title}" />`);
    html = html.replace(/<meta property="og:description" content=".*?"\s*\/?>/i, `<meta property="og:description" content="${page.description}" />`);
    html = html.replace(/<meta property="og:url" content=".*?"\s*\/?>/i, `<meta property="og:url" content="${canonicalUrl}" />`);

    // 5. Twitter Card
    html = html.replace(/<meta name="twitter:title" content=".*?"\s*\/?>/i, `<meta name="twitter:title" content="${page.title}" />`);
    html = html.replace(/<meta name="twitter:description" content=".*?"\s*\/?>/i, `<meta name="twitter:description" content="${page.description}" />`);

    // 6. Insertion du script Schema.org JSON-LD
    const jsonLdTag = `\n  <script type="application/ld+json">\n${ldJson}\n  </script>\n`;
    html = html.replace('</head>', `${jsonLdTag}</head>`);

    // 7. Injection de contenu sémantique statique pour les moteurs de recherche
    // Ce bloc est masqué ou hydraté par React dès l'exécution du bundle JS
    const semanticFallback = `
      <article id="seo-static-content" style="display:none" class="sr-only" aria-hidden="false">
        <header>
          <h1>${page.h1}</h1>
          <p>${page.lead}</p>
        </header>
        <nav aria-label="Navigation sémantique">
          <a href="/">Accueil</a>
          <a href="/solutions">Solutions Agricoles</a>
          <a href="/services">Services Techniques Partenaires</a>
          <a href="/partenaires">Partenaires Certifiés</a>
          <a href="/marketplace">Marché</a>
          <a href="/ressources">Ressources & Guides</a>
        </nav>
      </article>
    `;
    html = html.replace('<div id="root">', `<div id="root">${semanticFallback}`);

    // Écriture du fichier cible
    if (page.path === '/') {
      fs.writeFileSync(path.join(DIST_DIR, 'index.html'), html, 'utf-8');
    } else {
      const targetDir = path.join(DIST_DIR, page.path.replace(/^\//, ''));
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf-8');
    }

    count++;
  }

  console.log(`[prerender-seo] Succès : ${count} pages pré-rendues avec balises canoniques et données structurées dans ${DIST_DIR}`);
}

prerender();
