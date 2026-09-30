import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Scale,
  Wheat,
  Bird,
  Egg,
  ShieldCheck,
  Sparkles,
  Beef,
  Droplets,
  Sun,
} from "lucide-react";
import {
  calculateFatteningPlan,
  calculateLayerProduction,
  calculateBroilerBatch,
  calculateSahelianWaterNeeds,
} from "@/lib/livestockEngine";

const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR");

export const LivestockZootechnicCard = () => {
  // Embouche state
  const [emboucheSpecies, setEmboucheSpecies] = useState<"bovin" | "ovin">("bovin");
  const [headCount, setHeadCount] = useState<number>(10);
  const [durationDays, setDurationDays] = useState<number>(90);
  const [initialWeight, setInitialWeight] = useState<number>(240);
  const [targetGmq, setTargetGmq] = useState<number>(800);
  const [purchasePrice, setPurchasePrice] = useState<number>(220000);
  const [dailyFeedCost, setDailyFeedCost] = useState<number>(800);
  const [sellingPricePerKgLive, setSellingPricePerKgLive] = useState<number>(1500);

  // Pondeuses state
  const [henCount, setHenCount] = useState<number>(500);
  const [layingRate, setLayingRate] = useState<number>(80);
  const [eggTrayPrice, setEggTrayPrice] = useState<number>(2200);
  const [feedKgPrice, setFeedKgPrice] = useState<number>(350);

  // Poulets de chair state
  const [broilerBatchSize, setBroilerBatchSize] = useState<number>(500);
  const [broilerMortality, setBroilerMortality] = useState<number>(4);
  const [broilerChickPrice, setBroilerChickPrice] = useState<number>(500);
  const [broilerFeedKgPrice, setBroilerFeedKgPrice] = useState<number>(400);
  const [broilerSalePrice, setBroilerSalePrice] = useState<number>(2500);

  // Eau & Climat Sahélien state
  const [waterSpecies, setWaterSpecies] = useState<string>("bovin");
  const [waterHeadCount, setWaterHeadCount] = useState<number>(20);
  const [isHotDrySeason, setIsHotDrySeason] = useState<boolean>(false);

  // Calculations
  const fatteningResult = useMemo(() => {
    return calculateFatteningPlan({
      species: emboucheSpecies,
      headCount,
      durationDays,
      initialWeightKg: initialWeight,
      targetGmqGrams: targetGmq,
      purchasePricePerHead: purchasePrice,
      dailyFeedCostPerHead: dailyFeedCost,
      sellingPricePerKgLive,
    });
  }, [emboucheSpecies, headCount, durationDays, initialWeight, targetGmq, purchasePrice, dailyFeedCost, sellingPricePerKgLive]);

  const layerResult = useMemo(() => {
    return calculateLayerProduction({
      henCount,
      layingRatePercent: layingRate,
      eggTrayPriceFcfa: eggTrayPrice,
      feedKgPriceFcfa: feedKgPrice,
    });
  }, [henCount, layingRate, eggTrayPrice, feedKgPrice]);

  const broilerResult = useMemo(() => {
    return calculateBroilerBatch({
      batchSize: broilerBatchSize,
      mortalityRatePercent: broilerMortality,
      chickUnitPriceFcfa: broilerChickPrice,
      feedKgAvgPriceFcfa: broilerFeedKgPrice,
      sellingPricePerChickenFcfa: broilerSalePrice,
    });
  }, [broilerBatchSize, broilerMortality, broilerChickPrice, broilerFeedKgPrice, broilerSalePrice]);

  const waterResult = useMemo(() => {
    return calculateSahelianWaterNeeds({
      species: waterSpecies,
      headCount: waterHeadCount,
      isHotDrySeason,
    });
  }, [waterSpecies, waterHeadCount, isHotDrySeason]);

  return (
    <Card className="border-amber-500/20 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5 text-amber-600" />
              Simulateur & Calculateur Zootechnique
            </CardTitle>
            <CardDescription>
              Projections de croissance (GMQ), rations alimentaires, ponte et rentabilité financière.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="w-fit text-xs bg-amber-500/10 text-amber-700">
            <Sparkles className="h-3 w-3 mr-1" />
            Moteur d'Élevage
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="embouche">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="embouche" className="flex items-center gap-1.5 text-xs">
              <Beef className="h-3.5 w-3.5" /> Embouche
            </TabsTrigger>
            <TabsTrigger value="pondeuses" className="flex items-center gap-1.5 text-xs">
              <Egg className="h-3.5 w-3.5" /> Pondeuses
            </TabsTrigger>
            <TabsTrigger value="poulets" className="flex items-center gap-1.5 text-xs">
              <Bird className="h-3.5 w-3.5" /> Poulets
            </TabsTrigger>
            <TabsTrigger value="eau" className="flex items-center gap-1.5 text-xs">
              <Droplets className="h-3.5 w-3.5 text-sky-500" /> Eau & Climat
            </TabsTrigger>
          </TabsList>

          {/* ONGLET EMBOUCHE */}
          <TabsContent value="embouche" className="space-y-4 pt-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Espèce</Label>
                <Select
                  value={emboucheSpecies}
                  onValueChange={(v: "bovin" | "ovin") => {
                    setEmboucheSpecies(v);
                    if (v === "bovin") {
                      setInitialWeight(240);
                      setTargetGmq(800);
                      setPurchasePrice(220000);
                      setDailyFeedCost(800);
                      setSellingPricePerKgLive(1500);
                    } else {
                      setInitialWeight(25);
                      setTargetGmq(150);
                      setPurchasePrice(35000);
                      setDailyFeedCost(250);
                      setSellingPricePerKgLive(2000);
                    }
                  }}
                >
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bovin">Bovin (Zébu / Métis)</SelectItem>
                    <SelectItem value="ovin">Ovin (Mouton du Sahel / Bali-Bali)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Nombre de têtes</Label>
                <Input type="number" min="1" value={headCount} onChange={e => setHeadCount(Math.max(1, Number(e.target.value)))} className="h-8 text-xs" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Durée (jours)</Label>
                <Input type="number" min="30" max="180" value={durationDays} onChange={e => setDurationDays(Number(e.target.value))} className="h-8 text-xs" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">GMQ visé (g/jour)</Label>
                <Input type="number" step="50" min="50" value={targetGmq} onChange={e => setTargetGmq(Number(e.target.value))} className="h-8 text-xs" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Poids initial (kg)</Label>
                <Input type="number" min="10" value={initialWeight} onChange={e => setInitialWeight(Number(e.target.value))} className="h-8 text-xs" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Prix achat unitaire (FCFA)</Label>
                <Input type="number" step="5000" value={purchasePrice} onChange={e => setPurchasePrice(Number(e.target.value))} className="h-8 text-xs" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Ration/jour/tête (FCFA)</Label>
                <Input type="number" step="50" value={dailyFeedCost} onChange={e => setDailyFeedCost(Number(e.target.value))} className="h-8 text-xs" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Prix vente (FCFA/kg vif)</Label>
                <Input type="number" step="50" value={sellingPricePerKgLive} onChange={e => setSellingPricePerKgLive(Number(e.target.value))} className="h-8 text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted/40 rounded-lg text-center">
              <div>
                <p className="text-xs text-muted-foreground">Poids final projeté</p>
                <p className="text-lg font-bold text-primary">{fatteningResult.finalWeightKg} kg <span className="text-xs text-muted-foreground font-normal">(+{fatteningResult.weightGainPerHeadKg} kg)</span></p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Budget total investi</p>
                <p className="text-lg font-bold text-destructive">{fmt(fatteningResult.totalInvestment)} FCFA</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Chiffre d'affaires estimé</p>
                <p className="text-lg font-bold text-primary">{fmt(fatteningResult.totalRevenue)} FCFA</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Marge nette prévisionnelle</p>
                <p className={`text-lg font-bold ${fatteningResult.netMargin >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                  {fatteningResult.netMargin >= 0 ? "+" : ""}{fmt(fatteningResult.netMargin)} FCFA
                </p>
                <p className="text-[10px] text-muted-foreground">ROI: {fatteningResult.roiPercent}% ({fmt(fatteningResult.marginPerHead)} F/tête)</p>
              </div>
            </div>
          </TabsContent>

          {/* ONGLET PONDEUSES */}
          <TabsContent value="pondeuses" className="space-y-4 pt-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nombre de poules</Label>
                <Input type="number" min="50" value={henCount} onChange={e => setHenCount(Math.max(1, Number(e.target.value)))} className="h-8 text-xs" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Taux de ponte (%)</Label>
                <Input type="number" min="40" max="95" value={layingRate} onChange={e => setLayingRate(Number(e.target.value))} className="h-8 text-xs" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Prix alvéole (30 œufs)</Label>
                <Input type="number" step="50" value={eggTrayPrice} onChange={e => setEggTrayPrice(Number(e.target.value))} className="h-8 text-xs" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Prix aliment (FCFA/kg)</Label>
                <Input type="number" step="10" value={feedKgPrice} onChange={e => setFeedKgPrice(Number(e.target.value))} className="h-8 text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted/40 rounded-lg text-center">
              <div>
                <p className="text-xs text-muted-foreground">Production journalière</p>
                <p className="text-lg font-bold text-amber-600">{layerResult.dailyEggs} œufs <span className="text-xs text-muted-foreground font-normal">({layerResult.dailyTrays} plateaux/j)</span></p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Aliment mensuel</p>
                <p className="text-lg font-bold">{fmt(layerResult.monthlyFeedKg)} kg <span className="text-xs text-muted-foreground font-normal">({Math.ceil(layerResult.monthlyFeedKg / 50)} sacs)</span></p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Revenu mensuel œufs</p>
                <p className="text-lg font-bold text-primary">{fmt(layerResult.monthlyRevenueFcfa)} FCFA</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Bénéfice net mensuel</p>
                <p className={`text-lg font-bold ${layerResult.monthlyNetProfitFcfa >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                  {layerResult.monthlyNetProfitFcfa >= 0 ? "+" : ""}{fmt(layerResult.monthlyNetProfitFcfa)} FCFA
                </p>
                <p className="text-[10px] text-muted-foreground">({fmt(layerResult.profitPerHenMonthlyFcfa)} FCFA/poule/mois)</p>
              </div>
            </div>
          </TabsContent>

          {/* ONGLET POULETS DE CHAIR */}
          <TabsContent value="poulets" className="space-y-4 pt-3">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Taille de la bande</Label>
                <Input type="number" min="50" value={broilerBatchSize} onChange={e => setBroilerBatchSize(Math.max(1, Number(e.target.value)))} className="h-8 text-xs" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Mortalité (%)</Label>
                <Input type="number" min="0" max="20" value={broilerMortality} onChange={e => setBroilerMortality(Number(e.target.value))} className="h-8 text-xs" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Prix poussin (FCFA)</Label>
                <Input type="number" step="25" value={broilerChickPrice} onChange={e => setBroilerChickPrice(Number(e.target.value))} className="h-8 text-xs" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Aliment moyen (FCFA/kg)</Label>
                <Input type="number" step="10" value={broilerFeedKgPrice} onChange={e => setBroilerFeedKgPrice(Number(e.target.value))} className="h-8 text-xs" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Prix vente poulet (FCFA)</Label>
                <Input type="number" step="100" value={broilerSalePrice} onChange={e => setBroilerSalePrice(Number(e.target.value))} className="h-8 text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted/40 rounded-lg text-center">
              <div>
                <p className="text-xs text-muted-foreground">Sujets commercialisables</p>
                <p className="text-lg font-bold text-amber-600">{broilerResult.survivingChickens} poulets <span className="text-xs text-muted-foreground font-normal">({fmt(broilerResult.totalLiveWeightKg)} kg)</span></p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Aliment nécessaire</p>
                <p className="text-lg font-bold">{fmt(broilerResult.totalFeedKg)} kg <span className="text-xs text-muted-foreground font-normal">({broilerResult.totalFeedBags50kg} sacs)</span></p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dépense totale bande</p>
                <p className="text-lg font-bold text-destructive">{fmt(broilerResult.totalCostFcfa)} FCFA</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Marge nette totale</p>
                <p className={`text-lg font-bold ${broilerResult.netMarginFcfa >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                  {broilerResult.netMarginFcfa >= 0 ? "+" : ""}{fmt(broilerResult.netMarginFcfa)} FCFA
                </p>
                <p className="text-[10px] text-muted-foreground">ROI: {broilerResult.roiPercent}% ({fmt(broilerResult.marginPerChickenFcfa)} F/poulet)</p>
              </div>
            </div>
          </TabsContent>

          {/* ONGLET EAU & CLIMAT SAHÉLIEN */}
          <TabsContent value="eau" className="space-y-4 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="space-y-1">
                <Label className="text-xs">Espèce concernée</Label>
                <Select value={waterSpecies} onValueChange={(v) => setWaterSpecies(v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bovin">Bovin (Zébu / Métis)</SelectItem>
                    <SelectItem value="ovin">Ovin (Mouton du Sahel)</SelectItem>
                    <SelectItem value="caprin">Caprin (Chèvre)</SelectItem>
                    <SelectItem value="porcin">Porcin (Porc charcutier)</SelectItem>
                    <SelectItem value="volaille">Volaille (Poule / Pintade)</SelectItem>
                    <SelectItem value="pisciculture">Pisciculture (Bassin)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Effectif du cheptel (têtes)</Label>
                <Input
                  type="number"
                  min="1"
                  value={waterHeadCount}
                  onChange={(e) => setWaterHeadCount(Math.max(1, Number(e.target.value)))}
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg border bg-amber-500/5 border-amber-500/20 h-8">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <Sun className="h-3.5 w-3.5 text-amber-600" />
                  <span>Saison chaude (&gt;38°C)</span>
                </div>
                <Switch
                  checked={isHotDrySeason}
                  onCheckedChange={setIsHotDrySeason}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted/40 rounded-lg text-center">
              <div>
                <p className="text-xs text-muted-foreground">Besoin par tête</p>
                <p className="text-lg font-bold text-sky-600">{waterResult.dailyPerHeadLiters} L / jour</p>
                <p className="text-[10px] text-muted-foreground">{isHotDrySeason ? "+50% (Pic de chaleur)" : "Régime standard"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Besoin troupeau / jour</p>
                <p className="text-lg font-bold">{fmt(waterResult.dailyTotalLiters)} L / jour</p>
                <p className="text-[10px] text-muted-foreground">({Math.ceil(waterResult.dailyTotalLiters / 200)} fûts de 200L)</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Volume mensuel troupeau</p>
                <p className="text-lg font-bold text-primary">{Math.round((waterResult.monthlyTotalLiters / 1000) * 10) / 10} m³</p>
                <p className="text-[10px] text-muted-foreground">({fmt(waterResult.monthlyTotalLiters)} Litres / mois)</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Statut d'approvisionnement</p>
                <p className="text-lg font-bold text-emerald-600 flex items-center justify-center gap-1">
                  <ShieldCheck className="h-4 w-4" /> Garanti
                </p>
                <p className="text-[10px] text-muted-foreground">Forage / Puits / Réseau</p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-xs text-sky-950 dark:text-sky-200">
              <strong>💡 Recommandation Sahélienne :</strong> {waterResult.recommendation}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
