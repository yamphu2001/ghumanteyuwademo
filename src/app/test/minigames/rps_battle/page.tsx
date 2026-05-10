'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import MascotImage from './mascot.png';

type Choice = 'ROCK' | 'PAPER' | 'SCISSORS' | null;

export default function RPSBattle() {
  const [playerChoice, setPlayerChoice] = useState<Choice>(null);
  const [yuwaChoice, setYuwaChoice] = useState<Choice>(null);
  const [score, setScore] = useState({ player: 0, yuwa: 0 });
  const [result, setResult] = useState<string>('Choose your move!');
  const [isAnimating, setIsAnimating] = useState(false);

  const choices: Choice[] = ['ROCK', 'PAPER', 'SCISSORS'];
  const icons = { ROCK: '✊', PAPER: '✋', SCISSORS: '✌️' };

  const playRound = (choice: Choice) => {
    if (isAnimating || score.player === 2 || score.yuwa === 2) return;

    setIsAnimating(true);
    setPlayerChoice(choice);
    setResult('Yuwa is thinking...');

    // Small delay to make it feel like Yuwa is "playing"
    setTimeout(() => {
      const randomChoice = choices[Math.floor(Math.random() * choices.length)];
      setYuwaChoice(randomChoice);
      determineWinner(choice, randomChoice);
      setIsAnimating(false);
    }, 600);
  };

  const determineWinner = (p: Choice, y: Choice) => {
    if (p === y) {
      setResult("It's a draw! Go again.");
      return;
    }

    if (
      (p === 'ROCK' && y === 'SCISSORS') ||
      (p === 'PAPER' && y === 'ROCK') ||
      (p === 'SCISSORS' && y === 'PAPER')
    ) {
      setScore(prev => ({ ...prev, player: prev.player + 1 }));
      setResult('You got him!');
    } else {
      setScore(prev => ({ ...prev, yuwa: prev.yuwa + 1 }));
      setResult('Yuwa wins this round!');
    }
  };

  const resetGame = () => {
    setScore({ player: 0, yuwa: 0 });
    setPlayerChoice(null);
    setYuwaChoice(null);
    setResult('New Match: Best of 3');
  };

  const gameOver = score.player === 2 || score.yuwa === 2;

  return (
    <div className="max-w-md mx-auto p-6 font-sans text-center">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Yuwa Showdown</h2>
        <div className="flex justify-center gap-8 mt-4">
          <div className="text-center">
            <p className="text-[10px] font-bold text-slate-400">YOU</p>
            <p className="text-3xl font-black">{score.player}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold text-slate-400">YUWA</p>
            <p className="text-3xl font-black">{score.yuwa}</p>
          </div>
        </div>
      </div>

      <div className="relative bg-white rounded-[3rem] p-8 shadow-xl border-2 border-slate-100 mb-8 min-h-[300px] flex flex-col items-center justify-center overflow-hidden">
        {/* Yuwa's Side */}
        <div className={`transition-all duration-300 ${isAnimating ? 'animate-bounce' : ''}`}>
          <div className="relative w-24 h-24 mx-auto mb-4">
            <Image 
                src={MascotImage} 
                alt="Yuwa" 
                className={`w-full h-auto drop-shadow-lg ${score.yuwa > score.player ? 'scale-110' : 'grayscale-[50%]'}`} 
            />
            {yuwaChoice && !isAnimating && (
              <div className="absolute -right-8 top-0 bg-slate-800 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl border-4 border-white shadow-lg">
                {icons[yuwaChoice]}
              </div>
            )}
          </div>
        </div>

        <div className="h-12 flex items-center justify-center">
          <p className={`font-bold ${gameOver ? 'text-blue-600 text-xl' : 'text-slate-500'}`}>
            {gameOver ? (score.player === 2 ? "🏆 YOU WON THE MATCH!" : "💀 YUWA WON THE MATCH!") : result}
          </p>
        </div>

        {/* Player's choice display */}
        {playerChoice && !isAnimating && (
            <div className="mt-4 text-5xl animate-in zoom-in">{icons[playerChoice]}</div>
        )}
      </div>

      {!gameOver ? (
        <div className="grid grid-cols-3 gap-3">
          {(['ROCK', 'PAPER', 'SCISSORS'] as Choice[]).map((c) => (
            <button
              key={c}
              onClick={() => playRound(c)}
              className="py-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-3xl hover:border-blue-500 hover:bg-blue-50 active:scale-95 transition-all"
            >
              {icons[c!]}
              <p className="text-[10px] font-black text-slate-400 mt-2">{c}</p>
            </button>
          ))}
        </div>
      ) : (
        <button 
          onClick={resetGame}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all"
        >
          REMATCH
        </button>
      )}
    </div>
  );
}