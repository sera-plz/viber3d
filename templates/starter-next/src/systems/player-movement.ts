import { World } from 'koota';
import * as THREE from 'three';
import { Input, Transform, Movement, AnimationState, Gravity, Time, IsPlayer } from '../traits';

// Constants
const WALK_SPEED = 5;
const RUN_SPEED = 10;
const FLY_SPEED = 15;
const FLY_BOOST_SPEED = 30;
const JUMP_FORCE = 10;
const ROTATION_SPEED = 5;
const GRAVITY_STRENGTH = 20;

// Temp vectors
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _moveDirection = new THREE.Vector3();
const _velocity = new THREE.Vector3();

/**
 * Player movement system - handles walking and flying movement
 */
export function playerMovement(world: World) {
	const { delta } = world.get(Time)!;

	world.query(IsPlayer, Input, Transform, Movement, AnimationState, Gravity).updateEach(
		([input, transform, movement, animState, gravity]) => {
			const { movementMode, isGrounded } = animState;

			// Calculate forward and right vectors based on current Y rotation only (for walking)
			// For flying, we use the full rotation
			if (movementMode === 'walk') {
				// Walking mode - movement on XZ plane
				const yRotation = transform.rotation.y;
				_forward.set(-Math.sin(yRotation), 0, -Math.cos(yRotation));
				_right.set(Math.cos(yRotation), 0, -Math.sin(yRotation));

				// Calculate movement direction
				_moveDirection.set(0, 0, 0);

				if (input.forward > 0) {
					_moveDirection.add(_forward);
				}
				if (input.brake) {
					_moveDirection.sub(_forward);
				}
				if (input.strafe !== 0) {
					_moveDirection.addScaledVector(_right, input.strafe);
				}

				// Normalize if moving diagonally
				if (_moveDirection.lengthSq() > 0) {
					_moveDirection.normalize();
				}

				// Determine speed based on boost
				const targetSpeed = input.boost ? RUN_SPEED : WALK_SPEED;
				const currentSpeed = _moveDirection.length() > 0 ? targetSpeed : 0;

				// Apply horizontal movement
				movement.velocity.x = _moveDirection.x * currentSpeed;
				movement.velocity.z = _moveDirection.z * currentSpeed;

				// Apply gravity
				if (gravity.enabled) {
					animState.verticalVelocity -= GRAVITY_STRENGTH * delta;

					// Ground detection
					const nextY = transform.position.y + animState.verticalVelocity * delta;
					if (nextY <= gravity.groundLevel + gravity.groundOffset) {
						transform.position.y = gravity.groundLevel + gravity.groundOffset;
						animState.verticalVelocity = 0;
						animState.isGrounded = true;
					} else {
						animState.isGrounded = false;
					}
				}

				// Handle jumping
				if (input.boost && animState.isGrounded && animState.jumpRequested) {
					animState.verticalVelocity = JUMP_FORCE;
					animState.isGrounded = false;
					animState.jumpRequested = false;
				}

				// Apply vertical velocity
				movement.velocity.y = animState.verticalVelocity;

				// Handle rotation from mouse input
				if (input.mouseDelta.x !== 0) {
					transform.rotation.y -= input.mouseDelta.x * 0.002;
				}

				// Update animation state
				const horizontalSpeed = Math.sqrt(movement.velocity.x ** 2 + movement.velocity.z ** 2);
				animState.targetMovementSpeed = horizontalSpeed / RUN_SPEED;

				if (!animState.isGrounded) {
					animState.currentAnimation = animState.verticalVelocity > 0 ? 'jump' : 'fall';
				} else if (horizontalSpeed > 0.1) {
					animState.currentAnimation = input.boost ? 'run' : 'walk';
				} else {
					animState.currentAnimation = 'idle';
				}

			} else {
				// Flying mode - full 3D movement
				gravity.enabled = false;
				animState.isGrounded = false;

				// Get current rotation as quaternion for direction calculation
				const quaternion = new THREE.Quaternion().setFromEuler(transform.rotation);
				_forward.set(0, 0, -1).applyQuaternion(quaternion);
				_right.set(1, 0, 0).applyQuaternion(quaternion);
				const _up = new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion);

				// Calculate movement direction
				_moveDirection.set(0, 0, 0);

				if (input.forward > 0) {
					_moveDirection.add(_forward);
				}
				if (input.brake) {
					_moveDirection.sub(_forward);
				}
				if (input.strafe !== 0) {
					_moveDirection.addScaledVector(_right, input.strafe);
				}

				// Normalize if moving
				if (_moveDirection.lengthSq() > 0) {
					_moveDirection.normalize();
				}

				// Determine speed
				const targetSpeed = input.boost ? FLY_BOOST_SPEED : FLY_SPEED;
				const currentSpeed = _moveDirection.length() > 0 ? targetSpeed : 0;

				// Apply movement
				movement.velocity.copy(_moveDirection).multiplyScalar(currentSpeed);

				// Apply rotation from mouse
				if (input.mouseDelta.x !== 0 || input.mouseDelta.y !== 0) {
					transform.rotation.y -= input.mouseDelta.x * 0.002;
					transform.rotation.x -= input.mouseDelta.y * 0.002;
					// Clamp pitch
					transform.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, transform.rotation.x));
				}

				// Apply roll
				if (input.roll !== 0) {
					transform.rotation.z += input.roll * 2 * delta;
				}

				// Update animation state
				const speed = movement.velocity.length();
				animState.targetMovementSpeed = speed / FLY_BOOST_SPEED;

				if (speed > 0.1) {
					animState.currentAnimation = 'fly';
				} else {
					animState.currentAnimation = 'flyIdle';
				}
			}

			// Apply velocity to position
			transform.position.addScaledVector(movement.velocity, delta);
		}
	);
}

/**
 * Toggle movement mode between walking and flying
 */
export function toggleMovementMode(world: World) {
	world.query(IsPlayer, AnimationState, Gravity).updateEach(([animState, gravity]) => {
		if (animState.movementMode === 'walk') {
			animState.movementMode = 'fly';
			gravity.enabled = false;
			animState.isGrounded = false;
		} else {
			animState.movementMode = 'walk';
			gravity.enabled = true;
		}
	});
}
