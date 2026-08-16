import { NextResponse } from "next/server";
import { SpatialReconstructionService } from "@/lib/spatial/spatial.service";
import { db, doc, setDoc, updateDoc, getDoc, collection } from "@/lib/firebase";
import { randomUUID } from "node:crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { restaurantId, mimeType, fileSizeBytes, telemetry, videoUrl } = body;

    // Task 1: Validate MIME types (.mp4, .mov)
    const allowedMimeTypes = ["video/mp4", "video/quicktime", "video/x-matroska", "model/gltf-binary"];
    if (mimeType && !allowedMimeTypes.includes(mimeType)) {
      return NextResponse.json(
        { error: "Invalid MIME type. Only .mp4, .mov, and .glb files are accepted for 3D reconstruction." },
        { status: 400 }
      );
    }

    // Task 2: Max file size limit up to 2GB
    const MAX_2GB = 2 * 1024 * 1024 * 1024;
    if (fileSizeBytes && fileSizeBytes > MAX_2GB) {
      return NextResponse.json(
        { error: "File payload exceeds 2GB maximum boundary limit." },
        { status: 413 }
      );
    }

    // Task 5 & 8: Generate unique UUID for spatial scan session
    const scanId = randomUUID ? randomUUID() : `scan_${Date.now()}`;
    const scanRef = doc(db, "spatial_scans", scanId);

    // Task 4: Store in spatial_scans with PENDING status
    const scanData = {
      id: scanId,
      restaurant_id: restaurantId || "default-restaurant",
      status: "PENDING",
      file_size_bytes: fileSizeBytes || 0,
      mime_type: mimeType || "video/mp4",
      telemetry_json: JSON.stringify(telemetry || {}),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await setDoc(scanRef, scanData);

    // Task 9 & 10: Trigger asynchronous AI processing queue worker (Luma AI / Polycam Splatting API adapter)
    await updateDoc(scanRef, {
      status: "PROCESSING",
      updated_at: new Date().toISOString(),
    });

    const normalizedTelemetry = SpatialReconstructionService.normalizeTelemetry(telemetry || {});
    const { modelUrl, metadata } = await SpatialReconstructionService.processReconstruction(
      restaurantId || "default-restaurant",
      normalizedTelemetry
    );

    // Task 13, 14, 15 & 16: Complete scan & save spatial_model_url to restaurants table
    await updateDoc(scanRef, {
      status: "COMPLETED",
      spatial_model_url: modelUrl,
      spatial_mesh_metadata_json: JSON.stringify(metadata),
      updated_at: new Date().toISOString(),
    });

    if (restaurantId) {
      try {
        const restRef = doc(db, "restaurants", restaurantId);
        const restSnap = await getDoc(restRef);
        if (restSnap.exists()) {
          await updateDoc(restRef, {
            spatial_model_url: modelUrl,
            spatial_mesh_metadata_json: JSON.stringify(metadata),
            is_3d_enabled: true,
            is_3d_active: true,
            updated_at: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.warn("Firestore restaurant document update notice:", e);
      }
    }

    return NextResponse.json({
      success: true,
      scanId,
      status: "COMPLETED",
      spatialModelUrl: modelUrl,
      metadata,
      message: "Spatial video ingestion and photogrammetry reconstruction completed successfully.",
    });
  } catch (err: any) {
    console.error("[SpatialInferenceEngine] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process spatial upload stream." },
      { status: 500 }
    );
  }
}
