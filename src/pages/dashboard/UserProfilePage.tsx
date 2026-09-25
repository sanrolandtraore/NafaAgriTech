import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isMissingColumnError, isValidUuid, isInvalidUuidError } from "@/hooks/useOfflineData";
import BackNavigationButton from "@/components/BackNavigationButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { User, Save, Globe, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const AFRICAN_COUNTRIES = [
  { code: "DZ", name: "Algérie" },
  { code: "AO", name: "Angola" },
  { code: "BJ", name: "Bénin" },
  { code: "BW", name: "Botswana" },
  { code: "BF", name: "Burkina Faso" },
  { code: "BI", name: "Burundi" },
  { code: "CM", name: "Cameroun" },
  { code: "CV", name: "Cap-Vert" },
  { code: "CF", name: "Centrafrique" },
  { code: "TD", name: "Tchad" },
  { code: "KM", name: "Comores" },
  { code: "CG", name: "Congo" },
  { code: "CD", name: "RD Congo" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "DJ", name: "Djibouti" },
  { code: "EG", name: "Égypte" },
  { code: "GQ", name: "Guinée équatoriale" },
  { code: "ER", name: "Érythrée" },
  { code: "SZ", name: "Eswatini" },
  { code: "ET", name: "Éthiopie" },
  { code: "GA", name: "Gabon" },
  { code: "GM", name: "Gambie" },
  { code: "GH", name: "Ghana" },
  { code: "GN", name: "Guinée" },
  { code: "GW", name: "Guinée-Bissau" },
  { code: "KE", name: "Kenya" },
  { code: "LS", name: "Lesotho" },
  { code: "LR", name: "Libéria" },
  { code: "LY", name: "Libye" },
  { code: "MG", name: "Madagascar" },
  { code: "MW", name: "Malawi" },
  { code: "ML", name: "Mali" },
  { code: "MR", name: "Mauritanie" },
  { code: "MU", name: "Maurice" },
  { code: "MA", name: "Maroc" },
  { code: "MZ", name: "Mozambique" },
  { code: "NA", name: "Namibie" },
  { code: "NE", name: "Niger" },
  { code: "NG", name: "Nigéria" },
  { code: "RW", name: "Rwanda" },
  { code: "ST", name: "São Tomé-et-Príncipe" },
  { code: "SN", name: "Sénégal" },
  { code: "SC", name: "Seychelles" },
  { code: "SL", name: "Sierra Leone" },
  { code: "SO", name: "Somalie" },
  { code: "ZA", name: "Afrique du Sud" },
  { code: "SS", name: "Soudan du Sud" },
  { code: "SD", name: "Soudan" },
  { code: "TZ", name: "Tanzanie" },
  { code: "TG", name: "Togo" },
  { code: "TN", name: "Tunisie" },
  { code: "UG", name: "Ouganda" },
  { code: "ZM", name: "Zambie" },
  { code: "ZW", name: "Zimbabwe" },
].sort((a, b) => a.name.localeCompare(b.name, "fr"));

const UserProfilePage = () => {
  const navigate = useNavigate();
  const { user, profile: authProfile, deleteAccount } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    country: "",
  });

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "SUPPRIMER") {
      toast.error("Veuillez saisir SUPPRIMER pour confirmer.");
      return;
    }
    setDeleting(true);
    try {
      const res = await deleteAccount();
      if (res.error) throw res.error;
      toast.success("Votre compte et toutes vos données associées ont été définitivement supprimés.");
      navigate("/auth");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la suppression du compte");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      let profileData: any = null;
      if (isValidUuid(user.id)) {
        try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, phone, country")
          .eq("user_id", user.id)
          .single();
        if (error && isMissingColumnError(error)) {
          const { data: fallbackData } = await supabase
            .from("profiles")
            .select("full_name, phone")
            .eq("user_id", user.id)
            .single();
          profileData = fallbackData;
        } else {
          profileData = data;
        }
        } catch (_e) {
          try {
            const { data: fallbackData } = await supabase
              .from("profiles")
              .select("full_name, phone")
              .eq("user_id", user.id)
              .single();
            profileData = fallbackData;
          } catch (_err) {
            // ignore
          }
        }
      }

      const metaCountry = (user.user_metadata?.country as string) || localStorage.getItem(`nafa_user_country_${user.id}`) || "";

      if (profileData) {
        setForm({
          full_name: profileData.full_name || "",
          phone: profileData.phone || "",
          country: profileData.country || metaCountry || "",
        });
      } else {
        setForm(f => ({ ...f, country: metaCountry }));
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    if (form.country) {
      localStorage.setItem(`nafa_user_country_${user.id}`, form.country);
    }
    try {
      await supabase.auth.updateUser({
        data: {
          country: form.country,
          full_name: form.full_name,
          phone: form.phone,
        }
      });
    } catch (e) {
      console.warn("Could not sync user_metadata country:", e);
    }

    let error: any = null;
    if (isValidUuid(user.id)) {
      const res = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name,
          phone: form.phone,
          country: form.country || null,
        } as any)
        .eq("user_id", user.id);
      error = res.error;

      if (error && isMissingColumnError(error, "country")) {
        console.warn("Colonne 'country' absente de profiles, réessai sans cette colonne.");
        const retry = await supabase
          .from("profiles")
          .update({
            full_name: form.full_name,
            phone: form.phone,
          } as any)
          .eq("user_id", user.id);
        error = retry.error;
      }

      if (error && isInvalidUuidError(error)) {
        console.warn("UUID syntax error bypassed for local profile:", error);
        error = null;
      }
    }

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profil mis à jour !");
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-64" /></div>;

  const selectedCountry = AFRICAN_COUNTRIES.find(c => c.code === form.country);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <User className="h-6 w-6 text-primary" /> Mon Profil
          </h1>
          <p className="text-muted-foreground mt-1">Vos informations personnelles et localisation</p>
        </div>
        <div className="flex items-center gap-2">
          <BackNavigationButton fallbackTo="/dashboard" />
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />{saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Informations personnelles</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nom complet</Label>
              <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" /> Pays & Localisation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Pays africain</Label>
              <Select value={form.country} onValueChange={v => setForm(f => ({ ...f, country: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez votre pays" />
                </SelectTrigger>
                <SelectContent>
                  {AFRICAN_COUNTRIES.map(c => (
                    <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedCountry && (
              <p className="text-sm text-muted-foreground">
                Les zones climatiques et cultures de référence seront adaptées pour <strong>{selectedCountry.name}</strong>.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Zone de danger : Suppression définitive du compte */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-base text-destructive flex items-center gap-2">
            <Trash2 className="h-4 w-4" /> Zone de danger — Suppression du compte
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            La suppression de votre compte est définitive. Toutes vos données locales, parcelles, fiches et préférences associées seront définitivement purgées.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm" className="font-semibold text-xs rounded-xl">
                <Trash2 className="h-4 w-4 mr-2" /> Supprimer mon compte
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-destructive flex items-center gap-2">
                  <Trash2 className="h-5 w-5" /> Confirmer la suppression définitive
                </DialogTitle>
                <DialogDescription className="text-xs space-y-2 pt-2 text-foreground/80">
                  <p>
                    Cette action est <strong>définitive et irréversible</strong>. Votre compte, vos données et vos sessions seront supprimés de cet appareil et de nos serveurs.
                  </p>
                  <p className="text-muted-foreground">
                    Pour valider, tapez <strong>SUPPRIMER</strong> ci-dessous :
                  </p>
                </DialogDescription>
              </DialogHeader>
              <div className="py-2">
                <Input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="Tapez SUPPRIMER"
                  className="font-mono text-center tracking-widest uppercase text-sm"
                />
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteConfirm !== "SUPPRIMER"}
                >
                  {deleting ? "Suppression en cours..." : "Confirmer la suppression"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfilePage;
