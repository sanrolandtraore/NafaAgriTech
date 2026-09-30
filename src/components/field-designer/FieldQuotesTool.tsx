/**
 * NAFA FIELD DESIGNER — MODULE DEVIS & CHIFVRAGE OFFICIEL (FCFA)
 * Génération, personnalisation ligne par ligne et export PDF haute fidélité.
 * Basé sur les prix réels certifiés au Burkina Faso (matériaux, main-d'œuvre, transport).
 */

import React, { useState, useEffect } from "react";
import { EngineeringQuoteDoc, QuoteItem, Farm, FarmBuilding, IrrigationProject } from "@/types/fieldDesigner";
import { generateBuildingBillOfQuantities, generateIrrigationBillOfQuantities } from "@/lib/fieldMaterialsEstimator";
import { exportQuotePdf } from "@/lib/fieldDesignerPdfExport";
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
  Printer,
  FileSpreadsheet,
  Building,
  Droplets,
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

  const updateItem = (id: string, field: "quantity" | "unitPriceFCFA" | "designation", val: any) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const updated = { ...it, [field]: val };
          if (field === "quantity" || field === "unitPriceFCFA") {
            updated.totalFCFA = Math.round(updated.quantity * updated.unitPriceFCFA);
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

  const addNewItem = () => {
    const newItem: QuoteItem = {
      id: `item_custom_${Date.now()}`,
      designation: "Nouvelle fourniture ou prestation agricole",
      category: "divers",
      unit: "unité",
      quantity: 1,
      unitPriceFCFA: 10000,
      totalFCFA: 10000,
    };
    setItems((prev) => [...prev, newItem]);
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

    const doc = exportQuotePdf(targetDoc, farm, expertName);
    doc.save(`Devis_${farm.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("Devis PDF téléchargé avec succès.");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="rounded-3xl border-2 border-primary/20 shadow-sm">
        <CardContent className="p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2">
                <Wallet className="h-6 w-6 text-primary" />
                Générateur de Devis Officiel (FCFA)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Chiffrage transparent basé sur la mercuriale des prix réels du Burkina Faso.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={addNewItem} className="h-9 text-xs font-bold rounded-xl gap-1">
                <Plus className="h-4 w-4" /> Ajouter une ligne
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs font-bold">Titre du Devis</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10 rounded-xl text-xs font-semibold mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-bold">Nom du Client / Producteur</Label>
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

          {/* ── TABLEAU ÉDITABLE DES ARTICLES ── */}
          <div className="rounded-2xl border overflow-hidden">
            <div className="bg-muted/70 p-2.5 text-xs font-bold grid grid-cols-12 gap-2 text-foreground">
              <span className="col-span-5">Désignation & Fourniture</span>
              <span className="col-span-2 text-center">Unité</span>
              <span className="col-span-1 text-center">Qté</span>
              <span className="col-span-2 text-right">P.U. (FCFA)</span>
              <span className="col-span-2 text-right">Total (FCFA)</span>
            </div>

            <div className="divide-y divide-border/60 max-h-72 overflow-y-auto bg-card text-xs">
              {items.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-xs">
                  Aucun élément chiffré pour le moment. Concevez un bâtiment ou une irrigation, ou cliquez sur « Ajouter une ligne ».
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="p-2.5 grid grid-cols-12 gap-2 items-center hover:bg-muted/20">
                    <div className="col-span-5 flex items-center gap-1.5">
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-muted-foreground hover:text-destructive p-0.5"
                        title="Supprimer la ligne"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <Input
                        value={item.designation}
                        onChange={(e) => updateItem(item.id, "designation", e.target.value)}
                        className="h-8 text-xs font-medium border-0 shadow-none p-1"
                      />
                    </div>
                    <span className="col-span-2 text-center text-muted-foreground text-[11px]">
                      {item.unit}
                    </span>
                    <div className="col-span-1">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs font-mono text-center border-0 shadow-none p-1 font-bold"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={item.unitPriceFCFA}
                        onChange={(e) => updateItem(item.id, "unitPriceFCFA", parseInt(e.target.value) || 0)}
                        className="h-8 text-xs font-mono text-right border-0 shadow-none p-1"
                      />
                    </div>
                    <span className="col-span-2 text-right font-mono font-bold text-foreground">
                      {item.totalFCFA.toLocaleString("fr-FR")} F
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* ── TOTAUX & POSTES COMPLÉMENTAIRES ── */}
            <div className="bg-muted/40 p-4 border-t space-y-2 text-xs">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Sous-total Fournitures & Matériaux :</span>
                <span className="font-mono font-bold text-foreground">
                  {subtotalMaterials.toLocaleString("fr-FR")} FCFA
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60">
                <div>
                  <Label className="text-[11px] font-bold">Main d'œuvre qualifiée (FCFA)</Label>
                  <Input
                    type="number"
                    value={laborCost}
                    onChange={(e) => setLaborCost(parseInt(e.target.value) || 0)}
                    className="h-9 rounded-xl text-xs font-mono font-bold mt-0.5"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold">Logistique & Transport livraison (FCFA)</Label>
                  <Input
                    type="number"
                    value={transportCost}
                    onChange={(e) => setTransportCost(parseInt(e.target.value) || 0)}
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

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSave}
              className="flex-1 h-13 rounded-2xl font-black text-sm gradient-primary text-primary-foreground gap-2"
            >
              <Save className="h-5 w-5" />
              Enregistrer ce Devis
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
    </div>
  );
};
