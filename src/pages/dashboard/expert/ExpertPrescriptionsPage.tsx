import { PrescriptionGenerator } from "@/components/expert/PrescriptionGenerator";
import { DiagnosticAccessGate } from "@/components/security/DiagnosticAccessGate";
import { FileText } from "lucide-react";

export default function ExpertPrescriptionsPage() {
  return (
    <DiagnosticAccessGate>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6 text-primary" />Ordonnance agronomique & Prescription Officielle</h1>
          <p className="text-sm text-muted-foreground">Édition d'ordonnances certifiées réservée aux agronomes et docteurs vétérinaires partenaires agréés.</p>
        </div>
        <PrescriptionGenerator />
      </div>
    </DiagnosticAccessGate>
  );
}
