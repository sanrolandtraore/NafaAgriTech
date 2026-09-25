import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isMissingColumnError, isValidUuid, isInvalidUuidError } from "@/hooks/useOfflineData";
import BackNavigationButton from "@/components/BackNavigationButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Settings, User, Lock, Bell, Palette, Globe, Trash2, Upload, Save, Camera, Eye, EyeOff, Mail, Loader2,
} from "lucide-react";

const AFRICAN_COUNTRIES = [
  { code: "DZ", name: "Algérie" }, { code: "AO", name: "Angola" }, { code: "BJ", name: "Bénin" },
  { code: "BW", name: "Botswana" }, { code: "BF", name: "Burkina Faso" }, { code: "BI", name: "Burundi" },
  { code: "CM", name: "Cameroun" }, { code: "CV", name: "Cap-Vert" }, { code: "CF", name: "Centrafrique" },
  { code: "TD", name: "Tchad" }, { code: "KM", name: "Comores" }, { code: "CG", name: "Congo" },
  { code: "CD", name: "RD Congo" }, { code: "CI", name: "Côte d'Ivoire" }, { code: "DJ", name: "Djibouti" },
  { code: "EG", name: "Égypte" }, { code: "GQ", name: "Guinée équatoriale" }, { code: "ER", name: "Érythrée" },
  { code: "SZ", name: "Eswatini" }, { code: "ET", name: "Éthiopie" }, { code: "GA", name: "Gabon" },
  { code: "GM", name: "Gambie" }, { code: "GH", name: "Ghana" }, { code: "GN", name: "Guinée" },
  { code: "GW", name: "Guinée-Bissau" }, { code: "KE", name: "Kenya" }, { code: "LS", name: "Lesotho" },
  { code: "LR", name: "Libéria" }, { code: "LY", name: "Libye" }, { code: "MG", name: "Madagascar" },
  { code: "MW", name: "Malawi" }, { code: "ML", name: "Mali" }, { code: "MR", name: "Mauritanie" },
  { code: "MU", name: "Maurice" }, { code: "MA", name: "Maroc" }, { code: "MZ", name: "Mozambique" },
  { code: "NA", name: "Namibie" }, { code: "NE", name: "Niger" }, { code: "NG", name: "Nigéria" },
  { code: "RW", name: "Rwanda" }, { code: "ST", name: "São Tomé-et-Príncipe" }, { code: "SN", name: "Sénégal" },
  { code: "SC", name: "Seychelles" }, { code: "SL", name: "Sierra Leone" }, { code: "SO", name: "Somalie" },
  { code: "ZA", name: "Afrique du Sud" }, { code: "SS", name: "Soudan du Sud" }, { code: "SD", name: "Soudan" },
  { code: "TZ", name: "Tanzanie" }, { code: "TG", name: "Togo" }, { code: "TN", name: "Tunisie" },
  { code: "UG", name: "Ouganda" }, { code: "ZM", name: "Zambie" }, { code: "ZW", name: "Zimbabwe" },
].sort((a, b) => a.name.localeCompare(b.name, "fr"));

interface SettingsPageProps {
  roleLabel: string;
  roleSpecificTab?: React.ReactNode;
  roleSpecificTabLabel?: string;
}

const SettingsPage = ({ roleLabel, roleSpecificTab, roleSpecificTabLabel }: SettingsPageProps) => {
  const navigate = useNavigate();
  const { user, deleteAccount } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  const [profileForm, setProfileForm] = useState({
    full_name: "", phone: "", country: "", avatar_url: "",
  });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [prefs, setPrefs] = useState({ theme: "system", language: "fr", notifications: true });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      let profileData: any = null;
      if (isValidUuid(user.id)) {
        try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, phone, country, avatar_url, preferences, email")
          .eq("user_id", user.id)
          .single();
        if (error && isMissingColumnError(error)) {
          const { data: fallbackData } = await supabase
            .from("profiles")
            .select("full_name, phone, avatar_url, email")
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
              .select("full_name, phone, avatar_url, email")
              .eq("user_id", user.id)
              .single();
            profileData = fallbackData;
          } catch (_err) {
            // ignore
          }
        }
      }

      const metaCountry = (user.user_metadata?.country as string) || localStorage.getItem(`nafa_user_country_${user.id}`) || "";
      const metaPrefs = (user.user_metadata?.preferences as any) || (() => {
        try {
          const raw = localStorage.getItem(`nafa_user_prefs_${user.id}`);
          return raw ? JSON.parse(raw) : null;
        } catch { return null; }
      })();

      if (profileData) {
        setProfileForm({
          full_name: profileData.full_name || "",
          phone: profileData.phone || "",
          country: profileData.country || metaCountry || "",
          avatar_url: profileData.avatar_url || "",
        });
        setNewEmail(profileData.email || user.email || "");
        const p = profileData.preferences || metaPrefs;
        if (p) setPrefs({ theme: p.theme || "system", language: p.language || "fr", notifications: p.notifications !== false });
      } else {
        setProfileForm(f => ({ ...f, country: metaCountry }));
        if (metaPrefs) setPrefs(metaPrefs);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Image trop lourde (max 2 Mo)"); return; }
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (uploadError) { toast.error(uploadError.message); return; }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = `${publicUrl}?t=${Date.now()}`;

    if (isValidUuid(user.id)) { await supabase.from("profiles").update({ avatar_url: avatarUrl } as any).eq("user_id", user.id); }
    setProfileForm(f => ({ ...f, avatar_url: avatarUrl }));
    toast.success("Photo mise à jour !");
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);

    // Persist country to local storage and auth user_metadata
    if (profileForm.country) {
      localStorage.setItem(`nafa_user_country_${user.id}`, profileForm.country);
    }
    try {
      await supabase.auth.updateUser({
        data: {
          country: profileForm.country,
          full_name: profileForm.full_name,
          phone: profileForm.phone,
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
          full_name: profileForm.full_name,
          phone: profileForm.phone || null,
          country: profileForm.country || null,
          email: newEmail || null,
        } as any)
        .eq("user_id", user.id);
      error = res.error;

      // If 'country' column does not exist on profiles in schema cache, retry without it!
      if (error && isMissingColumnError(error, "country")) {
        console.warn("Colonne 'country' absente de la table profiles, réessai sans cette colonne.");
        const retry = await supabase
          .from("profiles")
          .update({
            full_name: profileForm.full_name,
            phone: profileForm.phone || null,
            email: newEmail || null,
          } as any)
          .eq("user_id", user.id);
        error = retry.error;
      }

      if (error && isInvalidUuidError(error)) {
        console.warn("UUID syntax error bypassed for local account:", error);
        error = null;
      }
    }

    setSavingProfile(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profil mis à jour !");
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword.length < 6) { toast.error("Le mot de passe doit contenir au moins 6 caractères"); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error("Les mots de passe ne correspondent pas"); return; }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
    setSavingPassword(false);
    if (error) { toast.error(error.message); return; }
    setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    toast.success("Mot de passe modifié !");
  };

  const handleSavePrefs = async () => {
    if (!user) return;
    setSavingPrefs(true);

    localStorage.setItem(`nafa_user_prefs_${user.id}`, JSON.stringify(prefs));
    try {
      await supabase.auth.updateUser({
        data: { preferences: prefs }
      });
    } catch (e) {
      console.warn("Could not sync user_metadata preferences:", e);
    }

    let error: any = null;
    if (isValidUuid(user.id)) {
      const res = await supabase
        .from("profiles")
        .update({ preferences: prefs } as any)
        .eq("user_id", user.id);
      error = res.error;

      if (error && isMissingColumnError(error, "preferences")) {
        console.warn("Colonne 'preferences' absente de profiles, conservé en métadonnées et local.");
        error = null;
      }

      if (error && isInvalidUuidError(error)) {
        console.warn("UUID syntax error bypassed for preferences:", error);
        error = null;
      }
    }

    setSavingPrefs(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Préférences enregistrées !");
  };



  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "SUPPRIMER") { toast.error("Tapez SUPPRIMER pour confirmer"); return; }
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

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" /> Paramètres
          </h1>
          <p className="text-muted-foreground mt-1">Gérez votre compte {roleLabel}</p>
        </div>
        <BackNavigationButton fallbackTo="/dashboard" />
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="profile" className="flex items-center gap-1"><User className="h-3.5 w-3.5" />Profil</TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1"><Lock className="h-3.5 w-3.5" />Sécurité</TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-1"><Palette className="h-3.5 w-3.5" />Préférences</TabsTrigger>
          {roleSpecificTab && roleSpecificTabLabel && (
            <TabsTrigger value="role-specific" className="flex items-center gap-1">{roleSpecificTabLabel}</TabsTrigger>
          )}
          <TabsTrigger value="danger" className="flex items-center gap-1 text-destructive"><Trash2 className="h-3.5 w-3.5" />Compte</TabsTrigger>
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile">
          <Card>
            <CardHeader><CardTitle className="text-base">Informations personnelles</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profileForm.avatar_url} />
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">
                      {profileForm.full_name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </div>
                <div>
                  <p className="font-semibold">{profileForm.full_name || "Utilisateur"}</p>
                  <p className="text-sm text-muted-foreground">{profileForm.phone || "Aucun téléphone"}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Nom complet</Label>
                  <Input value={profileForm.full_name} onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))} />
                </div>
                <div>
                  <Label>Téléphone</Label>
                  <Input value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} placeholder="+226 70 00 00 00" />
                </div>
                <div>
                  <Label className="flex items-center gap-1"><Mail className="h-3 w-3" /> Email (optionnel)</Label>
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="votre@email.com"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Pour recevoir des notifications par email</p>
                </div>
                <div>
                  <Label className="flex items-center gap-1"><Globe className="h-3 w-3" />Pays</Label>
                  <Select value={profileForm.country} onValueChange={v => setProfileForm(f => ({ ...f, country: v }))}>
                    <SelectTrigger><SelectValue placeholder="Sélectionnez votre pays" /></SelectTrigger>
                    <SelectContent>
                      {AFRICAN_COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSaveProfile} disabled={savingProfile}>
                <Save className="h-4 w-4 mr-2" />{savingProfile ? "Enregistrement..." : "Enregistrer le profil"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECURITY TAB */}
        <TabsContent value="security">
          <Card>
            <CardHeader><CardTitle className="text-base">Changer le mot de passe</CardTitle></CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div>
                <Label>Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                    placeholder="Au moins 6 caractères"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label>Confirmer le mot de passe</Label>
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  placeholder="Retapez le mot de passe"
                />
              </div>
              <Button onClick={handleChangePassword} disabled={savingPassword}>
                <Lock className="h-4 w-4 mr-2" />{savingPassword ? "Modification..." : "Modifier le mot de passe"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PREFERENCES TAB */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader><CardTitle className="text-base">Préférences d'affichage</CardTitle></CardHeader>
            <CardContent className="space-y-6 max-w-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium flex items-center gap-2"><Bell className="h-4 w-4" />Notifications</p>
                  <p className="text-sm text-muted-foreground">Recevoir les alertes et rappels</p>
                </div>
                <Switch checked={prefs.notifications} onCheckedChange={v => setPrefs(p => ({ ...p, notifications: v }))} />
              </div>

              <div>
                <Label className="flex items-center gap-1"><Palette className="h-3 w-3" />Thème</Label>
                <Select value={prefs.theme} onValueChange={v => setPrefs(p => ({ ...p, theme: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">Système</SelectItem>
                    <SelectItem value="light">Clair</SelectItem>
                    <SelectItem value="dark">Sombre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="flex items-center gap-1"><Globe className="h-3 w-3" />Langue</Label>
                <Select value={prefs.language} onValueChange={v => setPrefs(p => ({ ...p, language: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="bm">Bambara</SelectItem>
                    <SelectItem value="ff">Fulfuldé</SelectItem>
                    <SelectItem value="wo">Wolof</SelectItem>
                    <SelectItem value="mos">Mooré</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSavePrefs} disabled={savingPrefs}>
                <Save className="h-4 w-4 mr-2" />{savingPrefs ? "Enregistrement..." : "Enregistrer les préférences"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        {/* BACKEND CONFIGURATION */}
        <TabsContent value="backend">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4 text-primary" />Backend sécurisé</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border p-4 bg-muted/30 space-y-2">
                <p className="text-sm font-medium">Configuration gérée par le déploiement</p>
                <p className="text-xs text-muted-foreground">
                  La connexion à Supabase est configurée côté déploiement. Aucune clé API ne doit être saisie, affichée ou enregistrée depuis l'interface utilisateur.
                </p>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-muted-foreground">
                Seule la clé publique Supabase destinée au navigateur peut être présente dans le bundle. Les clés service-role, secrets, mots de passe et identifiants de fournisseurs restent exclusivement côté serveur.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ROLE-SPECIFIC TAB */}
        {roleSpecificTab && (
          <TabsContent value="role-specific">
            {roleSpecificTab}
          </TabsContent>
        )}

        {/* DANGER ZONE */}
        <TabsContent value="danger">
          <Card className="border-destructive/30">
            <CardHeader><CardTitle className="text-base text-destructive">Zone dangereuse</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                La suppression de votre compte est irréversible. Toutes vos données seront définitivement effacées.
              </p>
              <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive"><Trash2 className="h-4 w-4 mr-2" />Supprimer mon compte</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-destructive">Supprimer définitivement le compte ?</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Cette action est <strong>irréversible</strong>. Toutes vos exploitations, données d'élevage, historiques et fichiers seront supprimés.
                    </p>
                    <div>
                      <Label>Tapez <strong>SUPPRIMER</strong> pour confirmer</Label>
                      <Input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="SUPPRIMER" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Annuler</Button>
                    <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteConfirm !== "SUPPRIMER" || deleting}>
                      {deleting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Suppression...</> : "Confirmer la suppression"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
