import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Compass,
  Sparkles,
  Bot,
  MapPin,
  Droplets,
  Calculator,
  Store,
  Tractor,
  Beef,
  Building2,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Layers,
  Search,
  Eye,
  Send,
  HelpCircle,
  FileText,
  UserPlus,
  LogIn,
  Sun,
  Activity,
  Award,
  BookmarkCheck,
  Sprout,
} from "lucide-react";
import { RealModuleIcon } from "@/components/ui/RealModuleIcon";
import Footer from "@/components/Footer";
import logo from "@/assets/logo.png";
import { AgroCalculator } from "@/components/expert/AgroCalculator";
import { AuthGateModal } from "@/components/auth/AuthGateModal";
import { BURKINA_ALL_CROPS_TECHNICAL_SHEETS } from "@/lib/cropLibraryData";

// Questions exemples pré-calibrées pour l'aperçu AI Copilote NAFA Genius
const COPILOT_SAMPLE_QUESTIONS = [
  {
    q: "Quel écartement et quelle dose de NPK pour le maïs en zone Centre-Sud ?",
    a: "Pour le maïs (variétés Barka ou Bondofa), densité recommandée : 80 cm entre lignes × 40 cm entre poquets (2 grains/poquet = 62 500 pieds/ha). Fumure de fond au semis : 200 kg/ha de NPK 14-23-14 + 6S + 1B. Apport d'Urée (46% N) fractionné : 50 kg/ha au tallage (J20) et 50 kg/ha à l'initiation florale (J40).",
    tag: "Fertilisation & Densité",
  },
  {
    q: "Comment dimensionner un système d'irrigation goutte-à-goutte pour 1 hectare d'oignon ?",
    a: "Pour 1 ha d'oignon (besoin de pointe 6.5 mm/jour) : Débit requis = 65 m³/jour. Sur 6 heures de pompage solaire, débit horaire nécessaire = 11 m³/h. Conduite principale en PEHD Ø63 PN10, rampes Ø16 espacées de 1.0 m avec goutteurs intégrés 1.6 L/h tous les 20 cm. Pression minimale requise en tête = 1.8 bar.",
    tag: "Hydraulique Solaire",
  },
  {
    q: "Quels sont les symptômes et le traitement du mildiou de la tomate ?",
    a: "Symptômes : Taches foliaires vert olive devenant brunes/huileuses avec feutrage blanc poudreux sous la feuille par temps humide. Traitement préventif bio : Bouillie bordelaise (oxyde de cuivre 20%) dosée à 50g / 10L d'eau. Traitement curatif homologué Sahel : Azoxystrobine + Mancozèbe dès l'apparition des premières taches.",
    tag: "Phytopathologie Sahélienne",
  },
  {
    q: "Quel plan d'alimentation de finition pour des béliers de Tabaski (45 jours) ?",
    a: "Ration journalière par bélier (35-45 kg vif) : 1.2 kg de fane de niébé ou arachide + 600g de son de maïs/blé + 250g de tourteau de coton + 30g de CMV (complément minéral vitaminé) et pierre à lécher en permanence. Gain moyen quotidien attendu : 180 à 220 g/jour.",
    tag: "Zootechnie & Rationnement",
  },
];

export default function PublicExplorerPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");

  const normalizedTab = React.useMemo(() => {
    if (!rawTab) return "calculateur";
    if (rawTab === "calculator" || rawTab === "calculateur") return "calculateur";
    if (rawTab === "copilot" || rawTab === "ai") return "copilot";
    if (rawTab === "elevage" || rawTab === "zootechnie") return "elevage";
    if (rawTab === "fiches" || rawTab === "crops") return "fiches";
    if (rawTab === "marketplace") return "marketplace";
    return "calculateur";
  }, [rawTab]);

  const [activeTab, setActiveTab] = useState(normalizedTab);

  React.useEffect(() => {
    if (normalizedTab && normalizedTab !== activeTab) {
      setActiveTab(normalizedTab);
    }
  }, [normalizedTab]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    setSearchParams({ tab: val });
  };

  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [gateTitle, setGateTitle] = useState("");
  const [gateDesc, setGateDesc] = useState("");
  const [gateAction, setGateAction] = useState("");

  // État démonstration Copilote
  const [copilotQuestion, setCopilotQuestion] = useState("");
  const [selectedSampleIdx, setSelectedSampleIdx] = useState(0);
  const [customAnswer, setCustomAnswer] = useState<string | null>(null);

  // Filtre recherche fiches techniques
  const [sheetSearch, setSheetSearch] = useState("");

  const filteredSheets = React.useMemo(() => {
    return BURKINA_ALL_CROPS_TECHNICAL_SHEETS.filter(
      (c) =>
        c.name_fr.toLowerCase().includes(sheetSearch.toLowerCase()) ||
        c.category.toLowerCase().includes(sheetSearch.toLowerCase()) ||
        c.scientific_name?.toLowerCase().includes(sheetSearch.toLowerCase())
    ).slice(0, 8);
  }, [sheetSearch]);

  const triggerAuthGate = (title: string, desc: string, action: string) => {
    setGateTitle(title);
    setGateDesc(desc);
    setGateAction(action);
    setAuthGateOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-[#F97316]/20">
      {/* ── BARRE DE NAVIGATION VITRINE ── */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <img src={logo} alt="NAFA-AGRITECH" className="h-9 w-9 sm:h-11 sm:w-11 object-contain" />
            <div>
              <span className="font-heading font-black text-base sm:text-xl text-foreground block tracking-tight">
                NAFA<span className="text-[#F97316]">.</span>AGRITECH
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold hidden sm:block">
                Hub de Découverte &amp; Simulateurs
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/marketplace")}
              className="text-xs font-bold rounded-xl hidden md:flex items-center gap-1.5"
            >
              <Store className="h-4 w-4 text-emerald-600" />
              <span>Marché Vitrine</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/auth?mode=login")}
              className="text-xs font-bold rounded-xl h-9"
            >
              <LogIn className="h-3.5 w-3.5 mr-1" />
              <span>Connexion</span>
            </Button>

            <Button
              size="sm"
              onClick={() => navigate("/auth?mode=register")}
              className="bg-[#F97316] hover:bg-[#ea580c] text-white text-xs font-black rounded-xl h-9 px-4 shadow-md shadow-orange-500/20"
            >
              <UserPlus className="h-3.5 w-3.5 mr-1" />
              <span>Créer un compte</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── BANNIÈRE HERO DU HUB DE DÉCOUVERTE ── */}
      <section className="bg-gradient-to-b from-muted/40 via-background to-background py-10 sm:py-16 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider gap-1.5 inline-flex items-center">
            <Compass className="h-3.5 w-3.5" />
            Accès Libre &amp; Simulateurs Interactifs
          </Badge>

          <h1 className="text-3xl sm:text-5xl font-heading font-black text-foreground tracking-tight max-w-4xl mx-auto leading-tight">
            Découvrez la puissance de <span className="text-[#F97316]">NAFA-AGRITECH</span> avant de vous inscrire.
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Testez nos outils d'ingénierie agronomique, simulez vos cultures, découvrez les prix réels du marché burkinabè et explorez nos technologies sans barrière.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={() => navigate("/auth?mode=register")}
              className="bg-[#F97316] hover:bg-[#ea580c] text-white font-heading font-black text-sm px-6 py-5 rounded-2xl shadow-lg shadow-orange-500/25 gap-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>Créer mon compte gratuitement</span>
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                const el = document.getElementById("demonstrateurs");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-sm font-bold rounded-2xl px-6 py-5 border-border gap-2"
            >
              <span>Essayer un outil ci-dessous</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── CORPS PRINCIPAL : ONGLETS DES DÉMONSTRATEURS INTERACTIFS ── */}
      <main id="demonstrateurs" className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex-1 w-full space-y-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-8">
          {/* Barre d'onglets ergonomique avec défilement horizontal */}
          <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar touch-pan-x">
            <TabsList className="bg-muted/60 p-1.5 rounded-2xl gap-1.5 inline-flex min-w-max border border-border/80">
              <TabsTrigger value="calculateur" className="rounded-xl text-xs font-bold gap-2 py-2.5 px-4 data-[state=active]:bg-card data-[state=active]:shadow-xs">
                <Calculator className="h-4 w-4 text-[#F97316]" />
                <span>1. Calculateur de Projet</span>
              </TabsTrigger>
              <TabsTrigger value="copilot" className="rounded-xl text-xs font-bold gap-2 py-2.5 px-4 data-[state=active]:bg-card data-[state=active]:shadow-xs">
                <Bot className="h-4 w-4 text-emerald-600" />
                <span>2. Copilote d'Assistance NAFA</span>
              </TabsTrigger>
              <TabsTrigger value="elevage" className="rounded-xl text-xs font-bold gap-2 py-2.5 px-4 data-[state=active]:bg-card data-[state=active]:shadow-xs">
                <Beef className="h-4 w-4 text-amber-600" />
                <span>3. Élevage &amp; Zootechnie</span>
              </TabsTrigger>
              <TabsTrigger value="fiches" className="rounded-xl text-xs font-bold gap-2 py-2.5 px-4 data-[state=active]:bg-card data-[state=active]:shadow-xs">
                <BookOpen className="h-4 w-4 text-teal-600" />
                <span>4. Fiches Techniques (200+)</span>
              </TabsTrigger>
              <TabsTrigger value="marketplace" className="rounded-xl text-xs font-bold gap-2 py-2.5 px-4 data-[state=active]:bg-card data-[state=active]:shadow-xs">
                <Store className="h-4 w-4 text-purple-600" />
                <span>5. Marché &amp; Services</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ══════════════════════════════════════════════════════
              ONGLET 1 : CALCULATEUR AGRICOLE DE TERRAIN (SIMULATION LIBRE)
          ══════════════════════════════════════════════════════ */}
          <TabsContent value="calculateur" className="space-y-6 m-0">
            <Card className="rounded-3xl border-border bg-card p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
                <div>
                  <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold mb-1 text-xs">
                    Simulateur 100% Libre
                  </Badge>
                  <h2 className="text-xl sm:text-2xl font-heading font-black text-foreground">
                    Calculez la rentabilité de votre projet agricole
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Ajustez la culture et la surface : le simulateur chiffre immédiatement les semences, engrais, eau et marge prévisionnelle en FCFA.
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={() => triggerAuthGate(
                    "Sauvegardez vos simulations",
                    "Enregistrez ce résultat pour le retrouver dans votre tableau de bord et éditer votre compte d'exploitation prévisionnel officiel.",
                    "Enregistrer mon projet agricole"
                  )}
                  className="bg-[#F97316] hover:bg-[#ea580c] text-white font-bold text-xs rounded-xl shadow-xs shrink-0"
                >
                  <BookmarkCheck className="h-4 w-4 mr-1.5" />
                  <span>Enregistrer mon résultat</span>
                </Button>
              </div>

              {/* Composant AgroCalculator complet intégré */}
              <AgroCalculator />
            </Card>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════
              ONGLET 2 : APERÇU COPILOTE IA (NAFA GENIUS)
          ══════════════════════════════════════════════════════ */}
          <TabsContent value="copilot" className="space-y-6 m-0">
            <Card className="rounded-3xl border-border bg-card p-6 sm:p-8 space-y-6 shadow-sm">
              <div>
                <Badge className="bg-emerald-500/10 text-emerald-600 font-bold mb-1 text-xs">
                  Assistance Agronomique &amp; Zootechnique
                </Badge>
                <h2 className="text-xl sm:text-2xl font-heading font-black text-foreground">
                  Aperçu de l'AI Copilote NAFA Genius
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Posez des questions d'ingénierie sahélienne ou testez les requêtes de terrain les plus fréquentes.
                </p>
              </div>

              {/* Questions types à tester en 1 clic */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Exemples de questions calibrées sur les réalités sahéliennes :
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {COPILOT_SAMPLE_QUESTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedSampleIdx(idx);
                        setCustomAnswer(null);
                      }}
                      className={`p-3.5 rounded-2xl text-left border transition-all text-xs font-medium space-y-1 ${
                        selectedSampleIdx === idx && !customAnswer
                          ? "bg-emerald-500/10 border-emerald-500/40 text-foreground shadow-2xs"
                          : "bg-muted/40 border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Badge variant="outline" className="text-[10px] py-0 text-emerald-700 dark:text-emerald-300 font-bold">
                        {item.tag}
                      </Badge>
                      <p className="font-semibold text-foreground line-clamp-2">« {item.q} »</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Zone de réponse instantanée simulée */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/5 via-background to-teal-500/5 border-2 border-emerald-500/25 space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-foreground block">Réponse d'Ingénierie NAFA</span>
                      <span className="text-[10px] text-muted-foreground">Conforme référentiel INERA Farako-Bâ &amp; FAO</span>
                    </div>
                  </div>
                  <Badge className="bg-emerald-600 text-white text-[10px] font-mono">100% Calibré Sahel</Badge>
                </div>

                <p className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {customAnswer || COPILOT_SAMPLE_QUESTIONS[selectedSampleIdx].a}
                </p>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-[11px] text-muted-foreground italic">
                    L'AI Copilote complet permet d'analyser vos photos de ravageurs, dimensionner vos parcelles et générer des ordonnances phytosanitaires.
                  </span>
                  <Button
                    size="sm"
                    onClick={() => triggerAuthGate(
                      "Débloquez l'AI Copilote complet",
                      "Créez votre compte gratuitement pour poser toutes vos questions d'ingénierie et recevoir des diagnostics personnalisés à vos parcelles.",
                      "Accéder à l'AI Copilote"
                    )}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    <span>Poser mes propres questions</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════
              ONGLET 3 : ÉLEVAGE & ZOOTECHNIE
          ══════════════════════════════════════════════════════ */}
          <TabsContent value="elevage" className="space-y-6 m-0">
            <Card className="rounded-3xl border-border bg-card p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <Badge className="bg-amber-500/10 text-amber-600 font-bold mb-1 text-xs">
                    Zootechnie, Santé &amp; Nutrition Animale
                  </Badge>
                  <h2 className="text-xl sm:text-2xl font-heading font-black text-foreground">
                    Aperçu de la Gestion du Cheptel
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Bovins, ovins, caprins et aviculture : suivi des rations, reproduction et calendrier de prophylaxie vétérinaire.
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={() => triggerAuthGate(
                    "Gérez votre cheptel en illimité",
                    "Créez votre compte gratuit pour enregistrer vos animaux, suivre les pesées, calculer les rations alimentaires et planifier les vaccinations.",
                    "Créer mon cheptel"
                  )}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs shrink-0"
                >
                  <Beef className="h-4 w-4 mr-1.5" />
                  <span>Enregistrer mon cheptel</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-muted/40 border border-border/80 space-y-2">
                  <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                    <Beef className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">Bovins &amp; Embouche</h3>
                  <p className="text-xs text-muted-foreground">
                    Suivi du Gain Moyen Quotidien (GMQ), rations ensilage / tourteau de coton, prophylaxie péripneumonie et charbon.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-muted/40 border border-border/80 space-y-2">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                    <Sprout className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">Aviculture &amp; Poulaillers</h3>
                  <p className="text-xs text-muted-foreground">
                    Dimensionnement bioclimatique de poulaillers (poulets locaux améliorés, pondeuses, chair) et suivi de la ponte.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-muted/40 border border-border/80 space-y-2">
                  <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">Pharmacie &amp; Soins Vétérinaires</h3>
                  <p className="text-xs text-muted-foreground">
                    Carnet sanitaire numérisé, rappels vaccinaux par SMS et mise en relation directe avec les docteurs vétérinaires agréés.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════
              ONGLET 6 : FICHES TECHNIQUES (200+ CULTURES SAHÉLIENNES)
          ══════════════════════════════════════════════════════ */}
          <TabsContent value="fiches" className="space-y-6 m-0">
            <Card className="rounded-3xl border-border bg-card p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <Badge className="bg-teal-500/10 text-teal-600 font-bold mb-1 text-xs">
                    Bibliothèque Agronomique Ouverte
                  </Badge>
                  <h2 className="text-xl sm:text-2xl font-heading font-black text-foreground">
                    Fiches Techniques des Cultures ({BURKINA_ALL_CROPS_TECHNICAL_SHEETS.length} Référencées)
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Céréales, maraîchage, légumineuses, fruitiers et cultures de rente du Burkina Faso et de l'Afrique de l'Ouest.
                  </p>
                </div>

                <div className="w-full sm:w-72">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher une culture (ex: maïs, tomate)..."
                      value={sheetSearch}
                      onChange={(e) => setSheetSearch(e.target.value)}
                      className="pl-9 text-xs rounded-xl h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Grille des fiches techniques consultables librement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                {filteredSheets.map((crop) => (
                  <div
                    key={crop.id}
                    className="p-3.5 sm:p-4 rounded-2xl bg-muted/40 border border-border/80 hover:border-teal-500/50 transition-all space-y-2.5 flex flex-col justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px] capitalize font-bold text-teal-700 dark:text-teal-300">
                          {crop.category}
                        </Badge>
                        {crop.is_burkina_priority && (
                          <Badge className="bg-emerald-600 text-white text-[9px] py-0 shrink-0">BF Priorité</Badge>
                        )}
                      </div>
                      <h4 className="font-extrabold text-sm text-foreground break-words">{crop.name_fr}</h4>
                      {crop.scientific_name && (
                        <p className="text-[11px] font-mono text-muted-foreground italic truncate">{crop.scientific_name}</p>
                      )}
                    </div>

                    <div className="text-[11px] text-muted-foreground space-y-1 pt-1.5 border-t border-border/50">
                      <div className="flex items-center justify-between gap-1">
                        <span>Cycle :</span>
                        <span className="font-bold text-foreground">{crop.cycle_days_min} à {crop.cycle_days_max} jours</span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <span>Rendement :</span>
                        <span className="font-bold text-foreground">{crop.yield_potential_t_ha} T/ha</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-muted/30 border border-border/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-muted-foreground text-center sm:text-left">
                  Consultez l'ensemble des <strong>235 fiches techniques complètes</strong> avec fiches de fertilisation et gestion des ravageurs.
                </span>
                <Button
                  size="sm"
                  onClick={() => navigate("/fiches-techniques")}
                  className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs shrink-0"
                >
                  <span>Ouvrir le catalogue complet</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════
              ONGLET 7 : MARKETPLACE VITRINE & PRESTATIONS
          ══════════════════════════════════════════════════════ */}
          <TabsContent value="marketplace" className="space-y-6 m-0">
            <Card className="rounded-3xl border-border bg-card p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <Badge className="bg-purple-500/10 text-purple-600 font-bold mb-1 text-xs">
                    Commerce Agricole &amp; Services Agréés
                  </Badge>
                  <h2 className="text-xl sm:text-2xl font-heading font-black text-foreground">
                    Marché Vitrine en Libre Consultation
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Consultez les prix réels constatés au Burkina Faso et découvrez les offres des distributeurs certifiés.
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={() => navigate("/marketplace")}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs shrink-0"
                >
                  <Store className="h-4 w-4 mr-1.5" />
                  <span>Ouvrir le Marché</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-muted/40 border border-border/80 space-y-2">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                    <Sprout className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">Intrants &amp; Semences</h3>
                  <p className="text-xs text-muted-foreground">
                    Semences certifiées INERA, engrais NPK/Urée, biostimulants et produits phytopharmaceutiques homologués Sahel.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-muted/40 border border-border/80 space-y-2">
                  <div className="h-9 w-9 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold">
                    <Tractor className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">Machinisme &amp; Labour</h3>
                  <p className="text-xs text-muted-foreground">
                    Réservation de tracteurs, motoculteurs, moissonneuses et pulvérisateurs avec prestataires géolocalisés.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-muted/40 border border-border/80 space-y-2">
                  <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                    <Droplets className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">Hydraulique &amp; Pompage</h3>
                  <p className="text-xs text-muted-foreground">
                    Pompes solaires, panneaux photovoltaïques, tuyauteries PEHD et kits goutte-à-goutte aux tarifs réels.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-muted/40 border border-border/80 space-y-2">
                  <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">Crédits &amp; Assurance</h3>
                  <p className="text-xs text-muted-foreground">
                    Solutions de microcrédit agricole et assurances récolte avec les institutions financières partenaires.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ── BANNIÈRE BASSE D'INSCRIPTION NATURELLE ── */}
        <section className="rounded-[32px] bg-gradient-to-br from-[#111827] via-[#1f2937] to-[#111827] text-white p-8 sm:p-12 border border-border/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left max-w-2xl">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs font-bold uppercase tracking-wider">
              Passez à l'action
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-heading font-black tracking-tight leading-tight">
              Prêt à développer vos exploitations avec NAFA ?
            </h2>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              Créez votre compte gratuitement en moins de 2 minutes pour sauvegarder vos parcelles, générer vos dossiers techniques certifiés et commander vos intrants au meilleur prix.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
            <Button
              size="lg"
              onClick={() => navigate("/auth?mode=register")}
              className="w-full sm:w-auto bg-[#F97316] hover:bg-[#ea580c] text-white font-heading font-black text-sm px-8 py-6 rounded-2xl shadow-xl shadow-orange-500/30 gap-2 transition-transform active:scale-95"
            >
              <UserPlus className="h-5 w-5" />
              <span>Créer mon compte gratuitement</span>
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth?mode=login")}
              className="w-full sm:w-auto text-white border-white/30 hover:bg-white/10 text-sm font-bold px-6 py-6 rounded-2xl"
            >
              <span>Se connecter</span>
            </Button>
          </div>
        </section>
      </main>

      <Footer />

      <AuthGateModal
        open={authGateOpen}
        onOpenChange={setAuthGateOpen}
        title={gateTitle}
        description={gateDesc}
        actionLabel={gateAction}
        redirectUrl="/dashboard"
      />
    </div>
  );
}
