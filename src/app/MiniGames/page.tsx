// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import { useGameAssignment, GAME_META, ALL_GAME_IDS, type GameId } from './Usegameassignment';

// import ColorHunt from './color_finder/page';
// import YuwaTravelCamera from './Yuwaincamera/page';
// import DailyQuest from './itemscan/page';

// // Games that manage their own inline success screen.
// const SELF_HANDLED_GAMES: GameId[] = ['yuwatravel', 'colorhunt', 'dailyquest'];

// function ActiveGame({
//   id,
//   onComplete,
//   onClose,
// }: {
//   id: GameId;
//   onComplete: () => void;
//   onClose: () => void;
// }) {
//   switch (id) {
//     case 'colorhunt': return <ColorHunt onComplete={onComplete} onClose={onClose} />;
//     case 'yuwatravel': return <YuwaTravelCamera onComplete={onComplete} onClose={onClose} />;

//     case 'dailyquest': return <DailyQuest onComplete={onComplete} onClose={onClose} />;
//   }
// }

// function GameSplash({ gameId }: { gameId: GameId }) {
//   const meta = GAME_META[gameId];
//   return (
//     <div className={`flex-1 flex flex-col items-center justify-center bg-gradient-to-br ${meta.gradient} text-white p-10 text-center`}>
//       <div className="text-7xl mb-6 drop-shadow-lg" style={{ animation: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>
//         {meta.emoji}
//       </div>
//       <p className="text-xs font-black tracking-[0.3em] uppercase opacity-70 mb-3">Your challenge</p>
//       <h2 className="text-4xl font-black leading-tight drop-shadow-lg">{meta.title}</h2>
//       <p className="mt-3 text-sm opacity-60 max-w-xs">{meta.description}</p>
//       <div className="mt-8 flex gap-1.5">
//         {[0, 1, 2].map(i => (
//           <div key={i} className="w-2 h-2 bg-white/60 rounded-full"
//             style={{ animation: `dotPulse 1s ${i * 0.2}s ease-in-out infinite` }} />
//         ))}
//       </div>
//     </div>
//   );
// }

// function CompletedScreen({ gameId, onClose }: { gameId: GameId; onClose: () => void }) {
//   const meta = GAME_META[gameId];
//   return (
//     <div className={`flex-1 flex flex-col items-center justify-center bg-gradient-to-br ${meta.gradient} text-white p-10 text-center`}>
//       <div className="text-6xl mb-4">✅</div>
//       <p className="text-xs font-black tracking-[0.3em] uppercase opacity-70 mb-2">Completed</p>
//       <h2 className="text-3xl font-black mb-3">{meta.title}</h2>
//       <p className="text-sm opacity-70 mb-8">Head to the next marker to find your next challenge!</p>
//       <button
//         onClick={onClose}
//         className="px-8 py-4 bg-white/20 hover:bg-white/30 rounded-full font-black text-sm tracking-widest uppercase backdrop-blur transition-all border border-white/30"
//       >
//         Back to Map →
//       </button>
//     </div>
//   );
// }

// interface MarkerGameOverlayProps {
//   firestoreDocId: string;
//   open: boolean;
//   onClose: () => void;
//   onComplete?: () => void;
// }

// export function MarkerGameOverlay({ firestoreDocId, open, onClose, onComplete }: MarkerGameOverlayProps) {
//   const { getGameForDoc, markComplete, isCompleted } = useGameAssignment();
//   const [phase, setPhase] = useState<'splash' | 'playing' | 'done'>('splash');
//   const splashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

//   const rawGameId = getGameForDoc(firestoreDocId);

//   const gameId: GameId = ALL_GAME_IDS.includes(rawGameId)
//     ? rawGameId
//     : (() => {
//       try {
//         const stored = sessionStorage.getItem('yuwa_doc_assignment');
//         if (stored) {
//           const parsed = JSON.parse(stored);
//           delete parsed[firestoreDocId];
//           sessionStorage.setItem('yuwa_doc_assignment', JSON.stringify(parsed));
//         }
//       } catch { }
//       return ALL_GAME_IDS[0];
//     })();

//   const meta = GAME_META[gameId];
//   const alreadyCompleted = isCompleted(firestoreDocId);

//   useEffect(() => {
//     if (!open) return;
//     if (alreadyCompleted) {
//       setPhase('done');
//     } else {
//       setPhase('splash');
//       splashTimer.current = setTimeout(() => setPhase('playing'), 1800);
//     }
//     return () => { if (splashTimer.current) clearTimeout(splashTimer.current); };
//   }, [open, alreadyCompleted]);

//   if (!open) return null;

//   const handleGameComplete = () => {
//     markComplete(firestoreDocId);
//     onComplete?.();
//     setPhase('done');
//     // ── Notify the map marker component to re-read sessionStorage and go green ──
//     // Inside your MiniGame completion logic
//     window.dispatchEvent(new CustomEvent('yuwa:game-completed', {
//       detail: { docId: firestoreDocId }
//     }));
//   };

//   const handleClose = () => onClose();

//   return (
//     <>
//       <div
//         className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden"
//         style={{ animation: 'slideUp 0.38s cubic-bezier(0.32,0.72,0,1)' }}
//       >
//         {/* Header */}
//         <header className="shrink-0 flex items-center gap-3 px-4 py-3 bg-white/95 backdrop-blur border-b border-slate-100">
//           <button
//             onClick={handleClose}
//             className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-base transition-all"
//             aria-label="Close"
//           >
//             ✕
//           </button>

//           <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${meta.gradient} text-white text-xs font-black shadow`}>
//             <span>{meta.emoji}</span>
//             <span>{meta.title}</span>
//           </div>

//           {alreadyCompleted && (
//             <span className="ml-auto text-[9px] font-black tracking-widest text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase">
//               ✅ Done
//             </span>
//           )}
//         </header>

//         {/* Content */}
//         <div className="flex-1 overflow-y-auto flex flex-col">
//           {phase === 'splash' && <GameSplash gameId={gameId} />}
//           {phase === 'playing' && (
//             <ActiveGame id={gameId} onComplete={handleGameComplete} onClose={handleClose} />
//           )}
//           {phase === 'done' && (
//             <CompletedScreen gameId={gameId} onClose={handleClose} />
//           )}
//         </div>
//       </div>

//       <style>{`
//         @keyframes slideUp {
//           from { transform: translateY(100%); opacity: 0.5; }
//           to   { transform: translateY(0);    opacity: 1; }
//         }
//         @keyframes popIn {
//           from { transform: scale(0.3); opacity: 0; }
//           to   { transform: scale(1);   opacity: 1; }
//         }
//         @keyframes dotPulse {
//           0%, 100% { opacity: 0.3; transform: scale(0.8); }
//           50%       { opacity: 1;   transform: scale(1.2); }
//         }
//       `}</style>
//     </>
//   );
// }

// export default MarkerGameOverlay;

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameAssignment, GAME_META, ALL_GAME_IDS, type GameId } from './Usegameassignment';

import ColorHunt from './color_finder/page';
import YuwaTravelCamera from './Yuwaincamera/page';
import DailyQuest from './itemscan/page';

// Games that manage their own inline success screen.
const SELF_HANDLED_GAMES: GameId[] = ['yuwatravel', 'colorhunt', 'dailyquest'];

function ActiveGame({
  id,
  onComplete,
  onClose,
}: {
  id: GameId;
  onComplete: () => void;
  onClose: () => void;
}) {
  switch (id) {
    case 'colorhunt': return <ColorHunt onComplete={onComplete} onClose={onClose} />;
    case 'yuwatravel': return <YuwaTravelCamera onComplete={onComplete} onClose={onClose} />;

    case 'dailyquest': return <DailyQuest onComplete={onComplete} onClose={onClose} />;
  }
}

function GameSplash({ gameId }: { gameId: GameId }) {
  const meta = GAME_META[gameId];
  return (
    <div className={`flex-1 flex flex-col items-center justify-center bg-gradient-to-br ${meta.gradient} text-white p-10 text-center`}>
      <div className="text-7xl mb-6 drop-shadow-lg" style={{ animation: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>
        {meta.emoji}
      </div>
      <p className="text-xs font-black tracking-[0.3em] uppercase opacity-70 mb-3">Your challenge</p>
      <h2 className="text-4xl font-black leading-tight drop-shadow-lg">{meta.title}</h2>
      <p className="mt-3 text-sm opacity-60 max-w-xs">{meta.description}</p>
      <div className="mt-8 flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-2 h-2 bg-white/60 rounded-full"
            style={{ animation: `dotPulse 1s ${i * 0.2}s ease-in-out infinite` }} />
        ))}
      </div>
    </div>
  );
}

function CompletedScreen({ gameId, onClose }: { gameId: GameId; onClose: () => void }) {
  const meta = GAME_META[gameId];
  return (
    <div className={`flex-1 flex flex-col items-center justify-center bg-gradient-to-br ${meta.gradient} text-white p-10 text-center`}>
      <div className="text-6xl mb-4">✅</div>
      <p className="text-xs font-black tracking-[0.3em] uppercase opacity-70 mb-2">Completed</p>
      <h2 className="text-3xl font-black mb-3">{meta.title}</h2>
      <p className="text-sm opacity-70 mb-8">Head to the next marker to find your next challenge!</p>
      <button
        onClick={onClose}
        className="px-8 py-4 bg-white/20 hover:bg-white/30 rounded-full font-black text-sm tracking-widest uppercase backdrop-blur transition-all border border-white/30"
      >
        Back to Map →
      </button>
    </div>
  );
}

interface MarkerGameOverlayProps {
  firestoreDocId: string;
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function MarkerGameOverlay({ firestoreDocId, open, onClose, onComplete }: MarkerGameOverlayProps) {
  const { getGameForDoc, markComplete, isCompleted } = useGameAssignment();
  
  // 1. Change initial state to splash, don't calculate here
  const [phase, setPhase] = useState<'splash' | 'playing' | 'done'>('splash');
  const splashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rawGameId = getGameForDoc(firestoreDocId);
  const gameId: GameId = ALL_GAME_IDS.includes(rawGameId) ? rawGameId : ALL_GAME_IDS[0];
  const meta = GAME_META[gameId];

  // 2. This effect must run every time 'open' becomes true
  useEffect(() => {
    if (!open) return;

    // Direct check: Does the hook/sessionStorage think this is done?
    const checkIsDone = isCompleted(firestoreDocId);

    if (checkIsDone) {
      setPhase('done');
    } else {
      // RESET EVERYTHING for a fresh game
      setPhase('splash');
      if (splashTimer.current) clearTimeout(splashTimer.current);
      splashTimer.current = setTimeout(() => setPhase('playing'), 1800);
    }

    return () => { if (splashTimer.current) clearTimeout(splashTimer.current); };
  }, [open, firestoreDocId, isCompleted]); // Dependencies are key here

  if (!open) return null;

  const handleGameComplete = () => {
    markComplete(firestoreDocId);
    onComplete?.();
    setPhase('done');
    // ── Notify the map marker component to re-read sessionStorage and go green ──
    // Inside your MiniGame completion logic
    window.dispatchEvent(new CustomEvent('yuwa:game-completed', {
      detail: { docId: firestoreDocId }
    }));
  };

  const handleClose = () => onClose();

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden"
        style={{ animation: 'slideUp 0.38s cubic-bezier(0.32,0.72,0,1)' }}
      >
        {/* Header */}
<header className="shrink-0 flex items-center gap-3 px-4 py-3 bg-white/95 backdrop-blur border-b border-slate-100">
  <button
    onClick={handleClose}
    className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-base transition-all"
    aria-label="Close"
  >
    ✕
  </button>

  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${meta.gradient} text-white text-xs font-black shadow`}>
    <span>{meta.emoji}</span>
    <span>{meta.title}</span>
  </div>

  {/* FIXED: Check if phase is 'done' instead of using alreadyCompleted */}
  {phase === 'done' && (
    <span className="ml-auto text-[9px] font-black tracking-widest text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase">
      ✅ Done
    </span>
  )}
</header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {phase === 'splash' && <GameSplash gameId={gameId} />}
          {phase === 'playing' && (
            <ActiveGame id={gameId} onComplete={handleGameComplete} onClose={handleClose} />
          )}
          {phase === 'done' && (
            <CompletedScreen gameId={gameId} onClose={handleClose} />
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0.5; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes popIn {
          from { transform: scale(0.3); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.2); }
        }
      `}</style>
    </>
  );
}

export default MarkerGameOverlay;