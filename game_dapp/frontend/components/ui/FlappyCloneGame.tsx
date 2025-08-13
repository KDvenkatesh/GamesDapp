// FlappyCloneGame.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useState as useLocalState } from "react";
import { sendAptosReward } from "../../utils/sendAptosReward";

// Game Constants
const SCREEN_WIDTH = 400;
const SCREEN_HEIGHT = 500;
const BIRD_WIDTH = 34;
const BIRD_HEIGHT = 24;
const BIRD_X = 60;
const GRAVITY = 0.5;
const LIFT = -8;
const PIPE_WIDTH = 52;
const PIPE_GAP = 150;
const PIPE_SPEED = 3;

export default function FlappyCloneGame() {
    const [playerAddress] = useLocalState(() => localStorage.getItem("petra_wallet_address"));
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(() => Number(localStorage.getItem("flappy_highscore") || 0));

    // Game state refs
    const birdY = useRef(SCREEN_HEIGHT / 2);
    const birdVelocity = useRef(0);
    const pipes = useRef<{ x: number, topHeight: number }[]>([]);
    const frameCount = useRef(0);

    const resetGame = () => {
        setGameStarted(true);
        setGameOver(false);
        setScore(0);
        birdY.current = SCREEN_HEIGHT / 2;
        birdVelocity.current = 0;
        pipes.current = [];
        frameCount.current = 0;
    };
    
    // Send reward on new high score
    useEffect(() => {
        if (gameOver && score > highScore) {
            setHighScore(score);
            localStorage.setItem("flappy_highscore", String(score));
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
    }, [gameOver, score, highScore]);

    // Game Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        
        const gameLoop = () => {
            if (!gameStarted || gameOver) {
                // Draw initial/game over screen
                ctx.fillStyle = '#70c5ce';
                ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
                ctx.fillStyle = 'white';
                ctx.font = '30px "Press Start 2P"';
                ctx.textAlign = 'center';
                if (gameOver) {
                    ctx.fillText('Game Over', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 50);
                    ctx.font = '20px "Press Start 2P"';
                    ctx.fillText(`Score: ${score}`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
                    ctx.fillText(`High Score: ${highScore}`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 40);
                    ctx.font = '16px "Press Start 2P"';
                    ctx.fillText('Click to Retry', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 100);
                } else {
                    ctx.fillText('Flappy Clone', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 50);
                    ctx.font = '16px "Press Start 2P"';
                    ctx.fillText('Click to Start', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
                }
                return;
            }

            // Game Logic
            // Update bird
            birdVelocity.current += GRAVITY;
            birdY.current += birdVelocity.current;

            // Clear canvas
            ctx.fillStyle = '#70c5ce';
            ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

            // Update and draw pipes
            if (frameCount.current % 90 === 0) {
                const topHeight = Math.random() * (SCREEN_HEIGHT - PIPE_GAP - 100) + 50;
                pipes.current.push({ x: SCREEN_WIDTH, topHeight });
            }

            ctx.fillStyle = '#008000';
            pipes.current.forEach(pipe => {
                pipe.x -= PIPE_SPEED;
                // Top pipe
                ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
                // Bottom pipe
                ctx.fillRect(pipe.x, pipe.topHeight + PIPE_GAP, PIPE_WIDTH, SCREEN_HEIGHT);
            });
            pipes.current = pipes.current.filter(pipe => pipe.x + PIPE_WIDTH > 0);
            
            // Draw bird
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(BIRD_X, birdY.current, BIRD_WIDTH, BIRD_HEIGHT);
            
            // Draw score
            ctx.fillStyle = 'white';
            ctx.font = '30px "Press Start 2P"';
            ctx.fillText(String(score), SCREEN_WIDTH / 2, 50);
            
            // Collision Detection
            const birdTop = birdY.current;
            const birdBottom = birdY.current + BIRD_HEIGHT;
            const birdLeft = BIRD_X;
            const birdRight = BIRD_X + BIRD_WIDTH;

            // Ground/sky collision
            if (birdBottom > SCREEN_HEIGHT || birdTop < 0) {
                setGameOver(true);
            }
            // Pipe collision
            for (const pipe of pipes.current) {
                const pipeRight = pipe.x + PIPE_WIDTH;
                const pipeBottomTop = pipe.topHeight;
                const pipeTopBottom = pipe.topHeight + PIPE_GAP;
                
                if (birdRight > pipe.x && birdLeft < pipeRight) {
                    if (birdTop < pipeBottomTop || birdBottom > pipeTopBottom) {
                        setGameOver(true);
                    }
                }
                // Score increment
                if (pipe.x + PIPE_WIDTH < BIRD_X && !pipe.passed) {
                    setScore(s => s + 1);
                    pipe.passed = true;
                }
            }

            frameCount.current++;
            animationFrameId = requestAnimationFrame(gameLoop);
        };

        gameLoop();
        return () => cancelAnimationFrame(animationFrameId);

    }, [gameStarted, gameOver, score, highScore]);

    // Input Handler
    const handleCanvasClick = () => {
        if (!gameStarted) {
            resetGame();
        } else if (gameOver) {
            resetGame();
        } else {
            birdVelocity.current = LIFT;
        }
    };
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-gray-800 p-4 relative font-sans">
             {playerAddress && (
                <div className="absolute top-4 right-4 z-20 bg-white/10 border border-cyan-400/40 px-4 py-2 rounded-xl text-xs text-cyan-200 font-mono flex items-center gap-2 shadow-lg">
                <span className="font-bold text-cyan-300">Player:</span>
                <span className="truncate max-w-[120px]">{playerAddress}</span>
                </div>
            )}
            <div className="flex flex-col items-center">
                 <h3 className="text-2xl font-bold text-cyan-300 mb-4 font-mono">Flappy Clone</h3>
                 <canvas
                    ref={canvasRef}
                    width={SCREEN_WIDTH}
                    height={SCREEN_HEIGHT}
                    onClick={handleCanvasClick}
                    className="border-2 border-slate-600 rounded-lg shadow-2xl cursor-pointer"
                 />
                 <p className="text-slate-400 text-sm mt-4">Click/Tap to fly.</p>
            </div>
        </div>
    );
}