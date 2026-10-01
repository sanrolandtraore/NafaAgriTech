import React from "react";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

export interface NafaLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  showTagline?: boolean;
  textColor?: "white" | "default";
  variant?: "default" | "glass" | "white" | "subtle";
  rounded?: "lg" | "xl" | "2xl" | "3xl" | "full";
  className?: string;
  frameClassName?: string;
}

/**
 * Composant de Logo Officiel NAFA-AGRITECH
 * Cadre arrondi élégant, lisible, responsive et parfaitement adapté aux smartphones Android, tablettes et ordinateurs.
 */
export const NafaLogo: React.FC<NafaLogoProps> = ({
  size = "md",
  showText = false,
  showTagline = false,
  textColor = "default",
  variant = "white",
  rounded = "2xl",
  className,
  frameClassName,
}) => {
  const sizeMap = {
    xs: { box: "h-7 w-7", text: "text-xs", tagline: "text-[9px]" },
    sm: { box: "h-8 w-8 sm:h-9 sm:w-9", text: "text-sm sm:text-base", tagline: "text-[10px]" },
    md: { box: "h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12", text: "text-base sm:text-lg", tagline: "text-xs" },
    lg: { box: "h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20", text: "text-xl sm:text-2xl", tagline: "text-xs sm:text-sm" },
    xl: { box: "h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28", text: "text-2xl sm:text-3xl", tagline: "text-xs sm:text-sm" },
  };

  const roundedMap = {
    lg: "rounded-lg",
    xl: "rounded-xl",
    2xl: "rounded-2xl",
    3xl: "rounded-3xl",
    full: "rounded-full",
  };

  const variantMap = {
    white: "bg-white shadow-xs border border-emerald-500/20 p-1",
    glass: "bg-white/95 backdrop-blur-md shadow-md border border-white/30 p-1",
    subtle: "bg-white dark:bg-card shadow-2xs border border-border/80 p-0.5",
    default: "bg-white shadow-xs border border-emerald-500/20 p-1",
  };

  const selectedSize = sizeMap[size];

  return (
    <div className={cn("inline-flex items-center gap-2.5 sm:gap-3 shrink-0", className)}>
      {/* Cadre arrondi professionnel optimisé pour tous les écrans */}
      <div
        className={cn(
          selectedSize.box,
          roundedMap[rounded],
          variantMap[variant],
          "flex items-center justify-center shrink-0 overflow-hidden transition-transform duration-200 group-hover:scale-105",
          frameClassName
        )}
      >
        <img
          src={logo}
          alt="NAFA-AGRITECH"
          className="h-full w-full object-contain rounded-inherit"
          loading="eager"
        />
      </div>

      {showText && (
        <div className="flex flex-col min-w-0">
          <span
            className={cn(
              "font-heading font-extrabold tracking-tight truncate leading-tight",
              selectedSize.text,
              textColor === "white" ? "text-white drop-shadow-xs" : "text-foreground"
            )}
          >
            NAFA <span className={textColor === "white" ? "text-[#F97316]" : "text-emerald-600 dark:text-emerald-400"}>- AGRITECH</span>
          </span>
          {showTagline && (
            <span
              className={cn(
                "font-semibold truncate leading-tight mt-0.5",
                selectedSize.tagline,
                textColor === "white" ? "text-emerald-300" : "text-emerald-700 dark:text-emerald-400"
              )}
            >
              La technologie au service de l'agriculture africaine
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default NafaLogo;
