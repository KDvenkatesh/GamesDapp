// frontend/components/ui/GameSelection.tsx

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

type GameCard = {
  title: string;
  description: string;
  path: string;
  icon: string;
};

// Add the 4 new games to this array
const games: GameCard[] = [
  {
    title: "Dice Game",
    description: "Roll the dice and test your luck!",
    path: "/dice-game",
    icon: "🎲"
  },
  {
    title: "Mystery Box",
    description: "Open boxes for surprise rewards!",
    path: "/mystery-box",
    icon: "🎁"
  },
  {
    title: "Rock Paper Scissors",
    description: "Challenge the computer in this classic game!",
    path: "/rps-game",
    icon: "✌️"
  },
  {
    title: "Snake Game",
    description: "Classic snake game with a crypto twist!",
    path: "/snake-game",
    icon: "🐍"
  },
  // --- 🆕 Add these new game cards ---
  {
    title: "Tic-Tac-Toe",
    description: "A classic grid game against a simple AI.",
    path: "/tic-tac-toe",
    icon: "⭕"
  },
  {
    title: "Hangman",
    description: "Guess the secret crypto-themed word.",
    path: "/hangman",
    icon: "🤔"
  },
  {
    title: "Memory Match",
    description: "Find all the matching pairs of cards.",
    path: "/memory-match",
    icon: "🧠"
  },
  {
    title: "Flappy Clone",
    description: "Navigate the bird through the pipes.",
    path: "/flappy-clone",
    icon: "🐦"
  },
  // --- End of new games ---
  {
    title: "Treasure Hunt 3D",
    description: "Explore a 3D map and collect treasure chests!",
    path: "/treasure-hunt-3d",
    icon: "🗺️"
  },
  {
    title: "3D Racing",
    description: "Race NFT cars or hovercrafts in 3D!",
    path: "/racing-3d",
    icon: "🏎️"
  },
  {
    title: "Time Rift Bike Racer",
    description: "Race through time rifts on futuristic bikes!",
    path: "/time-rift-bike-racer",
    icon: "🚴⏳"
  },
  {
    title: "Battle Royale Survival",
    description: "Survive in a 3D battle royale arena!",
    path: "/battle-royale-survival",
    icon: "🔫"
  }
];


export default function GameSelection() {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("petra_wallet_address");
    if (stored) setAddress(stored);
  }, []);

  const handleDisconnect = async () => {
    if ((window as any).aptos && (window as any).aptos.disconnect) {
      try {
        await (window as any).aptos.disconnect();
      } catch {}
    }
    setAddress(null);
    sessionStorage.removeItem("petra_wallet_address");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 flex items-center justify-center relative overflow-hidden">
      {/* ... rest of the component JSX is unchanged ... */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="pointer-events-none absolute -inset-20 z-0 rounded-[3rem] bg-gradient-to-tr from-blue-500/20 via-fuchsia-400/10 to-cyan-400/20 blur-3xl"
      />
      <div className="max-w-6xl w-full mx-auto relative z-10">
        <div className="absolute right-0 top-0 mt-4 mr-2 flex items-center gap-3 z-10">
          {address && (
            <>
              <span className="bg-white/10 text-white px-3 py-1 rounded-full border border-white/20 text-xs font-mono shadow">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
              <motion.button
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                onClick={handleDisconnect}
                className="px-4 py-2 bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-lg font-semibold shadow-lg transition-colors"
                whileHover={{ scale: 1.07, rotate: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                Disconnect Wallet
              </motion.button>
            </>
          )}
        </div>
        <motion.h1
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, type: "spring", stiffness: 80 }}
          className="text-4xl md:text-5xl font-extrabold text-white mb-10 text-center drop-shadow-lg tracking-tight"
        >
          <span className="bg-gradient-to-r from-blue-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">Choose Your Game</span>
        </motion.h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {games.map((game, i) => (
            <motion.div
              key={game.path}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.08, type: "spring", stiffness: 90 }}
              whileHover={{ scale: 1.06, boxShadow: "0 8px 32px 0 rgba(0,0,0,0.18)", rotate: 1 }}
              whileTap={{ scale: 0.98 }}
              className="relative group"
            >
              <Link
                to={game.path}
                className="block p-8 rounded-3xl bg-white/10 border border-white/10 group-hover:border-blue-400/50 transition-all shadow-xl backdrop-blur-xl overflow-hidden"
              >
                <motion.div
                  className="text-5xl mb-6 flex items-center justify-center drop-shadow-lg"
                  whileHover={{ rotate: 8 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  {game.icon}
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2 text-center drop-shadow-sm">{game.title}</h2>
                <p className="text-slate-300 text-base text-center">{game.description}</p>
              </Link>
              <motion.div
                className="absolute inset-0 rounded-3xl pointer-events-none group-hover:bg-blue-400/10 group-hover:blur-md transition"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}