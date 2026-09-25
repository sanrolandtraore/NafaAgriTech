import { useAuth } from "@/contexts/AuthContext";
import LivestockDashboardPage from "@/pages/livestock/LivestockDashboardPage";
import PartenaireDashboard from "@/pages/dashboard/partenaire/PartenaireDashboard";
import ServiceMarketplacePage from "@/pages/dashboard/ServiceMarketplacePage";
import ServicesPage from "@/pages/dashboard/ServicesPage";

const RoleDashboardHome = () => {
  const { primaryRole, partnerType } = useAuth();

  // 1. Éleveurs pastoraux accèdent directement au tableau de bord Cheptel
  if (primaryRole === "eleveur") {
    return <LivestockDashboardPage />;
  }

  // 2. Cabinets d'Agronomie & Conseil Technique : suite d'outils professionnels d'ingénierie
  if (
    primaryRole === "expert" ||
    primaryRole === "agent_technique" ||
    (primaryRole === "partenaire" && partnerType === "expert_agronome")
  ) {
    return <ServicesPage />;
  }

  // 3. Module Agriculteur : seul le marketplace des services apparaît
  switch (primaryRole) {
    case "agriculteur":
    case "farmer":
      return <ServiceMarketplacePage />;
    case "partenaire":
    case "formation":
    default:
      return <PartenaireDashboard />;
  }
};

export default RoleDashboardHome;
