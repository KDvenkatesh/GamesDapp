// AppRoutes.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import PetraSimpleConnect from "./components/PetraSimpleConnect";
import GameSelection from "./components/GameSelection"; // your existing hub
import DiceGame from "./components/DiceGame";
import MysteryBoxGame from "./components/MysteryBoxGame";
import RPSGame from "./components/RPSGame";
import SnakeGame from "./components/SnakeGame";
import ProtectedLayout from "./components/ProtectedLayout";

export default function AppRoutes(): JSX.Element {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<PetraSimpleConnect />} />

          <Route element={<ProtectedLayout />}>
            <Route path="/games" element={<GameSelection />} />
            <Route path="/dice-game" element={<DiceGame />} />
            <Route path="/mystery-box" element={<MysteryBoxGame />} />
            <Route path="/rps-game" element={<RPSGame />} />
            <Route path="/snake-game" element={<SnakeGame />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="w-full py-4 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Games Dapp. All rights reserved.
      </footer>
    </div>
  );
}
