import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { canAccessDiagnosticTools, getDiagnosticAccessInfo } from '@/lib/roleAccessControl';
import { DiagnosticAccessGate } from '@/components/security/DiagnosticAccessGate';
import * as AuthContextModule from '@/contexts/AuthContext';

describe('Autorisation et Habilitations Métier des Outils de Diagnostic Réel', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Matrice d\'Autorisation canAccessDiagnosticTools', () => {
    it('autorise le diagnostic aux profils Agriculteur (agriculteur, farmer) comme outil d\'aide à la décision', () => {
      expect(canAccessDiagnosticTools('agriculteur')).toBe(true);
      expect(canAccessDiagnosticTools('farmer')).toBe(true);
      expect(canAccessDiagnosticTools('agriculteur', 'expert_agronome')).toBe(true);
    });

    it('autorise le diagnostic aux profils Éleveur (eleveur)', () => {
      expect(canAccessDiagnosticTools('eleveur')).toBe(true);
      expect(canAccessDiagnosticTools('eleveur', 'elevage_veterinaire')).toBe(true);
    });

    it('autorise le diagnostic en découverte ou sans rôle explicite', () => {
      expect(canAccessDiagnosticTools(null)).toBe(true);
      expect(canAccessDiagnosticTools(undefined)).toBe(true);
      expect(canAccessDiagnosticTools('')).toBe(true);
    });

    it('autorise les partenaires et experts techniques', () => {
      expect(canAccessDiagnosticTools('partenaire', 'expert_agronome')).toBe(true);
      expect(canAccessDiagnosticTools('partenaire', 'elevage_veterinaire')).toBe(true);
      expect(canAccessDiagnosticTools('expert')).toBe(true);
      expect(canAccessDiagnosticTools('agent_technique')).toBe(true);
      expect(canAccessDiagnosticTools('admin')).toBe(true);
      expect(canAccessDiagnosticTools('manager')).toBe(true);
    });
  });

  describe('2. Niveaux d\'Habilitation & Justifications (getDiagnosticAccessInfo)', () => {
    it('fournit le mode aide à la décision pour les agriculteurs sans bloquer l\'accès', () => {
      const info = getDiagnosticAccessInfo('agriculteur');
      expect(info.allowed).toBe(true);
      expect(info.tier).toBe('advisory_field_diagnosis');
      expect(info.canSignPrescription).toBe(false);
      expect(info.reason).toContain('Aide à la décision');
    });

    it('fournit le mode conseil d\'élevage pour les éleveurs', () => {
      const info = getDiagnosticAccessInfo('eleveur');
      expect(info.allowed).toBe(true);
      expect(info.tier).toBe('advisory_field_diagnosis');
      expect(info.canSignPrescription).toBe(false);
    });

    it('attribue l\'habilitation ordonnance officielle aux experts et vétérinaires', () => {
      const info = getDiagnosticAccessInfo('expert');
      expect(info.allowed).toBe(true);
      expect(info.tier).toBe('official_prescription');
      expect(info.canSignPrescription).toBe(true);
    });
  });

  describe('3. Rendu DiagnosticAccessGate', () => {
    it('rend le banc de diagnostic avec bannière d\'aide à la décision pour un agriculteur', () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        user: { id: 'test-farmer-id' } as any,
        primaryRole: 'agriculteur',
        partnerType: 'fournisseur_intrants',
      } as any);

      render(
        <BrowserRouter>
          <DiagnosticAccessGate>
            <div data-testid="diagnosis-banc">BANC DE DIAGNOSTIC TERRAIN</div>
          </DiagnosticAccessGate>
        </BrowserRouter>
      );

      // Le banc de diagnostic DOIT être rendu pour l'agriculteur
      expect(screen.getByTestId('diagnosis-banc')).toBeInTheDocument();
      // Le bandeau d'aide à la décision doit s'afficher
      expect(screen.getByText(/Mode Aide à la Décision & Auto-Diagnostic IA/i)).toBeInTheDocument();
    });

    it('rend le banc de diagnostic pour un éleveur sans blocage', () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        user: { id: 'test-eleveur-id' } as any,
        primaryRole: 'eleveur',
        partnerType: null,
      } as any);

      render(
        <BrowserRouter>
          <DiagnosticAccessGate>
            <div data-testid="diagnosis-banc">BANC DE DIAGNOSTIC TERRAIN</div>
          </DiagnosticAccessGate>
        </BrowserRouter>
      );

      expect(screen.getByTestId('diagnosis-banc')).toBeInTheDocument();
    });

    it('rend le banc de diagnostic directement pour un expert agréé', () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        user: { id: 'test-expert-id' } as any,
        primaryRole: 'partenaire',
        partnerType: 'expert_agronome',
      } as any);

      render(
        <BrowserRouter>
          <DiagnosticAccessGate>
            <div data-testid="diagnosis-banc">BANC DE DIAGNOSTIC EXPERT</div>
          </DiagnosticAccessGate>
        </BrowserRouter>
      );

      expect(screen.getByTestId('diagnosis-banc')).toBeInTheDocument();
      expect(screen.queryByText(/Accès Restreint/i)).not.toBeInTheDocument();
    });
  });
});
