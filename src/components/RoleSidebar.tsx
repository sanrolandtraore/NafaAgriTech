import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import {
  GraduationCap, Sprout, LayoutDashboard, MapPin, Wheat, Activity, DollarSign, LogOut, User, Calculator,
  Users, Wrench, Package, CalendarDays, BarChart3, Download, Settings, Tractor,
  Beef, Heart, Baby, Utensils, Wallet, Building2, Compass, Handshake, ClipboardList,
  FolderOpen, Layers, Award, Store, Eye, Microscope, FileText, BookOpen, Sparkles,
  Briefcase, ShieldCheck, Landmark, FolderKanban, FlaskConical, BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { PartnerProfileType, PARTNER_PROFILES } from "@/lib/partnerProfiles";

export type NavItem = {
  to: string;
  labelKey: string;
  label?: string;
  icon: React.ElementType;
  section?: string;
};

/** Module « Agriculteur » (Pôle Végétal strict : Cultures, Parcelles, Irrigation, Fiches INERA) */
export const agriculteurNav: NavItem[] = [
  { to: "/dashboard", labelKey: "Tableau de bord", icon: LayoutDashboard },
  { to: "/dashboard/crop-planning", labelKey: "Planification des cultures", icon: Calculator },
  { to: "/dashboard/crops", labelKey: "Cultures & Parcelles", icon: Sprout },
  { to: "/dashboard/scouting", labelKey: "Suivi des Parcelles", icon: Eye },
  { to: "/dashboard/marketplace", labelKey: "Marketplace Vitrine (Acheter, Louer, Services)", icon: Store },
  { to: "/dashboard/genius", labelKey: "NAFA Genius IA (Végétal)", icon: Sparkles },
  { to: "/dashboard/crop-library", labelKey: "Fiches Techniques INERA", icon: BookOpen },
  { to: "/dashboard/settings", labelKey: "Paramètres", icon: Settings },
];

/** Module « Éleveur » (Pôle Vétérinaire & Cheptel strict : Animaux, Santé, Nutrition, Soins) */
export const eleveurNav: NavItem[] = [
  { to: "/dashboard", labelKey: "Tableau de bord", icon: LayoutDashboard },
  { to: "/dashboard/animals", labelKey: "Cheptel & Animaux", icon: Beef },
  { to: "/dashboard/animal-health", labelKey: "Santé & Vaccinations", icon: Heart },
  { to: "/dashboard/animal-reproduction", labelKey: "Reproduction & Vêlage", icon: Baby },
  { to: "/dashboard/animal-feeding", labelKey: "Alimentation & Rations", icon: Utensils },
  { to: "/dashboard/marketplace", labelKey: "Marketplace Vitrine (Acheter, Louer, Services)", icon: Store },
  { to: "/dashboard/livestock-services", labelKey: "Services Vétérinaires", icon: ClipboardList },
  { to: "/dashboard/settings", labelKey: "Paramètres", icon: Settings },
  { to: "/dashboard/export", labelKey: "Export PDF/CSV", icon: Download },
];

/** 1. Profil Partenaire : Fournisseur d'Intrants & Semences */
export const fournisseurNav: NavItem[] = [
  { to: "/dashboard", labelKey: "Tableau de bord", icon: LayoutDashboard },
  { to: "/dashboard/partner-space", labelKey: "Mon Espace Partenaire (Offres & Devis)", icon: Building2, section: "Visibilité & Gestion" },
  { to: "/dashboard/partenaire-mes-offres", labelKey: "Mes offres & Ventes", icon: Store, section: "Vente & Intrants" },
  { to: "/dashboard/quote-requests", labelKey: "Demandes de devis", icon: FileText, section: "Vente & Intrants" },
  { to: "/dashboard/provider-clients", labelKey: "Portefeuille Clients", icon: Users, section: "Vente & Intrants" },
  { to: "/dashboard/revenus", labelKey: "Chiffre d'affaires & Recettes", icon: Wallet, section: "Vente & Intrants" },
  { to: "/dashboard/partenaire-fournisseurs", labelKey: "Fournisseurs", icon: Package, section: "Approvisionnement" },
  { to: "/dashboard/partenaire-kyc", labelKey: "Vérification KYC & Certification", icon: BadgeCheck, section: "Visibilité & Gestion" },
  { to: "/dashboard/partenaire-abonnement", labelKey: "Abonnement partenaire", icon: Sparkles, section: "Visibilité & Gestion" },
  { to: "/dashboard/settings", labelKey: "Paramètres", icon: Settings, section: "Visibilité & Gestion" },
];

/** 2. Profil Partenaire : Machinisme & Travaux Agricoles (Location & Chantiers) */
export const machinismeNav: NavItem[] = [
  { to: "/dashboard", labelKey: "Tableau de bord", icon: LayoutDashboard },
  { to: "/dashboard/partner-space", labelKey: "Mon Espace Partenaire (Offres & Devis)", icon: Building2, section: "Visibilité & Gestion" },
  { to: "/dashboard/equipment", labelKey: "Parc matériel & Location", icon: Tractor, section: "Flotte & Chantiers" },
  { to: "/dashboard/missions", labelKey: "Missions & Travaux", icon: Briefcase, section: "Flotte & Chantiers" },
  { to: "/dashboard/interventions", labelKey: "Interventions terrain", icon: ClipboardList, section: "Flotte & Chantiers" },
  { to: "/dashboard/quote-requests", labelKey: "Demandes de devis", icon: FileText, section: "Flotte & Chantiers" },
  { to: "/dashboard/provider-clients", labelKey: "Portefeuille Clients", icon: Users, section: "Flotte & Chantiers" },
  { to: "/dashboard/revenus", labelKey: "Chiffre d'affaires & Recettes", icon: Wallet, section: "Flotte & Chantiers" },
  { to: "/dashboard/partenaire-kyc", labelKey: "Vérification KYC & Certification", icon: BadgeCheck, section: "Visibilité & Gestion" },
  { to: "/dashboard/partenaire-abonnement", labelKey: "Abonnement partenaire", icon: Sparkles, section: "Visibilité & Gestion" },
  { to: "/dashboard/settings", labelKey: "Paramètres", icon: Settings, section: "Visibilité & Gestion" },
];

/** 3. Profil Partenaire : Cabinet d'Agronomie & Conseil Technique */
export const agronomeNav: NavItem[] = [
  { to: "/dashboard", labelKey: "Tableau de bord", icon: LayoutDashboard },
  { to: "/dashboard/partner-space", labelKey: "Mon Espace Partenaire (Offres & Devis)", icon: Building2, section: "Visibilité & Gestion" },
  { to: "/dashboard/genius", labelKey: "NAFA Genius IA", icon: Sparkles, section: "Expertise Agronomique" },
  { to: "/dashboard/expert-diagnosis", labelKey: "Diagnostic IA", icon: Microscope, section: "Expertise Agronomique" },
  { to: "/dashboard/expert-prescriptions", labelKey: "Prescriptions", icon: FileText, section: "Expertise Agronomique" },
  { to: "/dashboard/scouting", labelKey: "Inspection terrain", icon: Eye, section: "Expertise Agronomique" },
  { to: "/dashboard/expert-calculator", labelKey: "Calculateur agricole", icon: Calculator, section: "Expertise Agronomique" },
  { to: "/dashboard/expert-cartography", labelKey: "Cartographie GPS", icon: MapPin, section: "Expertise Agronomique" },
  { to: "/dashboard/crop-library", labelKey: "Fiches techniques", icon: BookOpen, section: "Expertise Agronomique" },
  { to: "/dashboard/quote-requests", labelKey: "Demandes de devis", icon: FileText, section: "Clients & Conseils" },
  { to: "/dashboard/partenaire-kyc", labelKey: "Vérification KYC & Certification", icon: BadgeCheck, section: "Visibilité & Gestion" },
  { to: "/dashboard/partenaire-abonnement", labelKey: "Abonnement partenaire", icon: Sparkles, section: "Visibilité & Gestion" },
  { to: "/dashboard/settings", labelKey: "Paramètres", icon: Settings, section: "Visibilité & Gestion" },
];

/** 4. Profil Partenaire : Santé Animale, Élevage & Zootechnie */
export const veterinaireNav: NavItem[] = [
  { to: "/dashboard", labelKey: "Tableau de bord", icon: LayoutDashboard },
  { to: "/dashboard/partner-space", labelKey: "Mon Espace Partenaire (Offres & Devis)", icon: Building2, section: "Visibilité & Gestion" },
  { to: "/dashboard/animals", labelKey: "Animaux", icon: Beef, section: "Pôle Vétérinaire & Cheptel" },
  { to: "/dashboard/animal-health", labelKey: "Santé", icon: Heart, section: "Pôle Vétérinaire & Cheptel" },
  { to: "/dashboard/animal-feeding", labelKey: "Alimentation", icon: Utensils, section: "Pôle Vétérinaire & Cheptel" },
  { to: "/dashboard/animal-reproduction", labelKey: "Reproduction", icon: Baby, section: "Pôle Vétérinaire & Cheptel" },
  { to: "/dashboard/livestock-services", labelKey: "Services Vétérinaires", icon: ClipboardList, section: "Pôle Vétérinaire & Cheptel" },
  { to: "/dashboard/quote-requests", labelKey: "Demandes de devis", icon: FileText, section: "Clients & Soins" },
  { to: "/dashboard/partenaire-kyc", labelKey: "Vérification KYC & Certification", icon: BadgeCheck, section: "Visibilité & Gestion" },
  { to: "/dashboard/partenaire-abonnement", labelKey: "Abonnement partenaire", icon: Sparkles, section: "Visibilité & Gestion" },
  { to: "/dashboard/settings", labelKey: "Paramètres", icon: Settings, section: "Visibilité & Gestion" },
];

/** 5. Profil Partenaire : Banque, Microfinance & Assurance Agricole */
export const institutionNav: NavItem[] = [
  { to: "/dashboard", labelKey: "Tableau de bord", icon: LayoutDashboard },
  { to: "/dashboard/partner-space", labelKey: "Mon Espace Partenaire (Offres & Devis)", icon: Building2, section: "Visibilité & Gestion" },
  { to: "/dashboard/partenaire-banques", labelKey: "Services bancaires agricoles", icon: Landmark, section: "Finance & Assurance" },
  { to: "/dashboard/partenaire-assurance", labelKey: "Assurance agricole", icon: ShieldCheck, section: "Finance & Assurance" },
  { to: "/dashboard/partenaire-programmes", labelKey: "Programmes & Projets", icon: FolderKanban, section: "Finance & Assurance" },
  { to: "/dashboard/partners-directory", labelKey: "Annuaire Partenaires", icon: Handshake, section: "Finance & Assurance" },
  { to: "/dashboard/quote-requests", labelKey: "Demandes de devis", icon: FileText, section: "Dossiers & Crédits" },
  { to: "/dashboard/partenaire-kyc", labelKey: "Vérification KYC & Certification", icon: BadgeCheck, section: "Visibilité & Gestion" },
  { to: "/dashboard/partenaire-abonnement", labelKey: "Abonnement partenaire", icon: Sparkles, section: "Visibilité & Gestion" },
  { to: "/dashboard/settings", labelKey: "Paramètres", icon: Settings, section: "Visibilité & Gestion" },
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
  agent_technique: "Expert Agronome",
  expert: "Expert Agronome",
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
  agriculteur: Calculator,
  eleveur: Beef,
  formation: Handshake,
  agent_technique: Microscope,
  expert: Microscope,
  partenaire: Store,
  admin: LayoutDashboard,
  manager: LayoutDashboard,
  farmer: Calculator,
  viewer: BarChart3,
};

export const partnerTypeIcons: Record<PartnerProfileType, React.ElementType> = {
  fournisseur_intrants: FlaskConical,
  machinisme_travaux: Tractor,
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
    "nav.aiDiagnosis": "Diagnostic IA",
    "nav.prescriptions": "Prescriptions",
    "nav.scouting": "Inspection terrain",
    "nav.calculator": "Calculateur agricole",
    "nav.gpsMapping": "Cartographie GPS",
    "nav.technicalSheets": "Fiches techniques",
    "nav.quoteRequests": "Demandes de devis",
    "Vitrine Publique": "Vitrine publique",
    "nav.providerSubscription": "Abonnement partenaire",
    "nav.settings": "Paramètres",
    "nav.dashboard": "Tableau de bord",
    "nav.planning": "Planification",
    "nav.expertServices": "Services Experts",
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
    "nav.equipmentFleet": "Parc matériel & Location",
    "nav.missions": "Missions & Travaux",
    "nav.interventions": "Interventions terrain",
    "nav.banking": "Services bancaires agricoles",
    "nav.insurance": "Assurance agricole",
    "nav.programs": "Programmes & Projets",
    "nav.partners": "Annuaire Partenaires",
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
    case "partenaire":
    case "agent_technique":
    case "expert":
    case "formation":
    case "admin":
    case "manager":
    default:
      if (partnerType === "fournisseur_intrants") return { main: fournisseurNav };
      if (partnerType === "machinisme_travaux") return { main: machinismeNav };
      if (partnerType === "expert_agronome") return { main: agronomeNav };
      if (partnerType === "elevage_veterinaire") return { main: veterinaireNav };
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
        <img src={logo} alt="NAFA - AGRITECH" className="h-12 w-auto shrink-0 drop-shadow-xs" />
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
          const isActive = (
            to === "/dashboard"
              ? (location.pathname === "/dashboard" && !location.search)
              : to.includes("?")
                ? (currentPath === to || (to.includes("tab=dashboard") && location.pathname === "/dashboard/partner-space" && !location.search))
                : to === "/dashboard/crop-planning"
                  ? (location.pathname === "/dashboard" || location.pathname.startsWith("/dashboard/crop-planning"))
                  : location.pathname.startsWith(to)
          );

          const displayLabel = getNavLabel(item, t);

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
                className={cn(
                  "flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary shadow-sm font-bold border-l-4 border-sidebar-primary"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/70")} />
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
    </div>
  );
};

// Desktop sidebar
export const RoleSidebar = () => (
  <aside className="hidden lg:flex h-screen w-72 flex-col border-r border-sidebar-border/80 shrink-0">
    <SidebarNavContent />
  </aside>
);
