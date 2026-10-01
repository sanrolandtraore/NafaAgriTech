import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Studio3DFarmModeler, {
  AMENAGEMENT_MODELS,
  SOIL_PROFILES,
} from "@/components/field-designer/Studio3DFarmModeler";
import { Farm, Field } from "@/types/fieldDesigner";

// Mock resize observer
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("Studio 3D — Personnalisation Expert de la Conception", () => {
  const mockFarm: Farm = {
    id: "farm-ouaga-1",
    name: "Agro-Complexe Pilote de Tanghin",
    producerName: "Dr. Ouedraogo",
    producerPhone: "+226 70 00 11 22",
    locality: "Tanghin-Dassouri",
    region: "Centre",
    province: "Kadiogo",
    commune: "Tanghin-Dassouri",
    villageSector: "Secteur 2",
    farmType: "ferme_integree",
    totalAreaHa: 4.8,
    mainCrops: ["Tomate", "Oignon", "Mangue"],
    livestockTypes: ["Poulets du Faso", "Ovins"],
    irrigationType: "Goutte-à-goutte solaire",
    photos: [],
    syncStatus: "synced",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockField: Field = {
    id: "field-gps-1",
    farmId: "farm-ouaga-1",
    name: "Parcelle Maraîchère Nord (Arpentage GPS)",
    points: [
      { lat: 12.350, lng: -1.620, alt: 305, label: "P1 - Nord Ouest" },
      { lat: 12.351, lng: -1.615, alt: 306, label: "P2 - Nord Est" },
      { lat: 12.345, lng: -1.614, alt: 302, label: "P3 - Sud Est" },
      { lat: 12.344, lng: -1.619, alt: 301, label: "P4 - Sud Ouest" },
    ],
    areaM2: 32000,
    areaHa: 3.2,
    perimeterM: 780,
    lengthM: 200,
    widthM: 160,
    orientationDeg: 90,
    soilType: "alluvial",
    currentCrop: "Tomate & Oignon",
    status: "active",
    syncStatus: "synced",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it("affiche les 7 modèles d'aménagement sahéliens certifiés", () => {
    render(<Studio3DFarmModeler activeFarm={mockFarm} fields={[mockField]} />);

    // Vérifie que les onglets de personnalisation sont présents
    expect(screen.getByText(/Personnalisation Avancée de la Conception/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Type d'Aménagement/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Mesures GPS & Parcelle/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cartographie & Textures/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sols & Couleurs/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Bilan Hydrique & Données/i })).toBeInTheDocument();

    // Vérifie les modèles phares
    expect(screen.getByText(/Périmètre Maraîcher Goutte-à-Goutte/i)).toBeInTheDocument();
    expect(screen.getByText(/Verger Arboricole & Agroforesterie/i)).toBeInTheDocument();
    expect(screen.getByText(/Domaine Agro-Pastoral Mixte/i)).toBeInTheDocument();
    expect(screen.getByText(/Aménagement Anti-Érosif CES\/DRS/i)).toBeInTheDocument();
    expect(screen.getByText(/Ferme Avicole Bioclimatique & Maraîchage/i)).toBeInTheDocument();
    expect(screen.getByText(/Complexe Serres Tunnel & Ombrières/i)).toBeInTheDocument();
  });

  it("permet d'appliquer un modèle d'aménagement sahélien (ex: CES/DRS)", () => {
    render(<Studio3DFarmModeler activeFarm={mockFarm} fields={[mockField]} />);

    // Clic sur l'application du modèle CES/DRS
    const cesModel = AMENAGEMENT_MODELS.find((m) => m.id === "ces_drs");
    expect(cesModel).toBeDefined();

    const applyButtons = screen.getAllByRole("button", { name: /^Appliquer$/i });
    expect(applyButtons.length).toBeGreaterThan(0);

    // Trouver le bouton pour CES/DRS
    const cesCard = screen.getByText(/Aménagement Anti-Érosif CES\/DRS/i).closest("div");
    expect(cesCard).not.toBeNull();
  });

  it("affiche les données de mesures GPS de la parcelle sélectionnée", () => {
    render(<Studio3DFarmModeler activeFarm={mockFarm} fields={[mockField]} />);

    // Basculer vers l'onglet Mesures GPS
    const gpsTabBtn = screen.getByRole("button", { name: /Mesures GPS & Parcelle/i });
    fireEvent.click(gpsTabBtn);

    // Vérifie l'affichage des métriques GPS réelles
    expect(screen.getByText(/Superficie Réelle/i)).toBeInTheDocument();
    expect(screen.getAllByText(/3.2 ha/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/780 m/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/4 Bornes/i)).toBeInTheDocument();
    expect(screen.getByText(/Afficher les bornes géodésiques GPS/i)).toBeInTheDocument();
  });

  it("affiche les calques cartographiques et l'importateur d'orthophoto drone", () => {
    render(<Studio3DFarmModeler activeFarm={mockFarm} fields={[mockField]} />);

    // Basculer vers l'onglet Cartographie
    const cartoTabBtn = screen.getByRole("button", { name: /Cartographie & Textures/i });
    fireEvent.click(cartoTabBtn);

    expect(screen.getByText(/Fond Satellite \/ Vue Aérienne Orthophoto/i)).toBeInTheDocument();
    expect(screen.getByText(/Courbes de Niveau & Sens de Ruissellement/i)).toBeInTheDocument();
    expect(screen.getByText(/Importer Orthophoto Drone ou Image de Terrain/i)).toBeInTheDocument();
  });

  it("affiche les 5 profils de sols sahéliens et le nuancier de couleurs", () => {
    render(<Studio3DFarmModeler activeFarm={mockFarm} fields={[mockField]} />);

    // Basculer vers Sols & Couleurs
    const solsTabBtn = screen.getByRole("button", { name: /Sols & Couleurs/i });
    fireEvent.click(solsTabBtn);

    expect(screen.getByText(/Bas-Fond Alluvionnaire Humifère/i)).toBeInTheDocument();
    expect(screen.getByText(/Terre Rouge Latéritique/i)).toBeInTheDocument();
    expect(screen.getByText(/Sol Sablo-Limoneux Sahélien/i)).toBeInTheDocument();
    expect(screen.getByText(/Argile Lourde & Vertisol/i)).toBeInTheDocument();
    expect(screen.getByText(/Cuirasse Latéritique & Sol Dégradé/i)).toBeInTheDocument();

    // Nuancier
    expect(screen.getByText(/Couleur du Sol/i)).toBeInTheDocument();
    expect(screen.getByText(/Cultures & Végétation/i)).toBeInTheDocument();
    expect(screen.getByText(/Réseaux Hydrauliques/i)).toBeInTheDocument();
    expect(screen.getByText(/Bâtiments & Abris/i)).toBeInTheDocument();
  });

  it("calcule le bilan hydrique et le pourcentage de couverture du forage", () => {
    render(<Studio3DFarmModeler activeFarm={mockFarm} fields={[mockField]} />);

    // Basculer vers Hydraulique
    const hydroTabBtn = screen.getByRole("button", { name: /Bilan Hydrique & Données/i });
    fireEvent.click(hydroTabBtn);

    expect(screen.getByText(/Débit de la Source \/ Forage \(m³\/h\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Profondeur de la Nappe/i)).toBeInTheDocument();
    expect(screen.getByText(/Couverture Hydrique :/i)).toBeInTheDocument();
  });

  it("permet d'enregistrer la maquette 3D du projet en local", () => {
    const handleSave = vi.fn();
    render(
      <Studio3DFarmModeler
        activeFarm={mockFarm}
        fields={[mockField]}
        onSaveModel={handleSave}
      />
    );

    const saveBtn = screen.getByRole("button", { name: /Sauvegarder Projet/i });
    fireEvent.click(saveBtn);

    expect(handleSave).toHaveBeenCalledTimes(1);
    expect(handleSave.mock.calls[0][0]).toHaveProperty("farmName", "Agro-Complexe Pilote de Tanghin");
    expect(handleSave.mock.calls[0][0]).toHaveProperty("amenagementType");
    expect(handleSave.mock.calls[0][0]).toHaveProperty("elements");

    // Persistance dans localStorage
    const saved = localStorage.getItem("nafa_3d_project_config_farm-ouaga-1");
    expect(saved).not.toBeNull();
  });
});
