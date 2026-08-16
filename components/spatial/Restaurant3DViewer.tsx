"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { TableMeshController, SpatialTableNode, TableStatus } from "./TableMeshController";
import BookingModal from "./BookingModal";
import { Sparkles, Maximize2, Layers, RefreshCw, Eye, Move3d } from "lucide-react";

interface Restaurant3DViewerProps {
  restaurantId: string;
  restaurantName: string;
  spatialModelUrl?: string;
  initialTables?: { id: string; name: string; seats: number; status: TableStatus }[];
}

export default function Restaurant3DViewer({
  restaurantId,
  restaurantName,
  spatialModelUrl,
  initialTables,
}: Restaurant3DViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedTable, setSelectedTable] = useState<SpatialTableNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [webGlSupported, setWebGlSupported] = useState(true);
  const [hoveredTableName, setHoveredTableName] = useState<string | null>(null);
  const [isLoadingModel, setIsLoadingModel] = useState(false);

  // Table Mesh Registry
  const [tableNodes, setTableNodes] = useState<SpatialTableNode[]>([
    { nodeName: "Table_01", mappedTableId: "t1", tableName: "Table 1 (Window)", seats: 4, status: "available" },
    { nodeName: "Table_02", mappedTableId: "t2", tableName: "Table 2 (Center)", seats: 4, status: "available" },
    { nodeName: "Table_03", mappedTableId: "t3", tableName: "Table 3 (Booth)", seats: 4, status: "occupied" },
    { nodeName: "Table_04", mappedTableId: "t4", tableName: "Table 4 (Couples)", seats: 2, status: "available" },
    { nodeName: "Table_05", mappedTableId: "t5", tableName: "Table 5 (VIP)", seats: 8, status: "pending" },
    { nodeName: "Table_06", mappedTableId: "t6", tableName: "Table 6 (Terrace)", seats: 6, status: "available" },
    { nodeName: "Table_07", mappedTableId: "t7", tableName: "Table 7 (Bar Side)", seats: 4, status: "occupied" },
    { nodeName: "Table_08", mappedTableId: "t8", tableName: "Table 8 (Garden View)", seats: 4, status: "available" },
  ]);

  useEffect(() => {
    if (!mountRef.current) return;

    // Check if there is a locally uploaded GLB model in localStorage or passed props
    const localUploadedUrl = typeof window !== "undefined" ? localStorage.getItem("last_uploaded_3d_glb") : null;
    const activeModelUrl = localUploadedUrl || (spatialModelUrl && !spatialModelUrl.includes("storage.googleapis.com") ? spatialModelUrl : null);

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.018);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 16, 26);

    // 2. WebGL Renderer with Performance Optimizations & Shadows
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      mountRef.current.appendChild(renderer.domElement);
    } catch {
      setWebGlSupported(false);
      return;
    }

    // 3. OrbitControls with Polar & Distance Constraints
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.15; // Prevent camera underground inversion
    controls.minDistance = 6;
    controls.maxDistance = 45;
    controls.target.set(0, 1, 0);

    // 4. Warm Architectural Lighting Engine
    const ambientLight = new THREE.AmbientLight(0xfff5ea, 0.8);
    scene.add(ambientLight);

    // Warm ceiling spot lights
    const mainSpot = new THREE.SpotLight(0xffb77d, 2.5);
    mainSpot.position.set(0, 22, 5);
    mainSpot.angle = Math.PI / 3;
    mainSpot.penumbra = 0.8;
    mainSpot.castShadow = true;
    mainSpot.shadow.mapSize.width = 2048;
    mainSpot.shadow.mapSize.height = 2048;
    scene.add(mainSpot);

    const fillLight = new THREE.DirectionalLight(0x7dd3fc, 0.6);
    fillLight.position.set(-15, 18, -10);
    scene.add(fillLight);

    // 5. Realistic Wood Floor & Interior Walls
    const floorGeo = new THREE.PlaneGeometry(40, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b18, // Warm dark mahogany wood
      roughness: 0.35,
      metalness: 0.1,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Subtle floor border walls for interior realistic feel
    const backWallGeo = new THREE.BoxGeometry(40, 6, 0.5);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, 3, -16);
    scene.add(backWall);

    // Decorative Bar Counter at back wall
    const barGeo = new THREE.BoxGeometry(16, 2.4, 2);
    const barMat = new THREE.MeshStandardMaterial({ color: 0x331900, roughness: 0.4 });
    const barMesh = new THREE.Mesh(barGeo, barMat);
    barMesh.position.set(0, 1.2, -14);
    barMesh.castShadow = true;
    barMesh.receiveShadow = true;
    scene.add(barMesh);

    // Bar LED strip back-glow
    const barLed = new THREE.PointLight(0xf97316, 2, 12);
    barLed.position.set(0, 2.5, -14);
    scene.add(barLed);

    const interactiveMeshes: THREE.Mesh[] = [];

    // Helper: Build a Detailed Realistic 3D Dining Table with Chairs
    const createDetailedTable = (
      node: SpatialTableNode,
      x: number,
      z: number,
      isRectangular: boolean = false
    ) => {
      const tableGroup = new THREE.Group();
      tableGroup.position.set(x, 0, z);

      // Table Top Mesh (Wood or Marble)
      let topGeo: THREE.BufferGeometry;
      if (isRectangular) {
        topGeo = new THREE.BoxGeometry(3.6, 0.2, 2.4);
      } else {
        topGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.2, 32);
      }

      const tableMat = new THREE.MeshStandardMaterial();
      const topMesh = new THREE.Mesh(topGeo, tableMat);
      topMesh.position.y = 1.6;
      topMesh.castShadow = true;
      topMesh.receiveShadow = true;

      topMesh.userData = {
        isTableNode: true,
        nodeData: node,
      };

      TableMeshController.applyStatusMaterial(topMesh, node.status);
      tableGroup.add(topMesh);
      interactiveMeshes.push(topMesh);

      // Central Table Leg / Pedestal
      const legGeo = new THREE.CylinderGeometry(0.2, 0.4, 1.5, 16);
      const legMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 });
      const legMesh = new THREE.Mesh(legGeo, legMat);
      legMesh.position.y = 0.75;
      legMesh.castShadow = true;
      tableGroup.add(legMesh);

      // Table Base Plate
      const baseGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.1, 32);
      const baseMesh = new THREE.Mesh(baseGeo, legMat);
      baseMesh.position.y = 0.05;
      baseMesh.receiveShadow = true;
      tableGroup.add(baseMesh);

      // Hanging Warm Pendant Light above table
      const pendantLight = new THREE.PointLight(
        node.status === "available" ? 0x10b981 : node.status === "occupied" ? 0xef4444 : 0xf59e0b,
        1.2,
        6
      );
      pendantLight.position.y = 4.2;
      tableGroup.add(pendantLight);

      // Add 4 Chairs around table
      const chairOffsets = [
        [0, 2.2, 0],
        [0, -2.2, Math.PI],
        [2.2, 0, Math.PI / 2],
        [-2.2, 0, -Math.PI / 2],
      ];

      chairOffsets.slice(0, node.seats).forEach(([cx, cz, rot]) => {
        const chairGroup = new THREE.Group();
        chairGroup.position.set(cx, 0, cz);
        chairGroup.rotation.y = rot;

        // Chair Seat Cushion
        const seatGeo = new THREE.BoxGeometry(0.9, 0.1, 0.9);
        const seatMat = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.7 });
        const seatMesh = new THREE.Mesh(seatGeo, seatMat);
        seatMesh.position.y = 0.9;
        seatMesh.castShadow = true;
        chairGroup.add(seatMesh);

        // Chair Backrest
        const backGeo = new THREE.BoxGeometry(0.9, 0.9, 0.1);
        const backMesh = new THREE.Mesh(backGeo, seatMat);
        backMesh.position.set(0, 1.4, -0.4);
        backMesh.castShadow = true;
        chairGroup.add(backMesh);

        // Chair Legs
        const cLegGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8);
        const cLegMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        [
          [-0.35, -0.35],
          [0.35, -0.35],
          [-0.35, 0.35],
          [0.35, 0.35],
        ].forEach(([lx, lz]) => {
          const clMesh = new THREE.Mesh(cLegGeo, cLegMat);
          clMesh.position.set(lx, 0.4, lz);
          clMesh.castShadow = true;
          chairGroup.add(clMesh);
        });

        tableGroup.add(chairGroup);
      });

      scene.add(tableGroup);
    };

    // Load actual GLB file if activeModelUrl exists
    if (activeModelUrl) {
      setIsLoadingModel(true);
      const loader = new GLTFLoader();
      loader.load(
        activeModelUrl,
        (gltf) => {
          setIsLoadingModel(false);
          const loadedScene = gltf.scene;

          // Auto-calculate model bounding box & center camera
          const box = new THREE.Box3().setFromObject(loadedScene);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());

          loadedScene.position.x += loadedScene.position.x - center.x;
          loadedScene.position.y += loadedScene.position.y - center.y;
          loadedScene.position.z += loadedScene.position.z - center.z;

          controls.target.copy(center);
          camera.position.set(center.x, center.y + size.y * 1.5, center.z + size.z * 1.8);

          // Find table meshes using regex pattern matcher
          const foundMeshes = TableMeshController.traverseSceneGraphAndFindTables(loadedScene);
          foundMeshes.forEach((mesh, i) => {
            mesh.userData.isTableNode = true;
            mesh.userData.nodeData = tableNodes[i % tableNodes.length];
            TableMeshController.applyStatusMaterial(mesh, mesh.userData.nodeData.status);
            interactiveMeshes.push(mesh);
          });

          scene.add(loadedScene);
        },
        undefined,
        (err) => {
          console.warn("Could not load custom GLB model, rendering high-fidelity 3D hall scene instead.", err);
          setIsLoadingModel(false);
          buildDefaultProceduralHall();
        }
      );
    } else {
      buildDefaultProceduralHall();
    }

    function buildDefaultProceduralHall() {
      const tablePositions = [
        [-11, -7, false],
        [-3.8, -7, false],
        [3.8, -7, true],
        [11, -7, false],
        [-11, 4, false],
        [-3.8, 4, true],
        [3.8, 4, false],
        [11, 4, true],
      ];

      tableNodes.forEach((node, idx) => {
        const [x, z, isRect] = tablePositions[idx] || [0, 0, false];
        createDetailedTable(node, x as number, z as number, isRect as boolean);
      });
    }

    // 6. Raycasting Controller Setup
    const raycasterController = new TableMeshController();

    const handlePointerClick = (e: MouseEvent) => {
      if (!mountRef.current) return;
      const rect = mountRef.current.getBoundingClientRect();
      const hitMesh = raycasterController.raycastTableNodes(
        e.clientX,
        e.clientY,
        rect,
        camera,
        interactiveMeshes
      );

      if (hitMesh && hitMesh.userData?.nodeData) {
        const node: SpatialTableNode = hitMesh.userData.nodeData;
        if (node.status === "available") {
          setSelectedTable(node);
          setIsModalOpen(true);
        }
      }
    };

    const handlePointerMove = (e: MouseEvent) => {
      if (!mountRef.current) return;
      const rect = mountRef.current.getBoundingClientRect();
      const hitMesh = raycasterController.raycastTableNodes(
        e.clientX,
        e.clientY,
        rect,
        camera,
        interactiveMeshes
      );

      if (hitMesh && hitMesh.userData?.nodeData) {
        setHoveredTableName(hitMesh.userData.nodeData.tableName);
        document.body.style.cursor = "pointer";
      } else {
        setHoveredTableName(null);
        document.body.style.cursor = "default";
      }
    };

    const domElem = mountRef.current;
    domElem.addEventListener("click", handlePointerClick);
    domElem.addEventListener("mousemove", handlePointerMove);

    // 7. Animation Loop
    let animFrameId: number;
    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      controls.update();

      // Pulsing effect for pending tables
      const time = Date.now() * 0.003;
      interactiveMeshes.forEach((m) => {
        if (m.userData?.nodeData?.status === "pending" && m.material) {
          (m.material as THREE.MeshStandardMaterial).emissiveIntensity =
            0.4 + Math.sin(time) * 0.3;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      domElem.removeEventListener("click", handlePointerClick);
      domElem.removeEventListener("mousemove", handlePointerMove);
      cancelAnimationFrame(animFrameId);
      interactiveMeshes.forEach((m) => TableMeshController.disposeMesh(m));
      renderer.dispose();
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [tableNodes, spatialModelUrl]);

  return (
    <div className="relative w-full h-[580px] rounded-[2.5rem] overflow-hidden border border-slate-800 bg-[#060c14] shadow-2xl">
      {/* Loading Overlay */}
      {isLoadingModel && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#060c14]/90 backdrop-blur-md text-white space-y-3">
          <Move3d className="animate-spin text-orange-500" size={36} />
          <p className="text-sm font-bold">Loading Realistic 3D Restaurant Model...</p>
        </div>
      )}

      {/* 3D WebGL Canvas */}
      {webGlSupported ? (
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      ) : (
        /* Fallback 2D layout if WebGL is disabled */
        <div className="flex h-full items-center justify-center p-8 text-center text-slate-400">
          <p>WebGL 3D preview unavailable. Switching to classic 2D floor view.</p>
        </div>
      )}

      {/* Top Floating Header */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 rounded-2xl bg-[#09111e]/90 border border-slate-800 p-3.5 backdrop-blur-md pointer-events-auto shadow-xl">
          <Sparkles className="text-orange-500" size={20} />
          <div>
            <h4 className="text-xs font-black text-white">{restaurantName} 3D Digital Twin</h4>
            <p className="text-[11px] text-slate-400 font-medium">
              {hoveredTableName ? (
                <span className="text-orange-400 font-bold">Selected: {hoveredTableName}</span>
              ) : (
                "Orbit interior • Click table mesh to reserve"
              )}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 rounded-2xl bg-[#09111e]/90 border border-slate-800 px-4 py-2.5 text-[11px] font-bold text-white backdrop-blur-md pointer-events-auto shadow-xl">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" /> Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" /> Occupied
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B] animate-pulse" /> Pending
          </span>
        </div>
      </div>

      {/* Bottom Floating Hint */}
      <div className="absolute bottom-4 left-4 z-10 text-[10px] font-medium text-slate-400 bg-slate-900/90 px-3.5 py-2 rounded-xl border border-slate-800 backdrop-blur-md">
        🖱 Left click + drag to rotate • Scroll to zoom • Right click to pan
      </div>

      {/* Reservation Bottom Sheet Modal */}
      {selectedTable && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTable(null);
          }}
          restaurantId={restaurantId}
          tableName={selectedTable.tableName}
          seats={selectedTable.seats}
          onSuccess={(booking) => {
            setTableNodes((prev) =>
              prev.map((t) =>
                t.nodeName === selectedTable.nodeName
                  ? { ...t, status: "occupied" }
                  : t
              )
            );
            alert(`Table ${selectedTable.tableName} reserved successfully! Booking ID: ${booking.bookingId}`);
          }}
        />
      )}
    </div>
  );
}
