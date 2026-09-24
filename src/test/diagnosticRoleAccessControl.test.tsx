import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { canAccessDiagnosticTools, getDiagnosticAccessInfo } from '@/lib/roleAccessControl';
import { DiagnosticAccessGate } from '@/components/security/DiagnosticAccessGate';
import ExpertDiagnosisPage from '@/pages/dashboard/expert/ExpertDiagnosisPage';
import * as AuthContextModule from '@/contexts/AuthContext';

describe('Cloisonnement Métier Strict — Interdiction des Outils de Diagnostic aux Agriculteurs & Éleveurs', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Matrice d\'Autorisation canAccessDiagnosticTools', () => {
    it('interdit strictement l\'accès aux profils Agriculteur (agriculteur, farmer)', () => {
      expect(canAccessDiagnosticTools('agriculteur')).toBe(false);
      expect(canAccessDiagnosticTools('farmer')).toBe(false);
      expect(canAccessDiagnosticTools('agriculteur', 'expert_agronome')).toBe(false);
    });

    it('interdit strictement l\'accès aux profils Éleveur (eleveur)', () => {
      expect(canAccessDiagnosticTools('eleveur')).toBe(false);
      expect(canAccessDiagnosticTools('eleveur', 'elevage_veterinaire')).toBe(false);
    });

    it('interdit l\'accès aux utilisateurs non connectés ou anonymes', () => {
      expect(canAccessDiagnosticTools(null)).toBe(false);
      expect(canAccessDiagnosticTools(undefined)).toBe(false);
      expect(canAccessDiagnosticTools('')).toBe(false);
    });

    it('interdit l\'accès aux partenaires non techniques (fournisseurs, machinistes, banques)', () => {
      expect(canAccessDiagnosticTools('partenaire', 'fournisseur_intrants')).toBe(false);
      expect(canAccessDiagnosticTools('partenaire', 'machinisme_travaux')).toBe(false);
      expect(canAccessDiagnosticTools('partenaire', 'institution_agri')).toBe(false);
    });

    it('autorise EXCLUSIVEMENT les partenaires prestataires en agronomie et santé animale / vétérinaire', () => {
      // Partenaire prestataire agronomie
      expect(canAccessDiagnosticTools('partenaire', 'expert_agronome')).toBe(true);

      // Partenaire prestataire vétérinaire
      expect(canAccessDiagnosticTools('partenaire', 'elevage_veterinaire')).toBe(true);

      // Partenaire polyvalent qualifié
      expect(canAccessDiagnosticTools('partenaire', 'polyvalent')).toBe(true);

      // Experts et agents techniques
      expect(canAccessDiagnosticTools('expert')).toBe(true);
      expect(canAccessDiagnosticTools('agent_technique')).toBe(true);

      // Administrateurs
      expect(canAccessDiagnosticTools('admin')).toBe(true);
      expect(canAccessDiagnosticTools('manager')).toBe(true);
    });
  });

  describe('2. Justifications Réglementaires & Déontologiques (getDiagnosticAccessInfo)', () => {
    it('fournit une justification réglementaire CIRAD/INERA pour les agriculteurs', () => {
      const info = getDiagnosticAccessInfo('agriculteur');
      expect(info.allowed).toBe(false);
      expect(info.reason).toContain('INERA / CIRAD');
      expect(info.recommendedRoute).toBe('/dashboard/marketplace');
    });

    it('fournit une justification des normes vétérinaires pour les éleveurs', () => {
      const info = getDiagnosticAccessInfo('eleveur');
      expect(info.allowed).toBe(false);
      expect(info.reason).toContain('normes vétérinaires');
      expect(info.recommendedRoute).toBe('/dashboard/livestock-services');
    });
  });

  describe('3. Barrière d\'Accès Visuelle DiagnosticAccessGate', () => {
    it('bloque l\'affichage pour un agriculteur et propose de solliciter un cabinet d\'agronomie agréé', () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        user: { id: 'test-farmer-id' } as any,
        primaryRole: 'agriculteur',
        partnerType: 'fournisseur_intrants',
      } as any);

      render(
        <BrowserRouter>
          <DiagnosticAccessGate>
            <div data-testid="secret-diagnosis-banc">BANQUE DE DIAGNOSTIC PRIVÉ</div>
          </DiagnosticAccessGate>
        </BrowserRouter>
      );

      // Le banc de diagnostic ne doit PAS être rendu
      expect(screen.queryByTestId('secret-diagnosis-banc')).not.toBeInTheDocument();

      // Le message d'accès restreint doit s'afficher
      expect(screen.getByText(/Accès Restreint : Outils de Diagnostic Officiel/i)).toBeInTheDocument();
      expect(screen.getByText(/Solliciter un cabinet d'agronomie agréé/i)).toBeInTheDocument();
    });

    it('bloque l\'affichage pour un éleveur et propose de contacter un vétérinaire partenaire', () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        user: { id: 'test-eleveur-id' } as any,
        primaryRole: 'eleveur',
        partnerType: 'fournisseur_intrants',
      } as any);

      render(
        <BrowserRouter>
          <DiagnosticAccessGate>
            <div data-testid="secret-diagnosis-banc">BANQUE DE DIAGNOSTIC PRIVÉ</div>
          </DiagnosticAccessGate>
        </BrowserRouter>
      );

      expect(screen.queryByTestId('secret-diagnosis-banc')).not.toBeInTheDocument();
      expect(screen.getByText(/Accès Restreint : Outils de Diagnostic Officiel/i)).toBeInTheDocument();
      expect(screen.getByText(/Contacter un vétérinaire partenaire/i)).toBeInTheDocument();
    });

    it('autorise le rendu pour un partenaire prestataire agronome agréé', () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        user: { id: 'test-expert-id' } as any,
        primaryRole: 'partenaire',
        partnerType: 'expert_agronome',
      } as any);

      render(
        <BrowserRouter>
          <DiagnosticAccessGate>
            <div data-testid="secret-diagnosis-banc">BANQUE DE DIAGNOSTIC PRIVÉ</div>
          </DiagnosticAccessGate>
        </BrowserRouter>
      );

      // Le banc de diagnostic DOIT être rendu pour l'expert
      expect(screen.getByTestId('secret-diagnosis-banc')).toBeInTheDocument();
      expect(screen.queryByText(/Accès Restreint : Outils de Diagnostic Officiel/i)).not.toBeInTheDocument();
    });
  });
});
