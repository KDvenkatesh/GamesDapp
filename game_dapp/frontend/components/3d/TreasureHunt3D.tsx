import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";

const TreasureHunt3D = () => {
	const [address, setAddress] = useState<string | null>(null);
	useEffect(() => {
		const stored = sessionStorage.getItem("petra_wallet_address");
		if (stored) setAddress(stored);
	}, []);
		const [started, setStarted] = useState(false);
		return (
			<div className="w-full h-full flex flex-col items-center justify-center bg-black text-white p-8">
				<h2 className="text-2xl font-bold mb-4">Treasure Hunt 3D</h2>
				{address && <div className="mb-2 text-xs text-gray-300">Wallet: {address.slice(0,6)}...{address.slice(-4)}</div>}
				<div className="w-full max-w-md h-64 bg-gray-900 rounded mb-4 flex items-center justify-center">
					<Canvas camera={{ position: [2, 2, 2] }}>
						<ambientLight />
						<pointLight position={[10, 10, 10]} />
						<mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
							<boxGeometry args={[1, 1, 1]} />
							<meshStandardMaterial color="gold" />
						</mesh>
					</Canvas>
				</div>
				<div className="bg-gray-900/60 rounded p-4 mt-4 w-full max-w-md flex flex-col items-center">
					{!started ? (
						<button className="bg-yellow-500 text-black px-4 py-2 rounded font-bold" onClick={() => setStarted(true)}>
							Play
						</button>
					) : (
						<div className="font-semibold mb-2">Game Started! Find the treasure!</div>
					)}
				</div>
			</div>
		);
};
export default TreasureHunt3D;
