import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Building2,
  Pen,
  FileText,
  Palette,
  Save,
  CheckCircle2,
  Image as ImageIcon,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  FileCheck2,
  Trash2,
} from "lucide-react";
import { partnerBrandingStorage, PartnerBranding } from "@/lib/partnerBrandingStorage";
import BackNavigationButton from "@/components/BackNavigationButton";

export default function PartnerBrandingPage() {
  const [branding, setBranding] = useState<PartnerBranding>(partnerBrandingStorage.get());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleUpdate = () => setBranding(partnerBrandingStorage.get());
    window.addEventListener("partner-branding-updated", handleUpdate);
    return () => window.removeEventListener("partner-branding-updated", handleUpdate);
  }, []);

  const handleSave = () => {
    setSaving(true);
    try {
      partnerBrandingStorage.save(branding);
      toast.success("Identité professionnelle enregistrée. Vos devis et rapports PDF afficheront désormais vos coordonnées exclusives sans mention tierce.");
    } catch {
      toast.error("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof PartnerBranding, value: string) => {
    setBranding((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 2 Mo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        update("logoImage", reader.result);
        toast.success("Logo chargé avec succès.");
      }
    };
    reader.readAsDataURL(file);
  };

  const removeLogoImage = () => {
    setBranding((prev) => {
      const next = { ...prev };
      delete next.logoImage;
      return next;
    });
  };

  const isConfigured = partnerBrandingStorage.isConfigured();

  return (
    <div className="space-y-6 container max-w-4xl mx-auto px-4 py-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="flex items-center gap-3">
          <BackNavigationButton fallbackTo="/dashboard" />
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-foreground">
                Personnalisation des Devis & Documents
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Apposez le nom de votre cabinet, votre logo et vos coordonnées sur tous les devis, calculs et rapports PDF générés.
            </p>
          </div>
        </div>

        {isConfigured ? (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1.5 py-1 px-3 self-start sm:self-auto">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Marque Blanche Active
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground gap-1.5 py-1 px-3 self-start sm:self-auto">
            Configuration standard
          </Badge>
        )}
      </div>

      {/* Aperçu en temps réel de l'en-tête du document / Devis */}
      <Card className="border-2 border-primary/20 bg-card overflow-hidden shadow-sm">
        <CardHeader className="bg-muted/30 p-4 border-b">
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Aperçu de l'en-tête de vos Devis & Documents PDF</span>
            <span className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400 font-mono">
              Zéro mention externe garantie
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div
            className="p-5 text-white transition-colors"
            style={{ backgroundColor: branding.primaryColor || "#15803d" }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {branding.logoImage ? (
                  <img
                    src={branding.logoImage}
                    alt="Logo cabinet"
                    className="h-12 w-12 rounded-lg object-contain bg-white/90 p-1 border border-white/20"
                  />
                ) : (
                  <div className="h-11 w-11 rounded-lg bg-white/20 flex items-center justify-center font-bold text-lg text-white border border-white/30">
                    {(branding.logoText || branding.companyName || "CAB").slice(0, 3).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-black tracking-tight leading-tight">
                    {branding.companyName.trim() || branding.logoText.trim() || "NOM DE VOTRE ENTREPRISE / CABINET"}
                  </h2>
                  <p className="text-xs text-white/80 font-medium">
                    {branding.tagline.trim() || "Cabinet d'Ingénierie & d'Expertise Agronomique"}
                  </p>
                </div>
              </div>

              <div className="text-right sm:text-right text-xs text-white/90 space-y-0.5 self-end sm:self-auto border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto">
                <p className="font-bold">{branding.expertName || "Nom de l'Ingénieur en Charge"}</p>
                <p className="text-[11px] opacity-80">{branding.expertTitle || "Ingénieur Agronome Référent"}</p>
                {branding.registrationNumber && (
                  <p className="text-[10px] font-mono opacity-75">Agrément : {branding.registrationNumber}</p>
                )}
              </div>
            </div>

            {/* Ligne d'accent */}
            <div
              className="h-1 w-full mt-4 rounded-full"
              style={{ backgroundColor: branding.accentColor || "#eab308" }}
            />
          </div>

          <div className="p-3 bg-muted/40 text-[11px] text-muted-foreground flex flex-wrap items-center justify-between gap-2 border-t">
            <span>
              <strong>Pied de page :</strong> {partnerBrandingStorage.getFooterText()}
            </span>
            <span>Document certifié in-situ</span>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire de configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section Identité & Logo */}
        <Card className="space-y-4">
          <CardHeader className="p-5 pb-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Pen className="h-4 w-4 text-primary" />
              Identité de l'Entreprise / Cabinet
            </CardTitle>
            <CardDescription className="text-xs">
              Ces informations remplaceront toutes les mentions par défaut sur vos devis et rapports.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-2 space-y-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Nom complet de votre entreprise ou cabinet *</Label>
              <Input
                placeholder="Ex: Cabinet Agro-Conseil & Ingénierie Rural"
                value={branding.companyName}
                onChange={(e) => update("companyName", e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Sigle ou nom court (pour le logo textuel)</Label>
              <Input
                placeholder="Ex: AGRO-CONSEIL BURKINA"
                value={branding.logoText}
                onChange={(e) => update("logoText", e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Logo de l'entreprise (Image PNG, JPG, WebP)</Label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-input bg-background hover:bg-accent text-xs font-semibold">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Importer mon logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </label>
                {branding.logoImage && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={removeLogoImage}
                    className="text-destructive hover:bg-destructive/10 text-xs gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Retirer le logo
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Recommandé : image transparente au format carré ou paysage (max 2 Mo).
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Slogan ou domaine d'expertise (sous-titre)</Label>
              <Input
                placeholder="Ex: Études Hydrauliques • Aménagement de Périmètres • Suivi de Cultures"
                value={branding.tagline}
                onChange={(e) => update("tagline", e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Numéro d'agrément, RCCM ou IFU</Label>
              <Input
                placeholder="Ex: Agrément MAAH N° 2024-089 / RCCM BF-OUA-2022-B-4321"
                value={branding.registrationNumber}
                onChange={(e) => update("registrationNumber", e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section Expert & Coordonnées */}
        <div className="space-y-6">
          <Card className="space-y-4">
            <CardHeader className="p-5 pb-0">
              <CardTitle className="text-base flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-primary" />
                Expert Référent & Coordonnées
              </CardTitle>
              <CardDescription className="text-xs">
                Ces mentions certifieront vos devis et signatures techniques.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-2 space-y-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Nom et prénom de l'ingénieur / expert</Label>
                <Input
                  placeholder="Ex: Dr. Amadou Kaboré"
                  value={branding.expertName}
                  onChange={(e) => update("expertName", e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Titre professionnel officiel</Label>
                <Input
                  placeholder="Ex: Ingénieur du Génie Rural & Agronomie"
                  value={branding.expertTitle}
                  onChange={(e) => update("expertTitle", e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Téléphone officiel</Label>
                  <Input
                    placeholder="+226 70 00 00 00"
                    value={branding.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Email de contact</Label>
                  <Input
                    type="email"
                    placeholder="contact@moncabinet.bf"
                    value={branding.email}
                    onChange={(e) => update("email", e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Adresse / Siège du cabinet</Label>
                <Input
                  placeholder="Ex: Secteur 15, Ouagadougou, Burkina Faso"
                  value={branding.address}
                  onChange={(e) => update("address", e.target.value)}
                  className="text-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section Couleurs de marque */}
          <Card className="space-y-4">
            <CardHeader className="p-5 pb-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                Charte Graphique des Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Bandeau principal</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={branding.primaryColor || "#15803d"}
                      onChange={(e) => update("primaryColor", e.target.value)}
                      className="w-9 h-9 rounded-lg border border-border cursor-pointer p-0.5 bg-background"
                    />
                    <Input
                      value={branding.primaryColor}
                      onChange={(e) => update("primaryColor", e.target.value)}
                      placeholder="#15803d"
                      className="text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Liseré d'accent</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={branding.accentColor || "#eab308"}
                      onChange={(e) => update("accentColor", e.target.value)}
                      className="w-9 h-9 rounded-lg border border-border cursor-pointer p-0.5 bg-background"
                    />
                    <Input
                      value={branding.accentColor}
                      onChange={(e) => update("accentColor", e.target.value)}
                      placeholder="#eab308"
                      className="text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bouton d'enregistrement */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gradient-primary text-primary-foreground font-bold px-6 py-2.5 h-11 text-sm shadow-md gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? "Enregistrement..." : "Enregistrer et appliquer à tous mes documents"}
        </Button>
      </div>
    </div>
  );
}
