import React from "react";
import { CyberShieldSystem } from "@/lib/cyberShieldEngine";

interface HoneyTokenFieldProps {
  name?: string;
  trapId?: string;
}

/**
 * Composant Piège Honeytoken (Jetons de Miel)
 * Totalement invisible pour les utilisateurs légitimes et les lecteurs d'écran.
 * Tout automate ou robot remplissant ce champ est immédiatement neutralisé et placé en quarantaine.
 */
export const HoneyTokenField: React.FC<HoneyTokenFieldProps> = ({
  name = "_nafa_security_verification_token",
  trapId = "nafa_hp_field",
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value && e.target.value.trim().length > 0) {
      CyberShieldSystem.triggerHoneytokenTrap(name, e.target.value);
    }
  };

  return (
    <div
      aria-hidden="true"
      style={{
        opacity: 0,
        position: "absolute",
        top: 0,
        left: 0,
        height: 0,
        width: 0,
        zIndex: -1,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <label htmlFor={trapId} tabIndex={-1}>
        Ne pas modifier ce champ de sécurité (réservé système)
      </label>
      <input
        type="text"
        id={trapId}
        name={name}
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
        onChange={handleChange}
      />
    </div>
  );
};
