import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import SmartInspectionPage from "@/pages/dashboard/SmartInspectionPage";

const renderPage = () => {
  return render(
    <BrowserRouter>
      <SmartInspectionPage />
    </BrowserRouter>
  );
};

describe("Smart Inspection UI - Workflow 5 Étapes NAFA Genius IA", () => {
  beforeEach(() => {
    localStorage.clear();
    window.scrollTo = () => {};
  });

  it("affiche l'écran initial de sélection de mission avec les catégories", () => {
    renderPage();
    expect(screen.getByText(/Inspection Intelligente/i)).toBeInTheDocument();
    expect(screen.getAllByText(/NAFA Genius IA/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Étape 1 : Choisissez la mission d'inspection")).toBeInTheDocument();

    // Catégories visibles
    expect(screen.getByText("Agriculture & Aménagement")).toBeInTheDocument();
    expect(screen.getByText("Élevage & Zootechnie")).toBeInTheDocument();
    expect(screen.getByText("Machinisme & Travaux")).toBeInTheDocument();
  });

  it("sélectionne une mission d'irrigation et bascule vers le formulaire IA adapté", async () => {
    renderPage();

    // Cliquer sur "Installation de goutte-à-goutte"
    const goutteBtn = screen.getByText("Installation de goutte-à-goutte");
    fireEvent.click(goutteBtn);

    // Vérifie le passage à l'étape 2
    expect(await screen.findByText("Étape 2 : Collecte des données terrain")).toBeInTheDocument();
    expect(screen.getAllByText(/Installation de goutte-à-goutte/i).length).toBeGreaterThanOrEqual(1);

    // Champs spécifiques générés par l'IA
    expect(screen.getByText(/Superficie à irriguer/i)).toBeInTheDocument();
    expect(screen.getByText(/Pente estimée du terrain/i)).toBeInTheDocument();
    expect(screen.getByText(/Source d'eau principale/i)).toBeInTheDocument();
    expect(screen.getByText(/Débit disponible mesuré/i)).toBeInTheDocument();

    // Photos obligatoires
    expect(screen.getByText("Source d'eau & Tête de forage")).toBeInTheDocument();
    expect(screen.getByText("Vue panoramique de la parcelle")).toBeInTheDocument();

    // Mesures techniques avec conformité
    expect(screen.getByText("Débit au refoulement")).toBeInTheDocument();
    expect(screen.getByText("Pression statique tête")).toBeInTheDocument();

    // Croquis interactif et signatures
    expect(screen.getByText("Croquis de terrain interactif")).toBeInTheDocument();
    expect(screen.getByText("Signature du Client")).toBeInTheDocument();
    expect(screen.getByText("Signature de l'Expert NAFA")).toBeInTheDocument();
  });

  it("permet de saisir les données de terrain et d'accéder au rapport et devis chiffré", async () => {
    renderPage();

    // Choisir mission
    const missionBtn = screen.getByText("Système d'irrigation");
    fireEvent.click(missionBtn);

    // Renseigner nom client
    const clientInput = await screen.findByPlaceholderText(/Ferme Agro-Pastorale Wend-Panga/i);
    fireEvent.change(clientInput, { target: { value: "Ferme Moderne de Bama" } });

    // Valider et générer le rapport
    const proceedBtn = screen.getByText("Valider et Générer le Rapport & Devis");
    fireEvent.click(proceedBtn);

    // Étape 3 atteinte
    expect(await screen.findByText(/Étape 3 : Rapport automatique, Plans 2D & Devis Chiffré/i)).toBeInTheDocument();
    expect(screen.getByText("Télécharger PDF Officiel")).toBeInTheDocument();
    expect(screen.getByText("Score de Conformité")).toBeInTheDocument();
    expect(screen.getByText(/Devis Chiffré & Fournisseurs Agréés/i)).toBeInTheDocument();
  });

  it("respecte scrupuleusement la règle Zéro-Emoji dans toute l'interface", () => {
    const { container } = renderPage();
    const text = container.textContent || "";
    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(text)).toBe(false);
  });
});
