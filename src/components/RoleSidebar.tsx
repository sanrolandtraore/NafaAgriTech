import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import {
  GraduationCap, Sprout, LayoutDashboard, MapPin, LogOut, User, Calculator,
  Users, Package, BarChart3, Settings, Tractor,
  Beef, Heart, Baby, Utensils, Wallet, Building2, Compass, Handshake, ClipboardList,
  Award, Store, Eye, Microscope, FileText, BookOpen, Sparkles,
  Briefcase, ShieldCheck, Landmark, FolderKanban, FlaskConical, BadgeCheck,
  Home, Activity, Megaphone, Camera, Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { PartnerProfileType, PARTNER_PROFILES } from "@/lib/partnerProfiles";
import { RealModuleIcon } from "@/components/ui/RealModuleIcon";
import { prefetchRoute } from "@/lib/routePrefetcher";
import RealAiConfigModal from "@/components/ai/RealAiConfigModal";
import { realAiService } from "@/lib/realAiService";

export type NavItem = {
  to: string;
  labelKey: string;
  label?: string;
  icon: React.ElementType;
  section?: string;
};

/** Module « Agriculteur » (Strictement limité au Marché des Services : Réserver, Commander, Louer) */
export const agriculteurNav: NavItem[] = [
  { to: "/dashboard/marketplace", labelKey: "Marché des Services", icon: Store },
];

/** Module « Éleveur » (Pôle Cheptel strict : Animaux, Santé, Reproduction, Alimentation, Finance) */
export const eleveurNav: NavItem[] = [
  { to: "/dashboard", labelKey: "Tableau de bord", icon: LayoutDashboard },
  { to: "/dashboard/animals", labelKey: "Cheptel & Animaux", icon: Beef },
  { to: "/dashboard/animal-counting", labelKey: "Comptage Intelligent d'Animaux", icon: Camera },
  { to: "/dashboard/animal-health", labelKey: "Santé & Vaccinations", icon: Heart },
  { to: "/dashboard/animal-reproduction", labelKey: "Reproduction & Vêlage", icon: Baby },
  { to: "/dashboard/animal-feeding", labelKey: "Alimentation & Rations", icon: Utensils },
  { to: "/dashboard/livestock-finance", labelKey: "Finances du Cheptel", icon: Wallet },
  { to: "/dashboard/livestock-report", labelKey: "Rapport d'activité", icon: FileText },
  { to: "/dashboard/livestock-services", labelKey: "Réserver un vétérinaire", icon: ClipboardList },
  { to: "/dashboard/settings", labelKey: "Paramètres", icon: Settings },
];

/** 1. Profil Partenaire : Fournisseur d'Intrants, Matériel & Équipements */
export const fournisseurNav: NavItem[] = [
  { to: "/dashboard", labelKey: "Tableau de bord", icon: LayoutDashboard },
  { to: "/dashboard/partner-space", labelKey: "Mon Espace Partenaire (Offres & Devis)", icon: Building2, section: "Visibilité & Gestion" },
  { to: "/dashboard/partenaire-mes-offres", labelKey: "Mes offres & Ventes", icon: Store, section: "Vente & Intrants" },
  { to: "/dashboard/marketplace?cat=machinisme", labelKey: "Matériel & Intrants (Vente & Location)", icon: Tractor, section: "Vente & Intrants" },
  { to: "/dashboard/quote-requests", labelKey: "Demandes de devis", icon: FileText, section: "Vente & Intrants" },
  { to: "/dashboard/provider-clients", labelKey: "Portefeuille Clients", icon: Users, section: "Vente & Intrants" },
  { to: "/dashboard/revenus", labelKey: "Chiffre d'affaires & Recettes", icon: Wallet, section: "Vente & Intrants" },
  { to: "/dashboard/partenaire-fournisseurs", labelKey: "Fournisseurs", icon: Package, section: "Approvisionnement" },
  { to: "/dashboard/partenaire-kyc", labelKey: "Vérification KYC & Certification", icon: BadgeCheck, section: "Visibilité & Gestion" },
  { to: "/dashboard/partenaire-abonnement", labelKey: "Abonnement partenaire", icon: Sparkles, section: "Visibilité & Gestion" },
  { to: "/dashboard/settings", labelKey: "Paramètres", icon: Settings, section: "Visibilité & Gestion" },
];

/** Alias de rétrocompatibilité : le module Machinisme & Travaux est consolidé dans Intrants & Matériel */
export const machinismeNav: NavItem[] = fournisseurNav;

/** 3. Profil Cabinet d'Agronomie & Conseil Technique (Suite complète des outils techniques) */
export const agronomeNav: NavItem[] = [
  { to: "/dashboard", labelKey: "Tableau de bord", icon: LayoutDashboard },
  { to: "/dashboard/services", labelKey: "Suite d'Outils Agronomiques", icon: Compass, section: "Expertise Agronomique" },
  { to: "/dashboard/crop-planning", labelKey: "Planification des cultures", icon: Calculator, section: "Expertise Agronomique" },
  { to: "/dashboard/parcels", labelKey: "Parcelles & Cultures", icon: Sprout, section: "Expertise Agronomique" },
  { to: "/dashboard/scouting", labelKey: "Suivi des Parcelles", icon: Eye, section: "Expertise Agronomique" },
  { to: "/dashboard/inspections", labelKey: "Inspection Intelligente", icon: Eye, section: "Expertise Agronomique" },
  { to: "/dashboard/field-designer", labelKey: "NAFA Field Designer", icon: Compass, section: "Expertise Agronomique" },
  { to: "/dashboard/expert-diagnosis", labelKey: "Diagnostic Avancé", icon: Microscope, section: "Expertise Agronomique" },
  { to: "/dashboard/expert-prescriptions", labelKey: "Prescriptions", icon: FileText, section: "Expertise Agronomique" },
  { to: "/dashboard/expert-calculator", labelKey: "Calculateur agricole", icon: Calculator, section: "Expertise Agronomique" },
  { to: "/dashboard/expert-cartography", labelKey: "Cartographie GPS", icon: MapPin, section: "Expertise Agronomique" },
  { to: "/dashboard/gps-survey", labelKey: "Levé de coordonnées GPS", icon: Navigation, section: "Expertise Agronomique" },
  { to: "/dashboard/crop-library", labelKey: "Fiches techniques", icon: BookOpen, section: "Expertise Agronomique" },
  { to: "/dashboard/education", labelKey: "Formation professionnelle", icon: GraduationCap, section: "Expertise Agronomique" },
  { to: "/dashboard/expert-clients", labelKey: "Portefeuille Clients", icon: Users, section: "Clients & Conseils" },
  { to: "/dashboard/expert-analytics", labelKey: "Analytique & Performances", icon: BarChart3, section: "Clients & Conseils" },
  { to: "/dashboard/quote-requests", labelKey: "Demandes de devis", icon: FileText, section: "Clients & Conseils" },
  { to: "/dashboard/identite-professionnelle", labelKey: "Identité & Documents", icon: Building2, section: "Visibilité & Gestion" },
  { to: "/dashboard/partner-space", labelKey: "Mon Espace Partenaire (Offres & Devis)", icon: Building2, section: "Visibilité & Gestion" },
  { to: "/dashboard/partenaire-kyc", labelKey: "Vérification KYC & Certification", icon: BadgeCheck, section: "Visibilité & Gestion" },
  { to: "/dashboard/partenaire-abonnement", labelKey: "Abonnement partenaire", icon: Sparkles, section: "Visibilité & Gestion" },
  { to: "/dashboard/settings", labelKey: "Paramètres", icon: Settings, section: "Visibilité & Gestion" },
];

/** 4. Profil Partenaire : Clinique Vétérinaire, Santé Animale & Zootechnie (Prestations Vétérinaires) */
export const veterinaireNav: NavItem[] = [
  { to: "/dashboard", labelKey: "Tableau de bord", icon: LayoutDashboard },
  { to: "/dashboard/partner-space", labelKey: "Mon Espace Partenaire (Offres & Devis)", icon: Building2, section: "Visibilité & Gestion" },
  { to: "/dashboard/livestock-services", labelKey: "Catalogue & Réservations Vétérinaires", icon: ClipboardList, section: "Prestations Vétérinaires" },
  { to: "/dashboard/animal-counting", labelKey: "Comptage & Densité d'Élevage", icon: Camera, section: "Prestations Vétérinaires" },
  { to: "/dashboard/partenaire-mes-offres", labelKey: "Mes Services & Prestations", icon: Store, section: "Prestations Vétérinaires" },
  { to: "/dashboard/interventions", labelKey: "Interventions & Soins terrain", icon: Activity, section: "Prestations Vétérinaires" },
  { to: "/dashboard/quote-requests", labelKey: "Demandes de devis & Réservations", icon: FileText, section: "Prestations Vétérinaires" },
  { to: "/dashboard/provider-clients", labelKey: "Portefeuille Éleveurs & Clients", icon: Users, section: "Prestations Vétérinaires" },
  { to: "/dashboard/revenus", labelKey: "Chiffre d'affaires & Règlements", icon: Wallet, section: "Prestations Vétérinaires" },
  { to: "/dashboard/partenaire-kyc", labelKey: "Agrément & Vérification Ordre", icon: BadgeCheck, section: "Visibilité & Gestion" },
  { to: "/dashboard/partenaire-abonnement", labelKey: "Abonnement partenaire", icon: Sparkles, section: "Visibilité & Gestion" },
  { to: "/dashboard/settings", labelKey: "Paramètres", icon: Settings, section: "Visibilité & Gestion" },
];

/** 5. Profil Partenaire : Banque, Microfinance & Assurance Agricole (Finance & Assurance exclusivement) */
export const institutionNav: NavItem[] = [
  { to: "/dashboard", labelKey: "Tableau de bord", icon: LayoutDashboard },
  { to: "/dashboard/partenaire-mes-offres", labelKey: "Mes Services & Produits Financiers", icon: Store, section: "Finance & Crédit" },
  { to: "/dashboard/partenaire-assurance", labelKey: "Assurance agricole", icon: ShieldCheck, section: "Finance & Crédit" },
  { to: "/dashboard/partenaire-programmes", labelKey: "Programmes & Subventions", icon: FolderKanban, section: "Finance & Crédit" },
  { to: "/dashboard/partenaire-marketing", labelKey: "Campagnes Pub & Marketing", icon: Megaphone, section: "Marketing & Visibilité" },
  { to: "/dashboard/partenaire-demandes", labelKey: "Demandes de Financement", icon: FileText, section: "Dossiers Clients" },
  { to: "/dashboard/partenaire-kyc", labelKey: "Vérification KYC & Agrément", icon: BadgeCheck, section: "Conformité & Compte" },
  { to: "/dashboard/partenaire-abonnement", labelKey: "Abonnement partenaire", icon: Sparkles, section: "Conformité & Compte" },
  { to: "/dashboard/settings", labelKey: "Paramètres", icon: Settings, section: "Conformité & Compte" },
];

/**
 * Module « Espace Partenaire » (Isolation totale) :
 * Dédié exclusivement aux 11 sections réglementaires du partenaire.
 */
export const partenaireNav: NavItem[] = [
  { to: "/dashboard/partner-space?tab=dashboard", labelKey: "Tableau de bord", icon: LayoutDashboard },
  { to: "/dashboard/partner-space?tab=presentation", labelKey: "Présentation", icon: Building2 },
  { to: "/dashboard/partner-space?tab=services", labelKey: "Services", icon: ClipboardList },
  { to: "/dashboard/partner-space?tab=produits", labelKey: "Produits", icon: Package },
  { to: "/dashboard/partner-space?tab=realisations", labelKey: "Réalisations", icon: Award },
  { to: "/dashboard/partner-space?tab=galerie", labelKey: "Galerie", icon: Eye },
  { to: "/dashboard/partner-space?tab=avis", labelKey: "Avis", icon: Heart },
  { to: "/dashboard/partner-space?tab=contact", labelKey: "Contact", icon: Handshake },
  { to: "/dashboard/partner-space?tab=devis", labelKey: "Devis", icon: FileText },
  { to: "/dashboard/partner-space?tab=commandes", labelKey: "Commandes", icon: Store },
  { to: "/dashboard/partner-space?tab=statistiques", labelKey: "Statistiques", icon: BarChart3 },
];

export const roleDisplayNames: Record<string, string> = {
  agriculteur: "Agriculteur",
  eleveur: "Éleveur",
  formation: "Partenaire Formation",
  agent_technique: "Agronome & Conseil",
  expert: "Agronome & Conseil",
  partenaire: "Partenaire",
  admin: "Administrateur",
  manager: "Gestionnaire",
  farmer: "Agriculteur",
  viewer: "Observateur",
};

export const roleLabelKeys: Record<string, string> = {
  agriculteur: "roles.agriculteur",
  eleveur: "roles.eleveur",
  formation: "roles.partenaire",
  agent_technique: "roles.partenaire",
  expert: "roles.partenaire",
  partenaire: "roles.partenaire",
  admin: "roles.admin",
  manager: "roles.manager",
  farmer: "roles.agriculteur",
  viewer: "roles.viewer",
};

export const roleIcons: Record<string, React.ElementType> = {
  agriculteur: Store,
  eleveur: Beef,
  formation: Handshake,
  agent_technique: Microscope,
  expert: Microscope,
  partenaire: Store,
  admin: LayoutDashboard,
  manager: LayoutDashboard,
  farmer: Store,
  viewer: BarChart3,
};

export const partnerTypeIcons: Record<PartnerProfileType, React.ElementType> = {
  fournisseur_intrants: FlaskConical,
  expert_agronome: Microscope,
  elevage_veterinaire: Beef,
  institution_agri: Landmark,
  polyvalent: Handshake,
};

/**
 * Bulletproof mapping to prevent any raw translation key or "nav." from ever showing in the UI.
 */
export const getNavLabel = (item: NavItem, t?: (key: string) => string): string => {
  const key = item.label || item.labelKey;
  if (!key) return "";

  const dictionary: Record<string, string> = {
    "nav.aiDiagnosis": "Diagnostic Avancé",
    "nav.prescriptions": "Prescriptions",
    "nav.scouting": "Suivi des Parcelles",
    "nav.calculator": "Calculateur agricole",
    "nav.gpsMapping": "Cartographie GPS",
    "nav.technicalSheets": "Fiches techniques",
    "nav.quoteRequests": "Demandes de devis",
    "Vitrine Publique": "Vitrine publique",
    "nav.providerSubscription": "Abonnement partenaire",
    "nav.settings": "Paramètres",
    "nav.dashboard": "Tableau de bord",
    "nav.planning": "Planification",
    "nav.expertServices": "Suite d'Outils Agronomiques",
    "nav.animals": "Animaux",
    "nav.health": "Santé",
    "nav.reproduction": "Reproduction",
    "nav.feeding": "Alimentation",
    "nav.vetServices": "Services Vétérinaires",
    "nav.export": "Export PDF/CSV",
    "nav.myOffers": "Mes offres & Ventes",
    "nav.providerClients": "Portefeuille Clients",
    "nav.revenue": "Chiffre d'affaires & Recettes",
    "nav.suppliers": "Fournisseurs",
    "nav.equipmentFleet": "Matériel & Intrants (Vente & Location)",
    "Matériel & Intrants (Vente & Location)": "Matériel & Intrants (Vente & Location)",
    "Parc matériel & Location": "Matériel & Intrants (Vente & Location)",
    "nav.missions": "Missions & Travaux",
    "nav.interventions": "Interventions terrain",
    "nav.banking": "Services bancaires agricoles",
    "nav.insurance": "Assurance agricole",
    "nav.programs": "Programmes & Projets",
    "nav.partners": "Annuaire Partenaires",
    "Marché des Services": "Marché des Services",
    "Marketplace des Services": "Marketplace des Services",
    "Finances du Cheptel": "Finances du Cheptel",
    "Réserver un vétérinaire": "Réserver un vétérinaire",
    "Formation professionnelle": "Formation professionnelle",
    "Portefeuille Clients": "Portefeuille Clients",
    "Analytique & Performances": "Analytique & Performances",
    "Inspection Intelligente": "Inspection Intelligente",
    "NAFA Field Designer": "NAFA Field Designer",
    "Diagnostic Avancé": "Diagnostic Avancé",
    "Identité & Documents": "Identité & Documents",
    "Mes Services & Produits Financiers": "Mes Services & Produits Financiers",
    "Rapport d'activité": "Rapport d'activité",
    "Campagnes Pub & Marketing": "Campagnes Pub & Marketing",
    "Demandes de Financement": "Demandes de Financement",
    "Programmes & Subventions": "Programmes & Subventions",
    "Vérification KYC & Agrément": "Vérification KYC & Agrément",
    "Levé de coordonnées GPS": "Levé de coordonnées GPS",
  };

  if (dictionary[key]) {
    return dictionary[key];
  }

  if (!key.startsWith("nav.")) {
    return key;
  }

  if (t) {
    const translated = t(key);
    if (translated && !translated.startsWith("nav.")) {
      return translated;
    }
  }

  const raw = key.replace(/^nav\./, "");
  return raw.charAt(0).toUpperCase() + raw.slice(1);
};

/**
 * Routeur de navigation par rôle et spécialisation partenaire.
 * Les comptes partenaires ne sont PAS unifiés : chaque type a son espace dédié.
 */
export function getNavForRole(role: string | null, partnerType?: string | null): { main: NavItem[] } {
  switch (role) {
    case "eleveur":
      return { main: eleveurNav };
    case "agriculteur":
    case "farmer":
      return { main: agriculteurNav };
    case "agent_technique":
    case "expert":
      return { main: agronomeNav };
    case "partenaire":
      if (partnerType === "expert_agronome") return { main: agronomeNav };
      if (partnerType === "elevage_veterinaire") return { main: veterinaireNav };
      if (partnerType === "fournisseur_intrants" || partnerType === "machinisme_travaux") return { main: fournisseurNav };
      if (partnerType === "institution_agri") return { main: institutionNav };
      return { main: partenaireNav };
    case "formation":
    case "admin":
    case "manager":
    default:
      if (partnerType === "expert_agronome") return { main: agronomeNav };
      if (partnerType === "elevage_veterinaire") return { main: veterinaireNav };
      if (partnerType === "fournisseur_intrants" || partnerType === "machinisme_travaux") return { main: fournisseurNav };
      if (partnerType === "institution_agri") return { main: institutionNav };
      return { main: partenaireNav };
  }
}

interface SidebarContentProps {
  onNavigate?: () => void;
}

export const SidebarNavContent = ({ onNavigate }: SidebarContentProps) => {
  const { profile, signOut, primaryRole, partnerType } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [showAiModal, setShowAiModal] = useState(false);
  const [isAiConfigured, setIsAiConfigured] = useState(realAiService.isConfigured());

  const effectiveRole = primaryRole;
  const nav = getNavForRole(effectiveRole, partnerType);
  const isPartner = effectiveRole === "partenaire" || !["agriculteur", "farmer", "eleveur"].includes(effectiveRole || "");
  const partnerMeta = isPartner && partnerType ? PARTNER_PROFILES[partnerType] : null;
  const RoleIcon = isPartner && partnerType
    ? partnerTypeIcons[partnerType] || Handshake
    : roleIcons[effectiveRole || "agriculteur"] || Calculator;

  const currentRoleLabel = isPartner && partnerMeta
    ? partnerMeta.shortLabel
    : roleDisplayNames[primaryRole || "agriculteur"] || (roleLabelKeys[primaryRole || "agriculteur"] ? t(roleLabelKeys[primaryRole || "agriculteur"]) : "Agriculteur");

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Header Premium Agrandie */}
      <div className="flex items-center gap-3.5 px-5 py-4 border-b border-sidebar-border/80">
        <div className="h-12 w-12 rounded-2xl overflow-hidden bg-white shadow-xs border border-emerald-500/20 p-1 flex items-center justify-center shrink-0">
          <img src={logo} alt="NAFA - AGRITECH" className="h-full w-full object-contain rounded-xl" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-extrabold text-sidebar-primary tracking-wide flex items-center gap-1.5 truncate">
            <RoleIcon className="h-3.5 w-3.5 shrink-0 text-sidebar-primary" />
            <span className="truncate">{currentRoleLabel}</span>
          </span>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 truncate mt-0.5">
            NAFA - AGRITECH
          </span>
        </div>
      </div>

      {/* Navigation épurée avec polices agrandies et libellés français clairs */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
        {nav.main.map((item, index) => {
          const { to, icon: Icon, section } = item;
          const isFirstOfSection = Boolean(section && (index === 0 || nav.main[index - 1]?.section !== section));
          const currentPath = `${location.pathname}${location.search}`;
          const isAgriculteurHome = effectiveRole === "agriculteur" || effectiveRole === "farmer";
          const isActive = (
            to === "/dashboard"
              ? (location.pathname === "/dashboard" && !location.search)
              : to.includes("?")
                ? (currentPath === to || (to.includes("tab=dashboard") && location.pathname === "/dashboard/partner-space" && !location.search))
                : to === "/dashboard/marketplace"
                  ? (location.pathname.startsWith("/dashboard/marketplace") || (isAgriculteurHome && location.pathname === "/dashboard"))
                  : location.pathname.startsWith(to)
          );

          const displayLabel = getNavLabel(item, t);

          const iconType =
            to.includes("parcels") || to.includes("crop") ? "crops"
            : to.includes("animal") || to.includes("livestock") ? (to.includes("health") || to.includes("services") ? "veterinary" : "livestock")
            : to.includes("field-designer") || to.includes("cartography") || to.includes("scouting") || to.includes("services") ? "gps"
            : to.includes("inspections") || to.includes("diagnosis") ? "diagnostic"
            : to.includes("banque") || to.includes("assurance") || to.includes("programme") || to.includes("finance") || to.includes("abonnement") || to.includes("kyc") || to.includes("revenus") ? "finance"
            : to.includes("marketplace") || to.includes("offres") || to.includes("clients") ? "marketplace"
            : to.includes("education") ? "education"
            : to.includes("calculator") || to.includes("devis") || to.includes("quote") || to.includes("identite") || to.includes("report") ? "quote"
            : to.includes("fournisseur") || to.includes("machinisme") ? "tractor"
            : null;

          return (
            <div key={to} className="space-y-1">
              {isFirstOfSection && (
                <div className="pt-4 pb-1.5 px-3 text-xs font-bold uppercase tracking-wider text-sidebar-foreground/50 border-t border-sidebar-border/40 first:border-0 first:pt-0">
                  {section}
                </div>
              )}
              <Link
                to={to}
                onClick={onNavigate}
                onMouseEnter={() => prefetchRoute(to)}
                onTouchStart={() => prefetchRoute(to)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 group",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary shadow-xs font-bold border-l-4 border-sidebar-primary"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
                )}
              >
                {iconType ? (
                  <RealModuleIcon
                    type={iconType}
                    size="sm"
                    className="shrink-0 group-hover:scale-110 group-hover:rotate-2 transition-transform shadow-xs"
                  />
                ) : (
                  <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/70")} />
                )}
                <span className="leading-snug">{displayLabel}</span>
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Footer épuré sans navigation parasite */}
      <div className="border-t border-sidebar-border/80 p-4 space-y-2">
        <Link
          to="/dashboard/profile"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-sidebar-accent transition-colors"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-accent shrink-0 border border-sidebar-border/40">
            <User className="h-5 w-5 text-sidebar-accent-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">{profile?.full_name || "Utilisateur"}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">Mon profil & compte</p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setShowAiModal(true)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-semibold text-sidebar-foreground/85 hover:text-sidebar-foreground hover:bg-sidebar-accent/70 rounded-xl transition-colors border border-amber-500/20 bg-amber-500/5 text-left"
          title="Configurer le modèle d'IA Réelle (Claude 3.5 Sonnet / OpenAI / Gemini)"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
            <span>Moteur IA Réelle (Claude)</span>
          </span>
          <span className={cn("h-2 w-2 rounded-full", isAiConfigured ? "bg-emerald-500" : "bg-amber-500")} />
        </button>

        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-xl transition-colors"
        >
          <Home className="h-4 w-4 text-[#F97316]" />
          <span>Retour sur la page d'accueil</span>
        </Link>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground/75 hover:text-destructive hover:bg-destructive/10 text-sm font-medium h-10 rounded-xl px-3"
          onClick={() => { onNavigate?.(); signOut(); }}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
      </div>

      <RealAiConfigModal
        open={showAiModal}
        onOpenChange={(open) => {
          setShowAiModal(open);
          setIsAiConfigured(realAiService.isConfigured());
        }}
      />
    </div>
  );
};

// Desktop sidebar
export const RoleSidebar = () => (
  <aside className="hidden lg:flex h-screen w-72 flex-col border-r border-sidebar-border/80 shrink-0">
    <SidebarNavContent />
  </aside>
);
