import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

type GameCard = {
  title: string;
  description: string;
  path: string;
  icon: string;
};

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
  }
];

export default function GameSelection() {
  const [address, setAddress] = useState(() => localStorage.getItem("petra_wallet_address"));

  const handleDisconnect = async () => {
    if ((window as any).aptos && (window as any).aptos.disconnect) {
      try {
        await (window as any).aptos.disconnect();
      } catch {}
    }
    setAddress(null);
    localStorage.removeItem("petra_wallet_address");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 flex items-center justify-center relative overflow-hidden">
      {/* Animated background glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="pointer-events-none absolute -inset-20 z-0 rounded-[3rem] bg-gradient-to-tr from-blue-500/20 via-fuchsia-400/10 to-cyan-400/20 blur-3xl"
      />
      <div className="max-w-6xl w-full mx-auto relative z-10">
        {/* Animated Disconnect button top right */}
        <AnimatePresence>
          {address && (
            <motion.button
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              onClick={handleDisconnect}
              className="absolute right-0 top-0 mt-4 mr-2 px-4 py-2 bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-lg font-semibold shadow-lg transition-colors z-10"
              whileHover={{ scale: 1.07, rotate: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              Disconnect Wallet
            </motion.button>
          )}
        </AnimatePresence>
        {/* Animated header */}
        <motion.h1
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, type: "spring", stiffness: 80 }}
          className="text-4xl md:text-5xl font-extrabold text-white mb-10 text-center drop-shadow-lg tracking-tight"
        >
          <span className="bg-gradient-to-r from-blue-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">Choose Your Game</span>
        </motion.h1>
        {/* Animated game cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {games.map((game, i) => (
            <motion.div
              key={game.path}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.12, type: "spring", stiffness: 90 }}
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
              {/* Glow effect on hover */}
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
