import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Tractor,
  Zap,
  Wheat,
  Truck,
  Layers,
  Fuel,
  Clock,
  ShieldCheck,
  Calculator,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Info,
} from "lucide-react";
import { listMechanizationServices } from "./repository";
import { MechanizationService } from "./types";

interface MechEstimatorCardProps {
  onBookNow: (estimate: {
    service: MechanizationService;
    areaHa: number;
    totalCost: number;
    depositAmount: number;
    soilType: string;
    fuelLiters: number;
    durationHours: number;
  }) => void;
  userParcels?: Array<{ id: string; name: string; area_ha: number }>;
}

export const MechEstimatorCard = ({ onBookNow, userParcels = [] }: MechEstimatorCardProps) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [services, setServices] = useState<MechanizationService[]>([]);
  useEffect(() => { listMechanizationServices().then((data) => { setServices(data); if (data[0]) setSelectedServiceId(data[0].id); }).catch((error) => console.warn("Services mécanisation:", error)); }, []);
  const [areaHa, setAreaHa] = useState<number>(3.5);
  const [soilType, setSoilType] = useState<string>("limoneux");
  const [selectedParcelId, setSelectedParcelId] = useState<string>("");

  const service = services.find((s) => s.id === selectedServiceId) ?? null;

  // Multiplier depending on soil difficulty
  const soilMultipliers: Record<string, { cost: number; fuel: number; time: number; label: string }> = {
    sableux: { cost: 0.95, fuel: 0.9, time: 0.9, label: "Sableux (léger, facile)" },
    limoneux: { cost: 1.0, fuel: 1.0, time: 1.0, label: "Limoneux / Alluvionnaire (standard)" },
    argileux: { cost: 1.15, fuel: 1.2, time: 1.25, label: "Argileux lourd / Bas-fond (dur)" },
    cuirasse: { cost: 1.3, fuel: 1.35, time: 1.4, label: "Gravillonnaire / Sol durci" },
  };

  const soilFactor = soilMultipliers[soilType] || soilMultipliers.limoneux;

  const totalCost = Math.round((service?.baseRatePerHa ?? 0) * areaHa * soilFactor.cost);
  const depositAmount = Math.round(totalCost * 0.3); // 30% acompte séquestre
  const fuelLiters = Math.round((service?.fuelPerHaLiters ?? 0) * areaHa * soilFactor.fuel);
  const durationHours = Number(((service?.hoursPerHa ?? 0) * areaHa * soilFactor.time).toFixed(1));

  const handleParcelSelect = (parcelId: string) => {
    setSelectedParcelId(parcelId);
    const p = userParcels.find((item) => item.id === parcelId);
    if (p && p.area_ha) {
      setAreaHa(Number(p.area_ha));
    }
  };

  const quickAreaButtons = [1, 2.5, 5, 10, 20];

  return (
    <Card className="border-stone-200 dark:border-stone-800 shadow-xl overflow-hidden rounded-2xl bg-card">
      <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-amber-950 p-4 sm:p-5 text-white border-b border-stone-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-400 text-stone-950 shadow-md">
              <Calculator className="h-5 w-5 font-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg tracking-tight">Simulateur & Calculateur de Travaux Agricoles</h3>
                <Badge className="bg-amber-400 text-stone-950 hover:bg-amber-400 font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded">
                  MECH-CALC
                </Badge>
              </div>
              <p className="text-xs text-stone-300">
                Tarifs transparents plafonnés : carburant, débit de chantier et séquestre garantis
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-amber-400 uppercase tracking-wider font-bold">Standard NAFA - AGRITECH</span>
            <p className="text-xs font-medium text-stone-300">Paiement Mobile Money échelonné (30% / 70%)</p>
          </div>
        </div>
      </div>

      <CardContent className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls column */}
          <div className="lg:col-span-7 space-y-5">
            {/* Service selector */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Type d'opération mécanisée</span>
                <span className="text-[11px] text-muted-foreground">{services.length} service{services.length > 1 ? "s" : ""} disponible{services.length > 1 ? "s" : ""}</span>
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {services.map((s) => {
                  const isSelected = s.id === selectedServiceId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedServiceId(s.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[76px] ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-600/30 font-medium"
                          : "border-border/60 hover:border-border hover:bg-muted/30 text-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-bold truncate">{s.name.split(" ")[0]}</span>
                        {s.category === "pulverisation" ? (
                          <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        ) : s.category === "transport" ? (
                          <Truck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        ) : (
                          <Tractor className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-tight line-clamp-2">
                        {s.name}
                      </p>
                      <p className="text-[11px] font-mono font-bold text-primary mt-1">
                        {s.baseRatePerHa.toLocaleString()} F/ha
                      </p>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-xl border border-border/40 flex items-start gap-1.5">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span><strong className="text-foreground">{service?.name ?? "Aucun service"} :</strong> {service?.description ?? "Sélectionnez un service disponible."}</span>
              </p>
            </div>

            {/* Parcel shortcut (if user has parcels) */}
            {userParcels.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Parcelle ciblée (optionnel)</Label>
                <Select value={selectedParcelId} onValueChange={handleParcelSelect}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Choisir une de mes parcelles enregistrées..." />
                  </SelectTrigger>
                  <SelectContent>
                    {userParcels.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">
                        {p.name} ({p.area_ha || 0} ha)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Area Slider & Quick Buttons */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  Surface à travailler : <span className="text-primary text-sm font-bold">{areaHa} hectares</span>
                </Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="150"
                    value={areaHa}
                    onChange={(e) => setAreaHa(Math.max(0.2, parseFloat(e.target.value) || 0))}
                    className="w-20 h-7 text-xs font-mono text-right"
                  />
                  <span className="text-xs text-muted-foreground">ha</span>
                </div>
              </div>

              <Slider
                value={[areaHa]}
                onValueChange={(val) => setAreaHa(val[0])}
                min={0.5}
                max={30}
                step={0.5}
                className="py-1"
              />

              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-muted-foreground mr-1">Raccourcis :</span>
                {quickAreaButtons.map((btnVal) => (
                  <Button
                    key={btnVal}
                    type="button"
                    variant={areaHa === btnVal ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAreaHa(btnVal)}
                    className="h-6 text-[11px] px-2 rounded-lg"
                  >
                    {btnVal} ha
                  </Button>
                ))}
              </div>
            </div>

            {/* Soil type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Type de sol & Pénétrométrie</Label>
              <Select value={soilType} onValueChange={setSoilType}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(soilMultipliers).map(([key, val]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      {val.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quotation & summary column */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-gradient-to-br from-muted/50 to-muted/20 p-4 sm:p-5 rounded-2xl border border-border/70 space-y-4">
            <div>
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                  Devis Estimatif NAFA - AGRITECH
                </span>
                <Badge variant="outline" className="text-[10px] bg-background">
                  <ShieldCheck className="h-3 w-3 mr-1 text-emerald-600" />
                  Prix Plafonné
                </Badge>
              </div>

              <div className="space-y-3 mt-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Opération sélectionnée</span>
                  <span className="text-xs font-medium text-right max-w-[180px] truncate">{service?.name ?? "Aucun service"} </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Surface déclarée</span>
                  <span className="text-xs font-bold">{areaHa} ha</span>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Tarif unitaire de base</span>
                  <span className="text-xs font-mono">{service ? `${service.baseRatePerHa.toLocaleString()} F / ha` : "—"}</span>
                </div>

                {soilFactor.cost !== 1 && (
                  <div className="flex items-baseline justify-between text-[11px] text-amber-600 dark:text-amber-400">
                    <span>Ajustement type de sol</span>
                    <span>{soilFactor.cost > 1 ? `+${Math.round((soilFactor.cost - 1) * 100)}%` : `-${Math.round((1 - soilFactor.cost) * 100)}%`}</span>
                  </div>
                )}

                <div className="pt-3 border-t space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-bold text-foreground">Coût Total Estimé</span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {totalCost.toLocaleString()} <span className="text-xs font-bold text-foreground">FCFA</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Acompte de réservation (30%)</span>
                    <span className="font-semibold text-foreground font-mono">{depositAmount.toLocaleString()} FCFA</span>
                  </div>
                </div>

                {/* Technical details metrics */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="p-2.5 rounded-xl bg-background border flex items-center gap-2">
                    <Fuel className="h-4 w-4 text-amber-500 shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Gasoil estimé</p>
                      <p className="text-xs font-bold font-mono">
                        {service ? (service.fuelPerHaLiters === 0 ? "0 L (Électrique)" : `~ ${fuelLiters} Litres`) : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-background border flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500 shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Durée estimée</p>
                      <p className="text-xs font-bold font-mono">~ {durationHours} Heures</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-stone-800 dark:text-stone-200 flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <span>
                    <strong>Protocole Séquestre NAFA - AGRITECH :</strong> L'acompte de 30% reste consigné sur le compte séquestre sécurisé. Le prestataire n'est rémunéré qu'après attestation de conformité des travaux sur le terrain.
                  </span>
                </div>
              </div>
            </div>

            <Button
              type="button"
              size="lg"
              disabled={!service || services.length === 0}
              onClick={() => service && onBookNow({
                  service,
                  areaHa,
                  totalCost,
                  depositAmount,
                  soilType,
                  fuelLiters,
                  durationHours,
                })
              }
              className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-sm shadow-lg gap-2 rounded-xl h-12"
            >
              <Zap className="h-4 w-4 fill-stone-950" />
              Réserver cette opération maintenant
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
export default MechEstimatorCard;
