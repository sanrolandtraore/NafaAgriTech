import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ShoppingBag, Search, Check, Plus, Tag, Building2, MapPin, 
  Layers, CheckCircle2, ArrowRight, Sparkles, Filter, X 
} from "lucide-react";
import { toast } from "sonner";
import { MaterialPriceItem, QuoteItem } from "@/types/fieldDesigner";
import { materialsStorage, DEFAULT_BURKINA_PRICES } from "@/lib/fieldDesignerPrices";

interface MarketplaceMaterialPricePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddItem: (item: QuoteItem) => void;
  onApplyPriceToLine?: (lineId: string, newUnitPriceFCFA: number, designation?: string, unit?: string) => void;
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
  const [prices, setPrices] = useState<MaterialPriceItem[]>(materialsStorage.getAll());
  const [search, setSearch] = useState(targetLineDesignation ? targetLineDesignation.split(" ")[0] : "");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const categories = useMemo(() => {
    return [
      { id: "all", label: "Toutes les catégories" },
      { id: "maconnerie", label: "Maçonnerie & Gros Œuvre" },
      { id: "ferraillage", label: "Ferraillage & Armatures" },
      { id: "charpente_couverture", label: "Charpente & Toiture" },
      { id: "plomberie_irrigation", label: "Hydraulique & Irrigation" },
      { id: "equipement_elevage", label: "Équipement d'Élevage" },
      { id: "main_doeuvre", label: "Main d'œuvre & Logistique" },
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

  const handleAddProduct = (item: MaterialPriceItem) => {
    const qty = quantities[item.code] || 1;
    const quoteItem: QuoteItem = {
      id: `item_mkt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      designation: item.designation,
      category: item.category,
      unit: item.unit,
      quantity: qty,
      unitPriceFCFA: item.defaultUnitPriceFCFA,
      totalFCFA: Math.round(qty * item.defaultUnitPriceFCFA),
    };

    onAddItem(quoteItem);
    toast.success(`« ${item.designation} » (x${qty}) ajouté au métré / devis (${quoteItem.totalFCFA.toLocaleString("fr-FR")} FCFA)`);
  };

  const handleApplyToSpecificLine = (item: MaterialPriceItem) => {
    if (!targetLineId || !onApplyPriceToLine) return;
    onApplyPriceToLine(targetLineId, item.defaultUnitPriceFCFA, item.designation, item.unit);
    toast.success(`Prix de ${item.defaultUnitPriceFCFA.toLocaleString("fr-FR")} FCFA (${item.unit}) appliqué à la ligne !`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-[24px]">
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
            Sélectionnez les matériaux certifiés aux tarifs réels du marché burkinabè (CIMBURKINA, Ciments du Faso, Faso Métal, Agrisahel, SOPLAST, Apex Solar).
          </DialogDescription>
          {targetLineDesignation && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
              <Tag className="h-3.5 w-3.5" />
              <span>Alignement pour : <strong>« {targetLineDesignation} »</strong></span>
            </div>
          )}
        </div>

        {/* Barre de filtres et recherche */}
        <div className="p-4 bg-muted/30 border-b space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par matériau (ciment, tuyau PEHD, fer, parpaings, pompe, tôle...)"
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
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[480px]">
          {filteredPrices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground space-y-2">
              <ShoppingBag className="h-8 w-8 mx-auto opacity-30" />
              <p className="text-sm font-semibold">Aucun matériau trouvé pour cette recherche</p>
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
            </div>
          ) : (
            filteredPrices.map((item) => {
              const qty = quantities[item.code] || 1;
              return (
                <div
                  key={item.code}
                  className="p-3 rounded-2xl border border-border/80 bg-card hover:border-primary/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-foreground">
                        {item.designation}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
                      <Badge variant="outline" className="text-[10px] py-0 bg-muted/40 font-mono">
                        {item.code}
                      </Badge>
                      <span className="inline-flex items-center gap-1 text-primary font-medium">
                        <Building2 className="h-3 w-3" />
                        {item.supplier}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {item.region}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0">
                    {/* Prix unitaire certifié */}
                    <div className="text-right">
                      <div className="text-sm font-black text-emerald-700 dark:text-emerald-400 font-mono">
                        {item.defaultUnitPriceFCFA.toLocaleString("fr-FR")} FCFA
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        par {item.unit}
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

        {/* Pied de page du dialogue */}
        <div className="p-3 bg-muted/40 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Prix contrôlés et actualisés selon la mercuriale officielle du Burkina Faso.
          </span>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
