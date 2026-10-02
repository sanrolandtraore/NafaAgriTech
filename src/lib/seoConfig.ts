/**
 * CONFIGURATION SEO & STRUCTURED DATA — NAFA-AGRITECH
 * 
 * Gestionnaire centralisé du domaine officiel, des balises canoniques,
 * de l'Open Graph, de Twitter Card et des schémas Schema.org (JSON-LD).
 */

export const DEFAULT_SITE_URL = "https://nafaagritech.app";

export function getSiteUrl(): string {
  // Support d'une variable d'environnement optionnelle si le domaine change
  const envUrl = typeof import.meta !== "undefined" && import.meta.env?.VITE_SITE_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.startsWith("http")) {
    return envUrl.replace(/\/+$/, "");
  }
  return DEFAULT_SITE_URL;
}

export function getCanonicalUrl(path: string = "/"): string {
  const base = getSiteUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  // Normalisation : pas de slash de fin sauf pour la racine
  if (cleanPath === "/" || cleanPath === "") {
    return base;
  }
  return `${base}${cleanPath.replace(/\/+$/, "")}`;
}

export interface SeoPageMetadata {
  title: string;
  description: string;
  canonicalPath: string;
  keywords?: string[];
  ogType?: "website" | "article" | "product";
  ogImage?: string;
  noindex?: boolean;
}

/**
 * Catalogue centralisé des métadonnées SEO pour l'ensemble des pages publiques
 */
export const SEO_PAGES: Record<string, SeoPageMetadata> = {
  home: {
    title: "NAFA-AGRITECH | Plateforme d'aide à la décision agricole en Afrique",
    description: "Plateforme numérique d'aide à la décision agricole et pastorale en Afrique de l'Ouest : diagnostic végétal, cartographie GPS, calcul d'irrigation, gestion d'exploitations et mise en relation avec des partenaires techniques certifiés.",
    canonicalPath: "/",
    keywords: [
      "plateforme agricole Burkina Faso",
      "solution agricole Afrique de l'Ouest",
      "aide à la décision agricole",
      "application agricole mobile",
      "logiciel gestion exploitation",
      "technologie agricole sahélienne",
    ],
    ogType: "website",
  },
  solutionsHub: {
    title: "Solutions Technologiques & Décisionnelles | NAFA-AGRITECH",
    description: "Découvrez notre suite complète d'outils numériques pour l'agriculture et l'élevage : diagnostic foliaire, arpentage GPS, dimensionnement d'irrigation, planning cultural et suivi d'élevage.",
    canonicalPath: "/solutions",
    keywords: [
      "solutions agritech",
      "outils numériques agricoles",
      "ingénierie agronomique sahélienne",
      "logiciel agricole",
    ],
  },
  solutionDiagnostic: {
    title: "Diagnostic Agricole et Identification des Cultures | NAFA-AGRITECH",
    description: "Identifiez avec précision les cultures, adventices et maladies végétales grâce au moteur botanique NAFA Vision autonome adossé aux référentiels scientifiques INERA, FAO et PlantVillage.",
    canonicalPath: "/solutions/diagnostic-agricole",
    keywords: [
      "diagnostic maladie plante",
      "diagnostic culture",
      "identification plante",
      "mildiou tomate traitement",
      "striga maïs désherbage",
      "pathologie végétale Burkina Faso",
    ],
  },
  solutionCartographie: {
    title: "Cartographie et GPS des Exploitations Agricoles | NAFA-AGRITECH",
    description: "Arpentage géodésique de haute précision, mesure de surface et de périmètre par GPS terrain, découpage parcellaire et export KML/GeoJSON pour agriculteurs et experts.",
    canonicalPath: "/solutions/cartographie-agricole",
    keywords: [
      "cartographie parcelle agricole",
      "GPS agriculture",
      "mesurer une parcelle agricole",
      "arpentage terrain agricole",
      "délimitation champ GPS",
    ],
  },
  solutionConseils: {
    title: "Conseils Agronomiques et Fiches Techniques Sahéliennes | NAFA-AGRITECH",
    description: "Fiches techniques variétales certifiées INERA, itinéraires techniques culturaux, plans de fertilisation NPK/Urée et protection intégrée des cultures sahéliennes.",
    canonicalPath: "/solutions/conseils-agronomiques",
    keywords: [
      "conseil agricole",
      "fiches techniques cultures Burkina",
      "fertilisation maïs coton sésame",
      "itinéraire technique céréales",
    ],
  },
  solutionIrrigation: {
    title: "Conception et Optimisation de l'Irrigation Agricole | NAFA-AGRITECH",
    description: "Calcul hydraulique conforme aux normes FAO-56, dimensionnement de pompage solaire, réseau de goutte-à-goutte et optimisation de la ressource en eau en zone aride.",
    canonicalPath: "/solutions/irrigation",
    keywords: [
      "irrigation agricole",
      "conception irrigation",
      "pompage solaire agricole",
      "goutte à goutte Burkina Faso",
      "dimensionnement réseau hydraulique",
    ],
  },
  solutionSuivi: {
    title: "Suivi d'Exploitation et Planning Cultural | NAFA-AGRITECH",
    description: "Journal de bord numérique d'exploitation : calendrier des semis, suivi des travaux du sol, gestion des intrants, calcul des coûts et prévision des récoltes.",
    canonicalPath: "/solutions/suivi-exploitation",
    keywords: [
      "suivi exploitation agricole",
      "gestion ferme agricole",
      "planning cultural",
      "cahier de culture numérique",
    ],
  },
  solutionElevage: {
    title: "Gestion d'Élevage et Suivi Zootechnique | NAFA-AGRITECH",
    description: "Suivi du cheptel (bovins, ovins, caprins, volailles), calendrier prophylactique et vaccinal, formulation des rations alimentaires et rentabilité de l'élevage.",
    canonicalPath: "/solutions/elevage",
    keywords: [
      "gestion élevage",
      "suivi troupeau",
      "santé animale vétérinaire",
      "rationnement bétail",
      "aviculture sahélienne",
    ],
  },
  solutionIaCopilote: {
    title: "NAFA Genius | Copilote d'Ingénierie Agronomique | NAFA-AGRITECH",
    description: "Assistant d'aide à la décision agronomique opérationnel sans connexion internet : synthèses géodésiques, calculs hydrauliques et génération instantanée de devis en FCFA.",
    canonicalPath: "/solutions/ia-copilote",
    keywords: [
      "copilote agronomique",
      "assistant ingénieur agricole",
      "devis travaux agricoles FCFA",
      "calculateur agricole",
    ],
  },
  services: {
    title: "Services Techniques Agricoles Proposés par nos Partenaires | NAFA-AGRITECH",
    description: "Découvrez les prestations techniques réalisées par des partenaires professionnels certifiés : labours mécanisés, forage et irrigation, pulvérisation phytosanitaire et soins vétérinaires.",
    canonicalPath: "/services",
    keywords: [
      "services agricoles Burkina Faso",
      "prestataire agricole",
      "services techniques agricoles",
      "labour tracteur location",
      "services vétérinaires",
      "forage agricole",
    ],
  },
  partenaires: {
    title: "Annuaire des Partenaires Techniques et Professionnels | NAFA-AGRITECH",
    description: "Consultez l'annuaire des entreprises, fournisseurs d'intrants, bureaux d'études, banques et institutions agréées intervenant dans le secteur agricole au Burkina Faso.",
    canonicalPath: "/partenaires",
    keywords: [
      "partenaires agricoles",
      "entreprises agrobusiness Burkina",
      "fournisseur intrants semences",
      "crédit agricole partenaire",
    ],
  },
  marketplace: {
    title: "Marché Agricole — Offres Réelles de Produits et Services | NAFA-AGRITECH",
    description: "Accédez aux offres réelles publiées par nos partenaires enregistrés : matériels agricoles, semences certifiées, intrants biologiques, prestations de machinisme et services d'élevage.",
    canonicalPath: "/marketplace",
    keywords: [
      "marché agricole",
      "marketplace agricole",
      "achat semences certifiées",
      "équipements agricoles Burkina Faso",
      "location tracteur",
      "offres partenaires agricoles",
    ],
  },
  ressources: {
    title: "Guides et Ressources Pratiques pour l'Agriculture Sahélienne | NAFA-AGRITECH",
    description: "Guides techniques, tutoriels méthodologiques et fiches de bonnes pratiques agricoles : mesure de parcelles par GPS, diagnostic des maladies, choix du système d'irrigation et gestion du cheptel.",
    canonicalPath: "/ressources",
    keywords: [
      "guide agricole pratique",
      "comment mesurer une parcelle",
      "identifier maladie plante",
      "choisir irrigation solaire",
      "bonnes pratiques agricoles",
    ],
  },
  about: {
    title: "À Propos de NAFA-AGRITECH | Notre Vision et Technologie",
    description: "Découvrez la mission de NAFA-AGRITECH : développer des solutions numériques d'aide à la décision adaptées aux réalités agropastorales africaines et favoriser la synergie avec les acteurs de terrain.",
    canonicalPath: "/a-propos",
  },
  contact: {
    title: "Contact et Assistance | NAFA-AGRITECH",
    description: "Contactez l'équipe NAFA-AGRITECH pour toute demande d'information, partenariat technique, support utilisateur ou accompagnement institutionnel.",
    canonicalPath: "/contact",
  },
  mentionsLegales: {
    title: "Mentions Légales | NAFA-AGRITECH",
    description: "Informations légales et éditeur de la plateforme NAFA-AGRITECH.",
    canonicalPath: "/mentions-legales",
  },
  conditionsUtilisation: {
    title: "Conditions Générales d'Utilisation | NAFA-AGRITECH",
    description: "Conditions régissant l'utilisation de la plateforme NAFA-AGRITECH et des services de mise en relation.",
    canonicalPath: "/conditions-utilisation",
  },
  politiqueConfidentialite: {
    title: "Politique de Confidentialité et Protection des Données | NAFA-AGRITECH",
    description: "Engagements de NAFA-AGRITECH concernant la confidentialité, le respect de la vie privée et la sécurité des données agricoles.",
    canonicalPath: "/politique-confidentialite",
  },
  fichesTechniques: {
    title: "Fiches Techniques Agronomiques Sahéliennes | NAFA-AGRITECH",
    description: "Bibliothèque de fiches techniques des cultures du Burkina Faso : variétés certifiées, cycles végétatifs, rendements et protection intégrée.",
    canonicalPath: "/fiches-techniques",
  },
  explorer: {
    title: "Simulateurs & Démonstrations en Libre Accès | NAFA-AGRITECH",
    description: "Testez nos outils de calcul agronomique, simulateur hydraulique et fiches sans inscription préalable.",
    canonicalPath: "/explorer",
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// SCHÉMAS STRUCTURÉS SCHEMA.ORG (JSON-LD)
// ══════════════════════════════════════════════════════════════════════════════

export function generateOrganizationSchema() {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "NAFA-AGRITECH",
    "alternateName": ["NAFA AGRITECH", "NAFA Agro Hub"],
    "url": siteUrl,
    "logo": `${siteUrl}/logo.png`,
    "description": "Plateforme numérique d'aide à la décision agricole et pastorale en Afrique de l'Ouest. Outils de diagnostic végétal, cartographie GPS, calcul d'irrigation et écosystème de partenaires techniques.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Bobo-Dioulasso",
      "addressRegion": "Hauts-Bassins",
      "addressCountry": "BF"
    },
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "telephone": "+22675774852",
        "contactType": "customer service",
        "availableLanguage": ["French", "Moore", "Dioula"]
      },
      {
        "@type": "ContactPoint",
        "telephone": "+22650134920",
        "contactType": "technical support",
        "availableLanguage": ["French"]
      }
    ],
    "email": "nafaagritech@gmail.com",
    "sameAs": []
  };
}

export function generateWebsiteSchema() {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "NAFA-AGRITECH",
    "url": siteUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${siteUrl}/marketplace?search={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
}

export function generateSoftwareApplicationSchema() {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "NAFA-AGRITECH",
    "operatingSystem": "All (Web, Android PWA, iOS PWA)",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "XOF",
      "description": "Accès libre aux outils de consultation et simulateurs de base"
    },
    "description": "Application progressive (PWA) d'ingénierie et d'aide à la décision agricole adaptée aux conditions sahéliennes : arpentage GPS, diagnostic végétal, hydraulique et gestion d'exploitation.",
    "url": siteUrl,
    "screenshot": `${siteUrl}/logo.png`
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url.startsWith("http") ? item.url : `${siteUrl}${item.url}`
    }))
  };
}

export function generateServiceSchema(params: {
  name: string;
  description: string;
  providerName: string;
  providerUrl?: string;
  category?: string;
  areaServed?: string;
  serviceUrl?: string;
}) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": params.name,
    "description": params.description,
    "serviceType": params.category || "Service Agricole Technique",
    "provider": {
      "@type": "Organization",
      "name": params.providerName,
      "url": params.providerUrl ? (params.providerUrl.startsWith("http") ? params.providerUrl : `${siteUrl}${params.providerUrl}`) : siteUrl
    },
    "areaServed": {
      "@type": "Country",
      "name": params.areaServed || "Burkina Faso"
    },
    "url": params.serviceUrl ? (params.serviceUrl.startsWith("http") ? params.serviceUrl : `${siteUrl}${params.serviceUrl}`) : `${siteUrl}/services`
  };
}

export function generateProductSchema(params: {
  name: string;
  description: string;
  price?: number;
  currency?: string;
  sellerName: string;
  imageUrl?: string;
  category?: string;
  productUrl?: string;
}) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": params.name,
    "description": params.description,
    "category": params.category,
    "image": params.imageUrl || `${siteUrl}/logo.png`,
    "offers": {
      "@type": "Offer",
      "price": params.price !== undefined ? String(params.price) : "Sur devis",
      "priceCurrency": params.currency || "XOF",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": params.sellerName
      },
      "url": params.productUrl ? (params.productUrl.startsWith("http") ? params.productUrl : `${siteUrl}${params.productUrl}`) : `${siteUrl}/marketplace`
    }
  };
}

export function generateArticleSchema(params: {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  datePublished?: string;
}) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": params.title,
    "description": params.description,
    "image": params.imageUrl || `${siteUrl}/logo.png`,
    "author": {
      "@type": "Organization",
      "name": "NAFA-AGRITECH"
    },
    "publisher": {
      "@type": "Organization",
      "name": "NAFA-AGRITECH",
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/logo.png`
      }
    },
    "datePublished": params.datePublished || "2026-01-01",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": params.url.startsWith("http") ? params.url : `${siteUrl}${params.url}`
    }
  };
}

// Aliases générateurs Schema.org

export const buildOrganizationSchema = generateOrganizationSchema;
export const buildWebSiteSchema = generateWebsiteSchema;
export const buildSoftwareAppSchema = generateSoftwareApplicationSchema;
export const buildBreadcrumbSchema = (items: { name: string; path?: string; url?: string }[]) => {
  return generateBreadcrumbSchema(items.map(it => ({ name: it.name, url: it.path || it.url || "/" })));
};
export const buildServiceSchema = generateServiceSchema;
export const buildProductSchema = (params: {
  name: string;
  description: string;
  price?: number | string;
  currency?: string;
  sellerName: string;
  imageUrl?: string;
  category?: string;
  productUrl?: string;
}) => {
  const numPrice = typeof params.price === "number" ? params.price : (params.price ? Number(params.price) : undefined);
  const res = generateProductSchema({ ...params, price: numPrice });
  if (typeof params.price === "number") {
    (res.offers as any).price = params.price;
  }
  return res;
};
export const buildArticleSchema = generateArticleSchema;

