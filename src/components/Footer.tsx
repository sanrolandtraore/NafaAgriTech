import React from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  ChevronRight,
  Compass,
  ClipboardCheck,
  Cpu,
  Droplets,
  Layers,
  Store,
  ArrowRight,
  ExternalLink,
  Award
} from "lucide-react";
import logo from "@/assets/logo.png";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border/80 bg-slate-950 text-slate-300 dark:bg-[#0B0F17] transition-colors relative z-10">
      {/* ── Section Principale Multi-Colonnes ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          
          {/* ══════════════════════════════════════════
              COLONNE 1 — NAFA-AGRITECH & CONTACT
          ══════════════════════════════════════════ */}
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl overflow-hidden bg-white shadow-xs border border-white/20 p-1 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                <img
                  src={logo}
                  alt="NAFA-AGRITECH"
                  className="h-full w-full object-contain rounded-xl"
                />
              </div>
              <span className="font-heading font-extrabold text-white text-xl tracking-tight">
                NAFA <span className="text-[#F97316]">- AGRITECH</span>
              </span>
            </Link>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Solutions agricoles, services techniques et technologies pour accompagner les producteurs, agronomes, éleveurs et entreprises agricoles en Afrique.
            </p>

            <div className="pt-2 space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-[#F97316] shrink-0 mt-0.5" />
                <span>Bobo-Dioulasso, Burkina Faso</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-[#F97316] shrink-0" />
                <a
                  href="mailto:nafaagritech@gmail.com"
                  className="hover:text-white hover:underline transition-colors"
                >
                  nafaagritech@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-[#F97316] shrink-0" />
                <a
                  href="tel:+22675774852"
                  className="hover:text-white hover:underline transition-colors"
                >
                  +226 75 77 48 52
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-[#F97316] shrink-0" />
                <a
                  href="tel:+22650134920"
                  className="hover:text-white hover:underline transition-colors"
                >
                  +226 50 13 49 20
                </a>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════
              COLONNE 2 — NAVIGATION
          ══════════════════════════════════════════ */}
          <div className="space-y-4">
            <h4 className="font-heading font-bold text-sm sm:text-base text-white tracking-wide uppercase text-xs">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link
                  to="/"
                  className="text-slate-400 hover:text-[#F97316] transition-colors inline-flex items-center gap-1.5"
                >
                  <ChevronRight className="h-3 w-3 text-[#F97316]" />
                  <span>Accueil</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/a-propos"
                  className="text-slate-400 hover:text-[#F97316] transition-colors inline-flex items-center gap-1.5"
                >
                  <ChevronRight className="h-3 w-3 text-[#F97316]" />
                  <span>À propos</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/farms"
                  className="text-slate-400 hover:text-[#F97316] transition-colors inline-flex items-center gap-1.5"
                >
                  <ChevronRight className="h-3 w-3 text-[#F97316]" />
                  <span>Exploitations</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/marketplace?role=producteurs"
                  className="text-slate-400 hover:text-[#F97316] transition-colors inline-flex items-center gap-1.5"
                >
                  <ChevronRight className="h-3 w-3 text-[#F97316]" />
                  <span>Agriculteurs</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/field-designer"
                  className="text-slate-400 hover:text-[#F97316] transition-colors inline-flex items-center gap-1.5"
                >
                  <ChevronRight className="h-3 w-3 text-[#F97316]" />
                  <span>Agronomes</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/marketplace?cat=produits_elevage&role=producteurs"
                  className="text-slate-400 hover:text-[#F97316] transition-colors inline-flex items-center gap-1.5"
                >
                  <ChevronRight className="h-3 w-3 text-[#F97316]" />
                  <span>Éleveurs</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/partenaire-abonnement"
                  className="text-slate-400 hover:text-[#F97316] transition-colors inline-flex items-center gap-1.5"
                >
                  <ChevronRight className="h-3 w-3 text-[#F97316]" />
                  <span>Partenaires</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/marketplace"
                  className="text-slate-400 hover:text-[#F97316] transition-colors inline-flex items-center gap-1.5"
                >
                  <ChevronRight className="h-3 w-3 text-[#F97316]" />
                  <span>Marketplace</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/smart-inspection"
                  className="text-slate-400 hover:text-[#F97316] transition-colors inline-flex items-center gap-1.5"
                >
                  <ChevronRight className="h-3 w-3 text-[#F97316]" />
                  <span>Missions terrain</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-slate-400 hover:text-[#F97316] transition-colors inline-flex items-center gap-1.5"
                >
                  <ChevronRight className="h-3 w-3 text-[#F97316]" />
                  <span>Contact</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* ══════════════════════════════════════════
              COLONNE 3 — SERVICES
          ══════════════════════════════════════════ */}
          <div className="space-y-4">
            <h4 className="font-heading font-bold text-sm sm:text-base text-white tracking-wide uppercase text-xs">
              Services
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link
                  to="/dashboard/field-designer"
                  className="text-slate-400 hover:text-[#F97316] transition-colors inline-flex items-center gap-1.5"
                >
                  <ChevronRight className="h-3 w-3 text-[#F97316]" />
                  <span>Conception 2D & Arpentage GPS</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/smart-inspection"
                  className="text-slate-400 hover:text-[#F97316] transition-colors inline-flex items-center gap-1.5"
                >
                  <ChevronRight className="h-3 w-3 text-[#F97316]" />
                  <span>Inspection intelligente hors-ligne</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/expert-diagnosis"
                  className="text-slate-400 hover:text-[#F97316] transition-colors inline-flex items-center gap-1.5"
                >
                  <ChevronRight className="h-3 w-3 text-[#F97316]" />
                  <span>Diagnostic phytosanitaire certifié</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/genius"
                  className="text-slate-400 hover:text-[#F97316] transition-colors inline-flex items-center gap-1.5"
                >
                  <ChevronRight className="h-3 w-3 text-[#F97316]" />
                  <span>Dimensionnement hydraulique & Solaire</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/animals"
                  className="text-slate-400 hover:text-[#F97316] transition-colors inline-flex items-center gap-1.5"
                >
                  <ChevronRight className="h-3 w-3 text-[#F97316]" />
                  <span>Gestion du cheptel & Soins vétérinaires</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/quote-requests"
                  className="text-slate-400 hover:text-[#F97316] transition-colors inline-flex items-center gap-1.5"
                >
                  <ChevronRight className="h-3 w-3 text-[#F97316]" />
                  <span>Devis d'ingénierie chiffrés en FCFA</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/marketplace"
                  className="text-slate-400 hover:text-[#F97316] transition-colors inline-flex items-center gap-1.5"
                >
                  <ChevronRight className="h-3 w-3 text-[#F97316]" />
                  <span>Marketplace vitrine intrants & machinisme</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* ══════════════════════════════════════════
              COLONNE 4 — EXPERTISE SAHÉLIENNE & SÉCURITÉ
          ══════════════════════════════════════════ */}
          <div className="space-y-4">
            <h4 className="font-heading font-bold text-sm sm:text-base text-white tracking-wide uppercase text-xs">
              Plateforme Certifiée
            </h4>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
                <span>Normes agronomiques certifiées</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Calculs conformes aux données INERA Farako-Bâ, FAO-56 et mercuriales de prix officielles du Burkina Faso.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#F97316]">
                <Award className="h-4 w-4" />
                <span>Disponible sans connexion</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Collecte de données et relevés GPS opérationnels en zone blanche avec synchronisation automatique.
              </p>
            </div>

            <div className="pt-1">
              <Link
                to="/auth?mode=register"
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#F97316] hover:bg-[#ea580c] text-white text-xs font-bold shadow-md transition-colors"
              >
                <span>Rejoindre la plateforme</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* ── Sous-Pied de Page : Copyright & Mentions Légales ── */}
      <div className="border-t border-slate-800/80 bg-slate-950 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2 text-center sm:text-left">
            <span className="font-semibold text-slate-400">NAFA - AGRITECH</span>
            <span>•</span>
            <span>© 2026. Bobo-Dioulasso, Burkina Faso. Tous droits réservés.</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/mentions-legales"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Mentions légales
            </Link>
            <Link
              to="/conditions-utilisation"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Conditions
            </Link>
            <Link
              to="/politique-confidentialite"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
