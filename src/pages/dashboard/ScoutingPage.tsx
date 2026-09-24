import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Plus, MapPin, Camera, FileText, Eye, Trash2, Loader2, Leaf,
  AlertTriangle, Bug, Droplets, Sun, ThermometerSun, Search, Send,
  Download, ChevronDown, ChevronUp, Clock, CheckCircle2, Wifi, WifiOff, CloudOff,
  Navigation,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import AgronomicPlansGenerator from "@/components/AgronomicPlansGenerator";
import {
  cacheData,
  getCachedData,
  addToSyncQueue,
  applyOptimisticInsert,
  applyOptimisticDelete,
} from "@/lib/offlineDb";

type ScoutingSession = {
  id: string;
  user_id: string;
  visit_date: string;
  client_name: string | null;
  parcel_name: string | null;
  crop_type: string | null;
  growth_stage: string | null;
  general_condition: string | null;
  problems_identified: any;
  proposed_treatment: string | null;
  recommendations: string | null;
  notes: string | null;
  photo_urls: string[] | null;
  latitude: number | null;
  longitude: number | null;
  report_shared_to: string[] | null;
  created_at: string;
  updated_at: string;
  _offline?: boolean;
};

const GROWTH_STAGES = ["Germination", "Levée", "Tallage", "Montaison", "Floraison", "Fructification", "Maturation", "Récolte"];
const CONDITIONS = ["Excellent", "Bon", "Moyen", "Faible", "Critique"];
const PROBLEM_TYPES = [
  { value: "maladie", label: "Maladie", icon: Bug },
  { value: "ravageur", label: "Ravageur/Insecte", icon: Bug },
  { value: "carence", label: "Carence nutritive", icon: Leaf },
  { value: "stress_hydrique", label: "Stress hydrique", icon: Droplets },
  { value: "stress_thermique", label: "Stress thermique", icon: ThermometerSun },
  { value: "mauvaise_herbe", label: "Mauvaise herbe", icon: Leaf },
  { value: "autre", label: "Autre", icon: AlertTriangle },
];

const conditionColor = (c: string | null) => {
  if (!c) return "secondary";
  const m: Record<string, string> = { Excellent: "default", Bon: "default", Moyen: "secondary", Faible: "destructive", Critique: "destructive" };
  return (m[c] || "secondary") as any;
};

export default function ScoutingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ScoutingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewSession, setViewSession] = useState<ScoutingSession | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    client_name: "",
    parcel_name: "",
    crop_type: "",
    growth_stage: "",
    general_condition: "",
    problems_identified: [] as { type: string; description: string; severity: string }[],
    proposed_treatment: "",
    recommendations: "",
    notes: "",
    visit_date: new Date().toISOString().split("T")[0],
  });
  const [gpsLoading, setGpsLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const cacheKey = `user-${user.id}`;
    if (navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from("scouting_sessions")
          .select("*")
          .eq("user_id", user.id)
          .order("visit_date", { ascending: false });

        if (error) throw error;
        const list = (data as ScoutingSession[]) || [];
        setSessions(list);
        await cacheData("scouting_sessions", cacheKey, list);
      } catch (err: any) {
        console.warn("Erreur réseau scouting, repli sur le cache local:", err);
        const cached = await getCachedData("scouting_sessions", cacheKey);
        if (cached) {
          setSessions(cached as ScoutingSession[]);
          toast.info("Rapports chargés depuis la mémoire locale (hors-ligne).");
        } else {
          toast.error("Impossible de charger les sessions.");
        }
      }
    } else {
      const cached = await getCachedData("scouting_sessions", cacheKey);
      if (cached) {
        setSessions(cached as ScoutingSession[]);
      } else {
        toast.info("Mode hors-ligne : Aucun rapport en cache local.");
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // Refetch when background sync completes
  useEffect(() => {
    const onSynced = () => { fetchSessions(); };
    window.addEventListener("nafa:sync-completed", onSynced);
    return () => window.removeEventListener("nafa:sync-completed", onSynced);
  }, [fetchSessions]);

  const captureGPS = () => {
    if (!navigator.geolocation) { toast.error("GPS non disponible sur cet appareil"); return; }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
        toast.success(`Position GPS acquise : ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
      },
      (err) => {
        setGpsLoading(false);
        // Even without satellite lock, give fallback tip
        toast.error(`Erreur GPS (${err.message}). Vérifiez l'activation de la localisation.`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  const addProblem = () => {
    setForm(f => ({ ...f, problems_identified: [...f.problems_identified, { type: "maladie", description: "", severity: "moyen" }] }));
  };
  const removeProblem = (i: number) => {
    setForm(f => ({ ...f, problems_identified: f.problems_identified.filter((_, idx) => idx !== i) }));
  };
  const updateProblem = (i: number, key: string, val: string) => {
    setForm(f => ({ ...f, problems_identified: f.problems_identified.map((p, idx) => idx === i ? { ...p, [key]: val } : p) }));
  };

  const resetForm = () => {
    setForm({ client_name: "", parcel_name: "", crop_type: "", growth_stage: "", general_condition: "", problems_identified: [], proposed_treatment: "", recommendations: "", notes: "", visit_date: new Date().toISOString().split("T")[0] });
    setCoords(null);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!form.client_name || !form.parcel_name) { toast.error("Nom du client et parcelle requis"); return; }
    setSaving(true);
    const cacheKey = `user-${user.id}`;

    const payload = {
      user_id: user.id,
      client_name: form.client_name,
      parcel_name: form.parcel_name,
      crop_type: form.crop_type || null,
      growth_stage: form.growth_stage || null,
      general_condition: form.general_condition || null,
      problems_identified: form.problems_identified.length > 0 ? form.problems_identified : null,
      proposed_treatment: form.proposed_treatment || null,
      recommendations: form.recommendations || null,
      notes: form.notes || null,
      visit_date: form.visit_date,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
    };

    if (navigator.onLine) {
      try {
        const { data, error } = await supabase.from("scouting_sessions").insert(payload as any).select();
        if (error) throw error;
        toast.success("Rapport de scouting enregistré et synchronisé !");
        setShowForm(false);
        resetForm();
        fetchSessions();
      } catch (err: any) {
        console.warn("Échec de synchronisation en ligne, mise en file d'attente hors-ligne:", err);
        // Fallback to offline insert
        const tempId = `offline-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const offlineRow: ScoutingSession = {
          ...payload,
          id: tempId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          report_shared_to: null,
          photo_urls: null,
          _offline: true,
        };
        await addToSyncQueue({ table: "scouting_sessions", operation: "insert", data: offlineRow });
        await applyOptimisticInsert("scouting_sessions", cacheKey, offlineRow);
        setSessions(prev => [offlineRow, ...prev]);
        toast.info("Réseau instable : Rapport sauvegardé localement, synchronisation en attente.");
        setShowForm(false);
        resetForm();
      }
    } else {
      // Offline mode
      const tempId = `offline-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const offlineRow: ScoutingSession = {
        ...payload,
        id: tempId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        report_shared_to: null,
        photo_urls: null,
        _offline: true,
      };
      await addToSyncQueue({ table: "scouting_sessions", operation: "insert", data: offlineRow });
      await applyOptimisticInsert("scouting_sessions", cacheKey, offlineRow);
      setSessions(prev => [offlineRow, ...prev]);
      toast.success("Mode hors-ligne : Rapport & géolocalisation enregistrés avec succès dans la base locale !");
      setShowForm(false);
      resetForm();
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette session ?")) return;
    const cacheKey = user ? `user-${user.id}` : "";

    if (id.startsWith("offline-") || !navigator.onLine) {
      await addToSyncQueue({ table: "scouting_sessions", operation: "delete", data: { id } });
      await applyOptimisticDelete("scouting_sessions", cacheKey, id);
      setSessions(prev => prev.filter(s => s.id !== id));
      toast.success("Session supprimée du cache local.");
      return;
    }

    const { error } = await supabase.from("scouting_sessions").delete().eq("id", id);
    if (error) toast.error("Erreur suppression");
    else { toast.success("Session supprimée"); fetchSessions(); }
  };

  const generatePDF = (session: ScoutingSession) => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(34, 120, 74);
    doc.rect(0, 0, pageW, 35, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("Rapport Agronomique - Inspection Terrain", 14, 18);
    doc.setFontSize(10);
    doc.text(`Date de visite: ${new Date(session.visit_date).toLocaleDateString("fr-FR")}`, 14, 28);

    doc.setTextColor(0, 0, 0);
    let y = 45;

    // Info block
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Informations générales", 14, y); y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const info = [
      ["Client / Ferme", session.client_name || "-"],
      ["Parcelle", session.parcel_name || "-"],
      ["Culture", session.crop_type || "-"],
      ["Stade de croissance", session.growth_stage || "-"],
      ["État général", session.general_condition || "-"],
    ];
    if (session.latitude && session.longitude) {
      info.push(["Coordonnées GPS", `${session.latitude.toFixed(5)}, ${session.longitude.toFixed(5)}`]);
    }
    autoTable(doc, { startY: y, head: [["Champ", "Valeur"]], body: info, theme: "striped", headStyles: { fillColor: [34, 120, 74] }, margin: { left: 14, right: 14 } });
    y = (doc as any).lastAutoTable.finalY + 10;

    // Problems
    const problems = session.problems_identified as any[] | null;
    if (problems && problems.length > 0) {
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Problèmes identifiés", 14, y); y += 8;
      const pRows = problems.map((p: any, i: number) => [
        String(i + 1),
        PROBLEM_TYPES.find(pt => pt.value === p.type)?.label || p.type,
        p.description || "-",
        p.severity === "eleve" ? "Élevé" : p.severity === "faible" ? "Faible" : "Moyen",
      ]);
      autoTable(doc, { startY: y, head: [["#", "Type", "Description", "Sévérité"]], body: pRows, theme: "striped", headStyles: { fillColor: [34, 120, 74] }, margin: { left: 14, right: 14 } });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    // Recommendations & Treatment
    if (session.recommendations) {
      doc.setFontSize(13); doc.setFont("helvetica", "bold");
      doc.text("Recommandations", 14, y); y += 7;
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(session.recommendations, pageW - 28);
      doc.text(lines, 14, y); y += lines.length * 5 + 8;
    }
    if (session.proposed_treatment) {
      doc.setFontSize(13); doc.setFont("helvetica", "bold");
      doc.text("Traitement proposé", 14, y); y += 7;
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(session.proposed_treatment, pageW - 28);
      doc.text(lines, 14, y); y += lines.length * 5 + 8;
    }
    if (session.notes) {
      doc.setFontSize(13); doc.setFont("helvetica", "bold");
      doc.text("Notes complémentaires", 14, y); y += 7;
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(session.notes, pageW - 28);
      doc.text(lines, 14, y);
    }

    // Footer
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFontSize(8); doc.setTextColor(120, 120, 120);
    doc.text("Rapport généré par NAFA - AGRITECH", 14, pageH - 10);
    doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, pageW - 60, pageH - 10);

    doc.save(`rapport_scouting_${session.parcel_name || "visite"}_${session.visit_date}.pdf`);
    toast.success("Rapport PDF téléchargé");
  };

  const filtered = sessions.filter(s =>
    (s.client_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.parcel_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.crop_type || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Eye className="h-6 w-6 text-primary" /> Scouting & Suivi des Parcelles
            {!isOnline && (
              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1 ml-2">
                <WifiOff className="h-3 w-3" /> Hors-ligne
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Relevés de patrouille agronomique et alertes géolocalisées</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => navigate("/dashboard/inspections")}
            className="gradient-primary text-primary-foreground gap-2 font-semibold shadow-xs"
          >
            <Sparkles className="h-4 w-4" />
            Inspection Intelligente IA
          </Button>
          <Button variant="outline" onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Relevé rapide
          </Button>
        </div>
      </div>

      {/* Bannière d'accès direct au nouveau module d'Inspection Intelligente */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-muted/40 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" /> NAFA Genius IA • Module d'Inspection Avancé
          </div>
          <h3 className="font-heading font-bold text-base text-foreground">
            Besoin d'un audit complet avec formulaires par mission, plans 2D/3D et devis ?
          </h3>
          <p className="text-xs text-muted-foreground max-w-2xl">
            L'Inspection Intelligente génère automatiquement vos formulaires adaptés (irrigation, pisciculture, bâtiments, forage), collecte les photos obligatoires et génère les devis fournisseurs certifiés.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => navigate("/dashboard/inspections")}
          className="gradient-primary text-primary-foreground text-xs font-semibold shrink-0 gap-1.5 shadow-xs"
        >
          <span>Lancer l'Inspection IA</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {!isOnline && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
          <WifiOff className="h-4 w-4 shrink-0" />
          <div className="flex-1">
            <strong>Mode terrain autonome activé :</strong> Vous pouvez créer des fiches de scouting avec relevé GPS hors-ligne. Vos données sont conservées localement dans IndexedDB et seront synchronisées dès que la connexion sera rétablie.
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher par client, parcelle, culture..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total inspections", value: sessions.length, icon: Eye },
          { label: "Ce mois", value: sessions.filter(s => new Date(s.visit_date).getMonth() === new Date().getMonth()).length, icon: Clock },
          { label: "Problèmes critiques", value: sessions.filter(s => s.general_condition === "Critique" || s.general_condition === "Faible").length, icon: AlertTriangle },
          { label: "Clients suivis", value: new Set(sessions.map(s => s.client_name).filter(Boolean)).size, icon: CheckCircle2 },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <stat.icon className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sessions list */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Eye className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Aucune session de scouting trouvée</p>
          <p className="text-sm">Créez votre première inspection terrain</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => (
            <Card key={s.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0" onClick={() => setExpandedId(expandedId === s.id ? null : s.id)} role="button">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">{s.client_name || "Client"}</span>
                      <Badge variant="outline" className="text-xs">{s.parcel_name || "Parcelle"}</Badge>
                      {s.general_condition && <Badge variant={conditionColor(s.general_condition)} className="text-xs">{s.general_condition}</Badge>}
                      {(s._offline || s.id.startsWith("offline-")) && (
                        <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1">
                          <CloudOff className="h-3 w-3" /> En attente de synchronisation
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(s.visit_date).toLocaleDateString("fr-FR")}</span>
                      {s.crop_type && <span className="flex items-center gap-1"><Leaf className="h-3 w-3" />{s.crop_type}</span>}
                      {s.latitude && s.longitude ? (
                        <span className="flex items-center gap-1 text-primary font-mono text-[11px]">
                          <MapPin className="h-3 w-3" />{s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => generatePDF(s)} title="Télécharger PDF"><Download className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setViewSession(s)} title="Voir détails"><Eye className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(s.id)} title="Supprimer"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    {expandedId === s.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
                {expandedId === s.id && (
                  <div className="mt-3 pt-3 border-t space-y-2 text-sm">
                    {s.growth_stage && <p><strong>Stade:</strong> {s.growth_stage}</p>}
                    {(s.problems_identified as any[])?.length > 0 && (
                      <div>
                        <strong>Problèmes:</strong>
                        <ul className="list-disc list-inside ml-2">
                          {(s.problems_identified as any[]).map((p: any, i: number) => (
                            <li key={i}>{PROBLEM_TYPES.find(pt => pt.value === p.type)?.label || p.type}: {p.description || "-"} ({p.severity})</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {s.recommendations && <p><strong>Recommandations:</strong> {s.recommendations}</p>}
                    {s.proposed_treatment && <p><strong>Traitement:</strong> {s.proposed_treatment}</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Agronomic Plans Generator */}
      <AgronomicPlansGenerator sessionData={viewSession || undefined} />

      {/* New Session Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Eye className="h-5 w-5 text-primary" /> Nouvelle inspection terrain</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Client / Ferme *</Label><Input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} placeholder="Nom du client" /></div>
              <div><Label>Parcelle *</Label><Input value={form.parcel_name} onChange={e => setForm(f => ({ ...f, parcel_name: e.target.value }))} placeholder="Nom de la parcelle" /></div>
              <div><Label>Culture</Label><Input value={form.crop_type} onChange={e => setForm(f => ({ ...f, crop_type: e.target.value }))} placeholder="ex: Maïs, Riz..." /></div>
              <div><Label>Date de visite</Label><Input type="date" value={form.visit_date} onChange={e => setForm(f => ({ ...f, visit_date: e.target.value }))} /></div>
              <div>
                <Label>Stade de croissance</Label>
                <Select value={form.growth_stage} onValueChange={v => setForm(f => ({ ...f, growth_stage: v }))}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>{GROWTH_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>État général</Label>
                <Select value={form.general_condition} onValueChange={v => setForm(f => ({ ...f, general_condition: v }))}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>{CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* GPS & Géolocalisation terrain */}
            <div className="rounded-lg border p-3 bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" /> Géolocalisation de la parcelle
                </Label>
                {coords && (
                  <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                    Fix GPS actif
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="outline" onClick={captureGPS} disabled={gpsLoading} className="gap-2">
                  {gpsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4 text-primary" />}
                  {coords ? "Recalibrer position GPS" : "Capturer coordonnées GPS (Hors-ligne)"}
                </Button>
                {coords && (
                  <Button type="button" size="sm" variant="ghost" onClick={() => setCoords(null)} className="text-xs text-muted-foreground">
                    Réinitialiser
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <Label className="text-xs text-muted-foreground">Latitude</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="ex: 12.3714"
                    value={coords?.lat ?? ""}
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      setCoords(c => ({ lat: isNaN(val) ? 0 : val, lng: c?.lng ?? 0 }));
                    }}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Longitude</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="ex: -1.5197"
                    value={coords?.lng ?? ""}
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      setCoords(c => ({ lat: c?.lat ?? 0, lng: isNaN(val) ? 0 : val }));
                    }}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Fonctionne via le capteur GPS du smartphone/tablette sans connexion data internet.
              </p>
            </div>

            {/* Problems */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-base font-semibold">Problèmes identifiés</Label>
                <Button type="button" size="sm" variant="outline" onClick={addProblem} className="gap-1"><Plus className="h-3 w-3" />Ajouter</Button>
              </div>
              {form.problems_identified.map((p, i) => (
                <div key={i} className="border rounded-lg p-3 mb-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Select value={p.type} onValueChange={v => updateProblem(i, "type", v)}>
                      <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                      <SelectContent>{PROBLEM_TYPES.map(pt => <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={p.severity} onValueChange={v => updateProblem(i, "severity", v)}>
                      <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="faible">Faible</SelectItem>
                        <SelectItem value="moyen">Moyen</SelectItem>
                        <SelectItem value="eleve">Élevé</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="button" size="icon" variant="ghost" onClick={() => removeProblem(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                  <Input value={p.description} onChange={e => updateProblem(i, "description", e.target.value)} placeholder="Description du problème..." />
                </div>
              ))}
            </div>

            <div><Label>Recommandations</Label><Textarea value={form.recommendations} onChange={e => setForm(f => ({ ...f, recommendations: e.target.value }))} rows={3} placeholder="Recommandations agronomiques..." /></div>
            <div><Label>Traitement proposé</Label><Textarea value={form.proposed_treatment} onChange={e => setForm(f => ({ ...f, proposed_treatment: e.target.value }))} rows={3} placeholder="Traitement phytosanitaire, amendement..." /></div>
            <div><Label>Notes complémentaires</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Observations supplémentaires..." /></div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Session Dialog */}
      <Dialog open={!!viewSession} onOpenChange={() => setViewSession(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewSession && (
            <>
              <DialogHeader><DialogTitle>Détails de l'inspection</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Client:</span> <strong>{viewSession.client_name}</strong></div>
                  <div><span className="text-muted-foreground">Parcelle:</span> <strong>{viewSession.parcel_name}</strong></div>
                  <div><span className="text-muted-foreground">Culture:</span> <strong>{viewSession.crop_type || "-"}</strong></div>
                  <div><span className="text-muted-foreground">Date:</span> <strong>{new Date(viewSession.visit_date).toLocaleDateString("fr-FR")}</strong></div>
                  <div><span className="text-muted-foreground">Stade:</span> <strong>{viewSession.growth_stage || "-"}</strong></div>
                  <div><span className="text-muted-foreground">État:</span> <Badge variant={conditionColor(viewSession.general_condition)}>{viewSession.general_condition || "-"}</Badge></div>
                  {viewSession.latitude && (
                    <div className="col-span-2"><span className="text-muted-foreground">GPS:</span> <strong>{viewSession.latitude.toFixed(5)}, {viewSession.longitude?.toFixed(5)}</strong></div>
                  )}
                </div>

                {(viewSession.problems_identified as any[])?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Problèmes identifiés</h4>
                    {(viewSession.problems_identified as any[]).map((p: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-2 border rounded mb-1">
                        <Badge variant={p.severity === "eleve" ? "destructive" : "secondary"} className="text-xs">
                          {PROBLEM_TYPES.find(pt => pt.value === p.type)?.label || p.type}
                        </Badge>
                        <span className="text-sm flex-1">{p.description || "-"}</span>
                        <Badge variant="outline" className="text-xs">{p.severity}</Badge>
                      </div>
                    ))}
                  </div>
                )}

                {viewSession.recommendations && <div><h4 className="font-semibold">Recommandations</h4><p className="text-sm mt-1 whitespace-pre-wrap">{viewSession.recommendations}</p></div>}
                {viewSession.proposed_treatment && <div><h4 className="font-semibold">Traitement proposé</h4><p className="text-sm mt-1 whitespace-pre-wrap">{viewSession.proposed_treatment}</p></div>}
                {viewSession.notes && <div><h4 className="font-semibold">Notes</h4><p className="text-sm mt-1 whitespace-pre-wrap">{viewSession.notes}</p></div>}

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => generatePDF(viewSession)} className="gap-2"><Download className="h-4 w-4" />Télécharger PDF</Button>
                  <Button variant="outline" onClick={() => setViewSession(null)}>Fermer</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
