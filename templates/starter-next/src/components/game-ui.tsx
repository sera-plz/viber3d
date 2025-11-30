import { useEffect, useState } from 'react';
import { useWorld } from 'koota/react';
import { IsPlayer, AnimationState } from '../traits';

export function GameUI() {
	const world = useWorld();
	const [mode, setMode] = useState<'walk' | 'fly'>('walk');
	const [isGrounded, setIsGrounded] = useState(true);

	useEffect(() => {
		const interval = setInterval(() => {
			const player = world.queryFirst(IsPlayer, AnimationState);
			if (player) {
				const animState = player.get(AnimationState);
				if (animState) {
					setMode(animState.movementMode);
					setIsGrounded(animState.isGrounded);
				}
			}
		}, 100);

		return () => clearInterval(interval);
	}, [world]);

	return (
		<div className="fixed inset-0 pointer-events-none">
			{/* Controls help */}
			<div className="absolute bottom-4 left-4 bg-black/50 text-white p-4 rounded-lg text-sm font-mono">
				<h3 className="font-bold mb-2 text-lg">Controls</h3>
				<div className="space-y-1">
					<p><span className="text-yellow-400">W/A/S/D</span> - Move</p>
					<p><span className="text-yellow-400">Mouse</span> - Look around</p>
					<p><span className="text-yellow-400">Shift</span> - Run / Boost</p>
					<p><span className="text-yellow-400">Space</span> - Jump (walk mode)</p>
					<p><span className="text-yellow-400">F</span> - Toggle Fly/Walk</p>
					<p><span className="text-yellow-400">Q/E</span> - Roll (fly mode)</p>
				</div>
			</div>

			{/* Mode indicator */}
			<div className="absolute top-4 left-4 bg-black/50 text-white p-3 rounded-lg">
				<div className="flex items-center gap-2">
					<div
						className={`w-3 h-3 rounded-full ${
							mode === 'fly' ? 'bg-cyan-400' : 'bg-green-400'
						}`}
					/>
					<span className="font-bold uppercase">
						{mode === 'fly' ? 'Flying' : 'Walking'}
					</span>
				</div>
				{mode === 'walk' && (
					<div className="text-xs mt-1 text-gray-300">
						{isGrounded ? 'Grounded' : 'In Air'}
					</div>
				)}
			</div>

			{/* Crosshair */}
			<div className="absolute inset-0 flex items-center justify-center">
				<div className="w-2 h-2 border-2 border-white/50 rounded-full" />
			</div>

			{/* Click to start message */}
			<ClickToStart />
		</div>
	);
}

function ClickToStart() {
	const [visible, setVisible] = useState(true);

	useEffect(() => {
		const handleClick = () => setVisible(false);
		const handleKeyDown = () => setVisible(false);

		window.addEventListener('click', handleClick);
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('click', handleClick);
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, []);

	if (!visible) return null;

	return (
		<div className="absolute inset-0 flex items-center justify-center bg-black/30">
			<div className="bg-black/70 text-white p-6 rounded-xl text-center">
				<h2 className="text-2xl font-bold mb-2">VRM Avatar Demo</h2>
				<p className="text-lg">Click to start</p>
				<p className="text-sm text-gray-400 mt-2">
					Use WASD to move, mouse to look around
				</p>
			</div>
		</div>
	);
}
