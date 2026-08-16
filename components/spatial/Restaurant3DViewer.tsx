"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { TableStatus } from "./TableMeshController";
import BookingModal from "./BookingModal";
import { Sparkles, Move3d, Loader2, CheckCircle2, ShieldAlert } from "lucide-react";

export interface PanoramicTableHotspot {
  id: string;
  tableName: string;
  seats: number;
  status: TableStatus;
  position: [number, number, number]; // Cartesian coordinates on 360 sphere
}

interface Restaurant3DViewerProps {
  restaurantId: string;
  restaurantName: string;
  spatialModelUrl?: string;
  mediaUrl?: string;
}

// Fallback high-resolution 360° equirectangular restaurant panorama asset
const DEFAULT_360_PANORAMA =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2048&auto=format&fit=crop";

/**
 * Inside-Out 360° Panoramic Sphere Component
 * Supports real HTML5 Video Textures (.mp4, .mov, .webm) and Static Equirectangular Images (.jpg, .png).
 */
function PanoramicSphere({
  url,
  onLoaded,
}: {
  url: string;
  onLoaded: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let isMounted = true;
    let videoElem: HTMLVideoElement | null = null;
    let createdTexture: THREE.Texture | null = null;

    const isVideo = /\.(mp4|mov|webm)(\?.*)?$/i.test(url);

    if (isVideo) {
      videoElem = document.createElement("video");
      videoElem.src = url;
      videoElem.muted = true;
      videoElem.loop = true;
      videoElem.playsInline = true;
      videoElem.crossOrigin = "anonymous";
      videoElem.autoplay = true;

      const videoTex = new THREE.VideoTexture(videoElem);
      videoTex.minFilter = THREE.LinearFilter;
      videoTex.magFilter = THREE.LinearFilter;
      videoTex.generateMipmaps = false;
      videoTex.colorSpace = THREE.SRGBColorSpace;

      createdTexture = videoTex;

      videoElem.play().then(() => {
        if (isMounted) {
          setTexture(videoTex);
          onLoaded();
        }
      }).catch(() => {
        if (isMounted) {
          setTexture(videoTex);
          onLoaded();
        }
      });
    } else {
      const loader = new THREE.TextureLoader();
      loader.load(
        url,
        (loadedTex) => {
          if (!isMounted) return;
          loadedTex.colorSpace = THREE.SRGBColorSpace;
          loadedTex.minFilter = THREE.LinearFilter;
          loadedTex.magFilter = THREE.LinearFilter;
          createdTexture = loadedTex;
          setTexture(loadedTex);
          onLoaded();
        },
        undefined,
        (err) => {
          console.warn("Error loading 360 texture, using fallback panorama:", err);
          loader.load(DEFAULT_360_PANORAMA, (fbTex) => {
            if (!isMounted) return;
            fbTex.colorSpace = THREE.SRGBColorSpace;
            setTexture(fbTex);
            onLoaded();
          });
        }
      );
    }

    return () => {
      isMounted = false;
      if (videoElem) {
        videoElem.pause();
        videoElem.removeAttribute("src");
        videoElem.load();
      }
      if (createdTexture) {
        createdTexture.dispose();
      }
    };
  }, [url, onLoaded]);

  if (!texture) return null;

  return (
    <mesh ref={meshRef} scale={[-1, 1, 1]}>
      {/* High-density tessellation sphere for inside-out 360 projection */}
      <sphereGeometry args={[50, 64, 64]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

/**
 * 3D Floating HTML Hotspot Component
 * Positioned in 3D Cartesian coordinates inside the 360° panorama scene.
 */
function FloatingHotspot({
  hotspot,
  onSelect,
}: {
  hotspot: PanoramicTableHotspot;
  onSelect: (h: PanoramicTableHotspot) => void;
}) {
  const isAvailable = hotspot.status === "available";
  const isOccupied = hotspot.status === "occupied";
  const isPending = hotspot.status === "pending";

  return (
    <Html position={hotspot.position} center distanceFactor={15}>
      <div className="group relative flex flex-col items-center">
        {/* Pulsing Radar Ring for Available Tables */}
        {isAvailable && (
          <span className="absolute -inset-2 rounded-full bg-emerald-500/40 animate-ping" />
        )}

        {/* Hotspot Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isAvailable) onSelect(hotspot);
          }}
          disabled={!isAvailable}
          className={`relative flex h-11 w-11 items-center justify-center rounded-full border-2 text-white shadow-xl transition-all duration-300 transform group-hover:scale-125 ${
            isAvailable
              ? "border-emerald-400 bg-emerald-600/90 shadow-emerald-500/50 cursor-pointer"
              : isOccupied
              ? "border-rose-400 bg-rose-600/60 opacity-60 cursor-not-allowed"
              : "border-amber-400 bg-amber-600/80 animate-pulse cursor-wait"
          }`}
        >
          <Move3d size={18} />
        </button>

        {/* Hover Information Tooltip */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none absolute bottom-14 flex flex-col items-center min-w-[130px]">
          <div className="rounded-xl bg-[#09111e]/95 border border-slate-700 px-3 py-2 text-center text-xs shadow-2xl backdrop-blur-md">
            <p className="font-black text-white">{hotspot.tableName}</p>
            <p className="text-[10px] text-slate-300">
              {hotspot.seats} Seats •{" "}
              <span
                className={
                  isAvailable
                    ? "text-emerald-400 font-bold"
                    : isOccupied
                    ? "text-rose-400 font-bold"
                    : "text-amber-400 font-bold"
                }
              >
                {hotspot.status.toUpperCase()}
              </span>
            </p>
          </div>
          <div className="h-2 w-2 rotate-45 bg-[#09111e] border-r border-b border-slate-700 -mt-1" />
        </div>
      </div>
    </Html>
  );
}

export default function Restaurant3DViewer({
  restaurantId,
  restaurantName,
  spatialModelUrl,
  mediaUrl,
}: Restaurant3DViewerProps) {
  const [selectedHotspot, setSelectedHotspot] = useState<PanoramicTableHotspot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Active Media Source: mediaUrl > spatialModelUrl > local blob > default 360 panorama
  const [activeMediaUrl, setActiveMediaUrl] = useState<string>(DEFAULT_360_PANORAMA);

  // Dynamic 360° Table Hotspots Array mapped to 3D spherical positions
  const [hotspots, setHotspots] = useState<PanoramicTableHotspot[]>([
    { id: "h1", tableName: "Table 1 (Window View)", seats: 4, status: "available", position: [-12, 1, -16] },
    { id: "h2", tableName: "Table 2 (Main Hall)", seats: 4, status: "available", position: [-4, 0, -18] },
    { id: "h3", tableName: "Table 3 (Booth)", seats: 4, status: "occupied", position: [6, 1, -17] },
    { id: "h4", tableName: "Table 4 (Couples Corner)", seats: 2, status: "available", position: [14, 0, -12] },
    { id: "h5", tableName: "Table 5 (VIP Lounge)", seats: 8, status: "pending", position: [-16, 2, 8] },
    { id: "h6", tableName: "Table 6 (Garden View)", seats: 6, status: "available", position: [16, 1, 6] },
    { id: "h7", tableName: "Table 7 (Bar Counter)", seats: 2, status: "occupied", position: [0, -2, -19] },
    { id: "h8", tableName: "Table 8 (Terrace)", seats: 4, status: "available", position: [-8, 2, 15] },
  ]);

  useEffect(() => {
    const localBlob = typeof window !== "undefined" ? localStorage.getItem("last_uploaded_3d_glb") : null;
    const targetUrl = mediaUrl || spatialModelUrl || localBlob || DEFAULT_360_PANORAMA;

    if (targetUrl && !targetUrl.includes("storage.googleapis.com")) {
      setActiveMediaUrl(targetUrl);
    } else {
      setActiveMediaUrl(DEFAULT_360_PANORAMA);
    }
  }, [mediaUrl, spatialModelUrl]);

  return (
    <div className="relative w-full h-[580px] rounded-[2.5rem] overflow-hidden border border-slate-800 bg-[#060c14] shadow-2xl">
      {/* Glassmorphism Loading State Overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#060c14]/90 backdrop-blur-md text-white space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-xl">
            <Loader2 className="animate-spin" size={32} />
          </div>
          <div className="text-center space-y-1">
            <h4 className="text-base font-black text-white">Rendering 360° Spatial Panorama...</h4>
            <p className="text-xs text-slate-400">Loading inside-out spherical digital twin projection</p>
          </div>
        </div>
      )}

      {/* R3F 360° Panoramic Canvas */}
      <Canvas
        camera={{ position: [0, 0, 0.1], fov: 65 }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        {/* Precision Inverted OrbitControls mimicking natural head rotation */}
        <OrbitControls
          makeDefault
          enableZoom={true}
          minDistance={0.05}
          maxDistance={0.5}
          enablePan={false}
          enableDamping={true}
          dampingFactor={0.05}
          rotateSpeed={-0.4}
        />

        <Suspense fallback={null}>
          <PanoramicSphere url={activeMediaUrl} onLoaded={() => setIsLoaded(true)} />

          {/* Render Floating 3D HTML Hotspots */}
          {hotspots.map((h) => (
            <FloatingHotspot
              key={h.id}
              hotspot={h}
              onSelect={(selected) => {
                setSelectedHotspot(selected);
                setIsModalOpen(true);
              }}
            />
          ))}
        </Suspense>
      </Canvas>

      {/* Top Floating Controls Header */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 rounded-2xl bg-[#09111e]/90 border border-slate-800 p-3.5 backdrop-blur-md pointer-events-auto shadow-2xl">
          <Sparkles className="text-orange-500" size={20} />
          <div>
            <h4 className="text-xs font-black text-white">{restaurantName} 360° Digital Twin</h4>
            <p className="text-[11px] text-slate-400 font-medium">
              Rotate 360° • Click floating radar hotspot to reserve
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 rounded-2xl bg-[#09111e]/90 border border-slate-800 px-4 py-2.5 text-[11px] font-bold text-white backdrop-blur-md pointer-events-auto shadow-2xl">
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

      {/* Bottom Floating Navigation Hint */}
      <div className="absolute bottom-4 left-4 z-10 text-[10px] font-medium text-slate-400 bg-slate-900/90 px-3.5 py-2 rounded-xl border border-slate-800 backdrop-blur-md">
        🖱 Left click + drag to look around 360° • Scroll to zoom
      </div>

      {/* Reservation Bottom Sheet Modal */}
      {selectedHotspot && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedHotspot(null);
          }}
          restaurantId={restaurantId}
          tableName={selectedHotspot.tableName}
          seats={selectedHotspot.seats}
          onSuccess={(booking) => {
            setHotspots((prev) =>
              prev.map((h) =>
                h.id === selectedHotspot.id ? { ...h, status: "occupied" } : h
              )
            );
            alert(`Table ${selectedHotspot.tableName} reserved successfully! Booking ID: ${booking.bookingId}`);
          }}
        />
      )}
    </div>
  );
}
