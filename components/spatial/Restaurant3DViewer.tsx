"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, Html, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { TableMeshController, SpatialTableNode, TableStatus } from "./TableMeshController";
import BookingModal from "./BookingModal";
import { Sparkles, Move3d, AlertCircle, Loader2 } from "lucide-react";

interface Restaurant3DViewerProps {
  restaurantId: string;
  restaurantName: string;
  spatialModelUrl?: string;
}

const DEFAULT_REAL_MODEL_URL =
  "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/SheenChair/glTF-Binary/SheenChair.glb";

/**
 * R3F Real 3D GLB Model Container Component
 * Loads real GLB models via useGLTF, calculates BoundingBox, and traverses scene graph nodes.
 */
function RealSpatialModel({
  url,
  tableNodes,
  onTableSelect,
  onTableHover,
}: {
  url: string;
  tableNodes: SpatialTableNode[];
  onTableSelect: (node: SpatialTableNode) => void;
  onTableHover: (name: string | null) => void;
}) {
  const gltf = useGLTF(url);
  const modelRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  const [interactiveMeshes, setInteractiveMeshes] = useState<THREE.Mesh[]>([]);

  useEffect(() => {
    if (!gltf.scene) return;

    // 1. Calculate BoundingBox auto-scaling & centering
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Center the model at origin
    gltf.scene.position.x = -center.x;
    gltf.scene.position.y = -box.min.y;
    gltf.scene.position.z = -center.z;

    // Adjust camera framing based on bounding dimensions
    const maxDim = Math.max(size.x, size.y, size.z);
    const cameraDistance = maxDim * 2.2;
    camera.position.set(0, cameraDistance * 0.8, cameraDistance);
    camera.lookAt(0, size.y * 0.5, 0);

    // 2. Traversal Logic: Perform scene.traverse on the real GLB model
    const discoveredMeshes: THREE.Mesh[] = [];
    let tableCounter = 0;

    gltf.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        // Pattern filter to detect table/seating mesh nodes
        const isTable = /table|desk|booth|seat|chair|mesh|node/i.test(child.name);
        if (isTable || tableCounter < tableNodes.length) {
          child.userData.isTableNode = true;
          const assignedNode = tableNodes[tableCounter % tableNodes.length];
          child.userData.nodeData = assignedNode;

          TableMeshController.applyStatusMaterial(child, assignedNode.status);
          discoveredMeshes.push(child);
          tableCounter++;
        }
      }
    });

    setInteractiveMeshes(discoveredMeshes);
  }, [gltf.scene, camera, tableNodes]);

  return (
    <group ref={modelRef}>
      <primitive
        object={gltf.scene}
        onPointerOver={(e: any) => {
          e.stopPropagation();
          const mesh = e.object;
          if (mesh?.userData?.nodeData) {
            document.body.style.cursor = "pointer";
            onTableHover(mesh.userData.nodeData.tableName);
          }
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default";
          onTableHover(null);
        }}
        onClick={(e: any) => {
          e.stopPropagation();
          const mesh = e.object;
          if (mesh?.userData?.nodeData) {
            const node: SpatialTableNode = mesh.userData.nodeData;
            if (node.status === "available") {
              onTableSelect(node);
            }
          }
        }}
      />
    </group>
  );
}

/**
 * Fallback Loading Component rendered inside R3F Suspense
 */
function ReconstructionInProgress() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center rounded-3xl bg-[#09111e]/90 border border-orange-500/30 p-8 backdrop-blur-md text-white shadow-2xl text-center space-y-3 min-w-[280px]">
        <Loader2 className="animate-spin text-orange-500" size={36} />
        <div>
          <h4 className="text-sm font-black text-white">Spatial Reconstruction In Progress</h4>
          <p className="text-xs text-slate-400 mt-1">Downloading & rendering real GLB 3D Digital Twin...</p>
        </div>
      </div>
    </Html>
  );
}

export default function Restaurant3DViewer({
  restaurantId,
  restaurantName,
  spatialModelUrl,
}: Restaurant3DViewerProps) {
  const [selectedTable, setSelectedTable] = useState<SpatialTableNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredTableName, setHoveredTableName] = useState<string | null>(null);
  const [resolvedModelUrl, setResolvedModelUrl] = useState<string>(DEFAULT_REAL_MODEL_URL);

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
    // Resolve model URL: local blob URL > spatialModelUrl (if valid) > default real GLB
    const localBlob = typeof window !== "undefined" ? localStorage.getItem("last_uploaded_3d_glb") : null;
    if (localBlob) {
      setResolvedModelUrl(localBlob);
    } else if (spatialModelUrl && !spatialModelUrl.includes("storage.googleapis.com")) {
      setResolvedModelUrl(spatialModelUrl);
    } else {
      setResolvedModelUrl(DEFAULT_REAL_MODEL_URL);
    }
  }, [spatialModelUrl]);

  return (
    <div className="relative w-full h-[580px] rounded-[2.5rem] overflow-hidden border border-slate-800 bg-[#060c14] shadow-2xl">
      {/* R3F WebGL Canvas */}
      <Canvas
        camera={{ position: [0, 8, 14], fov: 45 }}
        dpr={[1, 2]}
        shadows
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <color attach="background" args={["#060c14"]} />
        <ambientLight intensity={0.9} />
        <directionalLight position={[10, 15, 10]} intensity={1.5} castShadow />

        {/* Real HDRI Environment mapping for PBR metallic/roughness material reflection */}
        <Environment preset="city" />

        <OrbitControls
          makeDefault
          maxPolarAngle={Math.PI / 2.15}
          minDistance={2}
          maxDistance={50}
          dampingFactor={0.05}
        />

        <Suspense fallback={<ReconstructionInProgress />}>
          <RealSpatialModel
            url={resolvedModelUrl}
            tableNodes={tableNodes}
            onTableSelect={(node) => {
              setSelectedTable(node);
              setIsModalOpen(true);
            }}
            onTableHover={(name) => setHoveredTableName(name)}
          />
        </Suspense>
      </Canvas>

      {/* Top Floating Header Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 rounded-2xl bg-[#09111e]/90 border border-slate-800 p-3.5 backdrop-blur-md pointer-events-auto shadow-xl">
          <Sparkles className="text-orange-500" size={20} />
          <div>
            <h4 className="text-xs font-black text-white">{restaurantName} 3D Spatial Digital Twin</h4>
            <p className="text-[11px] text-slate-400 font-medium">
              {hoveredTableName ? (
                <span className="text-orange-400 font-bold">Selected: {hoveredTableName}</span>
              ) : (
                "Real GLB Model • Orbit & Click table node to reserve"
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
