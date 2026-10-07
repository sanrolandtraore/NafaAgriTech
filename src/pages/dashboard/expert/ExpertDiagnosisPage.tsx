import { CropDiagnosisTool } from "@/components/expert/CropDiagnosisTool";
import { DiagnosticAccessGate } from "@/components/security/DiagnosticAccessGate";
import { Microscope } from "lucide-react";

export default function ExpertDiagnosisPage() {
  return (
    <DiagnosticAccessGate>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Microscope className="h-6 w-6 text-primary" />
            Diagnostic Végétal & Phytosanitaire IA
          </h1>
          <p className="text-sm text-muted-foreground">
            Outil d'aide à la décision agronomique de terrain : identification d'espèces, analyse biométrique des lésions et préconisations selon les référentiels réels INERA Farako-Bâ et CSP-CILSS.
          </p>
        </div>
        <CropDiagnosisTool />
      </div>
    </DiagnosticAccessGate>
  );
}
