import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Tractor,
  Calendar,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Zap,
  Clock,
  Sparkles,
  Smartphone,
} from "lucide-react";
import { MechanizationJob, MechanizationMachine, MechanizationService } from "./types";
import { listFieldAgents, listMechanizationMachines } from "./repository";

interface MechBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    service?: MechanizationService;
    machine?: MechanizationMachine;
    areaHa?: number;
    totalCost?: number;
    depositAmount?: number;
  } | null;
  onJobCreated: (job: MechanizationJob) => void;
  userParcels?: Array<{ id: string; name: string; area_ha: number }>;
}

export const MechBookingModal = ({
  open,
  onOpenChange,
  initialData,
  onJobCreated,
  userParcels = [],
}: MechBookingModalProps) => {
  const { user } = useAuth();
  const [parcelName, setParcelName] = useState(userParcels[0]?.name ?? "");
  const [areaHa, setAreaHa] = useState<number>(initialData?.areaHa || 3.0);
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0]
  );
  const [operatorPreference, setOperatorPreference] = useState<string>(
    initialData?.machine?.id || "auto_fastest"
  );
  const [paymentMethod, setPaymentMethod] = useState<"orange_money" | "moov_money" | "wave" | "cash_agent">("orange_money");
  const [farmerPhone, setFarmerPhone] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [machines, setMachines] = useState<MechanizationMachine[]>([]);
  const [fieldAgents, setFieldAgents] = useState<any[]>([]);
  useEffect(() => { if (!open) return; Promise.all([listMechanizationMachines(), listFieldAgents()]).then(([m,a]) => { setMachines(m); setFieldAgents(a); if (a[0]) setSelectedAgentId(a[0].id); if (initialData?.machine?.id) setOperatorPreference(initialData.machine.id); else if (m[0]) setOperatorPreference(m[0].id); }).catch((error) => console.warn("Réseau mécanisation:", error)); }, [open, initialData?.machine?.id]);

  const baseRate = initialData?.service?.baseRatePerHa ?? initialData?.machine?.pricePerHa ?? null;
  const computedTotalCost = initialData?.totalCost ?? (baseRate !== null ? Math.round(baseRate * areaHa) : 0);
  const computedDeposit = initialData?.depositAmount ?? Math.round(computedTotalCost * 0.3);

  const serviceTitle =
    initialData?.service?.name ||
    (initialData?.machine ? `Prestation ${initialData.machine.title}` : "Labour standard & Hersage");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialData?.service && !initialData?.machine) { toast.error("Aucune prestation réelle sélectionnée."); return; }
    if (!parcelName.trim() || areaHa <= 0) { toast.error("Renseignez une parcelle et une superficie valides."); return; }
    setIsSubmitting(true);

    const selectedAgent = fieldAgents.find((a) => a.id === selectedAgentId);
    const matchedMachine = machines.find((m) => m.id === operatorPreference);

    if (!user?.id) { toast.error("Connectez-vous pour commander une prestation."); setIsSubmitting(false); return; }
    const { data: row, error } = await supabase.from("mechanization_jobs").insert({
      requester_id:user.id, service_id:initialData?.service?.id ?? null, machine_id:matchedMachine?.id ?? null, field_agent_id:selectedAgent?.id ?? null,
      service_type:serviceTitle, parcel_name:parcelName, area_ha:areaHa, total_cost:computedTotalCost, deposit_amount:computedDeposit,
      payment_method:paymentMethod, escrow_status:"en_attente", job_status:"demande_recue", operator_name:matchedMachine?.title ?? null,
      field_agent_name:selectedAgent?.name ?? null, field_agent_phone:selectedAgent?.phone ?? null, scheduled_date:scheduledDate,
      machine_name:matchedMachine?.brandModel ?? null, notes:notes || null, farmer_phone:farmerPhone
    }).select("*").single();
    if (error || !row) { console.error("Création chantier:", error); toast.error("Impossible d'enregistrer la demande."); setIsSubmitting(false); return; }
    const newJob: MechanizationJob = {
      id:row.id, serviceType:row.service_type, parcelName:row.parcel_name, areaHa:Number(row.area_ha), totalCost:Number(row.total_cost),
      depositAmount:Number(row.deposit_amount), paymentMethod:row.payment_method, escrowStatus:row.escrow_status, jobStatus:row.job_status,
      operatorName:row.operator_name ?? "En attente d'affectation", operatorPhone:row.operator_phone ?? "",
      fieldAgentName:row.field_agent_name ?? "Non affecté", fieldAgentPhone:row.field_agent_phone ?? "",
      scheduledDate:row.scheduled_date, machineName:row.machine_name ?? "À affecter", notes:row.notes ?? ""
    };

    onJobCreated(newJob);
    setIsSubmitting(false);
    toast.success("Demande de mécanisation enregistrée avec succès !");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Tractor className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Commander un Chantier de Mécanisation
              </DialogTitle>
              <DialogDescription className="text-xs">
                Réseau d'équipements & conducteurs certifiés NAFA - AGRITECH
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Summary pill */}
          <div className="p-3.5 rounded-xl border bg-muted/40 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Service</p>
              <p className="text-sm font-bold text-foreground">{serviceTitle}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Estimé</p>
              <p className="text-sm font-black font-mono text-emerald-600">
                {computedTotalCost.toLocaleString()} FCFA
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Parcel Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Parcelle à travailler *</Label>
              {userParcels.length > 0 ? (
                <Select
                  value={parcelName}
                  onValueChange={(val) => {
                    setParcelName(val);
                    const matched = userParcels.find((p) => p.name === val);
                    if (matched && matched.area_ha) setAreaHa(Number(matched.area_ha));
                  }}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {userParcels.map((p) => (
                      <SelectItem key={p.id} value={p.name} className="text-xs">
                        {p.name} ({p.area_ha || 0} ha)
                      </SelectItem>
                    ))}
                    <SelectItem value="Autre parcelle (saisie)" className="text-xs">
                      Autre parcelle...
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={parcelName}
                  onChange={(e) => setParcelName(e.target.value)}
                  placeholder="Ex: Parcelle Est - Bas-fond"
                  className="text-xs"
                  required
                />
              )}
            </div>

            {/* Area Ha */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Superficie exacte (ha) *</Label>
              <Input
                type="number"
                step="0.1"
                min="0.2"
                max="100"
                value={areaHa}
                onChange={(e) => setAreaHa(Math.max(0.1, parseFloat(e.target.value) || 1))}
                className="text-xs font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Date */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Date souhaitée d'intervention *
              </Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            {/* Farmer contact */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                Téléphone pour confirmation *
              </Label>
              <Input
                type="tel"
                value={farmerPhone}
                onChange={(e) => setFarmerPhone(e.target.value)}
                className="text-xs font-mono"
                required
              />
            </div>
          </div>

          {/* Machine & Operator selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Choix de l'équipement / Opérateur</Label>
            <Select value={operatorPreference} onValueChange={setOperatorPreference}>
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto_fastest" className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  Attribution automatique (Opérateur le plus proche disponible)
                </SelectItem>
                {machines.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="text-xs">
                    {m.title} · {m.location} ({m.pricePerHa.toLocaleString()} F/ha)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Field agent assigned */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center justify-between">
              <span>Agent de terrain NAFA - AGRITECH de votre secteur</span>
              <span className="text-[11px] text-muted-foreground">Supervision & audit sur site</span>
            </Label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldAgents.map((fa) => (
                  <SelectItem key={fa.id} value={fa.id} className="text-xs">
                    {fa.name} — {fa.zone} ({fa.languages.join(", ")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method / Escrow */}
          <div className="space-y-2 pt-1">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <Lock className="h-3.5 w-3.5 text-amber-500" />
              Paiement Sécurisé de l'Acompte (Séquestre 30%) :{" "}
              <span className="text-primary font-bold">{computedDeposit.toLocaleString()} FCFA</span>
            </Label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "orange_money", label: "Orange Money", desc: "*144*4*6#" },
                { id: "moov_money", label: "Moov Money", desc: "*555*6#" },
                { id: "wave", label: "Wave", desc: "QR Code" },
                { id: "cash_agent", label: "Agent Relais", desc: "Espèces sur site" },
              ].map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id as any)}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    paymentMethod === pm.id
                      ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-bold ring-2 ring-emerald-600/20"
                      : "border-border/60 hover:bg-muted/40 text-foreground"
                  }`}
                >
                  <p className="text-xs">{pm.label}</p>
                  <p className="text-[10px] text-muted-foreground">{pm.desc}</p>
                </button>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border text-xs space-y-1">
              <p className="font-semibold flex items-center gap-1.5 text-foreground">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Garantie de non-débit prématuré :
              </p>
              <p className="text-[11px] text-muted-foreground">
                L'acompte reste bloqué sur un compte de cantonnement (séquestre). Le solde de{" "}
                <strong>{(computedTotalCost - computedDeposit).toLocaleString()} FCFA</strong> ne sera débloqué qu'à l'achèvement et validation du labour/récolte.
              </p>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Consignes particulières pour l'opérateur</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Attention aux souches d'arbres au nord-ouest, point d'eau accessible au virage..."
              rows={2}
              className="text-xs resize-none"
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSubmitting ? "Enregistrement..." : "Confirmer la réservation du chantier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
export default MechBookingModal;
