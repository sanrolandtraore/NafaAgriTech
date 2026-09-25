import { useAuth } from "@/contexts/AuthContext";
import AgriculteurSettingsPage from "./AgriculteurSettingsPage";
import EleveurSettingsPage from "./EleveurSettingsPage";
import PartenaireSettingsPage from "./PartenaireSettingsPage";
import ExpertSettingsPage from "./ExpertSettingsPage";

const RoleSettingsRouter = () => {
  const { primaryRole, partnerType } = useAuth();
  if (primaryRole === "eleveur" || (primaryRole === "partenaire" && partnerType === "elevage_veterinaire")) {
    return <EleveurSettingsPage />;
  }
  if (
    primaryRole === "expert" ||
    primaryRole === "agent_technique" ||
    (primaryRole === "partenaire" && partnerType === "expert_agronome")
  ) {
    return <ExpertSettingsPage />;
  }
  if (primaryRole === "partenaire" || primaryRole === "formation") {
    return <PartenaireSettingsPage />;
  }
  return <AgriculteurSettingsPage />;
};

export default RoleSettingsRouter;

