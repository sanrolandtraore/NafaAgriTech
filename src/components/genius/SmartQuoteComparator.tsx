import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  FileText, Store, CheckCircle2, ArrowUpDown, Sparkles, RefreshCw,
  ShieldCheck, Calculator, Download, UserCheck, Edit3, Truck, Users,
  AlertCircle, DollarSign
} from "lucide-react";
import { toast } from "sonner";
import {
  UnifiedEngineeringProject,
  EngineeringMaterialItem,
  PartnerPriceOffer,
  VERIFIED_NAFA_PARTNERS,
  PartnerSupplierId,
  recalculateProjectWithExpertEdits,
  ExpertMaterialUpdate
} from "@/lib/nafaEngineeringStudio";

interface SmartQuoteComparatorProps {
  project: UnifiedEngineeringProject;
  onProjectUpdate: (updated: UnifiedEngineeringProject) => void;
}

export const SmartQuoteComparator: React.FC<SmartQuoteComparatorProps> = ({
  project,
  onProjectUpdate,
}) => {
  const [comparingItem, setComparingItem] = useState<EngineeringMaterialItem | null>(null);
  const [editingItem, setEditingItem] = useState<EngineeringMaterialItem | null>(null);
  const [editedPrice, setEditedPrice] = useState<number | "">("");
  const [editedQty, setEditedQty] = useState<number | "">("");
  const [editedNote, setEditedNote] = useState<string>("");

  // Sélection d'un fournisseur dans le comparateur
  const handleSelectPartnerOffer = (materialId: string, offer: PartnerPriceOffer) => {
    const update: ExpertMaterialUpdate = {
      materialId,
      newSupplierId: offer.supplierId,
      newPriceFcfa: offer.unitPriceFcfa,
      newSpecification: offer.specifications,
      expertNotes: `Fournisseur sélectionné : ${offer.supplierName} (${offer.brand} - Garantie ${offer.warrantyMonths} mois).`,
    };

    const updated = recalculateProjectWithExpertEdits(project, [update]);
    onProjectUpdate(updated);
    setComparingItem(null);
    toast.success(`Offre partenaire « ${offer.supplierName} » appliquée à la ligne !`);
  };

  // Édition manuelle de prix et quantité par l'expert
  const handleOpenEditModal = (item: EngineeringMaterialItem) => {
    setEditingItem(item);
    setEditedPrice(item.selectedPriceFcfa);
    setEditedQty(item.expertQuantity);
    setEditedNote(item.expertModificationNotes || "");
  };

  const handleSaveItemEdits = () => {
    if (!editingItem) return;

    const update: ExpertMaterialUpdate = {
      materialId: editingItem.id,
      newPriceFcfa: editedPrice !== "" ? Number(editedPrice) : undefined,
      newQuantity: editedQty !== "" ? Number(editedQty) : undefined,
      expertNotes: editedNote || "Ajustement personnalisé par l'ingénieur agronome.",
    };

    const updated = recalculateProjectWithExpertEdits(project, [update]);
    onProjectUpdate(updated);
    setEditingItem(null);
    toast.success(`Ligne chiffrage « ${editingItem.designation} » recalculée automatiquement !`);
  };

  // Optimisation en 1 clic : Meilleur prix disponible sur l'ensemble du devis
  const handleOptimizeBestPrices = () => {
    const updates: ExpertMaterialUpdate[] = [];

    for (const item of project.billOfMaterials) {
      if (item.availablePartnerOffers.length > 1) {
        const sorted = [...item.availablePartnerOffers].sort((a, b) => a.unitPriceFcfa - b.unitPriceFcfa);
        const cheapest = sorted[0];
        if (cheapest.supplierId !== item.selectedSupplierId) {
          updates.push({
            materialId: item.id,
            newSupplierId: cheapest.supplierId,
            newPriceFcfa: cheapest.unitPriceFcfa,
            newSpecification: cheapest.specifications,
            expertNotes: `Optimisation automatique au meilleur prix partenaire : ${cheapest.supplierName}.`,
          });
        }
      }
    }

    if (updates.length === 0) {
      toast.info("Le devis utilise déjà les offres partenaires les plus compétitives.");
      return;
    }

    const updated = recalculateProjectWithExpertEdits(project, updates);
    onProjectUpdate(updated);
    toast.success(`Devis optimisé sur ${updates.length} postes avec les meilleurs tarifs partenaires !`);
  };

  // Optimisation en 1 clic : Meilleure garantie constructeur
  const handleOptimizeMaxWarranty = () => {
    const updates: ExpertMaterialUpdate[] = [];

    for (const item of project.billOfMaterials) {
      if (item.availablePartnerOffers.length > 1) {
        const sorted = [...item.availablePartnerOffers].sort((a, b) => b.warrantyMonths - a.warrantyMonths);
        const maxWarranty = sorted[0];
        if (maxWarranty.supplierId !== item.selectedSupplierId) {
          updates.push({
            materialId: item.id,
            newSupplierId: maxWarranty.supplierId,
            newPriceFcfa: maxWarranty.unitPriceFcfa,
            newSpecification: maxWarranty.specifications,
            expertNotes: `Optimisation sur la garantie maximale : ${maxWarranty.supplierName} (${maxWarranty.warrantyMonths} mois).`,
          });
        }
      }
    }

    if (updates.length === 0) {
      toast.info("Toutes les lignes sélectionnent déjà la garantie maximale disponible.");
      return;
    }

    const updated = recalculateProjectWithExpertEdits(project, updates);
    onProjectUpdate(updated);
    toast.success(`Sélection de la garantie constructeur maximale appliquée (${updates.length} postes) !`);
  };

  return (
    <Card className="border-border/80 bg-card overflow-hidden shadow-sm">
      <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-base font-bold text-foreground">
                Chiffrage Intelligent & Comparateur Multi-Fournisseurs Partenaires
              </CardTitle>
            </div>
            <CardDescription className="text-xs mt-0.5">
              Tarifs réels des partenaires agréés NAFA-AGRITECH. Comparateur d'offres en temps réel, calcul exact des métrés et recalcul dynamique.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={handleOptimizeBestPrices}
              className="h-8 text-xs border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-semibold gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              Optimiser Meilleurs Prix (-8.5%)
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleOptimizeMaxWarranty}
              className="h-8 text-xs border-sky-500/30 text-sky-800 dark:text-sky-300 font-semibold gap-1.5"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
              Garantie Maximale
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Tableau des matériels et offres partenaires */}
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted/60 text-muted-foreground border-b border-border text-[11px]">
                <th className="py-2.5 px-3 font-semibold">Poste / Matériel & Standard CIRAD-FAO</th>
                <th className="py-2.5 px-3 font-semibold">Quantité</th>
                <th className="py-2.5 px-3 font-semibold">Fournisseur Partenaire Sélectionné</th>
                <th className="py-2.5 px-3 font-semibold text-right">Prix Unitaire</th>
                <th className="py-2.5 px-3 font-semibold text-right">Montant Total</th>
                <th className="py-2.5 px-3 font-semibold text-center">Actions Expert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {project.billOfMaterials.map((item) => {
                const supplier = VERIFIED_NAFA_PARTNERS[item.selectedSupplierId];
                const hasMultipleOffers = item.availablePartnerOffers.length > 1;

                return (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-foreground">{item.designation}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                        {item.ciradFaoStandard}
                      </div>
                      {item.isCustomizedByExpert && (
                        <Badge variant="outline" className="text-[9px] mt-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">
                          Ajusté par l'expert
                        </Badge>
                      )}
                    </td>

                    <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                      {item.expertQuantity.toLocaleString()} {item.unit}
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                        <Store className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{supplier?.name || item.selectedSupplierId}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Garantie : {supplier?.warrantyMonths || 24} mois · Délai : {supplier?.deliveryDays || 1}j
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-medium">
                      {item.selectedPriceFcfa.toLocaleString()} FCFA
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                      {item.totalPriceFcfa.toLocaleString()} FCFA
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {hasMultipleOffers && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setComparingItem(item)}
                            className="h-7 text-[11px] px-2 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 gap-1"
                            title="Comparer les offres d'autres fournisseurs pour ce matériel"
                          >
                            <ArrowUpDown className="h-3 w-3" />
                            <span>Comparer ({item.availablePartnerOffers.length})</span>
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEditModal(item)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          title="Modifier la quantité ou le prix unitaire"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bilan financier global avec décomposition Main-d'œuvre & Transport */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border space-y-2 text-xs">
            <h4 className="font-bold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Garanties & Clauses d'Exécution Contractuelles
            </h4>
            <ul className="space-y-1.5 text-muted-foreground text-[11px]">
              <li>• Tous les équipements sont garantis de 24 à 36 mois par les partenaires agréés.</li>
              <li>• Acompte de démarrage : 50% à la signature du devis officiel.</li>
              <li>• Paiement intermédiaire : 35% à la livraison et constatation des matériels sur site.</li>
              <li>• Solde : 15% à la réception provisoire après mise en eau et essai de pompage.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-emerald-500/10">
              <span className="text-muted-foreground">Sous-total Matériaux & Équipements Partenaires</span>
              <span className="font-mono font-bold">
                {project.financialSummary.totalMaterialsEquipmentFcfa.toLocaleString()} FCFA
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-emerald-500/10">
              <span className="text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3 text-emerald-600" /> Main-d'œuvre qualifiée & Pose (14%)
              </span>
              <span className="font-mono font-bold">
                {project.financialSummary.totalLaborFcfa.toLocaleString()} FCFA
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-emerald-500/10">
              <span className="text-muted-foreground flex items-center gap-1">
                <Truck className="h-3 w-3 text-emerald-600" /> Logistique & Transport sur site (5%)
              </span>
              <span className="font-mono font-bold">
                {project.financialSummary.totalLogisticsTransportFcfa.toLocaleString()} FCFA
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-emerald-500/10">
              <span className="text-muted-foreground">Imprévus techniques de chantier (4%)</span>
              <span className="font-mono font-bold">
                {project.financialSummary.contingenciesFcfa.toLocaleString()} FCFA
              </span>
            </div>

            <div className="flex justify-between pt-2 text-sm sm:text-base font-extrabold text-emerald-800 dark:text-emerald-200">
              <span>MONTANT TOTAL CLÉ EN MAIN</span>
              <span className="font-mono">
                {project.financialSummary.grandTotalFcfa.toLocaleString()} FCFA
              </span>
            </div>
          </div>
        </div>

        {/* Modal Comparateur Multi-Fournisseurs */}
        <Dialog open={!!comparingItem} onOpenChange={(open) => !open && setComparingItem(null)}>
          <DialogContent className="sm:max-w-[620px]">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-emerald-600" />
                Comparateur d'Offres Partenaires : {comparingItem?.designation}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <p className="text-muted-foreground">
                Sélectionnez le fournisseur partenaire de votre choix. Le montant total du devis sera recalculé automatiquement.
              </p>

              <div className="space-y-2">
                {comparingItem?.availablePartnerOffers.map((offer) => {
                  const isCurrent = offer.supplierId === comparingItem.selectedSupplierId;
                  const supplier = VERIFIED_NAFA_PARTNERS[offer.supplierId];

                  return (
                    <div
                      key={offer.supplierId}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isCurrent
                          ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500"
                          : "bg-card border-border hover:border-emerald-500/40"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{offer.supplierName}</span>
                          {isCurrent && (
                            <Badge className="text-[10px] bg-emerald-600 text-white">Actuel</Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-medium">
                          Modèle : {offer.brand} - {offer.model}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {offer.specifications}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-2 pt-0.5">
                          <span>Garantie : <strong>{offer.warrantyMonths} mois</strong></span>
                          <span>·</span>
                          <span>Disponibilité : <strong>{offer.availability.replace(/_/g, " ")}</strong></span>
                          <span>·</span>
                          <span>Ville : <strong>{supplier?.city}</strong></span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono text-sm font-bold text-foreground">
                          {offer.unitPriceFcfa.toLocaleString()} FCFA
                        </div>
                        <Button
                          size="sm"
                          disabled={isCurrent}
                          onClick={() => handleSelectPartnerOffer(comparingItem.id, offer)}
                          className="h-7 text-xs mt-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          {isCurrent ? "Sélectionné" : "Choisir ce fournisseur"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal d'édition manuelle par l'expert */}
        <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
          <DialogContent className="sm:max-w-[460px]">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-emerald-600" />
                Ajustement Manuel Expert : {editingItem?.designation}
              </DialogTitle>
            </DialogHeader>

            {editingItem && (
              <div className="space-y-3 py-2 text-xs">
                <div>
                  <Label className="text-xs font-semibold">Quantité métrée ({editingItem.unit})</Label>
                  <Input
                    type="number"
                    value={editedQty}
                    onChange={(e) => setEditedQty(e.target.value !== "" ? Number(e.target.value) : "")}
                    className="h-8 text-xs mt-1 font-mono"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Prix unitaire négocié (FCFA)</Label>
                  <Input
                    type="number"
                    value={editedPrice}
                    onChange={(e) => setEditedPrice(e.target.value !== "" ? Number(e.target.value) : "")}
                    className="h-8 text-xs mt-1 font-mono"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Justification technique de l'expert</Label>
                  <Input
                    value={editedNote}
                    onChange={(e) => setEditedNote(e.target.value)}
                    placeholder="Ex: Négociation directe fournisseur ou adaptation in-situ..."
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button size="sm" variant="outline" onClick={() => setEditingItem(null)} className="h-8 text-xs">
                Annuler
              </Button>
              <Button size="sm" onClick={handleSaveItemEdits} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
                Valider & Recalculer le Devis
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
