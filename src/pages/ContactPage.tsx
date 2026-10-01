import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Mail,
  Phone,
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import Footer from "@/components/Footer";
import logo from "@/assets/logo.png";

export const ContactPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "producteur",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.message.trim()) {
      toast.error("Veuillez renseigner votre nom et votre message.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success("Votre message a été transmis avec succès à l'équipe NAFA-AGRITECH.");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-[#F97316]/20">
      {/* ── Barre Supérieure ── */}
      <header className="border-b border-border/80 bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 rounded-xl border border-border/60 hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label="Retour à l'accueil"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Link to="/" className="flex items-center gap-2.5">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl overflow-hidden bg-white shadow-2xs border border-emerald-500/20 p-0.5 flex items-center justify-center shrink-0">
                <img src={logo} alt="NAFA-AGRITECH" className="h-full w-full object-contain rounded-lg" />
              </div>
              <span className="font-heading font-extrabold text-base sm:text-lg">
                NAFA <span className="text-[#F97316]">- AGRITECH</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              size="sm"
              onClick={() => navigate("/auth?mode=register")}
              className="rounded-full bg-[#F97316] hover:bg-[#ea580c] text-white text-xs font-bold shadow-xs"
            >
              S'inscrire
            </Button>
          </div>
        </div>
      </header>

      {/* ── Contenu Principal ── */}
      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          
          {/* Titre & En-tête */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316] text-xs font-bold">
              <MessageSquare className="h-4 w-4" />
              <span>Contact & Assistance Terrain</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading font-black tracking-tight">
              Contactez l'équipe NAFA-AGRITECH
            </h1>
            <p className="text-sm text-muted-foreground">
              Une question technique, un partenariat ou besoin d'un accompagnement sur vos exploitations ? Nos agronomes et conseillers vous répondent rapidement.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Colonne Coordonnées Officielles (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-[24px] bg-card border border-border/80 shadow-md space-y-6">
                <div>
                  <h3 className="font-heading font-bold text-lg text-foreground">
                    Siège Opérationnel
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    NAFA-AGRITECH, carrefour technologique et agricole du Sahel.
                  </p>
                </div>

                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F97316]/10 text-[#F97316] flex items-center justify-center shrink-0">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-semibold block text-foreground">Adresse</span>
                      <span className="text-muted-foreground">Bobo-Dioulasso, Burkina Faso</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F97316]/10 text-[#F97316] flex items-center justify-center shrink-0">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-semibold block text-foreground">Email Officiel</span>
                      <a
                        href="mailto:nafaagritech@gmail.com"
                        className="text-[#F97316] hover:underline font-medium"
                      >
                        nafaagritech@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F97316]/10 text-[#F97316] flex items-center justify-center shrink-0">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-semibold block text-foreground">Téléphones & WhatsApp</span>
                      <div className="space-y-0.5 mt-0.5 text-muted-foreground">
                        <a href="tel:+22675774852" className="hover:text-foreground block font-medium">
                          +226 75 77 48 52
                        </a>
                        <a href="tel:+22650134920" className="hover:text-foreground block font-medium">
                          +226 50 13 49 20
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-semibold block text-foreground">Horaires d'assistance</span>
                      <span className="text-muted-foreground">Lundi au Samedi : 07h30 - 18h00 GMT</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Engagement d'assistance */}
              <div className="p-5 rounded-[20px] bg-muted/40 border border-border space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Support Dédié aux Acteurs Ruraux</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Nos ingénieurs agronomes et techniciens sont mobilisables pour des missions d'arpentage GPS géodésique, de dimensionnement d'irrigation et de validation sur site.
                </p>
              </div>
            </div>

            {/* Colonne Formulaire de Contact (7 cols) */}
            <div className="lg:col-span-7">
              <div className="p-6 sm:p-8 rounded-[28px] bg-card border border-border/80 shadow-md">
                {submitted ? (
                  <div className="py-12 text-center space-y-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-heading font-bold text-foreground">
                      Message envoyé avec succès !
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                      Merci pour votre message. Un membre de l'équipe NAFA-AGRITECH prendra contact avec vous dans les plus brefs délais.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({
                          name: "",
                          email: "",
                          phone: "",
                          role: "producteur",
                          subject: "",
                          message: "",
                        });
                      }}
                      className="rounded-full text-xs font-semibold mt-4"
                    >
                      Envoyer un autre message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="contact-name" className="text-xs font-bold">
                          Nom & Prénom(s) *
                        </Label>
                        <Input
                          id="contact-name"
                          required
                          placeholder="Ex: Oumarou Ouédraogo"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="contact-role" className="text-xs font-bold">
                          Profil / Rôle
                        </Label>
                        <select
                          id="contact-role"
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="producteur">Agriculteur / Éleveur</option>
                          <option value="agronome">Agronome / Conseiller technique</option>
                          <option value="veterinaire">Vétérinaire / Santé animale</option>
                          <option value="fournisseur">Fournisseur d'intrants & équipements</option>
                          <option value="banque">Institution financière / Assurance</option>
                          <option value="autre">Autre / Partenaire institutionnel</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="contact-email" className="text-xs font-bold">
                          Email
                        </Label>
                        <Input
                          id="contact-email"
                          type="email"
                          placeholder="contact@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="contact-phone" className="text-xs font-bold">
                          Téléphone
                        </Label>
                        <Input
                          id="contact-phone"
                          placeholder="+226 XX XX XX XX"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="contact-subject" className="text-xs font-bold">
                        Objet de votre demande
                      </Label>
                      <Input
                        id="contact-subject"
                        placeholder="Ex: Devis système d'irrigation solaire, inscription partenaire..."
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="contact-message" className="text-xs font-bold">
                        Votre message *
                      </Label>
                      <Textarea
                        id="contact-message"
                        required
                        rows={4}
                        placeholder="Décrivez votre besoin, localisation ou projet..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="text-xs resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl bg-[#F97316] hover:bg-[#ea580c] text-white font-bold text-xs py-3 shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      <span>{loading ? "Envoi en cours..." : "Envoyer mon message"}</span>
                    </Button>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <Footer />
    </div>
  );
};

export default ContactPage;
