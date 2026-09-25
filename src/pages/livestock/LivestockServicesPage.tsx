import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Stethoscope,
  MapPin,
  Clock,
  CheckCircle,
  Phone,
  Search,
  SlidersHorizontal,
  Calendar,
  AlertTriangle,
  Award,
  Send,
  Star,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  FileText,
  DollarSign,
  Package,
  Layers,
  Sparkles,
  ArrowRight
} from "lucide-react";
import BackNavigationButton from "@/components/BackNavigationButton";
import {
  veterinaryStorage,
  VeterinaryPartner,
  VeterinaryServiceItem,
  VeterinaryBookingRequest,
  VeterinarySpecialty,
  VETERINARY_MODULE_TYPE,
} from "@/lib/veterinaryServicesStorage";

// ── Spécialités Officielles Reconnues ──
const SPECIALTIES_CONFIG: { value: VeterinarySpecialty | "all"; label: string }[] = [
  { value: "all", label: "Toutes les spécialités" },
  { value: "consultation", label: "Consultation vétérinaire" },
  { value: "vaccination", label: "Vaccination" },
  { value: "deparasitage", label: "Déparasitage" },
  { value: "insemination", label: "Insémination artificielle" },
  { value: "reproduction", label: "Reproduction" },
  { value: "chirurgie", label: "Chirurgie" },
  { value: "suivi_sanitaire", label: "Suivi sanitaire" },
  { value: "urgences", label: "Urgences 24/7" },
  { value: "analyses", label: "Analyses & prélèvements" },
  { value: "formation", label: "Formation des éleveurs" },
  { value: "conseils", label: "Conseils techniques" },
];

const REGIONS = [
  { value: "all", label: "Toutes les régions" },
  { value: "Hauts-Bassins", label: "Hauts-Bassins (Bobo-Dioulasso)" },
  { value: "Centre", label: "Centre (Ouagadougou)" },
  { value: "Boucle du Mouhoun", label: "Boucle du Mouhoun (Dédougou)" },
  { value: "Sahel", label: "Sahel (Dori)" },
];

const LivestockServicesPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"catalogue" | "reservations">("catalogue");
  const [partners, setPartners] = useState<VeterinaryPartner[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [emergencyOnly, setEmergencyOnly] = useState(false);

  // Modaux
  const [selectedPartner, setSelectedPartner] = useState<VeterinaryPartner | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [partnerForAction, setPartnerForAction] = useState<VeterinaryPartner | null>(null);

  // Formulaire Réservation
  const [bookingForm, setBookingForm] = useState({
    serviceId: "",
    serviceName: "",
    date: "",
    time: "",
    location: "",
    animalType: "Bovins",
    animalCount: 1,
    notes: "",
    phone: "",
    clientName: "",
  });

  // Formulaire Devis
  const [quoteForm, setQuoteForm] = useState({
    serviceName: "Prestation globale",
    animalCount: 10,
    description: "",
    clientName: "",
    phone: "",
  });

  // Liste des réservations client
  const [clientBookings, setClientBookings] = useState<VeterinaryBookingRequest[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await veterinaryStorage.getPartners({
        search,
        region: selectedRegion,
        specialty: selectedSpecialty,
        emergencyOnly,
      });
      setPartners(data);

      if (user?.id) {
        const bookings = veterinaryStorage.getClientBookings(user.id);
        setClientBookings(bookings);
      }
    } catch (err) {
      console.error("Erreur de chargement des vétérinaires", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [search, selectedSpecialty, selectedRegion, emergencyOnly, user?.id]);

  // Déclencher Réservation
  const handleOpenBooking = (partner: VeterinaryPartner, defaultService?: VeterinaryServiceItem) => {
    setPartnerForAction(partner);
    setBookingForm((prev) => ({
      ...prev,
      serviceId: defaultService?.id || (partner.services[0]?.id ?? ""),
      serviceName: defaultService?.title || (partner.services[0]?.title ?? "Consultation"),
      phone: prev.phone || user?.email?.includes("+") ? user?.email.split("@")[0] : "",
      clientName: prev.clientName || "Éleveur Partenaire",
    }));
    setBookingModalOpen(true);
  };

  // Soumettre Réservation
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerForAction) return;

    if (!bookingForm.date || !bookingForm.location || !bookingForm.phone) {
      toast.error("Veuillez renseigner la date, le lieu et votre téléphone");
      return;
    }

    const service = partnerForAction.services.find((s) => s.id === bookingForm.serviceId);
    const estimatedCost = (service?.price_fcfa || partnerForAction.starting_price_fcfa) * (bookingForm.animalCount || 1);

    await veterinaryStorage.createBooking({
      partner_id: partnerForAction.id,
      partner_name: partnerForAction.name,
      client_id: user?.id || `anon-${Date.now()}`,
      client_name: bookingForm.clientName || "Éleveur NAFA",
      client_phone: bookingForm.phone,
      service_id: bookingForm.serviceId,
      service_name: bookingForm.serviceName,
      requested_date: bookingForm.date,
      requested_time: bookingForm.time || "08:00",
      location: bookingForm.location,
      animal_type: bookingForm.animalType,
      animal_count: Number(bookingForm.animalCount) || 1,
      notes: bookingForm.notes,
      estimated_cost_fcfa: estimatedCost,
    });

    toast.success("Réservation transmise avec succès au docteur vétérinaire !");
    setBookingModalOpen(false);
    if (user?.id) {
      setClientBookings(veterinaryStorage.getClientBookings(user.id));
    }
  };

  // Déclencher Devis
  const handleOpenQuote = (partner: VeterinaryPartner) => {
    setPartnerForAction(partner);
    setQuoteForm((prev) => ({
      ...prev,
      serviceName: partner.services[0]?.title || "Intervention vétérinaire",
      phone: prev.phone || user?.email?.includes("+") ? user?.email.split("@")[0] : "",
      clientName: prev.clientName || "Éleveur Partenaire",
    }));
    setQuoteModalOpen(true);
  };

  // Soumettre Devis
  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerForAction) return;

    if (!quoteForm.phone || !quoteForm.description) {
      toast.error("Veuillez indiquer vos coordonnées et décrire votre besoin");
      return;
    }

    await veterinaryStorage.createQuote({
      partner_id: partnerForAction.id,
      partner_name: partnerForAction.name,
      client_id: user?.id || `anon-${Date.now()}`,
      client_name: quoteForm.clientName || "Éleveur NAFA",
      client_phone: quoteForm.phone,
      service_id: "quote-custom",
      service_name: quoteForm.serviceName,
      animal_count: Number(quoteForm.animalCount) || 1,
      description: quoteForm.description,
    });

    toast.success("Demande de devis transmise au cabinet vétérinaire !");
    setQuoteModalOpen(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6 animate-fade-in pb-20">
      
      {/* ── Entête & Switcher Annuaire / Mes Demandes ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div className="flex items-center gap-3">
          <BackNavigationButton fallbackTo="/dashboard" />
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-1 border border-emerald-500/20">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Ordre National des Vétérinaires du Burkina Faso</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-foreground flex items-center gap-2.5">
              <Stethoscope className="h-7 w-7 text-[#F97316]" /> Services Vétérinaires
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
              Annuaire officiel et réservation directe de prestations auprès de cliniques et docteurs vétérinaires certifiés du Sahel.
            </p>
          </div>
        </div>

        {/* Boutons d'Onglet */}
        <div className="inline-flex p-1.5 rounded-[20px] bg-muted/70 border border-border shadow-xs self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("catalogue")}
            className={`px-5 py-2.5 rounded-[16px] text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "catalogue"
                ? "bg-[#111827] dark:bg-white text-white dark:text-[#111827] shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Stethoscope className="h-4 w-4 text-[#F97316]" />
            Annuaire & Soins ({partners.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("reservations")}
            className={`px-5 py-2.5 rounded-[16px] text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "reservations"
                ? "bg-[#111827] dark:bg-white text-white dark:text-[#111827] shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar className="h-4 w-4 text-[#F97316]" />
            Mes Réservations ({clientBookings.length})
          </button>
        </div>
      </div>

      {activeTab === "catalogue" ? (
        <div className="space-y-8">
          
          {/* ── Barre de Recherche & Filtres Avancés ── */}
          <div className="p-5 rounded-[24px] bg-card border border-border/80 shadow-xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              
              {/* Recherche textuelle */}
              <div className="relative md:col-span-2">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par médecin, clinique, spécialité, ville..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 rounded-[16px] bg-background text-xs sm:text-sm h-10 border-border"
                />
              </div>

              {/* Filtre Région */}
              <div>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="rounded-[16px] h-10 text-xs sm:text-sm bg-background border-border">
                    <SelectValue placeholder="Région" />
                  </SelectTrigger>
                  <SelectContent className="rounded-[16px]">
                    {REGIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value} className="text-xs">
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtre Spécialité */}
              <div>
                <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                  <SelectTrigger className="rounded-[16px] h-10 text-xs sm:text-sm bg-background border-border">
                    <SelectValue placeholder="Spécialité" />
                  </SelectTrigger>
                  <SelectContent className="rounded-[16px]">
                    {SPECIALTIES_CONFIG.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="text-xs">
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick chips & Urgences 24/7 */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground font-semibold flex items-center gap-1">
                  <SlidersHorizontal className="h-3.5 w-3.5" /> Filtres rapides :
                </span>
                <button
                  type="button"
                  onClick={() => setEmergencyOnly(!emergencyOnly)}
                  className={`px-3 py-1.5 rounded-full font-bold transition-all flex items-center gap-1.5 ${
                    emergencyOnly
                      ? "bg-rose-500 text-white shadow-xs"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Urgences 24/7
                </button>
              </div>

              <span className="text-xs text-muted-foreground font-semibold">
                {partners.length} professionnel{partners.length > 1 ? "s" : ""} vétérinaire{partners.length > 1 ? "s" : ""} agréé{partners.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* ── Grille des Partenaires Vétérinaires ── */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 rounded-[24px] bg-card border animate-pulse" />
              ))}
            </div>
          ) : partners.length === 0 ? (
            <div className="text-center py-16 p-8 rounded-[24px] bg-card border border-border space-y-3">
              <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-base font-bold text-foreground">Aucun vétérinaire trouvé pour ces critères</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Essayez d'élargir la recherche à d'autres régions ou réinitialisez les filtres de spécialité.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setSelectedRegion("all");
                  setSelectedSpecialty("all");
                  setEmergencyOnly(false);
                }}
                className="rounded-[16px] text-xs font-bold"
              >
                Réinitialiser les filtres
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {partners.map((partner) => (
                <Card
                  key={partner.id}
                  className="overflow-hidden rounded-[24px] border-border/80 hover:border-[#F97316]/50 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between bg-card group"
                >
                  <div>
                    {/* Photo de couverture & Badge */}
                    <div className="relative h-44 overflow-hidden bg-muted">
                      <img
                        src={partner.cover_image}
                        alt={partner.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      {/* Badge N° Ordre & Région */}
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <Badge className="bg-white/95 text-[#111827] text-[10px] font-bold rounded-full backdrop-blur-md">
                          {partner.order_number}
                        </Badge>
                        <Badge className="bg-emerald-600 text-white text-[10px] font-bold rounded-full">
                          {partner.city}
                        </Badge>
                      </div>

                      {partner.business_hours.emergency_24_7 && (
                        <div className="absolute top-3 right-3 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Urgences 24/7</span>
                        </div>
                      )}

                      {/* Identité sur l'image */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3">
                        <img
                          src={partner.logo}
                          alt={partner.doctor_name}
                          className="w-12 h-12 rounded-[16px] object-cover border-2 border-white shadow-md bg-white shrink-0"
                        />
                        <div className="text-white truncate">
                          <h3 className="font-heading font-extrabold text-base leading-tight truncate">
                            {partner.name}
                          </h3>
                          <p className="text-xs text-white/80 font-medium truncate">
                            {partner.doctor_name}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Contenu de la fiche */}
                    <CardContent className="p-5 space-y-4">
                      {/* Zone d'intervention & Distance */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                        <span className="flex items-center gap-1.5 truncate">
                          <MapPin className="h-3.5 w-3.5 text-[#F97316] shrink-0" />
                          <span className="truncate">{partner.intervention_zone}</span>
                        </span>
                        <span className="font-bold text-foreground shrink-0">
                          Rayon {partner.intervention_radius_km} km
                        </span>
                      </div>

                      {/* Présentation concise */}
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {partner.presentation}
                      </p>

                      {/* Services Proposés (Badges) */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Services Clés :
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {partner.services.slice(0, 4).map((s) => (
                            <span
                              key={s.id}
                              className="px-2 py-1 rounded-[12px] bg-muted text-[11px] font-semibold text-foreground border border-border/50"
                            >
                              {s.title.split(" (")[0]}
                            </span>
                          ))}
                          {partner.services.length > 4 && (
                            <span className="px-2 py-1 rounded-[12px] bg-primary/10 text-[#F97316] text-[11px] font-bold">
                              +{partner.services.length - 4} autres
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Note & Tarif indicatif */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/60">
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center text-amber-500">
                            <Star className="h-4 w-4 fill-amber-500" />
                          </div>
                          <span className="text-xs font-bold text-foreground">{partner.rating}</span>
                          <span className="text-[11px] text-muted-foreground">
                            ({partner.reviews_count} avis)
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-muted-foreground block">À partir de</span>
                          <span className="font-heading font-extrabold text-sm text-[#F97316]">
                            {partner.starting_price_fcfa.toLocaleString()} FCFA
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </div>

                  {/* Actions directes (Fiche, Devis, Réserver) */}
                  <div className="p-5 pt-0 grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPartner(partner)}
                      className="rounded-[16px] text-xs font-bold border-border"
                    >
                      Voir la fiche
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenQuote(partner)}
                      className="rounded-[16px] text-xs font-bold"
                    >
                      Devis
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleOpenBooking(partner)}
                      className="rounded-[16px] bg-[#F97316] hover:bg-[#ea580c] text-white text-xs font-bold shadow-md shadow-orange-500/20"
                    >
                      Réserver
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

        </div>
      ) : (
        /* ── Onglet Mes Réservations & Suivi Vétérinaire ── */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-heading font-bold text-foreground">
                Historique de vos réservations d'intervention
              </h2>
              <p className="text-xs text-muted-foreground">
                Suivi en temps réel de vos demandes d'actes et visites auprès des vétérinaires agréés.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setActiveTab("catalogue")}
              className="rounded-[16px] bg-[#F97316] text-white text-xs font-bold"
            >
              Prendre rendez-vous
            </Button>
          </div>

          {clientBookings.length === 0 ? (
            <div className="text-center py-16 p-8 rounded-[24px] bg-card border border-border space-y-3">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="text-sm font-bold text-foreground">Aucune réservation active pour le moment</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Consultez l'annuaire des docteurs vétérinaires pour réserver une consultation, une vaccination ou une urgence.
              </p>
              <Button
                size="sm"
                onClick={() => setActiveTab("catalogue")}
                className="rounded-[16px] bg-[#F97316] text-white text-xs font-bold"
              >
                Parcourir les vétérinaires
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clientBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-5 rounded-[24px] bg-card border border-border shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#F97316] block">
                        {b.partner_name}
                      </span>
                      <h4 className="font-heading font-bold text-sm text-foreground">
                        {b.service_name}
                      </h4>
                    </div>
                    <Badge
                      className={`text-[10px] font-bold rounded-full ${
                        b.status === "confirmee"
                          ? "bg-emerald-600 text-white"
                          : b.status === "annulee"
                          ? "bg-rose-600 text-white"
                          : "bg-amber-500 text-white"
                      }`}
                    >
                      {b.status === "confirmee" ? "Confirmée" : b.status === "annulee" ? "Annulée" : "En attente"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[#F97316]" />
                      {new Date(b.requested_date).toLocaleDateString("fr-FR")} à {b.requested_time}
                    </span>
                    <span className="flex items-center gap-1.5 truncate">
                      <MapPin className="h-3.5 w-3.5 text-[#F97316]" />
                      {b.location}
                    </span>
                  </div>

                  {b.animal_type && (
                    <div className="text-xs text-muted-foreground">
                      Animaux : <span className="font-bold text-foreground">{b.animal_count} {b.animal_type}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs">
                    <span className="font-bold text-foreground">
                      Coût estimé : {b.estimated_cost_fcfa.toLocaleString()} FCFA
                    </span>
                    {b.status === "en_attente" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (user?.id) {
                            await veterinaryStorage.cancelBooking(b.id, user.id);
                            setClientBookings(veterinaryStorage.getClientBookings(user.id));
                            toast.info("Réservation annulée");
                          }
                        }}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs h-7 px-2"
                      >
                        Annuler
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL FICHE DÉTAILLÉE DU PARTENAIRE VÉTÉRINAIRE
          (Conforme aux 13 critères stricts du cahier des charges)
      ══════════════════════════════════════════════════════ */}
      {selectedPartner && (
        <Dialog open={!!selectedPartner} onOpenChange={(open) => !open && setSelectedPartner(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[24px] p-0 border border-border">
            <DialogHeader className="sr-only">
              <DialogTitle>{selectedPartner.name}</DialogTitle>
              <DialogDescription>
                Fiche officielle et prestations certifiées du cabinet {selectedPartner.name}
              </DialogDescription>
            </DialogHeader>
            
            {/* 1. Photo de couverture */}
            <div className="relative h-60 w-full overflow-hidden bg-muted">
              <img
                src={selectedPartner.cover_image}
                alt={selectedPartner.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              
              {/* Badge N° Ordre & Urgence */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <Badge className="bg-white/95 text-[#111827] text-xs font-bold rounded-full shadow-md">
                  {selectedPartner.order_number}
                </Badge>
                <Badge className="bg-emerald-600 text-white text-xs font-bold rounded-full">
                  Certifié ONV-BF
                </Badge>
              </div>

              {selectedPartner.business_hours.emergency_24_7 && (
                <div className="absolute top-4 right-4 bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Permanence Urgences 24/7</span>
                </div>
              )}

              {/* 2. Logo & Titre */}
              <div className="absolute bottom-4 left-6 right-6 flex items-end gap-4">
                <img
                  src={selectedPartner.logo}
                  alt={selectedPartner.name}
                  className="w-20 h-20 rounded-[20px] object-cover border-4 border-white shadow-xl bg-white shrink-0"
                />
                <div className="text-white">
                  <h2 className="text-xl sm:text-2xl font-heading font-black leading-tight">
                    {selectedPartner.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-white/90 font-medium">
                    {selectedPartner.doctor_name} • {selectedPartner.city} ({selectedPartner.region})
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-8">
              
              {/* 3. Présentation */}
              <div className="space-y-2">
                <h3 className="font-heading font-bold text-sm text-[#F97316] uppercase tracking-wider">
                  Présentation & Équipements
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedPartner.presentation}
                </p>
              </div>

              {/* 4. Services Proposés & Tarifs */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-sm text-[#F97316] uppercase tracking-wider">
                    Services Vétérinaires & Tarifs Officiels
                  </h3>
                  <span className="text-xs text-muted-foreground font-semibold">
                    {selectedPartner.services.length} prestations disponibles
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedPartner.services.map((svc) => (
                    <div
                      key={svc.id}
                      className="p-4 rounded-[18px] bg-muted/30 border border-border/80 flex flex-col justify-between gap-3 hover:border-[#F97316]/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-heading font-bold text-sm text-foreground">
                            {svc.title}
                          </h4>
                          {svc.emergency && (
                            <Badge className="bg-rose-500 text-white text-[9px] font-bold rounded-full px-1.5">
                              Urgence
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-snug">
                          {svc.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                        <span className="font-heading font-extrabold text-[#F97316]">
                          {svc.price_fcfa.toLocaleString()} FCFA{" "}
                          <span className="text-[10px] text-muted-foreground font-normal">
                            / {svc.price_unit}
                          </span>
                        </span>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedPartner(null);
                            handleOpenBooking(selectedPartner, svc);
                          }}
                          className="h-7 text-[11px] rounded-[12px] bg-[#F97316] hover:bg-[#ea580c] text-white font-bold"
                        >
                          Réserver
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Produits Disponibles (si autorisés) */}
              {selectedPartner.products && selectedPartner.products.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-heading font-bold text-sm text-[#F97316] uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="h-4 w-4" /> Produits & Matériels Disponibles
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedPartner.products.map((p) => (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-[18px] bg-muted/20 border border-border flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-xs text-foreground">{p.title}</h4>
                          <p className="text-[11px] text-muted-foreground">{p.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-heading font-extrabold text-xs text-foreground block">
                            {p.price_fcfa.toLocaleString()} FCFA
                          </span>
                          <span className="text-[10px] text-emerald-600 font-bold">En stock</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Zone d'intervention & Horaires */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-[20px] bg-card border border-border">
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-[#F97316]" /> Zone d'intervention
                  </span>
                  <p className="text-xs font-semibold text-foreground">
                    {selectedPartner.intervention_zone}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Déplacements dans un rayon de {selectedPartner.intervention_radius_km} km autour de {selectedPartner.city}.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-[#F97316]" /> Horaires d'ouverture
                  </span>
                  <p className="text-xs font-semibold text-foreground">
                    {selectedPartner.business_hours.days} : {selectedPartner.business_hours.hours}
                  </p>
                  {selectedPartner.business_hours.emergency_24_7 && (
                    <p className="text-[11px] font-bold text-rose-600">
                      Permanence d'urgence assurée 24h/24 et 7j/7.
                    </p>
                  )}
                </div>
              </div>

              {/* 7. Galerie de Réalisations Terrain */}
              {selectedPartner.gallery && selectedPartner.gallery.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="font-heading font-bold text-sm text-[#F97316] uppercase tracking-wider">
                    Galerie de Réalisations de Terrain
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedPartner.gallery.map((img, i) => (
                      <div key={i} className="h-28 rounded-[16px] overflow-hidden bg-muted">
                        <img
                          src={img}
                          alt="Intervention vétérinaire"
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 8. Avis Clients Vérifiés */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-sm text-[#F97316] uppercase tracking-wider">
                    Avis d'Éleveurs ({selectedPartner.reviews.length})
                  </h3>
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                    <Star className="h-3.5 w-3.5 fill-amber-500" />
                    <span>{selectedPartner.rating} / 5</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {selectedPartner.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3.5 rounded-[16px] bg-muted/30 border border-border/60 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-foreground">{rev.author_name}</span>
                        <span className="text-[10px] text-muted-foreground">{rev.date}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground block">{rev.client_type}</span>
                      <p className="text-xs text-foreground/90 italic">"{rev.comment}"</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 9. Contact Direct & Actions Principales */}
              <div className="pt-4 border-t border-border flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/40 p-3.5 rounded-[18px] border border-border/60">
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <a
                      href={`tel:${selectedPartner.phone}`}
                      className="inline-flex items-center gap-1.5 font-bold text-foreground hover:text-[#F97316] transition-colors"
                    >
                      <Phone className="h-4 w-4 text-[#F97316]" />
                      <span>{selectedPartner.phone}</span>
                    </a>
                    <a
                      href={`https://wa.me/${selectedPartner.whatsapp.replace(/\D/g, "")}?text=Bonjour%20Dr.%20${encodeURIComponent(selectedPartner.doctor_name)},%20je%20vous%20contacte%20depuis%20la%20plateforme%20NAFA-AGRITECH`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      <span>WhatsApp : {selectedPartner.whatsapp}</span>
                    </a>
                    <span className="text-muted-foreground font-medium">
                      {selectedPartner.email}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <a
                      href={`tel:${selectedPartner.phone}`}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[16px] bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-colors"
                    >
                      <Phone className="h-4 w-4 text-[#F97316]" />
                      <span>Appeler cabinet</span>
                    </a>
                    <a
                      href={`https://wa.me/${selectedPartner.whatsapp.replace(/\D/g, "")}?text=Bonjour%20Dr.%20${encodeURIComponent(selectedPartner.doctor_name)},%20je%20vous%20contacte%20depuis%20la%20plateforme%20NAFA-AGRITECH`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[16px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
                    >
                      <span>Échanger sur WhatsApp</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const p = selectedPartner;
                      setSelectedPartner(null);
                      handleOpenQuote(p);
                    }}
                    className="flex-1 sm:flex-none rounded-[16px] text-xs font-bold"
                  >
                    Demander un devis
                  </Button>
                  <Button
                    onClick={() => {
                      const p = selectedPartner;
                      setSelectedPartner(null);
                      handleOpenBooking(p);
                    }}
                    className="flex-1 sm:flex-none rounded-[16px] bg-[#F97316] hover:bg-[#ea580c] text-white text-xs font-bold shadow-md shadow-orange-500/20"
                  >
                    Réserver
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </DialogContent>
        </Dialog>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL DE RÉSERVATION D'INTERVENTION
      ══════════════════════════════════════════════════════ */}
      {partnerForAction && (
        <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
          <DialogContent className="max-w-lg rounded-[24px]">
            <DialogHeader>
              <DialogTitle className="font-heading font-black text-lg">
                Réserver une intervention vétérinaire
              </DialogTitle>
              <DialogDescription className="text-xs">
                Auprès de : <span className="font-bold text-foreground">{partnerForAction.name}</span> ({partnerForAction.doctor_name})
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmitBooking} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Prestation souhaitée *</Label>
                <Select
                  value={bookingForm.serviceId}
                  onValueChange={(val) => {
                    const s = partnerForAction.services.find((x) => x.id === val);
                    setBookingForm((prev) => ({
                      ...prev,
                      serviceId: val,
                      serviceName: s?.title || "Intervention",
                    }));
                  }}
                >
                  <SelectTrigger className="rounded-[16px] text-xs">
                    <SelectValue placeholder="Choisir un service" />
                  </SelectTrigger>
                  <SelectContent className="rounded-[16px]">
                    {partnerForAction.services.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">
                        {s.title} ({s.price_fcfa.toLocaleString()} FCFA)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Date souhaitée *</Label>
                  <Input
                    type="date"
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                    className="rounded-[16px] text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Heure indicative</Label>
                  <Input
                    type="time"
                    value={bookingForm.time}
                    onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                    className="rounded-[16px] text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Localisation / Commune / Village *</Label>
                <Input
                  placeholder="Ex: Ferme de Bama, route de Bobo..."
                  value={bookingForm.location}
                  onChange={(e) => setBookingForm({ ...bookingForm, location: e.target.value })}
                  className="rounded-[16px] text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Type d'animaux</Label>
                  <Select
                    value={bookingForm.animalType}
                    onValueChange={(val) => setBookingForm({ ...bookingForm, animalType: val })}
                  >
                    <SelectTrigger className="rounded-[16px] text-xs">
                      <SelectValue placeholder="Espèce" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[16px]">
                      <SelectItem value="Bovins" className="text-xs">Bovins (Vaches, Taureaux)</SelectItem>
                      <SelectItem value="Ovins" className="text-xs">Ovins (Moutons)</SelectItem>
                      <SelectItem value="Caprins" className="text-xs">Caprins (Chèvres)</SelectItem>
                      <SelectItem value="Volailles" className="text-xs">Volailles (Poulets, Pintades)</SelectItem>
                      <SelectItem value="Porcins" className="text-xs">Porcins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Nombre d'animaux</Label>
                  <Input
                    type="number"
                    min={1}
                    value={bookingForm.animalCount}
                    onChange={(e) => setBookingForm({ ...bookingForm, animalCount: Number(e.target.value) || 1 })}
                    className="rounded-[16px] text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Nom complet *</Label>
                  <Input
                    placeholder="Votre nom"
                    value={bookingForm.clientName}
                    onChange={(e) => setBookingForm({ ...bookingForm, clientName: e.target.value })}
                    className="rounded-[16px] text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Téléphone direct *</Label>
                  <Input
                    placeholder="+226 70 00 00 00"
                    value={bookingForm.phone}
                    onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                    className="rounded-[16px] text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Motif ou symptômes observés</Label>
                <Textarea
                  placeholder="Ex: Fièvre observée depuis hier, perte d'appétit, toux..."
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  rows={2}
                  className="rounded-[16px] text-xs"
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-[16px] bg-[#F97316] hover:bg-[#ea580c] text-white text-xs font-bold h-11 shadow-lg shadow-orange-500/25"
              >
                Confirmer la réservation d'intervention
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL DE DEMANDE DE DEVIS
      ══════════════════════════════════════════════════════ */}
      {partnerForAction && (
        <Dialog open={quoteModalOpen} onOpenChange={setQuoteModalOpen}>
          <DialogContent className="max-w-md rounded-[24px]">
            <DialogHeader>
              <DialogTitle className="font-heading font-black text-lg">
                Demander un devis vétérinaire
              </DialogTitle>
              <DialogDescription className="text-xs">
                Destinataire : <span className="font-bold text-foreground">{partnerForAction.name}</span>
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmitQuote} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Prestation ou formule concernée</Label>
                <Input
                  value={quoteForm.serviceName}
                  onChange={(e) => setQuoteForm({ ...quoteForm, serviceName: e.target.value })}
                  className="rounded-[16px] text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Votre Nom *</Label>
                  <Input
                    placeholder="Nom complet"
                    value={quoteForm.clientName}
                    onChange={(e) => setQuoteForm({ ...quoteForm, clientName: e.target.value })}
                    className="rounded-[16px] text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Téléphone *</Label>
                  <Input
                    placeholder="+226 70 00 00 00"
                    value={quoteForm.phone}
                    onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                    className="rounded-[16px] text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Taille du cheptel (têtes)</Label>
                <Input
                  type="number"
                  min={1}
                  value={quoteForm.animalCount}
                  onChange={(e) => setQuoteForm({ ...quoteForm, animalCount: Number(e.target.value) || 1 })}
                  className="rounded-[16px] text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Description détaillée du besoin *</Label>
                <Textarea
                  placeholder="Décrivez les soins recherchés, le lieu de l'exploitation et la période souhaitée..."
                  value={quoteForm.description}
                  onChange={(e) => setQuoteForm({ ...quoteForm, description: e.target.value })}
                  rows={3}
                  className="rounded-[16px] text-xs"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-[16px] bg-[#111827] dark:bg-white text-white dark:text-[#111827] hover:bg-[#F97316] text-xs font-bold h-11"
              >
                Envoyer ma demande de devis
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
};

export default LivestockServicesPage;
