import React, { useMemo, useState } from "react";
import { useState as useLocalState } from "react";
import { sendAptosReward } from "../utils/sendAptosReward";

type GameStatus = "playing" | "won" | "lost";

const TOTAL_BOXES = 25;
const GRID_COLS = 5;

export default function MysteryBoxGame25() {
  const [playerAddress] = useLocalState(() => localStorage.getItem("petra_wallet_address"));
  // Changing this key re-seeds the board (so useMemo below recomputes)
  const [seed, setSeed] = useState(0);

  // Track which cells are revealed
  const [revealed, setRevealed] = useState<boolean[]>(
    () => Array(TOTAL_BOXES).fill(false)
  );

  const [status, setStatus] = useState<GameStatus>("playing");

  // Random bomb index per game, recomputed when `seed` changes
  const bombIndex = useMemo(() => {
    return Math.floor(Math.random() * TOTAL_BOXES);
  }, [seed]);

  const safeRevealed = revealed.reduce(
    (acc, v, i) => acc + (v && i !== bombIndex ? 1 : 0),
    0
  );
  const remainingSafe = 24 - safeRevealed;

  async function handleOpen(i: number) {
    if (status !== "playing") return;
    if (revealed[i]) return;

    const next = revealed.slice();
    next[i] = true;
    setRevealed(next);

    if (i === bombIndex) {
      setStatus("lost");
      return;
    }

    // Check win condition: all safe boxes opened
    if (safeRevealed + 1 === 24) {
      setStatus("won");
      // --- Send APT reward ---
      try {
        const account = await (window as any).aptos.account();
        if (account?.address) {
          await sendAptosReward(account.address);
          alert("Congratulations! 0.001 APT reward sent to your wallet.");
        }
      } catch (e: any) {
        alert("Reward payout failed: " + (e?.message || e));
      }
    }
  }

  function reset() {
    setSeed((s) => s + 1);
    setRevealed(Array(TOTAL_BOXES).fill(false));
    setStatus("playing");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 relative">
      {/* Player profile badge */}
      {playerAddress && (
        <div className="absolute top-4 right-4 z-20 bg-white/10 border border-yellow-400/40 px-4 py-2 rounded-xl text-xs text-yellow-200 font-mono flex items-center gap-2 shadow-lg">
          <span className="font-bold text-yellow-300">Player:</span>
          <span className="truncate max-w-[120px]">{playerAddress}</span>
        </div>
      )}
      <div className="w-full max-w-xl mx-auto rounded-2xl border border-yellow-400/60 bg-yellow-50/5 p-6 flex flex-col items-center gap-5 shadow-lg">
        <h3 className="text-xl font-extrabold text-yellow-300 tracking-wide">
          Mystery Box — 25
        </h3>

        {/* Status / Progress */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3">
          <div
            className={`text-sm px-3 py-1 rounded-xl border ${
              status === "playing"
                ? "border-yellow-400/40 text-yellow-300"
                : status === "won"
                ? "border-emerald-400/50 text-emerald-300"
                : "border-rose-400/50 text-rose-300"
            }`}
          >
            {status === "playing" && "Find all safe boxes!"}
            {status === "won" && "You opened all 24 safe boxes — You Win!"}
            {status === "lost" && "Boom! You hit the bomb — You Lose."}
          </div>

          <div className="text-xs text-yellow-200/80">
            Safe remaining:{" "}
            <span className="font-semibold">{Math.max(0, remainingSafe)}</span>
          </div>
        </div>

        {/* Grid */}
        <div
          className="grid gap-2 w-full"
          style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: TOTAL_BOXES }, (_, i) => {
            const isRevealed = revealed[i];
            const isBomb = i === bombIndex;

            // Reveal bomb icon if:
            // - player clicked it (lost), or
            // - game is won (show where it was)
            const showBomb =
              (status === "lost" && isRevealed && isBomb) ||
              (status === "won" && isBomb);

            const disabled = status !== "playing" || isRevealed;

            return (
              <button
                key={i}
                onClick={() => handleOpen(i)}
                disabled={disabled}
                className={[
                  "relative aspect-square rounded-xl border transition transform",
                  "select-none flex items-center justify-center text-xl font-bold",
                  "focus:outline-none focus:ring-2 focus:ring-yellow-400/60",
                  disabled ? "cursor-not-allowed" : "hover:-translate-y-0.5",
                  isRevealed
                    ? showBomb
                      ? "bg-rose-600/20 border-rose-400/60"
                      : "bg-emerald-500/20 border-emerald-300/60"
                    : "bg-yellow-50/10 border-yellow-400/30 hover:bg-yellow-50/20",
                ].join(" ")}
                aria-label={
                  isRevealed
                    ? showBomb
                      ? "Bomb"
                      : "Safe"
                    : "Hidden box"
                }
              >
                {/* Content */}
                {!isRevealed && <span className="opacity-70">?</span>}

                {isRevealed && !showBomb && (
                  <span className="text-emerald-300 drop-shadow">+1</span>
                )}

                {showBomb && (
                  <span className="text-rose-300 text-2xl" role="img" aria-label="bomb">
                    💣
                  </span>
                )}

                {/* Subtle glow on reveal */}
                {isRevealed && (
                  <span
                    className={[
                      "absolute inset-0 rounded-xl pointer-events-none",
                      showBomb
                        ? "ring-2 ring-rose-400/60"
                        : "ring-2 ring-emerald-300/60",
                    ].join(" ")}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-xl bg-yellow-400 text-slate-900 font-semibold hover:bg-yellow-300 transition"
          >
            Reset
          </button>
          <span className="text-[11px] text-yellow-200/80">
            Tip: Clear all safe boxes. One 💣 ends the round!
          </span>
        </div>
      </div>
    </div>
  );
}
