import { useEffect, useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Entity } from 'koota';
import { useQueryFirst } from 'koota/react';
import * as THREE from 'three';
import { VRM } from '@pixiv/three-vrm';
import { IsPlayer, Transform, Ref, VRMAvatar } from '../traits';
import { loadVRM, DEFAULT_VRM_URL } from '../utils/vrm-loader';

interface VRMAvatarViewProps {
	entity: Entity;
	vrmUrl?: string;
}

export function VRMAvatarView({ entity, vrmUrl = DEFAULT_VRM_URL }: VRMAvatarViewProps) {
	const groupRef = useRef<THREE.Group>(null);
	const [vrm, setVrm] = useState<VRM | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Load VRM model
	useEffect(() => {
		let mounted = true;

		async function load() {
			try {
				setLoading(true);
				setError(null);
				const loadedVrm = await loadVRM(vrmUrl);

				if (mounted) {
					setVrm(loadedVrm);

					// Update the VRMAvatar trait
					if (entity.has(VRMAvatar)) {
						entity.set(VRMAvatar, {
							vrm: loadedVrm,
							url: vrmUrl,
							loaded: true,
						});
					}

					setLoading(false);
				}
			} catch (err) {
				if (mounted) {
					setError(err instanceof Error ? err.message : 'Failed to load VRM');
					setLoading(false);
				}
			}
		}

		load();

		return () => {
			mounted = false;
		};
	}, [vrmUrl, entity]);

	// Setup the ref on the entity
	const setupRef = useCallback(
		(group: THREE.Group | null) => {
			if (!group) return;
			(groupRef as React.MutableRefObject<THREE.Group | null>).current = group;

			// Add Ref trait if we have a VRM
			if (vrm) {
				entity.add(Ref(group));
			}
		},
		[entity, vrm]
	);

	// Update ref when VRM loads
	useEffect(() => {
		if (groupRef.current && vrm) {
			entity.add(Ref(groupRef.current));
		}
	}, [vrm, entity]);

	if (loading) {
		// Render a placeholder while loading
		return (
			<group ref={groupRef}>
				<mesh>
					<capsuleGeometry args={[0.3, 1, 8, 16]} />
					<meshStandardMaterial color="#666" wireframe />
				</mesh>
			</group>
		);
	}

	if (error) {
		// Render error placeholder
		return (
			<group ref={groupRef}>
				<mesh>
					<boxGeometry args={[0.5, 1.5, 0.5]} />
					<meshStandardMaterial color="#ff0000" />
				</mesh>
			</group>
		);
	}

	if (!vrm) return null;

	return (
		<group ref={setupRef}>
			<primitive object={vrm.scene} />
		</group>
	);
}

/**
 * Query for player entities and render VRM avatars
 */
export function VRMAvatarRenderer({ vrmUrl }: { vrmUrl?: string }) {
	const player = useQueryFirst(IsPlayer, Transform, VRMAvatar);

	if (!player) return null;

	return <VRMAvatarView entity={player} vrmUrl={vrmUrl} />;
}
