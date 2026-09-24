import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, Plus, Phone, Search, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { partnerStorage, ProviderClient } from "@/lib/partnerStorage";
import { getEffectiveUserId } from "@/lib/deviceIdentity";

export default function ProviderClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<ProviderClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await partnerStorage.getClients(user?.id);
      setClients(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener("nafa-partner-data-updated", handleUpdate);
    return () => window.removeEventListener("nafa-partner-data-updated", handleUpdate);
  }, [user]);

  const save = async () => {
    if (!name.trim()) {
      toast.error("Veuillez renseigner le nom de l'exploitant ou groupement.");
      return;
    }
    setSaving(true);
    try {
      await partnerStorage.saveClient({
        expert_id: getEffectiveUserId(user?.id),
        client_full_name: name.trim(),
        client_phone: phone.trim() || null,
        location: location.trim() || "",
        notes: notes.trim() || null,
      });

      toast.success("Client ajouté au carnet d'adresses !");
      setName("");
      setPhone("");
      setLocation("");
      setNotes("");
      setOpen(false);
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (confirm("Supprimer ce client de votre carnet ?")) {
      await partnerStorage.deleteClient(id);
      toast.success("Client retiré");
      loadData();
    }
  };

  const list = clients.filter(
    (c) =>
      !q.trim() ||
      c.client_full_name.toLowerCase().includes(q.toLowerCase()) ||
      (c.client_phone || "").includes(q) ||
      (c.location || "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold">Portefeuille Clients</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Producteurs, groupements féminins et coopératives que vous approvisionnez.
            </p>
          </div>
        </div>
        <Button onClick={() => setOpen(true)} className="gradient-primary text-primary-foreground font-semibold shadow-xs">
          <Plus className="h-4 w-4 mr-1.5" /> Nouveau client
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Rechercher par nom, téléphone, commune…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="h-32 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground text-sm space-y-2">
            <p>Aucun client enregistré dans cette vue.</p>
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Ajouter un premier client
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((c) => (
            <Card key={c.id} className="hover:border-primary/50 transition-all flex flex-col justify-between">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-bold leading-snug">{c.client_full_name}</CardTitle>
                  <Badge variant="secondary" className="text-[10px]">Client actif</Badge>
                </div>
                <CardDescription className="text-xs">
                  Client depuis le {new Date(c.since).toLocaleDateString("fr-FR")}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2 text-xs">
                {c.location && (
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-3 w-3 text-primary shrink-0" /> {c.location}
                  </p>
                )}
                {c.client_phone && (
                  <p className="flex items-center gap-1.5 font-mono text-foreground">
                    <Phone className="h-3 w-3 text-emerald-600 shrink-0" />
                    <a href={`tel:${c.client_phone}`} className="hover:underline">{c.client_phone}</a>
                  </p>
                )}
                {c.notes && (
                  <p className="text-muted-foreground pt-1 bg-muted/40 p-2 rounded-md leading-relaxed">
                    {c.notes}
                  </p>
                )}

                <div className="flex items-center justify-end pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={() => remove(c.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Retirer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-heading font-bold">Nouveau client / exploitation</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label>Nom complet ou Coopérative *</Label>
              <Input
                placeholder="ex. Coopérative Wend-Panga, M. Ouedraogo..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Téléphone (contact direct)</Label>
              <Input
                placeholder="+226 XX XX XX XX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Localité / Commune</Label>
              <Input
                placeholder="ex. Koubri, Komsilga, Banfora..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Notes & Cultures suivies</Label>
              <Textarea
                placeholder="Cultures (maïs, oignon), superficie, besoins récurrents..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={save} disabled={saving || !name.trim()} className="gradient-primary text-primary-foreground font-semibold">
              {saving ? "Enregistrement…" : "Enregistrer le client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
