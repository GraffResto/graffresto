"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TableMeshController, SpatialTableNode, TableStatus } from "./TableMeshController";
import BookingModal from "./BookingModal";
import { Sparkles, Maximize2, Layers, RefreshCw, Eye } from "lucide-react";

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

  // Table Mesh Registry
  const [tableNodes, setTableNodes] = useState<SpatialTableNode[]>([
    { nodeName: "Table_01", mappedTableId: "t1", tableName: "Table 1", seats: 4, status: "available" },
    { nodeName: "Table_02", mappedTableId: "t2", tableName: "Table 2", seats: 4, status: "available" },
    { nodeName: "Table_03", mappedTableId: "t3", tableName: "Table 3", seats: 4, status: "occupied" },
    { nodeName: "Table_04", mappedTableId: "t4", tableName: "Table 4", seats: 2, status: "available" },
    { nodeName: "Table_05", mappedTableId: "t5", tableName: "Table 5 (VIP)", seats: 8, status: "pending" },
    { nodeName: "Table_06", mappedTableId: "t6", tableName: "Table 6", seats: 6, status: "available" },
    { nodeName: "Table_07", mappedTableId: "t7", tableName: "Table 7", seats: 4, status: "occupied" },
    { nodeName: "Table_08", mappedTableId: "t8", tableName: "Table 8", seats: 4, status: "available" },
  ]);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060c14);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 18, 22);

    // 2. WebGL Renderer with Performance Optimizations
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

    // 3. OrbitControls with Polar Constraints
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.1; // Limit angle to prevent underground inversion
    controls.minDistance = 8;
    controls.maxDistance = 40;
    controls.target.set(0, 0, 0);

    // 4. Lighting Engine
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffaa44, 1.2);
    dirLight.position.set(15, 25, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // 5. Floor Grid Plane
    const floorGeo = new THREE.PlaneGeometry(36, 28);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
      metalness: 0.2,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Grid lines helper
    const gridHelper = new THREE.GridHelper(36, 18, 0xf97316, 0x1e293b);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // 6. Generate 3D Table Node Meshes
    const interactiveMeshes: THREE.Mesh[] = [];

    const positions = [
      [-10, 0, -6],
      [-3, 0, -6],
      [4, 0, -6],
      [11, 0, -6],
      [-10, 0, 5],
      [-3, 0, 5],
      [4, 0, 5],
      [11, 0, 5],
    ];

    tableNodes.forEach((node, idx) => {
      const pos = positions[idx] || [0, 0, 0];
      const tableGeo = new THREE.CylinderGeometry(1.8, 1.8, 1.2, 32);
      const tableMat = new THREE.MeshStandardMaterial();
      const tableMesh = new THREE.Mesh(tableGeo, tableMat);

      tableMesh.position.set(pos[0], 0.6, pos[2]);
      tableMesh.castShadow = true;
      tableMesh.receiveShadow = true;

      // Attach metadata for raycasting
      tableMesh.userData = {
        isTableNode: true,
        nodeData: node,
      };

      TableMeshController.applyStatusMaterial(tableMesh, node.status);
      scene.add(tableMesh);
      interactiveMeshes.push(tableMesh);
    });

    // 7. Raycasting Controller Setup
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

    // 8. Animation Loop
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
      renderer.dispose();
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [tableNodes]);

  return (
    <div className="relative w-full h-[540px] rounded-3xl overflow-hidden border border-slate-800 bg-[#060c14]">
      {/* 3D WebGL Canvas */}
      {webGlSupported ? (
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      ) : (
        /* Fallback 2D layout if WebGL is disabled */
        <div className="flex h-full items-center justify-center p-8 text-center text-slate-400">
          <p>WebGL 3D preview unavailable. Switching to classic 2D floor view.</p>
        </div>
      )}

      {/* Top Floating Controls */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 rounded-2xl bg-[#09111e]/90 border border-slate-800 p-3 backdrop-blur-md pointer-events-auto">
          <Sparkles className="text-orange-500" size={18} />
          <div>
            <h4 className="text-xs font-black text-white">{restaurantName} 3D Digital Twin</h4>
            <p className="text-[10px] text-slate-400 font-medium">
              {hoveredTableName ? (
                <span className="text-orange-400 font-bold">Targeting: {hoveredTableName}</span>
              ) : (
                "Orbit & Click table mesh to reserve"
              )}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 rounded-2xl bg-[#09111e]/90 border border-slate-800 px-4 py-2 text-[11px] font-bold text-white backdrop-blur-md pointer-events-auto">
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
      <div className="absolute bottom-4 left-4 z-10 text-[10px] font-medium text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 backdrop-blur-md">
        🖱 Left click + drag to orbit • Scroll to zoom • Right click to pan
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
            // Update table node status to pending/occupied
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
