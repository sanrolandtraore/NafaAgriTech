import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Search, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WEST_AFRICA_12_CROPS, CropTechnicalSheetData } from "@/lib/cropLibraryData";

interface Sheet {
  id: string;
  crop_key: string;
  name_fr: string;
  category: string;
  cycle_days_min: number | null;
  cycle_days_max: number | null;
  climate_zones: string[];
  seasons: string[];
  npk_needs: any;
  water_needs_mm: number | null;
  common_pests: string[];
  common_diseases: string[];
  recommended_varieties: string[];
  yield_potential_t_ha: number | null;
  notes: string | null;
  iconName?: string;
}

export default function CropLibraryPage() {
  const [sheets, setSheets] = useState<Sheet[]>(WEST_AFRICA_12_CROPS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [zone, setZone] = useState<string>("all");
  const [opened, setOpened] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("crop_technical_sheets").select("*").order("name_fr").then(({ data }) => {
      if (data && data.length > 0) {
        setSheets(data as Sheet[]);
      } else {
        setSheets(WEST_AFRICA_12_CROPS);
      }
      setLoading(false);
    }).catch(() => {
      setSheets(WEST_AFRICA_12_CROPS);
      setLoading(false);
    });
  }, []);

  const filtered = sheets.filter(s => {
    const okSearch = !search || s.name_fr.toLowerCase().includes(search.toLowerCase()) || s.crop_key.includes(search.toLowerCase());
    const okZone = zone === "all" || s.climate_zones.some(z => z.toLowerCase().includes(zone.toLowerCase()));
    return okSearch && okZone;
  });

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Fiches techniques (12 cultures ouest-africaines)
        </h1>
        <p className="text-sm text-muted-foreground">
          {sheets.length} cultures de référence ouest-africaines documentées avec paramètres NPK, eau ETc, variétés et ravageurs.
        </p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={zone} onValueChange={setZone}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes zones</SelectItem>
            <SelectItem value="sahel">Sahel</SelectItem>
            <SelectItem value="soudano">Soudano-sahélien</SelectItem>
            <SelectItem value="soudanien">Soudanien</SelectItem>
            <SelectItem value="guineen">Guinéen</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => (
            <Card key={s.id} className="p-4 cursor-pointer" onClick={() => setOpened(opened === s.id ? null : s.id)}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{s.name_fr}</h3>
                  <p className="text-xs text-muted-foreground">{s.category} • Cycle {s.cycle_days_min}-{s.cycle_days_max} j</p>
                </div>
                <div className="flex flex-wrap gap-1 max-w-[40%] justify-end">
                  {s.climate_zones.map(z => <Badge key={z} variant="outline" className="text-[10px]">{z}</Badge>)}
                </div>
              </div>
              {opened === s.id && (
                <div className="mt-3 pt-3 border-t space-y-2 text-sm">
                  {s.npk_needs && (
                    <div><strong>NPK :</strong> N {s.npk_needs.N} – P {s.npk_needs.P} – K {s.npk_needs.K} kg/ha</div>
                  )}
                  <div><strong>Besoin en eau :</strong> {s.water_needs_mm} mm</div>
                  <div><strong>Rendement potentiel :</strong> {s.yield_potential_t_ha} t/ha</div>
                  <div><strong>Variétés :</strong> {s.recommended_varieties.join(", ")}</div>
                  <div><strong>Ravageurs :</strong> {s.common_pests.join(", ")}</div>
                  <div><strong>Maladies :</strong> {s.common_diseases.join(", ")}</div>
                  {s.notes && <p className="italic text-muted-foreground">{s.notes}</p>}
                </div>
              )}
            </Card>
          ))}
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">Aucune fiche correspondante.</p>}
        </div>
      )}
    </div>
  );
}
