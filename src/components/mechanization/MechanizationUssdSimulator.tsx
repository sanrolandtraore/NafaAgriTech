import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Smartphone,
  Phone,
  MessageSquare,
  Globe,
  Users,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  WifiOff,
  Radio,
  MapPin,
} from "lucide-react";
import { listFieldAgents, listMechanizationServices } from "./repository";
import type { FieldAgent, MechanizationService } from "./types";

export const MechUssdSimulator = () => {
  const [ussdStep, setUssdStep] = useState<number>(0);
  const [inputVal, setInputVal] = useState<string>("");
  const [selectedLang, setSelectedLang] = useState<string>("fr");
  const [selectedService, setSelectedService] = useState<string>("");
  const [surface, setSurface] = useState<string>("");
  const [commune, setCommune] = useState<string>("");
  const [smsNotification, setSmsNotification] = useState<string | null>(null);
  const [services, setServices] = useState<MechanizationService[]>([]);
  const [fieldAgents, setFieldAgents] = useState<FieldAgent[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listMechanizationServices(), listFieldAgents()])
      .then(([liveServices, liveAgents]) => {
        if (cancelled) return;
        setServices(liveServices);
        setFieldAgents(liveAgents);
        setCatalogError(null);
      })
      .catch((error) => {
        console.error("Chargement USSD:", error);
        if (!cancelled) setCatalogError("Impossible de charger le catalogue réel.");
      });
    return () => { cancelled = true; };
  }, []);

  const handleDial = () => {
    setUssdStep(1);
    setInputVal("");
    setSmsNotification(null);
  };

  const handleSend = () => {
    const val = inputVal.trim();
    if (!val && ussdStep !== 0) return;

    if (ussdStep === 1) {
      // Choix de la langue
      if (val === "1") setSelectedLang("fr");
      else if (val === "2") setSelectedLang("moore");
      else if (val === "3") setSelectedLang("dioula");
      else setSelectedLang("fr");
      setUssdStep(2);
      setInputVal("");
    } else if (ussdStep === 2) {
      // Choix du service
      const service = services[Number(val) - 1];
      if (!service) { toast.error("Prestation indisponible dans le catalogue."); return; }
      setSelectedService(service.name);
      setUssdStep(3);
      setInputVal("");
    } else if (ussdStep === 3) {
      // Surface en ha
      if (!val || Number(val) <= 0) { toast.error("Indiquez une superficie valide."); return; }
      setSurface(val);
      setUssdStep(4);
      setInputVal("");
    } else if (ussdStep === 4) {
      // Commune
      if (!val) { toast.error("Indiquez votre commune ou village."); return; }
      setCommune(val);
      setUssdStep(5);
      setInputVal("");

      const agent = fieldAgents[0];
      setSmsNotification(
        `[Aperçu USSD] Parcours préparé : ${selectedService} — ${surface} ha — ${val}.` +
        (agent ? ` Agent disponible : ${agent.name}${agent.phone ? ` (${agent.phone})` : ""}.` : " Aucun agent terrain disponible dans le catalogue.")
      );
      toast.success("Parcours USSD simulé. Aucune notification SMS réelle n’a été envoyée.");
    }
  };

  const handleReset = () => {
    setUssdStep(0);
    setInputVal("");
    setSmsNotification(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* USSD Phone Simulator Card */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <Card className="w-full max-w-[340px] border-4 border-muted-foreground/30 shadow-2xl rounded-[2.5rem] bg-gradient-to-b from-stone-900 via-stone-800 to-stone-950 p-4 text-white relative">
            {/* Phone speaker notch */}
            <div className="w-16 h-1.5 bg-stone-700 rounded-full mx-auto mb-3" />

            {/* Screen bezel */}
            <div className="bg-emerald-950/80 border-2 border-emerald-500/40 rounded-2xl p-4 font-mono text-emerald-300 min-h-[220px] flex flex-col justify-between shadow-inner relative overflow-hidden">
              <div className="flex items-center justify-between text-[10px] text-emerald-400/80 border-b border-emerald-500/20 pb-1 mb-2">
                <span className="flex items-center gap-1">
                  <Radio className="h-2.5 w-2.5 animate-pulse" />
                  SIMULATION USSD · HORS RÉSEAU
                </span>
                <span>SIMULATION USSD</span>
              </div>

              {ussdStep === 0 && (
                <div className="text-center py-6 space-y-3">
                  <Smartphone className="h-10 w-10 mx-auto text-emerald-400 opacity-80" />
                  <p className="text-xs font-bold text-emerald-200">NAFA - AGRITECH Offline Engine</p>
                  <p className="text-[10px] text-emerald-400/90 leading-relaxed">
                    Simulation de parcours USSD. Aucun appel réseau USSD réel n’est déclenché depuis cette interface.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleDial()}
                    className="h-8 text-xs bg-emerald-500 text-emerald-950 font-bold hover:bg-emerald-400 rounded-xl"
                  >
                    Lancer la simulation USSD
                  </Button>
                </div>
              )}

              {ussdStep === 1 && (
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-white mb-1.5">=== NAFA - AGRITECH FASO ===</p>
                  <p>1. Français</p>
                  <p>2. Mooré (Gom-biis)</p>
                  <p>3. Dioula (Kuma)</p>
                  <p className="text-[10px] text-emerald-400 mt-2">Répondre avec le numéro :</p>
                </div>
              )}

              {ussdStep === 2 && (
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-white mb-1">Choisir prestation :</p>
                  {services.length === 0 ? <p>Aucune prestation disponible.</p> : services.slice(0, 4).map((service, index) => <p key={service.id}>{index + 1}. {service.name}</p>)}
                  <p className="text-[10px] text-emerald-400 mt-1">Saisir option (1-4) :</p>
                </div>
              )}

              {ussdStep === 3 && (
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-white mb-1">Superficie :</p>
                  <p className="text-[11px]">Indiquez la surface de votre champ en hectares :</p>
                  <p className="text-[10px] text-emerald-400 mt-2">Ex: 2 ou 3.5</p>
                </div>
              )}

              {ussdStep === 4 && (
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-white mb-1">Localisation :</p>
                  <p className="text-[11px]">Nom de votre commune / village :</p>
                  <p className="text-[10px] text-emerald-400 mt-2">Ex: Koupéla, Bama, Dédougou...</p>
                </div>
              )}

              {ussdStep === 5 && (
                <div className="space-y-1.5 text-xs">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> PARCOURS PRÉPARÉ
                  </p>
                  <p className="text-[11px]">
                    Opération : <span className="text-amber-300">{selectedService.split(" ")[0]}</span>
                  </p>
                  <p className="text-[11px]">
                    Surface : <span className="text-amber-300">{surface} ha</span> à {commune}
                  </p>
                  <p className="text-[10px] text-emerald-300 mt-1">
                    Aucune demande réseau, aucun appel et aucun SMS réel ne sont déclenchés par ce simulateur.
                  </p>
                </div>
              )}

              {/* USSD Input Bar */}
              {ussdStep > 0 && ussdStep < 5 && (
                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-emerald-500/20">
                  <input
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Taper ici..."
                    className="w-full bg-emerald-900/60 text-white text-xs px-2 py-1 rounded border border-emerald-500/30 font-mono outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    className="px-2 py-1 bg-emerald-500 text-emerald-950 font-bold text-xs rounded hover:bg-emerald-400"
                  >
                    OK
                  </button>
                </div>
              )}
            </div>

            {/* Keypad simulation */}
            <div className="grid grid-cols-3 gap-2 mt-4 px-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    if (ussdStep > 0 && ussdStep < 5) {
                      setInputVal((prev) => prev + k);
                    } else if (ussdStep === 0 && k === "*") {
                      handleDial();
                    }
                  }}
                  className="h-10 rounded-xl bg-stone-800 hover:bg-stone-700 active:bg-stone-600 text-stone-200 font-bold text-sm shadow flex items-center justify-center transition-colors border border-stone-700"
                >
                  {k}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center mt-3 pt-2 border-t border-stone-800">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-[11px] text-stone-400 hover:text-white gap-1 h-7"
              >
                <RotateCcw className="h-3 w-3" />
                Raccrocher / Réinitialiser
              </Button>
              <span className="text-[10px] text-stone-500">Passerelle USSD NAFA - AGRITECH</span>
            </div>
          </Card>

          {/* SMS received preview */}
          {smsNotification && (
            <div className="mt-3 w-full max-w-[340px] p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs animate-fade-in">
              <p className="font-semibold flex items-center gap-1.5 text-primary">
                <MessageSquare className="h-3.5 w-3.5" />
                Aperçu de notification :
              </p>
              <p className="mt-1 text-muted-foreground text-[11px] leading-relaxed">
                {smsNotification}
              </p>
            </div>
          )}
        </div>

        {/* Right column: Explanations and Field Agent Network */}
        <div className="lg:col-span-7 space-y-5">
          <Card className="border-border/60 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Le Réseau d'Agents de Terrain NAFA - AGRITECH
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Des professionnels formés, basés dans chaque commune rurale pour accompagner les agriculteurs, cartographier les parcelles et superviser les chantiers de mécanisation.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fieldAgents.length === 0 ? (
                  <div className="col-span-full p-4 rounded-xl border border-dashed text-xs text-muted-foreground">
                    {catalogError ?? "Aucun agent terrain actif n’est actuellement enregistré."}
                  </div>
                ) : fieldAgents.map((fa) => (
                  <div
                    key={fa.id}
                    className="p-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-foreground">{fa.name}</p>
                        <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                          Agréé
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-primary shrink-0" />
                        {fa.zone}
                      </p>
                      <div className="flex items-center gap-1 flex-wrap mt-1.5">
                        {fa.languages.map((l) => (
                          <span key={l} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground font-medium">
                            {l}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t flex items-center justify-between text-xs">
                      <span className="text-[10px] text-muted-foreground">
                        {fa.activeVillages} villages · {fa.assignedOperators} tracteurs
                      </span>
                      <a
                        href={`tel:${fa.phone}`}
                        className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold"
                      >
                        <Phone className="h-3 w-3" /> {fa.phone}
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Value prop pillars */}
              <div className="p-4 rounded-xl bg-muted/40 border space-y-2.5">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Comment fonctionne le modèle NAFA - AGRITECH en zone rurale ?
                </p>
                <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                  <li>
                    <strong className="text-foreground">Inclusion Totale :</strong> ce composant simule le parcours utilisateur ; le raccordement à un opérateur USSD réel devra être ajouté séparément.
                  </li>
                  <li>
                    <strong className="text-foreground">Paiement à intégrer :</strong> aucun séquestre Mobile Money réel n'est exécuté par ce composant.
                  </li>
                  <li>
                    <strong className="text-foreground">Contrôle qualité à intégrer :</strong> les workflows de certification, géotagging et preuve photo devront être raccordés à de vraies données et actions.
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default MechUssdSimulator;
