import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import ServicesPage from "@/pages/dashboard/ServicesPage";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  agronomicToolkitStorage,
  AGRONOMIC_TOOLS_CATALOG,
  TOOLKIT_CATEGORIES,
} from "@/lib/agronomicToolkitStorage";
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
const mockAuth = (role = "agronome", userId = "user-agronome-1") => {
  vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
    user: { id: userId, email: "agronome@sahel.bf" } as any,
    profile: {
      id: userId,
      role: role as any,
      full_name: "Dr. Moussa Ouédraogo",
      phone: "+226 70 20 30 40",
      city: "Ouagadougou",
    } as any,
    role: role as any,
    loading: false,
    session: {} as any,
    isExpert: true,
    isAdmin: false,
    isPartner: true,
    isProducer: false,
    signOut: vi.fn(),
  });
};

describe("Suite Professionnelle « NAFA FIELD DESIGNER »", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    window.history.pushState({}, "", "/dashboard/services");
  });

  describe("1. Catalogue Exclusif NAFA FIELD DESIGNER (40 anciens outils génériques retirés)", () => {
    it("charge uniquement les outils officiels de NAFA Field Designer sans données fictives", () => {
      const allTools = agronomicToolkitStorage.getAllTools();
      // Les 40 anciens outils par domaine sont retirés, il ne reste que les outils officiels de NAFA Field Designer
      expect(allTools.length).toBe(13);

      const allTitles = allTools.map((t) => t.title);
      expect(allTitles).toContain("Mesure GPS & Arpentage de Parcelle");
      expect(allTitles).toContain("Farm Map & SIG Parcellaire");
      expect(allTitles).toContain("Crop Designer — Lignes de Plantation");
      expect(allTitles).toContain("Concepteur d'Irrigation — Réseaux & Pompage");
      expect(allTitles).toContain("Livestock Designer — Bâtiments d'Élevage");
      expect(allTitles).toContain("Farm Builder — Concepteur de Ferme 2D");
      expect(allTitles).toContain("Modélisation & Aménagement 3D de Ferme");
      expect(allTitles).toContain("Calculateur de Devis Officiels FCFA");
      expect(allTitles).toContain("Diagnostic des Cultures & Ravageurs");
      expect(allTitles).toContain("Rapports de Visite & Diagnostic Terrain");
      expect(allTitles).toContain("Copilote NAFA IA Terrain");
      expect(allTitles).toContain("Bibliothèque des Cultures Sahéliennes");
      expect(allTitles).toContain("Métrés & Estimation des Matériaux");
    });

    it("vérifie que chaque outil possède son badge de connectivité 100% Hors ligne", () => {
      const allTools = agronomicToolkitStorage.getAllTools();
      allTools.forEach((tool) => {
        expect(tool.isOffline).toBe(true);
        expect(tool.description.length).toBeGreaterThan(10);
        expect(tool.route).toMatch(/^\/dashboard\//);
      });
    });
  });

  describe("2. Affichage Visuel en Cartes Interactives (Zéro Longue Liste)", () => {
    it("affiche les outils sous forme de cartes avec icône, nom, description, badge et bouton Ouvrir", async () => {
      mockAuth("agronome");

      renderWithProviders(<ServicesPage />);

      // En-tête officiel
      expect(screen.getByRole("heading", { level: 1, name: /NAFA FIELD DESIGNER/i })).toBeInTheDocument();
      expect(screen.getByText(/Suite d'Ingénierie & d'Intervention Terrain/i)).toBeInTheDocument();

      // Vérifie la présence de cartes clés NAFA FIELD DESIGNER
      expect(screen.getAllByText("Mesure GPS & Arpentage de Parcelle").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Concepteur d'Irrigation — Réseaux & Pompage").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Diagnostic des Cultures & Ravageurs").length).toBeGreaterThan(0);

      // Boutons "Ouvrir" disponibles sur les cartes
      const openButtons = screen.getAllByRole("button", { name: /Ouvrir/i });
      expect(openButtons.length).toBeGreaterThan(0);
    });
  });

  describe("3. Recherche Intelligente « Que voulez-vous faire ? »", () => {
    it("retrouve directement l'outil correspondant à 'Mesurer une parcelle'", async () => {
      mockAuth("agronome");

      renderWithProviders(<ServicesPage />);

      const searchInput = screen.getByPlaceholderText(/Que voulez-vous faire \?/i);
      fireEvent.change(searchInput, { target: { value: "Mesurer une parcelle" } });

      await waitFor(() => {
        expect(screen.getAllByText("Mesure GPS & Arpentage de Parcelle").length).toBeGreaterThan(0);
        expect(screen.queryByText("Concepteur d'Irrigation — Réseaux & Pompage")).toBeNull();
      });
    });

    it("retrouve directement l'outil correspondant à 'Concevoir une irrigation'", async () => {
      mockAuth("agronome");

      renderWithProviders(<ServicesPage />);

      const searchInput = screen.getByPlaceholderText(/Que voulez-vous faire \?/i);
      fireEvent.change(searchInput, { target: { value: "Concevoir une irrigation" } });

      await waitFor(() => {
        expect(screen.getAllByText("Concepteur d'Irrigation — Réseaux & Pompage").length).toBeGreaterThan(0);
        expect(screen.queryByText("Diagnostic des Cultures & Ravageurs")).toBeNull();
      });
    });

    it("retrouve directement l'outil correspondant à 'Diagnostiquer une maladie'", async () => {
      mockAuth("agronome");

      renderWithProviders(<ServicesPage />);

      const searchInput = screen.getByPlaceholderText(/Que voulez-vous faire \?/i);
      fireEvent.change(searchInput, { target: { value: "Diagnostiquer une maladie" } });

      await waitFor(() => {
        expect(screen.getAllByText("Diagnostic des Cultures & Ravageurs").length).toBeGreaterThan(0);
      });
    });

    it("retrouve directement l'outil correspondant à 'Faire un devis'", async () => {
      mockAuth("agronome");

      renderWithProviders(<ServicesPage />);

      const searchInput = screen.getByPlaceholderText(/Que voulez-vous faire \?/i);
      fireEvent.change(searchInput, { target: { value: "Faire un devis" } });

      await waitFor(() => {
        expect(screen.getAllByText("Calculateur de Devis Officiels FCFA").length).toBeGreaterThan(0);
      });
    });
  });

  describe("4. Carte Spéciale & Plus Visible : NAFA Genius / Field Designer", () => {
    it("affiche la carte héro NAFA Genius avec ses 7 actions directes", () => {
      mockAuth("agronome");

      renderWithProviders(<ServicesPage />);

      // Titre & En-tête
      expect(screen.getAllByRole("heading", { name: /NAFA FIELD DESIGNER/i }).length).toBeGreaterThan(0);
      expect(screen.getByText(/Suite d'Ingénierie Agricole • Disponible sans connexion/i)).toBeInTheDocument();

      // Les 7 actions d'ingénierie directe obligatoires :
      expect(screen.getAllByRole("button", { name: /Analyser/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole("button", { name: /Concevoir/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole("button", { name: /Calculer/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole("button", { name: /Diagnostiquer/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole("button", { name: /Générer un plan/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole("button", { name: /Générer un devis/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole("button", { name: /Générer un rapport/i }).length).toBeGreaterThan(0);
    }, 40000);
  });

  describe("5. Outils Favoris et Outils Récemment Utilisés", () => {
    it("permet de basculer un outil en favori et persiste le choix localement", async () => {
      mockAuth("agronome");

      renderWithProviders(<ServicesPage />);

      // Section favoris visible
      expect(screen.getByText(/Mes outils favoris/i)).toBeInTheDocument();

      // Tester l'ajout/retrait de favori via le stockage
      const isFavInitially = agronomicToolkitStorage.isFavorite("tool-mesure-gps");
      expect(typeof isFavInitially).toBe("boolean");

      agronomicToolkitStorage.toggleFavoriteTool("tool-farm-builder");
      expect(agronomicToolkitStorage.isFavorite("tool-farm-builder")).toBe(false); // was true by default

      agronomicToolkitStorage.toggleFavoriteTool("tool-farm-builder");
      expect(agronomicToolkitStorage.isFavorite("tool-farm-builder")).toBe(true);
    }, 15000);

    it("enregistre l'historique des outils récemment utilisés", () => {
      agronomicToolkitStorage.recordToolUsage("tool-irrigation-designer");
      agronomicToolkitStorage.recordToolUsage("tool-crop-designer");

      const recents = agronomicToolkitStorage.getRecentTools();
      expect(recents.length).toBeGreaterThanOrEqual(2);
      expect(recents[0].id).toBe("tool-crop-designer");
      expect(recents[1].id).toBe("tool-irrigation-designer");
    });
  });

  describe("6. Assistance Contextuelle Liée aux Outils", () => {
    it("ouvre la modale d'aide contextuelle pour un outil sélectionné", async () => {
      mockAuth("agronome");

      renderWithProviders(<ServicesPage />);

      // Cliquer sur le premier bouton d'aide IA
      const aiButtons = await screen.findAllByRole("button", { name: /Aide pour/i });
      fireEvent.click(aiButtons[0]);

      // Vérifier l'ouverture de la modale avec les suggestions contextuelles
      const dialog = await screen.findByRole("dialog", {}, { timeout: 8000 });
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByText(/Assistance NAFA Genius/i)).toBeInTheDocument();
      expect(within(dialog).getByText(/Contexte Métier Détecté/i)).toBeInTheDocument();
      expect(within(dialog).getByText(/Actions d'aide rapide en 1-clic/i)).toBeInTheDocument();
    }, 15000);
  });

  describe("7. Règle Stricte Zéro-Emoji dans les Textes Affichés", () => {
    it("respecte la règle Zéro-Emoji dans toute l'interface affichée", () => {
      mockAuth("agronome");

      const { container } = renderWithProviders(<ServicesPage />);

      // Regex détectant les emojis Unicode courants
      const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
      
      // On exclut l'élément svg et aria
      const textContent = container.textContent || "";
      expect(emojiRegex.test(textContent)).toBe(false);
    }, 15000);
  });
});
