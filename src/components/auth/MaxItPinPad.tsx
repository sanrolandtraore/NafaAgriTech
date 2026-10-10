import React, { useEffect, useState } from "react";
import { Delete, Eye, EyeOff, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface MaxItPinPadProps {
  pin: string;
  onPinChange: (newPin: string) => void;
  pinLength?: 4 | 6;
  onComplete?: (completedPin: string) => void;
  disabled?: boolean;
  showToggleVisibility?: boolean;
  className?: string;
  label?: string;
}

export const MaxItPinPad: React.FC<MaxItPinPadProps> = ({
  pin,
  onPinChange,
  pinLength = 4,
  onComplete,
  disabled = false,
  showToggleVisibility = true,
  className,
  label = "Saisissez votre code secret",
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Écoute du clavier physique pour les utilisateurs sur ordinateur
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Si une touche numérique est pressée
      if (/^[0-9]$/.test(e.key)) {
        if (pin.length < pinLength) {
          const next = pin + e.key;
          onPinChange(next);
          if (next.length === pinLength && onComplete) {
            onComplete(next);
          }
        }
      } else if (e.key === "Backspace") {
        if (pin.length > 0) {
          onPinChange(pin.slice(0, -1));
        }
      } else if (e.key === "Escape" || e.key === "Delete") {
        onPinChange("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pin, pinLength, onPinChange, onComplete, disabled]);

  const handleKeyClick = (digit: string) => {
    if (disabled || pin.length >= pinLength) return;
    const next = pin + digit;
    onPinChange(next);
    if (next.length === pinLength && onComplete) {
      onComplete(next);
    }
  };

  const handleDelete = () => {
    if (disabled || pin.length === 0) return;
    onPinChange(pin.slice(0, -1));
  };

  const handleClear = () => {
    if (disabled) return;
    onPinChange("");
  };

  return (
    <div className={cn("flex flex-col items-center select-none w-full max-w-xs mx-auto", className)}>
      {/* En-tête indicateur */}
      {label && (
        <p className="text-xs font-bold text-foreground text-center mb-3">
          {label}
        </p>
      )}

      {/* Affichage des cercles / puces PIN */}
      <div className="flex items-center justify-center gap-3 mb-6 relative">
        {Array.from({ length: pinLength }).map((_, idx) => {
          const isFilled = idx < pin.length;
          const isCurrent = idx === pin.length;
          const digitValue = pin[idx];

          return (
            <div
              key={idx}
              className={cn(
                "w-11 h-12 rounded-2xl flex items-center justify-center font-mono font-bold text-lg transition-all",
                isFilled
                  ? "bg-[#F97316] text-white border-2 border-[#F97316] shadow-sm shadow-orange-500/20 scale-105"
                  : isCurrent
                  ? "bg-card border-2 border-[#F97316] animate-pulse"
                  : "bg-muted/60 border-2 border-border/80 text-muted-foreground"
              )}
            >
              {isFilled ? (
                isVisible ? (
                  <span>{digitValue}</span>
                ) : (
                  <span className="w-3 h-3 rounded-full bg-white block" />
                )
              ) : null}
            </div>
          );
        })}

        {showToggleVisibility && pin.length > 0 && (
          <button
            type="button"
            onClick={() => setIsVisible(!isVisible)}
            className="absolute -right-9 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted"
            title={isVisible ? "Masquer le code secret" : "Afficher le code secret"}
          >
            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Clavier Virtuel Tactile Max It (NumPad 0-9) */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
          <button
            key={num}
            type="button"
            disabled={disabled}
            onClick={() => handleKeyClick(num)}
            className="h-14 sm:h-16 rounded-2xl bg-card hover:bg-muted/80 active:bg-[#F97316] active:text-white border-2 border-border/60 text-lg sm:text-xl font-bold font-mono text-foreground flex items-center justify-center transition-all shadow-xs active:scale-95 disabled:opacity-40"
          >
            {num}
          </button>
        ))}

        {/* Bouton Vider (C) */}
        <button
          type="button"
          disabled={disabled || pin.length === 0}
          onClick={handleClear}
          className="h-14 sm:h-16 rounded-2xl bg-muted/40 hover:bg-muted text-muted-foreground active:text-foreground text-xs font-bold flex items-center justify-center transition-all active:scale-95 disabled:opacity-20"
          title="Effacer tout"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        {/* Bouton 0 */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleKeyClick("0")}
          className="h-14 sm:h-16 rounded-2xl bg-card hover:bg-muted/80 active:bg-[#F97316] active:text-white border-2 border-border/60 text-lg sm:text-xl font-bold font-mono text-foreground flex items-center justify-center transition-all shadow-xs active:scale-95 disabled:opacity-40"
        >
          0
        </button>

        {/* Bouton Effacer (Backspace) */}
        <button
          type="button"
          disabled={disabled || pin.length === 0}
          onClick={handleDelete}
          className="h-14 sm:h-16 rounded-2xl bg-muted/40 hover:bg-muted text-muted-foreground active:text-foreground flex items-center justify-center transition-all active:scale-95 disabled:opacity-20"
          title="Effacer le dernier chiffre"
        >
          <Delete className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
