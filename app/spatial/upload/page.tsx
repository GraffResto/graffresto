"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  Eye,
  Camera,
} from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function SpatialUploadPortalPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setErrorMsg(null);

      if (file.type.startsWith("image/")) {
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
      } else {
        setPreviewUrl(null);
      }
    }
  }

  async function handleStartUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg("Please select a 360° equirectangular photo or video stream.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);
    setErrorMsg(null);

    try {
      // Store local Blob URL for immediate client-side 360° rendering
      const blobUrl = URL.createObjectURL(selectedFile);
      localStorage.setItem("last_uploaded_3d_glb", blobUrl);

      // Simulate chunked upload progress
      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressTimer);
            return 90;
          }
          return prev + 20;
        });
      }, 300);

      const res = await fetch("/api/spatial/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: "demo-restaurant-id",
          fileSizeBytes: selectedFile.size,
          mimeType: selectedFile.type || "image/jpeg",
          uploadedGlbUrl: blobUrl,
          telemetry: {
            focalLength: 52,
            hasLidarDepthMap: true,
            mediaType: "panorama_360",
            deviceModel: "360° Spherical Panoramic Camera",
          },
        }),
      });

      clearInterval(progressTimer);
      setUploadProgress(100);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "360° Panoramic upload failed.");
      }

      setUploadResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process 360° panoramic upload.");
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
              <Camera size={22} />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white">DineFlow</span>
              <span className="ml-2 rounded-full bg-orange-500/20 px-3 py-0.5 text-xs font-black text-orange-400 border border-orange-500/30">
                360° PANORAMIC DIGITAL TWIN
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        <Link
          href="/partner/floor-plan"
          className="mb-8 inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft size={16} /> Back to Floor Map & Dashboard
        </Link>

        <div className="rounded-[2.5rem] border border-slate-800 bg-[#09111e] p-8 md:p-12 shadow-2xl space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Camera size={32} />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white">
              360° Panoramic Digital Twin Upload
            </h1>
            <p className="text-sm text-slate-400">
              Upload equirectangular 360° photos or spherical panorama sweeps of your restaurant interior to deploy an interactive inside-out digital twin tour.
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
                <h3 className="text-2xl font-black text-white">
                  360° Digital Twin Published Successfully!
                </h3>
                <p className="text-xs text-slate-300 mt-2">
                  Your equirectangular panorama has been stored and deployed to your live 360° digital twin floor map.
                </p>
              </div>

              <div className="flex justify-center gap-4 pt-2">
                <button
                  onClick={() => {
                    setUploadResult(null);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="rounded-2xl border border-slate-700 bg-slate-800 px-6 py-3.5 text-xs font-bold text-white hover:bg-slate-700 transition"
                >
                  Upload Another 360° Photo
                </button>
                <Link
                  href="/partner/floor-plan"
                  className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-3.5 text-xs font-black text-white hover:bg-orange-600 shadow-xl shadow-orange-500/20 transition"
                >
                  <Eye size={16} /> Preview 360° Interactive Room
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleStartUpload} className="space-y-6">
              {/* Dropzone Area */}
              <div className="relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-700 bg-slate-900/50 p-10 text-center hover:border-orange-500 transition group cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,video/mp4,video/quicktime"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />

                {previewUrl ? (
                  <div className="space-y-4 text-center">
                    <div className="relative mx-auto h-36 w-64 overflow-hidden rounded-2xl border border-orange-500/40 shadow-xl">
                      <img
                        src={previewUrl}
                        alt="360 Panorama Preview"
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute bottom-2 right-2 rounded-lg bg-black/70 px-2.5 py-1 text-[10px] font-bold text-emerald-400 backdrop-blur-md">
                        360° Ready
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">
                        {selectedFile?.name}
                      </p>
                      <p className="text-[11px] text-emerald-400 font-bold mt-1 flex items-center justify-center gap-1">
                        <CheckCircle2 size={14} /> 360° Equirectangular Photo Ready for Deployment
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400 group-hover:scale-110 transition">
                      <UploadCloud size={36} />
                    </div>

                    <h3 className="mt-4 text-base font-black text-white">
                      {selectedFile ? selectedFile.name : "Choose 360° photo or drag & drop here"}
                    </h3>

                    <p className="mt-1.5 text-xs text-slate-400">
                      Supports JPG, PNG equirectangular panorama photos or MP4 video sweeps up to 2GB
                    </p>
                  </>
                )}
              </div>

              {/* Progress Bar */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-orange-500" />
                      Deploying 360° Digital Twin Panorama...
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
                  <span>Processing 360° Spatial Panorama...</span>
                ) : (
                  <>
                    <Sparkles size={18} /> Publish 360° Panoramic Digital Twin
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
