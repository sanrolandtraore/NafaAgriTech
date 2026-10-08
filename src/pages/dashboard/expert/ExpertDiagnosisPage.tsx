import { useState } from "react";
import { CropDiagnosisTool } from "@/components/expert/CropDiagnosisTool";
import PhytosanitaryLibraryExplorer from "@/components/phytosanitary/PhytosanitaryLibraryExplorer";
import { DiagnosticAccessGate } from "@/components/security/DiagnosticAccessGate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Microscope, BookOpen, Activity } from "lucide-react";

export default function ExpertDiagnosisPage() {
  const [activeTab, setActiveTab] = useState<string>("diagnostic");

  return (
    <DiagnosticAccessGate>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Microscope className="h-6 w-6 text-primary" />
            Diagnostic Végétal & Bibliothèque Phytosanitaire
          </h1>
          <p className="text-sm text-muted-foreground">
            Système d'aide à la décision agronomique de terrain inspiré des standards Plantix : analyse foliaire biométrique, comparaison différentielle et référentiel national INERA, TOM2024 et CSP-CILSS.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 max-w-md h-11 p-1 rounded-2xl bg-muted/80">
            <TabsTrigger value="diagnostic" className="rounded-xl text-xs font-bold gap-2">
              <Activity className="h-4 w-4" />
              Banc de Diagnostic
            </TabsTrigger>
            <TabsTrigger value="bibliotheque" className="rounded-xl text-xs font-bold gap-2">
              <BookOpen className="h-4 w-4" />
              Bibliothèque Phytosanitaire
            </TabsTrigger>
          </TabsList>

          <TabsContent value="diagnostic" className="pt-2">
            <CropDiagnosisTool />
          </TabsContent>

          <TabsContent value="bibliotheque" className="pt-2">
            <PhytosanitaryLibraryExplorer
              onSelectCaseForDiagnosis={() => {
                setActiveTab("diagnostic");
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DiagnosticAccessGate>
  );
}
