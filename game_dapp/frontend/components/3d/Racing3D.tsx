import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useRef, useCallback } from "react";

const Racing3D = () => {
		const [address, setAddress] = useState<string | null>(null);
		const [started, setStarted] = useState(false);
		const [playerX, setPlayerX] = useState(0);
		const [obstacles, setObstacles] = useState([{ x: 0, z: 5 }]);
		const [gameOver, setGameOver] = useState(false);
		const canvasRef = useRef<any>(null);

		useEffect(() => {
			const stored = sessionStorage.getItem("petra_wallet_address");
			if (stored) setAddress(stored);
		}, []);

		// Handle keyboard controls
		useEffect(() => {
			if (!started || gameOver) return;
			const handleKeyDown = (e: KeyboardEvent) => {
				if (e.key === "ArrowLeft") setPlayerX((x) => Math.max(x - 0.5, -2));
				if (e.key === "ArrowRight") setPlayerX((x) => Math.min(x + 0.5, 2));
			};
			window.addEventListener("keydown", handleKeyDown);
			return () => window.removeEventListener("keydown", handleKeyDown);
		}, [started, gameOver]);

		// Game loop for obstacles
		useEffect(() => {
			if (!started || gameOver) return;
			const interval = setInterval(() => {
				setObstacles((obs) => {
					const newObs = obs.map((o) => ({ ...o, z: o.z - 0.2 }));
					// Add new obstacle
					if (newObs.length < 5 && Math.random() > 0.7) {
						newObs.push({ x: Math.round((Math.random() - 0.5) * 4), z: 5 });
					}
					// Remove passed obstacles
					return newObs.filter((o) => o.z > -1);
				});
			}, 50);
			return () => clearInterval(interval);
		}, [started, gameOver]);

		// Collision detection
		useEffect(() => {
			if (!started || gameOver) return;
			obstacles.forEach((o) => {
				if (Math.abs(o.z) < 0.5 && Math.abs(o.x - playerX) < 0.6) {
					setGameOver(true);
				}
			});
		}, [obstacles, playerX, started, gameOver]);

		const handleRestart = useCallback(() => {
			setStarted(false);
			setPlayerX(0);
			setObstacles([{ x: 0, z: 5 }]);
			setGameOver(false);
		}, []);

		return (
			<div className="w-full h-full flex flex-col items-center justify-center bg-black text-white p-8">
				<h2 className="text-2xl font-bold mb-4">3D Racing</h2>
				{address && <div className="mb-2 text-xs text-gray-300">Wallet: {address.slice(0,6)}...{address.slice(-4)}</div>}
				<div className="w-full max-w-md h-64 bg-gray-900 rounded mb-4 flex items-center justify-center">
					<Canvas camera={{ position: [0, 2, 7] }} ref={canvasRef}>
						<ambientLight />
						<pointLight position={[10, 10, 10]} />
						{/* Player */}
						<mesh position={[playerX, 0, 0]}>
							<boxGeometry args={[0.7, 0.5, 1]} />
							<meshStandardMaterial color="orange" />
						</mesh>
						{/* Obstacles */}
						{obstacles.map((o, i) => (
							<mesh key={i} position={[o.x, 0, o.z]}>
								<boxGeometry args={[0.6, 0.6, 0.6]} />
								<meshStandardMaterial color="red" />
							</mesh>
						))}
					</Canvas>
				</div>
				<div className="bg-gray-900/60 rounded p-4 mt-4 w-full max-w-md flex flex-col items-center">
					{!started ? (
						<button className="bg-orange-400 text-black px-4 py-2 rounded font-bold" onClick={() => setStarted(true)}>
							Play
						</button>
					) : gameOver ? (
						<>
							<div className="font-semibold mb-2 text-red-400">Game Over! You hit an obstacle.</div>
							<button className="bg-orange-400 text-black px-4 py-2 rounded font-bold" onClick={handleRestart}>
								Restart
							</button>
						</>
					) : (
						<div className="font-semibold mb-2">Use Left/Right arrows to move. Avoid obstacles!</div>
					)}
				</div>
			</div>
		);
};
export default Racing3D;
