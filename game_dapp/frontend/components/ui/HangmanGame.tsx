// HangmanGame.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useState as useLocalState } from "react";
import { sendAptosReward } from "../../utils/sendAptosReward";
import { motion } from "framer-motion";

const WORDS = ["APTOS", "BLOCKCHAIN", "WALLET", "TRANSACTION", "MOVE", "NODE", "SMART", "CONTRACT"];
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const MAX_MISTAKES = 6;

function getRandomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

export default function HangmanGame() {
  const [playerAddress] = useLocalState(() => localStorage.getItem("petra_wallet_address"));
  const [word, setWord] = useState(getRandomWord);
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  
  const mistakes = Array.from(guessedLetters).filter(letter => !word.includes(letter)).length;
  const isWinner = word.split("").every(letter => guessedLetters.has(letter));
  const isLoser = mistakes >= MAX_MISTAKES;
  const gameOver = isWinner || isLoser;

  const handleGuess = useCallback((letter: string) => {
    if (gameOver) return;
    setGuessedLetters(prev => new Set(prev).add(letter));
  }, [gameOver]);
  
  useEffect(() => {
    if (isWinner) {
      (async () => {
        try {
          const account = await (window as any).aptos.account();
          if (account?.address) {
            await sendAptosReward(account.address);
            alert("You won! 0.001 APT reward sent to your wallet.");
          }
        } catch (e: any) {
          alert("Reward payout failed: " + (e?.message || e));
        }
      })();
    }
  }, [isWinner]);

  const resetGame = () => {
    setWord(getRandomWord());
    setGuessedLetters(new Set());
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-gray-800 p-4 relative">
       {playerAddress && (
        <div className="absolute top-4 right-4 z-20 bg-white/10 border border-teal-400/40 px-4 py-2 rounded-xl text-xs text-teal-200 font-mono flex items-center gap-2 shadow-lg">
          <span className="font-bold text-teal-300">Player:</span>
          <span className="truncate max-w-[120px]">{playerAddress}</span>
        </div>
      )}
      <div className="w-full max-w-2xl rounded-2xl border border-teal-400/50 bg-gradient-to-br from-teal-950/40 to-gray-900/40 p-6 shadow-xl text-slate-100 flex flex-col items-center">
        <h3 className="text-3xl font-extrabold text-teal-300 tracking-tight mb-4">Hangman</h3>
        
        {/* Hangman Figure */}
        <div className="h-32 w-32 mb-4">
          <svg viewBox="0 0 100 120">
            <line x1="10" y1="110" x2="90" y2="110" stroke="#a78bfa" strokeWidth="4" />
            <line x1="30" y1="110" x2="30" y2="10" stroke="#a78bfa" strokeWidth="4" />
            <line x1="30" y1="10" x2="70" y2="10" stroke="#a78bfa" strokeWidth="4" />
            <line x1="70" y1="10" x2="70" y2="30" stroke="#a78bfa" strokeWidth="4" />
            {mistakes > 0 && <circle cx="70" cy="40" r="10" stroke="#f472b6" fill="none" strokeWidth="3" />}
            {mistakes > 1 && <line x1="70" y1="50" x2="70" y2="80" stroke="#f472b6" strokeWidth="3" />}
            {mistakes > 2 && <line x1="70" y1="60" x2="55" y2="75" stroke="#f472b6" strokeWidth="3" />}
            {mistakes > 3 && <line x1="70" y1="60" x2="85" y2="75" stroke="#f472b6" strokeWidth="3" />}
            {mistakes > 4 && <line x1="70" y1="80" x2="55" y2="95" stroke="#f472b6" strokeWidth="3" />}
            {mistakes > 5 && <line x1="70" y1="80" x2="85" y2="95" stroke="#f472b6" strokeWidth="3" />}
          </svg>
        </div>
        
        {/* Word Display */}
        <div className="flex gap-2 md:gap-4 mb-6 tracking-widest text-2xl md:text-4xl font-mono">
          {word.split("").map((letter, i) => (
            <span key={i} className="w-8 md:w-12 h-10 md:h-16 flex items-center justify-center border-b-4 border-teal-400/60">
              {guessedLetters.has(letter) ? letter : ""}
            </span>
          ))}
        </div>
        
        {/* Keyboard */}
        {!gameOver ? (
          <div className="flex flex-wrap gap-2 justify-center max-w-lg">
            {ALPHABET.map(letter => (
              <motion.button
                key={letter}
                onClick={() => handleGuess(letter)}
                disabled={guessedLetters.has(letter)}
                className="w-9 h-9 md:w-10 md:h-10 rounded-md bg-white/10 border border-teal-400/30 text-teal-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-white/20"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {letter}
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="text-center">
            <div className={`text-2xl font-bold mb-4 ${isWinner ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isWinner ? "You Win! 🎉" : "You Lose! 💀"}
            </div>
            {!isWinner && <p className="text-slate-300">The word was: <strong className="text-amber-300">{word}</strong></p>}
            <button onClick={resetGame} className="mt-4 px-6 py-2 rounded-xl bg-teal-400 text-slate-900 font-semibold hover:bg-teal-300 transition">Play Again</button>
          </div>
        )}
      </div>
    </div>
  );
}