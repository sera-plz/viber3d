import { useFrame } from '@react-three/fiber';
import { useActions, useWorld } from 'koota/react';
import { useEffect, useRef } from 'react';
import { Entity } from 'koota';
import { actions } from './actions';
import { updateSpatialHashing } from './systems/update-spatial-hashing';

export function Startup({
	initialCameraPosition = [0, 5, 10],
	initialPlayerPosition = [0, 0, 0],
}: {
	initialCameraPosition?: [number, number, number];
	initialPlayerPosition?: [number, number, number];
}) {
	const { spawnPlayer, spawnCamera } = useActions(actions);
	const world = useWorld();
	const playerRef = useRef<Entity | null>(null);
	const cameraRef = useRef<Entity | null>(null);

	useEffect(() => {
		// Spawn camera behind and above player
		cameraRef.current = spawnCamera(initialCameraPosition);

		// Spawn player with VRM avatar at starting position
		playerRef.current = spawnPlayer(initialPlayerPosition);

		return () => {
			playerRef.current?.destroy();
			cameraRef.current?.destroy();
		};
	}, [spawnPlayer, spawnCamera, initialCameraPosition, initialPlayerPosition]);

	useFrame(() => {
		updateSpatialHashing(world);
	});

	return null;
}
