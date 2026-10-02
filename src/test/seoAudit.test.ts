import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  DEFAULT_SITE_URL,
  getCanonicalUrl,
  SEO_PAGES,
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildSoftwareAppSchema,
  buildBreadcrumbSchema,
  buildServiceSchema,
  buildProductSchema,
} from "@/lib/seoConfig";

describe("SEO Architecture & Metadata Audit", () => {
  it("uses the official canonical domain https://nafaagritech.app", () => {
    expect(DEFAULT_SITE_URL).toBe("https://nafaagritech.app");
    expect(getCanonicalUrl("/")).toBe("https://nafaagritech.app");
    expect(getCanonicalUrl("/solutions")).toBe("https://nafaagritech.app/solutions");
    expect(getCanonicalUrl("/solutions/diagnostic-agricole/")).toBe("https://nafaagritech.app/solutions/diagnostic-agricole");
  });

  it("ensures all public pages have unique, non-empty titles and descriptions", () => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    const pages = Object.entries(SEO_PAGES);

    expect(pages.length).toBeGreaterThanOrEqual(15);

    for (const [key, meta] of pages) {
      expect(meta.title).toBeTruthy();
      expect(meta.title.length).toBeGreaterThan(15);
      expect(meta.title).toContain("NAFA-AGRITECH");

      expect(meta.description).toBeTruthy();
      expect(meta.description.length).toBeGreaterThan(40);

      // Verify no duplicate titles across distinct public pages
      expect(titles.has(meta.title), `Duplicate title found: ${meta.title} (key: ${key})`).toBe(false);
      titles.add(meta.title);

      // Verify no duplicate descriptions across distinct public pages
      expect(descriptions.has(meta.description), `Duplicate description found: ${meta.description}`).toBe(false);
      descriptions.add(meta.description);
    }
  });

  it("verifies the 7 dedicated agricultural solutions are properly configured", () => {
    const requiredSolutions = [
      "solutionDiagnostic",
      "solutionCartographie",
      "solutionConseils",
      "solutionIrrigation",
      "solutionSuivi",
      "solutionElevage",
      "solutionIaCopilote",
    ];

    for (const key of requiredSolutions) {
      expect(SEO_PAGES[key]).toBeDefined();
      expect(SEO_PAGES[key].canonicalPath).toMatch(/^\/solutions\//);
    }
  });

  it("generates compliant Schema.org JSON-LD structures", () => {
    const org = buildOrganizationSchema();
    expect(org["@type"]).toBe("Organization");
    expect(org.name).toBe("NAFA-AGRITECH");
    expect(org.url).toBe("https://nafaagritech.app");

    const site = buildWebSiteSchema();
    expect(site["@type"]).toBe("WebSite");
    expect(site.potentialAction).toBeDefined();

    const app = buildSoftwareAppSchema();
    expect(app["@type"]).toBe("SoftwareApplication");

    const breadcrumbs = buildBreadcrumbSchema([
      { name: "Accueil", path: "/" },
      { name: "Solutions", path: "/solutions" },
      { name: "Diagnostic Agricole", path: "/solutions/diagnostic-agricole" },
    ]);
    expect(breadcrumbs["@type"]).toBe("BreadcrumbList");
    expect(breadcrumbs.itemListElement).toHaveLength(3);

    const service = buildServiceSchema({
      name: "Installation Pompage Solaire",
      description: "Installation de système de pompage solaire certifié",
      providerName: "AgroDia Solaire",
    });
    expect(service["@type"]).toBe("Service");
    expect(service.provider.name).toBe("AgroDia Solaire");

    const product = buildProductSchema({
      name: "Semences Maïs Barka Certifiées",
      description: "Variété précoce adaptée zone sahélienne",
      price: 15000,
      sellerName: "Tropicasem BF",
    });
    expect(product["@type"]).toBe("Product");
    expect(product.offers.price).toBe(15000);
    expect(product.offers.seller.name).toBe("Tropicasem BF");
  });
});

describe("Public Robots.txt & Sitemap.xml Audit", () => {
  it("verifies robots.txt disallows private zones and contains sitemap", () => {
    const robotsPath = path.resolve(process.cwd(), "public", "robots.txt");
    expect(fs.existsSync(robotsPath)).toBe(true);

    const content = fs.readFileSync(robotsPath, "utf-8");
    expect(content).toContain("Sitemap: https://nafaagritech.app/sitemap.xml");
    expect(content).toContain("Disallow: /dashboard");
    expect(content).toContain("Disallow: /auth");
    expect(content).toContain("Allow: /solutions");
    expect(content).toContain("Allow: /services");
    expect(content).toContain("Allow: /partenaires");
  });

  it("verifies sitemap.xml contains all canonical public URLs", () => {
    const sitemapPath = path.resolve(process.cwd(), "public", "sitemap.xml");
    expect(fs.existsSync(sitemapPath)).toBe(true);

    const content = fs.readFileSync(sitemapPath, "utf-8");
    expect(content).toContain("<loc>https://nafaagritech.app/</loc>");
    expect(content).toContain("<loc>https://nafaagritech.app/solutions</loc>");
    expect(content).toContain("<loc>https://nafaagritech.app/solutions/diagnostic-agricole</loc>");
    expect(content).toContain("<loc>https://nafaagritech.app/solutions/cartographie-agricole</loc>");
    expect(content).toContain("<loc>https://nafaagritech.app/solutions/irrigation</loc>");
    expect(content).toContain("<loc>https://nafaagritech.app/services</loc>");
    expect(content).toContain("<loc>https://nafaagritech.app/partenaires</loc>");
    expect(content).toContain("<loc>https://nafaagritech.app/marketplace</loc>");
    expect(content).toContain("<loc>https://nafaagritech.app/ressources</loc>");
  });
});

describe("Vercel Security & Routing Configuration Audit", () => {
  it("ensures vercel.json does not contain legacy PlantNet and has proper caching", () => {
    const vercelPath = path.resolve(process.cwd(), "vercel.json");
    expect(fs.existsSync(vercelPath)).toBe(true);

    const content = fs.readFileSync(vercelPath, "utf-8");
    expect(content.toLowerCase()).not.toContain("plantnet");
    expect(content).toContain("Cache-Control");
    expect(content).toContain("Strict-Transport-Security");
    expect(content).toContain("rewrites");
  });
});
