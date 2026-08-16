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
  Link2,
  Globe,
} from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { formatExternalTourEmbedUrl } from "@/components/spatial/Restaurant3DViewer";

export default function SpatialUploadPortalPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"file" | "url">("file");

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // External Tour Link State
  const [externalUrl, setExternalUrl] = useState("");
  const [urlValidatedEmbed, setUrlValidatedEmbed] = useState<string | null>(null);

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

  function handleUrlInputChange(urlValue: string) {
    setExternalUrl(urlValue);
    setErrorMsg(null);
    const embed = formatExternalTourEmbedUrl(urlValue);
    setUrlValidatedEmbed(embed);
  }

  async function handleStartSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsUploading(true);
    setUploadProgress(25);
    setErrorMsg(null);

    try {
      let finalTargetUrl = "";

      if (activeTab === "file") {
        if (!selectedFile) {
          throw new Error("Please select a 360° photo or video stream file.");
        }
        finalTargetUrl = URL.createObjectURL(selectedFile);
      } else {
        if (!externalUrl || !externalUrl.trim()) {
          throw new Error("Please paste a valid 360° virtual tour URL.");
        }
        const embed = formatExternalTourEmbedUrl(externalUrl);
        if (!embed) {
          throw new Error(
            "Could not parse valid 360° embed link. Please enter a TeliportMe, Kuula, Matterport, or Google Street View link."
          );
        }
        finalTargetUrl = embed;
      }

      // Store in localStorage for instant client rendering
      localStorage.setItem("last_uploaded_3d_glb", finalTargetUrl);

      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressTimer);
            return 90;
          }
          return prev + 25;
        });
      }, 300);

      const res = await fetch("/api/spatial/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: "demo-restaurant-id",
          uploadedGlbUrl: finalTargetUrl,
          mimeType: activeTab === "file" ? selectedFile?.type : "external_embed",
          telemetry: {
            mediaType: activeTab === "file" ? "panorama_360" : "external_embed",
            originalUrl: externalUrl,
          },
        }),
      });

      clearInterval(progressTimer);
      setUploadProgress(100);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "360° Digital Twin deployment failed.");
      }

      setUploadResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to deploy 360° virtual tour.");
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
              <Globe size={32} />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white">
              360° Panoramic Digital Twin Upload
            </h1>
            <p className="text-sm text-slate-400">
              Upload 360° photos or paste virtual tour links from TeliportMe, Kuula, Matterport, CloudPano, or Google Street View.
            </p>
          </div>

          {/* Dual Mode Mode Switcher */}
          <div className="flex justify-center">
            <div className="inline-flex rounded-2xl bg-slate-900 border border-slate-800 p-1.5 gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("file");
                  setErrorMsg(null);
                }}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black transition ${
                  activeTab === "file"
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Camera size={16} /> Upload 360° File
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("url");
                  setErrorMsg(null);
                }}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black transition ${
                  activeTab === "url"
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Link2 size={16} /> Paste 360° Tour Link
              </button>
            </div>
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
                  360° Digital Twin Deployed Successfully!
                </h3>
                <p className="text-xs text-slate-300 mt-2">
                  Your 360° tour source has been stored and deployed to your live digital twin floor map.
                </p>
              </div>

              <div className="flex justify-center gap-4 pt-2">
                <button
                  onClick={() => {
                    setUploadResult(null);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setExternalUrl("");
                    setUrlValidatedEmbed(null);
                  }}
                  className="rounded-2xl border border-slate-700 bg-slate-800 px-6 py-3.5 text-xs font-bold text-white hover:bg-slate-700 transition"
                >
                  Deploy Another 360° Source
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
            <form onSubmit={handleStartSubmit} className="space-y-6">
              {activeTab === "file" ? (
                /* File Dropzone Area */
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
                        <img src={previewUrl} alt="360 Panorama Preview" className="h-full w-full object-cover" />
                        <span className="absolute bottom-2 right-2 rounded-lg bg-black/70 px-2.5 py-1 text-[10px] font-bold text-emerald-400 backdrop-blur-md">
                          360° Ready
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-black text-white">{selectedFile?.name}</p>
                        <p className="text-[11px] text-emerald-400 font-bold mt-1 flex items-center justify-center gap-1">
                          <CheckCircle2 size={14} /> 360° Photo Ready for Deployment
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
              ) : (
                /* External Virtual Tour Link Mode */
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 space-y-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Paste 360° Tour URL or Embed Link
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={externalUrl}
                        onChange={(e) => handleUrlInputChange(e.target.value)}
                        placeholder="e.g. https://teliportme.com/view/2613999 or Kuula / Matterport link"
                        className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 pr-12 text-xs font-bold text-white outline-none focus:border-orange-500"
                      />
                      <Globe size={18} className="absolute right-4 top-4 text-slate-500" />
                    </div>
                  </div>

                  {urlValidatedEmbed && (
                    <div className="rounded-2xl bg-emerald-950/50 border border-emerald-500/40 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                        <CheckCircle2 size={16} /> Valid 360° Tour Embed Detected
                      </div>
                      <div className="h-44 w-full overflow-hidden rounded-xl border border-slate-800 bg-black">
                        <iframe
                          src={urlValidatedEmbed}
                          title="Tour Preview"
                          className="w-full h-full border-0 pointer-events-none"
                        />
                      </div>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 space-y-1">
                    <p className="font-bold text-slate-300">Supported Platforms:</p>
                    <p>• TeliportMe (`teliportme.com/view/...`)</p>
                    <p>• Kuula (`kuula.co/post/...`)</p>
                    <p>• Matterport (`my.matterport.com/show/...`)</p>
                    <p>• CloudPano / Google Street View</p>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-orange-500" />
                      Deploying 360° Digital Twin...
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
                disabled={
                  isUploading ||
                  (activeTab === "file" && !selectedFile) ||
                  (activeTab === "url" && !urlValidatedEmbed)
                }
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 text-xs font-black text-white hover:bg-orange-600 shadow-xl shadow-orange-500/20 disabled:opacity-50 transition"
              >
                {isUploading ? (
                  <span>Deploying 360° Spatial Digital Twin...</span>
                ) : (
                  <>
                    <Sparkles size={18} /> Deploy 360° Panoramic Digital Twin
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
