import { useAuth } from "@/contexts/AuthContext";
import AgriculteurExportPage from "./AgriculteurExportPage";
import EleveurExportPage from "./EleveurExportPage";
import PartenaireExportPage from "./PartenaireExportPage";
import ExpertExportPage from "./ExpertExportPage";

const RoleExportRouter = () => {
  const { primaryRole, partnerType } = useAuth();
  if (primaryRole === "eleveur" || (primaryRole === "partenaire" && partnerType === "elevage_veterinaire")) {
    return <EleveurExportPage />;
  }
  if (
    primaryRole === "expert" ||
    primaryRole === "agent_technique" ||
    (primaryRole === "partenaire" && partnerType === "expert_agronome")
  ) {
    return <ExpertExportPage />;
  }
  if (primaryRole === "partenaire" || primaryRole === "formation") {
    return <PartenaireExportPage />;
  }
  return <AgriculteurExportPage />;
};

export default RoleExportRouter;
