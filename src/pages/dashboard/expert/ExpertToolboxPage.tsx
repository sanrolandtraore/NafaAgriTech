import { ToolboxTile } from "@/components/expert/ToolboxTile";
import { Microscope, Calculator, BookOpen, Users, FileText, BarChart3, MapPin, Eye, Sparkles } from "lucide-react";

export default function ExpertToolboxPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Boîte à outils Expert
        </h1>
        <p className="text-sm text-muted-foreground">Tous les outils d'aide à la décision et de productivité agronomique.</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Diagnostic & Conseil</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <ToolboxTile to="/dashboard/expert-diagnosis" icon={Microscope} title="Santé des Cultures & Phyto" description="Fiches INERA & identification par symptômes réels" accent="primary" />
          <ToolboxTile to="/dashboard/expert-prescriptions" icon={FileText} title="Ordonnances" description="Générer une ordonnance PDF signée" accent="accent" />
          <ToolboxTile to="/dashboard/scouting" icon={Eye} title="Observation terrain" description="Observations géolocalisées + rapport" accent="secondary" />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Calcul & Planification</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <ToolboxTile to="/dashboard/expert-calculator" icon={Calculator} title="Calculatrice agro" description="Semis, doses, eau ETc, rendement" accent="primary" />
          <ToolboxTile to="/dashboard/crop-planning" icon={BookOpen} title="Planification" description="NPK, irrigation, programme phyto" accent="accent" />
          <ToolboxTile to="/dashboard/expert-cartography" icon={MapPin} title="Cartographie GPS" description="Capture polygone et calcul de surface" accent="secondary" />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Connaissance & Suivi</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <ToolboxTile to="/dashboard/crop-library" icon={BookOpen} title="Fiches techniques" description="12 cultures ouest-africaines" accent="primary" />
          <ToolboxTile to="/dashboard/expert-clients" icon={Users} title="Mes clients" description="Carnet de tournée et visites" accent="accent" />
          <ToolboxTile to="/dashboard/expert-analytics" icon={BarChart3} title="Statistiques" description="KPIs activité expert" accent="secondary" />
        </div>
      </div>
    </div>
  );
}
