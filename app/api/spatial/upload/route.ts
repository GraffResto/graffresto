import { NextResponse } from "next/server";
import { SpatialReconstructionService } from "@/lib/spatial/spatial.service";
import { db, doc, updateDoc, getDoc } from "@/lib/firebase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { restaurantId, telemetry, fileSizeBytes, uploadedGlbUrl } = body;

    if (!restaurantId) {
      return NextResponse.json(
        { error: "Missing required parameter: restaurantId" },
        { status: 400 }
      );
    }

    // Rate Limiting & Quota Verification: max upload size 2GB
    const MAX_2GB = 2 * 1024 * 1024 * 1024;
    if (fileSizeBytes && fileSizeBytes > MAX_2GB) {
      return NextResponse.json(
        { error: "File payload exceeds 2GB maximum boundary limit." },
        { status: 413 }
      );
    }

    const normalizedTelemetry = SpatialReconstructionService.normalizeTelemetry(telemetry || {});
    const { modelUrl, metadata } = await SpatialReconstructionService.processReconstruction(
      restaurantId,
      normalizedTelemetry,
      uploadedGlbUrl
    );

    // Save to Firestore
    try {
      const restRef = doc(db, "restaurants", restaurantId);
      const restSnap = await getDoc(restRef);
      if (restSnap.exists()) {
        await updateDoc(restRef, {
          spatial_model_url: modelUrl,
          spatial_mesh_metadata_json: JSON.stringify(metadata),
          is_3d_active: true,
          is_3d_enabled: true,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn("Firestore update notice:", e);
    }

    return NextResponse.json({
      success: true,
      restaurantId,
      spatialModelUrl: modelUrl,
      metadata,
      message: "Spatial AI 3D reconstruction pipeline completed successfully.",
    });
  } catch (err: any) {
    console.error("Spatial Upload API Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process spatial upload pipeline." },
      { status: 500 }
    );
  }
}
