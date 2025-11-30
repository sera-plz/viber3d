import { Canvas } from '@react-three/fiber';
import { Sky, Grid } from '@react-three/drei';
import { CameraRenderer } from './components/camera-renderer';
import { VRMAvatarRenderer } from './components/vrm-avatar-renderer';
import { GameLoop } from './frameloop';
import { Startup } from './startup';
import { GameUI } from './components/game-ui';

export function App() {
	return (
		<>
			<Canvas
				shadows
				camera={{ fov: 60, near: 0.1, far: 1000 }}
				gl={{ antialias: true }}
			>
				{/* Sky and atmosphere */}
				<Sky
					distance={450000}
					sunPosition={[100, 20, 100]}
					inclination={0.5}
					azimuth={0.25}
				/>

				{/* Game systems */}
				<Startup initialCameraPosition={[0, 5, 10]} />
				<GameLoop />

				{/* Camera and player */}
				<CameraRenderer />
				<VRMAvatarRenderer />

				{/* Ground plane */}
				<Ground />

				{/* Lighting */}
				<ambientLight intensity={0.5} />
				<directionalLight
					position={[50, 50, 25]}
					intensity={1.5}
					castShadow
					shadow-mapSize={[2048, 2048]}
					shadow-camera-far={100}
					shadow-camera-left={-50}
					shadow-camera-right={50}
					shadow-camera-top={50}
					shadow-camera-bottom={-50}
				/>
				<hemisphereLight
					color="#87CEEB"
					groundColor="#362907"
					intensity={0.3}
				/>
			</Canvas>

			{/* UI Overlay */}
			<GameUI />
		</>
	);
}

/**
 * Ground component with grid visualization
 */
function Ground() {
	return (
		<>
			{/* Infinite grid for visual reference */}
			<Grid
				position={[0, 0, 0]}
				args={[100, 100]}
				cellSize={1}
				cellThickness={0.5}
				cellColor="#6e6e6e"
				sectionSize={10}
				sectionThickness={1}
				sectionColor="#9d4b4b"
				fadeDistance={100}
				fadeStrength={1}
				followCamera={false}
				infiniteGrid
			/>

			{/* Solid ground plane for visual grounding */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
				<planeGeometry args={[1000, 1000]} />
				<meshStandardMaterial
					color="#3a5a3a"
					roughness={0.8}
					metalness={0.1}
				/>
			</mesh>
		</>
	);
}
