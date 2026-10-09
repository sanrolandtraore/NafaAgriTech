import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  User, Mail, Phone, Lock, Save, Trash2, ShieldCheck,
  CheckCircle2, AlertCircle, Loader2, LogOut, ArrowLeft, Eye, EyeOff
} from "lucide-react";
import BackNavigationButton from "@/components/BackNavigationButton";
import { PARTNER_PROFILES } from "@/lib/partnerProfiles";

export default function ProfilPage() {
  const navigate = useNavigate();
  const { user, profile, roles, primaryRole, partnerType, updatePassword, signOut, deleteAccount } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || user?.phone || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Changement de mot de passe
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [updatingPwd, setUpdatingPwd] = useState(false);

  // Suppression de compte
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (profile) {
      if (profile.full_name) setFullName(profile.full_name);
      if (profile.phone) setPhone(profile.phone);
    }
  }, [profile]);

  // Sauvegarder les informations du profil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      toast.error("Veuillez renseigner votre nom complet.");
      return;
    }

    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: trimmedName,
          phone: phone.trim() || null,
        })
        .eq("user_id", user.id);

      if (error) {
        toast.error("Erreur lors de la mise à jour du profil : " + error.message);
      } else {
        toast.success("Profil mis à jour avec succès !");
      }
    } catch (err: any) {
      toast.error("Erreur réseau : " + (err?.message || "Veuillez réessayer."));
    } finally {
      setSavingProfile(false);
    }
  };

  // Mettre à jour le mot de passe
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error("Le mot de passe doit comporter au moins 8 caractères.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setUpdatingPwd(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        toast.error("Impossible de modifier le mot de passe : " + error.message);
      } else {
        toast.success("Mot de passe modifié avec succès !");
        setNewPassword("");
        setConfirmNewPassword("");
      }
    } catch (err: any) {
      toast.error("Erreur réseau.");
    } finally {
      setUpdatingPwd(false);
    }
  };

  // Supprimer définitivement le compte
  const handleDeleteAccount = async () => {
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      const res = await deleteAccount();
      if (res.error) {
        toast.error("Erreur lors de la suppression du compte : " + res.error.message);
      } else {
        toast.success("Votre compte et vos données ont été définitivement supprimés.");
        navigate("/connexion", { replace: true });
      }
    } catch (err: any) {
      toast.error("Erreur lors de la suppression.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackNavigationButton fallbackTo="/dashboard" />
          <div>
            <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-foreground flex items-center gap-2">
              <User className="h-6 w-6 text-primary" />
              Mon Profil & Sécurité
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Gérez vos coordonnées personnelles, votre mot de passe et vos paramètres d'accès
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigate("/deconnexion")}
          className="text-xs font-bold gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/40"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Se déconnecter</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Colonne gauche : Résumé du compte */}
        <div className="space-y-4">
          <Card className="border-border/60">
            <CardHeader className="text-center pb-3">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl border-2 border-primary/20">
                {fullName ? fullName.slice(0, 2).toUpperCase() : "NA"}
              </div>
              <CardTitle className="text-base font-bold mt-2">{fullName || "Utilisateur NAFA"}</CardTitle>
              <CardDescription className="text-xs font-mono">{user?.email || user?.phone || "Compte vérifié"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 text-xs">
              <div className="p-2.5 rounded-xl bg-muted/60 space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Rôle Principal</span>
                <span className="font-bold text-foreground capitalize">
                  {primaryRole === "partenaire" ? (PARTNER_PROFILES[partnerType]?.title || "Partenaire") : (primaryRole || "Agriculteur")}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/60 space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Identifiant Unique</span>
                <span className="font-mono text-[10px] text-muted-foreground break-all">{user?.id || "N/A"}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colonne droite : Formulaires de modification */}
        <div className="md:col-span-2 space-y-6">
          {/* Formulaire 1 : Informations personnelles */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Informations Personnelles
              </CardTitle>
              <CardDescription className="text-xs">
                Coordonnées visibles par vos partenaires techniques sur les devis et rapports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="profFullName" className="text-xs font-bold">
                    Nom et Prénom *
                  </Label>
                  <Input
                    id="profFullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={savingProfile}
                    className="h-10 rounded-xl text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="profEmail" className="text-xs font-bold">
                      Adresse e-mail (liée au compte)
                    </Label>
                    <Input
                      id="profEmail"
                      value={user?.email || ""}
                      disabled
                      className="h-10 rounded-xl text-xs bg-muted/60 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="profPhone" className="text-xs font-bold">
                      Numéro de téléphone
                    </Label>
                    <Input
                      id="profPhone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+226 70 00 00 00"
                      disabled={savingProfile}
                      className="h-10 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="submit"
                    disabled={savingProfile}
                    className="h-10 gradient-primary text-primary-foreground font-bold text-xs rounded-xl flex items-center gap-2"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Enregistrement...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        <span>Enregistrer les modifications</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Formulaire 2 : Sécurité & Mot de passe */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                Sécurité & Mot de Passe
              </CardTitle>
              <CardDescription className="text-xs">
                Modifiez votre mot de passe pour renforcer la sécurité de votre compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="newProfPassword" className="text-xs font-bold">
                      Nouveau mot de passe
                    </Label>
                    <div className="relative">
                      <Input
                        id="newProfPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 8 caractères"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength={8}
                        disabled={updatingPwd}
                        className="h-10 pr-9 rounded-xl text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmProfPassword" className="text-xs font-bold">
                      Confirmer le mot de passe
                    </Label>
                    <Input
                      id="confirmProfPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Répétez le mot de passe"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      minLength={8}
                      disabled={updatingPwd}
                      className="h-10 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="submit"
                    disabled={updatingPwd || !newPassword}
                    className="h-10 bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 font-bold text-xs rounded-xl flex items-center gap-2"
                  >
                    {updatingPwd ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Mise à jour...</span>
                      </>
                    ) : (
                      <span>Changer le mot de passe</span>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Zone de Danger : Suppression du compte */}
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-destructive flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Suppression du Compte
              </CardTitle>
              <CardDescription className="text-xs">
                Cette action supprime définitivement votre profil, vos parcelles et l'ensemble de vos données associées.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!showDeleteModal ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteModal(true)}
                  className="h-9 text-xs font-bold text-destructive border-destructive/40 hover:bg-destructive/10"
                >
                  Supprimer définitivement mon compte
                </Button>
              ) : (
                <div className="p-3.5 rounded-xl border border-destructive/40 bg-background space-y-3">
                  <p className="text-xs text-destructive font-bold">
                    Êtes-vous certain de vouloir supprimer définitivement votre compte ?
                  </p>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmDelete}
                      onChange={(e) => setConfirmDelete(e.target.checked)}
                      className="rounded text-destructive"
                    />
                    <span>Je comprends que cette opération est irréversible.</span>
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      type="button"
                      disabled={!confirmDelete || deleting}
                      onClick={handleDeleteAccount}
                      className="h-9 text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                    >
                      {deleting ? "Suppression en cours..." : "Confirmer la suppression"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => { setShowDeleteModal(false); setConfirmDelete(false); }}
                      className="h-9 text-xs font-semibold"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
