import { World } from 'koota';
import { Input, IsPlayer, AnimationState } from '../traits';
import { toggleMovementMode } from './player-movement';

// Input state
const state = {
	forward: 0,
	strafe: 0,
	brake: false,
	boost: false,
	roll: 0,
	mouseDeltaX: 0,
	mouseDeltaY: 0,
	pointerLocked: false,
	jumpPressed: false,
	toggleFlyPressed: false,
};

// Key mappings
const KEY_FORWARD = ['w', 'arrowup'];
const KEY_BACKWARD = ['s', 'arrowdown'];
const KEY_LEFT = ['a', 'arrowleft'];
const KEY_RIGHT = ['d', 'arrowright'];
const KEY_JUMP = [' '];
const KEY_RUN = ['shift'];
const KEY_ROLL_LEFT = ['q'];
const KEY_ROLL_RIGHT = ['e'];
const KEY_TOGGLE_FLY = ['f'];

// Pointer lock functions
const requestPointerLock = () => {
	const canvas = document.querySelector('canvas');
	if (canvas && !state.pointerLocked) {
		canvas.requestPointerLock();
	}
};

const handlePointerLockChange = () => {
	state.pointerLocked = document.pointerLockElement === document.querySelector('canvas');
};

// Initialize event listeners
let initialized = false;

function initializeInputListeners(world: World) {
	if (initialized) return;
	initialized = true;

	document.addEventListener('pointerlockchange', handlePointerLockChange);

	window.addEventListener('keydown', (e) => {
		const key = e.key.toLowerCase();

		if (KEY_FORWARD.includes(key)) state.forward = 1;
		if (KEY_BACKWARD.includes(key)) state.brake = true;
		if (KEY_LEFT.includes(key)) state.strafe = -1;
		if (KEY_RIGHT.includes(key)) state.strafe = 1;
		if (KEY_JUMP.includes(key)) state.jumpPressed = true;
		if (KEY_RUN.includes(key)) state.boost = true;
		if (KEY_ROLL_LEFT.includes(key)) state.roll = -1;
		if (KEY_ROLL_RIGHT.includes(key)) state.roll = 1;

		// Toggle fly mode on F press (not hold)
		if (KEY_TOGGLE_FLY.includes(key) && !state.toggleFlyPressed) {
			state.toggleFlyPressed = true;
			toggleMovementMode(world);
		}

		requestPointerLock();
	});

	window.addEventListener('keyup', (e) => {
		const key = e.key.toLowerCase();

		if (KEY_FORWARD.includes(key)) state.forward = 0;
		if (KEY_BACKWARD.includes(key)) state.brake = false;
		if (KEY_LEFT.includes(key)) state.strafe = 0;
		if (KEY_RIGHT.includes(key)) state.strafe = 0;
		if (KEY_JUMP.includes(key)) state.jumpPressed = false;
		if (KEY_RUN.includes(key)) state.boost = false;
		if (KEY_ROLL_LEFT.includes(key) && state.roll === -1) state.roll = 0;
		if (KEY_ROLL_RIGHT.includes(key) && state.roll === 1) state.roll = 0;
		if (KEY_TOGGLE_FLY.includes(key)) state.toggleFlyPressed = false;
	});

	window.addEventListener('mousemove', (e) => {
		if (state.pointerLocked) {
			state.mouseDeltaX += e.movementX;
			state.mouseDeltaY += e.movementY;
		}
	});

	window.addEventListener('click', requestPointerLock);
}

/**
 * Poll input and update player input traits
 */
export function pollInputAvatar(world: World) {
	// Initialize listeners if needed
	initializeInputListeners(world);

	world.query(IsPlayer, Input, AnimationState).updateEach(([input, animState]) => {
		// Transfer input state
		input.forward = state.forward;
		input.strafe = state.strafe;
		input.boost = state.boost;
		input.brake = state.brake;
		input.roll = state.roll;
		input.mouseDelta.set(state.mouseDeltaX, state.mouseDeltaY);

		// Handle jump request
		if (state.jumpPressed && animState.isGrounded && animState.movementMode === 'walk') {
			animState.jumpRequested = true;
		}
	});

	// Reset mouse delta after use
	state.mouseDeltaX = 0;
	state.mouseDeltaY = 0;
}
