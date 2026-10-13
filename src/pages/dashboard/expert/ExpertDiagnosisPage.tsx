import { useState } from "react";
import { CropDiagnosisTool } from "@/components/expert/CropDiagnosisTool";
import PhytosanitaryLibraryExplorer from "@/components/phytosanitary/PhytosanitaryLibraryExplorer";
import { SinglePhotoDiagnosisStudio } from "@/components/expert/SinglePhotoDiagnosisStudio";
import { DiagnosticAccessGate } from "@/components/security/DiagnosticAccessGate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Microscope, BookOpen, Activity, Camera } from "lucide-react";

export default function ExpertDiagnosisPage() {
  const [activeTab, setActiveTab] = useState<string>("scanner");

  return (
    <DiagnosticAccessGate>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Microscope className="h-6 w-6 text-primary" />
            Identification Phytosanitaire & Diagnostic Pathologique IA
          </h1>
          <p className="text-sm text-muted-foreground">
            Référentiel agronomique certifié : détection IA instantanée par photo (Spéculation, Organe, Maladie, Agent causal, Symptômes réels), clés INERA et homologation CSP-CILSS.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 max-w-xl h-11 p-1 rounded-2xl bg-muted/80">
            <TabsTrigger value="scanner" className="rounded-xl text-xs font-bold gap-2">
              <Camera className="h-4 w-4" />
              Scanner Photo IA
            </TabsTrigger>
            <TabsTrigger value="diagnostic" className="rounded-xl text-xs font-bold gap-2">
              <Activity className="h-4 w-4" />
              Guide Terrain
            </TabsTrigger>
            <TabsTrigger value="bibliotheque" className="rounded-xl text-xs font-bold gap-2">
              <BookOpen className="h-4 w-4" />
              Bibliothèque
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scanner" className="pt-2">
            <SinglePhotoDiagnosisStudio />
          </TabsContent>

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
