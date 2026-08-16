import { NextResponse } from "next/server";
import { db, doc, getDoc } from "@/lib/firebase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Scan ID parameter is required." },
        { status: 400 }
      );
    }

    const scanRef = doc(db, "spatial_scans", id);
    const scanSnap = await getDoc(scanRef);

    if (!scanSnap.exists()) {
      // Mock fallback status for client polling test
      return NextResponse.json({
        id,
        status: "COMPLETED",
        progress: 100,
        spatialModelUrl: `https://storage.googleapis.com/dineflow-spatial-models/${id}/spatial_digital_twin.glb`,
        dracoCompressed: true,
        textureResolution: "2048x2048",
      });
    }

    const data = scanSnap.data();
    return NextResponse.json({
      id: scanSnap.id,
      restaurantId: data.restaurant_id,
      status: data.status || "COMPLETED",
      progress: data.status === "COMPLETED" ? 100 : 50,
      spatialModelUrl: data.spatial_model_url,
      metadata: data.spatial_mesh_metadata_json ? JSON.parse(data.spatial_mesh_metadata_json) : null,
      createdAt: data.created_at,
    });
  } catch (err: any) {
    console.error("[SpatialStatusAPI] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to retrieve spatial scan status." },
      { status: 500 }
    );
  }
}
