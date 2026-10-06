
// Les tables metier ne figurent pas dans les types Supabase generes (src/integrations/supabase/types.ts) :
// on passe par une vue non typee du client pour ces requetes.
const db = supabase as unknown as SupabaseClient;
﻿import { useState } from "react";
import PremiumGate from "@/components/PremiumGate";
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, Download, FileText, Loader2, Microscope } from "lucide-react";
import ExportPreviewTable from "@/components/ExportPreviewTable";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ExportType = "clients" | "visits" | "diagnoses" | "prescriptions";

const exportOptions: { value: ExportType; label: string }[] = [
  { value: "clients", label: "Clients & Producteurs suivis" },
  { value: "visits", label: "Rapports de visite terrain" },
  { value: "diagnoses", label: "Diagnostics phytosanitaires" },
  { value: "prescriptions", label: "Ordonnances & préconisations" },
];

const fetchData = async (type: ExportType) => {
  switch (type) {
    case "clients":
      return db.from("expert_clients").select("name, phone, village, region, crops, total_area_ha, notes, created_at").order("name");
    case "visits":
      return db.from("client_visits").select("visit_date, parcel_name, observations, recommendations, next_visit_date, expert_clients(name)").order("visit_date", { ascending: false });
    case "diagnoses":
      return db.from("crop_diagnoses").select("crop_name, symptoms, disease_name, confidence, treatment, created_at").order("created_at", { ascending: false });
    case "prescriptions":
      return db.from("expert_prescriptions").select("prescription_number, issue_date, client_name, crop_name, diagnosis, products, dosage, created_at").order("issue_date", { ascending: false });
  }
};

const flattenRow = (row: any): Record<string, any> => {
  const flat: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      for (const [k2, v2] of Object.entries(v as Record<string, any>)) flat[`${k}_${k2}`] = v2;
    } else flat[k] = v;
  }
  return flat;
};

const ExpertExportPage = () => {
  const [selected, setSelected] = useState<ExportType>("clients");
  const [loading, setLoading] = useState(false);
  const [previewRows, setPreviewRows] = useState<Record<string, any>[] | null>(null);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const { data, error } = await fetchData(selected);
      if (error) throw error;
      if (!data?.length) {
        toast.error("Aucune donnée à exporter");
        setPreviewRows(null);
        return;
      }
      const rows = data.map(flattenRow);
      setPreviewHeaders(Object.keys(rows[0]));
      setPreviewRows(rows);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PremiumGate feature="export">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <Microscope className="h-6 w-6 text-primary" />
            Export — Activité Expert Agronome
          </h1>
          <p className="text-muted-foreground mt-1">Exportez vos tournées, diagnostics, ordonnances et données clients</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sélection des données à exporter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Type de données</Label>
              <Select
                value={selected}
                onValueChange={(v) => {
                  setSelected(v as ExportType);
                  setPreviewRows(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {exportOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={loadPreview} disabled={loading} className="w-full sm:w-auto">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
              {loading ? "Chargement..." : "Charger l'aperçu"}
            </Button>
          </CardContent>
        </Card>

        {previewRows && (
          <ExportPreviewTable
            rows={previewRows}
            headers={previewHeaders}
            title={exportOptions.find((o) => o.value === selected)?.label || selected}
            filePrefix={`nafa_expert_${selected}`}
            headerColor={[16, 149, 107]}
            onRowsChange={setPreviewRows}
          />
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Bilan d'activité agronomique complet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Générez une synthèse PDF complète de vos interventions, diagnostics et ordonnances pour vos archives ou rapports d'évaluation.
            </p>
            <Button
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  const [clientsRes, visitsRes, diagnosesRes, prescRes] = await Promise.all([
                    db.from("expert_clients").select("name, phone, village, region, total_area_ha"),
                    db.from("client_visits").select("visit_date, parcel_name, recommendations, expert_clients(name)").order("visit_date", { ascending: false }).limit(20),
                    db.from("crop_diagnoses").select("crop_name, disease_name, confidence, created_at").order("created_at", { ascending: false }).limit(20),
                    db.from("expert_prescriptions").select("prescription_number, client_name, crop_name, diagnosis, issue_date").order("issue_date", { ascending: false }).limit(20),
                  ]);

                  const doc = new jsPDF();
                  doc.setFontSize(20);
                  doc.text("BILAN D'ACTIVITÉ AGRO-CONSEIL", 14, 20);
                  doc.setFontSize(10);
                  doc.text("NAFA - AGRITECH — Hub Numérique Agronomique", 14, 28);
                  doc.text(`Édité le : ${new Date().toLocaleDateString("fr-FR")}`, 14, 34);

                  let y = 45;
                  doc.setFontSize(14);
                  doc.text("1. Portefeuille Producteurs / Clients", 14, y);
                  autoTable(doc, {
                    startY: y + 5,
                    head: [["Nom", "Téléphone", "Village", "Région", "Surface (ha)"]],
                    body: (clientsRes.data || []).map((c: any) => [c.name || "", c.phone || "", c.village || "", c.region || "", String(c.total_area_ha || "-")]),
                    styles: { fontSize: 7 },
                    headStyles: { fillColor: [16, 149, 107] },
                  });

                  y = (doc as any).lastAutoTable.finalY + 10;
                  if (y > 240) { doc.addPage(); y = 20; }
                  doc.setFontSize(14);
                  doc.text("2. Dernières visites & recommandations", 14, y);
                  autoTable(doc, {
                    startY: y + 5,
                    head: [["Date", "Producteur", "Parcelle", "Recommandations"]],
                    body: (visitsRes.data || []).map((v: any) => [v.visit_date || "", v.expert_clients?.name || "", v.parcel_name || "", (v.recommendations || "").slice(0, 40)]),
                    styles: { fontSize: 7 },
                    headStyles: { fillColor: [16, 149, 107] },
                  });

                  y = (doc as any).lastAutoTable.finalY + 10;
                  if (y > 240) { doc.addPage(); y = 20; }
                  doc.setFontSize(14);
                  doc.text("3. Diagnostics & Ordonnances", 14, y);
                  autoTable(doc, {
                    startY: y + 5,
                    head: [["N° Ordonnance", "Client", "Culture", "Diagnostic", "Date"]],
                    body: (prescRes.data || []).map((p: any) => [p.prescription_number || "", p.client_name || "", p.crop_name || "", (p.diagnosis || "").slice(0, 30), p.issue_date || ""]),
                    styles: { fontSize: 7 },
                    headStyles: { fillColor: [16, 149, 107] },
                  });

                  doc.save("nafa_rapport_expert_agronome.pdf");
                  toast.success("Rapport d'activité généré !");
                } catch (err: any) {
                  toast.error(err.message);
                } finally {
                  setLoading(false);
                }
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              {loading ? "Génération..." : "Générer le rapport d'activité (PDF)"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PremiumGate>
  );
};

export default ExpertExportPage;
