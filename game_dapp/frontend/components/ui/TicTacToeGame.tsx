// TicTacToeGame.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useState as useLocalState } from "react";
import { sendAptosReward } from "../../utils/sendAptosReward";
import { motion, AnimatePresence } from "framer-motion";
import { X, Circle, RefreshCw } from "lucide-react";

type Player = "X" | "O";
type SquareState = Player | null;

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6], // diagonals
];

function calculateWinner(squares: SquareState[]): Player | null {
  for (const line of WINNING_COMBINATIONS) {
    const [a, b, c] = line;
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

function isBoardFull(board: SquareState[]) {
  return board.every(Boolean);
}

// Score constants for minimax
const SCORE = {
  X_WIN: -10, // player (X) win is bad for AI (O)
  O_WIN: 10,  // AI (O) win is good
  DRAW: 0,
};

export default function TicTacToeGame() {
  const [playerAddress] = useLocalState(() => localStorage.getItem("petra_wallet_address"));
  const [board, setBoard] = useState<SquareState[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [isComputerTurn, setIsComputerTurn] = useState(false);
  const [isThinking, setIsThinking] = useState(false); // show AI thinking

  const winner = calculateWinner(board);
  const isDraw = !winner && isBoardFull(board);
  const playerSymbol: Player = "X";
  const computerSymbol: Player = "O";

  // Make a move; returns whether move was applied
  const makeMove = useCallback((index: number, symbol: Player) => {
    if (winner || board[index]) return false;
    const newBoard = board.slice();
    newBoard[index] = symbol;
    setBoard(newBoard);
    return true;
  }, [board, winner]);

  const handlePlayerMove = (index: number) => {
    if (isComputerTurn || isThinking) return;
    if (!makeMove(index, playerSymbol)) return;
    setXIsNext(false);
    setIsComputerTurn(true);
  };

  // Helper: get free cells
  const availableMoves = (b: SquareState[]) => b.map((v, i) => (v === null ? i : -1)).filter(i => i !== -1);

  // Terminal state evaluation for minimax
  const evaluate = (b: SquareState[]) => {
    const w = calculateWinner(b);
    if (w === computerSymbol) return SCORE.O_WIN;
    if (w === playerSymbol) return SCORE.X_WIN;
    return SCORE.DRAW;
  };

  // Minimax implementation with alpha-beta pruning and depth limit
  const minimax = (b: SquareState[], depth: number, isMaximizing: boolean, alpha: number, beta: number): { score: number; index: number | null } => {
    const w = calculateWinner(b);
    if (w || isBoardFull(b) || depth === 0) {
      return { score: evaluate(b), index: null };
    }

    let bestIndex: number | null = null;

    if (isMaximizing) {
      // AI (O) tries to maximize
      let bestScore = -Infinity;
      for (const i of availableMoves(b)) {
        const copy = b.slice();
        copy[i] = computerSymbol;
        const res = minimax(copy, depth - 1, false, alpha, beta);
        if (res.score > bestScore) {
          bestScore = res.score;
          bestIndex = i;
        }
        alpha = Math.max(alpha, bestScore);
        if (beta <= alpha) break; // beta cutoff
      }
      return { score: bestScore, index: bestIndex };
    } else {
      // Player (X) tries to minimize AI score
      let bestScore = Infinity;
      for (const i of availableMoves(b)) {
        const copy = b.slice();
        copy[i] = playerSymbol;
        const res = minimax(copy, depth - 1, true, alpha, beta);
        if (res.score < bestScore) {
          bestScore = res.score;
          bestIndex = i;
        }
        beta = Math.min(beta, bestScore);
        if (beta <= alpha) break; // alpha cutoff
      }
      return { score: bestScore, index: bestIndex };
    }
  };

  // Compute best move for the computer. We use full depth (9) for optimal play.
  const computeBestMove = useCallback((b: SquareState[]) => {
    // If opening move and center is free, prefer center for tougher play
    if (b.every(cell => cell === null)) return 4;
    // If center free later and there's strategy, minimax will consider it but let's prefer center if tie
    const { index } = minimax(b, 9, true, -Infinity, Infinity);
    // fallback: choose first available
    if (index === null) {
      const moves = availableMoves(b);
      return moves.length ? moves[0] : -1;
    }
    return index;
  }, []);

  // Computer's turn effect: compute best move and play it after a short delay
  useEffect(() => {
    if (isComputerTurn && !winner && !isDraw) {
      setIsThinking(true);
      // small delay to make the AI feel like it's "thinking"
      const timer = setTimeout(() => {
        try {
          const move = computeBestMove(board);
          if (move !== -1 && move !== null) {
            makeMove(move, computerSymbol);
            setXIsNext(true);
          }
        } finally {
          setIsComputerTurn(false);
          setIsThinking(false);
        }
      }, 500 + Math.floor(Math.random() * 400)); // 500-900ms delay
      return () => clearTimeout(timer);
    }
  }, [isComputerTurn, board, winner, isDraw, computeBestMove, makeMove]);

  // Handle sending reward on win
  useEffect(() => {
    if (winner === playerSymbol) {
      (async () => {
        try {
          const account = await (window as any).aptos.account();
          if (account?.address) {
            await sendAptosReward(account.address);
            alert("You win! 0.001 APT reward sent to your wallet.");
          }
        } catch (e: any) {
          alert("Reward payout failed: " + (e?.message || e));
        }
      })();
    }
  }, [winner, playerSymbol]);

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setIsComputerTurn(false);
    setIsThinking(false);
  };

  const getStatusMessage = () => {
    if (winner) return `Winner: ${winner === playerSymbol ? "You" : "Computer"}!`;
    if (isDraw) return "It's a Draw!";
    if (isThinking) return "Computer is thinking...";
    return `Next player: ${xIsNext ? "You (X)" : "Computer (O)"}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-slate-800 p-4 relative">
      {playerAddress && (
        <div className="absolute top-4 right-4 z-20 bg-white/10 border border-purple-400/40 px-4 py-2 rounded-xl text-xs text-purple-200 font-mono flex items-center gap-2 shadow-lg">
          <span className="font-bold text-purple-300">Player:</span>
          <span className="truncate max-w-[120px]">{playerAddress}</span>
        </div>
      )}
      <div className="w-full max-w-sm rounded-2xl border border-purple-400/50 bg-gradient-to-br from-purple-950/40 to-indigo-950/40 p-6 shadow-xl text-slate-100 flex flex-col items-center">
        <h3 className="text-2xl font-extrabold text-purple-300 tracking-tight mb-4">Tic-Tac-Toe</h3>
        <div className="mb-4 text-sm text-purple-200/80">{getStatusMessage()}</div>
        <div className="grid grid-cols-3 gap-3 w-64 h-64">
          {board.map((square, i) => (
            <motion.div
              key={i}
              onClick={() => handlePlayerMove(i)}
              className={`bg-white/5 rounded-lg flex items-center justify-center cursor-pointer border border-purple-400/30 hover:bg-white/10 ${
                (isComputerTurn || isThinking || winner || isDraw) ? "pointer-events-none opacity-80" : ""
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence>
                {square && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                  >
                    {square === "X" ? (
                      <X className="w-12 h-12 text-cyan-300" />
                    ) : (
                      <Circle className="w-12 h-12 text-amber-300" />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
        <motion.button
          onClick={resetGame}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-400 text-slate-900 font-semibold hover:bg-purple-300 transition"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <RefreshCw className="w-4 h-4" /> Reset Game
        </motion.button>
      </div>
    </div>
  );
}
