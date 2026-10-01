import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Box,
  Compass,
  Download,
  Eye,
  Layers,
  Maximize2,
  Minimize2,
  Plus,
  RotateCw,
  Sun,
  Moon,
  Sunset,
  Trash2,
  CheckCircle2,
  Droplets,
  Building2,
  Sprout,
  Sparkles,
  Camera,
  FileSpreadsheet,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";

export type ElementCategory = "crop" | "irrigation" | "building" | "infrastructure";

export interface FarmElement3D {
  id: string;
  name: string;
  category: ElementCategory;
  type: string;
  x: number;
  z: number;
  width: number;
  length: number;
  height: number;
  rotation: number;
  costFcfa: number;
}

const PRESET_ELEMENTS = [
  // Aménagement agricole
  {
    type: "crop_maize",
    name: "Parcelle Maïs / Céréales",
    category: "crop" as ElementCategory,
    width: 20,
    length: 30,
    height: 2.2,
    color: 0x2e7d32,
    costFcfa: 450000,
    icon: Sprout,
  },
  {
    type: "crop_vegetables",
    name: "Planches Maraîchères (Tomate/Oignon)",
    category: "crop" as ElementCategory,
    width: 15,
    length: 25,
    height: 1.0,
    color: 0x4caf50,
    costFcfa: 350000,
    icon: Sprout,
  },
  {
    type: "greenhouse",
    name: "Serre Tunnel Maraîchère 3D",
    category: "crop" as ElementCategory,
    width: 10,
    length: 30,
    height: 3.5,
    color: 0x81d4fa,
    costFcfa: 2800000,
    icon: Building2,
  },
  {
    type: "orchard",
    name: "Verger Arboricole (Manguiers/Agrumes)",
    category: "crop" as ElementCategory,
    width: 25,
    length: 25,
    height: 4.5,
    color: 0x1b5e20,
    costFcfa: 650000,
    icon: Sprout,
  },
  // Irrigation
  {
    type: "solar_pump",
    name: "Champ Solaire & Motopompe 48V",
    category: "irrigation" as ElementCategory,
    width: 8,
    length: 6,
    height: 2.5,
    color: 0x0288d1,
    costFcfa: 3500000,
    icon: Droplets,
  },
  {
    type: "water_tower",
    name: "Château d'Eau Métallique (10 m³)",
    category: "irrigation" as ElementCategory,
    width: 5,
    length: 5,
    height: 8.0,
    color: 0x00acc1,
    costFcfa: 4200000,
    icon: Droplets,
  },
  {
    type: "drip_grid",
    name: "Réseau d'Irrigation Goutte-à-Goutte",
    category: "irrigation" as ElementCategory,
    width: 20,
    length: 30,
    height: 0.3,
    color: 0x00796b,
    costFcfa: 950000,
    icon: Droplets,
  },
  // Bâtiment d'Élevage
  {
    type: "poultry_house",
    name: "Bâtiment Avicole Bioclimatique (1000 sujets)",
    category: "building" as ElementCategory,
    width: 12,
    length: 35,
    height: 4.0,
    color: 0xd97706,
    costFcfa: 6500000,
    icon: Building2,
  },
  {
    type: "cattle_shed",
    name: "Étable Bovine / Bergerie Sahélienne",
    category: "building" as ElementCategory,
    width: 15,
    length: 25,
    height: 4.5,
    color: 0xb45309,
    costFcfa: 5200000,
    icon: Building2,
  },
  {
    type: "feed_warehouse",
    name: "Magasin Stockage & Provenderie",
    category: "building" as ElementCategory,
    width: 10,
    length: 15,
    height: 4.2,
    color: 0x78716c,
    costFcfa: 3800000,
    icon: Building2,
  },
  {
    type: "solar_coldroom",
    name: "Chambre Froide Solaire Maraîchère",
    category: "building" as ElementCategory,
    width: 8,
    length: 12,
    height: 3.5,
    color: 0x455a64,
    costFcfa: 7200000,
    icon: Building2,
  },
  {
    type: "retention_pond",
    name: "Bassin de Rétention / Pisciculture Bâché",
    category: "irrigation" as ElementCategory,
    width: 15,
    length: 20,
    height: 1.5,
    color: 0x0288d1,
    costFcfa: 1800000,
    icon: Droplets,
  },
  {
    type: "windbreak",
    name: "Haie Brise-Vent & Agroforesterie",
    category: "crop" as ElementCategory,
    width: 3,
    length: 30,
    height: 5.0,
    color: 0x33691e,
    costFcfa: 250000,
    icon: Sprout,
  },
];

export function Studio3DFarmModeler() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<FarmElement3D[]>([
    {
      id: "elem-1",
      name: "Bâtiment Avicole Bioclimatique",
      category: "building",
      type: "poultry_house",
      x: -25,
      z: -20,
      width: 12,
      length: 35,
      height: 4,
      rotation: 0,
      costFcfa: 6500000,
    },
    {
      id: "elem-2",
      name: "Château d'Eau Métallique",
      category: "irrigation",
      type: "water_tower",
      x: 0,
      z: -30,
      width: 5,
      length: 5,
      height: 8,
      rotation: 0,
      costFcfa: 4200000,
    },
    {
      id: "elem-3",
      name: "Champ Solaire & Motopompe",
      category: "irrigation",
      type: "solar_pump",
      x: 15,
      z: -30,
      width: 8,
      length: 6,
      height: 2.5,
      rotation: 0,
      costFcfa: 3500000,
    },
    {
      id: "elem-4",
      name: "Parcelle Maïs / Céréales",
      category: "crop",
      type: "crop_maize",
      x: -20,
      z: 20,
      width: 25,
      length: 35,
      height: 2.2,
      rotation: 0,
      costFcfa: 450000,
    },
    {
      id: "elem-5",
      name: "Planches Maraîchères Goutte-à-Goutte",
      category: "crop",
      type: "crop_vegetables",
      x: 20,
      z: 15,
      width: 20,
      length: 30,
      height: 1.0,
      rotation: 0,
      costFcfa: 350000,
    },
  ]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTabCategory, setActiveTabCategory] = useState<ElementCategory>("crop");
  const [lightingMode, setLightingMode] = useState<"day" | "sunset" | "night">("day");
  const [viewPreset, setViewPreset] = useState<"iso" | "top" | "free">("iso");
  const [isRotating, setIsRotating] = useState(false);

  // Three.js instances ref
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const objectsGroupRef = useRef<THREE.Group | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);

  // Mouse drag camera controls
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const cameraAnglesRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3, radius: 130 });

  const totalBudgetFcfa = elements.reduce((sum, el) => sum + el.costFcfa, 0);

  // Helper pour créer les meshs 3D selon le type d'élément
  const createElementMesh = useCallback((el: FarmElement3D): THREE.Object3D => {
    const group = new THREE.Group();
    group.name = el.id;
    group.position.set(el.x, 0, el.z);
    group.rotation.y = (el.rotation * Math.PI) / 180;

    if (el.type === "poultry_house") {
      // Hangar avicole bioclimatique 3D
      // Murs bas en maçonnerie
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.8 });
      const wallGeo = new THREE.BoxGeometry(el.width, el.height * 0.4, el.length);
      const walls = new THREE.Mesh(wallGeo, wallMat);
      walls.position.y = (el.height * 0.4) / 2;
      walls.castShadow = true;
      walls.receiveShadow = true;
      group.add(walls);

      // Poteaux et grillage de ventilation supérieure
      const postMat = new THREE.MeshStandardMaterial({ color: 0x546e7a, metalness: 0.5 });
      for (let z = -el.length / 2; z <= el.length / 2; z += 5) {
        const postGeo = new THREE.CylinderGeometry(0.15, 0.15, el.height * 0.6);
        const postLeft = new THREE.Mesh(postGeo, postMat);
        postLeft.position.set(-el.width / 2, el.height * 0.7, z);
        const postRight = postLeft.clone();
        postRight.position.x = el.width / 2;
        group.add(postLeft);
        group.add(postRight);
      }

      // Toiture double pente en tôle bac
      const roofMat = new THREE.MeshStandardMaterial({ color: 0xef6c00, metalness: 0.3, roughness: 0.4 });
      const roofLeftGeo = new THREE.BoxGeometry(el.width * 0.55, 0.15, el.length + 1);
      const roofLeft = new THREE.Mesh(roofLeftGeo, roofMat);
      roofLeft.position.set(-el.width * 0.25, el.height + 0.6, 0);
      roofLeft.rotation.z = 0.25;
      roofLeft.castShadow = true;
      const roofRight = roofLeft.clone();
      roofRight.position.x = el.width * 0.25;
      roofRight.rotation.z = -0.25;
      group.add(roofLeft);
      group.add(roofRight);
    } else if (el.type === "water_tower") {
      // Château d'eau métallique
      // 4 Piliers treillis
      const pMat = new THREE.MeshStandardMaterial({ color: 0x455a64, metalness: 0.7 });
      const pGeo = new THREE.CylinderGeometry(0.12, 0.18, el.height - 2.5);
      const offsets = [
        [-el.width * 0.35, -el.length * 0.35],
        [el.width * 0.35, -el.length * 0.35],
        [-el.width * 0.35, el.length * 0.35],
        [el.width * 0.35, el.length * 0.35],
      ];
      offsets.forEach(([px, pz]) => {
        const leg = new THREE.Mesh(pGeo, pMat);
        leg.position.set(px, (el.height - 2.5) / 2, pz);
        leg.castShadow = true;
        group.add(leg);
      });

      // Cuve d'eau cylindrique supérieure
      const tankGeo = new THREE.CylinderGeometry(el.width * 0.45, el.width * 0.45, 2.5, 24);
      const tankMat = new THREE.MeshStandardMaterial({ color: 0x00acc1, metalness: 0.6, roughness: 0.3 });
      const tank = new THREE.Mesh(tankGeo, tankMat);
      tank.position.y = el.height - 1.25;
      tank.castShadow = true;
      group.add(tank);
    } else if (el.type === "solar_pump") {
      // Panneaux photovoltaïques inclinés
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.8 });
      const panelMat = new THREE.MeshStandardMaterial({ color: 0x0d47a1, roughness: 0.1, metalness: 0.9 });

      for (let i = -1; i <= 1; i++) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(el.width * 0.28, 0.1, el.length * 0.7), panelMat);
        panel.position.set(i * el.width * 0.32, 1.6, 0);
        panel.rotation.x = 0.35; // Inclinaison 20° sahélienne face sud
        panel.castShadow = true;
        group.add(panel);
      }

      // Motopompe au sol
      const pumpGeo = new THREE.CylinderGeometry(0.6, 0.6, 1.2, 16);
      const pumpMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32 });
      const pump = new THREE.Mesh(pumpGeo, pumpMat);
      pump.rotation.z = Math.PI / 2;
      pump.position.set(0, 0.6, el.length * 0.35);
      group.add(pump);
    } else if (el.type === "crop_maize") {
      // Parcelle de maïs en sillons
      const fieldMat = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.9 });
      const field = new THREE.Mesh(new THREE.BoxGeometry(el.width, 0.2, el.length), fieldMat);
      field.position.y = 0.1;
      field.receiveShadow = true;
      group.add(field);

      // Rangées de plants
      const plantMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.5 });
      for (let x = -el.width / 2 + 1.5; x < el.width / 2; x += 3.5) {
        for (let z = -el.length / 2 + 1.5; z < el.length / 2; z += 4) {
          const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, el.height, 6), plantMat);
          stalk.position.set(x, el.height / 2, z);
          stalk.castShadow = true;
          group.add(stalk);
        }
      }
    } else if (el.type === "greenhouse") {
      // Serre tunnel avec arceaux
      const frameMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.8 });
      const coverMat = new THREE.MeshStandardMaterial({
        color: 0xe1f5fe,
        transparent: true,
        opacity: 0.55,
        roughness: 0.1,
      });

      const tunnelGeo = new THREE.CylinderGeometry(
        el.width / 2,
        el.width / 2,
        el.length,
        24,
        1,
        false,
        0,
        Math.PI
      );
      const tunnel = new THREE.Mesh(tunnelGeo, coverMat);
      tunnel.rotation.z = Math.PI / 2;
      tunnel.rotation.y = Math.PI / 2;
      tunnel.position.y = 0;
      tunnel.castShadow = true;
      group.add(tunnel);
    } else if (el.type === "retention_pond") {
      // Bassin de rétention d'eau bâché / Étang piscicole
      const bermMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9 });
      const berm = new THREE.Mesh(new THREE.BoxGeometry(el.width, 0.6, el.length), bermMat);
      berm.position.y = 0.3;
      berm.castShadow = true;
      group.add(berm);

      const waterMat = new THREE.MeshStandardMaterial({ color: 0x0288d1, roughness: 0.1, metalness: 0.8 });
      const water = new THREE.Mesh(new THREE.BoxGeometry(el.width * 0.88, 0.1, el.length * 0.88), waterMat);
      water.position.y = 0.55;
      group.add(water);
    } else if (el.type === "solar_coldroom") {
      // Chambre froide solaire avec panneaux intégrés en toiture
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xeceff1, metalness: 0.4, roughness: 0.3 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(el.width, el.height, el.length), bodyMat);
      body.position.y = el.height / 2;
      body.castShadow = true;
      group.add(body);

      const pvMat = new THREE.MeshStandardMaterial({ color: 0x0d47a1, roughness: 0.2, metalness: 0.9 });
      const pv = new THREE.Mesh(new THREE.BoxGeometry(el.width * 0.9, 0.1, el.length * 0.9), pvMat);
      pv.position.y = el.height + 0.1;
      group.add(pv);
    } else if (el.type === "windbreak") {
      // Haie brise-vent et agroforesterie (arbres 3D)
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4e342e });
      const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.7 });
      const numTrees = Math.max(3, Math.floor(el.length / 4));
      for (let i = -numTrees / 2; i <= numTrees / 2; i++) {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, el.height * 0.5), trunkMat);
        trunk.position.set(0, (el.height * 0.5) / 2, i * 4);
        trunk.castShadow = true;
        group.add(trunk);

        const crown = new THREE.Mesh(new THREE.ConeGeometry(1.6, el.height * 0.7, 8), foliageMat);
        crown.position.set(0, el.height * 0.75, i * 4);
        crown.castShadow = true;
        group.add(crown);
      }
    } else {
      // Bâtiment / Élément générique
      const boxMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.6 });
      const box = new THREE.Mesh(new THREE.BoxGeometry(el.width, el.height, el.length), boxMat);
      box.position.y = el.height / 2;
      box.castShadow = true;
      box.receiveShadow = true;
      group.add(box);
    }

    // Bordure de sélection visuelle si sélectionné
    if (selectedId === el.id) {
      const boxHelper = new THREE.BoxHelper(group, 0xf97316);
      group.add(boxHelper);
    }

    return group;
  }, [selectedId]);

  // Initialisation Three.js
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 550;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // Ciel crépusculaire / nuit par défaut, ajusté par lighting
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 4. Ground (Sol agricole sahélien avec quadrillage)
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x3d2817, // Terre arable sahélienne
      roughness: 0.95,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(160, 32, 0xf97316, 0x475569);
    grid.position.y = 0.02;
    scene.add(grid);

    // 5. Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 0.7);
    hemiLightRef.current = hemiLight;
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff8e1, 1.4);
    dirLight.position.set(60, 80, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 250;
    const d = 80;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLightRef.current = dirLight;
    scene.add(dirLight);

    // 6. Objects Group
    const objectsGroup = new THREE.Group();
    objectsGroupRef.current = objectsGroup;
    scene.add(objectsGroup);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (isRotating) {
        cameraAnglesRef.current.theta += 0.005;
        updateCameraPosition();
      }
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Mise à jour de la position de la caméra
  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraAnglesRef.current;
    cameraRef.current.position.x = radius * Math.sin(phi) * Math.sin(theta);
    cameraRef.current.position.y = radius * Math.cos(phi);
    cameraRef.current.position.z = radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.lookAt(0, 0, 0);
  }, []);

  // Synchronisation des éléments dans la scène Three.js
  useEffect(() => {
    if (!objectsGroupRef.current) return;
    const group = objectsGroupRef.current;
    // Vider les anciens meshs
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }
    // Créer les nouveaux
    elements.forEach((el) => {
      const mesh = createElementMesh(el);
      group.add(mesh);
    });
  }, [elements, selectedId, createElementMesh]);

  // Synchronisation de l'éclairage
  useEffect(() => {
    if (!sceneRef.current || !dirLightRef.current || !hemiLightRef.current) return;
    const scene = sceneRef.current;
    const dir = dirLightRef.current;
    const hemi = hemiLightRef.current;

    if (lightingMode === "day") {
      scene.background = new THREE.Color(0x0f172a);
      dir.color.setHex(0xfff8e1);
      dir.intensity = 1.4;
      hemi.intensity = 0.7;
    } else if (lightingMode === "sunset") {
      scene.background = new THREE.Color(0x311b92);
      dir.color.setHex(0xff7043);
      dir.intensity = 1.6;
      hemi.intensity = 0.5;
    } else {
      scene.background = new THREE.Color(0x020617);
      dir.color.setHex(0x90caf9);
      dir.intensity = 0.3;
      hemi.intensity = 0.2;
    }
  }, [lightingMode]);

  // Contrôles de vue prédéfinis
  const handleSetView = (preset: "iso" | "top" | "free") => {
    setViewPreset(preset);
    if (preset === "iso") {
      cameraAnglesRef.current = { theta: Math.PI / 4, phi: Math.PI / 3, radius: 130 };
    } else if (preset === "top") {
      cameraAnglesRef.current = { theta: 0, phi: 0.05, radius: 140 };
    } else {
      cameraAnglesRef.current = { theta: Math.PI / 3, phi: Math.PI / 2.5, radius: 100 };
    }
    updateCameraPosition();
  };

  // Gestion du Drag-Mouse pour orbite 3D
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - prevMouseRef.current.x;
    const dy = e.clientY - prevMouseRef.current.y;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };

    cameraAnglesRef.current.theta -= dx * 0.008;
    cameraAnglesRef.current.phi = Math.max(
      0.1,
      Math.min(Math.PI / 2 - 0.05, cameraAnglesRef.current.phi + dy * 0.008)
    );
    updateCameraPosition();
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    cameraAnglesRef.current.radius = Math.max(
      40,
      Math.min(220, cameraAnglesRef.current.radius + e.deltaY * 0.1)
    );
    updateCameraPosition();
  };

  // Ajouter un élément 3D
  const handleAddElement = (preset: typeof PRESET_ELEMENTS[0]) => {
    const newEl: FarmElement3D = {
      id: `elem-${Date.now()}`,
      name: preset.name,
      category: preset.category,
      type: preset.type,
      x: (Math.random() - 0.5) * 40,
      z: (Math.random() - 0.5) * 40,
      width: preset.width,
      length: preset.length,
      height: preset.height,
      rotation: 0,
      costFcfa: preset.costFcfa,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedId(newEl.id);
    toast.success(`"${preset.name}" ajouté à l'aménagement 3D !`);
  };

  // Supprimer un élément
  const handleDeleteSelected = () => {
    if (!selectedId) return;
    setElements((prev) => prev.filter((el) => el.id !== selectedId));
    setSelectedId(null);
    toast.info("Élément retiré du plan 3D.");
  };

  // Rotation de l'élément sélectionné
  const handleRotateSelected = () => {
    if (!selectedId) return;
    setElements((prev) =>
      prev.map((el) => (el.id === selectedId ? { ...el, rotation: (el.rotation + 45) % 360 } : el))
    );
  };

  // Export d'image HD 3D
  const handleExport3DImage = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const dataUrl = rendererRef.current.domElement.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `plan-ferme-3d-nafa-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    toast.success("Rendu 3D haute définition exporté avec succès !");
  };

  // Export du Bordereau / Devis technique en texte structuré
  const handleExportSpecs = () => {
    const lines = [
      `=== BORDEREAU D'AMÉNAGEMENT 3D — NAFA FIELD DESIGNER ===`,
      `Date: ${new Date().toLocaleDateString("fr-FR")}`,
      `Nombre d'infrastructures: ${elements.length}`,
      `Budget estimatif total: ${totalBudgetFcfa.toLocaleString()} FCFA`,
      ``,
      `DÉTAIL DES ÉLÉMENTS IMPLANTÉS:`,
      ...elements.map(
        (el, i) =>
          `${i + 1}. [${el.category.toUpperCase()}] ${el.name} — Dim: ${el.width}m × ${el.length}m (H: ${el.height}m) | Pos: (X: ${el.x}m, Z: ${el.z}m) | Coût: ${el.costFcfa.toLocaleString()} FCFA`
      ),
      ``,
      `Certifié conforme aux normes agronomiques sahéliennes.`
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    toast.success("Bordereau technique copié dans le presse-papier !");
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* ── EN-TÊTE DU STUDIO 3D ── */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white p-5 sm:p-6 rounded-[28px] border-2 border-emerald-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Studio de Modélisation 3D • NAFA Field Designer</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-black flex items-center gap-2.5">
            <Box className="h-6 w-6 text-[#F97316]" />
            <span>Modélisation 3D — Aménagement, Irrigation & Élevage</span>
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/80">
            Concevez votre exploitation en 3D photoréaliste : positionnez parcelles, motopompes solaires, châteaux d'eau et bâtiments d'élevage, et exportez vos rendus en haute résolution.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={handleExportSpecs}
            variant="outline"
            className="rounded-full bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold text-xs px-4 py-2.5 flex items-center gap-1.5"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Copier Devis</span>
          </Button>
          <Button
            onClick={handleExport3DImage}
            className="rounded-full bg-[#F97316] hover:bg-[#ea580c] text-white font-bold text-xs px-5 py-2.5 shadow-lg shadow-orange-500/30 flex items-center gap-2"
          >
            <Camera className="h-4 w-4" />
            <span>Exporter Rendu (PNG)</span>
          </Button>
        </div>
      </div>

      {/* ── INTERFACE 3D PRINCIPALE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Panneau latéral gauche : Catalogue d'éléments 3D */}
        <Card className="p-4 rounded-[24px] border-border/80 shadow-xs space-y-4 lg:col-span-1 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Ajouter un élément 3D
              </Label>
              <Badge variant="outline" className="text-[10px] font-bold">
                {elements.length} placés
              </Badge>
            </div>

            {/* Onglets Catégories */}
            <div className="grid grid-cols-3 gap-1 bg-muted p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTabCategory("crop")}
                className={`py-1.5 rounded-lg transition-colors ${
                  activeTabCategory === "crop" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                }`}
              >
                Cultures
              </button>
              <button
                type="button"
                onClick={() => setActiveTabCategory("irrigation")}
                className={`py-1.5 rounded-lg transition-colors ${
                  activeTabCategory === "irrigation" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                }`}
              >
                Irrigation
              </button>
              <button
                type="button"
                onClick={() => setActiveTabCategory("building")}
                className={`py-1.5 rounded-lg transition-colors ${
                  activeTabCategory === "building" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                }`}
              >
                Bâtiments
              </button>
            </div>

            {/* Liste des éléments du catalogue */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {PRESET_ELEMENTS.filter((el) => el.category === activeTabCategory).map((preset) => {
                const IconComponent = preset.icon;
                return (
                  <button
                    key={preset.type}
                    type="button"
                    onClick={() => handleAddElement(preset)}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl border border-border/80 bg-card hover:bg-emerald-500/10 hover:border-emerald-500/40 text-left transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-[#F97316] group-hover:text-white transition-colors">
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{preset.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {preset.width}m × {preset.length}m • {preset.costFcfa.toLocaleString()} F
                        </p>
                      </div>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Budget Chiffré Estimé */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Budget Aménagement Estimé
            </span>
            <span className="text-lg font-black text-emerald-700 dark:text-emerald-300">
              {totalBudgetFcfa.toLocaleString()} FCFA
            </span>
          </div>
        </Card>

        {/* Zone de Rendu 3D Interactive WebGL */}
        <div className="relative rounded-[24px] overflow-hidden border border-border/80 shadow-xl bg-slate-950 lg:col-span-3 min-h-[500px] flex flex-col">
          {/* Canvas Three.js */}
          <div
            ref={mountRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            className="w-full h-[520px] cursor-grab active:cursor-grabbing select-none"
          />

          {/* ── BARRE D'OUTILS FLOTTANTE SUPÉRIEURE ── */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
            {/* Presets de vue */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-white/15 backdrop-blur-md pointer-events-auto shadow-lg">
              <button
                type="button"
                onClick={() => handleSetView("iso")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  viewPreset === "iso" ? "bg-[#F97316] text-white" : "text-white/80 hover:bg-white/10"
                }`}
              >
                Vue Isométrique
              </button>
              <button
                type="button"
                onClick={() => handleSetView("top")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  viewPreset === "top" ? "bg-[#F97316] text-white" : "text-white/80 hover:bg-white/10"
                }`}
              >
                Plan 2D du dessus
              </button>
              <button
                type="button"
                onClick={() => handleSetView("free")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  viewPreset === "free" ? "bg-[#F97316] text-white" : "text-white/80 hover:bg-white/10"
                }`}
              >
                Visite 3D
              </button>
            </div>

            {/* Éclairage solaire & Rotation */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-white/15 backdrop-blur-md pointer-events-auto shadow-lg">
              <button
                type="button"
                onClick={() => setLightingMode("day")}
                title="Plein soleil"
                className={`p-1.5 rounded-xl transition-colors ${
                  lightingMode === "day" ? "bg-amber-500 text-white" : "text-white/70 hover:bg-white/10"
                }`}
              >
                <Sun className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setLightingMode("sunset")}
                title="Coucher de soleil doré"
                className={`p-1.5 rounded-xl transition-colors ${
                  lightingMode === "sunset" ? "bg-orange-500 text-white" : "text-white/70 hover:bg-white/10"
                }`}
              >
                <Sunset className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setLightingMode("night")}
                title="Vue de nuit"
                className={`p-1.5 rounded-xl transition-colors ${
                  lightingMode === "night" ? "bg-indigo-600 text-white" : "text-white/70 hover:bg-white/10"
                }`}
              >
                <Moon className="h-4 w-4" />
              </button>
              <div className="w-px h-5 bg-white/20 mx-0.5" />
              <button
                type="button"
                onClick={() => setIsRotating((r) => !r)}
                title={isRotating ? "Arrêter la rotation" : "Rotation automatique 360°"}
                className={`p-1.5 rounded-xl transition-colors ${
                  isRotating ? "bg-emerald-500 text-white animate-spin" : "text-white/70 hover:bg-white/10"
                }`}
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── BARRE D'ACTIONS INFÉRIEURE POUR L'ÉLÉMENT SÉLECTIONNÉ ── */}
          {selectedId && (
            <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-slate-900/95 border border-emerald-500/40 backdrop-blur-md text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xl z-10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold">
                  Sélectionné : {elements.find((e) => e.id === selectedId)?.name}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  ({elements.find((e) => e.id === selectedId)?.costFcfa.toLocaleString()} FCFA)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRotateSelected}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  <span>Pivoter 45°</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors border border-rose-500/40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Supprimer</span>
                </button>
              </div>
            </div>
          )}

          {/* Instructions d'aide discrètes */}
          <div className="absolute bottom-3 left-3 text-[10px] text-white/50 pointer-events-none">
            Maintenez le clic gauche et glissez pour tourner l'angle 3D • Molette pour zoomer
          </div>
        </div>
      </div>
    </div>
  );
}

export default Studio3DFarmModeler;
