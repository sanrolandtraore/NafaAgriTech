import React, { useEffect } from "react";
import { getCanonicalUrl, getSiteUrl } from "@/lib/seoConfig";

export interface SEOHeadProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "product";
  keywords?: string[];
  noindex?: boolean;
  schemaJsonLd?: Record<string, any> | Array<Record<string, any>>;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

/**
 * Composant de gestion dynamique des balises SEO dans l'en-tête (HTML Head)
 * Compatible SPA et pré-rendu statique Vercel / SSG.
 */
export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  canonicalPath = "/",
  ogImage = "/logo.png",
  ogType = "website",
  keywords,
  noindex = false,
  schemaJsonLd,
  breadcrumbs,
}) => {
  const canonicalUrl = getCanonicalUrl(canonicalPath);
  const siteUrl = getSiteUrl();
  const absoluteOgImage = ogImage.startsWith("http") ? ogImage : `${siteUrl}${ogImage.startsWith("/") ? ogImage : `/${ogImage}`}`;

  const fullTitle = title
    ? (title.includes("NAFA") ? title : `${title} | NAFA-AGRITECH`)
    : "NAFA-AGRITECH | Plateforme d'aide à la décision agricole en Afrique";

  const fullDescription =
    description ||
    "Plateforme d'aide à la décision agropastorale en Afrique : diagnostic végétal, cartographie GPS, calcul d'irrigation, gestion d'exploitations et services partenaires.";

  useEffect(() => {
    // 1. Title
    document.title = fullTitle;

    // Helper pour mettre à jour ou créer une balise meta
    const setMetaTag = (attrName: "name" | "property", attrVal: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrVal}"]`) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // 2. Meta description
    setMetaTag("name", "description", fullDescription);

    // 3. Robots
    setMetaTag(
      "name",
      "robots",
      noindex
        ? "noindex, nofollow, noarchive"
        : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
    );

    // 4. Keywords
    if (keywords && keywords.length > 0) {
      setMetaTag("name", "keywords", keywords.join(", "));
    }

    // 5. Canonical link
    let canonicalTag = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalTag) {
      canonicalTag = document.createElement("link");
      canonicalTag.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute("href", canonicalUrl);

    // 6. Open Graph
    setMetaTag("property", "og:title", fullTitle);
    setMetaTag("property", "og:description", fullDescription);
    setMetaTag("property", "og:url", canonicalUrl);
    setMetaTag("property", "og:type", ogType);
    setMetaTag("property", "og:image", absoluteOgImage);
    setMetaTag("property", "og:site_name", "NAFA-AGRITECH");
    setMetaTag("property", "og:locale", "fr_FR");

    // 7. Twitter / X Cards
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", fullTitle);
    setMetaTag("name", "twitter:description", fullDescription);
    setMetaTag("name", "twitter:image", absoluteOgImage);

    // 8. Injection Schema.org (JSON-LD)
    const scriptId = "nafa-seo-jsonld";
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement("script");
      scriptTag.id = scriptId;
      scriptTag.type = "application/ld+json";
      document.head.appendChild(scriptTag);
    }

    const schemasToInject: any[] = [];
    if (schemaJsonLd) {
      if (Array.isArray(schemaJsonLd)) {
        schemasToInject.push(...schemaJsonLd);
      } else {
        schemasToInject.push(schemaJsonLd);
      }
    }

    if (breadcrumbs && breadcrumbs.length > 0) {
      schemasToInject.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((bc, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "name": bc.name,
          "item": bc.url.startsWith("http") ? bc.url : `${siteUrl}${bc.url}`
        }))
      });
    }

    if (schemasToInject.length > 0) {
      scriptTag.textContent = JSON.stringify(
        schemasToInject.length === 1 ? schemasToInject[0] : schemasToInject
      );
    } else {
      scriptTag.textContent = "";
    }

    return () => {
      // Nettoyage lors du démontage si besoin
    };
  }, [fullTitle, fullDescription, canonicalUrl, absoluteOgImage, ogType, noindex, keywords, schemaJsonLd, breadcrumbs, siteUrl]);

  return null;
};

export default SEOHead;
