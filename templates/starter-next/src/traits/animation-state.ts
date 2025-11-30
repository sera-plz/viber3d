import { trait } from 'koota';

/**
 * Movement mode for the avatar
 */
export type MovementMode = 'walk' | 'fly';

/**
 * Animation state names
 */
export type AnimationName = 'idle' | 'walk' | 'run' | 'fly' | 'flyIdle' | 'jump' | 'fall';

/**
 * AnimationState trait - manages procedural animation state
 */
export const AnimationState = trait({
	// Current animation being played
	currentAnimation: 'idle' as AnimationName,
	// Previous animation for blending
	previousAnimation: 'idle' as AnimationName,
	// Blend factor between previous and current (0-1)
	blendFactor: 1,
	// Animation time accumulator
	animationTime: 0,
	// Movement mode (walk or fly)
	movementMode: 'walk' as MovementMode,
	// Is the avatar grounded?
	isGrounded: true,
	// Vertical velocity for jumping/falling
	verticalVelocity: 0,
	// Speed for animation blending (0 = idle, 1 = full speed)
	movementSpeed: 0,
	// Target movement speed (for smooth transitions)
	targetMovementSpeed: 0,
	// Jump requested
	jumpRequested: false,
	// Current rotation velocity for smooth turning
	rotationVelocity: 0,
});
