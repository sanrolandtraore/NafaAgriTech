import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOfflineData } from "@/hooks/useOfflineData";
import { useDefaultLivestockFarm } from "@/hooks/useDefaultLivestockFarm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, TrendingDown, TrendingUp, DollarSign, WifiOff, Wallet } from "lucide-react";
import BackNavigationButton from "@/components/BackNavigationButton";

export const expenseCategories = [
  { value: "alimentation", label: "Alimentation & Provende" },
  { value: "sante", label: "Santé, Vaccins & Vétérinaire" },
  { value: "equipement", label: "Matériel, Abreuvoirs & Enclos" },
  { value: "transport", label: "Transport & Convoyage" },
  { value: "main_oeuvre", label: "Main d'œuvre / Berger" },
  { value: "habitat", label: "Bâtiments, Poulaillers & Bassins" },
  { value: "eau_energie", label: "Eau de boisson & Énergie" },
  { value: "autre", label: "Autre dépense" },
];

export const expenseDescriptions: Record<string, string[]> = {
  alimentation: ["Achat provende ponte / chair", "Achat tourteau de coton SN-CITEC", "Achat son de blé / maïs", "Achat fourrage vert / foin", "Pierre à lécher / Sels", "Complément minéral (CMV)", "Autre aliment"],
  sante: ["Campagne de vaccination (PPR/PPCB/Newcastle)", "Médicaments & antibiotiques", "Visite vétérinaire / consultation", "Vermifuge & déparasitage", "Insémination artificielle", "Autre soin"],
  equipement: ["Abreuvoirs / Mangeoires", "Clôture & grillage", "Bassin piscicole", "Couveuse / Éclosoir", "Balance / Peson", "Autre matériel"],
  transport: ["Transport bétail / volailles", "Acheminement aliments", "Déplacement technicien", "Autre transport"],
  main_oeuvre: ["Salaire berger / gardien", "Ouvrier journalier", "Nettoyage / Curage", "Autre main d'œuvre"],
  habitat: ["Aménagement poulailler / enclos", "Litière / Paille", "Réparation toiture / abri", "Autre travaux"],
  eau_energie: ["Facture d'eau / forage", "Carburant motopompe", "Éclairage couveuse", "Autre"],
  autre: ["Taxes de marché", "Formalités sanitaires", "Autre"],
};

export const saleTypes = [
  { value: "animal", label: "Vente d'animaux sur pied" },
  { value: "lait", label: "Vente de lait frais / caillé" },
  { value: "oeufs", label: "Vente d'œufs (Plateaux)" },
  { value: "poisson", label: "Vente de poissons (Tilapia/Silure)" },
  { value: "fumier", label: "Fumier & Compost fertilisant" },
  { value: "peau_cuir", label: "Peaux & Cuirs" },
  { value: "miel", label: "Miel & Cire" },
  { value: "autre", label: "Autre produit pastoral" },
];

export const saleDescriptions: Record<string, string[]> = {
  animal: ["Vente taureau / bélier embouche", "Vente génisse / brebis", "Vente poulets de chair vifs", "Vente porc charcutier", "Vente réforme", "Autre animal"],
  lait: ["Lait frais de vache", "Lait caillé / Yaourt local", "Fromage artisanal", "Autre produit laitier"],
  oeufs: ["Alvéoles œufs de table (30 œufs)", "Œufs fécondés à couver", "Autre"],
  poisson: ["Tilapias frais", "Silures / Clarias vivants", "Poisson séché / fumé", "Alevins", "Autre"],
  fumier: ["Fumure organique / sacs", "Compost mûr", "Autre"],
  peau_cuir: ["Peaux brutes séchées", "Cuir tanné", "Autre"],
  miel: ["Miel d'apiculture moderne", "Miel sauvage", "Autre"],
  autre: ["Prestation de saillie", "Autre sous-produit"],
};

export const buyers = ["Marché à bétail local", "Boucher / Charcutier", "Commerçant grossiste", "Particulier / Voisinage", "Restaurant / Maquis", "Coopérative", "Exportation sous-régionale", "Autre"];

const LivestockFinancePage = () => {
  const { user } = useAuth();
  const { farmId } = useDefaultLivestockFarm();
  const effectiveFarmId = farmId || (user ? `farm-${user.id}` : "default_farm");

  const { data: expenses, loading: loadingExp, isOffline, insertRow: insertExpense, deleteRow: deleteExpense } = useOfflineData({
    table: "livestock_expenses",
    select: "*",
    orderBy: "expense_date",
  });

  const { data: sales, loading: loadingSale, insertRow: insertSale, deleteRow: deleteSale } = useOfflineData({
    table: "livestock_sales",
    select: "*",
    orderBy: "sale_date",
  });

  const { data: animals, loading: loadingAnimals } = useOfflineData({
    table: "animals",
    select: "id, name, group_label, identification_number, species, status",
    orderBy: "name",
  });

  const [openExpense, setOpenExpense] = useState(false);
  const [openSale, setOpenSale] = useState(false);

  const [expForm, setExpForm] = useState({
    animal_id: "",
    category: "alimentation",
    description: "",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [saleForm, setSaleForm] = useState({
    animal_id: "",
    sale_type: "animal",
    description: "",
    quantity: "1",
    unit_price: "",
    buyer: "",
    sale_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const animalsMap = useMemo(() => {
    const map = new Map<string, any>();
    (animals || []).forEach((a: any) => map.set(a.id, a));
    return map;
  }, [animals]);

  const getAnimalDisplayName = (animalId?: string | null) => {
    if (!animalId) return "Dépense générale (Tout le cheptel)";
    const a = animalsMap.get(animalId);
    if (!a) return "Sujet / Lot";
    if (a.is_group) return `[Lot] ${a.group_label || a.name || "Lot"} (${a.species})`;
    return `${a.name || a.identification_number || "Animal"} (${a.species})`;
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expForm.description) {
      toast.error("Veuillez sélectionner ou décrire la dépense");
      return;
    }
    const amount = Number(expForm.amount);
    if (!amount || amount <= 0) {
      toast.error("Veuillez indiquer un montant valide en FCFA");
      return;
    }

    const payload = {
      farm_id: effectiveFarmId,
      animal_id: expForm.animal_id || null,
      category: expForm.category,
      description: expForm.description,
      amount,
      expense_date: expForm.expense_date,
      notes: expForm.notes || null,
    };

    const result = await insertExpense(payload);
    if (result) {
      toast.success("Dépense enregistrée avec succès.");
      setOpenExpense(false);
      setExpForm({
        animal_id: "",
        category: "alimentation",
        description: "",
        amount: "",
        expense_date: new Date().toISOString().split("T")[0],
        notes: "",
      });
    }
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleForm.description) {
      toast.error("Veuillez sélectionner ou décrire le produit vendu");
      return;
    }
    const quantity = Number(saleForm.quantity);
    const unitPrice = Number(saleForm.unit_price);
    if (!quantity || quantity <= 0) {
      toast.error("Quantité vendue invalide");
      return;
    }
    if (!unitPrice || unitPrice <= 0) {
      toast.error("Prix unitaire invalide");
      return;
    }

    const total = quantity * unitPrice;
    const payload = {
      farm_id: effectiveFarmId,
      animal_id: saleForm.animal_id || null,
      sale_type: saleForm.sale_type,
      description: saleForm.description,
      quantity,
      unit_price: unitPrice,
      total_amount: total,
      buyer: saleForm.buyer || null,
      sale_date: saleForm.sale_date,
      notes: saleForm.notes || null,
    };

    const result = await insertSale(payload);
    if (result) {
      toast.success("Vente enregistrée avec succès.");
      setOpenSale(false);
      setSaleForm({
        animal_id: "",
        sale_type: "animal",
        description: "",
        quantity: "1",
        unit_price: "",
        buyer: "",
        sale_date: new Date().toISOString().split("T")[0],
        notes: "",
      });
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Supprimer cette dépense ?")) return;
    await deleteExpense(id);
    toast.success("Dépense supprimée");
  };

  const handleDeleteSale = async (id: string) => {
    if (!confirm("Supprimer cette vente ?")) return;
    await deleteSale(id);
    toast.success("Vente supprimée");
  };

  const loading = loadingExp || loadingSale || loadingAnimals;
  const totalExpenses = (expenses || []).reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
  const totalSales = (sales || []).reduce((s: number, e: any) => s + Number(e.total_amount || 0), 0);
  const netMargin = totalSales - totalExpenses;

  const currentExpDescs = expenseDescriptions[expForm.category] || [];
  const currentSaleDescs = saleDescriptions[saleForm.sale_type] || [];

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <BackNavigationButton fallbackTo="/dashboard" />
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-extrabold flex items-center gap-2">
              <Wallet className="h-7 w-7 text-primary" />
              Comptabilité & Finances Pastorales
            </h1>
            <p className="text-muted-foreground text-sm">
              Suivi des dépenses d'élevage, recettes des ventes et calcul de la marge nette
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOffline && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-xs">
              <WifiOff className="h-3 w-3 mr-1" />
              Mode hors-ligne
            </Badge>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-destructive/10 flex items-center justify-center shrink-0">
              <TrendingDown className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Total dépenses engagées</p>
              <p className="text-2xl font-extrabold text-destructive mt-0.5">
                {totalExpenses.toLocaleString()} <span className="text-xs font-semibold">FCFA</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Total recettes / ventes</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">
                {totalSales.toLocaleString()} <span className="text-xs font-semibold">FCFA</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${netMargin >= 0 ? "bg-primary/10" : "bg-destructive/10"}`}>
              <DollarSign className={`h-6 w-6 ${netMargin >= 0 ? "text-primary" : "text-destructive"}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Marge nette / Solde</p>
              <p className={`text-2xl font-extrabold mt-0.5 ${netMargin >= 0 ? "text-primary" : "text-destructive"}`}>
                {netMargin >= 0 ? "+" : ""}{netMargin.toLocaleString()} <span className="text-xs font-semibold">FCFA</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="expenses" className="gap-1.5 text-xs sm:text-sm font-semibold">
            <TrendingDown className="h-4 w-4" />
            Dépenses ({expenses.length})
          </TabsTrigger>
          <TabsTrigger value="sales" className="gap-1.5 text-xs sm:text-sm font-semibold">
            <TrendingUp className="h-4 w-4" />
            Ventes & Recettes ({sales.length})
          </TabsTrigger>
        </TabsList>

        {/* ONGLET DÉPENSES */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <p className="text-xs text-muted-foreground font-medium">
              Aliments, vaccins, main d'œuvre, outillage et frais de vétérinaire
            </p>
            <Dialog open={openExpense} onOpenChange={setOpenExpense}>
              <DialogTrigger asChild>
                <Button className="h-10 font-bold bg-destructive hover:bg-destructive/90 text-white shadow-xs">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Nouvelle dépense
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-destructive" />
                    Enregistrer une dépense
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleExpenseSubmit} className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Catégorie de dépense *</Label>
                    <Select
                      value={expForm.category}
                      onValueChange={(v) => setExpForm({ ...expForm, category: v, description: "" })}
                    >
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Description *</Label>
                    <Select
                      value={expForm.description}
                      onValueChange={(v) => setExpForm({ ...expForm, description: v })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Choisir la nature de la dépense..." />
                      </SelectTrigger>
                      <SelectContent>
                        {currentExpDescs.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Montant payé (FCFA) *</Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Ex: 15000"
                        value={expForm.amount}
                        onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })}
                        required
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Date de dépense</Label>
                      <Input
                        type="date"
                        value={expForm.expense_date}
                        onChange={(e) => setExpForm({ ...expForm, expense_date: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Imputation animale (Optionnelle)</Label>
                    <Select
                      value={expForm.animal_id}
                      onValueChange={(v) => setExpForm({ ...expForm, animal_id: v })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Dépense générale (Tout le cheptel)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="global">Tout l'élevage / Dépense générale</SelectItem>
                        {animals.map((a: any) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.is_group ? `[Lot] ${a.group_label || a.name || "Lot"}` : a.name || a.identification_number || "Animal"}{" "}
                            ({a.species})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Observations</Label>
                    <Input
                      placeholder="Fournisseur, facture, mode de règlement..."
                      value={expForm.notes}
                      onChange={(e) => setExpForm({ ...expForm, notes: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>

                  <Button type="submit" className="w-full h-10 font-bold bg-destructive hover:bg-destructive/90 text-white mt-2">
                    Enregistrer la charge
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
            </div>
          ) : expenses.length === 0 ? (
            <Card className="rounded-2xl border-dashed">
              <CardContent className="p-12 text-center text-muted-foreground space-y-2">
                <p className="font-semibold text-base">Aucune dépense pastorale enregistrée</p>
                <p className="text-xs text-muted-foreground">
                  Suivez vos charges opérationnelles pour évaluer le coût de revient par animal.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {expenses.map((e: any) => {
                const targetName = getAnimalDisplayName(e.animal_id);
                const cat = expenseCategories.find((c) => c.value === e.category)?.label || e.category;
                return (
                  <Card key={e.id} className={`rounded-2xl border transition-all hover:shadow-xs ${e._offline ? "border-dashed border-amber-400" : ""}`}>
                    <CardContent className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-foreground truncate">{e.description}</span>
                            <Badge variant="outline" className="text-xs">
                              {cat}
                            </Badge>
                            {e._offline && <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700">En attente</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground font-medium">
                            {targetName} • {new Date(e.expense_date).toLocaleDateString("fr-FR")}
                          </p>
                          {e.notes && <p className="text-[11px] text-muted-foreground italic truncate">« {e.notes} »</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-extrabold text-sm text-destructive">
                          -{Number(e.amount).toLocaleString()} FCFA
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteExpense(e.id)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-xl"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ONGLET VENTES */}
        <TabsContent value="sales" className="space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <p className="text-xs text-muted-foreground font-medium">
              Vente d'animaux sur pied, lait, œufs, poissons et sous-produits
            </p>
            <Dialog open={openSale} onOpenChange={setOpenSale}>
              <DialogTrigger asChild>
                <Button className="h-10 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Nouvelle vente
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                    Enregistrer une vente pastorale
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaleSubmit} className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Type de produit *</Label>
                    <Select
                      value={saleForm.sale_type}
                      onValueChange={(v) => setSaleForm({ ...saleForm, sale_type: v, description: "" })}
                    >
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {saleTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Description *</Label>
                    <Select
                      value={saleForm.description}
                      onValueChange={(v) => setSaleForm({ ...saleForm, description: v })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Choisir le libellé..." />
                      </SelectTrigger>
                      <SelectContent>
                        {currentSaleDescs.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Quantité *</Label>
                      <Input
                        type="number"
                        step="any"
                        min="1"
                        placeholder="Ex: 1"
                        value={saleForm.quantity}
                        onChange={(e) => setSaleForm({ ...saleForm, quantity: e.target.value })}
                        required
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Prix unitaire (FCFA) *</Label>
                      <Input
                        type="number"
                        placeholder="Ex: 250000"
                        value={saleForm.unit_price}
                        onChange={(e) => setSaleForm({ ...saleForm, unit_price: e.target.value })}
                        required
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Acheteur / Débouché</Label>
                      <Select
                        value={saleForm.buyer}
                        onValueChange={(v) => setSaleForm({ ...saleForm, buyer: v })}
                      >
                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                        <SelectContent>
                          {buyers.map((b) => (
                            <SelectItem key={b} value={b}>{b}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Date de vente</Label>
                      <Input
                        type="date"
                        value={saleForm.sale_date}
                        onChange={(e) => setSaleForm({ ...saleForm, sale_date: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Animal vendu (Si vente sur pied)</Label>
                    <Select
                      value={saleForm.animal_id}
                      onValueChange={(v) => setSaleForm({ ...saleForm, animal_id: v })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Sélectionner l'animal ou lot..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucun animal spécifique</SelectItem>
                        {animals.map((a: any) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.is_group ? `[Lot] ${a.group_label || a.name || "Lot"}` : a.name || a.identification_number || "Animal"}{" "}
                            ({a.species})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" className="w-full h-10 font-bold bg-emerald-600 hover:bg-emerald-700 text-white mt-2">
                    Enregistrer la recette
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
            </div>
          ) : sales.length === 0 ? (
            <Card className="rounded-2xl border-dashed">
              <CardContent className="p-12 text-center text-muted-foreground space-y-2">
                <p className="font-semibold text-base">Aucune vente pastorale enregistrée</p>
                <p className="text-xs text-muted-foreground">
                  Enregistrez vos ventes d'animaux, plateaux d'œufs ou poissons pour mesurer la rentabilité.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {sales.map((s: any) => {
                const typeConfig = saleTypes.find((t) => t.value === s.sale_type);
                return (
                  <Card key={s.id} className={`rounded-2xl border transition-all hover:shadow-xs ${s._offline ? "border-dashed border-amber-400" : ""}`}>
                    <CardContent className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                          <TrendingUp className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-foreground truncate">{s.description}</span>
                            <Badge variant="outline" className="text-xs">
                              {typeConfig?.label || s.sale_type}
                            </Badge>
                            {s._offline && <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700">En attente</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground font-medium">
                            {Number(s.quantity)} unité(s) à {Number(s.unit_price).toLocaleString()} FCFA
                            {s.buyer && <span> • Client : <strong className="text-foreground">{s.buyer}</strong></span>}
                            <span> • {new Date(s.sale_date).toLocaleDateString("fr-FR")}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-extrabold text-sm text-emerald-600">
                          +{Number(s.total_amount).toLocaleString()} FCFA
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSale(s.id)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-xl"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LivestockFinancePage;
