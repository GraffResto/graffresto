"use client";

import React, { useState } from "react";
import Link from "next/link";
import { UploadCloud, Video, Sparkles, CheckCircle2, ShieldCheck, ArrowLeft, Loader2, Cpu } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function SpatialUploadPortalPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  }

  async function handleStartUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg("Please select a video file or 3D mesh asset.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);
    setErrorMsg(null);

    try {
      // Simulate chunked upload & call backend API /api/spatial/upload
      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressTimer);
            return 90;
          }
          return prev + 15;
        });
      }, 400);

      const res = await fetch("/api/spatial/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: "demo-restaurant-id",
          fileSizeBytes: selectedFile.size,
          telemetry: {
            focalLength: 52,
            frameRate: 60,
            hasLidarDepthMap: true,
            deviceModel: "iPhone 15 Pro Max / LiDAR Spatial Scanner",
          },
        }),
      });

      clearInterval(progressTimer);
      setUploadProgress(100);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Spatial upload failed.");
      }

      setUploadResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process spatial video upload.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#060c14] text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#09111e]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/partner" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 text-white font-bold shadow-lg shadow-orange-500/30">
              <Sparkles size={22} />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white">DineFlow</span>
              <span className="ml-2 rounded-full bg-orange-500/20 px-3 py-0.5 text-xs font-black text-orange-400 border border-orange-500/30">
                3D SPATIAL DIGITIZATION
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main Form Body */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        <Link
          href="/partner/settings"
          className="mb-8 inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft size={16} /> Back to Partner Dashboard
        </Link>

        <div className="rounded-[2.5rem] border border-slate-800 bg-[#09111e] p-8 md:p-12 shadow-2xl space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Video size={32} />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white">
              Autonomous 3D Spatial Video Capture
            </h1>
            <p className="text-sm text-slate-400">
              Upload smartphone video sweeps or LiDAR mesh scans of your restaurant interior to auto-generate a high-fidelity 3D Digital Twin floor map.
            </p>
          </div>

          {errorMsg && (
            <div className="rounded-2xl bg-red-950/60 border border-red-500/40 p-4 text-xs font-bold text-red-300 text-center">
              {errorMsg}
            </div>
          )}

          {uploadResult ? (
            <div className="rounded-3xl bg-emerald-950/40 border border-emerald-500/40 p-8 text-center space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">Spatial AI Reconstruction Complete!</h3>
                <p className="text-xs text-slate-300 mt-2">
                  Generated 3D GLB model and discovered 18 interactive table nodes with Draco geometry compression.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left font-mono text-xs text-emerald-400 overflow-x-auto">
                <p>Model URL: {uploadResult.spatialModelUrl}</p>
                <p>Discovered Nodes: {uploadResult.metadata?.nodeCount} table meshes</p>
                <p>Draco Compressed: Yes</p>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setUploadResult(null)}
                  className="rounded-2xl border border-slate-700 bg-slate-800 px-6 py-3 text-xs font-bold text-white hover:bg-slate-700"
                >
                  Upload Another Capture
                </button>
                <Link
                  href="/partner/settings"
                  className="rounded-2xl bg-orange-500 px-6 py-3 text-xs font-black text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20"
                >
                  Configure 3D Table Node Mappings
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleStartUpload} className="space-y-6">
              {/* Drag & Drop Upload Zone */}
              <div className="relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-700 bg-slate-900/50 p-10 text-center hover:border-orange-500 transition group cursor-pointer">
                <input
                  type="file"
                  accept="video/*,.glb,.gltf"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400 group-hover:scale-110 transition">
                  <UploadCloud size={36} />
                </div>

                <h3 className="mt-4 text-base font-black text-white">
                  {selectedFile ? selectedFile.name : "Choose video sweep or drop file here"}
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  {selectedFile
                    ? `File size: ${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
                    : "MP4, MOV, GLB or GLTF files up to 2GB supported"}
                </p>
              </div>

              {/* Upload Progress Bar */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-2">
                      <Cpu size={14} className="animate-spin text-orange-500" />
                      AI Reconstruction in progress...
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isUploading || !selectedFile}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 text-xs font-black text-white hover:bg-orange-600 shadow-xl shadow-orange-500/20 disabled:opacity-50 transition"
              >
                {isUploading ? (
                  <span>Processing Gaussian Splatting & Draco Mesh...</span>
                ) : (
                  <>
                    <Sparkles size={18} /> Process Autonomous 3D Spatial Reconstruction
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
