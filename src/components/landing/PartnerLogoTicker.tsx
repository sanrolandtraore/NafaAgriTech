/**
 * NAFA - AGRITECH : Bande Défilante des Partenaires Officiels (Logo Ticker / Marquee)
 * 
 * Conception UX/UI Mobile-First Haute Performance :
 * - Défilement infini fluide 60fps en pur CSS (aucun JavaScript bloquant sur téléphones modestes)
 * - Pause automatique au survol ou au toucher
 * - Logos / Badges vectoriels des partenaires officiels du secteur agricole et financier
 * - Lien direct vers la vitrine ou les coordonnées de chaque entreprise
 */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Building2,
  Landmark,
  Shield,
  Sprout,
  Tractor,
  Layers,
} from "lucide-react";
import { partnerStorage, PartnerEntry } from "@/lib/partnerStorage";

export const PartnerLogoTicker: React.FC = () => {
  const [partners, setPartners] = useState<PartnerEntry[]>([]);

  useEffect(() => {
    let mounted = true;
    const fetchPartners = async () => {
      try {
        const list = await partnerStorage.getEntries();
        if (mounted && list && list.length > 0) {
          setPartners(list);
        }
      } catch (err) {
        console.warn("[PartnerLogoTicker] Erreur chargement partenaires:", err);
      }
    };
    void fetchPartners();
    return () => {
      mounted = false;
    };
  }, []);

  // Catégorie d'icône associée
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "banque":
        return <Landmark className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case "assurance":
        return <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      case "programme":
        return <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <Sprout className="h-4 w-4 text-primary" />;
    }
  };

  // Liste dupliquée pour assurer une boucle infinie continue et sans à-coups
  const tickerItems = [...partners, ...partners];

  if (partners.length === 0) {
    return null;
  }

  return (
    <div className="w-full overflow-hidden py-6 bg-muted/30 border-y border-border/80">
      <div className="container max-w-6xl mx-auto px-4 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-primary/10 text-primary">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            Réseau des Entreprises & Partenaires Officiels Agréés
          </span>
        </div>
        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{partners.length} entreprises et institutions certifiées</span>
        </div>
      </div>

      {/* Marquee Track Container */}
      <div className="relative w-full overflow-hidden group">
        {/* Ombres de dégradé pour fondu naturel des bords */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-l from-background to-transparent z-10" />

        {/* Ticker Flex Row with CSS Animation */}
        <div
          className="flex gap-4 w-max animate-ticker hover:[animation-play-state:paused] active:[animation-play-state:paused]"
          style={{ willChange: "transform" }}
        >
          {tickerItems.map((partner, index) => {
            const shortName = partner.name.split(" (")[0];
            return (
              <Link
                key={`${partner.id}-${index}`}
                to={`/partenaire/${partner.id}`}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-card border border-border/80 hover:border-primary/60 hover:shadow-xs transition-all duration-200 select-none shrink-0 group/card active:scale-[0.98]"
              >
                {/* Logo Icon Badge */}
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center font-bold text-xs shrink-0 group-hover/card:scale-105 transition-transform border border-border/50">
                  {getCategoryIcon(partner.category)}
                </div>

                {/* Nom & Métadonnées */}
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="font-heading font-bold text-xs sm:text-sm text-foreground group-hover/card:text-primary transition-colors max-w-[180px] sm:max-w-[220px] truncate">
                      {shortName}
                    </span>
                    {partner.is_verified && (
                      <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                      {partner.location || "Burkina Faso"}
                    </span>
                    {partner.badge && (
                      <Badge
                        variant="secondary"
                        className="text-[9px] px-1 py-0 h-3.5 leading-none font-medium bg-muted text-muted-foreground"
                      >
                        {partner.badge}
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PartnerLogoTicker;
