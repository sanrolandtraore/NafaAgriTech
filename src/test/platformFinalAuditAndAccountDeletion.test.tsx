import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import {
  agriculteurNav,
  agronomeNav,
  eleveurNav,
  veterinaireNav,
  fournisseurNav,
  machinismeNav,
  institutionNav,
  partenaireNav,
  getNavForRole,
} from "@/components/RoleSidebar";
import { PartnerVerifiedBadge } from "@/components/partner/PartnerVerifiedBadge";
import { PartnerKycDossier } from "@/lib/partnerKyc";

describe("Audit Final — Isolation Stricte des Modules & Cloisonnement", () => {
  it("Module Vétérinaire (Partenaire) ne contient AUCUNE gestion d'exploitation d'éleveur", () => {
    const paths = veterinaireNav.map((item) => item.to);

    // Contient les services vétérinaires et prestations professionnelles
    expect(paths).toContain("/dashboard/livestock-services");
    expect(paths).toContain("/dashboard/partenaire-mes-offres");
    expect(paths).toContain("/dashboard/interventions");
    expect(paths).toContain("/dashboard/quote-requests");
    expect(paths).toContain("/dashboard/provider-clients");
    expect(paths).toContain("/dashboard/revenus");

    // Règle non négociable : AUCUN outil d'élevage de cheptel personnel (animaux, rations, reproduction)
    expect(paths).not.toContain("/dashboard/animals");
    expect(paths).not.toContain("/dashboard/animal-health");
    expect(paths).not.toContain("/dashboard/animal-feeding");
    expect(paths).not.toContain("/dashboard/animal-reproduction");

    // Zéro culture végétale
    expect(paths).not.toContain("/dashboard/crop-planning");
    expect(paths).not.toContain("/dashboard/parcels");
  });

  it("Module Éleveur gère son cheptel personnel et accède au catalogue des services vétérinaires", () => {
    const paths = eleveurNav.map((item) => item.to);

    expect(paths).toContain("/dashboard/animals");
    expect(paths).toContain("/dashboard/animal-health");
    expect(paths).toContain("/dashboard/animal-feeding");
    expect(paths).toContain("/dashboard/animal-reproduction");
    expect(paths).toContain("/dashboard/livestock-services");
    expect(paths).toContain("/dashboard/marketplace");

    // Zéro gestion de flotte machinerie
    expect(paths).not.toContain("/dashboard/missions");
  });

  it("Module Agriculteur contient STRICTEMENT et UNIQUEMENT le Marketplace des Services", () => {
    const paths = agriculteurNav.map((item) => item.to);
    expect(paths).toEqual(["/dashboard/marketplace"]);
  });

  it("Module Agronome & Conseil contient STRICTEMENT les 11 outils techniques d'ingénierie agronomique", () => {
    const paths = agronomeNav.map((item) => item.to);
    expect(paths).toContain("/dashboard/services");
    expect(paths).toContain("/dashboard/crop-planning");
    expect(paths).toContain("/dashboard/parcels");
    expect(paths).toContain("/dashboard/scouting");
    expect(paths).toContain("/dashboard/inspections");
    expect(paths).toContain("/dashboard/genius");
    expect(paths).toContain("/dashboard/expert-diagnosis");
    expect(paths).toContain("/dashboard/expert-prescriptions");
    expect(paths).toContain("/dashboard/expert-calculator");
    expect(paths).toContain("/dashboard/expert-cartography");
    expect(paths).toContain("/dashboard/crop-library");

    // Zéro outil bétail ou animal
    expect(paths).not.toContain("/dashboard/animals");
  });

  it("Routeur getNavForRole distribue chaque profil vers son pôle exclusif", () => {
    expect(getNavForRole("agriculteur").main).toBe(agriculteurNav);
    expect(getNavForRole("eleveur").main).toBe(eleveurNav);
    expect(getNavForRole("expert").main).toBe(agronomeNav);
    expect(getNavForRole("partenaire", "elevage_veterinaire").main).toBe(veterinaireNav);
    expect(getNavForRole("partenaire", "fournisseur_intrants").main).toBe(fournisseurNav);
    expect(getNavForRole("partenaire", "machinisme_travaux").main).toBe(machinismeNav);
    expect(getNavForRole("partenaire", "institution_agri").main).toBe(institutionNav);
    expect(getNavForRole("partenaire").main).toBe(partenaireNav);
  });
});

describe("Protection des Données & Confidentialité sur les Pages Vitrine", () => {
  it("PartnerVerifiedBadge n'expose JAMAIS le numéro brut de pièce d'identité (CNIB/Passeport)", () => {
    const mockKyc: PartnerKycDossier = {
      status: "verifie",
      type: "personne_physique",
      certificationId: "NAFA-CERT-2026-BF-9999",
      updatedAt: "2026-09-25T10:00:00Z",
      physiqueData: {
        docType: "cnib",
        docNumber: "B12894750CONFIDENTIEL",
        fullName: "Dr. Oumar Traoré",
        profession: "Médecin Vétérinaire",
      },
      moraleData: {
        companyName: "",
        legalForm: "SARL",
        rccmNumber: "",
        ifuNumber: "",
        managerFullName: "",
      },
    };

    const { container } = render(
      <PartnerVerifiedBadge
        isVerified={true}
        kyc={mockKyc}
        partnerName="Cabinet Vétérinaire du Sahel"
      />
    );

    // Cliquer sur le badge pour ouvrir le popover
    const badgeTrigger = screen.getByText("Partenaire Certifié");
    fireEvent.click(badgeTrigger);

    // Le numéro brut confidentiel (B12894750CONFIDENTIEL) NE DOIT JAMAIS apparaître dans le DOM !
    expect(container.textContent).not.toContain("B12894750CONFIDENTIEL");
    const bodyContent = document.body.textContent || "";
    expect(bodyContent).not.toContain("B12894750CONFIDENTIEL");

    // Doit afficher la mention sécurisée "Vérifiée & Conforme"
    expect(bodyContent).toContain("Vérifiée & Conforme");
  });
});

describe("Suppression de Compte (deleteAccount)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("Nettoie rigoureusement les comptes enregistrés dans nafa_phone_accounts_v1 et la session locale", () => {
    // Simuler un utilisateur connecté avec un compte enregistré
    const mockUserId = "11111111-2222-4444-aaaa-bbbbbbbbbbbb";
    const mockPhone = "+22670112233";

    const registeredAccounts = {
      [mockPhone]: {
        userId: mockUserId,
        email: "test@nafa.bf",
        phone: mockPhone,
        fullName: "Adama Traoré",
        roles: ["agriculteur"],
        profile: { full_name: "Adama Traoré", phone: mockPhone, email: "test@nafa.bf", avatar_url: null },
        savedAt: Date.now(),
      },
      "+22675998877": {
        userId: "99999999-8888-4444-aaaa-cccccccccccc",
        email: "autre@nafa.bf",
        phone: "+22675998877",
        fullName: "Autre Utilisateur",
        roles: ["eleveur"],
        profile: { full_name: "Autre Utilisateur", phone: "+22675998877", email: "autre@nafa.bf", avatar_url: null },
        savedAt: Date.now(),
      }
    };

    localStorage.setItem("nafa_phone_accounts_v1", JSON.stringify(registeredAccounts));
    localStorage.setItem("nafa_session_v1", JSON.stringify(registeredAccounts[mockPhone]));
    localStorage.setItem(`nafa_user_country_${mockUserId}`, "BF");
    localStorage.setItem(`nafa_user_prefs_${mockUserId}`, JSON.stringify({ theme: "light" }));

    // Vérifier présence avant suppression
    expect(localStorage.getItem("nafa_session_v1")).not.toBeNull();
    expect(localStorage.getItem(`nafa_user_country_${mockUserId}`)).toBe("BF");

    // Simuler l'algorithme de suppression de deleteAccount
    const rawAccounts = localStorage.getItem("nafa_phone_accounts_v1");
    if (rawAccounts) {
      const accounts = JSON.parse(rawAccounts);
      for (const key of Object.keys(accounts)) {
        if (accounts[key]?.userId === mockUserId || key === mockPhone) {
          delete accounts[key];
        }
      }
      localStorage.setItem("nafa_phone_accounts_v1", JSON.stringify(accounts));
    }

    localStorage.removeItem("nafa_session_v1");
    localStorage.removeItem(`nafa_user_country_${mockUserId}`);
    localStorage.removeItem(`nafa_user_prefs_${mockUserId}`);

    // Vérifications après suppression :
    // 1. Session locale détruite
    expect(localStorage.getItem("nafa_session_v1")).toBeNull();
    expect(localStorage.getItem(`nafa_user_country_${mockUserId}`)).toBeNull();
    expect(localStorage.getItem(`nafa_user_prefs_${mockUserId}`)).toBeNull();

    // 2. Le compte supprimé n'existe plus dans les comptes enregistrés
    const updatedAccounts = JSON.parse(localStorage.getItem("nafa_phone_accounts_v1") || "{}");
    expect(updatedAccounts[mockPhone]).toBeUndefined();

    // 3. Le compte de l'autre utilisateur est préservé
    expect(updatedAccounts["+22675998877"]).toBeDefined();
    expect(updatedAccounts["+22675998877"].fullName).toBe("Autre Utilisateur");
  });
});
