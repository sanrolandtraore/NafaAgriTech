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

describe("Suite Professionnelle « Services Agronomiques & Conseils »", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    window.history.pushState({}, "", "/dashboard/services");
  });

  describe("1. Catalogue & Exhaustivité des 39+ Outils Professionnels", () => {
    it("charge le catalogue complet réparti dans les 5 domaines métier sans données fictives", () => {
      const allTools = agronomicToolkitStorage.getAllTools();
      expect(allTools.length).toBeGreaterThanOrEqual(39);

      // 1. Terrain & Cartographie
      const terrain = agronomicToolkitStorage.getToolsByCategory("terrain_carto");
      expect(terrain.length).toBe(7);
      const terrainTitles = terrain.map((t) => t.title);
      expect(terrainTitles).toContain("Inspection terrain");
      expect(terrainTitles).toContain("Cartographie GPS");
      expect(terrainTitles).toContain("Mesure de parcelle");
      expect(terrainTitles).toContain("Calcul superficie");
      expect(terrainTitles).toContain("Relevé de points");
      expect(terrainTitles).toContain("Aménagement de ferme");
      expect(terrainTitles).toContain("Géolocalisation");

      // 2. Agronomie & Santé Végétale
      const agronomie = agronomicToolkitStorage.getToolsByCategory("agronomie");
      expect(agronomie.length).toBe(9);
      const agroTitles = agronomie.map((t) => t.title);
      expect(agroTitles).toContain("Diagnostic des cultures");
      expect(agroTitles).toContain("Identification des plantes");
      expect(agroTitles).toContain("Identification des mauvaises herbes");
      expect(agroTitles).toContain("Diagnostic des maladies");
      expect(agroTitles).toContain("Diagnostic des ravageurs");
      expect(agroTitles).toContain("Analyse des sols");
      expect(agroTitles).toContain("Recommandation de fertilisation");
      expect(agroTitles).toContain("Conseil cultural");
      expect(agroTitles).toContain("Suivi des cultures");

      // 3. Irrigation & Eau
      const irrigation = agronomicToolkitStorage.getToolsByCategory("irrigation");
      expect(irrigation.length).toBe(9);
      const irrTitles = irrigation.map((t) => t.title);
      expect(irrTitles).toContain("Concepteur d'irrigation");
      expect(irrTitles).toContain("Calcul du débit");
      expect(irrTitles).toContain("Calcul de pression");
      expect(irrTitles).toContain("Dimensionnement des tuyaux");
      expect(irrTitles).toContain("Dimensionnement de pompe");
      expect(irrTitles).toContain("Goutte-à-goutte");
      expect(irrTitles).toContain("Aspersion");
      expect(irrTitles).toContain("Micro-aspersion");
      expect(irrTitles).toContain("Gestion de l'eau");

      // 4. Conception & Ingénierie
      const ingenierie = agronomicToolkitStorage.getToolsByCategory("ingenierie");
      expect(ingenierie.length).toBeGreaterThanOrEqual(7);
      const ingTitles = ingenierie.map((t) => t.title);
      expect(ingTitles).toContain("Studio CAO / SIG / IRRICAD 3D");
      expect(ingTitles).toContain("NAFA Farm Designer");
      expect(ingTitles).toContain("Visualisation 3D");
      expect(ingTitles).toContain("Conception de ferme");
      expect(ingTitles).toContain("Conception de serre");
      expect(ingTitles).toContain("Conception d'infrastructures");
      expect(ingTitles).toContain("Calcul des matériaux");
      expect(ingTitles).toContain("Calculateur de devis");

      // 5. Gestion & Analyse
      const gestion = agronomicToolkitStorage.getToolsByCategory("gestion_analyse");
      expect(gestion.length).toBe(7);
      const gestTitles = gestion.map((t) => t.title);
      expect(gestTitles).toContain("Rapport d'inspection");
      expect(gestTitles).toContain("Rapport agronomique");
      expect(gestTitles).toContain("Tableau de bord exploitation");
      expect(gestTitles).toContain("Suivi de projet");
      expect(gestTitles).toContain("Analyse des données");
      expect(gestTitles).toContain("Historique des interventions");
      expect(gestTitles).toContain("Génération de rapports PDF");
    });

    it("vérifie que chaque outil possède son badge de connectivité Hors ligne ou En ligne", () => {
      const allTools = agronomicToolkitStorage.getAllTools();
      allTools.forEach((tool) => {
        expect(typeof tool.isOffline).toBe("boolean");
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
      expect(screen.getByRole("heading", { name: /Services Agronomiques & Conseils/i })).toBeInTheDocument();
      expect(screen.getByText(/Suite Professionnelle d'Ingénierie & Conseil Agronomique/i)).toBeInTheDocument();

      // Vérifie la présence de cartes clés
      expect(screen.getAllByText("Cartographie GPS").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Concepteur d'irrigation").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Diagnostic des cultures").length).toBeGreaterThan(0);

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
        expect(screen.getAllByText("Mesure de parcelle").length).toBeGreaterThan(0);
        expect(screen.queryByText("Concepteur d'irrigation")).toBeNull();
      });
    });

    it("retrouve directement l'outil correspondant à 'Concevoir une irrigation'", async () => {
      mockAuth("agronome");

      renderWithProviders(<ServicesPage />);

      const searchInput = screen.getByPlaceholderText(/Que voulez-vous faire \?/i);
      fireEvent.change(searchInput, { target: { value: "Concevoir une irrigation" } });

      await waitFor(() => {
        expect(screen.getAllByText("Concepteur d'irrigation").length).toBeGreaterThan(0);
        expect(screen.queryByText("Diagnostic des ravageurs")).toBeNull();
      });
    });

    it("retrouve directement l'outil correspondant à 'Diagnostiquer une maladie'", async () => {
      mockAuth("agronome");

      renderWithProviders(<ServicesPage />);

      const searchInput = screen.getByPlaceholderText(/Que voulez-vous faire \?/i);
      fireEvent.change(searchInput, { target: { value: "Diagnostiquer une maladie" } });

      await waitFor(() => {
        expect(screen.getAllByText("Diagnostic des maladies").length).toBeGreaterThan(0);
      });
    });

    it("retrouve directement l'outil correspondant à 'Faire un devis'", async () => {
      mockAuth("agronome");

      renderWithProviders(<ServicesPage />);

      const searchInput = screen.getByPlaceholderText(/Que voulez-vous faire \?/i);
      fireEvent.change(searchInput, { target: { value: "Faire un devis" } });

      await waitFor(() => {
        expect(screen.getAllByText("Calculateur de devis").length).toBeGreaterThan(0);
      });
    });
  });

  describe("4. Carte Spéciale & Plus Visible : NAFA Genius IA", () => {
    it("affiche la carte héro NAFA Genius avec ses 7 actions directes", () => {
      mockAuth("agronome");

      renderWithProviders(<ServicesPage />);

      // Titre & Badge NAFA Genius
      expect(screen.getByRole("heading", { name: /NAFA Genius/i })).toBeInTheDocument();
      expect(screen.getByText(/Votre copilote d'ingénierie agricole/i)).toBeInTheDocument();

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

  describe("5. Outils Favoris ⭐ et Outils Récemment Utilisés", () => {
    it("permet de basculer un outil en favori et persiste le choix localement", async () => {
      mockAuth("agronome");

      renderWithProviders(<ServicesPage />);

      // Section favoris visible
      expect(screen.getByText(/Mes outils favoris/i)).toBeInTheDocument();

      // Tester l'ajout/retrait de favori via le stockage
      const isFavInitially = agronomicToolkitStorage.isFavorite("tool-inspection-terrain");
      expect(typeof isFavInitially).toBe("boolean");

      agronomicToolkitStorage.toggleFavoriteTool("tool-conception-serre");
      expect(agronomicToolkitStorage.isFavorite("tool-conception-serre")).toBe(true);

      agronomicToolkitStorage.toggleFavoriteTool("tool-conception-serre");
      expect(agronomicToolkitStorage.isFavorite("tool-conception-serre")).toBe(false);
    }, 15000);

    it("enregistre l'historique des outils récemment utilisés", () => {
      agronomicToolkitStorage.recordToolUsage("tool-calcul-debit");
      agronomicToolkitStorage.recordToolUsage("tool-analyse-sols");

      const recents = agronomicToolkitStorage.getRecentTools();
      expect(recents.length).toBeGreaterThanOrEqual(2);
      expect(recents[0].id).toBe("tool-analyse-sols");
      expect(recents[1].id).toBe("tool-calcul-debit");
    });
  });

  describe("6. IA Contextuelle Liée aux Outils", () => {
    it("ouvre la modale d'aide contextuelle pour un outil sélectionné", async () => {
      mockAuth("agronome");

      renderWithProviders(<ServicesPage />);

      // Cliquer sur le premier bouton d'aide IA
      const aiButtons = await screen.findAllByRole("button", { name: /Aide IA pour/i });
      fireEvent.click(aiButtons[0]);

      // Vérifier l'ouverture de la modale avec les suggestions contextuelles
      const dialog = await screen.findByRole("dialog", {}, { timeout: 8000 });
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByText(/IA Contextuelle NAFA Genius/i)).toBeInTheDocument();
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
