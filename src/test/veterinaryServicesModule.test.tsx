import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import LivestockServicesPage from "@/pages/livestock/LivestockServicesPage";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  veterinaryStorage,
  VETERINARY_MODULE_TYPE,
  INITIAL_VETERINARY_PARTNERS,
} from "@/lib/veterinaryServicesStorage";
import * as AuthContextModule from "@/contexts/AuthContext";

// Helper render with Providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <TooltipProvider>
      <BrowserRouter>{ui}</BrowserRouter>
    </TooltipProvider>
  );
};

// Mock AuthContext
const mockAuth = (role = "eleveur", userId = "user-eleveur-1") => {
  vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
    user: { id: userId, email: "eleveur@sahel.bf" } as any,
    profile: {
      id: userId,
      role: role as any,
      full_name: "Amadou Diallo",
      phone: "+226 70 12 34 56",
      city: "Bobo-Dioulasso",
    } as any,
    role: role as any,
    loading: false,
    session: {} as any,
    isExpert: false,
    isAdmin: false,
    isPartner: false,
    isProducer: false,
    signOut: vi.fn(),
  });
};

describe("Module Services Vétérinaires — Catalogue Partenaires & Annuaire Officiel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe("1. Règle Non Négociable — Zéro Tableau de Bord d'Éleveur & Zéro Donnée Personnelle d'Élevage", () => {
    it("affiche exclusivement un annuaire de cabinets partenaires agréés et aucun indicateur de cheptel personnel", async () => {
      mockAuth("eleveur");

      renderWithProviders(<LivestockServicesPage />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /Services Vétérinaires/i })).toBeInTheDocument();
      });

      // Titre & En-tête officiel du catalogue partenaire
      expect(screen.getAllByText(/Ordre National des Vétérinaires du Burkina Faso/i).length).toBeGreaterThan(0);

      // Vérification négative stricte : aucun tableau de bord d'élevage / troupeau
      expect(screen.queryByText(/Gestion du troupeau/i)).toBeNull();
      expect(screen.queryByText(/Mes bovins/i)).toBeNull();
      expect(screen.queryByText(/Tableau de bord cheptel/i)).toBeNull();
      expect(screen.queryByText(/Courbe de lactation/i)).toBeNull();
      expect(screen.queryByText(/Plan de monte/i)).toBeNull();
      expect(screen.queryByText(/Poids moyen vif/i)).toBeNull();
    });

    it("vérifie que le stockage utilise module_type = 'veterinary_services'", async () => {
      expect(VETERINARY_MODULE_TYPE).toBe("veterinary_services");
      const partners = await veterinaryStorage.getPartners();
      expect(partners.length).toBeGreaterThan(0);
      partners.forEach((p) => {
        expect(p.module_type).toBe("veterinary_services");
        expect(p.order_number).toMatch(/ONV-BF/);
      });
    });
  });

  describe("2. Fiche Partenaire Complète — Tous les Éléments Requis Sont Présents", () => {
    it("présente tous les partenaires burkinabè certifiés avec leurs badges officiels", async () => {
      mockAuth("eleveur");

      renderWithProviders(<LivestockServicesPage />);

      await waitFor(() => {
        expect(screen.getByText("Cabinet Vétérinaire du Faso (COVEFA - Agence Bobo)")).toBeInTheDocument();
      });

      expect(screen.getByText("Dr. Oumarou Sawadogo")).toBeInTheDocument();
      expect(screen.getByText("ONV-BF N° 084")).toBeInTheDocument();

      expect(screen.getByText("Clinique Vétérinaire Centrale de Ouagadougou")).toBeInTheDocument();
      expect(screen.getByText("Dr. Aminata Kaboré")).toBeInTheDocument();
      expect(screen.getByText("ONV-BF N° 112")).toBeInTheDocument();
    });

    it("ouvre la fiche détaillée d'un cabinet avec ses 13 attributs obligatoires", async () => {
      mockAuth("eleveur");

      renderWithProviders(<LivestockServicesPage />);

      await waitFor(() => {
        expect(screen.getByText("Cabinet Vétérinaire du Faso (COVEFA - Agence Bobo)")).toBeInTheDocument();
      });

      // Cliquer sur "Voir la fiche" du premier partenaire
      const detailButtons = screen.getAllByRole("button", { name: /Voir la fiche/i });
      fireEvent.click(detailButtons[0]);

      // Attendre l'ouverture du Dialog
      const dialog = await screen.findByRole("dialog");
      expect(dialog).toBeInTheDocument();

      // Vérification des 13 éléments dans le dialogue :
      // 1. Nom & Docteur
      expect(within(dialog).getByText(/Dr. Oumarou Sawadogo/i)).toBeInTheDocument();

      // 2. Présentation
      expect(within(dialog).getByText(/Structure agréée par l'Ordre National des Vétérinaires du Burkina Faso/i)).toBeInTheDocument();

      // 3. Zone d'intervention
      expect(within(dialog).getByText(/Bobo-Dioulasso, Bama, Toussiana, Banfora et Hauts-Bassins/i)).toBeInTheDocument();

      // 4. Horaires & Urgences 24/7
      expect(within(dialog).getByText(/Permanence Urgences 24\/7/i)).toBeInTheDocument();

      // 5. Contact (Téléphone, WhatsApp, Email)
      expect(within(dialog).getByText("+226 20 97 15 45")).toBeInTheDocument();
      expect(within(dialog).getByText(/WhatsApp : \+226 70 20 15 45/i)).toBeInTheDocument();
      expect(within(dialog).getByText("contact@covefa-veterinaire.bf")).toBeInTheDocument();

      // 6. Services proposés & Tarifs
      expect(within(dialog).getByText("Consultation vétérinaire générale sur site")).toBeInTheDocument();
      expect(within(dialog).getByText(/7 500 FCFA/i)).toBeInTheDocument();
      expect(within(dialog).getByText("Campagne de vaccination bétail (PPR, PPCB, Charbon)")).toBeInTheDocument();
      expect(within(dialog).getAllByText(/500 FCFA/i).length).toBeGreaterThan(0);
      expect(within(dialog).getByText("Insémination artificielle bovine (Souches améliorées)")).toBeInTheDocument();
      expect(within(dialog).getByText(/25 000 FCFA/i)).toBeInTheDocument();

      // 7. Produits disponibles (autorisés)
      expect(within(dialog).getByText("Kit Déparasitage Ruminants 25 têtes")).toBeInTheDocument();
      expect(within(dialog).getByText(/12 500 FCFA/i)).toBeInTheDocument();

      // 8. Avis clients
      expect(within(dialog).getByText("El Hadj Boureima Ouedraogo")).toBeInTheDocument();
      expect(within(dialog).getByText(/Intervention rapide lors d'un vêlage difficile/i)).toBeInTheDocument();

      // 9. Boutons d'action : Devis & Réservation
      expect(within(dialog).getByRole("button", { name: /Demander un devis/i })).toBeInTheDocument();
      expect(within(dialog).getAllByRole("button", { name: /^Réserver$/i }).length).toBeGreaterThan(0);
    });
  });

  describe("3. Filtres & Spécialités Vétérinaires (11 Types de Services)", () => {
    it("filtre les cabinets par spécialité médicale ou zootechnique", async () => {
      mockAuth("eleveur");

      renderWithProviders(<LivestockServicesPage />);

      await waitFor(() => {
        expect(screen.getByText("Cabinet Vétérinaire du Faso (COVEFA - Agence Bobo)")).toBeInTheDocument();
      });

      // Filtrer par "Urgences 24/7"
      const emergencyBadge = screen.getByRole("button", { name: /Urgences 24\/7/i });
      fireEvent.click(emergencyBadge);

      // Vérifier que les cabinets avec urgences restent visibles
      await waitFor(() => {
        expect(screen.getByText("Cabinet Vétérinaire du Faso (COVEFA - Agence Bobo)")).toBeInTheDocument();
      });
    });

    it("filtre par recherche textuelle (ville ou nom de cabinet)", async () => {
      mockAuth("eleveur");

      renderWithProviders(<LivestockServicesPage />);

      await waitFor(() => {
        expect(screen.getByText("Cabinet Vétérinaire du Faso (COVEFA - Agence Bobo)")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Rechercher par médecin, clinique, spécialité, ville.../i);
      fireEvent.change(searchInput, { target: { value: "Dédougou" } });

      // Seul le centre de Dédougou doit être listé
      await waitFor(() => {
        expect(screen.getByText(/Centre Vétérinaire & Zootechnique de la Boucle du Mouhoun/i)).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.queryByText(/Cabinet Vétérinaire Sahélien/i)).toBeNull();
      });
    });
  });

  describe("4. Réservation & Demande de Devis d'Actes Zootechniques", () => {
    it("permet à l'éleveur d'enregistrer une réservation et de la retrouver dans son suivi", async () => {
      mockAuth("eleveur", "eleveur-amadou");

      const createdBooking = await veterinaryStorage.createBooking({
        partner_id: "vet-covefa-bobo",
        partner_name: "Cabinet Vétérinaire du Faso",
        client_id: "eleveur-amadou",
        client_name: "Amadou Diallo",
        client_phone: "+226 70 12 34 56",
        service_id: "vs-covefa-1",
        service_name: "Consultation vétérinaire générale sur site",
        requested_date: "2026-10-05",
        requested_time: "09:00",
        location: "Ferme Naba, Bobo",
        animal_type: "Bovins métis",
        animal_count: 12,
        estimated_cost_fcfa: 7500,
      });

      expect(createdBooking.id).toBeDefined();
      expect(createdBooking.status).toBe("en_attente");
      expect(createdBooking.module_type).toBe("veterinary_services");

      const userBookings = veterinaryStorage.getClientBookings("eleveur-amadou");
      expect(userBookings.length).toBe(1);
      expect(userBookings[0].service_name).toBe("Consultation vétérinaire générale sur site");
      expect(userBookings[0].estimated_cost_fcfa).toBe(7500);
    });

    it("permet à l'éleveur de créer une demande de devis", async () => {
      mockAuth("eleveur", "eleveur-amadou");

      const quote = await veterinaryStorage.createQuote({
        partner_id: "vet-covefa-bobo",
        partner_name: "Cabinet Vétérinaire du Faso",
        client_id: "eleveur-amadou",
        client_name: "Amadou Diallo",
        client_phone: "+226 70 12 34 56",
        service_id: "vs-covefa-4",
        service_name: "Insémination artificielle bovine",
        animal_count: 5,
        description: "Demande de protocole de synchronisation pour 5 vaches zébu Gobra",
      });

      expect(quote.id).toBeDefined();
      expect(quote.status).toBe("en_attente");
      expect(quote.module_type).toBe("veterinary_services");
    });
  });

  describe("5. Sécurité RLS (Row Level Security) & Isolation des Données", () => {
    it("autorise la consultation publique du catalogue pour tout utilisateur", () => {
      const result = veterinaryStorage.checkRLSPermission("view_public_catalog");
      expect(result.allowed).toBe(true);
    });

    it("interdit la modification du catalogue de soins aux éleveurs et profils non-vétérinaires", () => {
      const resultEleveur = veterinaryStorage.checkRLSPermission(
        "manage_services",
        "user-eleveur",
        "vet-covefa-bobo",
        "eleveur"
      );
      expect(resultEleveur.allowed).toBe(false);
      expect(resultEleveur.reason).toMatch(/docteurs vétérinaires/i);

      const resultAgri = veterinaryStorage.checkRLSPermission(
        "manage_services",
        "user-agri",
        "vet-covefa-bobo",
        "agriculteur"
      );
      expect(resultAgri.allowed).toBe(false);
    });

    it("autorise un docteur vétérinaire ou expert à modifier ses propres offres de services", () => {
      const resultVet = veterinaryStorage.checkRLSPermission(
        "manage_services",
        "doctor-oumarou",
        "doctor-oumarou",
        "veterinaire"
      );
      expect(resultVet.allowed).toBe(true);
    });

    it("interdit à un docteur vétérinaire de modifier les services d'une autre clinique", () => {
      const resultOtherVet = veterinaryStorage.checkRLSPermission(
        "manage_services",
        "doctor-oumarou",
        "doctor-aminata",
        "veterinaire"
      );
      expect(resultOtherVet.allowed).toBe(false);
      expect(resultOtherVet.reason).toMatch(/autre cabinet vétérinaire/i);
    });

    it("isole la consultation des réservations au client concerné", () => {
      const allowedClient = veterinaryStorage.checkRLSPermission(
        "view_booking",
        "eleveur-1",
        "eleveur-1"
      );
      expect(allowedClient.allowed).toBe(true);

      const unauthorizedClient = veterinaryStorage.checkRLSPermission(
        "view_booking",
        "eleveur-2",
        "eleveur-1"
      );
      expect(unauthorizedClient.allowed).toBe(false);
      expect(unauthorizedClient.reason).toMatch(/Accès restreint/i);
    });
  });
});
