import React, { useEffect, useRef, useState } from "react";

import { useState as useLocalState } from "react";

import { sendAptosReward } from "../utils/sendAptosReward";

import { motion, AnimatePresence } from "framer-motion";



const choices = ["Rock", "Paper", "Scissors"] as const;

type Choice = typeof choices[number];

type Result = "Win" | "Lose" | "Draw";



const CHOICE_EMOJI: Record<Choice, string> = {

  Rock: "🪨",

  Paper: "📄",

  Scissors: "✂️",

};



function getResult(player: Choice, computer: Choice): Result {

  if (player === computer) return "Draw";

  if (

    (player === "Rock" && computer === "Scissors") ||

    (player === "Paper" && computer === "Rock") ||

    (player === "Scissors" && computer === "Paper")

  ) {

    return "Win";

  }

  return "Lose";

}



/**

 * RPSGame

 * - Centered on the page (vertically + horizontally)

 * - Framer Motion powered micro-interactions

 * - Scoreboard, shuffle animation for computer choice, rematch & reset

 */

export default function RPSGame() {

  const [playerAddress] = useLocalState(() => localStorage.getItem("petra_wallet_address"));

  const [player, setPlayer] = useState<Choice | null>(null);

  const [computer, setComputer] = useState<Choice | null>(null);

  const [result, setResult] = useState<Result | null>(null);

  const [score, setScore] = useState({ win: 0, lose: 0, draw: 0 });

  const [shuffling, setShuffling] = useState(false);

  const [hint, setHint] = useState("Pick one to play");



  // cycling index for shuffling

  const [cycleIdx, setCycleIdx] = useState(0);

  const cycleTimer = useRef<number | null>(null);



  useEffect(() => {

    if (!shuffling) return;

    cycleTimer.current = window.setInterval(() => {

      setCycleIdx((i) => (i + 1) % choices.length);

    }, 120);

    return () => {

      if (cycleTimer.current) window.clearInterval(cycleTimer.current);

      cycleTimer.current = null;

    };

  }, [shuffling]);



  async function play(choice: Choice) {

    if (shuffling) return;

    setResult(null);

    setPlayer(choice);

    setComputer(null);

    setShuffling(true);

    setHint("Computer is choosing…");



    setTimeout(async () => {

      const comp = choices[Math.floor(Math.random() * 3)];

      setComputer(comp);

      const r = getResult(choice, comp);

      setResult(r);

      setScore((s) => ({

        win: s.win + (r === "Win" ? 1 : 0),

        lose: s.lose + (r === "Lose" ? 1 : 0),

        draw: s.draw + (r === "Draw" ? 1 : 0),

      }));

      setShuffling(false);

      setHint("Pick again or reset");

      // --- Send APT reward if win ---

      if (r === "Win") {

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

    }, 1000);

  }



  function reset() {

    setPlayer(null);

    setComputer(null);

    setResult(null);

    setShuffling(false);

    setHint("Pick one to play");

    setScore({ win: 0, lose: 0, draw: 0 });

  }



  const cyclingChoice = choices[cycleIdx];



  return (

    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 p-4 relative">

      {/* Player profile badge */}

      {playerAddress && (

        <div className="absolute top-4 right-4 z-20 bg-white/10 border border-blue-400/40 px-4 py-2 rounded-xl text-xs text-blue-200 font-mono flex items-center gap-2 shadow-lg">

          <span className="font-bold text-blue-400">Player:</span>

          <span className="truncate max-w-[120px]">{playerAddress}</span>

        </div>

      )}

      {/* Game card */}

      <div className="w-full max-w-xl rounded-2xl border border-blue-400/50 bg-gradient-to-br from-sky-950/40 via-indigo-900/40 to-sky-950/40 p-6 md:p-8 shadow-xl text-slate-100">

        {/* Header */}

        <div className="flex items-center justify-between gap-4">

          <div>

            <h3 className="text-xl md:text-2xl font-extrabold text-blue-300 tracking-tight">

              Rock • Paper • Scissors

            </h3>

            <p className="text-xs md:text-sm text-blue-200/80">

              Best of your reflexes vs. the bot

            </p>

          </div>

          <div className="flex items-center gap-2 text-xs">

            <Badge label="Wins" value={score.win} />

            <Badge label="Losses" value={score.lose} />

            <Badge label="Draws" value={score.draw} />

          </div>

        </div>



        {/* Choice buttons */}

        <div className="mt-6 grid grid-cols-3 gap-3">

          {choices.map((c) => (

            <ChoiceCard

              key={c}

              choice={c}

              onClick={() => play(c)}

              disabled={shuffling}

              active={player === c}

            />

          ))}

        </div>



        {/* Versus stage */}

        <div className="mt-8 grid grid-cols-3 items-center">

          <PlayerSlot title="You" choice={player} side="left" />

          <div className="flex items-center justify-center">

            <motion.div

              initial={{ scale: 0.9, opacity: 0.8 }}

              animate={{ scale: 1, opacity: 1 }}

              transition={{ type: "spring", stiffness: 220, damping: 15 }}

              className="px-4 py-1 rounded-full text-sm border border-blue-400/50 bg-white/5"

            >

              VS

            </motion.div>

          </div>

          <PlayerSlot

            title="Computer"

            choice={shuffling ? cyclingChoice : computer}

            side="right"

            pulse={shuffling}

          />

        </div>



        {/* Result banner */}

        <div className="mt-6 min-h-10 flex items-center justify-center">

          <AnimatePresence mode="popLayout" initial={false}>

            {result ? (

              <motion.div

                key={result}

                initial={{ y: 12, opacity: 0 }}

                animate={{ y: 0, opacity: 1 }}

                exit={{ y: -12, opacity: 0 }}

                transition={{ duration: 0.25 }}

                className={[

                  "px-4 py-2 rounded-xl border text-sm font-semibold",

                  result === "Win"

                    ? "border-emerald-400/60 text-emerald-300 bg-emerald-500/10"

                    : result === "Lose"

                    ? "border-rose-400/60 text-rose-300 bg-rose-500/10"

                    : "border-slate-300/50 text-slate-200 bg-white/5",

                ].join(" ")}

              >

                {result === "Win" && "You Win! 🎉"}

                {result === "Lose" && "You Lose! 💥"}

                {result === "Draw" && "It's a Draw. 🤝"}

              </motion.div>

            ) : (

              <motion.div

                key={hint}

                initial={{ opacity: 0 }}

                animate={{ opacity: 1 }}

                exit={{ opacity: 0 }}

                transition={{ duration: 0.2 }}

                className="text-xs text-blue-200/80"

              >

                {hint}

              </motion.div>

            )}

          </AnimatePresence>

        </div>



        {/* Controls */}

        <div className="mt-6 flex items-center justify-center gap-3">

          <motion.button

            whileHover={{ scale: 1.03 }}

            whileTap={{ scale: 0.97 }}

            onClick={reset}

            className="px-4 py-2 rounded-xl bg-blue-400 text-slate-900 font-semibold hover:bg-blue-300 transition"

          >

            Reset

          </motion.button>

          <motion.button

            whileHover={{ scale: 1.03 }}

            whileTap={{ scale: 0.97 }}

            onClick={() => {

              if (!player) return; // quick rematch with same pick

              play(player);

            }}

            className="px-4 py-2 rounded-xl border border-blue-300/60 bg-white/5 text-blue-200 hover:bg-white/10 transition"

            disabled={!player || shuffling}

          >

            Rematch

          </motion.button>

        </div>

      </div>

    </div>

  );

}



/* ---------- Subcomponents ---------- */



function Badge({ label, value }: { label: string; value: number }) {

  return (

    <div className="px-3 py-1 rounded-xl bg-white/5 border border-blue-400/40 text-blue-200">

      <span className="text-[10px] uppercase tracking-wider mr-1 opacity-80">{label}</span>

      <span className="font-semibold">{value}</span>

    </div>

  );

}



function ChoiceCard({

  choice,

  onClick,

  disabled,

  active,

}: {

  choice: Choice;

  onClick: () => void;

  disabled?: boolean;

  active?: boolean;

}) {

  const emoji = CHOICE_EMOJI[choice];

  return (

    <motion.button

      whileHover={disabled ? undefined : { y: -3 }}

      whileTap={disabled ? undefined : { scale: 0.95 }}

      onClick={onClick}

      disabled={disabled}

      className={[

        "h-24 md:h-28 rounded-2xl border shadow-sm transition flex flex-col items-center justify-center gap-1",

        "select-none",

        disabled ? "opacity-60 cursor-not-allowed" : "hover:shadow-lg",

        active

          ? "bg-blue-400 text-slate-900 border-blue-300"

          : "bg-white/5 text-slate-100 border-blue-400/40",

      ].join(" ")}

    >

      <motion.span

        layout

        className="text-3xl md:text-4xl"

        animate={active ? { rotate: [0, -10, 10, -6, 6, 0], scale: [1, 1.1, 1] } : {}}

        transition={{ duration: 0.6 }}

      >

        {emoji}

      </motion.span>

      <span className="text-xs md:text-sm font-semibold tracking-wide">{choice}</span>

    </motion.button>

  );

}



function PlayerSlot({

  title,

  choice,

  side,

  pulse,

}: {

  title: string;

  choice: Choice | null | undefined;

  side: "left" | "right";

  pulse?: boolean;

}) {

  const emoji = choice ? CHOICE_EMOJI[choice] : "?";

  const color = side === "left" ? "border-emerald-400/50" : "border-fuchsia-400/50";

  return (

    <div className="flex flex-col items-center gap-2">

      <div className="text-[11px] uppercase tracking-wider text-blue-200/80">{title}</div>

      <motion.div

        layout

        initial={{ scale: 0.95, opacity: 0.85 }}

        animate={{ scale: 1, opacity: 1 }}

        transition={{ type: "spring", stiffness: 240, damping: 16 }}

        className={[

          "w-24 h-24 md:w-28 md:h-28 rounded-2xl border bg-white/5 flex items-center justify-center text-4xl",

          color,

        ].join(" ")}

      >

        <motion.span

          key={emoji + String(pulse)}

          initial={{ y: 6, opacity: 0 }}

          animate={{ y: 0, opacity: 1 }}

          transition={{ duration: 0.18 }}

          className={pulse ? "animate-pulse" : ""}

        >

          {emoji}

        </motion.span>

      </motion.div>

    </div>

  );

}