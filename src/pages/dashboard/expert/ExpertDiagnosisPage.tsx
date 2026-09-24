import { CropDiagnosisTool } from "@/components/expert/CropDiagnosisTool";
import { DiagnosticAccessGate } from "@/components/security/DiagnosticAccessGate";
import { Microscope } from "lucide-react";

export default function ExpertDiagnosisPage() {
  return (
    <DiagnosticAccessGate>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Microscope className="h-6 w-6 text-primary" />Banc de Diagnostic IA (Partenaires Agréés)</h1>
          <p className="text-sm text-muted-foreground">Outil d'expertise phytosanitaire officiel réservé aux cabinets d'agronomie et cliniques vétérinaires certifiées.</p>
        </div>
        <CropDiagnosisTool />
      </div>
    </DiagnosticAccessGate>
  );
}
