import React, { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import OfflineIndicator from "@/components/OfflineIndicator";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CyberShieldProvider } from "@/components/security/CyberShieldProvider";
import Index from "./pages/Index";
import DashboardLayout from "./components/DashboardLayout";

// Lazy-loaded auxiliary and legal pages for initial bundle minimization
const Auth = lazy(() => import("./pages/Auth"));
const MentionsLegales = lazy(() => import("./pages/MentionsLegales"));
const ConditionsUtilisation = lazy(() => import("./pages/ConditionsUtilisation"));
const PolitiqueConfidentialite = lazy(() => import("./pages/PolitiqueConfidentialite"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const CyberDefenseDashboard = lazy(() => import("./pages/dashboard/security/CyberDefenseDashboard"));

// Lazy-loaded public SEO pages
const SolutionsPage = lazy(() => import("./pages/public/SolutionsPage"));
const DiagnosticAgricolePage = lazy(() => import("./pages/public/solutions/DiagnosticAgricolePage"));
const CartographieAgricolePage = lazy(() => import("./pages/public/solutions/CartographieAgricolePage"));
const ConseilsAgronomiquesPage = lazy(() => import("./pages/public/solutions/ConseilsAgronomiquesPage"));
const IrrigationPage = lazy(() => import("./pages/public/solutions/IrrigationPage"));
const SuiviExploitationPage = lazy(() => import("./pages/public/solutions/SuiviExploitationPage"));
const ElevagePage = lazy(() => import("./pages/public/solutions/ElevagePage"));
const IaCopilotePage = lazy(() => import("./pages/public/solutions/IaCopilotePage"));
const ServicesPublicPage = lazy(() => import("./pages/public/ServicesPublicPage"));
const PartenairesPublicPage = lazy(() => import("./pages/public/PartenairesPublicPage"));
const OfferDetailPage = lazy(() => import("./pages/public/OfferDetailPage"));
const RessourcesPage = lazy(() => import("./pages/public/RessourcesPage"));

// Lazy-loaded dashboard pages for code splitting
const RoleDashboardHome = lazy(() => import("./pages/dashboard/RoleDashboardHome"));
const FarmsPage = lazy(() => import("./pages/dashboard/FarmsPage"));
const ParcelsPage = lazy(() => import("./pages/dashboard/ParcelsPage"));
const CropCyclesPage = lazy(() => import("./pages/dashboard/CropCyclesPage"));
const ActivitiesPage = lazy(() => import("./pages/dashboard/ActivitiesPage"));
const CostsPage = lazy(() => import("./pages/dashboard/CostsPage"));
const InvestmentPlanPage = lazy(() => import("./pages/dashboard/InvestmentPlanPage"));
const WorkersPage = lazy(() => import("./pages/dashboard/WorkersPage"));
const EquipmentPage = lazy(() => import("./pages/dashboard/EquipmentPage"));
const HarvestsPage = lazy(() => import("./pages/dashboard/HarvestsPage"));
const CalendarPage = lazy(() => import("./pages/dashboard/CalendarPage"));
const AnalyticsPage = lazy(() => import("./pages/dashboard/AnalyticsPage"));
const RoleExportRouter = lazy(() => import("./pages/dashboard/RoleExportRouter"));

const EducationCatalogPage = lazy(() => import("./pages/dashboard/education/EducationCatalogPage"));
const CourseDetailPage = lazy(() => import("./pages/dashboard/education/CourseDetailPage"));
const CropPlanningPage = lazy(() => import("./pages/dashboard/CropPlanningPage"));
const ServicesPage = lazy(() => import("./pages/dashboard/ServicesPage"));
const RoleSettingsRouter = lazy(() => import("./pages/dashboard/RoleSettingsRouter"));
const LivestockLayout = lazy(() => import("./pages/livestock/LivestockLayout"));
const LivestockDashboardPage = lazy(() => import("./pages/livestock/LivestockDashboardPage"));
const AnimalsPage = lazy(() => import("./pages/livestock/AnimalsPage"));
const AnimalHealthPage = lazy(() => import("./pages/livestock/AnimalHealthPage"));
const AnimalReproductionPage = lazy(() => import("./pages/livestock/AnimalReproductionPage"));
const AnimalFeedingPage = lazy(() => import("./pages/livestock/AnimalFeedingPage"));
const LivestockFinancePage = lazy(() => import("./pages/livestock/LivestockFinancePage"));
const LivestockServicesPage = lazy(() => import("./pages/livestock/LivestockServicesPage"));
const LivestockReportPage = lazy(() => import("./pages/livestock/LivestockReportPage"));
const AnimalCountingPage = lazy(() => import("./pages/livestock/AnimalCountingPage"));
const ServiceMarketplacePage = lazy(() => import("./pages/dashboard/ServiceMarketplacePage"));
const ExpertCartographyPage = lazy(() => import("./pages/dashboard/ExpertCartographyPage"));
const ScoutingPage = lazy(() => import("./pages/dashboard/ScoutingPage"));
const SmartInspectionPage = lazy(() => import("./pages/dashboard/SmartInspectionPage"));
const UserProfilePage = lazy(() => import("./pages/dashboard/UserProfilePage"));
const PublicExplorerPage = lazy(() => import("./pages/PublicExplorerPage"));
const ExpertToolboxPage = lazy(() => import("./pages/dashboard/expert/ExpertToolboxPage"));
const ExpertDiagnosisPage = lazy(() => import("./pages/dashboard/expert/ExpertDiagnosisPage"));
const ExpertCalculatorPage = lazy(() => import("./pages/dashboard/expert/ExpertCalculatorPage"));
const ExpertPrescriptionsPage = lazy(() => import("./pages/dashboard/expert/ExpertPrescriptionsPage"));
const CropLibraryPage = lazy(() => import("./pages/dashboard/expert/CropLibraryPage"));
const ExpertClientsPage = lazy(() => import("./pages/dashboard/expert/ExpertClientsPage"));
const ExpertAnalyticsPage = lazy(() => import("./pages/dashboard/expert/ExpertAnalyticsPage"));
const NafaGeniusPage = lazy(() => import("./pages/dashboard/NafaGeniusPage"));
const FieldDesignerPage = lazy(() => import("./pages/dashboard/FieldDesignerPage"));
const PartnerStorefrontPage = lazy(() => import("./pages/partner/PartnerStorefrontPage"));
const PartnerDedicatedSpace = lazy(() => import("./pages/partner/PartnerDedicatedSpace"));
const FournisseursPage = lazy(() => import("./pages/dashboard/partenaire/FournisseursPage"));
const AssurancePage = lazy(() => import("./pages/dashboard/partenaire/AssurancePage"));
const ProgrammesPage = lazy(() => import("./pages/dashboard/partenaire/ProgrammesPage"));
const ServicesBancairesPage = lazy(() => import("./pages/dashboard/partenaire/ServicesBancairesPage"));
const PartnersDirectoryPage = lazy(() => import("./pages/dashboard/PartnersDirectoryPage"));
const ProviderSubscriptionPage = lazy(() => import("./pages/dashboard/partenaire/ProviderSubscriptionPage"));
const PartnerKycPage = lazy(() => import("./pages/dashboard/partenaire/PartnerKycPage"));
const PartnerBrandingPage = lazy(() => import("./pages/dashboard/PartnerBrandingPage"));
const MyOffersPage = lazy(() => import("./pages/provider/MyOffersPage"));
const MissionsPage = lazy(() => import("./pages/provider/MissionsPage"));
const InterventionsPage = lazy(() => import("./pages/provider/InterventionsPage"));
const ProviderClientsPage = lazy(() => import("./pages/provider/ProviderClientsPage"));
const QuoteRequestsPage = lazy(() => import("./pages/provider/QuoteRequestsPage"));
const RevenuePage = lazy(() => import("./pages/provider/RevenuePage"));
const PartnerMarketplacePage = lazy(() => import("./pages/provider/PartnerMarketplacePage"));
const InstitutionFinanceDashboard = lazy(() => import("./pages/dashboard/partenaire/InstitutionFinanceDashboard"));
const PartnerMarketingPage = lazy(() => import("./pages/dashboard/partenaire/PartnerMarketingPage"));
const PartnerDemandesPage = lazy(() => import("./pages/dashboard/partenaire/PartnerDemandesPage"));
const PartnerInvoicesPage = lazy(() => import("./pages/dashboard/partenaire/PartnerInvoicesPage"));
const GpsSurveyPage = lazy(() => import("./pages/dashboard/GpsSurveyPage"));

import PageLoader from "@/components/PageLoader";
import { startUniversalSyncEngine } from "@/lib/universalSyncEngine";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  React.useEffect(() => {
    // Démarrage du moteur de synchronisation universelle partout
    const cleanup = startUniversalSyncEngine(60);
    return cleanup;
  }, []);

  return (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ErrorBoundary>
          <CyberShieldProvider>
            <BrowserRouter>
              <Routes>
              {/* Public routes intentionally stay outside AuthProvider so the landing page
                  can render even when Supabase is unavailable or not configured yet. */}
              <Route path="/" element={<Index />} />
              <Route path="/solutions" element={<Suspense fallback={<PageLoader />}><SolutionsPage /></Suspense>} />
              <Route path="/solutions/diagnostic-agricole" element={<Suspense fallback={<PageLoader />}><DiagnosticAgricolePage /></Suspense>} />
              <Route path="/solutions/cartographie-agricole" element={<Suspense fallback={<PageLoader />}><CartographieAgricolePage /></Suspense>} />
              <Route path="/solutions/conseils-agronomiques" element={<Suspense fallback={<PageLoader />}><ConseilsAgronomiquesPage /></Suspense>} />
              <Route path="/solutions/irrigation" element={<Suspense fallback={<PageLoader />}><IrrigationPage /></Suspense>} />
              <Route path="/solutions/suivi-exploitation" element={<Suspense fallback={<PageLoader />}><SuiviExploitationPage /></Suspense>} />
              <Route path="/solutions/elevage" element={<Suspense fallback={<PageLoader />}><ElevagePage /></Suspense>} />
              <Route path="/solutions/ia-copilote" element={<Suspense fallback={<PageLoader />}><IaCopilotePage /></Suspense>} />
              <Route path="/services" element={<Suspense fallback={<PageLoader />}><ServicesPublicPage /></Suspense>} />
              <Route path="/partenaires" element={<Suspense fallback={<PageLoader />}><PartenairesPublicPage /></Suspense>} />
              <Route path="/partenaire/:partnerId" element={<Suspense fallback={<PageLoader />}><PartnerStorefrontPage /></Suspense>} />
              <Route path="/partenaires/:partnerId" element={<Suspense fallback={<PageLoader />}><PartnerStorefrontPage /></Suspense>} />
              <Route path="/partners/:partnerId" element={<Suspense fallback={<PageLoader />}><PartnerStorefrontPage /></Suspense>} />
              <Route path="/marketplace" element={<AuthProvider><Suspense fallback={<PageLoader />}><ServiceMarketplacePage /></Suspense></AuthProvider>} />
              <Route path="/marketplace/:offerId" element={<AuthProvider><Suspense fallback={<PageLoader />}><OfferDetailPage /></Suspense></AuthProvider>} />
              <Route path="/ressources" element={<Suspense fallback={<PageLoader />}><RessourcesPage /></Suspense>} />
              <Route path="/explorer" element={<AuthProvider><Suspense fallback={<PageLoader />}><PublicExplorerPage /></Suspense></AuthProvider>} />
              <Route path="/fiches-techniques" element={<AuthProvider><Suspense fallback={<PageLoader />}><CropLibraryPage /></Suspense></AuthProvider>} />
              <Route path="/a-propos" element={<Suspense fallback={<PageLoader />}><AboutPage /></Suspense>} />
              <Route path="/contact" element={<Suspense fallback={<PageLoader />}><ContactPage /></Suspense>} />
              <Route path="/mentions-legales" element={<Suspense fallback={<PageLoader />}><MentionsLegales /></Suspense>} />
              <Route path="/conditions-utilisation" element={<Suspense fallback={<PageLoader />}><ConditionsUtilisation /></Suspense>} />
              <Route path="/politique-confidentialite" element={<Suspense fallback={<PageLoader />}><PolitiqueConfidentialite /></Suspense>} />
              <Route element={<AuthProvider><><OfflineIndicator /><Outlet /></></AuthProvider>}>
                <Route path="/auth" element={<Suspense fallback={<PageLoader />}><Auth /></Suspense>} />
                <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<Suspense fallback={<PageLoader />}><RoleDashboardHome /></Suspense>} />
                <Route path="farms" element={<Suspense fallback={<PageLoader />}><FarmsPage /></Suspense>} />
                <Route path="parcels" element={<Suspense fallback={<PageLoader />}><ParcelsPage /></Suspense>} />
                <Route path="crop-cycles" element={<Suspense fallback={<PageLoader />}><CropCyclesPage /></Suspense>} />
                <Route path="activities" element={<Suspense fallback={<PageLoader />}><ActivitiesPage /></Suspense>} />
                <Route path="costs" element={<Suspense fallback={<PageLoader />}><CostsPage /></Suspense>} />
                <Route path="investment" element={<Suspense fallback={<PageLoader />}><InvestmentPlanPage /></Suspense>} />
                <Route path="workers" element={<Suspense fallback={<PageLoader />}><WorkersPage /></Suspense>} />
                <Route path="equipment" element={<Navigate to="/dashboard/marketplace?cat=machinisme&intent=intrants_produits" replace />} />
                <Route path="harvests" element={<Suspense fallback={<PageLoader />}><HarvestsPage /></Suspense>} />
                <Route path="calendar" element={<Suspense fallback={<PageLoader />}><CalendarPage /></Suspense>} />
                <Route path="analytics" element={<Suspense fallback={<PageLoader />}><AnalyticsPage /></Suspense>} />
                <Route path="profile" element={<Suspense fallback={<PageLoader />}><UserProfilePage /></Suspense>} />
                <Route path="crop-planning" element={<Suspense fallback={<PageLoader />}><CropPlanningPage /></Suspense>} />
                <Route path="services" element={<Suspense fallback={<PageLoader />}><ServicesPage /></Suspense>} />
                <Route path="agronomic-services" element={<Suspense fallback={<PageLoader />}><ServicesPage /></Suspense>} />
                <Route path="settings" element={<Suspense fallback={<PageLoader />}><RoleSettingsRouter /></Suspense>} />
                <Route path="education" element={<Suspense fallback={<PageLoader />}><EducationCatalogPage /></Suspense>} />
                <Route path="education/:slug" element={<Suspense fallback={<PageLoader />}><CourseDetailPage /></Suspense>} />
                <Route path="export" element={<Suspense fallback={<PageLoader />}><RoleExportRouter /></Suspense>} />
                <Route element={<Suspense fallback={<PageLoader />}><LivestockLayout /></Suspense>}>
                  <Route path="livestock" element={<Suspense fallback={<PageLoader />}><LivestockDashboardPage /></Suspense>} />
                  <Route path="animals" element={<Suspense fallback={<PageLoader />}><AnimalsPage /></Suspense>} />
                  <Route path="animal-health" element={<Suspense fallback={<PageLoader />}><AnimalHealthPage /></Suspense>} />
                  <Route path="animal-feeding" element={<Suspense fallback={<PageLoader />}><AnimalFeedingPage /></Suspense>} />
                  <Route path="animal-reproduction" element={<Suspense fallback={<PageLoader />}><AnimalReproductionPage /></Suspense>} />
                  <Route path="livestock-dashboard" element={<Suspense fallback={<PageLoader />}><LivestockDashboardPage /></Suspense>} />
                  <Route path="livestock-finance" element={<Suspense fallback={<PageLoader />}><LivestockFinancePage /></Suspense>} />
                  <Route path="livestock-services" element={<Suspense fallback={<PageLoader />}><LivestockServicesPage /></Suspense>} />
                  <Route path="veterinary-services" element={<Suspense fallback={<PageLoader />}><LivestockServicesPage /></Suspense>} />
                  <Route path="livestock-report" element={<Suspense fallback={<PageLoader />}><LivestockReportPage /></Suspense>} />
                  <Route path="animal-counting" element={<Suspense fallback={<PageLoader />}><AnimalCountingPage /></Suspense>} />
                  <Route path="poultry-counting" element={<Suspense fallback={<PageLoader />}><AnimalCountingPage /></Suspense>} />
                </Route>
                <Route path="marketplace" element={<Suspense fallback={<PageLoader />}><ServiceMarketplacePage /></Suspense>} />
                <Route path="expert-cartography" element={<Suspense fallback={<PageLoader />}><ExpertCartographyPage /></Suspense>} />
                <Route path="gps-survey" element={<Suspense fallback={<PageLoader />}><GpsSurveyPage /></Suspense>} />
                <Route path="leve-gps" element={<Suspense fallback={<PageLoader />}><GpsSurveyPage /></Suspense>} />
                <Route path="scouting" element={<Suspense fallback={<PageLoader />}><ScoutingPage /></Suspense>} />
                <Route path="inspections" element={<Suspense fallback={<PageLoader />}><SmartInspectionPage /></Suspense>} />
                <Route path="smart-inspection" element={<Suspense fallback={<PageLoader />}><SmartInspectionPage /></Suspense>} />
                <Route path="expert-toolbox" element={<Suspense fallback={<PageLoader />}><ExpertToolboxPage /></Suspense>} />
                <Route path="expert-diagnosis" element={<Suspense fallback={<PageLoader />}><ExpertDiagnosisPage /></Suspense>} />
                <Route path="expert-calculator" element={<Suspense fallback={<PageLoader />}><ExpertCalculatorPage /></Suspense>} />
                <Route path="expert-prescriptions" element={<Suspense fallback={<PageLoader />}><ExpertPrescriptionsPage /></Suspense>} />
                <Route path="crop-library" element={<Suspense fallback={<PageLoader />}><CropLibraryPage /></Suspense>} />
                <Route path="field-designer" element={<Suspense fallback={<PageLoader />}><FieldDesignerPage /></Suspense>} />
                <Route path="genius" element={<Suspense fallback={<PageLoader />}><NafaGeniusPage /></Suspense>} />
                <Route path="expert-clients" element={<Suspense fallback={<PageLoader />}><ExpertClientsPage /></Suspense>} />
                <Route path="expert-analytics" element={<Suspense fallback={<PageLoader />}><ExpertAnalyticsPage /></Suspense>} />
                <Route path="partenaire-abonnement" element={<Suspense fallback={<PageLoader />}><ProviderSubscriptionPage /></Suspense>} />
                <Route path="partenaire-mes-offres" element={<Suspense fallback={<PageLoader />}><MyOffersPage /></Suspense>} />
                <Route path="missions" element={<Suspense fallback={<PageLoader />}><MissionsPage /></Suspense>} />
                <Route path="interventions" element={<Suspense fallback={<PageLoader />}><InterventionsPage /></Suspense>} />
                <Route path="clients" element={<Suspense fallback={<PageLoader />}><ProviderClientsPage /></Suspense>} />
                <Route path="provider-clients" element={<Suspense fallback={<PageLoader />}><ProviderClientsPage /></Suspense>} />
                <Route path="quote-requests" element={<Suspense fallback={<PageLoader />}><QuoteRequestsPage /></Suspense>} />
                <Route path="revenus" element={<Suspense fallback={<PageLoader />}><RevenuePage /></Suspense>} />
                <Route path="partner-marketplace" element={<Suspense fallback={<PageLoader />}><PartnerMarketplacePage /></Suspense>} />
                <Route path="partenaire-fournisseurs" element={<Suspense fallback={<PageLoader />}><FournisseursPage /></Suspense>} />
                <Route path="partenaire-assurance" element={<Suspense fallback={<PageLoader />}><AssurancePage /></Suspense>} />
                <Route path="partenaire-programmes" element={<Suspense fallback={<PageLoader />}><ProgrammesPage /></Suspense>} />
                <Route path="partenaire-banques" element={<Suspense fallback={<PageLoader />}><ServicesBancairesPage /></Suspense>} />
                <Route path="partenaire-marketing" element={<Suspense fallback={<PageLoader />}><PartnerMarketingPage /></Suspense>} />
                <Route path="partenaire-demandes" element={<Suspense fallback={<PageLoader />}><PartnerDemandesPage /></Suspense>} />
                <Route path="partenaire-finance" element={<Suspense fallback={<PageLoader />}><InstitutionFinanceDashboard /></Suspense>} />
                <Route path="partners-directory" element={<Suspense fallback={<PageLoader />}><PartnersDirectoryPage /></Suspense>} />
                <Route path="partenaire-vitrine" element={<Suspense fallback={<PageLoader />}><PartnerStorefrontPage /></Suspense>} />
                <Route path="partenaire-kyc" element={<Suspense fallback={<PageLoader />}><PartnerKycPage /></Suspense>} />
                <Route path="partenaire-verification" element={<Suspense fallback={<PageLoader />}><PartnerKycPage /></Suspense>} />
                <Route path="identite-professionnelle" element={<Suspense fallback={<PageLoader />}><PartnerBrandingPage /></Suspense>} />
                <Route path="partenaire-factures" element={<Suspense fallback={<PageLoader />}><PartnerInvoicesPage /></Suspense>} />
                <Route path="factures" element={<Suspense fallback={<PageLoader />}><PartnerInvoicesPage /></Suspense>} />
                <Route path="partner-space" element={<Suspense fallback={<PageLoader />}><PartnerDedicatedSpace /></Suspense>} />
                <Route path="cyber-defense" element={<Suspense fallback={<PageLoader />}><CyberDefenseDashboard /></Suspense>} />
                </Route>
              </Route>
              <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
            </Routes>
          </BrowserRouter>
        </CyberShieldProvider>
      </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
  );
};

export default App;
