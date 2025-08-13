// SnakeGame.tsx
import React, { useEffect, useRef, useState } from "react";
import { useState as useLocalState } from "react";
import { sendAptosReward } from "../utils/sendAptosReward";

/**
 * SnakeGame.tsx
 *
 * Single-file React + TypeScript snake game using <canvas>.
 * Drop into a React app (Vite / CRA). Tailwind classes used in wrapper,
 * but game logic & canvas do not require Tailwind to function.
 */

/* ------------- Config ------------- */
const GRID_SIZE = 20; // number of cells per row/column
const CELL_SIZE = 20; // pixels per cell (canvas scaling handled below)
const INITIAL_SPEED = 8; // moves per second
const DIRECTIONS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
} as const;
type DirKey = keyof typeof DIRECTIONS;
type Vec = { x: number; y: number };
type Point = { x: number; y: number };

/* ------------- Helpers ------------- */
function randPoint(): Point {
  return { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
}
function pointsEqual(a: Point, b: Point) {
  return a.x === b.x && a.y === b.y;
}
function clampWrap(p: Point): Point {
  // wrap around edges (classic snake behavior). If you prefer death on wall,
  // change to throw collision.
  return {
    x: (p.x + GRID_SIZE) % GRID_SIZE,
    y: (p.y + GRID_SIZE) % GRID_SIZE,
  };
}

/* ------------- Component ------------- */
export default function SnakeGame() {
  const [playerAddress] = useLocalState(() => localStorage.getItem("petra_wallet_address"));
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastPaintRef = useRef(0);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(INITIAL_SPEED); // moves per second
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState<number>(() => {
    const s = localStorage.getItem("snake_highscore");
    return s ? Number(s) : 0;
  });

  // game state refs (keeps stable across animation frames)
  const snakeRef = useRef<Point[]>([
    { x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) },
    { x: Math.floor(GRID_SIZE / 2) - 1, y: Math.floor(GRID_SIZE / 2) },
  ]);
  const dirRef = useRef<Vec>({ x: 1, y: 0 });
  const nextDirRef = useRef<Vec | null>(null); // buffer to prevent reversing directly
  const foodRef = useRef<Point>(randFoodPosition(snakeRef.current));
  const moveAccumulatorRef = useRef(0); // time accumulator for moves
  const lastMoveTimeRef = useRef<number | null>(null);
  const [gameOver, setGameOver] = useState(false);

  // Touch handling for mobile swipes
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    // drawing loop using requestAnimationFrame
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    // scale canvas for crispness on high-DPI screens
    const dpr = window.devicePixelRatio || 1;
    canvas.width = GRID_SIZE * CELL_SIZE * dpr;
    canvas.height = GRID_SIZE * CELL_SIZE * dpr;
    canvas.style.width = `${GRID_SIZE * CELL_SIZE}px`;
    canvas.style.height = `${GRID_SIZE * CELL_SIZE}px`;
    ctx.scale(dpr, dpr);

    function paint() {
      // clear
      ctx.fillStyle = "#071024";
      ctx.fillRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);

      // draw grid (subtle)
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
        ctx.stroke();
      }

      // draw food
      const food = foodRef.current;
      drawRect(ctx, food.x, food.y, CELL_SIZE, "#ff4d4d");

      // draw snake
      const snake = snakeRef.current;
      for (let i = 0; i < snake.length; i++) {
        const p = snake[i];
        // head different color
        drawRect(ctx, p.x, p.y, CELL_SIZE, i === 0 ? "#00e676" : "#00c853");
      }

      // overlay pause/game over
      if (!running || gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);
        ctx.fillStyle = "#fff";
        ctx.font = "18px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(gameOver ? "Game Over" : "Paused", (GRID_SIZE * CELL_SIZE) / 2, (GRID_SIZE * CELL_SIZE) / 2 - 8);
        ctx.font = "12px Inter, system-ui, sans-serif";
        ctx.fillText(`Score: ${score} • High: ${highScore}`, (GRID_SIZE * CELL_SIZE) / 2, (GRID_SIZE * CELL_SIZE) / 2 + 12);
      }
    }

    let raf = 0;
    function loop(ts: number) {
      raf = requestAnimationFrame(loop);
      const now = ts;
      if (lastMoveTimeRef.current === null) lastMoveTimeRef.current = now;
      const dt = now - lastMoveTimeRef.current;
      const msPerMove = 1000 / speed;

      if (running && !gameOver) {
        moveAccumulatorRef.current += dt;
        // perform moves while accumulated time >= msPerMove (handles lag)
        while (moveAccumulatorRef.current >= msPerMove) {
          stepGame(); // updates positions & game state
          moveAccumulatorRef.current -= msPerMove;
        }
      }

      lastMoveTimeRef.current = now;
      paint();
    }

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, speed, gameOver, score, highScore]); // repaint depends on these

  /* ---------- Game logic ---------- */
  function stepGame() {
    const snake = snakeRef.current;
    const dir = nextDirRef.current ?? dirRef.current;
    // compute next head
    const newHeadRaw = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    const newHead = clampWrap(newHeadRaw);

    // collision with self?
    if (snake.some((seg) => pointsEqual(seg, newHead))) {
      // lose
      setGameOver(true);
      setRunning(false);
      // update high score
      setHighScore((prev) => {
        const newHigh = Math.max(prev, score);
        localStorage.setItem("snake_highscore", String(newHigh));
        // --- Send APT reward if new high score ---
        if (score > prev) {
          (async () => {
            try {
              const account = await (window as any).aptos.account();
              if (account?.address) {
                await sendAptosReward(account.address);
                alert("New high score! 0.001 APT reward sent to your wallet.");
              }
            } catch (e: any) {
              alert("Reward payout failed: " + (e?.message || e));
            }
          })();
        }
        return newHigh;
      });
      return;
    }

    // add new head
    snakeRef.current = [newHead, ...snake.slice(0, -1)];

    // eat food?
    if (pointsEqual(newHead, foodRef.current)) {
      // grow: add tail back
      snakeRef.current = [newHead, ...snake];
      setScore((s) => s + 1);

      // place new food at random empty cell
      foodRef.current = randFoodPosition(snakeRef.current);
      // slight speed bump every X points (optional)
      if ((score + 1) % 5 === 0) {
        setSpeed((sp) => Math.min(sp + 1, 25));
      }
    }

    // commit direction
    dirRef.current = dir;
    nextDirRef.current = null;
  }

  function randFoodPosition(snake: Point[]) {
    // pick random cell not occupied by snake
    let p = randPoint();
    const occupied = new Set(snake.map((s) => `${s.x},${s.y}`));
    while (occupied.has(`${p.x},${p.y}`)) {
      p = randPoint();
    }
    return p;
  }

  /* ---------- Controls: keyboard & touch ---------- */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = e.key as DirKey;
      if (k === " " || k === "Spacebar") {
        // space toggles pause
        e.preventDefault();
        toggleRunning();
        return;
      }
      if (!(k in DIRECTIONS)) return;
      const candidate = DIRECTIONS[k];
      // prevent reversing directly
      if (candidate.x === -dirRef.current.x && candidate.y === -dirRef.current.y) return;
      nextDirRef.current = candidate;
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function toggleRunning() {
    if (gameOver) return;
    setRunning((r) => !r);
  }

  /* Touch swipes */
  useEffect(() => {
    const canvas = canvasRef.current!;
    function onTouchStart(e: TouchEvent) {
      const t = e.touches[0];
      touchStartRef.current = { x: t.clientX, y: t.clientY };
    }
    function onTouchMove(e: TouchEvent) {
      if (!touchStartRef.current) return;
      const t = e.touches[0];
      const dx = t.clientX - touchStartRef.current.x;
      const dy = t.clientY - touchStartRef.current.y;
      if (Math.hypot(dx, dy) < 30) return; // ignore small moves
      const absX = Math.abs(dx), absY = Math.abs(dy);
      let chosen: Vec | null = null;
      if (absX > absY) {
        chosen = dx > 0 ? DIRECTIONS.ArrowRight : DIRECTIONS.ArrowLeft;
      } else {
        chosen = dy > 0 ? DIRECTIONS.ArrowDown : DIRECTIONS.ArrowUp;
      }
      if (chosen) {
        if (!(chosen.x === -dirRef.current.x && chosen.y === -dirRef.current.y)) {
          nextDirRef.current = chosen;
        }
      }
      touchStartRef.current = null;
    }
    function onTouchEnd() {
      touchStartRef.current = null;
    }
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  /* ---------- UI handlers ---------- */
  function restart() {
    // reset all
    snakeRef.current = [
      { x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) },
      { x: Math.floor(GRID_SIZE / 2) - 1, y: Math.floor(GRID_SIZE / 2) },
    ];
    dirRef.current = { x: 1, y: 0 };
    nextDirRef.current = null;
    foodRef.current = randFoodPosition(snakeRef.current);
    moveAccumulatorRef.current = 0;
    lastMoveTimeRef.current = null;
    setGameOver(false);
    setRunning(true);
    setScore(0);
    setSpeed(INITIAL_SPEED);
  }

  /* ---------- Rendering helpers ---------- */
  function drawRect(ctx: CanvasRenderingContext2D, gridX: number, gridY: number, size: number, fill: string) {
    const pad = 2; // spacing for nicer look
    ctx.fillStyle = fill;
    ctx.fillRect(gridX * size + pad / 2, gridY * size + pad / 2, size - pad, size - pad);
  }

  /* ---------- JSX UI ---------- */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 p-6 relative">
      {/* Player profile badge */}
      {playerAddress && (
        <div className="absolute top-4 right-4 z-20 bg-white/10 border border-emerald-400/40 px-4 py-2 rounded-xl text-xs text-emerald-200 font-mono flex items-center gap-2 shadow-lg">
          <span className="font-bold text-emerald-300">Player:</span>
          <span className="truncate max-w-[120px]">{playerAddress}</span>
        </div>
      )}
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold text-white">Snake Game</h2>
            <p className="text-sm text-slate-300">Arrow keys / WASD — Swipe to control on mobile</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-100">Score: <span className="font-semibold">{score}</span></div>
            <div className="text-sm text-slate-100">High: <span className="font-semibold">{highScore}</span></div>
          </div>
        </div>

        <div className="bg-slate-800/40 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center">
          {/* Canvas */}
          <div className="flex-shrink-0">
            <canvas
              ref={canvasRef}
              className="rounded-md shadow-lg touch-none"
              style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE, background: "transparent" }}
            />
          </div>

          {/* Controls */}
          <div className="flex-1 flex flex-col gap-3">
            <div className="flex gap-2">
              <button
                onClick={toggleRunning}
                className="px-3 py-2 rounded-lg bg-emerald-400 text-slate-900 font-medium hover:bg-emerald-300"
              >
                {running && !gameOver ? "Pause" : gameOver ? "Game Over" : "Resume"}
              </button>
              <button
                onClick={restart}
                className="px-3 py-2 rounded-lg bg-yellow-400 text-slate-900 font-medium hover:bg-yellow-300"
              >
                Restart
              </button>
              <button
                onClick={() => {
                  setScore(0);
                  setHighScore(0);
                  localStorage.removeItem("snake_highscore");
                }}
                className="px-3 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-400"
              >
                Reset High
              </button>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-200">Speed</label>
              <input
                type="range"
                min={4}
                max={25}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full"
              />
              <div className="w-10 text-right text-sm text-slate-200">{speed}</div>
            </div>

            <div className="text-xs text-slate-300">
              Tip: Space toggles pause. Eating food increases score and slightly increases speed every 5 points.
            </div>

            {gameOver && (
              <div className="mt-2 p-3 rounded-lg bg-rose-600/10 border border-rose-500 text-rose-200">
                <div className="font-semibold">You lost!</div>
                <div>Final score: {score}</div>
                <div>High score: {highScore}</div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 text-xs text-slate-400">
          Built with canvas — tweak <code>GRID_SIZE</code> and <code>CELL_SIZE</code> at the top to change map scale.
        </div>
      </div>
    </div>
  );
}
