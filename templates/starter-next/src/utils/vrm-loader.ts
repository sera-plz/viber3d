import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRM, VRMUtils } from '@pixiv/three-vrm';

// Cache for loaded VRM models
const vrmCache = new Map<string, VRM>();

// Loader instance with VRM plugin
const gltfLoader = new GLTFLoader();
gltfLoader.register((parser) => new VRMLoaderPlugin(parser));

/**
 * Load a VRM model from URL
 */
export async function loadVRM(url: string): Promise<VRM> {
	// Check cache first
	const cached = vrmCache.get(url);
	if (cached) {
		// Clone the VRM for independent use
		return cloneVRM(cached);
	}

	return new Promise((resolve, reject) => {
		gltfLoader.load(
			url,
			(gltf) => {
				const vrm = gltf.userData.vrm as VRM;
				if (!vrm) {
					reject(new Error('No VRM data found in GLTF'));
					return;
				}

				// Rotate the model to face forward (VRM models face +Z by default)
				VRMUtils.rotateVRM0(vrm);

				// Cache the original
				vrmCache.set(url, vrm);

				resolve(vrm);
			},
			(progress) => {
				console.log(`Loading VRM: ${((progress.loaded / progress.total) * 100).toFixed(1)}%`);
			},
			(error) => {
				reject(error);
			}
		);
	});
}

/**
 * Clone a VRM for independent use
 */
function cloneVRM(source: VRM): VRM {
	// Deep clone is complex for VRM, so we just return the source for now
	// In production, you'd want to properly clone the model
	return source;
}

/**
 * Get the humanoid bone by name
 */
export function getVRMBone(vrm: VRM, boneName: string): THREE.Object3D | null {
	const bone = vrm.humanoid?.getNormalizedBoneNode(boneName as any);
	return bone || null;
}

/**
 * Set the rotation of a VRM bone
 */
export function setVRMBoneRotation(
	vrm: VRM,
	boneName: string,
	rotation: THREE.Euler | { x: number; y: number; z: number }
): void {
	const bone = getVRMBone(vrm, boneName);
	if (bone) {
		bone.rotation.set(rotation.x, rotation.y, rotation.z);
	}
}

/**
 * Reset all VRM bones to their default T-pose
 */
export function resetVRMPose(vrm: VRM): void {
	vrm.humanoid?.resetNormalizedPose();
}

/**
 * Update VRM model (call each frame)
 */
export function updateVRM(vrm: VRM, delta: number): void {
	vrm.update(delta);
}

/**
 * Dispose of a VRM model
 */
export function disposeVRM(vrm: VRM): void {
	VRMUtils.deepDispose(vrm.scene);
}

// Default VRM URL (you can replace this with your own)
export const DEFAULT_VRM_URL = 'https://cdn.jsdelivr.net/gh/pixiv/three-vrm@dev/packages/three-vrm/examples/models/VRM1_Constraint_Twist_Sample.vrm';
