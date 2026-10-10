import React, { useState } from "react";
import {
  WEST_AFRICAN_COUNTRIES,
  WestAfricanCountry,
  formatPhoneDigits,
} from "@/lib/maxItAuthUtils";
import { ChevronDown, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface MaxItPhoneInputProps {
  country: WestAfricanCountry;
  onCountryChange: (country: WestAfricanCountry) => void;
  phoneNumber: string;
  onPhoneNumberChange: (rawDigits: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export const MaxItPhoneInput: React.FC<MaxItPhoneInputProps> = ({
  country,
  onCountryChange,
  phoneNumber,
  onPhoneNumberChange,
  disabled = false,
  autoFocus = false,
  className,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    if (raw.length <= country.maxLength) {
      onPhoneNumberChange(raw);
    }
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="relative flex items-center rounded-2xl bg-muted/60 dark:bg-card border-2 border-border/80 focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/20 transition-all p-1">
        {/* Bouton de sélection de pays */}
        <div className="relative">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 h-12 px-3 rounded-xl bg-background hover:bg-muted text-xs font-bold text-foreground border border-border/60 transition-colors shrink-0 shadow-2xs"
          >
            <span className="text-lg leading-none" role="img" aria-label={country.name}>
              {country.flag}
            </span>
            <span className="font-mono text-sm tracking-tight">{country.dialCode}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-0.5" />
          </button>

          {/* Menu déroulant des pays d'Afrique de l'Ouest */}
          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute left-0 top-full mt-1.5 w-60 rounded-2xl bg-card border-2 border-border/80 shadow-xl z-50 p-1.5 max-h-60 overflow-y-auto">
                <p className="px-2.5 py-1 text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">
                  Pays d'Afrique de l'Ouest
                </p>
                {WEST_AFRICAN_COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      onCountryChange(c);
                      setIsDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left",
                      c.code === country.code
                        ? "bg-[#F97316]/10 text-[#F97316] font-bold"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">{c.flag}</span>
                      <span>{c.name}</span>
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">{c.dialCode}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Champ de saisie du numéro de téléphone */}
        <div className="relative flex-1 ml-2">
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            autoFocus={autoFocus}
            disabled={disabled}
            value={formatPhoneDigits(phoneNumber)}
            onChange={handleInputChange}
            placeholder={country.example}
            className="w-full h-12 bg-transparent text-base sm:text-lg font-bold font-mono tracking-wider text-foreground placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-50"
          />
        </div>

        {phoneNumber && !disabled && (
          <button
            type="button"
            onClick={() => onPhoneNumberChange("")}
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground flex items-center justify-center mr-2 text-xs font-bold"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
        <span>Format : {country.name} ({country.maxLength} chiffres)</span>
        <span className="font-mono">{phoneNumber.length} / {country.maxLength}</span>
      </div>
    </div>
  );
};
