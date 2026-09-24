import { useState } from "react";
import {
  Inspection,
  InspectionType,
  InspectionTemplate,
  InspectionReport,
  FullInspectionRecord,
  nafaInspectionEngine,
} from "@/lib/nafaSmartInspectionEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  FileText,
  DollarSign,
  Cloud,
  RefreshCw,
  Edit,
  Store,
  Compass,
  Layers,
  ShieldCheck,
  Check,
  Printer,
} from "lucide-react";
import { toast } from "sonner";

interface InspectionReportViewerProps {
  inspection: Inspection;
  type: InspectionType;
  template: InspectionTemplate;
  onEditInspection: () => void;
  onInspectionUpdated: (updated: Inspection) => void;
}

export default function InspectionReportViewer({
  inspection,
  type,
  template,
  onEditInspection,
  onInspectionUpdated,
}: InspectionReportViewerProps) {
  const [syncing, setSyncing] = useState(false);

  // Récupération ou génération à chaud du rapport
  const fields = nafaInspectionEngine.getInspectionFields(inspection.id);
  const photos = nafaInspectionEngine.getInspectionPhotos(inspection.id);
  const measurements = nafaInspectionEngine.getInspectionMeasurements(inspection.id);

  const [report, setReport] = useState<InspectionReport>(() => {
    const existing = nafaInspectionEngine.getInspectionReport(inspection.id);
    if (existing) return existing;
    return nafaInspectionEngine.generateAutomatedReport(inspection, type, fields, photos, measurements);
  });

  const fullRecord: FullInspectionRecord = {
    inspection,
    type,
    template,
    fields,
    photos,
    measurements,
    report,
  };

  const handleDownloadPDF = () => {
    try {
      nafaInspectionEngine.generatePDFReport(fullRecord);
      toast.success("Rapport officiel PDF généré et téléchargé avec succès !");
    } catch (e: any) {
      console.error("Erreur PDF :", e);
      toast.error("Erreur lors de la génération du PDF.");
    }
  };

  const handleSyncCloud = async () => {
    setSyncing(true);
    const success = await nafaInspectionEngine.syncToSupabase(inspection);
    setSyncing(false);
    onInspectionUpdated({ ...inspection });
    if (success) {
      toast.success("Inspection synchronisée avec succès vers Supabase !");
    } else {
      toast.info("Inspection enregistrée localement. Synchronisation programmée dès reconnexion.");
    }
  };

  const handleValidateOfficial = () => {
    const updated = nafaInspectionEngine.updateInspection(inspection.id, {
      status: "validee",
    });
    onInspectionUpdated(updated);
    toast.success("Inspection officiellement validée par l'expert !");
  };

  return (
    <div className="space-y-6">
      {/* ── Bandeau d'en-tête & Actions majeures ── */}
      <div className="bg-card p-5 rounded-2xl border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading font-extrabold text-xl text-foreground">
              Rapport d'Inspection : {type.name}
            </h3>
            <Badge
              variant={inspection.status === "validee" ? "default" : "secondary"}
              className="text-xs font-semibold uppercase tracking-wider"
            >
              {inspection.status === "validee" ? "Validée par l'expert" : "En cours d'étude"}
            </Badge>

            {/* Statut de Synchronisation Hors-ligne */}
            {inspection.sync_status === "synced" ? (
              <Badge variant="outline" className="text-emerald-700 dark:text-emerald-300 border-emerald-500/30 bg-emerald-500/10 text-xs flex items-center gap-1">
                <Check className="h-3 w-3" /> Synchronisé Cloud
              </Badge>
            ) : (
              <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/10 text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" /> PWA Hors-ligne
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Client : <strong className="text-foreground">{inspection.client_name}</strong> | Expert : <strong className="text-foreground">{inspection.expert_name}</strong> | Référence : <code className="text-primary font-bold">{inspection.id.slice(0, 8)}</code>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-stretch md:self-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={onEditInspection}
            className="text-xs font-semibold gap-1.5 flex-1 md:flex-none"
          >
            <Edit className="h-3.5 w-3.5" />
            Modifier
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleSyncCloud}
            disabled={syncing}
            className="text-xs font-semibold gap-1.5 flex-1 md:flex-none"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
            Sync Cloud
          </Button>

          {inspection.status !== "validee" && (
            <Button
              size="sm"
              onClick={handleValidateOfficial}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 flex-1 md:flex-none"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Valider l'inspection
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleDownloadPDF}
            className="gradient-primary text-primary-foreground text-xs font-semibold gap-1.5 flex-1 md:flex-none shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            Télécharger PDF Officiel
          </Button>
        </div>
      </div>

      {/* ── Métriques de Conformité & Géodésie ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-card border border-border text-center space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Score de Conformité</span>
          <span className={`text-2xl font-heading font-extrabold ${report.conformity_score >= 80 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600"}`}>
            {report.conformity_score}%
          </span>
          <span className="text-[10px] text-muted-foreground block">Tolérances CIRAD/FAO respectées</span>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border text-center space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Mesures Relevées</span>
          <span className="text-2xl font-heading font-extrabold text-foreground">
            {measurements.filter((m) => m.is_conforming).length} / {measurements.length}
          </span>
          <span className="text-[10px] text-muted-foreground block">Paramètres conformes</span>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border text-center space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Photographies Archivées</span>
          <span className="text-2xl font-heading font-extrabold text-primary">
            {photos.length}
          </span>
          <span className="text-[10px] text-muted-foreground block">Clichés géotaggés</span>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border text-center space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Estimation du Devis</span>
          <span className="text-2xl font-heading font-extrabold text-amber-600 dark:text-amber-400">
            {report.quote_summary ? `${Math.round(report.quote_summary.total_ttc / 1000)}k F` : "N/A"}
          </span>
          <span className="text-[10px] text-muted-foreground block">Prix réels partenaires BF</span>
        </div>
      </div>

      {/* ── Plan 2D Technique Automatisé ── */}
      {report.plan_2d_svg && (
        <Card className="border border-border shadow-xs bg-card">
          <CardHeader className="p-4 pb-2 border-b border-border/60">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span className="flex items-center gap-2 text-foreground">
                <Layers className="h-4 w-4 text-primary" />
                Plan 2D Technique avec Cotations (Généré par NAFA Genius)
              </span>
              <Badge variant="outline" className="text-[10px]">Échelle 1:500</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div
              className="w-full overflow-hidden rounded-xl border border-border"
              dangerouslySetInnerHTML={{ __html: report.plan_2d_svg }}
            />
          </CardContent>
        </Card>
      )}

      {/* ── Croquis de terrain de l'expert (si présent) ── */}
      {inspection.sketch_data_url && (
        <Card className="border border-border shadow-xs bg-card">
          <CardHeader className="p-4 pb-2 border-b border-border/60">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span className="flex items-center gap-2 text-foreground">
                <Compass className="h-4 w-4 text-primary" />
                Croquis de Terrain Annoté par l'Expert
              </span>
              <Badge variant="outline" className="text-[10px]">Tracé tactile</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <img
              src={inspection.sketch_data_url}
              alt="Croquis terrain"
              className="max-h-64 mx-auto rounded-xl border border-border object-contain bg-white"
            />
          </CardContent>
        </Card>
      )}

      {/* ── Devis & Bordereau des Prix Partenaires (BOM) ── */}
      {report.quote_summary && report.quote_summary.items.length > 0 && (
        <Card className="border border-border shadow-xs bg-card">
          <CardHeader className="p-4 pb-2 border-b border-border/60">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span className="flex items-center gap-2 text-foreground">
                <Store className="h-4 w-4 text-primary" />
                Devis Chiffré & Fournisseurs Agréés (Prix réels en FCFA)
              </span>
              <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30">
                Catalogue Burkina Faso
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted text-muted-foreground uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5 rounded-l-lg">Désignation</th>
                    <th className="p-2.5">Fournisseur Agréé</th>
                    <th className="p-2.5 text-center">Quantité</th>
                    <th className="p-2.5 text-right">P.U. (FCFA)</th>
                    <th className="p-2.5 rounded-r-lg text-right">Total (FCFA)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {report.quote_summary.items.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/40">
                      <td className="p-2.5 font-medium text-foreground">{item.designation}</td>
                      <td className="p-2.5 text-primary font-semibold">{item.partner_name || "Partenaire NAFA"}</td>
                      <td className="p-2.5 text-center font-mono">{item.quantity} {item.unit}</td>
                      <td className="p-2.5 text-right font-mono">{item.unit_price_fcfa.toLocaleString("fr-FR")} F</td>
                      <td className="p-2.5 text-right font-mono font-bold text-foreground">
                        {item.total_price_fcfa.toLocaleString("fr-FR")} F
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-primary/5 font-bold text-sm">
                    <td colSpan={4} className="p-3 text-right text-foreground">TOTAL PROJET ESTIMÉ :</td>
                    <td className="p-3 text-right font-mono text-primary text-base">
                      {report.quote_summary.total_ttc.toLocaleString("fr-FR")} FCFA
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Recommandations & Observations de l'IA ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border border-border shadow-xs bg-card">
          <CardHeader className="p-4 pb-2 border-b border-border/60">
            <CardTitle className="text-sm font-bold text-foreground">
              Observations de Terrain
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ul className="space-y-2 text-xs text-muted-foreground leading-relaxed">
              {report.observations.map((obs, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>{obs}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs bg-card">
          <CardHeader className="p-4 pb-2 border-b border-border/60">
            <CardTitle className="text-sm font-bold text-foreground">
              Recommandations NAFA Genius IA
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ul className="space-y-2 text-xs text-foreground leading-relaxed">
              {report.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* ── Signatures Électroniques Validées ── */}
      <Card className="border border-border shadow-xs bg-card">
        <CardHeader className="p-4 pb-2 border-b border-border/60">
          <CardTitle className="text-sm font-bold text-foreground">
            Signatures Électroniques Enregistrées
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 border rounded-xl bg-card text-center space-y-2">
              <span className="text-xs font-bold text-foreground block">Client : {inspection.client_name}</span>
              {inspection.client_signature_url ? (
                <img
                  src={inspection.client_signature_url}
                  alt="Signature client"
                  className="h-16 mx-auto object-contain bg-white rounded border"
                />
              ) : (
                <span className="text-xs text-muted-foreground italic">Aucune signature apposée</span>
              )}
              <span className="text-[10px] text-emerald-600 font-semibold block">Accord de validation reçu</span>
            </div>

            <div className="p-3 border rounded-xl bg-card text-center space-y-2">
              <span className="text-xs font-bold text-foreground block">Expert : {inspection.expert_name}</span>
              {inspection.expert_signature_url ? (
                <img
                  src={inspection.expert_signature_url}
                  alt="Signature expert"
                  className="h-16 mx-auto object-contain bg-white rounded border"
                />
              ) : (
                <span className="text-xs text-muted-foreground italic">Aucune signature apposée</span>
              )}
              <span className="text-[10px] text-primary font-semibold block">Certifié conforme normes CIRAD/FAO</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
