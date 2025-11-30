import { createActions } from 'koota';
import * as THREE from 'three';
import {
	IsPlayer,
	Transform,
	IsCamera,
	Input,
	Movement,
	VRMAvatar,
	AnimationState,
	Gravity,
} from './traits';

export const actions = createActions((world) => ({
	/**
	 * Spawn a VRM avatar player with all necessary traits for walking/flying
	 */
	spawnPlayer: (position: [number, number, number] = [0, 0, 0]) => {
		return world.spawn(
			IsPlayer,
			Transform({ position: new THREE.Vector3(...position) }),
			Input,
			Movement({ thrust: 1, damping: 0.95 }),
			VRMAvatar,
			AnimationState,
			Gravity({ groundLevel: 0, groundOffset: 0 })
		);
	},

	/**
	 * Spawn camera at position
	 */
	spawnCamera: (position: [number, number, number]) => {
		return world.spawn(Transform({ position: new THREE.Vector3(...position) }), IsCamera);
	},
}));
