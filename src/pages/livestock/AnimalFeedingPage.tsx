import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Wheat, Package, WifiOff, Calculator, Sparkles, ArrowDownRight, AlertTriangle } from "lucide-react";
import { useOfflineData } from "@/hooks/useOfflineData";
import { useDefaultLivestockFarm } from "@/hooks/useDefaultLivestockFarm";
import { LivestockZootechnicCard } from "@/components/livestock/LivestockZootechnicCard";
import BackNavigationButton from "@/components/BackNavigationButton";

export const feedTypes = [
  { value: "Fourrage vert", label: "Fourrage vert (Herbe fraîche, Sorgho fourrager)" },
  { value: "Foin", label: "Foin & Tiges de céréales" },
  { value: "Paille", label: "Paille traitée à l'urée" },
  { value: "Son de blé", label: "Son de blé" },
  { value: "Son de maïs", label: "Son de maïs" },
  { value: "Tourteau de coton", label: "Tourteau de coton (SN-CITEC)" },
  { value: "Tourteau d'arachide", label: "Tourteau d'arachide" },
  { value: "Tourteau de soja", label: "Tourteau de soja" },
  { value: "Provende pondeuse", label: "Provende poules pondeuses" },
  { value: "Provende chair", label: "Provende poulets de chair" },
  { value: "Provende porcin", label: "Provende porcs (Croissance / Finition)" },
  { value: "Aliment poisson", label: "Granulés flottants pour poissons" },
  { value: "Pierre à lécher", label: "Pierre à lécher & Sels minéraux" },
  { value: "CMV (Complément)", label: "Complexe Minéral & Vitaminé (CMV)" },
  { value: "Céréales (maïs, mil)", label: "Céréales concassées (Maïs, Mil, Sorgho)" },
  { value: "Drêche de brasserie", label: "Drêche de brasserie locale" },
  { value: "Autre", label: "Autre aliment" },
];

export const suppliers = [
  "Marché local",
  "SN-CITEC (Tourteau officiel)",
  "Provenderie industrielle",
  "Coopérative d'éleveurs",
  "Grossiste intrants",
  "Production fourragère propre",
  "Autre fournisseur",
];

const AnimalFeedingPage = () => {
  const { user } = useAuth();
  const { farmId } = useDefaultLivestockFarm();
  const effectiveFarmId = farmId || (user ? `farm-${user.id}` : "default_farm");

  const { data: feedings, loading: loadingFeedings, isOffline, insertRow: insertFeeding, deleteRow: deleteFeeding } = useOfflineData({
    table: "animal_feedings",
    select: "*",
    orderBy: "feeding_date",
  });

  const { data: stocks, loading: loadingStocks, insertRow: insertStock, updateRow: updateStock, deleteRow: deleteStock } = useOfflineData({
    table: "feed_stocks",
    select: "*",
    orderBy: "feed_name",
    ascending: true,
  });

  const { data: animals, loading: loadingAnimals } = useOfflineData({
    table: "animals",
    select: "id, name, group_label, identification_number, species, is_group, status",
    orderBy: "name",
  });

  const [openFeeding, setOpenFeeding] = useState(false);
  const [openStock, setOpenStock] = useState(false);
  const [autoDeductStock, setAutoDeductStock] = useState(true);

  const [feedForm, setFeedForm] = useState({
    animal_id: "",
    feed_type: "",
    quantity_kg: "",
    cost: "",
    feeding_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [stockForm, setStockForm] = useState({
    feed_name: "",
    quantity_kg: "",
    unit_price: "",
    supplier: "",
    notes: "",
  });

  const animalsMap = useMemo(() => {
    const map = new Map<string, any>();
    (animals || []).forEach((a: any) => map.set(a.id, a));
    return map;
  }, [animals]);

  const activeAnimals = useMemo(() => {
    return (animals || []).filter((a: any) => (a.status || "actif") === "actif");
  }, [animals]);

  const getRecipientLabel = (animalId?: string | null) => {
    if (!animalId) return "Tout l'élevage (Distribution globale)";
    const a = animalsMap.get(animalId);
    if (!a) return "Sujet / Lot";
    if (a.is_group) return `[Lot] ${a.group_label || a.name || "Lot"} (${a.species})`;
    return `${a.name || a.identification_number || "Animal"} (${a.species})`;
  };

  const handleFeedingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedForm.feed_type) {
      toast.error("Le type d'aliment est requis");
      return;
    }
    const qty = Number(feedForm.quantity_kg);
    if (!qty || qty <= 0) {
      toast.error("Veuillez indiquer une quantité valide en kg");
      return;
    }

    const payload = {
      animal_id: feedForm.animal_id || null,
      farm_id: effectiveFarmId,
      feed_type: feedForm.feed_type,
      quantity_kg: qty,
      cost: feedForm.cost ? Number(feedForm.cost) : 0,
      feeding_date: feedForm.feeding_date,
      notes: feedForm.notes || null,
    };

    const result = await insertFeeding(payload);
    if (result) {
      // Déduction automatique du stock si option cochée
      if (autoDeductStock) {
        const matchingStock = stocks.find((s: any) => s.feed_name === feedForm.feed_type);
        if (matchingStock) {
          const currentStock = Number(matchingStock.quantity_kg || 0);
          const newStock = Math.max(0, currentStock - qty);
          await updateStock(matchingStock.id, { quantity_kg: newStock });
          toast.info(`Stock "${matchingStock.feed_name}" mis à jour : ${newStock} kg restants`);
        }
      }

      toast.success("Distribution d'aliment enregistrée avec succès.");
      setOpenFeeding(false);
      setFeedForm({
        animal_id: "",
        feed_type: "",
        quantity_kg: "",
        cost: "",
        feeding_date: new Date().toISOString().split("T")[0],
        notes: "",
      });
    }
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockForm.feed_name.trim()) {
      toast.error("Veuillez sélectionner ou nommer l'aliment");
      return;
    }
    const qty = Number(stockForm.quantity_kg);
    if (!qty || qty <= 0) {
      toast.error("Veuillez indiquer la quantité reçue en kg");
      return;
    }

    const result = await insertStock({
      farm_id: effectiveFarmId,
      feed_name: stockForm.feed_name,
      quantity_kg: qty,
      unit_price: stockForm.unit_price ? Number(stockForm.unit_price) : 0,
      supplier: stockForm.supplier || null,
      last_purchase_date: new Date().toISOString().split("T")[0],
      notes: stockForm.notes || null,
    });

    if (result) {
      toast.success("Stock d'aliment ajouté au magasin avec succès.");
      setOpenStock(false);
      setStockForm({
        feed_name: "",
        quantity_kg: "",
        unit_price: "",
        supplier: "",
        notes: "",
      });
    }
  };

  const handleDeleteFeeding = async (id: string) => {
    if (!confirm("Supprimer cette distribution d'aliment ?")) return;
    await deleteFeeding(id);
    toast.success("Distribution supprimée");
  };

  const handleDeleteStock = async (id: string) => {
    if (!confirm("Supprimer cet aliment en stock ?")) return;
    await deleteStock(id);
    toast.success("Stock supprimé");
  };

  const loading = loadingFeedings || loadingStocks || loadingAnimals;
  const totalStockKg = stocks.reduce((s: number, st: any) => s + Number(st.quantity_kg || 0), 0);
  const totalStockValue = stocks.reduce(
    (s: number, st: any) => s + Number(st.quantity_kg || 0) * Number(st.unit_price || 0),
    0
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <BackNavigationButton fallbackTo="/dashboard" />
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-extrabold flex items-center gap-2">
              <Wheat className="h-7 w-7 text-amber-500" />
              Alimentation, Rations & Stocks
            </h1>
            <p className="text-muted-foreground text-sm">
              Distributions quotidiennes, gestion du magasin d'aliments et simulation de rations
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

      <Tabs defaultValue="feedings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-xl">
          <TabsTrigger value="feedings" className="gap-1.5 text-xs sm:text-sm font-semibold">
            <Wheat className="h-4 w-4" />
            Distributions
          </TabsTrigger>
          <TabsTrigger value="stocks" className="gap-1.5 text-xs sm:text-sm font-semibold">
            <Package className="h-4 w-4" />
            Magasin & Stocks ({stocks.length})
          </TabsTrigger>
          <TabsTrigger value="simulation" className="gap-1.5 text-xs sm:text-sm font-semibold">
            <Calculator className="h-4 w-4" />
            Simulateur Zootechnique
          </TabsTrigger>
        </TabsList>

        {/* ONGLET 1: DISTRIBUTIONS */}
        <TabsContent value="feedings" className="space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <p className="text-xs text-muted-foreground font-medium">
              Historique des distributions d'aliments et provendes aux animaux
            </p>
            <Dialog open={openFeeding} onOpenChange={setOpenFeeding}>
              <DialogTrigger asChild>
                <Button className="h-10 font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Enregistrer une distribution
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Wheat className="h-5 w-5 text-amber-600" />
                    Distribution d'aliment
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleFeedingSubmit} className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Destinataire (Sujet, Lot ou Tout le cheptel)</Label>
                    <Select value={feedForm.animal_id} onValueChange={(v) => setFeedForm({ ...feedForm, animal_id: v })}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Tout l'élevage (Distribution globale)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="global">Tout le cheptel / Distribution globale</SelectItem>
                        {activeAnimals.map((a: any) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.is_group ? `[Lot] ${a.group_label || a.name || "Lot"}` : a.name || a.identification_number || "Animal"}{" "}
                            ({a.species})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Type d'aliment / Provende *</Label>
                    <Select value={feedForm.feed_type} onValueChange={(v) => setFeedForm({ ...feedForm, feed_type: v })}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Choisir l'aliment..." /></SelectTrigger>
                      <SelectContent>
                        {feedTypes.map((f) => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Quantité distribuée (kg) *</Label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0.1"
                        placeholder="Ex: 25"
                        value={feedForm.quantity_kg}
                        onChange={(e) => setFeedForm({ ...feedForm, quantity_kg: e.target.value })}
                        required
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Coût estimé (FCFA)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={feedForm.cost}
                        onChange={(e) => setFeedForm({ ...feedForm, cost: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Date de distribution</Label>
                    <Input
                      type="date"
                      value={feedForm.feeding_date}
                      onChange={(e) => setFeedForm({ ...feedForm, feeding_date: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border p-2.5 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-foreground">Déduire du stock automatiquement</p>
                      <p className="text-[11px] text-muted-foreground">Soustrait cette quantité du magasin</p>
                    </div>
                    <Switch checked={autoDeductStock} onCheckedChange={setAutoDeductStock} />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Observations</Label>
                    <Input
                      placeholder="Distribution du matin, appétit régulier..."
                      value={feedForm.notes}
                      onChange={(e) => setFeedForm({ ...feedForm, notes: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>

                  <Button type="submit" className="w-full h-10 font-bold bg-amber-600 hover:bg-amber-700 text-white mt-2">
                    Enregistrer la distribution
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
            </div>
          ) : feedings.length === 0 ? (
            <Card className="rounded-2xl border-dashed">
              <CardContent className="p-12 text-center text-muted-foreground space-y-2">
                <p className="font-semibold text-base">Aucune distribution d'aliment enregistrée</p>
                <p className="text-xs text-muted-foreground">
                  Consignez les rations journalières (fourrage, tourteau, son, provende) pour suivre les coûts.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {feedings.map((f: any) => {
                const recipientName = getRecipientLabel(f.animal_id);
                return (
                  <Card key={f.id} className={`rounded-2xl border transition-all hover:shadow-xs ${f._offline ? "border-dashed border-amber-400" : ""}`}>
                    <CardContent className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center shrink-0 mt-0.5">
                          <Wheat className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-foreground">{f.feed_type}</span>
                            <Badge variant="outline" className="text-xs font-semibold bg-amber-500/10 text-amber-700 border-amber-500/30">
                              {Number(f.quantity_kg)} kg
                            </Badge>
                            {f._offline && <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700">En attente</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground font-medium">
                            Destinataire : <strong className="text-foreground">{recipientName}</strong> • {new Date(f.feeding_date).toLocaleDateString("fr-FR")}
                            {f.cost > 0 && <span className="font-bold text-foreground"> • {Number(f.cost).toLocaleString()} FCFA</span>}
                          </p>
                          {f.notes && <p className="text-[11px] text-muted-foreground italic truncate">« {f.notes} »</p>}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteFeeding(f.id)}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-xl shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ONGLET 2: MAGASIN & STOCKS */}
        <TabsContent value="stocks" className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl border bg-card shadow-xs">
              <p className="text-xs text-muted-foreground font-semibold">Tonnage total en stock</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{totalStockKg.toLocaleString()} kg</p>
            </div>
            <div className="p-3 rounded-2xl border bg-card shadow-xs">
              <p className="text-xs text-muted-foreground font-semibold">Valeur financière stock</p>
              <p className="text-2xl font-extrabold text-primary mt-1">{totalStockValue.toLocaleString()} FCFA</p>
            </div>
            <div className="p-3 rounded-2xl border bg-card shadow-xs col-span-2 sm:col-span-1 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Références stockées</p>
                <p className="text-2xl font-extrabold text-amber-600 mt-1">{stocks.length} aliments</p>
              </div>
              <Dialog open={openStock} onOpenChange={setOpenStock}>
                <DialogTrigger asChild>
                  <Button size="sm" className="font-bold h-9">
                    <Plus className="h-4 w-4 mr-1" />
                    Entrée stock
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      Approvisionnement magasin aliment
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleStockSubmit} className="space-y-4 pt-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Aliment réceptionné *</Label>
                      <Select value={stockForm.feed_name} onValueChange={(v) => setStockForm({ ...stockForm, feed_name: v })}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Choisir l'aliment..." /></SelectTrigger>
                        <SelectContent>
                          {feedTypes.map((f) => (
                            <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Quantité (kg) *</Label>
                        <Input
                          type="number"
                          step="1"
                          min="1"
                          placeholder="Ex: 500"
                          value={stockForm.quantity_kg}
                          onChange={(e) => setStockForm({ ...stockForm, quantity_kg: e.target.value })}
                          required
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Prix au kg (FCFA)</Label>
                        <Input
                          type="number"
                          placeholder="Ex: 350"
                          value={stockForm.unit_price}
                          onChange={(e) => setStockForm({ ...stockForm, unit_price: e.target.value })}
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Fournisseur / Origine</Label>
                      <Select value={stockForm.supplier} onValueChange={(v) => setStockForm({ ...stockForm, supplier: v })}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                        <SelectContent>
                          {suppliers.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Notes / Numéro de lot</Label>
                      <Input
                        placeholder="N° de sac, date péremption..."
                        value={stockForm.notes}
                        onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>

                    <Button type="submit" className="w-full h-10 font-bold mt-2">
                      Ajouter au magasin
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {stocks.length === 0 ? (
            <Card className="rounded-2xl border-dashed">
              <CardContent className="p-12 text-center text-muted-foreground space-y-2">
                <p className="font-semibold text-base">Aucun aliment en stock dans le magasin</p>
                <p className="text-xs text-muted-foreground">
                  Enregistrez vos achats de provendes, tourteaux ou fourrages pour suivre les niveaux d'alerte.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {stocks.map((s: any) => {
                const isLow = Number(s.quantity_kg) <= 50;
                return (
                  <Card key={s.id} className={`rounded-2xl border transition-all hover:shadow-xs ${isLow ? "border-amber-400 bg-amber-50/20" : ""}`}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="font-bold text-sm text-foreground">{s.feed_name}</p>
                          {s.supplier && <p className="text-xs text-muted-foreground">{s.supplier}</p>}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteStock(s.id)}
                          className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-xl shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="flex items-baseline justify-between pt-1">
                        <span className="text-xl font-extrabold text-foreground">
                          {Number(s.quantity_kg).toLocaleString()} <span className="text-xs font-semibold text-muted-foreground">kg</span>
                        </span>
                        {s.unit_price > 0 && (
                          <span className="text-xs font-bold text-primary">
                            {(Number(s.quantity_kg) * Number(s.unit_price)).toLocaleString()} FCFA
                          </span>
                        )}
                      </div>

                      {isLow && (
                        <p className="text-[11px] font-semibold text-amber-700 bg-amber-100/60 dark:bg-amber-950/40 px-2 py-0.5 rounded-md w-fit flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-amber-600 shrink-0" />
                          <span>Niveau bas : réapprovisionnement recommandé</span>
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ONGLET 3: CALCULATEUR ZOOTECHNIQUE */}
        <TabsContent value="simulation" className="space-y-4 pt-1">
          <LivestockZootechnicCard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnimalFeedingPage;
