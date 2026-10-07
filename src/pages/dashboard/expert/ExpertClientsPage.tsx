import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Phone, Calendar, AlertTriangle, Loader2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

// Les tables metier ne figurent pas dans les types Supabase generes (src/integrations/supabase/types.ts) :
// on passe par une vue non typee du client pour ces requetes.
const db = supabase as unknown as SupabaseClient;

interface Client {
  id: string;
  client_user_id: string;
  client_full_name: string;
  client_phone: string | null;
  status: string;
  notes: string | null;
  since: string;
}

interface Visit {
  id: string;
  client_user_id: string;
  visit_date: string;
  visit_type: string;
  observations: string | null;
  recommendations: string | null;
  next_visit_date: string | null;
}

export default function ExpertClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [openClient, setOpenClient] = useState<Client | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showVisit, setShowVisit] = useState(false);

  // add client form
  const [cName, setCName] = useState(""); const [cPhone, setCPhone] = useState(""); const [cNotes, setCNotes] = useState("");
  // visit form
  const [vDate, setVDate] = useState(new Date().toISOString().slice(0, 10));
  const [vType, setVType] = useState("conseil");
  const [vObs, setVObs] = useState(""); const [vRec, setVRec] = useState(""); const [vNext, setVNext] = useState("");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [c, v] = await Promise.all([
      db.from("expert_clients").select("*").eq("expert_id", user.id).order("client_full_name"),
      db.from("client_visits").select("*").eq("expert_id", user.id).order("visit_date", { ascending: false }),
    ]);
    setClients((c.data ?? []) as Client[]);
    setVisits((v.data ?? []) as Visit[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const addClient = async () => {
    if (!user || !cName.trim()) return;
    // generate placeholder client_user_id since it's a free-form contact
    const clientUserId = crypto.randomUUID();
    const { error } = await db.from("expert_clients").insert({
      expert_id: user.id,
      client_user_id: clientUserId,
      client_full_name: cName,
      client_phone: cPhone || null,
      notes: cNotes || null,
    });
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Client ajouté" });
    setCName(""); setCPhone(""); setCNotes(""); setShowAdd(false); load();
  };

  const addVisit = async () => {
    if (!user || !openClient) return;
    const { error } = await db.from("client_visits").insert({
      expert_id: user.id,
      client_user_id: openClient.client_user_id,
      visit_date: vDate,
      visit_type: vType,
      observations: vObs || null,
      recommendations: vRec || null,
      next_visit_date: vNext || null,
    });
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Visite enregistrée" });
    setVObs(""); setVRec(""); setVNext(""); setShowVisit(false); load();
  };

  const getLastVisit = (cid: string) => visits.find(v => v.client_user_id === cid);
  const isOverdue = (date?: string) => date ? (Date.now() - new Date(date).getTime()) > 30 * 24 * 3600 * 1000 : true;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-primary" />Mes clients</h1>
          <p className="text-sm text-muted-foreground">{clients.length} client(s) suivi(s)</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Ajouter</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouveau client</DialogTitle></DialogHeader>
            <div className="space-y-2">
              <div><Label>Nom complet *</Label><Input value={cName} onChange={e => setCName(e.target.value)} /></div>
              <div><Label>Téléphone</Label><Input value={cPhone} onChange={e => setCPhone(e.target.value)} /></div>
              <div><Label>Notes</Label><Textarea rows={3} value={cNotes} onChange={e => setCNotes(e.target.value)} /></div>
              <Button className="w-full" onClick={addClient}>Enregistrer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-2">
          {clients.map(c => {
            const last = getLastVisit(c.client_user_id);
            const overdue = !last || isOverdue(last.visit_date);
            return (
              <Card key={c.id} className="p-4 cursor-pointer" onClick={() => setOpenClient(c)}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      {c.client_full_name}
                      {overdue && <AlertTriangle className="h-4 w-4 text-destructive" />}
                    </h3>
                    {c.client_phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {c.client_phone}</p>}
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      {last ? `Dernière visite : ${last.visit_date}` : "Aucune visite"}
                    </p>
                  </div>
                  <Badge variant={c.status === "actif" ? "default" : "secondary"}>{c.status}</Badge>
                </div>
              </Card>
            );
          })}
          {clients.length === 0 && <p className="text-center text-muted-foreground py-8">Aucun client. Ajoutez votre premier suivi.</p>}
        </div>
      )}

      <Dialog open={!!openClient} onOpenChange={(o) => !o && setOpenClient(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{openClient?.client_full_name}</DialogTitle></DialogHeader>
          {openClient && (
            <div className="space-y-3">
              {openClient.client_phone && <p className="text-sm"><Phone className="inline h-3 w-3 mr-1" /> {openClient.client_phone}</p>}
              {openClient.notes && <p className="text-sm italic text-muted-foreground">{openClient.notes}</p>}

              <div className="flex justify-between items-center mt-4">
                <h4 className="font-semibold text-sm">Historique des visites</h4>
                <Button size="sm" variant="outline" onClick={() => setShowVisit(true)}><Plus className="h-3 w-3 mr-1" /> Visite</Button>
              </div>

              {showVisit && (
                <Card className="p-3 space-y-2 bg-muted/30">
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-xs">Date</Label><Input type="date" value={vDate} onChange={e => setVDate(e.target.value)} /></div>
                    <div><Label className="text-xs">Type</Label><Input value={vType} onChange={e => setVType(e.target.value)} /></div>
                  </div>
                  <Textarea rows={2} placeholder="Observations" value={vObs} onChange={e => setVObs(e.target.value)} />
                  <Textarea rows={2} placeholder="Recommandations" value={vRec} onChange={e => setVRec(e.target.value)} />
                  <div><Label className="text-xs">Prochaine visite</Label><Input type="date" value={vNext} onChange={e => setVNext(e.target.value)} /></div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={addVisit}>Enregistrer</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowVisit(false)}>Annuler</Button>
                  </div>
                </Card>
              )}

              <div className="space-y-2">
                {visits.filter(v => v.client_user_id === openClient.client_user_id).map(v => (
                  <Card key={v.id} className="p-3">
                    <div className="flex justify-between text-xs">
                      <Badge variant="outline">{v.visit_type}</Badge>
                      <span className="text-muted-foreground">{v.visit_date}</span>
                    </div>
                    {v.observations && <p className="text-sm mt-2"><strong>Obs :</strong> {v.observations}</p>}
                    {v.recommendations && <p className="text-sm"><strong>Recommandations :</strong> {v.recommendations}</p>}
                    {v.next_visit_date && <p className="text-xs text-primary mt-1">Prochaine : {v.next_visit_date}</p>}
                  </Card>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
