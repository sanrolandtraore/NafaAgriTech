import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  CyberShieldSystem,
  CyberShieldIDS,
  QuarantineState,
  ThreatDetectionResult,
  ThreatCategory,
} from "@/lib/cyberShieldEngine";
import { CyberShieldLockoutScreen } from "./CyberShieldLockoutScreen";

interface CyberShieldContextType {
  quarantine: QuarantineState | null;
  isQuarantined: boolean;
  inspectInput: (payload: any) => ThreatDetectionResult;
  triggerAutonomousQuarantine: (category: ThreatCategory, score: number, reason: string) => void;
  releaseQuarantine: (key: string) => boolean;
}

const CyberShieldContext = createContext<CyberShieldContextType | null>(null);

export const useCyberShield = (): CyberShieldContextType => {
  const context = useContext(CyberShieldContext);
  if (!context) {
    throw new Error("useCyberShield doit être utilisé au sein d'un CyberShieldProvider");
  }
  return context;
};

interface CyberShieldProviderProps {
  children: ReactNode;
}

export const CyberShieldProvider: React.FC<CyberShieldProviderProps> = ({ children }) => {
  const [quarantine, setQuarantine] = useState<QuarantineState | null>(() =>
    CyberShieldSystem.getQuarantineState()
  );

  useEffect(() => {
    // 1. Protection Anti-Clickjacking / Frame Hijacking
    CyberShieldSystem.enforceFrameProtection();

    // 2. Abonnement aux notifications de quarantaine en temps réel
    const unsubscribe = CyberShieldSystem.subscribe((state) => {
      setQuarantine(state);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const inspectInput = (payload: any): ThreatDetectionResult => {
    const result = CyberShieldIDS.inspectPayload(payload);
    if (result.isThreat) {
      CyberShieldSystem.registerIncident({
        threatCategory: result.categories[0] || "ANOMALOUS_PAYLOAD",
        severity: result.severity,
        score: result.score,
        details: result.details.join(" | "),
        autonomousAction: result.autonomousAction,
      });
    }
    return result;
  };

  const triggerAutonomousQuarantine = (category: ThreatCategory, score: number, reason: string) => {
    CyberShieldSystem.triggerHardQuarantine(category, score, reason);
  };

  const releaseQuarantine = (key: string): boolean => {
    return CyberShieldSystem.releaseQuarantine(key);
  };

  return (
    <CyberShieldContext.Provider
      value={{
        quarantine,
        isQuarantined: !!quarantine,
        inspectInput,
        triggerAutonomousQuarantine,
        releaseQuarantine,
      }}
    >
      {quarantine && <CyberShieldLockoutScreen quarantine={quarantine} />}
      {children}
    </CyberShieldContext.Provider>
  );
};
