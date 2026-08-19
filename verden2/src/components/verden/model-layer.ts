/**
 * Mapbox custom 3D layer that renders Garage vehicles (GLB) in map space.
 *
 * Models are only rendered at zoom >= MODEL_MIN_ZOOM; below that the map falls
 * back to light vector pins (handled in VerdenMap) so WebGL stays cheap.
 */

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { CustomLayerInterface, Map as MapboxMap, MercatorCoordinate } from "mapbox-gl";

export const MODEL_MIN_ZOOM = 15;

export type ModelEntity = {
  id: string;
  lng: number;
  lat: number;
  /** Degrees clockwise from north. */
  heading: number;
  /** Garage model file, e.g. "sedan.glb". */
  modelKey: string;
  /** Rendered size in metres along the vehicle's longest axis. */
  sizeM?: number;
  /** Tint applied to the whole model (hex), used for convoy identity. */
  tint?: string;
};

type Loaded = { group: THREE.Group; modelKey: string };

const MODEL_BASE = "/3D%20Files/";
const loader = new GLTFLoader();
const templates = new Map<string, Promise<THREE.Group>>();

function loadTemplate(modelKey: string): Promise<THREE.Group> {
  const existing = templates.get(modelKey);
  if (existing) return existing;
  const promise = new Promise<THREE.Group>((resolve, reject) => {
    loader.load(
      `${MODEL_BASE}${encodeURIComponent(modelKey)}`,
      (gltf) => resolve(gltf.scene),
      undefined,
      reject,
    );
  });
  templates.set(modelKey, promise);
  return promise;
}

/** Normalise a GLB so its longest axis measures `sizeM` metres and it sits on the ground. */
function normalise(source: THREE.Group, sizeM: number, tint?: string) {
  const group = source.clone(true);
  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());
  const longest = Math.max(size.x, size.y, size.z) || 1;
  const scale = sizeM / longest;
  group.scale.setScalar(scale);
  const center = box.getCenter(new THREE.Vector3());
  group.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
  if (tint) {
    group.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const material = (mesh.material as THREE.MeshStandardMaterial)?.clone?.();
      if (material) {
        material.emissive = new THREE.Color(tint);
        material.emissiveIntensity = 0.25;
        mesh.material = material;
      }
    });
  }
  const wrapper = new THREE.Group();
  wrapper.add(group);
  return wrapper;
}

export class VehicleModelLayer implements CustomLayerInterface {
  id = "verden-vehicles";
  type = "custom" as const;
  renderingMode = "3d" as const;

  private map: MapboxMap | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene = new THREE.Scene();
  private camera = new THREE.Camera();
  private models = new Map<string, Loaded>();
  private entities: ModelEntity[] = [];
  private mercator: typeof MercatorCoordinate | null = null;

  constructor(mercatorCoordinate: typeof MercatorCoordinate) {
    this.mercator = mercatorCoordinate;
    this.scene.add(new THREE.AmbientLight(0xffffff, 2.2));
    const sun = new THREE.DirectionalLight(0xffffff, 2.4);
    sun.position.set(0.5, 1, 0.8);
    this.scene.add(sun);
  }

  setEntities(entities: ModelEntity[]) {
    this.entities = entities;
    for (const entity of entities) void this.ensure(entity);
    for (const [id, loaded] of this.models) {
      if (!entities.some((e) => e.id === id)) {
        this.scene.remove(loaded.group);
        this.models.delete(id);
      }
    }
    this.map?.triggerRepaint();
  }

  private async ensure(entity: ModelEntity) {
    const existing = this.models.get(entity.id);
    if (existing && existing.modelKey === entity.modelKey) return;
    try {
      const template = await loadTemplate(entity.modelKey);
      const previous = this.models.get(entity.id);
      if (previous) this.scene.remove(previous.group);
      const group = normalise(template, entity.sizeM ?? 4.6, entity.tint);
      this.scene.add(group);
      this.models.set(entity.id, { group, modelKey: entity.modelKey });
      this.map?.triggerRepaint();
    } catch (error) {
      console.warn(`Verden: 3D model "${entity.modelKey}" could not be loaded`, error);
    }
  }

  onAdd(map: MapboxMap, gl: WebGLRenderingContext) {
    this.map = map;
    this.renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl as WebGL2RenderingContext,
      antialias: true,
    });
    this.renderer.autoClear = false;
  }

  onRemove() {
    this.models.clear();
    this.scene.clear();
    this.renderer = null;
    this.map = null;
  }

  render(_gl: WebGLRenderingContext, args: unknown) {
    if (!this.renderer || !this.map || !this.mercator) return;
    if ((this.map.getZoom() ?? 0) < MODEL_MIN_ZOOM) return;

    const matrix = extractMatrix(args);
    if (!matrix) return;

    for (const entity of this.entities) {
      const loaded = this.models.get(entity.id);
      if (!loaded) continue;
      const coord = this.mercator.fromLngLat({ lng: entity.lng, lat: entity.lat }, 0);
      const unit = coord.meterInMercatorCoordinateUnits();
      loaded.group.position.set(coord.x, coord.y, coord.z);
      loaded.group.scale.setScalar(unit);
      loaded.group.rotation.set(Math.PI / 2, THREE.MathUtils.degToRad(180 - entity.heading), 0);
      loaded.group.updateMatrixWorld(true);
    }

    this.camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);
    this.renderer.resetState();
    this.renderer.render(this.scene, this.camera);
    this.map.triggerRepaint();
  }
}

/** Mapbox GL v3 passes a projection-data object; older builds pass a raw matrix. */
function extractMatrix(args: unknown): number[] | null {
  if (Array.isArray(args)) return args as number[];
  const record = args as
    | { defaultProjectionData?: { mainMatrix?: number[] }; modelViewProjectionMatrix?: number[] }
    | undefined;
  return record?.defaultProjectionData?.mainMatrix ?? record?.modelViewProjectionMatrix ?? null;
}
