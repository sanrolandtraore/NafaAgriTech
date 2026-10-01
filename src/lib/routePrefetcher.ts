/**
 * Route Prefetcher : Préchargement intelligent des chunks JS et assets au survol
 * Accélère radicalement la navigation et élimine la sensation de latence.
 */

type RouteLoader = () => Promise<unknown>;

const PRELOAD_MAP: Record<string, RouteLoader> = {
  "/dashboard/field-designer": () => import("@/pages/dashboard/FieldDesignerPage"),
  "/dashboard/services": () => import("@/pages/dashboard/ServicesPage"),
  "/dashboard/scouting": () => import("@/pages/dashboard/ScoutingPage"),
  "/dashboard/smart-inspection": () => import("@/pages/dashboard/SmartInspectionPage"),
  "/dashboard/inspections": () => import("@/pages/dashboard/SmartInspectionPage"),
  "/dashboard/expert-diagnosis": () => import("@/pages/dashboard/expert/ExpertDiagnosisPage"),
  "/dashboard/parcels": () => import("@/pages/dashboard/ParcelsPage"),
  "/dashboard/crop-planning": () => import("@/pages/dashboard/CropPlanningPage"),
  "/dashboard/crop-library": () => import("@/pages/dashboard/expert/CropLibraryPage"),
  "/dashboard/quote-requests": () => import("@/pages/provider/QuoteRequestsPage"),
  "/dashboard/partenaire-banques": () => import("@/pages/dashboard/partenaire/ServicesBancairesPage"),
  "/dashboard/partenaire-assurance": () => import("@/pages/dashboard/partenaire/AssurancePage"),
  "/dashboard/partenaire-abonnement": () => import("@/pages/dashboard/partenaire/ProviderSubscriptionPage"),
  "/dashboard/partenaire-mes-offres": () => import("@/pages/provider/MyOffersPage"),
  "/dashboard/identite-professionnelle": () => import("@/pages/dashboard/PartnerBrandingPage"),
  "/dashboard/education": () => import("@/pages/dashboard/education/EducationCatalogPage"),
  "/dashboard/livestock": () => import("@/pages/livestock/LivestockDashboardPage"),
  "/marketplace": () => import("@/pages/dashboard/ServiceMarketplacePage"),
  "/auth": () => import("@/pages/Auth"),
};

const prefetchedRoutes = new Set<string>();

export const prefetchRoute = (path: string): void => {
  const cleanPath = path.split("?")[0].split("#")[0];
  if (prefetchedRoutes.has(cleanPath)) return;

  const loader = PRELOAD_MAP[cleanPath];
  if (loader) {
    prefetchedRoutes.add(cleanPath);
    // Exécuter pendant le temps mort du navigateur
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(() => {
        loader().catch(() => {
          prefetchedRoutes.delete(cleanPath);
        });
      });
    } else {
      setTimeout(() => {
        loader().catch(() => {
          prefetchedRoutes.delete(cleanPath);
        });
      }, 50);
    }
  }
};
