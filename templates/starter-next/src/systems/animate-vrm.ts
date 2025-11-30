import { World } from 'koota';
import * as THREE from 'three';
import { VRM, VRMHumanBoneName } from '@pixiv/three-vrm';
import { VRMAvatar, AnimationState, Time, Movement } from '../traits';

// Temporary vectors for calculations
const _euler = new THREE.Euler();

/**
 * Lerp helper
 */
function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

/**
 * Smooth damp helper
 */
function smoothDamp(current: number, target: number, velocity: { value: number }, smoothTime: number, delta: number): number {
	const omega = 2 / smoothTime;
	const x = omega * delta;
	const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
	const change = current - target;
	const temp = (velocity.value + omega * change) * delta;
	velocity.value = (velocity.value - omega * temp) * exp;
	return target + (change + temp) * exp;
}

/**
 * Set bone rotation safely
 */
function setBoneRotation(vrm: VRM, boneName: VRMHumanBoneName, x: number, y: number, z: number): void {
	const bone = vrm.humanoid?.getNormalizedBoneNode(boneName);
	if (bone) {
		bone.rotation.set(x, y, z);
	}
}

/**
 * Apply idle animation - subtle breathing and swaying
 */
function applyIdleAnimation(vrm: VRM, time: number, intensity: number = 1): void {
	const breathCycle = Math.sin(time * 2) * 0.02 * intensity;
	const swayCycle = Math.sin(time * 0.5) * 0.01 * intensity;

	// Spine breathing
	setBoneRotation(vrm, 'spine', breathCycle, 0, swayCycle);
	setBoneRotation(vrm, 'chest', breathCycle * 0.5, 0, 0);

	// Subtle head movement
	setBoneRotation(vrm, 'head',
		Math.sin(time * 0.7) * 0.02 * intensity,
		Math.sin(time * 0.3) * 0.03 * intensity,
		0
	);

	// Arms at rest
	setBoneRotation(vrm, 'leftUpperArm', 0, 0, 0.3 + breathCycle);
	setBoneRotation(vrm, 'rightUpperArm', 0, 0, -0.3 - breathCycle);
	setBoneRotation(vrm, 'leftLowerArm', 0, 0, 0);
	setBoneRotation(vrm, 'rightLowerArm', 0, 0, 0);

	// Legs straight
	setBoneRotation(vrm, 'leftUpperLeg', 0, 0, 0);
	setBoneRotation(vrm, 'rightUpperLeg', 0, 0, 0);
	setBoneRotation(vrm, 'leftLowerLeg', 0, 0, 0);
	setBoneRotation(vrm, 'rightLowerLeg', 0, 0, 0);
}

/**
 * Apply walk animation - procedural walking cycle
 */
function applyWalkAnimation(vrm: VRM, time: number, speed: number, intensity: number = 1): void {
	const walkSpeed = 8 * speed;
	const cycle = time * walkSpeed;

	// Leg swing amplitude based on speed
	const legSwing = 0.5 * intensity * Math.min(speed, 1);
	const armSwing = 0.4 * intensity * Math.min(speed, 1);

	// Hip sway
	const hipSway = Math.sin(cycle * 2) * 0.03 * intensity;
	setBoneRotation(vrm, 'hips', 0, hipSway, 0);

	// Spine counter-rotation
	setBoneRotation(vrm, 'spine', 0.05 * intensity, -hipSway * 0.5, Math.sin(cycle) * 0.02 * intensity);
	setBoneRotation(vrm, 'chest', 0, -hipSway * 0.3, 0);

	// Head stays relatively stable
	setBoneRotation(vrm, 'head', 0, 0, 0);

	// Legs - opposite phase
	const leftLegPhase = Math.sin(cycle);
	const rightLegPhase = Math.sin(cycle + Math.PI);

	// Upper legs
	setBoneRotation(vrm, 'leftUpperLeg', leftLegPhase * legSwing, 0, 0);
	setBoneRotation(vrm, 'rightUpperLeg', rightLegPhase * legSwing, 0, 0);

	// Lower legs - bend when leg is behind
	const leftKneeBend = Math.max(0, -leftLegPhase) * 0.8 * intensity;
	const rightKneeBend = Math.max(0, -rightLegPhase) * 0.8 * intensity;
	setBoneRotation(vrm, 'leftLowerLeg', leftKneeBend, 0, 0);
	setBoneRotation(vrm, 'rightLowerLeg', rightKneeBend, 0, 0);

	// Arms swing opposite to legs
	setBoneRotation(vrm, 'leftUpperArm', rightLegPhase * armSwing, 0, 0.2);
	setBoneRotation(vrm, 'rightUpperArm', leftLegPhase * armSwing, 0, -0.2);

	// Forearms slight bend
	setBoneRotation(vrm, 'leftLowerArm', -0.3 - Math.abs(rightLegPhase) * 0.2, 0, 0);
	setBoneRotation(vrm, 'rightLowerArm', -0.3 - Math.abs(leftLegPhase) * 0.2, 0, 0);
}

/**
 * Apply run animation - faster, more exaggerated walking
 */
function applyRunAnimation(vrm: VRM, time: number, speed: number, intensity: number = 1): void {
	const runSpeed = 12 * speed;
	const cycle = time * runSpeed;

	// More exaggerated movements for running
	const legSwing = 0.7 * intensity;
	const armSwing = 0.6 * intensity;

	// Forward lean
	setBoneRotation(vrm, 'spine', 0.15 * intensity, 0, 0);
	setBoneRotation(vrm, 'chest', 0.1 * intensity, 0, 0);

	// Legs
	const leftLegPhase = Math.sin(cycle);
	const rightLegPhase = Math.sin(cycle + Math.PI);

	setBoneRotation(vrm, 'leftUpperLeg', leftLegPhase * legSwing, 0, 0);
	setBoneRotation(vrm, 'rightUpperLeg', rightLegPhase * legSwing, 0, 0);

	// Higher knee lift when running
	const leftKneeBend = Math.max(0, -leftLegPhase) * 1.2 * intensity + 0.2;
	const rightKneeBend = Math.max(0, -rightLegPhase) * 1.2 * intensity + 0.2;
	setBoneRotation(vrm, 'leftLowerLeg', leftKneeBend, 0, 0);
	setBoneRotation(vrm, 'rightLowerLeg', rightKneeBend, 0, 0);

	// Arms pump more
	setBoneRotation(vrm, 'leftUpperArm', rightLegPhase * armSwing - 0.3, 0, 0.1);
	setBoneRotation(vrm, 'rightUpperArm', leftLegPhase * armSwing - 0.3, 0, -0.1);
	setBoneRotation(vrm, 'leftLowerArm', -0.8 - Math.abs(rightLegPhase) * 0.3, 0, 0);
	setBoneRotation(vrm, 'rightLowerArm', -0.8 - Math.abs(leftLegPhase) * 0.3, 0, 0);
}

/**
 * Apply fly animation - superman-style flying pose
 */
function applyFlyAnimation(vrm: VRM, time: number, speed: number, intensity: number = 1): void {
	const flyCycle = time * 3;

	// Body horizontal (pitch forward)
	setBoneRotation(vrm, 'spine', 0.3 * intensity, 0, 0);
	setBoneRotation(vrm, 'chest', 0.2 * intensity, 0, 0);

	// Head looks forward
	setBoneRotation(vrm, 'head', -0.3 * intensity, 0, 0);

	// Arms stretched forward or back based on speed
	const armStretch = lerp(0.5, -0.2, speed);
	setBoneRotation(vrm, 'leftUpperArm', armStretch, 0, 0.5 - speed * 0.4);
	setBoneRotation(vrm, 'rightUpperArm', armStretch, 0, -0.5 + speed * 0.4);
	setBoneRotation(vrm, 'leftLowerArm', 0, 0, 0);
	setBoneRotation(vrm, 'rightLowerArm', 0, 0, 0);

	// Legs trailing behind with slight movement
	const legWave = Math.sin(flyCycle) * 0.1 * intensity;
	setBoneRotation(vrm, 'leftUpperLeg', 0.2 + legWave, 0, -0.1);
	setBoneRotation(vrm, 'rightUpperLeg', 0.2 - legWave, 0, 0.1);
	setBoneRotation(vrm, 'leftLowerLeg', 0.3 + legWave * 0.5, 0, 0);
	setBoneRotation(vrm, 'rightLowerLeg', 0.3 - legWave * 0.5, 0, 0);
}

/**
 * Apply flying idle animation - hovering in place
 */
function applyFlyIdleAnimation(vrm: VRM, time: number, intensity: number = 1): void {
	const hoverCycle = time * 2;
	const hover = Math.sin(hoverCycle) * 0.05 * intensity;

	// Upright hovering pose
	setBoneRotation(vrm, 'spine', hover, 0, 0);
	setBoneRotation(vrm, 'chest', hover * 0.5, 0, 0);

	// Head neutral
	setBoneRotation(vrm, 'head', Math.sin(time * 0.7) * 0.05, Math.sin(time * 0.5) * 0.05, 0);

	// Arms out slightly for balance
	setBoneRotation(vrm, 'leftUpperArm', 0, 0, 0.6 + hover);
	setBoneRotation(vrm, 'rightUpperArm', 0, 0, -0.6 - hover);
	setBoneRotation(vrm, 'leftLowerArm', -0.2, 0, 0);
	setBoneRotation(vrm, 'rightLowerArm', -0.2, 0, 0);

	// Legs slightly bent
	setBoneRotation(vrm, 'leftUpperLeg', 0.1, 0, -0.1);
	setBoneRotation(vrm, 'rightUpperLeg', 0.1, 0, 0.1);
	setBoneRotation(vrm, 'leftLowerLeg', 0.3 + Math.sin(hoverCycle + 0.5) * 0.05, 0, 0);
	setBoneRotation(vrm, 'rightLowerLeg', 0.3 + Math.sin(hoverCycle) * 0.05, 0, 0);
}

/**
 * Apply jump animation
 */
function applyJumpAnimation(vrm: VRM, time: number, verticalVelocity: number, intensity: number = 1): void {
	// Determine if ascending or descending
	const isAscending = verticalVelocity > 0;

	if (isAscending) {
		// Jumping up - crouch to extend
		const jumpProgress = Math.min(time * 5, 1);

		setBoneRotation(vrm, 'spine', -0.1 * jumpProgress * intensity, 0, 0);
		setBoneRotation(vrm, 'leftUpperArm', -0.5 * jumpProgress, 0, 0.3);
		setBoneRotation(vrm, 'rightUpperArm', -0.5 * jumpProgress, 0, -0.3);
		setBoneRotation(vrm, 'leftUpperLeg', -0.2 * jumpProgress, 0, 0);
		setBoneRotation(vrm, 'rightUpperLeg', -0.2 * jumpProgress, 0, 0);
		setBoneRotation(vrm, 'leftLowerLeg', 0.4 * jumpProgress, 0, 0);
		setBoneRotation(vrm, 'rightLowerLeg', 0.4 * jumpProgress, 0, 0);
	} else {
		// Falling - prepare for landing
		setBoneRotation(vrm, 'spine', 0.1 * intensity, 0, 0);
		setBoneRotation(vrm, 'leftUpperArm', 0.3, 0, 0.5);
		setBoneRotation(vrm, 'rightUpperArm', 0.3, 0, -0.5);
		setBoneRotation(vrm, 'leftUpperLeg', 0.3, 0, -0.1);
		setBoneRotation(vrm, 'rightUpperLeg', 0.3, 0, 0.1);
		setBoneRotation(vrm, 'leftLowerLeg', 0.6, 0, 0);
		setBoneRotation(vrm, 'rightLowerLeg', 0.6, 0, 0);
	}
}

/**
 * Main animation system - updates VRM bone poses based on animation state
 */
export function animateVRM(world: World) {
	const { delta, current } = world.get(Time)!;

	world.query(VRMAvatar, AnimationState).updateEach(([avatar, animState]) => {
		const { vrm, loaded } = avatar;
		if (!vrm || !loaded) return;

		// Update animation time
		animState.animationTime += delta;

		// Smooth movement speed transition
		animState.movementSpeed = lerp(
			animState.movementSpeed,
			animState.targetMovementSpeed,
			delta * 10
		);

		// Reset pose first
		vrm.humanoid?.resetNormalizedPose();

		const time = animState.animationTime;
		const speed = animState.movementSpeed;

		// Apply animation based on current state
		switch (animState.currentAnimation) {
			case 'idle':
				applyIdleAnimation(vrm, time, 1);
				break;
			case 'walk':
				applyWalkAnimation(vrm, time, speed, 1);
				// Blend with idle when moving slowly
				if (speed < 0.3) {
					applyIdleAnimation(vrm, time, 1 - speed / 0.3);
				}
				break;
			case 'run':
				applyRunAnimation(vrm, time, speed, 1);
				break;
			case 'fly':
				applyFlyAnimation(vrm, time, speed, 1);
				break;
			case 'flyIdle':
				applyFlyIdleAnimation(vrm, time, 1);
				break;
			case 'jump':
			case 'fall':
				applyJumpAnimation(vrm, time, animState.verticalVelocity, 1);
				break;
		}

		// Update VRM (for expression/springbone updates)
		vrm.update(delta);
	});
}
