import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOfflineData } from "@/hooks/useOfflineData";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Heart, Baby, Wallet, AlertTriangle, WifiOff, ArrowUpRight,
  Stethoscope, Wheat, Sprout, ShoppingCart, TrendingUp, TrendingDown, Bird, Fish, Beef,
} from "lucide-react";
import { LivestockZootechnicCard } from "@/components/livestock/LivestockZootechnicCard";
import ProductServiceCatalog from "@/components/marketplace/ProductServiceCatalog";
import BackNavigationButton from "@/components/BackNavigationButton";

const speciesLabels: Record<string, string> = {
  bovin: "Bovins",
  ovin: "Ovins",
  caprin: "Caprins",
  porcin: "Porcins",
  volaille: "Volaille",
  pisciculture: "Pisciculture",
};

const speciesIconMap: Record<string, React.ElementType> = {
  bovin: Beef,
  ovin: Beef,
  caprin: Beef,
  porcin: Beef,
  volaille: Bird,
  pisciculture: Fish,
};

const LivestockDashboardPage = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<"cheptel" | "catalogue">("cheptel");

  const monthStart = useMemo(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    []
  );

  const { data: animals, loading: loadingAnimals, isOffline } = useOfflineData<any>({
    table: "animals",
    select: "*",
    queryKey: "dashboard-animals-all",
  });

  const { data: healthAll, loading: loadingHealth } = useOfflineData<any>({
    table: "animal_health_events",
    select: "*",
    orderBy: "event_date",
    queryKey: "dashboard-health-all",
  });

  const { data: reproAll, loading: loadingRepro } = useOfflineData<any>({
    table: "animal_reproductions",
    select: "*",
    queryKey: "dashboard-repro-all",
  });

  const { data: expenses, loading: loadingExp } = useOfflineData<any>({
    table: "livestock_expenses",
    select: "amount",
    queryKey: "dashboard-expenses",
  });

  const { data: sales, loading: loadingSales } = useOfflineData<any>({
    table: "livestock_sales",
    select: "total_amount",
    queryKey: "dashboard-sales",
  });

  const animalsMap = useMemo(() => {
    const map = new Map<string, any>();
    (animals || []).forEach((a: any) => map.set(a.id, a));
    return map;
  }, [animals]);

  const loading = loadingAnimals || loadingHealth || loadingRepro || loadingExp || loadingSales;

  const stats = useMemo(() => {
    const bySpecies: Record<string, number> = {};
    let totalHeads = 0;
    let activeLots = 0;

    (animals || []).forEach((a: any) => {
      const st = a.status || "actif";
      if (st === "actif") {
        const heads = a.is_group
          ? Math.max(0, Number(a.group_size || 0) - Number(a.mortality_count || 0))
          : 1;
        bySpecies[a.species] = (bySpecies[a.species] || 0) + heads;
        totalHeads += heads;
        activeLots += 1;
      }
    });

    const healthThisMonth = (healthAll || []).filter((h: any) => h.event_date && h.event_date >= monthStart).length;
    const upcomingBirths = (reproAll || []).filter((r: any) => r.expected_birth_date && !r.actual_birth_date).length;
    const totalExpenses = (expenses || []).reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
    const totalSales = (sales || []).reduce((s: number, e: any) => s + Number(e.total_amount || 0), 0);

    return {
      totalAnimals: totalHeads,
      lots: activeLots,
      bySpecies,
      healthEventsThisMonth: healthThisMonth,
      upcomingBirths,
      totalExpenses,
      totalSales,
      balance: totalSales - totalExpenses,
    };
  }, [animals, healthAll, reproAll, expenses, sales, monthStart]);

  const recentHealth = useMemo(
    () => [...(healthAll || [])].sort((a: any, b: any) => (b.event_date || "").localeCompare(a.event_date || "")).slice(0, 4),
    [healthAll]
  );

  const getAnimalDisplayName = (animalId: string) => {
    const a = animalsMap.get(animalId);
    if (!a) return "Animal";
    if (a.is_group) return `[Lot] ${a.group_label || a.name || "Lot"}`;
    return a.name || a.identification_number || `Sujet (${a.species})`;
  };

  if (!user) return null;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Bonjour";
    if (h < 18) return "Bon après-midi";
    return "Bonsoir";
  })();

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-10">
        <Skeleton className="h-40 rounded-3xl" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  const quickActions = [
    { to: "/dashboard/animals", label: "Animaux", icon: Bird, tone: "bg-secondary/40" },
    { to: "/dashboard/animal-health", label: "Santé", icon: Stethoscope, tone: "bg-rose-100 dark:bg-rose-950/40" },
    { to: "/dashboard/animal-reproduction", label: "Reproduction", icon: Baby, tone: "bg-sky-100 dark:bg-sky-950/40" },
    { to: "/dashboard/animal-feeding", label: "Alimentation", icon: Wheat, tone: "bg-amber-100 dark:bg-amber-950/40" },
    { to: "/dashboard/livestock-finance", label: "Finances", icon: Wallet, tone: "bg-primary/15" },
    { to: "/dashboard/livestock-services", label: "Services", icon: ShoppingCart, tone: "bg-muted" },
  ];

  const speciesEntries = Object.entries(stats.bySpecies);
  const topSpecies = speciesEntries.sort((a, b) => Number(b[1]) - Number(a[1]))[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Sélecteur direct de vue sans nav secondaire */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <BackNavigationButton fallbackTo="/dashboard" />
          <div className="grid grid-cols-2 sm:inline-flex p-1.5 rounded-2xl bg-muted/80 border border-border shadow-xs">
            <button
              type="button"
              onClick={() => setActiveView("cheptel")}
              className={`px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-base font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                activeView === "cheptel"
                  ? "bg-primary text-primary-foreground shadow-premium"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <Bird className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <span>Mon Cheptel</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView("catalogue")}
              className={`px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-base font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                activeView === "catalogue"
                  ? "bg-primary text-primary-foreground shadow-premium"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <span>Boutique & Intrants</span>
            </button>
          </div>
        </div>

        <Button
          asChild
          variant="outline"
          className="h-11 px-4 text-sm font-bold rounded-xl border-border hover:border-primary/50 shrink-0"
        >
          <Link to="/dashboard/livestock-services">
            <Stethoscope className="h-4 w-4 mr-2 text-primary" />
            Demandes Vétérinaires
          </Link>
        </Button>
      </div>

      {activeView === "catalogue" ? (
        <div className="animate-fade-in">
          <ProductServiceCatalog
            initialCategory="aliments_elevage"
            title="Catalogue Produits & Services Pastoraux"
            description="Commandez vos provendes, tourteaux de coton, kits prophylactiques, inséminations artificielles et équipements d'élevage directement."
            defaultRole="eleveur"
          />
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Hero header */}
          <section className="livestock-hero rounded-[2rem] p-6 md:p-8 text-primary-foreground relative overflow-hidden">
            <div className="absolute -right-6 -top-6 opacity-10 select-none">
              <Beef className="w-48 h-48" />
            </div>
            <div className="relative">
              <p className="text-sm opacity-80">{greeting}</p>
              <h1 className="text-2xl md:text-3xl font-bold mt-1">Votre élevage en un coup d'œil</h1>
              <div className="mt-5 flex flex-wrap gap-3 items-end">
                <div>
                  <p className="text-xs uppercase tracking-wider opacity-70">Cheptel vif total</p>
                  <p className="text-4xl md:text-5xl font-bold leading-none mt-1">{stats.totalAnimals}</p>
                  <p className="text-xs opacity-70 mt-1">{stats.lots} lot{stats.lots > 1 ? "s" : ""} & sujets actifs</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {isOffline && (
                    <Badge variant="outline" className="bg-background/20 border-white/30 text-primary-foreground text-xs">
                      <WifiOff className="h-3 w-3 mr-1" />Hors-ligne
                    </Badge>
                  )}
                  <Badge className="bg-background text-foreground hover:bg-background/90 font-bold">
                    {stats.balance >= 0 ? <TrendingUp className="h-3 w-3 mr-1 text-emerald-600" /> : <TrendingDown className="h-3 w-3 mr-1 text-rose-600" />}
                    {stats.balance.toLocaleString()} FCFA
                  </Badge>
                </div>
              </div>
            </div>
          </section>

          {/* Quick actions strip */}
          <section className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {quickActions.map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className={`${a.tone} rounded-2xl p-3 flex flex-col items-center justify-center gap-2 aspect-square text-center transition-all hover:scale-[1.03] hover:shadow-md`}
              >
                <a.icon className="h-6 w-6 text-foreground" />
                <span className="text-[11px] md:text-xs font-semibold leading-tight">{a.label}</span>
              </Link>
            ))}
          </section>

          {/* Bento grid */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[minmax(120px,auto)]">
            {/* Soins ce mois */}
            <Link to="/dashboard/animal-health" className="livestock-bento-tile md:col-span-2 group flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Soins ce mois</p>
                  <p className="text-3xl font-extrabold mt-1">{stats.healthEventsThisMonth}</p>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-3 group-hover:text-primary transition-colors font-medium">
                Voir l'historique complet <ArrowUpRight className="h-3 w-3" />
              </div>
            </Link>

            {/* Naissances */}
            <Link to="/dashboard/animal-reproduction" className="livestock-bento-tile group">
              <div className="h-10 w-10 rounded-2xl bg-sky-100 dark:bg-sky-950/40 flex items-center justify-center">
                <Baby className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </div>
              <p className="text-3xl font-extrabold mt-3">{stats.upcomingBirths}</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Naissances à venir</p>
            </Link>

            {/* Ventes */}
            <Link to="/dashboard/livestock-finance" className="livestock-bento-tile group bg-primary text-primary-foreground border-primary">
              <div className="h-10 w-10 rounded-2xl bg-background/20 flex items-center justify-center">
                <Wallet className="h-5 w-5" />
              </div>
              <p className="text-2xl font-extrabold mt-3">{stats.totalSales.toLocaleString()}</p>
              <p className="text-[11px] opacity-80 mt-1">FCFA de ventes</p>
            </Link>

            {/* Cheptel par espèce — large tile */}
            <div className="livestock-bento-tile md:col-span-2 md:row-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Cheptel par espèce</p>
                  <h3 className="text-lg font-bold">Répartition vivante</h3>
                </div>
                <Sprout className="h-5 w-5 text-primary" />
              </div>
              {speciesEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Fish className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Aucun animal enregistré</p>
                  <Link to="/dashboard/animals" className="text-xs text-primary mt-2 underline font-semibold">
                    Ajouter un animal ou lot
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {speciesEntries.map(([sp, count]) => {
                    const pct = stats.totalAnimals ? (Number(count) / stats.totalAnimals) * 100 : 0;
                    return (
                      <div key={sp}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium flex items-center gap-2">
                            {(() => {
                              const SpIcon = speciesIconMap[sp] || Beef;
                              return <SpIcon className="h-4 w-4 text-primary shrink-0" />;
                            })()}
                            {speciesLabels[sp] || sp}
                          </span>
                          <span className="text-sm font-bold tabular-nums">{Number(count)} têtes</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dépenses */}
            <div className="livestock-bento-tile">
              <div className="h-10 w-10 rounded-2xl bg-muted flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <p className="text-xl font-bold mt-3 tabular-nums text-destructive">
                {stats.totalExpenses.toLocaleString()}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 font-medium">FCFA dépenses</p>
            </div>

            {/* Balance */}
            <div className={`livestock-bento-tile ${stats.balance >= 0 ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-rose-50 dark:bg-rose-950/30"}`}>
              <div className="h-10 w-10 rounded-2xl bg-background flex items-center justify-center">
                {stats.balance >= 0
                  ? <TrendingUp className="h-5 w-5 text-emerald-600" />
                  : <TrendingDown className="h-5 w-5 text-rose-600" />}
              </div>
              <p className={`text-xl font-bold mt-3 tabular-nums ${stats.balance >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {stats.balance >= 0 ? "+" : ""}{stats.balance.toLocaleString()}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 font-medium">FCFA solde net</p>
            </div>
          </section>

          {/* Simulateur zootechnique d'élevage */}
          <LivestockZootechnicCard />

          {/* Activité récente */}
          <section className="livestock-bento-tile">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Activité récente</p>
                <h3 className="text-lg font-bold">Derniers soins & vaccinations</h3>
              </div>
              <Link to="/dashboard/animal-health" className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold">
                Tout voir <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            {recentHealth.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Aucun événement récent consigné</p>
            ) : (
              <ul className="divide-y divide-border">
                {recentHealth.map((h: any) => (
                  <li key={h.id} className="py-3 flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center shrink-0">
                      <Stethoscope className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {h.event_type} — {getAnimalDisplayName(h.animal_id)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {h.description || h.medication || "Soin vétérinaire"}
                        {h.event_date && ` • ${new Date(h.event_date).toLocaleDateString("fr-FR")}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Section directe Produits & Services Partenaires sur le Dashboard */}
          <section className="pt-8 border-t border-border/80">
            <ProductServiceCatalog
              initialCategory="aliments_elevage"
              title="Boutique & Services pour votre Élevage"
              description="Aliments bétail, tourteaux de coton SN-CITEC, provendes, vaccins et prestations vétérinaires disponibles en commande directe."
              defaultRole="eleveur"
            />
          </section>
        </div>
      )}
    </div>
  );
};

export default LivestockDashboardPage;
