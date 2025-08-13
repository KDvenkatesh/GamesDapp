import React, { useEffect, useMemo, useRef, useState } from "react";
import { useState as useLocalState } from "react";
import { sendAptosReward } from "../utils/sendAptosReward";
import { motion, AnimatePresence } from "framer-motion";
import { Dice5, Zap, RefreshCw, Trophy, History, Volume2, VolumeX, Rocket, Shuffle, MousePointerClick } from "lucide-react";

/**
 * DiceRollGame.tsx — A playful, single-file dice game built with React + TypeScript.
 *
 * Features
 * - Beautiful glass UI with Tailwind
 * - Physics-ish roll animation with Framer Motion
 * - Guess 1–6 to win coins (risk/reward scales with odds)
 * - Auto-Roll, Quick Roll (space/enter), and fun streak bonuses
 * - Lightweight confetti burst (pure CSS), sound toggle, roll history
 *
 * Usage
 * - Drop this file anywhere in your React + TS project and mount <DiceRollGame />
 * - Tailwind recommended; works fine with plain CSS too
 */

// ---------- Helpers ----------
const faces = [1, 2, 3, 4, 5, 6] as const;
type Face = (typeof faces)[number];

function randFace(): Face {
    return (Math.floor(Math.random() * 6) + 1) as Face;
}

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

// Simple in-memory sound (base64 sine blip) so there are no assets required
const BLIP =
    "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYAAABkYXRhBAAA" +
    "AAAAAICA//8AAP//gICA////gICA////gICA"; // tiny placeholder blip

// ---------- Main Component ----------
export default function DiceRollGame() {
    const [playerAddress] = useLocalState(() => localStorage.getItem("petra_wallet_address"));
    const [current, setCurrent] = useState<Face>(3);
    const [rolling, setRolling] = useState(false);
    const [coins, setCoins] = useState(100);
    const [guess, setGuess] = useState<Face | null>(null);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [history, setHistory] = useState<Face[]>([]);
    const [autoRoll, setAutoRoll] = useState(false);
    const [muted, setMuted] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const confettiRef = useRef<HTMLDivElement | null>(null);

    // derived payout: guessing a single face is 5x (fair: 1/6 odds)
    const payout = useMemo(() => (guess ? 5 : 0), [guess]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                onRoll();
            }
            const n = Number(e.key);
            if (n >= 1 && n <= 6) setGuess(n as Face);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [guess, coins, rolling]);

    useEffect(() => {
        let timer: any;
        if (autoRoll && !rolling) {
            timer = setTimeout(() => onRoll(), 1000);
        }
        return () => clearTimeout(timer);
    }, [autoRoll, rolling, current]);

    async function onRoll() {
        if (rolling) return;
        setRolling(true);

        // fun pre-roll shuffle
        for (let i = 0; i < 12; i++) {
            setCurrent(randFace());
            // speed up then slow down
            await sleep(35 + i * 10);
        }

        const result = randFace();
        setCurrent(result);
        setHistory((h) => [result, ...h].slice(0, 10));

        // resolve win/lose
        if (guess) {
            if (result === guess) {
                const win = payout * 10; // base win amount; tweak for feel
                setCoins((c) => c + win);
                setStreak((s) => s + 1);
                setBestStreak((b) => Math.max(b, streak + 1));
                burstConfetti();
                playSound();
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
            } else {
                setCoins((c) => Math.max(0, c - 10));
                setStreak(0);
            }
        } else {
            // No guess? small participation tip
            setCoins((c) => Math.max(0, c - 2));
            setStreak(0);
        }

        setRolling(false);
    }

    function playSound() {
        if (muted) return;
        if (!audioRef.current) {
            const a = new Audio(BLIP);
            audioRef.current = a;
        }
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => { });
        }
    }

    function burstConfetti() {
        if (!confettiRef.current) return;
        confettiRef.current.classList.remove("opacity-0");
        confettiRef.current.classList.add("animate-confetti");
        setTimeout(() => {
            confettiRef.current?.classList.remove("animate-confetti");
            confettiRef.current?.classList.add("opacity-0");
        }, 900);
    }

    function reset() {
        setCoins(100);
        setStreak(0);
        setBestStreak(0);
        setHistory([]);
        setGuess(null);
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 flex items-center justify-center p-4 relative">
            {/* Player profile badge */}
            {playerAddress && (
                <div className="absolute top-4 right-4 z-20 bg-white/10 border border-blue-400/40 px-4 py-2 rounded-xl text-xs text-blue-200 font-mono flex items-center gap-2 shadow-lg">
                    <span className="font-bold text-blue-400">Player:</span>
                    <span className="truncate max-w-[120px]">{playerAddress}</span>
                </div>
            )}
            <div className="relative w-full max-w-3xl">
                {/* Confetti overlay */}
                <div
                    ref={confettiRef}
                    className="pointer-events-none absolute inset-0 opacity-0"
                    aria-hidden
                >
                    <div className="confetti-layer" />
                </div>

                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-6 md:p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-2xl bg-white/10 border border-white/10">
                                <Dice5 className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold tracking-tight">Dice Roll Deluxe</h1>
                                <p className="text-xs md:text-sm text-slate-300">Guess the face • Win coins • Chase streaks</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setMuted((m) => !m)}
                                className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/10 transition"
                                title={muted ? "Unmute" : "Mute"}
                            >
                                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}<span className="hidden md:inline">Sound</span>
                            </button>
                            <button
                                onClick={reset}
                                className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/10 transition"
                                title="Reset"
                            >
                                <RefreshCw className="w-4 h-4" /><span className="hidden md:inline">Reset</span>
                            </button>
                        </div>
                    </div>

                    {/* Scorebar */}
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Stat label="Coins" value={coins} icon={<Zap className="w-4 h-4" />} />
                        <Stat label="Payout" value={guess ? `x${payout}` : "—"} icon={<Rocket className="w-4 h-4" />} />
                        <Stat label="Streak" value={streak} icon={<Shuffle className="w-4 h-4" />} />
                        <Stat label="Best" value={bestStreak} icon={<Trophy className="w-4 h-4" />} />
                    </div>

                    {/* Board */}
                    <div className="mt-8 grid md:grid-cols-2 gap-6">
                        {/* Die + actions */}
                        <div className="flex flex-col items-center justify-center gap-6">
                            <motion.div
                                key={rolling ? "rolling" : `face-${current}`}
                                initial={{ rotateX: 0, rotateY: 0, scale: 0.95 }}
                                animate={{
                                    rotateX: rolling ? 720 : 0,
                                    rotateY: rolling ? 540 : 0,
                                    scale: 1,
                                }}
                                transition={{ duration: rolling ? 0.8 : 0.3, ease: "easeInOut" }}
                                className="aspect-square w-56 md:w-64 rounded-3xl bg-gradient-to-br from-white/90 to-white/70 text-slate-900 shadow-2xl border border-white/40 flex items-center justify-center"
                            >
                                <Die face={current} />
                            </motion.div>

                            <div className="flex flex-wrap items-center justify-center gap-3">
                                <button
                                    onClick={onRoll}
                                    disabled={rolling}
                                    className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 md:px-5 md:py-2.5 text-slate-900 bg-emerald-300 hover:bg-emerald-200 disabled:opacity-60 shadow-lg transition"
                                >
                                    <MousePointerClick className="w-4 h-4" /> Roll
                                </button>
                                <button
                                    onClick={() => setAutoRoll((a) => !a)}
                                    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 md:px-5 md:py-2.5 border transition ${autoRoll
                                            ? "bg-white/20 border-emerald-300/60"
                                            : "bg-white/10 border-white/10 hover:bg-white/15"
                                        }`}
                                >
                                    <History className="w-4 h-4" /> {autoRoll ? "Auto: On" : "Auto: Off"}
                                </button>
                            </div>
                            <p className="text-xs text-slate-300">Tip: Press <kbd className="px-1 py-0.5 bg-white/10 rounded">1–6</kbd> to guess • <kbd className="px-1 py-0.5 bg-white/10 rounded">Space/Enter</kbd> to roll</p>
                        </div>

                        {/* Guess + history */}
                        <div className="flex flex-col gap-6">
                            <div>
                                <h2 className="text-sm uppercase tracking-wider text-slate-300 mb-2">Your Guess</h2>
                                <div className="grid grid-cols-6 gap-2">
                                    {faces.map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => setGuess(f)}
                                            className={`rounded-2xl p-3 md:p-4 border text-lg md:text-xl font-semibold transition shadow-sm ${guess === f
                                                    ? "bg-emerald-300 text-slate-900 border-emerald-400"
                                                    : "bg-white/5 border-white/10 hover:bg-white/10"
                                                }`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h2 className="text-sm uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2"><History className="w-4 h-4" /> Last Rolls</h2>
                                <div className="flex flex-wrap gap-2">
                                    <AnimatePresence>
                                        {history.map((h, i) => (
                                            <motion.span
                                                key={`${h}-${i}`}
                                                initial={{ opacity: 0, y: -6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 6 }}
                                                transition={{ duration: 0.25 }}
                                                className="rounded-xl border border-white/10 px-3 py-1 bg-white/5"
                                            >
                                                {h}
                                            </motion.span>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="text-xs text-slate-400">
                                Win Rules: Correct guess +{payout * 10} coins. Wrong guess −10 coins. No guess −2 coins. Streak boosts bragging rights.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative gradient glow */}
                <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-emerald-400/20 via-fuchsia-400/10 to-cyan-400/20 blur-2xl" />
            </div>

            {/* Styles: confetti + die pips */}
            <style>{`
        .confetti-layer {
          position: absolute; inset: 0; overflow: hidden; pointer-events: none;
        }
        .animate-confetti::before, .animate-confetti::after {
          content: ""; position: absolute; left: 50%; top: 50%; width: 2px; height: 2px;
          box-shadow:
            -140px -60px 0 2px rgba(16,185,129,0.95),
            -100px  30px 0 2px rgba(99,102,241,0.95),
             -60px -20px 0 2px rgba(6,182,212,0.95),
             -20px  50px 0 2px rgba(244,63,94,0.95),
              20px -40px 0 2px rgba(234,179,8,0.95),
              60px  10px 0 2px rgba(59,130,246,0.95),
             100px -10px 0 2px rgba(190,24,93,0.95),
             140px  40px 0 2px rgba(14,165,233,0.95);
          transform: translate(-50%, -50%);
          animation: burst 0.9s ease-out forwards;
        }
        @keyframes burst {
          0% { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.8); }
        }
      `}</style>
        </div>
    );
}

// ---------- Subcomponents ----------
function Stat({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 border border-white/10">{icon}</div>
            <div>
                <div className="text-xs uppercase tracking-wider text-slate-300">{label}</div>
                <div className="text-lg md:text-xl font-semibold">{value}</div>
            </div>
        </div>
    );
}

function Die({ face }: { face: Face }) {
    // 3x3 pip grid coordinates per face
    const map = {
        1: [5],
        2: [1, 9],
        3: [1, 5, 9],
        4: [1, 3, 7, 9],
        5: [1, 3, 5, 7, 9],
        6: [1, 3, 4, 6, 7, 9],
    };
    return (
        <div className="grid grid-cols-3 grid-rows-3 gap-3 p-6 w-full h-full">
            {Array.from({ length: 9 }, (_, i) => i + 1).map((idx) => (
                <div key={idx} className="flex items-center justify-center">
                    <span
                        className={`block rounded-full ${map[face].includes(idx) ? "w-4 h-4 md:w-5 md:h-5 bg-slate-900" : "w-2 h-2 md:w-3 md:h-3 bg-slate-300/50"
                            }`}
                    />
                </div>
            ))}
        </div>
    );
}
