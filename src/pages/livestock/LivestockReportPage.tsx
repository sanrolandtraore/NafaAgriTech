import React, { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOfflineData } from "@/hooks/useOfflineData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  FileText,
  Download,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Stethoscope,
  Wheat,
  Baby,
  Beef,
  Bird,
  Fish,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import BackNavigationButton from "@/components/BackNavigationButton";
import { generateLivestockReportPdf } from "@/lib/livestockReportPdf";
import { pdfExportHistory } from "@/lib/pdfExportHistory";
import PdfExportHistoryModal from "@/components/export/PdfExportHistoryModal";

const fmt = (n: number) => Math.round(n || 0).toLocaleString("fr-FR");

const speciesLabels: Record<string, string> = {
  bovin: "Bovins",
  ovin: "Ovins",
  caprin: "Caprins",
  porcin: "Porcins",
  volaille: "Volailles",
  pisciculture: "Pisciculture",
};

export default function LivestockReportPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<"30j" | "trimestre" | "annee" | "all">("annee");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [showPdfHistory, setShowPdfHistory] = useState(false);

  // Fetch all relevant livestock datasets
  const { data: animals, loading: loadingAnimals, isOffline } = useOfflineData<any>({
    table: "animals",
    select: "*",
    orderBy: "name",
  });

  const { data: healthEvents, loading: loadingHealth } = useOfflineData<any>({
    table: "animal_health_events",
    select: "*",
    orderBy: "event_date",
  });

  const { data: feedings, loading: loadingFeedings } = useOfflineData<any>({
    table: "animal_feedings",
    select: "*",
    orderBy: "feeding_date",
  });

  const { data: stocks, loading: loadingStocks } = useOfflineData<any>({
    table: "feed_stocks",
    select: "*",
    orderBy: "feed_name",
  });

  const { data: reproductions, loading: loadingRepro } = useOfflineData<any>({
    table: "animal_reproductions",
    select: "*",
    orderBy: "event_date",
  });

  const { data: expenses, loading: loadingExp } = useOfflineData<any>({
    table: "livestock_expenses",
    select: "*",
    orderBy: "expense_date",
  });

  const { data: sales, loading: loadingSales } = useOfflineData<any>({
    table: "livestock_sales",
    select: "*",
    orderBy: "sale_date",
  });

  const loading = loadingAnimals || loadingHealth || loadingFeedings || loadingStocks || loadingRepro || loadingExp || loadingSales;

  // Filter boundary based on selected period
  const cutoffDate = useMemo(() => {
    const now = new Date();
    if (period === "30j") {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d.toISOString().split("T")[0];
    }
    if (period === "trimestre") {
      const d = new Date();
      d.setDate(d.getDate() - 90);
      return d.toISOString().split("T")[0];
    }
    if (period === "annee") {
      return `${now.getFullYear()}-01-01`;
    }
    return "2000-01-01";
  }, [period]);

  // Filtered entries
  const filteredHealth = useMemo(() => {
    return (healthEvents || []).filter((h: any) => (h.event_date || "") >= cutoffDate);
  }, [healthEvents, cutoffDate]);

  const filteredFeedings = useMemo(() => {
    return (feedings || []).filter((f: any) => (f.feeding_date || "") >= cutoffDate);
  }, [feedings, cutoffDate]);

  const filteredRepro = useMemo(() => {
    return (reproductions || []).filter((r: any) => (r.event_date || "") >= cutoffDate);
  }, [reproductions, cutoffDate]);

  const filteredExpenses = useMemo(() => {
    return (expenses || []).filter((e: any) => (e.expense_date || "") >= cutoffDate);
  }, [expenses, cutoffDate]);

  const filteredSales = useMemo(() => {
    return (sales || []).filter((s: any) => (s.sale_date || "") >= cutoffDate);
  }, [sales, cutoffDate]);

  // Computed KPIs
  const kpis = useMemo(() => {
    const bySpecies: Record<string, number> = {};
    let totalActiveAnimals = 0;
    let totalLots = 0;
    let totalMortalities = 0;

    (animals || []).forEach((a: any) => {
      const st = a.status || "actif";
      if (st === "actif") {
        const heads = a.is_group
          ? Math.max(0, Number(a.group_size || 0) - Number(a.mortality_count || 0))
          : 1;
        bySpecies[a.species] = (bySpecies[a.species] || 0) + heads;
        totalActiveAnimals += heads;
        totalLots += 1;
        if (a.is_group) totalMortalities += Number(a.mortality_count || 0);
      } else if (st === "mort") {
        totalMortalities += a.is_group ? Number(a.group_size || 1) : 1;
      }
    });

    const totalExpensesAmt = (filteredExpenses || []).reduce((s, e) => s + Number(e.amount || 0), 0);
    const totalSalesAmt = (filteredSales || []).reduce((s, sItem) => s + Number(sItem.total_amount || 0), 0);
    const netMargin = totalSalesAmt - totalExpensesAmt;

    const birthCount = (filteredRepro || []).filter(r => r.actual_birth_date).reduce((s, r) => s + Number(r.offspring_alive || 1), 0);

    return {
      totalActiveAnimals,
      totalLots,
      bySpecies,
      totalMortalities,
      totalExpenses: totalExpensesAmt,
      totalSales: totalSalesAmt,
      netMargin,
      birthCount,
    };
  }, [animals, filteredExpenses, filteredSales, filteredRepro]);

  const periodLabels = {
    "30j": "30 Derniers Jours",
    trimestre: "Dernier Trimestre (90j)",
    annee: "Année en cours",
    all: "Tout l'historique",
  };

  const handleDownloadPdf = () => {
    setGeneratingPdf(true);
    try {
      const doc = generateLivestockReportPdf({
        farmName: "Exploitation Pastorale",
        breederName: user?.email ? user.email.split("@")[0] : "Éleveur NAFA",
        location: "Burkina Faso",
        phone: "+226",
        periodLabel: periodLabels[period],
        generatedDate: new Date().toLocaleDateString("fr-FR"),
        animals: animals || [],
        healthEvents: filteredHealth,
        feedings: filteredFeedings,
        stocks: stocks || [],
        reproductions: filteredRepro,
        expenses: filteredExpenses,
        sales: filteredSales,
        kpis,
      });

      const filename = `Rapport_Activite_Elevage_NAFA_${new Date().toISOString().split("T")[0]}.pdf`;
      pdfExportHistory.saveAndRecordPdf({
        title: `Bilan d'Élevage - ${periodLabels[period] || "Synthèse"}`,
        filename,
        module: "livestock",
        categoryLabel: "Bilan Pastoral & Zootechnique",
        doc,
        summary: `Rapport d'activité (${periodLabels[period] || "Période"}) : ${kpis.totalActiveAnimals} têtes, ventes ${kpis.totalSales.toLocaleString("fr-FR")} FCFA, dépenses ${kpis.totalExpenses.toLocaleString("fr-FR")} FCFA.`,
        dataSnapshot: {
          period,
          totalAnimals: kpis.totalActiveAnimals,
          totalSales: kpis.totalSales,
          totalExpenses: kpis.totalExpenses,
          netMargin: kpis.netMargin,
        },
      });
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur lors de la génération du rapport PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-10">
        <Skeleton className="h-20 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <BackNavigationButton fallbackTo="/dashboard" />
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-extrabold flex items-center gap-2">
              <FileText className="h-7 w-7 text-primary" />
              Rapport d'Activité & Bilan Zootechnique
            </h1>
            <p className="text-muted-foreground text-sm">
              Analyse complète des performances pastorales, prophylaxie, alimentation et rentabilité
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isOffline && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-xs">
              <WifiOff className="h-3 w-3 mr-1" /> Données locales
            </Badge>
          )}

          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="w-[170px] h-10 text-xs font-semibold">
              <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30j">30 Derniers Jours</SelectItem>
              <SelectItem value="trimestre">Trimestre (90j)</SelectItem>
              <SelectItem value="annee">Année en cours</SelectItem>
              <SelectItem value="all">Tout l'historique</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setShowPdfHistory(true)}
            className="h-10 text-xs font-bold gap-1.5 border-primary/30 hover:bg-primary/10"
            title="Consulter l'historique des rapports PDF"
          >
            <FileText className="h-4 w-4 text-primary" />
            Historique PDF
          </Button>

          <Button
            variant="outline"
            onClick={handlePrint}
            className="h-10 text-xs font-bold gap-1.5 hidden sm:inline-flex"
          >
            <Printer className="h-4 w-4" />
            Imprimer
          </Button>

          <Button
            onClick={handleDownloadPdf}
            disabled={generatingPdf}
            className="h-10 text-xs font-bold gap-1.5 gradient-primary text-primary-foreground shadow-sm"
          >
            <Download className="h-4 w-4" />
            {generatingPdf ? "Génération..." : "Télécharger PDF Certifié"}
          </Button>
        </div>
      </div>


      {/* KPI Cards Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-2xl border bg-card shadow-xs">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Cheptel Vif</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1">
              {kpis.totalActiveAnimals} <span className="text-xs text-muted-foreground font-normal">têtes</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {kpis.totalLots} lot{kpis.totalLots > 1 ? "s" : ""} & sujets actifs
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card shadow-xs">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Recettes Ventes</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
              {fmt(kpis.totalSales)} <span className="text-xs font-semibold">FCFA</span>
            </p>
            <p className="text-[11px] text-emerald-700/80 mt-1">
              Produits du cheptel vendus
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card shadow-xs">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Dépenses Totales</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1">
              {fmt(kpis.totalExpenses)} <span className="text-xs font-semibold">FCFA</span>
            </p>
            <p className="text-[11px] text-rose-700/80 mt-1">
              Aliment, santé, matériels
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card shadow-xs">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Marge Nette</p>
            <p className={`text-2xl sm:text-3xl font-extrabold mt-1 ${kpis.netMargin >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {kpis.netMargin >= 0 ? "+" : ""}{fmt(kpis.netMargin)} <span className="text-xs font-semibold">FCFA</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              {kpis.netMargin >= 0 ? <TrendingUp className="h-3 w-3 text-emerald-600" /> : <TrendingDown className="h-3 w-3 text-rose-600" />}
              {kpis.netMargin >= 0 ? "Bénéfice opérationnel" : "Déficit d'exploitation"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation des volets analytiques */}
      <Tabs defaultValue="cheptel" className="space-y-4">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full">
          <TabsTrigger value="cheptel" className="text-xs gap-1.5">
            <Beef className="h-3.5 w-3.5" /> Cheptel & Espèces
          </TabsTrigger>
          <TabsTrigger value="finances" className="text-xs gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-emerald-600" /> Comptabilité & Marges
          </TabsTrigger>
          <TabsTrigger value="sante" className="text-xs gap-1.5">
            <Stethoscope className="h-3.5 w-3.5 text-sky-500" /> Santé & Vaccins
          </TabsTrigger>
          <TabsTrigger value="alimentation" className="text-xs gap-1.5">
            <Wheat className="h-3.5 w-3.5 text-amber-600" /> Rations & Stocks
          </TabsTrigger>
        </TabsList>

        {/* 1. CHEPTEL & ESPÈCES */}
        <TabsContent value="cheptel" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <PieChart className="h-4 w-4 text-primary" />
                Répartition des Espèces Élevées
              </CardTitle>
              <CardDescription>
                Inventaire détaillé des têtes et troupeaux actifs sur la période sélectionnée.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(speciesLabels).map(([spec, label]) => {
                  const count = kpis.bySpecies[spec] || 0;
                  const pct = kpis.totalActiveAnimals > 0 ? Math.round((count / kpis.totalActiveAnimals) * 100) : 0;
                  return (
                    <div key={spec} className="p-3.5 rounded-xl border bg-muted/30 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">{label}</span>
                        <Badge variant="outline" className="text-[10px]">{pct}%</Badge>
                      </div>
                      <p className="text-xl font-bold text-primary">{count} <span className="text-xs font-normal text-muted-foreground">têtes</span></p>
                      <div className="w-full bg-border rounded-full h-1.5 mt-2">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Taux de mortalité et naissances */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t">
                <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/20 border border-sky-200 text-xs space-y-1">
                  <span className="font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                    <Baby className="h-4 w-4" /> Dynamique des Naissances
                  </span>
                  <p className="text-sky-900 dark:text-sky-100">
                    <strong>{kpis.birthCount}</strong> petits nés vivants ont rejoint le cheptel sur cette période.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 text-xs space-y-1">
                  <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" /> Taux de Perte & Mortalité
                  </span>
                  <p className="text-amber-900 dark:text-amber-100">
                    <strong>{kpis.totalMortalities}</strong> perte(s) signalée(s) au total (individus & lots confondus).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. COMPTABILITÉ & FINANCES */}
        <TabsContent value="finances" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                Grand Livre Analytique des Dépenses & Recettes
              </CardTitle>
              <CardDescription>
                Toutes les dépenses d'alimentation, santé, acquisition et matériel sont synchronisées en continu.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dépenses */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600">Postes de Dépenses Engagées</h4>
                  <div className="divide-y rounded-xl border bg-card">
                    {filteredExpenses.slice(0, 6).map((e: any) => (
                      <div key={e.id} className="p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold">{e.description || e.category}</p>
                          <p className="text-[10px] text-muted-foreground">{e.expense_date}</p>
                        </div>
                        <span className="font-bold text-rose-600">-{fmt(e.amount)} F</span>
                      </div>
                    ))}
                    {filteredExpenses.length === 0 && (
                      <p className="p-4 text-center text-xs text-muted-foreground">Aucune dépense sur cette période</p>
                    )}
                  </div>
                </div>

                {/* Recettes */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600">Recettes des Ventes Réalisées</h4>
                  <div className="divide-y rounded-xl border bg-card">
                    {filteredSales.slice(0, 6).map((s: any) => (
                      <div key={s.id} className="p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold">{s.description || s.sale_type}</p>
                          <p className="text-[10px] text-muted-foreground">{s.sale_date} • {s.buyer || "Marché local"}</p>
                        </div>
                        <span className="font-bold text-emerald-600">+{fmt(s.total_amount)} F</span>
                      </div>
                    ))}
                    {filteredSales.length === 0 && (
                      <p className="p-4 text-center text-xs text-muted-foreground">Aucune vente enregistrée sur cette période</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. SANTÉ & VACCINS */}
        <TabsContent value="sante" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-sky-500" />
                Interventions Sanitaires & Calendrier Prophylactique
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y rounded-xl border bg-card">
                {filteredHealth.slice(0, 8).map((h: any) => (
                  <div key={h.id} className="p-3 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">{h.event_type}</Badge>
                        <span className="font-bold">{h.medication || h.description || "Acte vétérinaire"}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Date: {h.event_date} {h.vet_name && `• Vétérinaire: ${h.vet_name}`}
                      </p>
                    </div>
                    <div className="text-right">
                      {h.cost ? <p className="font-bold text-foreground">{fmt(h.cost)} FCFA</p> : null}
                      {h.next_date && (
                        <p className="text-[10px] text-sky-600 font-semibold">Rappel: {h.next_date}</p>
                      )}
                    </div>
                  </div>
                ))}
                {filteredHealth.length === 0 && (
                  <p className="p-6 text-center text-xs text-muted-foreground">Aucun acte sanitaire enregistré sur la période</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. ALIMENTATION & STOCKS */}
        <TabsContent value="alimentation" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wheat className="h-4 w-4 text-amber-600" />
                Suivi des Rations et Inventaire des Stocks Magasin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Distributions Récentes</h4>
                  <div className="divide-y rounded-xl border bg-card">
                    {filteredFeedings.slice(0, 5).map((f: any) => (
                      <div key={f.id} className="p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold">{f.feed_type}</p>
                          <p className="text-[10px] text-muted-foreground">{f.feeding_date}</p>
                        </div>
                        <Badge variant="outline">{f.quantity_kg} kg</Badge>
                      </div>
                    ))}
                    {filteredFeedings.length === 0 && (
                      <p className="p-4 text-center text-xs text-muted-foreground">Aucune distribution récente</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Disponibilités en Magasin</h4>
                  <div className="divide-y rounded-xl border bg-card">
                    {(stocks || []).slice(0, 5).map((s: any) => (
                      <div key={s.id} className="p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold">{s.feed_name}</p>
                          <p className="text-[10px] text-muted-foreground">{s.supplier || "Marché local"}</p>
                        </div>
                        <span className={`font-bold ${Number(s.quantity_kg) < 50 ? "text-rose-600" : "text-emerald-600"}`}>
                          {s.quantity_kg} kg
                        </span>
                      </div>
                    ))}
                    {(stocks || []).length === 0 && (
                      <p className="p-4 text-center text-xs text-muted-foreground">Magasin vide</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal d'historique des bilans zootechniques PDF */}
      <PdfExportHistoryModal
        open={showPdfHistory}
        onOpenChange={setShowPdfHistory}
        defaultModuleFilter="livestock"
        title="Historique des Bilans Zootechniques PDF"
      />
    </div>
  );
}

