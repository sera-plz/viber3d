import { useFrame } from '@react-three/fiber';
import { useWorld } from 'koota/react';
import { syncView } from './systems/sync-view';
import { updateTime } from './systems/update-time';
import { pollInputAvatar } from './systems/poll-input-avatar';
import { playerMovement } from './systems/player-movement';
import { animateVRM } from './systems/animate-vrm';
import { cameraFollowPlayer } from './systems/camera-follow-player';

export function GameLoop() {
	const world = useWorld();

	useFrame(() => {
		// Update time first
		updateTime(world);

		// Poll input
		pollInputAvatar(world);

		// Update player movement (handles walk/fly)
		playerMovement(world);

		// Animate VRM avatars based on movement state
		animateVRM(world);

		// Camera follows player
		cameraFollowPlayer(world);

		// Sync ECS transforms to Three.js objects
		syncView(world);
	});

	return null;
}
