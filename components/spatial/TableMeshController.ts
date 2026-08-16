import * as THREE from "three";

export type TableStatus = "available" | "occupied" | "pending";

export interface SpatialTableNode {
  nodeName: string;
  mappedTableId: string;
  tableName: string;
  seats: number;
  status: TableStatus;
  mesh?: THREE.Mesh;
}

export class TableMeshController {
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  // Material Palette matching Master Specification
  public static readonly COLOR_AVAILABLE = 0x10b981; // Emerald Green (#10B981)
  public static readonly COLOR_OCCUPIED = 0xef4444;  // Rose Red (#EF4444)
  public static readonly COLOR_PENDING = 0xf59e0b;   // Amber Yellow (#F59E0B)

  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  /**
   * Casts a ray into the 3D scene graph and resolves targeted table mesh nodes.
   */
  public raycastTableNodes(
    clientX: number,
    clientY: number,
    rect: DOMRect,
    camera: THREE.PerspectiveCamera,
    interactiveMeshes: THREE.Mesh[]
  ): THREE.Mesh | null {
    // Normalize coordinates to [-1, 1]
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, camera);
    const intersects = this.raycaster.intersectObjects(interactiveMeshes, true);

    if (intersects.length > 0) {
      let object: THREE.Object3D | null = intersects[0].object;
      while (object) {
        if (object instanceof THREE.Mesh && object.userData?.isTableNode) {
          return object;
        }
        object = object.parent;
      }
    }
    return null;
  }

  /**
   * Applies emissive shader properties to reflect real-time table status.
   */
  public static applyStatusMaterial(mesh: THREE.Mesh, status: TableStatus) {
    if (!mesh.material) return;

    // Create custom Standard Material with emissive response
    const mat = (mesh.material as THREE.MeshStandardMaterial).clone();

    switch (status) {
      case "available":
        mat.color.setHex(TableMeshController.COLOR_AVAILABLE);
        mat.emissive.setHex(0x059669);
        mat.emissiveIntensity = 0.35;
        mat.opacity = 0.95;
        mat.transparent = true;
        break;
      case "occupied":
        mat.color.setHex(TableMeshController.COLOR_OCCUPIED);
        mat.emissive.setHex(0x991b1b);
        mat.emissiveIntensity = 0.15;
        mat.opacity = 0.55;
        mat.transparent = true;
        break;
      case "pending":
        mat.color.setHex(TableMeshController.COLOR_PENDING);
        mat.emissive.setHex(0xd97706);
        mat.emissiveIntensity = 0.6;
        mat.opacity = 0.85;
        mat.transparent = true;
        break;
    }

    mesh.material = mat;
  }
}
