// frontend/AppRoutes.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Core Components
import PetraSimpleConnect from "./components/PetraSimpleConnect";
import ProtectedLayout from "./components/ProtectedLayout";
import GameSelection from "./components/GameSelection";

// Game Components
import DiceGame from "./components/DiceGame";
import MysteryBoxGame from "./components/MysteryBoxGame";
import RPSGame from "./components/RPSGame";
import SnakeGame from "./components/SnakeGame";
import TicTacToeGame from "./components/ui/TicTacToeGame";
import HangmanGame from "./components/ui/HangmanGame";
import MemoryMatchGame from "./components/ui/MemoryMatchGame";
import FlappyCloneGame from "./components/ui/FlappyCloneGame";
// 3D Game Components
import TreasureHunt3D from "./components/3d/TreasureHunt3D";
import TimeRiftBikeRacer from "./components/3d/TimeRiftBikeRacer";
import Racing3D from "./components/3d/Racing3D";
import BattleRoyaleSurvival from "./components/3d/BattleRoyaleSurvival";

export default function AppRoutes(): JSX.Element {
  return (
    // IMPORTANT: The background classes have been removed from this div
    <div className="min-h-screen flex flex-col text-slate-100 relative">
      
      {/* Background Video Element */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="background-video"
        src="/background.mp4" // This path points to your file in the /public folder
      />
      
      {/* Main Content (with z-10 to appear on top of the video) */}
      <main className="flex-grow z-10">
        <Routes>
          <Route path="/" element={<PetraSimpleConnect />} />

          <Route element={<ProtectedLayout />}>
            <Route path="/games" element={<GameSelection />} />
            <Route path="/dice-game" element={<DiceGame />} />
            <Route path="/mystery-box" element={<MysteryBoxGame />} />
            <Route path="/rps-game" element={<RPSGame />} />
            <Route path="/snake-game" element={<SnakeGame />} />
            <Route path="/tic-tac-toe" element={<TicTacToeGame />} />
            <Route path="/hangman" element={<HangmanGame />} />
            <Route path="/memory-match" element={<MemoryMatchGame />} />
            <Route path="/flappy-clone" element={<FlappyCloneGame />} />
            {/* New 3D Game Routes */}
            <Route path="/treasure-hunt-3d" element={<TreasureHunt3D />} />
            <Route path="/time-rift-bike-racer" element={<TimeRiftBikeRacer />} />
            <Route path="/racing-3d" element={<Racing3D />} />
            <Route path="/battle-royale-survival" element={<BattleRoyaleSurvival />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="w-full py-4 text-center text-xs text-slate-400 z-10">
        &copy; {new Date().getFullYear()} Games Dapp. All rights reserved.
      </footer>
    </div>
  );
}