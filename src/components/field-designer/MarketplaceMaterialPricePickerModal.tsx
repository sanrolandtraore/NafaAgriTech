import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ShoppingBag, Search, Check, Plus, Tag, Building2, MapPin, 
  CheckCircle2, Sparkles, X, PlusCircle, Wrench
} from "lucide-react";
import { toast } from "sonner";
import { MaterialPriceItem, QuoteItem, MaterialCategory } from "@/types/fieldDesigner";
import { materialsStorage, DEFAULT_BURKINA_PRICES } from "@/lib/fieldDesignerPrices";

interface MarketplaceMaterialPricePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddItem: (item: QuoteItem) => void;
  onApplyPriceToLine?: (lineId: string, newUnitPriceFCFA: number, designation?: string, unit?: string, supplier?: string) => void;
  targetLineId?: string | null;
  targetLineDesignation?: string | null;
}

export const MarketplaceMaterialPricePickerModal: React.FC<MarketplaceMaterialPricePickerModalProps> = ({
  open,
  onOpenChange,
  onAddItem,
  onApplyPriceToLine,
  targetLineId,
  targetLineDesignation,
}) => {
  const [activeTab, setActiveTab] = useState<"catalog" | "custom">("catalog");
  const [prices, setPrices] = useState<MaterialPriceItem[]>(materialsStorage.getAll());
  const [search, setSearch] = useState(targetLineDesignation ? targetLineDesignation.split(" ")[0] : "");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  
  // Personnalisation des prix et fournisseurs par produit dans le catalogue
  const [customUnitPrices, setCustomUnitPrices] = useState<Record<string, number>>({});
  const [customSuppliers, setCustomSuppliers] = useState<Record<string, string>>({});

  // Formulaire pour création d'article et fournisseur sur-mesure
  const [customFormDesignation, setCustomFormDesignation] = useState(targetLineDesignation || "");
  const [customFormSupplier, setCustomFormSupplier] = useState("");
  const [customFormCategory, setCustomFormCategory] = useState<MaterialCategory>("divers");
  const [customFormUnit, setCustomFormUnit] = useState("unité");
  const [customFormQuantity, setCustomFormQuantity] = useState(1);
  const [customFormUnitPrice, setCustomFormUnitPrice] = useState<number>(10000);
  const [saveToLocalStorageCatalog, setSaveToLocalStorageCatalog] = useState(false);

  // Synchronise le catalogue lors de l'ouverture
  React.useEffect(() => {
    if (open) {
      setPrices(materialsStorage.getAll());
      if (targetLineDesignation) {
        setSearch(targetLineDesignation.split(" ")[0]);
        setCustomFormDesignation(targetLineDesignation);
      }
    }
  }, [open, targetLineDesignation]);

  const categories = useMemo(() => {
    return [
      { id: "all", label: "Toutes les catégories" },
      { id: "maconnerie", label: "Maçonnerie & Gros Œuvre" },
      { id: "ferraillage", label: "Ferraillage & Armatures" },
      { id: "charpente_couverture", label: "Charpente & Toiture" },
      { id: "plomberie_irrigation", label: "Hydraulique & Irrigation" },
      { id: "equipement_elevage", label: "Équipement d'Élevage" },
      { id: "cloture", label: "Clôture & Protection" },
      { id: "divers", label: "Fournitures diverses" },
    ];
  }, []);

  const regions = useMemo(() => {
    return [
      { id: "all", label: "Toutes les régions" },
      { id: "Centre & Hauts-Bassins", label: "Centre (Ouaga) & Hauts-Bassins (Bobo)" },
      { id: "Ouagadougou", label: "Ouagadougou" },
      { id: "Bobo-Dioulasso", label: "Bobo-Dioulasso" },
      { id: "Toutes régions", label: "Mercuriale Nationale" },
    ];
  }, []);

  const KNOWN_SUPPLIERS = [
    "CIMBURKINA",
    "CIMASSO",
    "Ciments du Faso",
    "Faso Métal",
    "Socomet",
    "SOPLAST / Faso Plast",
    "Netafim West Africa / Agrisahel",
    "Apex Solar / Lorentz BF",
    "Agrisahel / SAPHYTO",
    "Carrières Nazinon / Mouhoun",
    "Carrière Concassage Yimdi",
    "Quincailleries Réunies BF",
    "Fabrique Locale Agréée",
    "Artisans Métalliers Réunis BF",
    "Fournisseur local de proximité",
  ];

  const filteredPrices = useMemo(() => {
    return prices.filter((item) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.designation.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.supplier.toLowerCase().includes(q) ||
        item.region.toLowerCase().includes(q);

      const matchCat = selectedCategory === "all" || item.category === selectedCategory;
      const matchReg = selectedRegion === "all" || item.region.toLowerCase().includes(selectedRegion.toLowerCase());

      return matchSearch && matchCat && matchReg;
    });
  }, [prices, search, selectedCategory, selectedRegion]);

  const handleQtyChange = (code: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[code] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [code]: next };
    });
  };

  const handleSetDirectQty = (code: string, val: number) => {
    setQuantities((prev) => ({ ...prev, [code]: Math.max(1, val || 1) }));
  };

  const getItemEffectivePrice = (item: MaterialPriceItem): number => {
    return customUnitPrices[item.code] !== undefined ? customUnitPrices[item.code] : item.defaultUnitPriceFCFA;
  };

  const getItemEffectiveSupplier = (item: MaterialPriceItem): string => {
    return customSuppliers[item.code] !== undefined ? customSuppliers[item.code] : item.supplier;
  };

  const handleAddProduct = (item: MaterialPriceItem) => {
    const qty = quantities[item.code] || 1;
    const effectivePrice = getItemEffectivePrice(item);
    const effectiveSupplier = getItemEffectiveSupplier(item);

    const quoteItem: QuoteItem = {
      id: `item_mkt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      designation: item.designation,
      category: item.category,
      unit: item.unit,
      quantity: qty,
      unitPriceFCFA: effectivePrice,
      totalFCFA: Math.round(qty * effectivePrice),
      supplier: effectiveSupplier,
    };

    onAddItem(quoteItem);
    toast.success(`« ${item.designation} » (x${qty}) ajouté auprès de « ${effectiveSupplier} » (${quoteItem.totalFCFA.toLocaleString("fr-FR")} FCFA)`);
  };

  const handleApplyToSpecificLine = (item: MaterialPriceItem) => {
    if (!targetLineId || !onApplyPriceToLine) return;
    const effectivePrice = getItemEffectivePrice(item);
    const effectiveSupplier = getItemEffectiveSupplier(item);

    onApplyPriceToLine(targetLineId, effectivePrice, item.designation, item.unit, effectiveSupplier);
    toast.success(`Prix de ${effectivePrice.toLocaleString("fr-FR")} FCFA et fournisseur « ${effectiveSupplier} » appliqués à la ligne !`);
    onOpenChange(false);
  };

  const handleAddCustomArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFormDesignation.trim()) {
      toast.error("Veuillez indiquer une désignation pour l'article.");
      return;
    }

    const supplier = customFormSupplier.trim() || "Fournisseur Sur-Mesure";
    const unitPrice = Math.max(0, customFormUnitPrice);
    const qty = Math.max(0.01, customFormQuantity);

    if (targetLineId && onApplyPriceToLine) {
      onApplyPriceToLine(targetLineId, unitPrice, customFormDesignation.trim(), customFormUnit, supplier);
      toast.success(`Fournisseur « ${supplier} » et prix ${unitPrice.toLocaleString("fr-FR")} FCFA appliqués !`);
      onOpenChange(false);
      return;
    }

    const newItem: QuoteItem = {
      id: `item_custom_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      designation: customFormDesignation.trim(),
      category: customFormCategory,
      unit: customFormUnit,
      quantity: qty,
      unitPriceFCFA: unitPrice,
      totalFCFA: Math.round(qty * unitPrice),
      supplier: supplier,
    };

    if (saveToLocalStorageCatalog) {
      materialsStorage.save({
        code: `PERSO_${Date.now().toString().slice(-6)}`,
        designation: customFormDesignation.trim(),
        category: customFormCategory,
        unit: customFormUnit,
        defaultUnitPriceFCFA: unitPrice,
        supplier: supplier,
        region: "Toutes régions",
        lastUpdated: new Date().toISOString().split("T")[0],
      });
      setPrices(materialsStorage.getAll());
    }

    onAddItem(newItem);
    toast.success(`Article personnalisé ajouté avec succès auprès de « ${supplier} » (${newItem.totalFCFA.toLocaleString("fr-FR")} FCFA)`);
    setCustomFormDesignation("");
    setCustomFormSupplier("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-[24px]">
        {/* En-tête */}
        <div className="p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white border-b border-emerald-500/20">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg sm:text-xl font-black font-heading text-white">
              Marketplace Matériaux &amp; Prix Réels (Burkina Faso)
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-emerald-100/80">
            Sélectionnez les matériaux certifiés aux tarifs réels du marché burkinabè (CIMBURKINA, Ciments du Faso, Faso Métal, Agrisahel, SOPLAST, Apex Solar) ou définissez vos propres prix et fournisseurs.
          </DialogDescription>
          {targetLineDesignation && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
              <Tag className="h-3.5 w-3.5" />
              <span>Alignement pour : <strong>« {targetLineDesignation} »</strong></span>
            </div>
          )}
        </div>

        {/* Onglets : Catalogue ou Saisie Sur-Mesure */}
        <div className="px-5 pt-3 bg-muted/40 border-b flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid grid-cols-2 max-w-md h-9 p-0.5 rounded-xl bg-background border">
              <TabsTrigger value="catalog" className="text-xs font-bold gap-1.5">
                <ShoppingBag className="h-3.5 w-3.5" />
                Catalogue Fournisseurs BF
              </TabsTrigger>
              <TabsTrigger value="custom" className="text-xs font-bold gap-1.5">
                <PlusCircle className="h-3.5 w-3.5" />
                Fournisseur &amp; Prix Sur-Mesure
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {activeTab === "catalog" && (
          <>
            {/* Barre de filtres et recherche */}
            <div className="p-4 bg-muted/20 border-b space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par matériau (ciment, tuyau PEHD, fer, parpaings, pompe, tôle, fournisseur...)"
                  className="pl-9 h-10 text-xs sm:text-sm rounded-xl"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue placeholder="Catégorie de fourniture" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue placeholder="Région / Mercuriale" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((r) => (
                      <SelectItem key={r.id} value={r.id} className="text-xs">
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Liste des produits marketplace */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[460px]">
              {filteredPrices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground space-y-2">
                  <ShoppingBag className="h-8 w-8 mx-auto opacity-30" />
                  <p className="text-sm font-semibold">Aucun matériau trouvé pour cette recherche</p>
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearch("");
                        setSelectedCategory("all");
                        setSelectedRegion("all");
                      }}
                      className="text-xs"
                    >
                      Réinitialiser les filtres
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setActiveTab("custom")}
                      className="text-xs gradient-primary text-primary-foreground gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Créer un article sur-mesure
                    </Button>
                  </div>
                </div>
              ) : (
                filteredPrices.map((item) => {
                  const qty = quantities[item.code] || 1;
                  const effectivePrice = getItemEffectivePrice(item);
                  const effectiveSupplier = getItemEffectiveSupplier(item);
                  const isPriceModified = customUnitPrices[item.code] !== undefined;

                  return (
                    <div
                      key={item.code}
                      className="p-3.5 rounded-2xl border border-border/80 bg-card hover:border-primary/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-foreground">
                            {item.designation}
                          </span>
                        </div>

                        {/* Fournisseur personnalisable */}
                        <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
                          <Badge variant="outline" className="text-[10px] py-0 bg-muted/40 font-mono">
                            {item.code}
                          </Badge>
                          <div className="inline-flex items-center gap-1.5 bg-muted/60 px-2 py-0.5 rounded-lg border">
                            <Building2 className="h-3 w-3 text-primary shrink-0" />
                            <input
                              type="text"
                              value={effectiveSupplier}
                              onChange={(e) =>
                                setCustomSuppliers((prev) => ({ ...prev, [item.code]: e.target.value }))
                              }
                              placeholder="Nom du fournisseur"
                              className="bg-transparent text-xs font-semibold text-primary focus:outline-none w-36 sm:w-44 truncate"
                              title="Cliquez pour changer le fournisseur"
                            />
                          </div>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {item.region}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0">
                        {/* Prix unitaire éditable en direct */}
                        <div className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <input
                              type="number"
                              value={effectivePrice}
                              onChange={(e) =>
                                setCustomUnitPrices((prev) => ({
                                  ...prev,
                                  [item.code]: parseInt(e.target.value) || 0,
                                }))
                              }
                              className={`w-24 text-right text-xs sm:text-sm font-black font-mono border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary ${
                                isPriceModified
                                  ? "bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400"
                                  : "bg-background border-border text-emerald-700 dark:text-emerald-400"
                              }`}
                              title="Modifiez le prix unitaire librement selon votre négociation"
                            />
                            <span className="text-xs font-bold font-mono">F</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground block mt-0.5">
                            par {item.unit} {isPriceModified && "(négocié)"}
                          </span>
                        </div>

                        {/* Sélecteur de quantité */}
                        {!targetLineId && (
                          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
                            <button
                              type="button"
                              onClick={() => handleQtyChange(item.code, -1)}
                              className="h-6 w-6 rounded-lg bg-background text-foreground flex items-center justify-center text-xs font-bold hover:bg-muted"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={qty}
                              onChange={(e) => handleSetDirectQty(item.code, parseInt(e.target.value) || 1)}
                              className="w-10 text-center text-xs font-bold bg-transparent border-0 p-0 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleQtyChange(item.code, 1)}
                              className="h-6 w-6 rounded-lg bg-background text-foreground flex items-center justify-center text-xs font-bold hover:bg-muted"
                            >
                              +
                            </button>
                          </div>
                        )}

                        {/* Boutons d'action */}
                        {targetLineId ? (
                          <Button
                            size="sm"
                            onClick={() => handleApplyToSpecificLine(item)}
                            className="h-8 text-xs font-bold rounded-xl gradient-primary text-primary-foreground gap-1.5"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Appliquer ce prix
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleAddProduct(item)}
                            className="h-8 text-xs font-bold rounded-xl gradient-primary text-primary-foreground gap-1"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Ajouter
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Onglet Saisie Sur-Mesure */}
        {activeTab === "custom" && (
          <form onSubmit={handleAddCustomArticle} className="p-5 overflow-y-auto space-y-4 max-h-[480px]">
            <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-xs space-y-1">
              <span className="font-bold text-primary flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                Liberté totale de chiffrage &amp; Fournisseur local
              </span>
              <p className="text-muted-foreground">
                Saisissez n'importe quelle fourniture, main d'œuvre ou prestation avec le fournisseur et le tarif négocié de votre choix.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label className="text-xs font-bold">Désignation de la fourniture ou prestation *</Label>
                <Input
                  value={customFormDesignation}
                  onChange={(e) => setCustomFormDesignation(e.target.value)}
                  placeholder="Ex: Câble solaire cuivre 6mm², Cuve PEHD 5000L, Pompe immergée 2HP..."
                  className="h-9 rounded-xl text-xs mt-1"
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-bold">Fournisseur ou prestataire</Label>
                <Input
                  list="known-suppliers-list"
                  value={customFormSupplier}
                  onChange={(e) => setCustomFormSupplier(e.target.value)}
                  placeholder="Ex: Quincaillerie Al-Nour, FASO SOLAIRE, Ets Kaboré..."
                  className="h-9 rounded-xl text-xs mt-1"
                />
                <datalist id="known-suppliers-list">
                  {KNOWN_SUPPLIERS.map((s, idx) => (
                    <option key={idx} value={s} />
                  ))}
                </datalist>
              </div>

              <div>
                <Label className="text-xs font-bold">Catégorie</Label>
                <Select value={customFormCategory} onValueChange={(v) => setCustomFormCategory(v as any)}>
                  <SelectTrigger className="h-9 text-xs rounded-xl mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maconnerie">Maçonnerie</SelectItem>
                    <SelectItem value="ferraillage">Ferraillage</SelectItem>
                    <SelectItem value="charpente_couverture">Charpente &amp; Toiture</SelectItem>
                    <SelectItem value="plomberie_irrigation">Hydraulique &amp; Irrigation</SelectItem>
                    <SelectItem value="equipement_elevage">Équipement d'Élevage</SelectItem>
                    <SelectItem value="cloture">Clôture</SelectItem>
                    <SelectItem value="main_d_oeuvre">Main d'œuvre</SelectItem>
                    <SelectItem value="divers">Fournitures diverses</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-bold">Unité de mesure</Label>
                <Input
                  value={customFormUnit}
                  onChange={(e) => setCustomFormUnit(e.target.value)}
                  placeholder="Ex: sac, unité, m², ml, camion 10m³, forfait..."
                  className="h-9 rounded-xl text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-bold">Quantité</Label>
                <Input
                  type="number"
                  step="any"
                  value={customFormQuantity}
                  onChange={(e) => setCustomFormQuantity(parseFloat(e.target.value) || 1)}
                  className="h-9 rounded-xl text-xs font-mono font-bold mt-1"
                />
              </div>

              <div className="sm:col-span-2">
                <Label className="text-xs font-bold">Prix Unitaire en FCFA (négocié avec le fournisseur) *</Label>
                <div className="relative mt-1">
                  <Input
                    type="number"
                    value={customFormUnitPrice}
                    onChange={(e) => setCustomFormUnitPrice(parseInt(e.target.value) || 0)}
                    placeholder="Prix en FCFA"
                    className="h-10 rounded-xl text-sm font-mono font-bold pr-14"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-muted-foreground">FCFA</span>
                </div>
              </div>
            </div>

            {/* Total calculé */}
            <div className="p-3 rounded-xl bg-muted/60 border flex items-center justify-between text-xs font-bold">
              <span className="text-muted-foreground">Total calculé :</span>
              <span className="font-mono text-sm text-primary font-black">
                {Math.round(customFormQuantity * customFormUnitPrice).toLocaleString("fr-FR")} FCFA
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="saveCatalog"
                checked={saveToLocalStorageCatalog}
                onChange={(e) => setSaveToLocalStorageCatalog(e.target.checked)}
                className="rounded border-border text-primary cursor-pointer"
              />
              <label htmlFor="saveCatalog" className="text-xs text-muted-foreground cursor-pointer">
                Mémoriser ce matériau et fournisseur dans mon catalogue local réutilisable
              </label>
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full h-11 text-xs font-bold rounded-xl gradient-primary text-primary-foreground gap-2">
                <Plus className="h-4 w-4" />
                {targetLineId ? "Appliquer cet article et tarif à la ligne" : "Ajouter cet article au devis"}
              </Button>
            </div>
          </form>
        )}

        {/* Pied de page du dialogue */}
        <div className="p-3 bg-muted/40 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Prix contrôlés et personnalisables selon les fournisseurs du Burkina Faso.
          </span>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
