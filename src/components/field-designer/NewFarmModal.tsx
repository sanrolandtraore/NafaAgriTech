/**
 * NAFA FIELD DESIGNER — ASSISTANT NOUVELLE EXPLOITATION
 * Création complète d'exploitation agricole avec coordonnées GPS,
 * découpage administratif burkinabè, spéculations et infrastructures.
 */

import React, { useState } from "react";
import { Farm, FarmType } from "@/types/fieldDesigner";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Navigation, Save, Building2, Check } from "lucide-react";
import { toast } from "sonner";

interface NewFarmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (farm: Farm) => void;
}

const REGIONS_BF = [
  "Boucle du Mouhoun",
  "Cascades",
  "Centre",
  "Centre-Est",
  "Centre-Nord",
  "Centre-Ouest",
  "Centre-Sud",
  "Est",
  "Hauts-Bassins",
  "Nord",
  "Plateau-Central",
  "Sahel",
  "Sud-Ouest",
];

export const NewFarmModal: React.FC<NewFarmModalProps> = ({
  open,
  onOpenChange,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [producerName, setProducerName] = useState("");
  const [producerPhone, setProducerPhone] = useState("+226 ");
  const [locality, setLocality] = useState("");
  const [region, setRegion] = useState("Hauts-Bassins");
  const [province, setProvince] = useState("");
  const [commune, setCommune] = useState("");
  const [villageSector, setVillageSector] = useState("");
  const [farmType, setFarmType] = useState<FarmType>("maraichage");
  const [totalAreaHa, setTotalAreaHa] = useState<number>(2.5);
  const [mainCrops, setMainCrops] = useState("Oignon, Tomate, Maïs");
  const [livestockTypes, setLivestockTypes] = useState("Aviculture locale");
  const [irrigationType, setIrrigationType] = useState("Goutte-à-goutte solaire");
  const [notes, setNotes] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const captureGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Géolocalisation indisponible.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success("Position GPS de l'exploitation captée.");
      },
      () => toast.error("Impossible de capter la position GPS.")
    );
  };

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("Veuillez renseigner le nom de l'exploitation.");
      return;
    }
    if (!producerName.trim()) {
      toast.error("Veuillez renseigner le nom du producteur.");
      return;
    }

    const newFarm: Farm = {
      id: `farm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: name.trim(),
      producerName: producerName.trim(),
      producerPhone: producerPhone.trim(),
      locality: locality.trim() || region,
      region,
      province: province.trim(),
      commune: commune.trim(),
      villageSector: villageSector.trim(),
      gps: coords || undefined,
      farmType,
      totalAreaHa: Math.max(0.1, totalAreaHa),
      mainCrops: mainCrops.split(",").map((c) => c.trim()).filter(Boolean),
      livestockTypes: livestockTypes.split(",").map((l) => l.trim()).filter(Boolean),
      irrigationType,
      notes,
      photos: [],
      syncStatus: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newFarm);
    onOpenChange(false);
    toast.success(`Exploitation « ${newFarm.name} » créée avec succès !`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-black flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Nouvelle Exploitation Agricole
          </DialogTitle>
          <DialogDescription className="text-xs">
            Renseignez les données administratives et techniques de la ferme (disponible sans connexion).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Nom & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold">Nom de l'exploitation *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Ferme Agro-Écologique de Bama"
                className="h-10 rounded-xl text-xs mt-1 font-semibold"
              />
            </div>
            <div>
              <Label className="text-xs font-bold">Type d'exploitation</Label>
              <Select value={farmType} onValueChange={(v: FarmType) => setFarmType(v)}>
                <SelectTrigger className="h-10 rounded-xl text-xs font-semibold mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maraichage">Maraîchage</SelectItem>
                  <SelectItem value="agriculture">Agriculture vivrière / Céréales</SelectItem>
                  <SelectItem value="arboriculture">Arboriculture / Verger</SelectItem>
                  <SelectItem value="elevage">Élevage (Avicole / Bovin / Ovin)</SelectItem>
                  <SelectItem value="pisciculture">Pisciculture</SelectItem>
                  <SelectItem value="agri_elevage">Agriculture + Élevage</SelectItem>
                  <SelectItem value="ferme_integree">Ferme agro-pastorale intégrée</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Producteur & Téléphone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold">Nom du Producteur / Promoteur *</Label>
              <Input
                value={producerName}
                onChange={(e) => setProducerName(e.target.value)}
                placeholder="Ex: Amadou Traoré"
                className="h-10 rounded-xl text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-bold">Téléphone</Label>
              <Input
                value={producerPhone}
                onChange={(e) => setProducerPhone(e.target.value)}
                placeholder="+226 XX XX XX XX"
                className="h-10 rounded-xl text-xs mt-1 font-mono"
              />
            </div>
          </div>

          {/* Localisation Administrative */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs font-bold">Région</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger className="h-10 rounded-xl text-xs font-semibold mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS_BF.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-bold">Province</Label>
              <Input
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="Ex: Houet"
                className="h-10 rounded-xl text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-bold">Commune / Village</Label>
              <Input
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="Ex: Bama"
                className="h-10 rounded-xl text-xs mt-1"
              />
            </div>
          </div>

          {/* GPS in-situ & Superficie globale */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/40 rounded-2xl border">
            <div>
              <Label className="text-xs font-bold">Superficie totale estimée (ha)</Label>
              <Input
                type="number"
                step="0.1"
                value={totalAreaHa}
                onChange={(e) => setTotalAreaHa(parseFloat(e.target.value) || 0.1)}
                className="h-10 rounded-xl text-xs font-mono font-bold mt-1"
              />
            </div>
            <div className="flex flex-col justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={captureGPS}
                className="h-10 rounded-xl text-xs font-bold gap-2 border-primary/40 text-primary"
              >
                <Navigation className="h-4 w-4" />
                {coords
                  ? `GPS : ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
                  : "Capter le point GPS d'entrée"}
              </Button>
            </div>
          </div>

          {/* Spéculations & Équipements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold">Cultures principales</Label>
              <Input
                value={mainCrops}
                onChange={(e) => setMainCrops(e.target.value)}
                placeholder="Ex: Oignon, Tomate, Maïs"
                className="h-10 rounded-xl text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-bold">Système d'irrigation</Label>
              <Input
                value={irrigationType}
                onChange={(e) => setIrrigationType(e.target.value)}
                placeholder="Ex: Forage + Solaire + Goutte-à-goutte"
                className="h-10 rounded-xl text-xs mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold">Observations ou antécédents</Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Sol sablo-limoneux, présence d'un ancien forage à réhabiliter..."
              className="rounded-xl text-xs mt-1"
            />
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl text-xs">
            Annuler
          </Button>
          <Button onClick={handleCreate} className="rounded-xl text-xs font-bold gradient-primary text-primary-foreground gap-1.5 px-5">
            <Save className="h-4 w-4" /> Créer l'exploitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
