// MemoryMatchGame.tsx
import React, { useState, useEffect } from "react";
import { useState as useLocalState } from "react";
import { sendAptosReward } from "../../utils/sendAptosReward";
import { motion, AnimatePresence } from "framer-motion";

const ICONS = ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼"];
const CARDS_COUNT = ICONS.length * 2;

type Card = { id: number; icon: string; isFlipped: boolean; isMatched: boolean };

function generateShuffledCards(): Card[] {
  const duplicatedIcons = [...ICONS, ...ICONS];
  const shuffled = duplicatedIcons.sort(() => Math.random() - 0.5);
  return shuffled.map((icon, index) => ({
    id: index,
    icon,
    isFlipped: false,
    isMatched: false,
  }));
}

export default function MemoryMatchGame() {
  const [playerAddress] = useLocalState(() => localStorage.getItem("petra_wallet_address"));
  const [cards, setCards] = useState<Card[]>(generateShuffledCards);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  const isGameWon = cards.every(card => card.isMatched);

  useEffect(() => {
    if (flippedIndices.length === 2) {
      const [firstIndex, secondIndex] = flippedIndices;
      const firstCard = cards[firstIndex];
      const secondCard = cards[secondIndex];

      if (firstCard.icon === secondCard.icon) {
        // Match
        const newCards = cards.slice();
        newCards[firstIndex].isMatched = true;
        newCards[secondIndex].isMatched = true;
        setCards(newCards);
        setFlippedIndices([]);
      } else {
        // No match, flip back after a delay
        const timer = setTimeout(() => {
          const newCards = cards.slice();
          newCards[firstIndex].isFlipped = false;
          newCards[secondIndex].isFlipped = false;
          setCards(newCards);
          setFlippedIndices([]);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [flippedIndices, cards]);

  useEffect(() => {
    if (isGameWon) {
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
  }, [isGameWon]);

  const handleCardClick = (index: number) => {
    const card = cards[index];
    if (card.isFlipped || card.isMatched || flippedIndices.length === 2) {
      return;
    }

    const newCards = cards.slice();
    newCards[index].isFlipped = true;
    setCards(newCards);
    setFlippedIndices([...flippedIndices, index]);
    if (flippedIndices.length === 0) {
      setMoves(moves + 1);
    }
  };

  const resetGame = () => {
    setCards(generateShuffledCards());
    setFlippedIndices([]);
    setMoves(0);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-900 p-4 relative">
       {playerAddress && (
        <div className="absolute top-4 right-4 z-20 bg-white/10 border border-amber-400/40 px-4 py-2 rounded-xl text-xs text-amber-200 font-mono flex items-center gap-2 shadow-lg">
          <span className="font-bold text-amber-300">Player:</span>
          <span className="truncate max-w-[120px]">{playerAddress}</span>
        </div>
      )}
      <div className="w-full max-w-lg rounded-2xl border border-amber-400/50 bg-gradient-to-br from-amber-950/20 to-blue-950/40 p-6 shadow-xl text-slate-100 flex flex-col items-center">
        <h3 className="text-3xl font-extrabold text-amber-300 tracking-tight mb-2">Memory Match</h3>
        <p className="text-sm text-amber-200/80 mb-4">Moves: {moves}</p>
        
        {isGameWon ? (
          <div className="text-center h-80 flex flex-col justify-center items-center">
            <div className="text-3xl font-bold text-emerald-400 mb-4">You Win! 🎉</div>
            <p>You matched all pairs in {moves} moves.</p>
            <button onClick={resetGame} className="mt-6 px-6 py-2 rounded-xl bg-amber-400 text-slate-900 font-semibold hover:bg-amber-300 transition">Play Again</button>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4 w-full">
            {cards.map((card, i) => (
              <div key={card.id} className="aspect-square" onClick={() => handleCardClick(i)}>
                <motion.div
                  className="w-full h-full rounded-lg shadow-md cursor-pointer relative"
                  style={{ transformStyle: 'preserve-3d' }}
                  animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Back of Card */}
                  <div className="absolute w-full h-full bg-white/10 border border-amber-400/40 rounded-lg flex items-center justify-center text-3xl font-bold text-amber-300" style={{ backfaceVisibility: 'hidden' }}>
                    ?
                  </div>
                  {/* Front of Card */}
                  <div className="absolute w-full h-full bg-amber-900/40 border border-amber-300/60 rounded-lg flex items-center justify-center text-4xl" style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}>
                    {card.icon}
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}