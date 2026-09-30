import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import SmartInspectionPage from "@/pages/dashboard/SmartInspectionPage";
import {
  nafaInspectionEngine,
  generateSmartFormTemplate,
} from "@/lib/nafaSmartInspectionEngine";

const renderPage = () => {
  return render(
    <BrowserRouter>
      <SmartInspectionPage />
    </BrowserRouter>
  );
};

describe("Inspection Intelligente — Générateur de Formulaires Personnalisés (NAFA Genius)", () => {
  beforeEach(() => {
    localStorage.clear();
    window.scrollTo = () => {};
  });

  it("génère intelligemment la structure technique d'un formulaire selon le domaine (Irrigation)", () => {
    const generated = generateSmartFormTemplate({
      prompt: "Audit d'un réseau goutte-à-goutte avec forage solaire et filtration",
      name: "Irrigation Goutte-à-Goutte Bio",
      category: "agriculture",
    });

    expect(generated.name).toBe("Irrigation Goutte-à-Goutte Bio");
    expect(generated.category).toBe("agriculture");
    expect(generated.generates_plan).toBe(true);
    expect(generated.generates_quote).toBe(true);

    // Vérification des champs techniques générés
    const fieldKeys = generated.fields_schema.map((f) => f.key);
    expect(fieldKeys).toContain("superficie_ha");
    expect(fieldKeys).toContain("source_eau");
    expect(fieldKeys).toContain("debit_disponible_m3h");
    expect(fieldKeys).toContain("pression_service_bar");

    // Photos obligatoires
    const photoLabels = generated.required_photos.map((p) => p.label);
    expect(photoLabels.some((l) => l.includes("Source d'eau"))).toBe(true);

    // Mesures sous contrôle
    const measureNames = generated.default_measurements.map((m) => m.name);
    expect(measureNames.some((m) => m.includes("Débit"))).toBe(true);
    expect(measureNames.some((m) => m.includes("Pression"))).toBe(true);
  });

  it("génère intelligemment la structure technique d'un formulaire pour l'Élevage Avicole", () => {
    const generated = generateSmartFormTemplate({
      prompt: "Inspection poulailler 5000 pondeuses avec ventilation dynamique et biosécurité",
      category: "elevage",
    });

    expect(generated.category).toBe("elevage");
    const fieldKeys = generated.fields_schema.map((f) => f.key);
    expect(fieldKeys).toContain("effectif_sujets");
    expect(fieldKeys).toContain("type_ventilation");
    expect(fieldKeys).toContain("sas_sanitaire");

    // Mesures avicoles
    const measureNames = generated.default_measurements.map((m) => m.name);
    expect(measureNames.some((m) => m.includes("Densité"))).toBe(true);
    expect(measureNames.some((m) => m.includes("Température"))).toBe(true);
  });

  it("permet à l'utilisateur de sauvegarder, dupliquer et supprimer un formulaire personnalisé", () => {
    // 1. Sauvegarde d'un modèle personnalisé
    const saved = nafaInspectionEngine.saveCustomFormTemplate({
      name: "Audit Verger d'Anacardiers Sahel",
      category: "agriculture",
      description: "Inspection spécifique pour anacardiers avec contrôle d'anthracnose.",
      fields_schema: [
        { key: "nb_arbres", label: "Nombre de pieds d'anacardiers", type: "number", required: true, defaultValue: 150 },
        { key: "espacement_m", label: "Espacement entre plants", type: "number", unit: "m", required: true, defaultValue: 10 },
      ],
      required_photos: [
        { key: "photo_panoramique", label: "Vue panoramique verger", description: "Cadrage canopée.", is_mandatory: true },
      ],
      default_measurements: [
        { name: "Taux d'infestation foliaire", unit: "%", min_threshold: 0, max_threshold: 15, default_norm: "Seuil économique" },
      ],
      generates_plan: true,
      generates_quote: true,
    });

    expect(saved.type.id).toMatch(/^it-custom-/);
    expect(saved.type.is_system).toBe(false);

    // Vérification de la présence dans la liste
    const customList = nafaInspectionEngine.getCustomTypes();
    expect(customList.some((t) => t.id === saved.type.id)).toBe(true);

    // 2. Duplication du modèle
    const duplicated = nafaInspectionEngine.duplicateCustomType(saved.type.id);
    expect(duplicated).not.toBeNull();
    expect(duplicated?.type.name).toContain("(Personnalisé)");

    // 3. Suppression du modèle dupliqué
    if (duplicated) {
      const deleted = nafaInspectionEngine.deleteCustomType(duplicated.type.id);
      expect(deleted).toBe(true);
    }
  });

  it("affiche l'onglet 'Formulaires Personnalisés' dans la page d'inspection", async () => {
    renderPage();

    // Onglet Formulaires Personnalisés visible
    const templatesTabTrigger = screen.getByRole("tab", { name: /Formulaires Personnalisés/i });
    expect(templatesTabTrigger).toBeInTheDocument();

    // Clic / PointerDown sur l'onglet
    fireEvent.pointerDown(templatesTabTrigger, { button: 0 });
    fireEvent.keyDown(templatesTabTrigger, { key: "Enter" });

    // Titre et bouton de création visibles
    expect(await screen.findByText("Formulaires d'Inspection Personnalisés")).toBeInTheDocument();
    expect(screen.getByText("Générer un nouveau formulaire")).toBeInTheDocument();
    expect(screen.getByText("Partir d'un modèle d'expertise préconfiguré")).toBeInTheDocument();
  });

  it("permet d'ouvrir le modal de génération de formulaire personnalisé depuis le sélecteur de mission et de configurer des champs", async () => {
    renderPage();

    // Le bouton de génération de formulaire personnalisé est disponible immédiatement à l'étape 1
    const generateBtn = screen.getByRole("button", { name: /Générer un formulaire personnalisé/i });
    expect(generateBtn).toBeInTheDocument();
    fireEvent.click(generateBtn);

    // Vérifier la présence du modal
    expect(await screen.findByText("Générateur de Formulaire Personnalisé")).toBeInTheDocument();
    expect(screen.getByText("Assistant IA")).toBeInTheDocument();
    expect(screen.getByText("Suggestions prêtes à l'emploi :")).toBeInTheDocument();

    // Cliquer sur une suggestion rapide
    const suggestionBtn = screen.getByText("Verger d'anacardiers & Goutte-à-goutte");
    fireEvent.click(suggestionBtn);

    // La structure est générée et bascule sur l'onglet Général
    await waitFor(() => {
      expect(screen.getByText("Nom du formulaire personnalisé *")).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText(/Ex: Inspection Verger d'Agrumes/i);
    fireEvent.change(nameInput, { target: { value: "Mon Verger d'Anacardiers Sahel" } });

    // Enregistrer le modèle
    const saveBtn = screen.getByRole("button", { name: /Enregistrer le modèle/i });
    fireEvent.click(saveBtn);

    // Le modèle apparaît dans la grille des missions
    await waitFor(() => {
      expect(screen.getByText("Mon Verger d'Anacardiers Sahel")).toBeInTheDocument();
    });
  });

  it("respecte la règle Zéro-Emoji dans le module de personnalisation de formulaires", () => {
    const { container } = renderPage();
    const text = container.textContent || "";
    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(text)).toBe(false);
  });
});
