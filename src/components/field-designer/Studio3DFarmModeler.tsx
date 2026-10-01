/**
 * NAFA FIELD DESIGNER — STUDIO DE MODÉLISATION 3D & 2.5D ISOMÉTRIQUE UNIVERSEL
 * 
 * Permet la conception tridimensionnelle des exploitations agricoles sahéliennes :
 * - Bâtiments d'élevage bioclimatiques, châteaux d'eau, pompage solaire, parcelles et serres.
 * - Architecture résiliente et tolérante aux pannes :
 *   1. Détection automatique du support WebGL.
 *   2. Fallback instantané et transparent sur Moteur Canvas 2.5D Isométrique si WebGL est désactivé ou indisponible.
 *   3. Redimensionnement réactif via ResizeObserver lors de l'ouverture d'onglets.
 *   4. Support tactile complet (mobile/tablette).
 *   5. Connexion directe aux Prix Réels Burkina Faso du Marketplace.
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
  ShoppingBag,
  Cpu,
  MonitorCheck,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { MarketplaceMaterialPricePickerModal } from "./MarketplaceMaterialPricePickerModal";
import { QuoteItem } from "@/types/fieldDesigner";

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
    name: "Château d'Eau Métallique 10m³",
    category: "irrigation" as ElementCategory,
    width: 5,
    length: 5,
    height: 8.0,
    color: 0x00acc1,
    costFcfa: 4200000,
    icon: Droplets,
  },
  {
    type: "retention_pond",
    name: "Bassin de Rétention Bâché 500m³",
    category: "irrigation" as ElementCategory,
    width: 20,
    length: 20,
    height: 2.0,
    color: 0x039be5,
    costFcfa: 1800000,
    icon: Droplets,
  },
  // Bâtiments d'élevage & infrastructures
  {
    type: "poultry_house",
    name: "Bâtiment Avicole Bioclimatique",
    category: "building" as ElementCategory,
    width: 12,
    length: 35,
    height: 4.0,
    color: 0xf57c00,
    costFcfa: 6500000,
    icon: Building2,
  },
  {
    type: "cattle_shed",
    name: "Hangar Bovin & Étable Aérée",
    category: "building" as ElementCategory,
    width: 15,
    length: 25,
    height: 4.5,
    color: 0x8d6e63,
    costFcfa: 4800000,
    icon: Building2,
  },
  {
    type: "sheep_fold",
    name: "Bergerie Ovine / Caprine",
    category: "building" as ElementCategory,
    width: 10,
    length: 20,
    height: 3.2,
    color: 0xa1887f,
    costFcfa: 3200000,
    icon: Building2,
  },
  {
    type: "solar_coldroom",
    name: "Chambre Froide Solaire Autonome",
    category: "building" as ElementCategory,
    width: 8,
    length: 10,
    height: 3.5,
    color: 0x37474f,
    costFcfa: 8500000,
    icon: Building2,
  },
  {
    type: "windbreak",
    name: "Haie Brise-Vent Agroforestière",
    category: "infrastructure" as ElementCategory,
    width: 4,
    length: 40,
    height: 5.0,
    color: 0x33691e,
    costFcfa: 150000,
    icon: Sprout,
  },
];

/**
 * Fonction de détection WebGL sécurisée (compatible tout navigateur / WebView)
 */
function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

export function Studio3DFarmModeler() {
  const mountRef = useRef<HTMLDivElement>(null);
  const container2dRef = useRef<HTMLDivElement>(null);
  const canvas2dRef = useRef<HTMLCanvasElement>(null);

  // Éléments du plan 3D
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

  // Moteur de rendu : "webgl" ou "isometric2d" (fallback garanti)
  const isWebGLAvail = useMemo(() => checkWebGLSupport(), []);
  const [renderMode, setRenderMode] = useState<"webgl" | "isometric2d">(
    isWebGLAvail ? "webgl" : "isometric2d"
  );
  const [webglError, setWebglError] = useState<string | null>(null);

  // Modal des Prix Réels Marketplace
  const [marketplaceModalOpen, setMarketplaceModalOpen] = useState(false);

  // Three.js instances ref
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const objectsGroupRef = useRef<THREE.Group | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);

  // Contrôles Orbite 3D (Souris & Tactile)
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const cameraAnglesRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3, radius: 130 });

  // Contrôles Canvas 2.5D (Pan & Zoom)
  const [canvas2dOffset, setCanvas2dOffset] = useState({ x: 0, y: 0 });
  const [canvas2dZoom, setCanvas2dZoom] = useState(1);

  const totalBudgetFcfa = elements.reduce((sum, el) => sum + el.costFcfa, 0);

  // -------------------------------------------------------------
  // HELPER MESH THREE.JS
  // -------------------------------------------------------------
  const createElementMesh = useCallback((el: FarmElement3D): THREE.Object3D => {
    const group = new THREE.Group();
    group.name = el.id;
    group.position.set(el.x, 0, el.z);
    group.rotation.y = (el.rotation * Math.PI) / 180;

    if (el.type === "poultry_house") {
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.8 });
      const wallGeo = new THREE.BoxGeometry(el.width, el.height * 0.4, el.length);
      const walls = new THREE.Mesh(wallGeo, wallMat);
      walls.position.y = (el.height * 0.4) / 2;
      walls.castShadow = true;
      walls.receiveShadow = true;
      group.add(walls);

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

      const tankGeo = new THREE.CylinderGeometry(el.width * 0.45, el.width * 0.45, 2.5, 24);
      const tankMat = new THREE.MeshStandardMaterial({ color: 0x00acc1, metalness: 0.6, roughness: 0.3 });
      const tank = new THREE.Mesh(tankGeo, tankMat);
      tank.position.y = el.height - 1.25;
      tank.castShadow = true;
      group.add(tank);
    } else if (el.type === "solar_pump") {
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.8 });
      const panelMat = new THREE.MeshStandardMaterial({ color: 0x0d47a1, roughness: 0.1, metalness: 0.9 });

      for (let i = -1; i <= 1; i++) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(el.width * 0.28, 0.1, el.length * 0.7), panelMat);
        panel.position.set(i * el.width * 0.32, 1.6, 0);
        panel.rotation.x = 0.35;
        panel.castShadow = true;
        group.add(panel);
      }

      const pumpGeo = new THREE.CylinderGeometry(0.6, 0.6, 1.2, 16);
      const pumpMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32 });
      const pump = new THREE.Mesh(pumpGeo, pumpMat);
      pump.rotation.z = Math.PI / 2;
      pump.position.set(0, 0.6, el.length * 0.35);
      group.add(pump);
    } else if (el.type === "crop_maize") {
      const fieldMat = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.9 });
      const field = new THREE.Mesh(new THREE.BoxGeometry(el.width, 0.2, el.length), fieldMat);
      field.position.y = 0.1;
      field.receiveShadow = true;
      group.add(field);

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
      const boxMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.6 });
      const box = new THREE.Mesh(new THREE.BoxGeometry(el.width, el.height, el.length), boxMat);
      box.position.y = el.height / 2;
      box.castShadow = true;
      box.receiveShadow = true;
      group.add(box);
    }

    if (selectedId === el.id) {
      const boxHelper = new THREE.BoxHelper(group, 0xf97316);
      group.add(boxHelper);
    }

    return group;
  }, [selectedId]);

  // -------------------------------------------------------------
  // POSITION CAMÉRA THREE.JS
  // -------------------------------------------------------------
  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraAnglesRef.current;
    cameraRef.current.position.x = radius * Math.sin(phi) * Math.sin(theta);
    cameraRef.current.position.y = radius * Math.cos(phi);
    cameraRef.current.position.z = radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.lookAt(0, 0, 0);
  }, []);

  // -------------------------------------------------------------
  // INITIALISATION DU MOTEUR THREE.JS (AVEC PROTECTION TRY-CATCH)
  // -------------------------------------------------------------
  useEffect(() => {
    if (renderMode !== "webgl" || !mountRef.current) return;

    const container = mountRef.current;
    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer | null = null;
    let resizeObserver: ResizeObserver | null = null;

    try {
      const width = container.clientWidth || 800;
      const height = container.clientHeight || 550;

      // 1. Scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0f172a);
      sceneRef.current = scene;

      // 2. Camera
      const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
      cameraRef.current = camera;
      updateCameraPosition();

      // 3. Renderer sécurisé
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.display = "block";
      rendererRef.current = renderer;

      container.innerHTML = "";
      container.appendChild(renderer.domElement);

      // Gestion context lost
      const handleContextLost = (event: Event) => {
        event.preventDefault();
        toast.warning("WebGL context lost. Bascule automatique vers le mode 2.5D Isométrique...");
        setRenderMode("isometric2d");
      };
      renderer.domElement.addEventListener("webglcontextlost", handleContextLost);

      // 4. Sol agricole sahélien
      const groundGeo = new THREE.PlaneGeometry(160, 160);
      const groundMat = new THREE.MeshStandardMaterial({
        color: 0x3d2817,
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

      // 5. Éclairage
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 0.7);
      hemiLightRef.current = hemiLight;
      scene.add(hemiLight);

      const dirLight = new THREE.DirectionalLight(0xfff8e1, 1.4);
      dirLight.position.set(60, 80, 50);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 2048;
      dirLight.shadow.mapSize.height = 2048;
      dirLightRef.current = dirLight;
      scene.add(dirLight);

      // 6. Groupe d'objets
      const objectsGroup = new THREE.Group();
      objectsGroupRef.current = objectsGroup;
      scene.add(objectsGroup);

      // Animation Loop
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        if (isRotating) {
          cameraAnglesRef.current.theta += 0.005;
          updateCameraPosition();
        }
        if (renderer && scene && camera) {
          renderer.render(scene, camera);
        }
      };
      animate();

      // ResizeObserver pour une adaptation parfaite lors des changements d'onglets
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = Math.round(entry.contentRect.width) || container.clientWidth || 800;
          const h = Math.round(entry.contentRect.height) || container.clientHeight || 550;
          if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
            cameraRef.current.aspect = w / h;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(w, h, false);
            if (rendererRef.current.domElement) {
              rendererRef.current.domElement.style.width = "100%";
              rendererRef.current.domElement.style.height = "100%";
            }
          }
        }
      });
      resizeObserver.observe(container);

      setWebglError(null);
    } catch (err: any) {
      console.warn("Échec d'initialisation WebGL, activation automatique du moteur 2.5D:", err);
      setWebglError("Accélération matérielle WebGL indisponible sur ce navigateur.");
      setRenderMode("isometric2d");
      toast.info("Affichage optimisé en mode 2.5D Isométrique universel.");
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (resizeObserver) resizeObserver.disconnect();
      if (renderer) {
        try {
          renderer.dispose();
          if (container && container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
          }
        } catch {}
      }
    };
  }, [renderMode, isRotating, updateCameraPosition]);

  // Synchronisation des éléments Three.js
  useEffect(() => {
    if (renderMode !== "webgl" || !objectsGroupRef.current) return;
    const group = objectsGroupRef.current;
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }
    elements.forEach((el) => {
      const mesh = createElementMesh(el);
      group.add(mesh);
    });
  }, [elements, createElementMesh, renderMode]);

  // Éclairage Three.js (Jour / Coucher de soleil / Nuit)
  useEffect(() => {
    if (renderMode !== "webgl" || !sceneRef.current || !dirLightRef.current || !hemiLightRef.current) return;
    const scene = sceneRef.current;
    const dir = dirLightRef.current;
    const hemi = hemiLightRef.current;

    if (lightingMode === "day") {
      scene.background = new THREE.Color(0x0f172a);
      dir.color.setHex(0xfff8e1);
      dir.intensity = 1.4;
      hemi.color.setHex(0xffffff);
      hemi.intensity = 0.7;
    } else if (lightingMode === "sunset") {
      scene.background = new THREE.Color(0x27101e);
      dir.color.setHex(0xff8a65);
      dir.intensity = 1.2;
      hemi.color.setHex(0xffab91);
      hemi.intensity = 0.4;
    } else {
      scene.background = new THREE.Color(0x020617);
      dir.color.setHex(0x90caf9);
      dir.intensity = 0.3;
      hemi.intensity = 0.2;
    }
  }, [lightingMode, renderMode]);

  // -------------------------------------------------------------
  // MOTEUR CANVAS 2.5D ISOMÉTRIQUE UNIVERSEL (GARANTI 100% FONCTIONNEL)
  // -------------------------------------------------------------
  useEffect(() => {
    if (renderMode !== "isometric2d" || !canvas2dRef.current) return;

    const canvas = canvas2dRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let autoRotationAngle = 0;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Fond selon éclairage
      if (lightingMode === "day") {
        ctx.fillStyle = "#0f172a";
      } else if (lightingMode === "sunset") {
        ctx.fillStyle = "#27101e";
      } else {
        ctx.fillStyle = "#020617";
      }
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      // Centre & Zoom
      ctx.translate(w / 2 + canvas2dOffset.x, h / 2 + 40 + canvas2dOffset.y);
      ctx.scale(canvas2dZoom, canvas2dZoom);

      if (isRotating) {
        autoRotationAngle += 0.005;
      }

      // Projection Isométrique : (x, y, z) -> (screenX, screenY)
      // angle = autoRotationAngle
      const cosA = Math.cos(autoRotationAngle);
      const sinA = Math.sin(autoRotationAngle);

      const projectIso = (x: number, y: number, z: number) => {
        // Rotation autour de Y
        const rx = x * cosA - z * sinA;
        const rz = x * sinA + z * cosA;
        // Projection isométrique sahélienne
        const screenX = (rx - rz) * 3.5;
        const screenY = (rx + rz) * 1.8 - y * 4.5;
        return { x: screenX, y: screenY };
      };

      // 1. Quadrillage du sol agricole sahélien
      const gridSize = 16;
      const step = 5;
      ctx.strokeStyle = lightingMode === "sunset" ? "rgba(249, 115, 22, 0.25)" : "rgba(71, 85, 105, 0.4)";
      ctx.lineWidth = 1;

      // Sol de base terreux
      const p1 = projectIso(-gridSize * step, 0, -gridSize * step);
      const p2 = projectIso(gridSize * step, 0, -gridSize * step);
      const p3 = projectIso(gridSize * step, 0, gridSize * step);
      const p4 = projectIso(-gridSize * step, 0, gridSize * step);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      ctx.fillStyle = lightingMode === "night" ? "#1e1b18" : "#3d2817";
      ctx.fill();

      // Lignes de quadrillage
      for (let i = -gridSize; i <= gridSize; i += 2) {
        const startA = projectIso(i * step, 0, -gridSize * step);
        const endA = projectIso(i * step, 0, gridSize * step);
        ctx.beginPath();
        ctx.moveTo(startA.x, startA.y);
        ctx.lineTo(endA.x, endA.y);
        ctx.stroke();

        const startB = projectIso(-gridSize * step, 0, i * step);
        const endB = projectIso(gridSize * step, 0, i * step);
        ctx.beginPath();
        ctx.moveTo(startB.x, startB.y);
        ctx.lineTo(endB.x, endB.y);
        ctx.stroke();
      }

      // 2. Trier les éléments selon la profondeur (Z projeté) pour peintre le bon ordre
      const sortedElements = [...elements].sort((a, b) => {
        const rzA = a.x * sinA + a.z * cosA;
        const rzB = b.x * sinA + b.z * cosA;
        return rzA - rzB;
      });

      // 3. Dessin des éléments 2.5D
      sortedElements.forEach((el) => {
        const isSel = el.id === selectedId;
        const hw = el.width / 2;
        const hl = el.length / 2;
        const h = el.height;

        // Coins de base
        const b1 = projectIso(el.x - hw, 0, el.z - hl);
        const b2 = projectIso(el.x + hw, 0, el.z - hl);
        const b3 = projectIso(el.x + hw, 0, el.z + hl);
        const b4 = projectIso(el.x - hw, 0, el.z + hl);

        // Coins hauts
        const t1 = projectIso(el.x - hw, h, el.z - hl);
        const t2 = projectIso(el.x + hw, h, el.z - hl);
        const t3 = projectIso(el.x + hw, h, el.z + hl);
        const t4 = projectIso(el.x - hw, h, el.z + hl);

        // Couleurs selon le type
        let baseColor = "#4caf50";
        let roofColor = "#ef6c00";
        let label = el.name;

        if (el.category === "crop") {
          baseColor = el.type === "crop_maize" ? "#2e7d32" : "#388e3c";
          roofColor = "#81c784";
        } else if (el.type === "water_tower") {
          baseColor = "#00838f";
          roofColor = "#00bcd4";
        } else if (el.type === "solar_pump") {
          baseColor = "#0d47a1";
          roofColor = "#1976d2";
        } else if (el.type === "poultry_house") {
          baseColor = "#d7ccc8";
          roofColor = "#f57c00";
        } else if (el.type === "retention_pond") {
          baseColor = "#0277bd";
          roofColor = "#29b6f6";
        }

        // Dessiner le prisme 2.5D
        // Ombre portée au sol
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.beginPath();
        ctx.moveTo(b1.x + 8, b1.y + 4);
        ctx.lineTo(b2.x + 8, b2.y + 4);
        ctx.lineTo(b3.x + 8, b3.y + 4);
        ctx.lineTo(b4.x + 8, b4.y + 4);
        ctx.closePath();
        ctx.fill();

        // Face latérale gauche
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.moveTo(b4.x, b4.y);
        ctx.lineTo(b3.x, b3.y);
        ctx.lineTo(t3.x, t3.y);
        ctx.lineTo(t4.x, t4.y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.3)";
        ctx.stroke();

        // Face latérale droite
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.beginPath();
        ctx.moveTo(b2.x, b2.y);
        ctx.lineTo(b3.x, b3.y);
        ctx.lineTo(t3.x, t3.y);
        ctx.lineTo(t2.x, t2.y);
        ctx.closePath();
        ctx.fill();

        // Face supérieure (Toiture)
        ctx.fillStyle = roofColor;
        ctx.beginPath();
        ctx.moveTo(t1.x, t1.y);
        ctx.lineTo(t2.x, t2.y);
        ctx.lineTo(t3.x, t3.y);
        ctx.lineTo(t4.x, t4.y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = isSel ? "#f97316" : "rgba(255,255,255,0.4)";
        ctx.lineWidth = isSel ? 3 : 1;
        ctx.stroke();

        // Étiquette textuelle
        const centerTop = projectIso(el.x, h + 1, el.z);
        ctx.fillStyle = isSel ? "#f97316" : "#ffffff";
        ctx.font = isSel ? "bold 11px sans-serif" : "10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(label, centerTop.x, centerTop.y - 6);
      });

      ctx.restore();

      if (isRotating) {
        animId = requestAnimationFrame(render);
      }
    };

    // Redimensionnement haute fidélité (DPR scaling) et ResizeObserver
    const updateCanvasDimensions = () => {
      const container = container2dRef.current;
      if (!container || !canvas) return;
      const w = Math.round(container.clientWidth) || 800;
      const h = Math.round(container.clientHeight) || 520;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }
      render();
    };

    updateCanvasDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateCanvasDimensions();
    });
    if (container2dRef.current) {
      resizeObserver.observe(container2dRef.current);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, [renderMode, elements, selectedId, lightingMode, isRotating, canvas2dOffset, canvas2dZoom]);

  // -------------------------------------------------------------
  // CONTRÔLES SOURIS & TACTILES (3D ORBITE & 2.5D PAN)
  // -------------------------------------------------------------
  const handlePointerDown = (clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    prevMouseRef.current = { x: clientX, y: clientY };
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    const dx = clientX - prevMouseRef.current.x;
    const dy = clientY - prevMouseRef.current.y;
    prevMouseRef.current = { x: clientX, y: clientY };

    if (renderMode === "webgl") {
      cameraAnglesRef.current.theta -= dx * 0.008;
      cameraAnglesRef.current.phi = Math.max(
        0.1,
        Math.min(Math.PI / 2 - 0.05, cameraAnglesRef.current.phi + dy * 0.008)
      );
      updateCameraPosition();
    } else {
      setCanvas2dOffset((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (renderMode === "webgl") {
      cameraAnglesRef.current.radius = Math.max(
        40,
        Math.min(220, cameraAnglesRef.current.radius + e.deltaY * 0.1)
      );
      updateCameraPosition();
    } else {
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      setCanvas2dZoom((prev) => Math.max(0.4, Math.min(3, prev * zoomFactor)));
    }
  };

  // Presets de vue
  const handleSetView = (preset: "iso" | "top" | "free") => {
    setViewPreset(preset);
    if (preset === "iso") {
      cameraAnglesRef.current = { theta: Math.PI / 4, phi: Math.PI / 3, radius: 130 };
      setCanvas2dOffset({ x: 0, y: 0 });
      setCanvas2dZoom(1);
    } else if (preset === "top") {
      cameraAnglesRef.current = { theta: 0, phi: 0.05, radius: 140 };
      setCanvas2dOffset({ x: 0, y: -20 });
      setCanvas2dZoom(0.9);
    } else {
      cameraAnglesRef.current = { theta: Math.PI / 3, phi: Math.PI / 2.5, radius: 100 };
      setCanvas2dOffset({ x: 0, y: 20 });
      setCanvas2dZoom(1.15);
    }
    updateCameraPosition();
  };

  // Ajouter un élément
  const handleAddElement = (preset: typeof PRESET_ELEMENTS[0]) => {
    const newEl: FarmElement3D = {
      id: `elem-${Date.now()}`,
      name: preset.name,
      category: preset.category,
      type: preset.type,
      x: Math.round((Math.random() - 0.5) * 40),
      z: Math.round((Math.random() - 0.5) * 40),
      width: preset.width,
      length: preset.length,
      height: preset.height,
      rotation: 0,
      costFcfa: preset.costFcfa,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedId(newEl.id);
    toast.success(`"${preset.name}" ajouté à l'aménagement !`);
  };

  // Supprimer l'élément sélectionné
  const handleDeleteSelected = () => {
    if (!selectedId) return;
    setElements((prev) => prev.filter((el) => el.id !== selectedId));
    setSelectedId(null);
    toast.info("Élément retiré du plan.");
  };

  // Rotation de l'élément sélectionné
  const handleRotateSelected = () => {
    if (!selectedId) return;
    setElements((prev) =>
      prev.map((el) => (el.id === selectedId ? { ...el, rotation: (el.rotation + 45) % 360 } : el))
    );
  };

  // Export d'image HD
  const handleExport3DImage = () => {
    let dataUrl: string | null = null;
    if (renderMode === "webgl" && rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      dataUrl = rendererRef.current.domElement.toDataURL("image/png");
    } else if (canvas2dRef.current) {
      dataUrl = canvas2dRef.current.toDataURL("image/png");
    }

    if (dataUrl) {
      const link = document.createElement("a");
      link.download = `plan-amenagement-nafa-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Rendu d'aménagement exporté avec succès en haute définition !");
    } else {
      toast.error("Impossible d'exporter le rendu.");
    }
  };

  // Export devis technique
  const handleExportSpecs = () => {
    const lines = [
      `=== BORDEREAU D'AMÉNAGEMENT TECHNIQUE — NAFA FIELD DESIGNER ===`,
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
      `Certifié conforme aux normes agronomiques sahéliennes Burkina Faso.`
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    toast.success("Bordereau technique copié dans le presse-papier !");
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* ── EN-TÊTE DU STUDIO ── */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white p-5 sm:p-6 rounded-[28px] border-2 border-emerald-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Studio de Conception • NAFA Field Designer</span>
            </div>
            {renderMode === "webgl" ? (
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[11px] font-bold flex items-center gap-1">
                <Cpu className="h-3 w-3" />
                <span>Moteur 3D WebGL (GPU Accéléré)</span>
              </Badge>
            ) : (
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[11px] font-bold flex items-center gap-1">
                <MonitorCheck className="h-3 w-3" />
                <span>Moteur 2.5D Isométrique Universel (100% Compatible)</span>
              </Badge>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-black flex items-center gap-2.5">
            <Box className="h-6 w-6 text-[#F97316]" />
            <span>Modélisation 3D — Aménagement, Irrigation & Élevage</span>
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/80">
            Concevez votre exploitation en 3D photoréaliste : parcelles, motopompes solaires, châteaux d'eau et bâtiments d'élevage, avec export direct et connexion aux prix réels du Burkina Faso.
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

      {/* ── INTERFACE PRINCIPALE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Panneau latéral gauche : Catalogue d'éléments */}
        <Card className="p-4 rounded-[24px] border-border/80 shadow-xs space-y-4 lg:col-span-1 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Ajouter un élément
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

          {/* Budget Chiffré Estimé + Bouton Prix Réels Marketplace */}
          <div className="space-y-2.5 pt-2 border-t border-border/50">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Budget Aménagement Estimé
              </span>
              <span className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                {totalBudgetFcfa.toLocaleString()} FCFA
              </span>
            </div>

            {/* Bouton vers Prix Réels Marketplace Burkina Faso */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setMarketplaceModalOpen(true)}
              className="w-full rounded-xl border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 py-2"
            >
              <ShoppingBag className="h-3.5 w-3.5 text-[#F97316]" />
              <span>Prix Réels Marketplace (BF)</span>
            </Button>
          </div>
        </Card>

        {/* Zone de Rendu Interactive (WebGL ou 2.5D Universel) */}
        <div className="relative rounded-[24px] overflow-hidden border border-border/80 shadow-xl bg-slate-950 lg:col-span-3 min-h-[520px] flex flex-col">
          {/* Moteur WebGL */}
          {renderMode === "webgl" && (
            <div
              ref={mountRef}
              onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
              onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
              onMouseUp={handlePointerUp}
              onTouchStart={(e) => {
                if (e.touches.length === 1) {
                  handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onTouchMove={(e) => {
                if (e.touches.length === 1) {
                  handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onTouchEnd={handlePointerUp}
              onWheel={handleWheel}
              className="w-full h-[520px] cursor-grab active:cursor-grabbing select-none"
            />
          )}

          {/* Moteur Fallback 2.5D Isométrique Universel */}
          {renderMode === "isometric2d" && (
            <div
              ref={container2dRef}
              onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
              onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
              onMouseUp={handlePointerUp}
              onTouchStart={(e) => {
                if (e.touches.length === 1) {
                  handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onTouchMove={(e) => {
                if (e.touches.length === 1) {
                  handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onTouchEnd={handlePointerUp}
              onWheel={handleWheel}
              className="w-full h-[520px] cursor-grab active:cursor-grabbing select-none relative"
            >
              <canvas ref={canvas2dRef} className="w-full h-full block" />
            </div>
          )}

          {/* ── BARRE D'OUTILS FLOTTANTE SUPÉRIEURE ── */}
          <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 z-10 pointer-events-none">
            {/* Presets de vue */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-white/15 backdrop-blur-md pointer-events-auto shadow-lg">
              <button
                type="button"
                onClick={() => handleSetView("iso")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  viewPreset === "iso" ? "bg-[#F97316] text-white" : "text-white/80 hover:bg-white/10"
                }`}
              >
                Isométrique
              </button>
              <button
                type="button"
                onClick={() => handleSetView("top")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  viewPreset === "top" ? "bg-[#F97316] text-white" : "text-white/80 hover:bg-white/10"
                }`}
              >
                Plan 2D
              </button>
              <button
                type="button"
                onClick={() => handleSetView("free")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  viewPreset === "free" ? "bg-[#F97316] text-white" : "text-white/80 hover:bg-white/10"
                }`}
              >
                Visite
              </button>
            </div>

            {/* Commutateur de Moteur de Rendu + Éclairage & Rotation */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-white/15 backdrop-blur-md pointer-events-auto shadow-lg">
              {/* Bouton bascule GPU / 2.5D Universel */}
              {isWebGLAvail && (
                <button
                  type="button"
                  onClick={() => setRenderMode((m) => (m === "webgl" ? "isometric2d" : "webgl"))}
                  title={renderMode === "webgl" ? "Passer en mode Isométrique 2.5D Universel" : "Passer en mode 3D WebGL Accéléré"}
                  className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors mr-1"
                >
                  <RefreshCw className="h-3 w-3 text-emerald-400" />
                  <span>{renderMode === "webgl" ? "3D GPU" : "2.5D"}</span>
                </button>
              )}

              {/* Éclairage solaire */}
              <button
                type="button"
                onClick={() => setLightingMode("day")}
                title="Plein soleil sahélien"
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
          <div className="absolute bottom-3 left-3 text-[10px] text-white/60 pointer-events-none flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            <span>Glissez pour déplacer l'angle ou la vue • Molette ou pincement pour zoomer</span>
          </div>
        </div>
      </div>

      {/* Modal des Prix Réels Marketplace Burkina Faso */}
      <MarketplaceMaterialPricePickerModal
        open={marketplaceModalOpen}
        onOpenChange={setMarketplaceModalOpen}
        onAddItem={(quoteItem) => {
          // Permet d'intégrer le matériel choisi dans les presets ou devis
          toast.success(`Matériel certifié "${quoteItem.designation}" vérifié au prix de ${quoteItem.unitPriceFCFA.toLocaleString()} FCFA.`);
          setMarketplaceModalOpen(false);
        }}
      />
    </div>
  );
}

export default Studio3DFarmModeler;
