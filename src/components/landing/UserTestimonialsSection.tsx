/**
 * NAFA - AGRITECH : Section Témoignages Réels d'Utilisateurs (Social Proof Authentique)
 * 
 * Zéro Avis Fictif :
 * - Affiche uniquement les retours authentiques soumis par les exploitants et partenaires
 * - Système de dépôt d'avis vérifié intégré (modal accessible en 1 clic)
 * - Support offline avec persistance locale immédiate
 */

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Star,
  ShieldCheck,
  MessageSquarePlus,
  Send,
  MapPin,
  CheckCircle2,
  Sprout,
  Beef,
  Building2,
  Stethoscope,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { testimonialsStorage, UserTestimonial } from "@/lib/testimonialsStorage";
import { useToast } from "@/hooks/use-toast";

export const UserTestimonialsSection: React.FC = () => {
  let authContext: any = null;
  try {
    authContext = useAuth();
  } catch (_e) {
    authContext = null;
  }
  const user = authContext?.user || null;
  const profile = authContext?.profile || null;
  const { toast } = useToast();

  const [testimonials, setTestimonials] = useState<UserTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [authorName, setAuthorName] = useState("");
  const [authorRole, setAuthorRole] = useState<UserTestimonial["author_role"]>("agriculteur");
  const [location, setLocation] = useState("");
  const [organization, setOrganization] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadTestimonials = async () => {
    try {
      const data = await testimonialsStorage.getTestimonials();
      setTestimonials(data);
    } catch (e) {
      console.warn("Erreur chargement témoignages:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTestimonials();

    const handleUpdate = () => {
      void loadTestimonials();
    };

    window.addEventListener("nafa:testimonials_updated", handleUpdate);
    return () => {
      window.removeEventListener("nafa:testimonials_updated", handleUpdate);
    };
  }, []);

  // Pré-remplir le formulaire si l'utilisateur est authentifié
  useEffect(() => {
    if (user || profile) {
      const name = profile?.full_name || (user?.user_metadata?.full_name as string) || "";
      if (name && !authorName) {
        setAuthorName(name);
      }
      const role = (user?.user_metadata?.role as string) || "agriculteur";
      if (["agriculteur", "eleveur", "partenaire", "expert"].includes(role)) {
        setAuthorRole(role as UserTestimonial["author_role"]);
      }
    }
  }, [user, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !comment.trim() || !location.trim()) {
      toast({
        title: "Champs requis",
        description: "Veuillez renseigner votre nom, localité et votre retour d'expérience.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await testimonialsStorage.submitTestimonial({
        author_name: authorName,
        author_role: authorRole,
        location,
        organization: organization.trim() || undefined,
        rating,
        comment,
      });

      toast({
        title: "Témoignage enregistré avec succès",
        description: "Merci pour votre retour d'expérience précieux pour la communauté.",
      });

      setComment("");
      setDialogOpen(false);
      await loadTestimonials();
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le témoignage pour le moment.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadge = (role: UserTestimonial["author_role"]) => {
    switch (role) {
      case "agriculteur":
        return (
          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 flex items-center gap-1">
            <Sprout className="h-3 w-3" /> Agriculteur
          </Badge>
        );
      case "eleveur":
        return (
          <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 flex items-center gap-1">
            <Beef className="h-3 w-3" /> Éleveur
          </Badge>
        );
      case "partenaire":
        return (
          <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 flex items-center gap-1">
            <Building2 className="h-3 w-3" /> Entreprise Partenaire
          </Badge>
        );
      case "expert":
        return (
          <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20 flex items-center gap-1">
            <Stethoscope className="h-3 w-3" /> Agronome / Vétérinaire
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-[10px]">
            Exploitant
          </Badge>
        );
    }
  };

  return (
    <section className="py-12 bg-background border-t border-border">
      <div className="container max-w-5xl mx-auto px-4 space-y-8">
        {/* Header & Modal CTA */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Retours d'Expérience Réels
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
              La voix des exploitants et partenaires du terrain
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
              Zéro avis fictif ou sponsorisé. Retours transparents de producteurs et professionnels utilisant la plateforme.
            </p>
          </div>

          {/* Form Modal Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="text-xs font-semibold shrink-0 gap-1.5 border-primary/30 hover:border-primary text-primary hover:bg-primary/5"
              >
                <MessageSquarePlus className="h-4 w-4" />
                Partager mon expérience
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-heading font-bold text-lg">
                  Déposer un retour d'expérience réel
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Partagez votre utilisation des outils de diagnostic, du carnet sanitaire ou des services partenaires.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="authorName" className="text-xs font-semibold">
                    Nom ou Titre d'exploitation <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="authorName"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Ex: Oumarou Sawadogo / Ferme du Mouhoun"
                    required
                    className="text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="authorRole" className="text-xs font-semibold">
                      Votre profil <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={authorRole}
                      onValueChange={(val) => setAuthorRole(val as UserTestimonial["author_role"])}
                    >
                      <SelectTrigger id="authorRole" className="text-xs">
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agriculteur">Agriculteur / Maraîcher</SelectItem>
                        <SelectItem value="eleveur">Éleveur / Pasteur</SelectItem>
                        <SelectItem value="partenaire">Entreprise Partenaire</SelectItem>
                        <SelectItem value="expert">Agronome / Vétérinaire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="location" className="text-xs font-semibold">
                      Localité / Région <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Ex: Bobo-Dioulasso"
                      required
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="organization" className="text-xs font-semibold">
                    Coopérative ou Entreprise (Optionnel)
                  </Label>
                  <Input
                    id="organization"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Ex: Coopérative Maraîchère du Houet"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Évaluation de la plateforme</Label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 rounded-md hover:bg-muted transition-colors"
                        aria-label={`Noter ${star} sur 5`}
                      >
                        <Star
                          className={`h-5 w-5 ${
                            star <= rating
                              ? "text-amber-500 fill-amber-500"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold ml-2 text-foreground">{rating} / 5</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="comment" className="text-xs font-semibold">
                    Votre retour d'expérience <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Expliquez concrètement comment NAFA-AGRITECH vous aide sur le terrain (diagnostic, rendements, suivi santé animale, commandes...)"
                    rows={3}
                    required
                    className="text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full gradient-primary text-primary-foreground font-semibold text-xs py-2 shadow-xs"
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  {submitting ? "Publication en cours..." : "Publier mon retour vérifié"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Content Section: Loading, Empty, or Testimonials Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-card border border-border animate-pulse" />
            ))}
          </div>
        ) : testimonials.length === 0 ? (
          <Card className="border border-dashed border-border/80 bg-muted/20 p-8 text-center rounded-2xl">
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <MessageSquarePlus className="h-6 w-6" />
              </div>
              <h3 className="font-heading font-bold text-base text-foreground">
                Zéro faux avis : Les témoignages réels débutent ici
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                NAFA-AGRITECH refuse d'insérer des avis préfabriqués. Vous utilisez la plateforme en production ?
                Soyez le premier exploitant ou partenaire à partager votre expérience de terrain !
              </p>
              <Button
                size="sm"
                onClick={() => setDialogOpen(true)}
                className="gradient-primary text-primary-foreground text-xs font-semibold shadow-xs"
              >
                Déposer mon avis vérifié
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {testimonials.map((item) => (
              <Card
                key={item.id}
                className="p-5 rounded-2xl bg-card border border-border/80 hover:border-primary/40 hover:shadow-xs transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Rating & Verified Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3.5 w-3.5 ${
                            s <= item.rating
                              ? "text-amber-500 fill-amber-500"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                    {item.is_verified && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="h-3 w-3" /> Utilisateur Vérifié
                      </span>
                    )}
                  </div>

                  {/* Comment Text */}
                  <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed italic">
                    "{item.comment}"
                  </p>
                </div>

                {/* Author Info */}
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between gap-2">
                  <div className="truncate">
                    <div className="font-heading font-bold text-xs text-foreground truncate">
                      {item.author_name}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5 truncate">
                      <MapPin className="h-2.5 w-2.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{item.location}</span>
                      {item.organization && (
                        <span className="truncate">• {item.organization}</span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">{getRoleBadge(item.author_role)}</div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default UserTestimonialsSection;
