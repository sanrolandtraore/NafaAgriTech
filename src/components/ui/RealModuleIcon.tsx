import React from "react";
import tractorImg from "@/assets/module-icons/tractor.jpg";
import cropsImg from "@/assets/module-icons/crops.jpg";
import livestockImg from "@/assets/module-icons/livestock.jpg";
import gpsImg from "@/assets/module-icons/gps.jpg";
import irrigationImg from "@/assets/module-icons/irrigation.jpg";
import diagnosticImg from "@/assets/module-icons/diagnostic.jpg";
import financeImg from "@/assets/module-icons/finance.jpg";
import marketImg from "@/assets/module-icons/marketplace.jpg";
import vetImg from "@/assets/module-icons/veterinary.jpg";
import eduImg from "@/assets/module-icons/education.jpg";
import quoteImg from "@/assets/module-icons/quote.jpg";

export type ModuleIconType =
  | "crops"
  | "parcels"
  | "livestock"
  | "animals"
  | "tractor"
  | "machinisme"
  | "gps"
  | "field-designer"
  | "cartography"
  | "irrigation"
  | "water"
  | "diagnostic"
  | "finance"
  | "assurance"
  | "banking"
  | "marketplace"
  | "store"
  | "harvest"
  | "veterinary"
  | "veto"
  | "education"
  | "formation"
  | "quote"
  | "engineering"
  | "analytics";

const ICON_MAP: Record<string, string> = {
  crops: cropsImg,
  parcels: cropsImg,
  livestock: livestockImg,
  animals: livestockImg,
  tractor: tractorImg,
  machinisme: tractorImg,
  gps: gpsImg,
  "field-designer": gpsImg,
  cartography: gpsImg,
  irrigation: irrigationImg,
  water: irrigationImg,
  diagnostic: diagnosticImg,
  finance: financeImg,
  assurance: financeImg,
  banking: financeImg,
  marketplace: marketImg,
  store: marketImg,
  harvest: marketImg,
  veterinary: vetImg,
  veto: vetImg,
  education: eduImg,
  formation: eduImg,
  quote: quoteImg,
  engineering: quoteImg,
  analytics: quoteImg,
};

interface RealModuleIconProps {
  type: ModuleIconType | string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  alt?: string;
  interactive?: boolean;
}

const SIZE_CLASSES = {
  xs: "w-5 h-5 rounded-md",
  sm: "w-7 h-7 rounded-lg",
  md: "w-10 h-10 rounded-xl",
  lg: "w-14 h-14 rounded-2xl",
  xl: "w-20 h-20 rounded-[22px]",
};

export const getRealModuleIconUrl = (type: string): string => {
  const normalized = type.toLowerCase().trim();
  return ICON_MAP[normalized] || ICON_MAP.crops;
};

export const RealModuleIcon: React.FC<RealModuleIconProps> = ({
  type,
  size = "md",
  className = "",
  alt,
  interactive = true,
}) => {
  const iconSrc = getRealModuleIconUrl(type);
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden shadow-xs border border-white/20 dark:border-white/10 bg-slate-900 ${sizeClass} ${
        interactive ? "transition-all duration-300 hover:scale-110 hover:shadow-md hover:rotate-1" : ""
      } ${className}`}
    >
      <img
        src={iconSrc}
        alt={alt || `Icône réelle ${type}`}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover object-center select-none"
      />
      {/* Léger éclat lumineux au survol */}
      {interactive && (
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
      )}
    </div>
  );
};

export default RealModuleIcon;
