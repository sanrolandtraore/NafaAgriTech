/**
 * NAFA FIELD DESIGNER — MODULE DEVIS & CHIRFRAGE OFFICIEL (FCFA)
 * Génération, personnalisation ligne par ligne et export PDF haute fidélité.
 * Basé sur les prix réels certifiés au Burkina Faso (matériaux, main-d'œuvre, transport).
 * Intégré directement au Marketplace des fournitures et intrants agricoles.
 */

import React, { useState, useEffect } from "react";
import { EngineeringQuoteDoc, QuoteItem, Farm, FarmBuilding, IrrigationProject } from "@/types/fieldDesigner";
import { generateBuildingBillOfQuantities, generateIrrigationBillOfQuantities } from "@/lib/fieldMaterialsEstimator";
import { exportQuotePdf, saveTechnicalQuotePdf } from "@/lib/fieldDesignerPdfExport";
import { materialsStorage } from "@/lib/fieldDesignerPrices";
import { MarketplaceMaterialPricePickerModal } from "./MarketplaceMaterialPricePickerModal";
import PdfExportHistoryModal from "@/components/export/PdfExportHistoryModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Download,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  ShoppingBag,
  Tag,
  Building,
  RefreshCw,
  MapPin,
  Sparkles,
  SlidersHorizontal,
  Copy,
  Percent,
  Store,
} from "lucide-react";
import { toast } from "sonner";

interface FieldQuotesToolProps {
  farm: Farm;
  buildings: FarmBuilding[];
  irrigationProjects: IrrigationProject[];
  onSaveQuote: (quote: EngineeringQuoteDoc) => void;
  savedQuotes: EngineeringQuoteDoc[];
  expertName?: string;
}

export const FieldQuotesTool: React.FC<FieldQuotesToolProps> = ({
  farm,
  buildings,
  irrigationProjects,
  onSaveQuote,
  savedQuotes,
  expertName,
}) => {
  const [title, setTitle] = useState(`Devis d'Aménagement — ${farm.name}`);
  const [clientName, setClientName] = useState(farm.producerName);
  const [clientPhone, setClientPhone] = useState(farm.producerPhone);

  const [items, setItems] = useState<QuoteItem[]>([]);
  const [laborCost, setLaborCost] = useState<number>(150000);
  const [transportCost, setTransportCost] = useState<number>(45000);
  const [contingenciesCost, setContingenciesCost] = useState<number>(0);

  // Gestion du sélecteur de prix réels Marketplace
  const [marketplaceModalOpen, setMarketplaceModalOpen] = useState(false);
  const [targetLineId, setTargetLineId] = useState<string | null>(null);
  const [targetLineDesignation, setTargetLineDesignation] = useState<string | null>(null);
  const [showPdfHistory, setShowPdfHistory] = useState(false);

  // Initialisation à partir des bâtiments et réseaux existants
  useEffect(() => {
    let initialItems: QuoteItem[] = [];
    let initialLabor = 0;
    let initialTransport = 0;

    buildings.forEach((bld) => {
      const boq = generateBuildingBillOfQuantities(bld);
      initialItems = [...initialItems, ...boq.items];
      initialLabor += boq.laborCostFCFA;
      initialTransport += boq.transportCostFCFA;
    });

    irrigationProjects.forEach((irrig) => {
      const boq = generateIrrigationBillOfQuantities(irrig);
      initialItems = [...initialItems, ...boq.items];
      initialLabor += boq.laborCostFCFA;
      initialTransport += boq.transportCostFCFA;
    });

    if (initialItems.length > 0) {
      setItems(initialItems);
      setLaborCost(initialLabor);
      setTransportCost(initialTransport);
    }
  }, [buildings, irrigationProjects]);

  const subtotalMaterials = items.reduce((sum, it) => sum + it.totalFCFA, 0);
  const totalGeneral = subtotalMaterials + laborCost + transportCost + contingenciesCost;

  const [showCustomTools, setShowCustomTools] = useState(false);
  const [globalMarginPercent, setGlobalMarginPercent] = useState<number>(0);
  const [bulkSupplierInput, setBulkSupplierInput] = useState<string>("");

  const updateItem = (
    id: string,
    field: "quantity" | "unitPriceFCFA" | "designation" | "unit" | "supplier" | "notes",
    val: any
  ) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const updated = { ...it, [field]: val };
          if (field === "quantity" || field === "unitPriceFCFA") {
            const qty = field === "quantity" ? parseFloat(val) || 0 : it.quantity;
            const price = field === "unitPriceFCFA" ? parseInt(val, 10) || 0 : it.unitPriceFCFA;
            updated.totalFCFA = Math.round(qty * price);
          }
          return updated;
        }
        return it;
      })
    );
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const duplicateItem = (id: string) => {
    const itemToClone = items.find((it) => it.id === id);
    if (!itemToClone) return;
    const cloned: QuoteItem = {
      ...itemToClone,
      id: `item_custom_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      designation: `${itemToClone.designation} (Copie)`,
    };
    setItems((prev) => [...prev, cloned]);
    toast.success("Ligne d'article dupliquée.");
  };

  const addNewItem = () => {
    const newItem: QuoteItem = {
      id: `item_custom_${Date.now()}`,
      designation: "Nouvelle fourniture ou prestation agricole",
      category: "divers",
      unit: "unité",
      quantity: 1,
      unitPriceFCFA: 10000,
      totalFCFA: 10000,
      supplier: "Fournisseur Local / Négocié",
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Ajout depuis le Marketplace
  const handleAddItemFromMarketplace = (item: QuoteItem) => {
    setItems((prev) => [...prev, item]);
  };

  // Application du prix Marketplace ou sur-mesure à une ligne existante
  const handleApplyPriceToLine = (
    lineId: string,
    newUnitPriceFCFA: number,
    designation?: string,
    unit?: string,
    supplier?: string
  ) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === lineId) {
          const updated = {
            ...it,
            unitPriceFCFA: newUnitPriceFCFA,
            totalFCFA: Math.round(it.quantity * newUnitPriceFCFA),
          };
          if (designation) updated.designation = designation;
          if (unit) updated.unit = unit;
          if (supplier) updated.supplier = supplier;
          return updated;
        }
        return it;
      })
    );
  };

  // Ajustement en pourcentage sur l'ensemble des prix unitaires
  const applyGlobalPercentage = (percent: number) => {
    if (percent === 0) return;
    setItems((prev) =>
      prev.map((it) => {
        const factor = 1 + percent / 100;
        const newUnitPrice = Math.max(1, Math.round(it.unitPriceFCFA * factor));
        return {
          ...it,
          unitPriceFCFA: newUnitPrice,
          totalFCFA: Math.round(it.quantity * newUnitPrice),
        };
      })
    );
    toast.success(`Ajustement de ${percent > 0 ? `+${percent}%` : `${percent}%`} appliqué à tous les prix unitaires.`);
  };

  // Assigner un fournisseur à tous les articles du devis
  const assignSupplierToAll = (supplierName: string) => {
    if (!supplierName.trim()) return;
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        supplier: supplierName.trim(),
      }))
    );
    toast.success(`Fournisseur « ${supplierName.trim()} » attribué à tous les articles.`);
  };

  const openMarketplaceForLine = (lineId: string, designation: string) => {
    setTargetLineId(lineId);
    setTargetLineDesignation(designation);
    setMarketplaceModalOpen(true);
  };

  const openMarketplaceToAdd = () => {
    setTargetLineId(null);
    setTargetLineDesignation(null);
    setMarketplaceModalOpen(true);
  };

  // Mise à jour groupée avec la mercuriale officielle
  const handleApplyRegionalMercuriale = (regionName: string) => {
    const allPrices = materialsStorage.getAll();
    let updatedCount = 0;

    setItems((prev) =>
      prev.map((it) => {
        const found = allPrices.find((p) => {
          const pName = p.designation.toLowerCase();
          const itName = it.designation.toLowerCase();
          return (
            (itName.includes("ciment") && p.code.includes("CIM")) ||
            (itName.includes("parpaing") && p.code.includes("AGG")) ||
            (itName.includes("fer") && p.code.includes("FER")) ||
            (itName.includes("pehd") && p.code.includes("PEHD")) ||
            (itName.includes("goutte") && p.code.includes("GOUTTE")) ||
            (itName.includes("sable") && p.code.includes("SABLE")) ||
            (itName.includes("gravier") && p.code.includes("GRAVIER")) ||
            pName.includes(itName) ||
            itName.includes(pName)
          );
        });

        if (found) {
          updatedCount++;
          return {
            ...it,
            unitPriceFCFA: found.defaultUnitPriceFCFA,
            totalFCFA: Math.round(it.quantity * found.defaultUnitPriceFCFA),
          };
        }
        return it;
      })
    );

    toast.success(`Mercuriale ${regionName} appliquée sur ${updatedCount} poste(s) du devis !`);
  };

  const handleSave = () => {
    const doc: EngineeringQuoteDoc = {
      id: `quote_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      farmId: farm.id,
      title,
      clientName,
      clientPhone,
      items,
      laborCostFCFA: laborCost,
      transportCostFCFA: transportCost,
      contingenciesCostFCFA: contingenciesCost,
      subtotalMaterialsFCFA: subtotalMaterials,
      totalGeneralFCFA: totalGeneral,
      status: "validated",
      syncStatus: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveQuote(doc);
    toast.success("Devis officiel enregistré avec succès.");
  };

  const handleExportPdf = (quoteDoc?: EngineeringQuoteDoc) => {
    const targetDoc: EngineeringQuoteDoc = quoteDoc || {
      id: "active",
      farmId: farm.id,
      title,
      clientName,
      clientPhone,
      items,
      laborCostFCFA: laborCost,
      transportCostFCFA: transportCost,
      contingenciesCostFCFA: contingenciesCost,
      subtotalMaterialsFCFA: subtotalMaterials,
      totalGeneralFCFA: totalGeneral,
      status: "validated",
      syncStatus: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveTechnicalQuotePdf(targetDoc, farm, expertName);
  };


  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="rounded-3xl border-2 border-primary/20 shadow-sm">
        <CardContent className="p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2">
                <Wallet className="h-6 w-6 text-primary" />
                Métrés &amp; Estimation des Matériaux (FCFA)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Chiffrage transparent certifié basé sur la mercuriale des prix réels du Burkina Faso et le Marketplace.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={openMarketplaceToAdd}
                className="h-9 text-xs font-bold rounded-xl gap-1.5 gradient-primary text-primary-foreground shadow-xs"
              >
                <ShoppingBag className="h-4 w-4" />
                Choisir depuis le Marketplace
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={addNewItem}
                className="h-9 text-xs font-bold rounded-xl gap-1"
              >
                <Plus className="h-4 w-4" /> Ajouter manuellement
              </Button>
              <Button
                size="sm"
                variant={showCustomTools ? "secondary" : "outline"}
                onClick={() => setShowCustomTools(!showCustomTools)}
                className="h-9 text-xs font-bold rounded-xl gap-1.5"
                title="Ajustements globaux de prix, marges et fournisseurs"
              >
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                Personnalisation &amp; Tarifs
              </Button>
            </div>
          </div>

          {/* Datalists d'aide à la saisie pour fournisseurs et unités au Burkina Faso */}
          <datalist id="burkina-suppliers-datalist">
            <option value="CIMBURKINA (Ouagadougou)" />
            <option value="CIMFASO (Bobo-Dioulasso)" />
            <option value="Faso Métal" />
            <option value="SOPLAST (Plastiques & Tuyaux)" />
            <option value="Apex Solar Burkina" />
            <option value="Diacfa Matériaux & Quincaillerie" />
            <option value="Agritech Burkina" />
            <option value="Netafim BF" />
            <option value="Fournisseur Local / Négocié" />
          </datalist>

          <datalist id="burkina-units-datalist">
            <option value="unité" />
            <option value="sac 50kg" />
            <option value="m" />
            <option value="m²" />
            <option value="m³" />
            <option value="rouleau 100m" />
            <option value="kg" />
            <option value="tonne" />
            <option value="forfait" />
            <option value="litre" />
          </datalist>

          {/* Outils de personnalisation avancée : ajustement de marge / remise et fournisseur de masse */}
          {showCustomTools && (
            <div className="p-3.5 rounded-2xl bg-muted/40 border border-primary/20 space-y-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-foreground">
                  Personnalisation Globale des Prix &amp; Fournisseurs :
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Ajustement tarifaire en pourcentage */}
                <div className="p-2.5 rounded-xl bg-card border border-border/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-muted-foreground flex items-center gap-1">
                      <Percent className="h-3.5 w-3.5 text-primary" />
                      Remise ou Marge globale sur les P.U. :
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => applyGlobalPercentage(-10)}
                      className="h-7 text-[11px] font-bold px-2 rounded-lg text-emerald-700 hover:bg-emerald-500/10"
                    >
                      -10% (Remise)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => applyGlobalPercentage(-5)}
                      className="h-7 text-[11px] font-bold px-2 rounded-lg text-emerald-700 hover:bg-emerald-500/10"
                    >
                      -5%
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => applyGlobalPercentage(5)}
                      className="h-7 text-[11px] font-bold px-2 rounded-lg text-amber-700 hover:bg-amber-500/10"
                    >
                      +5%
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => applyGlobalPercentage(10)}
                      className="h-7 text-[11px] font-bold px-2 rounded-lg text-amber-700 hover:bg-amber-500/10"
                    >
                      +10% (Marge)
                    </Button>
                  </div>
                </div>

                {/* Attribution groupée d'un fournisseur */}
                <div className="p-2.5 rounded-xl bg-card border border-border/70 space-y-2">
                  <span className="font-semibold text-muted-foreground flex items-center gap-1">
                    <Store className="h-3.5 w-3.5 text-primary" />
                    Fournisseur unique pour tous les articles :
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Input
                      list="burkina-suppliers-datalist"
                      value={bulkSupplierInput}
                      onChange={(e) => setBulkSupplierInput(e.target.value)}
                      placeholder="Ex: CIMBURKINA, Faso Métal..."
                      className="h-7 text-xs rounded-lg flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => assignSupplierToAll(bulkSupplierInput)}
                      disabled={!bulkSupplierInput.trim()}
                      className="h-7 text-[11px] font-bold rounded-lg px-2.5 shrink-0"
                    >
                      Appliquer à tous
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bandeau d'actions rapides : Mercuriale Régionale & Intégration Marketplace */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-950 dark:text-emerald-200">
                Mercuriale des Prix Réels Burkina Faso :
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleApplyRegionalMercuriale("Centre / Ouagadougou")}
                className="h-7 text-[11px] font-semibold bg-background hover:bg-emerald-500/10 gap-1 rounded-lg"
              >
                <MapPin className="h-3 w-3 text-primary" />
                Ouagadougou
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleApplyRegionalMercuriale("Hauts-Bassins / Bobo")}
                className="h-7 text-[11px] font-semibold bg-background hover:bg-emerald-500/10 gap-1 rounded-lg"
              >
                <MapPin className="h-3 w-3 text-primary" />
                Bobo-Dioulasso
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleApplyRegionalMercuriale("Nationale")}
                className="h-7 text-[11px] font-semibold bg-background hover:bg-emerald-500/10 gap-1 rounded-lg"
              >
                <RefreshCw className="h-3 w-3 text-primary" />
                Actualiser tous les prix
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs font-bold">Titre du Devis • Métré</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10 rounded-xl text-xs font-semibold mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-bold">Nom du Client • Exploitant</Label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="h-10 rounded-xl text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-bold">Téléphone</Label>
              <Input
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="h-10 rounded-xl text-xs mt-1"
              />
            </div>
          </div>

          {/* ── TABLEAU ÉDITABLE DES ARTICLES (Prix, Fournisseurs et Unités libres) ── */}
          <div className="rounded-2xl border overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="bg-muted/70 p-2.5 text-xs font-bold grid grid-cols-12 gap-2 text-foreground items-center">
                <span className="col-span-4">Désignation &amp; Fourniture</span>
                <span className="col-span-3">Fournisseur Retenu</span>
                <span className="col-span-1 text-center">Unité</span>
                <span className="col-span-1 text-center">Qté</span>
                <span className="col-span-2 text-right">P.U. (FCFA) &amp; Marché</span>
                <span className="col-span-1 text-right">Total (FCFA)</span>
              </div>

            <div className="divide-y divide-border/60 max-h-96 overflow-y-auto bg-card text-xs">
              {items.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs space-y-2">
                  <ShoppingBag className="h-8 w-8 mx-auto opacity-40 text-primary" />
                  <p className="font-semibold text-foreground">Aucun article dans ce métré</p>
                  <p className="text-[11px]">
                    Sélectionnez des matériaux certifiés sur le marché ou ajoutez une ligne personnalisée.
                  </p>
                  <Button size="sm" onClick={openMarketplaceToAdd} className="text-xs gap-1.5 gradient-primary text-primary-foreground">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Parcourir les prix du Marché
                  </Button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="p-2 grid grid-cols-12 gap-2 items-center hover:bg-muted/20">
                    {/* Désignation & Actions de ligne */}
                    <div className="col-span-4 flex items-center gap-1 min-w-0">
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-muted-foreground hover:text-destructive p-1 rounded-md shrink-0"
                        title="Supprimer cette ligne"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => duplicateItem(item.id)}
                        className="text-muted-foreground hover:text-primary p-1 rounded-md shrink-0"
                        title="Dupliquer cet article"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <Input
                        value={item.designation}
                        onChange={(e) => updateItem(item.id, "designation", e.target.value)}
                        placeholder="Désignation de la fourniture..."
                        className="h-8 text-xs font-medium border border-border/40 focus:border-primary p-1.5 rounded-lg truncate"
                      />
                    </div>

                    {/* Fournisseur éditable librement */}
                    <div className="col-span-3">
                      <Input
                        list="burkina-suppliers-datalist"
                        value={item.supplier || ""}
                        onChange={(e) => updateItem(item.id, "supplier", e.target.value)}
                        placeholder="Fournisseur retenu..."
                        title="Saisissez ou choisissez le fournisseur de votre choix"
                        className="h-8 text-[11px] border border-border/40 focus:border-primary p-1.5 rounded-lg"
                      />
                    </div>

                    {/* Unité éditable librement */}
                    <div className="col-span-1">
                      <Input
                        list="burkina-units-datalist"
                        value={item.unit}
                        onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                        placeholder="Unité"
                        className="h-8 text-center text-[11px] border border-border/40 focus:border-primary p-1 rounded-lg"
                      />
                    </div>

                    {/* Quantité */}
                    <div className="col-span-1">
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        value={isNaN(item.quantity) ? "" : item.quantity}
                        onChange={(e) => updateItem(item.id, "quantity", e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs font-mono text-center font-bold border border-border/40 focus:border-primary p-1 rounded-lg"
                      />
                    </div>

                    {/* Prix unitaire en FCFA modifiable librement + bouton raccourci Prix Marché */}
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      <Input
                        type="number"
                        min="0"
                        value={isNaN(item.unitPriceFCFA) ? "" : item.unitPriceFCFA}
                        onChange={(e) => updateItem(item.id, "unitPriceFCFA", e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0)}
                        className="h-8 w-20 text-xs font-mono font-semibold text-right border border-border/60 focus:border-primary p-1 rounded-lg"
                        title="Prix unitaire personnalisé en FCFA"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openMarketplaceForLine(item.id, item.designation)}
                        className="h-8 px-1.5 text-[10px] font-semibold gap-0.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 shrink-0 rounded-lg"
                        title="Comparer ou choisir le prix réel certifié du Marché"
                      >
                        <Tag className="h-3 w-3" />
                        Marché
                      </Button>
                    </div>

                    {/* Total FCFA recalculé en direct */}
                    <span className="col-span-1 text-right font-mono font-bold text-foreground text-[11px] truncate">
                      {item.totalFCFA.toLocaleString("fr-FR")} F
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* ── TOTAUX & POSTES COMPLÉMENTAIRES ── */}
            <div className="bg-muted/40 p-4 border-t space-y-2 text-xs">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Sous-total Fournitures &amp; Matériaux :</span>
                <span className="font-mono font-bold text-foreground">
                  {subtotalMaterials.toLocaleString("fr-FR")} FCFA
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60">
                <div>
                  <Label className="text-[11px] font-bold">Main d'œuvre qualifiée (FCFA)</Label>
                  <Input
                    type="number"
                    value={isNaN(laborCost) ? "" : laborCost}
                    onChange={(e) => setLaborCost(e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0)}
                    className="h-9 rounded-xl text-xs font-mono font-bold mt-0.5"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold">Logistique &amp; Transport livraison (FCFA)</Label>
                  <Input
                    type="number"
                    value={isNaN(transportCost) ? "" : transportCost}
                    onChange={(e) => setTransportCost(e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0)}
                    className="h-9 rounded-xl text-xs font-mono font-bold mt-0.5"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between text-sm font-bold pt-2 mt-2">
                <span className="text-primary uppercase tracking-wider font-black">
                  MONTANT TOTAL GÉNÉRAL (FCFA) :
                </span>
                <span className="text-xl font-mono font-black text-primary">
                  {totalGeneral.toLocaleString("fr-FR")} FCFA
                </span>
              </div>
            </div>
          </div>
        </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              onClick={handleSave}
              className="flex-1 h-13 rounded-2xl font-black text-sm gradient-primary text-primary-foreground gap-2"
            >
              <Save className="h-5 w-5" />
              Enregistrer ce Devis
            </Button>
            <Button
              onClick={() => setShowPdfHistory(true)}
              variant="outline"
              className="h-13 rounded-2xl font-black text-sm border-border hover:bg-muted text-foreground gap-2 px-5"
              title="Consulter l'historique des devis PDF enregistrés"
            >
              <Wallet className="h-5 w-5 text-emerald-600" />
              Historique PDF
            </Button>
            <Button
              onClick={() => handleExportPdf()}
              variant="outline"
              className="h-13 rounded-2xl font-black text-sm border-primary text-primary gap-2 px-6"
            >
              <Download className="h-5 w-5" />
              Exporter en PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal du Marketplace Matériaux Burkina Faso */}
      <MarketplaceMaterialPricePickerModal
        open={marketplaceModalOpen}
        onOpenChange={setMarketplaceModalOpen}
        onAddItem={handleAddItemFromMarketplace}
        onApplyPriceToLine={handleApplyPriceToLine}
        targetLineId={targetLineId}
        targetLineDesignation={targetLineDesignation}
      />

      {/* Modal d'historique des devis et métrés PDF */}
      <PdfExportHistoryModal
        open={showPdfHistory}
        onOpenChange={setShowPdfHistory}
        defaultModuleFilter="field_designer"
        title="Historique des Devis Chiffrés FCFA"
      />
    </div>
  );
};

