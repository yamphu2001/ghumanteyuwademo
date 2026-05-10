
// "use client";

// import React, { useEffect, useState } from 'react';
// import { createPortal } from 'react-dom';
// import styles from './popup.module.css';
// import { LocationData } from './logic';
// import { MarkerGameOverlay } from '@/app/events/basantapur/MiniGames/page';
// import { useGameAssignment, GAME_META } from '@/app/events/basantapur/MiniGames/Usegameassignment';

// interface PopupProps {
//   marker: LocationData;
//   onClose: () => void;
//   isNearby: boolean;
//   /**
//    * Pass the Firebase-hydrated completion state from SpecialMarkers.
//    * This is the authoritative "done" flag — it resets correctly when
//    * an admin deletes the marker's entry from eventsProgress in Firebase.
//    *
//    * If omitted, falls back to isCompleted() from useGameAssignment
//    * (reads userProgress — a separate path not cleared by admin deletions).
//    */
//   isAlreadyDone?: boolean;
// }

// const COMPLETED_MESSAGES = [
//   "You already crushed this one! ",
//   "Been there, done that! Keep going! ",
//   "This spot is conquered. Find the next one! ",
//   "Challenge complete! Yuwa is proud of you! ",
// ];

// export const MarkerPopup = ({ marker, onClose, isNearby, isAlreadyDone }: PopupProps) => {
//   const [mounted, setMounted] = useState(false);
//   const [showGame, setShowGame] = useState(false);
//   const [justCompleted, setJustCompleted] = useState(false);

//   const { isCompleted, getGameForDoc } = useGameAssignment();

//   // isAlreadyDone prop (from Firebase hydration) is the authoritative source.
//   // Fall back to isCompleted() only if the prop is not provided, so this
//   // component can still work standalone without the prop if needed.
//   const done = isAlreadyDone !== undefined ? isAlreadyDone : isCompleted(marker.id);

//   const completedMessage = COMPLETED_MESSAGES[
//     Math.abs(marker.id.charCodeAt(0) + marker.id.charCodeAt(1)) % COMPLETED_MESSAGES.length
//   ];

//   const assignedGame = (done || justCompleted) ? getGameForDoc(marker.id) : null;
//   const gameMeta = assignedGame ? GAME_META[assignedGame] : null;

//   useEffect(() => {
//     setMounted(true);
//     document.body.style.overflow = 'hidden';
//     return () => { document.body.style.overflow = 'unset'; };
//   }, []);

//   if (!mounted) return null;

//   const handleGameComplete = () => {
//     setShowGame(false);
//     setJustCompleted(true);
//   };

//   const isAlreadyCompletedView = done && !justCompleted;

//   return createPortal(
//     <>
//       <div
//         className={styles.fullscreenOverlay}
//         onClick={showGame ? undefined : onClose}
//         onMouseDown={(e) => e.stopPropagation()}
//         style={{ display: showGame ? 'none' : undefined }}
//       >
//         <div
//           className={styles.fullscreenContent}
//           onClick={(e) => e.stopPropagation()}
//         >

//           {/* ── ALREADY COMPLETED ─────────────────────────────── */}
//           {isAlreadyCompletedView && (
//             <div className={styles.popupCard}>
//               <div className={styles.successStripe} />
//               <div style={{ padding: '24px 20px 8px', textAlign: 'center' }}>
//                 {marker.points ? (
//                   <div style={{
//                     display: 'inline-block',
//                     background: '#f3f4f6',
//                     padding: '4px 12px',
//                     borderRadius: '999px',
//                     fontSize: '11px',
//                     fontWeight: 700,
//                     color: '#4b5563',
//                     marginBottom: '8px'
//                   }}>
//                     💰 {marker.points} Points Earned
//                   </div>
//                 ) : null}
//                 <div className={styles.successBadge}></div>
//                 <h2 className={styles.successTitle}>{marker.name}</h2>
//                 <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>
//                   {completedMessage}
//                 </p>
//                 {gameMeta && (
//                   <div className={styles.gamePill}>
//                     <span style={{ fontSize: 16 }}>{gameMeta.emoji}</span>
//                     Completed: {gameMeta.title}
//                   </div>
//                 )}
//                 <div className={styles.nudgeBox}>
//                   <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
//                     Visit the other special markers on the map to complete all challenges!
//                   </p>
//                 </div>
//               </div>
//               <div className={styles.footerActions}>
//                 <button className={styles.backBtn} onClick={onClose} style={{ width: '100%' }}>
//                   Back to Map
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* ── JUST COMPLETED (this session) ─────────────────── */}
//           {justCompleted && (
//             <div className={styles.popupCard}>
//               <div className={styles.successStripe} />
//               <div style={{ padding: '24px 20px 16px', textAlign: 'center' }}>
//                 <div className={styles.successBadge} style={{ fontSize: 36 }}>🎉</div>
//                 <h2 className={styles.successTitle} style={{ color: '#15803d', marginBottom: 6 }}>
//                   Challenge Complete!
//                 </h2>
//                 {marker.points ? (
//                   <div style={{
//                     background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
//                     border: '1px solid #f59e0b',
//                     borderRadius: '12px',
//                     padding: '10px',
//                     margin: '10px 0',
//                     boxShadow: '0 2px 4px rgba(245,158,11,0.1)'
//                   }}>
//                     <span style={{ fontSize: 12, color: '#92400e', fontWeight: 600, display: 'block' }}>REWARD</span>
//                     <span style={{ fontSize: 20, fontWeight: 900, color: '#b45309' }}>+{marker.points} Points</span>
//                   </div>
//                 ) : null}
//                 <p style={{ fontSize: 14, color: '#374151', fontWeight: 600, marginBottom: 4 }}>
//                   {marker.name}
//                 </p>
//                 <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
//                   You nailed it! This marker is now unlocked on the map.
//                 </p>
//                 {gameMeta && (
//                   <div className={styles.gamePill}>
//                     <span style={{ fontSize: 16 }}>{gameMeta.emoji}</span>
//                     {gameMeta.title} — completed!
//                   </div>
//                 )}
//                 <div className={styles.nudgeBox} style={{ marginTop: 14 }}>
//                   <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
//                     Keep exploring — visit the other markers to complete all challenges!
//                   </p>
//                 </div>
//               </div>
//               <div className={styles.footerActions}>
//                 <button className={styles.backBtn} onClick={onClose} style={{ width: '100%' }}>
//                   Back to Map
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* ── LOCKED — player is too far away ───────────────── */}
//           {!isAlreadyCompletedView && !justCompleted && !isNearby && (
//             <div className={styles.popupCard}>
//               <div className={styles.warningStripe} />

//               <div style={{ padding: '24px 20px 8px', textAlign: 'center' }}>
//                 <div style={{
//                   width: 64, height: 64,
//                   borderRadius: '50%',
//                   background: 'linear-gradient(135deg, #6b7280, #374151)',
//                   display: 'flex', alignItems: 'center', justifyContent: 'center',
//                   fontSize: 28,
//                   margin: '0 auto 16px',
//                   boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
//                 }}>
//                   🔒
//                 </div>

//                 <h2 style={{
//                   fontSize: 18, fontWeight: 900, color: '#111827',
//                   marginBottom: 6, letterSpacing: '-0.3px',
//                 }}>
//                   {marker.name}
//                 </h2>

//                 <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16, lineHeight: 1.6 }}>
//                   You're too far away to unlock this challenge.
//                 </p>

//                 <div style={{
//                   display: 'inline-flex', alignItems: 'center', gap: 8,
//                   background: '#fef3c7', border: '1.5px solid #fcd34d',
//                   borderRadius: 999, padding: '8px 16px', marginBottom: 16,
//                   fontSize: 12, fontWeight: 700, color: '#92400e',
//                 }}>
//                   📍 Get within 50 m of this marker to play
//                 </div>

//                 <div className={styles.nudgeBox}>
//                   <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
//                     🗺️ Walk closer to <strong>{marker.name}</strong> and tap it again to unlock the challenge!
//                   </p>
//                 </div>
//               </div>

//               <div className={styles.footerActions}>
//                 <button className={styles.backBtn} onClick={onClose} style={{ width: '100%' }}>
//                   Back to Map
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* ── UNLOCKED & NEARBY — normal playable popup ─────── */}
//           {!isAlreadyCompletedView && !justCompleted && isNearby && (
//             <div className={styles.popupCard}>
//               <div className={styles.popupHeader}>
//                 <div className={styles.warningStripe} />
//                 <h2 className={styles.popupTitle}>{marker.name}</h2>
//               </div>
//               <div className={styles.contentBody}>
//                 {marker.points ? (
//                   <p style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', marginBottom: 8 }}>
//                     🎁 Reward: {marker.points} Points
//                   </p>
//                 ) : null}
//                 <p className={styles.warningText}>{marker.popupText}</p>
//               </div>
//               <div className={styles.footerActions}>
//                 <button className={styles.backBtn} onClick={onClose}>
//                   Back to Map
//                 </button>
//                 <button
//                   className={styles.exploreBtn}
//                   onClick={() => setShowGame(true)}
//                 >
//                   Explore More
//                 </button>
//               </div>
//             </div>
//           )}

//         </div>
//       </div>

//       {/* Game overlay — only when nearby, not done, game open */}
//       {!done && !justCompleted && isNearby && (
//         <MarkerGameOverlay
//           firestoreDocId={marker.id}
//           open={showGame}
//           onClose={() => setShowGame(false)}
//           onComplete={handleGameComplete}
//         />
//       )}
//     </>,
//     document.body
//   );
// };


"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './popup.module.css';
import { LocationData } from './logic';
import { MarkerGameOverlay } from '@/app/MiniGames/page';
import { useGameAssignment, GAME_META } from '@/app/MiniGames/Usegameassignment';

interface PopupProps {
  marker: LocationData;
  onClose: () => void;
  isNearby: boolean;
  /**
   * Pass the Firebase-hydrated completion state from SpecialMarkers.
   * This is the authoritative "done" flag — it resets correctly when
   * an admin deletes the marker's entry from eventsProgress in Firebase.
   *
   * If omitted, falls back to isCompleted() from useGameAssignment
   * (reads userProgress — a separate path not cleared by admin deletions).
   */
  isAlreadyDone?: boolean;
}

const COMPLETED_MESSAGES = [
  "You already crushed this one! ",
  "Been there, done that! Keep going! ",
  "This spot is conquered. Find the next one! ",
  "Challenge complete! Yuwa is proud of you! ",
];

export const MarkerPopup = ({ marker, onClose, isNearby, isAlreadyDone }: PopupProps) => {
  const [mounted, setMounted] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const { isCompleted, getGameForDoc } = useGameAssignment();

  // isAlreadyDone prop (from Firebase hydration) is the authoritative source.
  // Fall back to isCompleted() only if the prop is not provided, so this
  // component can still work standalone without the prop if needed.
  const done = isAlreadyDone !== undefined ? isAlreadyDone : isCompleted(marker.id);

  const completedMessage = COMPLETED_MESSAGES[
    Math.abs(marker.id.charCodeAt(0) + marker.id.charCodeAt(1)) % COMPLETED_MESSAGES.length
  ];

  const assignedGame = (done || justCompleted) ? getGameForDoc(marker.id) : null;
  const gameMeta = assignedGame ? GAME_META[assignedGame] : null;

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  if (!mounted) return null;

  const handleGameComplete = () => {
    setJustCompleted(true);
    setShowGame(false);
    
  };

  const isAlreadyCompletedView = done && !justCompleted;

  return createPortal(
    <>
      <div
        className={styles.fullscreenOverlay}
        onClick={showGame ? undefined : onClose}
        onMouseDown={(e) => e.stopPropagation()}
        style={{ display: showGame ? 'none' : undefined }}
      >
        <div
          className={styles.fullscreenContent}
          onClick={(e) => e.stopPropagation()}
        >

          {/* ── ALREADY COMPLETED ─────────────────────────────── */}
          {isAlreadyCompletedView && (
            <div className={styles.popupCard}>
              <div className={styles.successStripe} />
              <div style={{ padding: '24px 20px 8px', textAlign: 'center' }}>
                {marker.points ? (
                  <div style={{
                    display: 'inline-block',
                    background: '#f3f4f6',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#4b5563',
                    marginBottom: '8px'
                  }}>
                    💰 {marker.points} Points Earned
                  </div>
                ) : null}
                <div className={styles.successBadge}></div>
                <h2 className={styles.successTitle}>{marker.name}</h2>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>
                  {completedMessage}
                </p>
                {gameMeta && (
                  <div className={styles.gamePill}>
                    <span style={{ fontSize: 16 }}>{gameMeta.emoji}</span>
                    Completed: {gameMeta.title}
                  </div>
                )}
                <div className={styles.nudgeBox}>
                  <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
                    Visit the other special markers on the map to complete all challenges!
                  </p>
                </div>
              </div>
              <div className={styles.footerActions}>
                <button className={styles.backBtn} onClick={onClose} style={{ width: '100%' }}>
                  Back to Map
                </button>
              </div>
            </div>
          )}

          {/* ── JUST COMPLETED (this session) ─────────────────── */}
         {justCompleted && (
  <div className={styles.popupCard}>
    <div className={styles.successStripe} />
    <div style={{ padding: '24px 20px 16px', textAlign: 'center' }}>
      <div className={styles.successBadge} style={{ fontSize: 36 }}>🎉</div>
      <h2 className={styles.successTitle}>Challenge Complete!</h2>
      {marker.points && (
         <div className={styles.pointsPill}>+{marker.points} Points Earned</div>
      )}
      <p>You nailed it! This marker is now unlocked on the map.</p>
      <button className={styles.backBtn} onClick={onClose} style={{ width: '100%' }}>
        Back to Map
      </button>
    </div>
  </div>
)}

          {/* ── LOCKED — player is too far away ───────────────── */}
          {!isAlreadyCompletedView && !justCompleted && !isNearby && (
            <div className={styles.popupCard}>
              <div className={styles.warningStripe} />

              <div style={{ padding: '24px 20px 8px', textAlign: 'center' }}>
                <div style={{
                  width: 64, height: 64,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6b7280, #374151)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28,
                  margin: '0 auto 16px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                }}>
                  🔒
                </div>

                <h2 style={{
                  fontSize: 18, fontWeight: 900, color: '#111827',
                  marginBottom: 6, letterSpacing: '-0.3px',
                }}>
                  {marker.name}
                </h2>

                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16, lineHeight: 1.6 }}>
                  You're too far away to unlock this challenge.
                </p>

                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: '#fef3c7', border: '1.5px solid #fcd34d',
                  borderRadius: 999, padding: '8px 16px', marginBottom: 16,
                  fontSize: 12, fontWeight: 700, color: '#92400e',
                }}>
                  📍 Get within 50 m of this marker to play
                </div>

                <div className={styles.nudgeBox}>
                  <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
                    🗺️ Walk closer to <strong>{marker.name}</strong> and tap it again to unlock the challenge!
                  </p>
                </div>
              </div>

              <div className={styles.footerActions}>
                <button className={styles.backBtn} onClick={onClose} style={{ width: '100%' }}>
                  Back to Map
                </button>
              </div>
            </div>
          )}

          {/* ── UNLOCKED & NEARBY — normal playable popup ─────── */}
          {!isAlreadyCompletedView && !justCompleted && isNearby && (
            <div className={styles.popupCard}>
              <div className={styles.popupHeader}>
                <div className={styles.warningStripe} />
                <h2 className={styles.popupTitle}>{marker.name}</h2>
              </div>
              <div className={styles.contentBody}>
                {marker.points ? (
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', marginBottom: 8 }}>
                    🎁 Reward: {marker.points} Points
                  </p>
                ) : null}
                <p className={styles.warningText}>{marker.popupText}</p>
              </div>
              <div className={styles.footerActions}>
                <button className={styles.backBtn} onClick={onClose}>
                  Back to Map
                </button>
                <button
                  className={styles.exploreBtn}
                  onClick={() => setShowGame(true)}
                >
                  Explore More
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Game overlay — only when nearby, not done, game open */}
      {!isAlreadyCompletedView && !justCompleted && isNearby && (
        <MarkerGameOverlay
        key={`${marker.id}-${done}`}
          firestoreDocId={marker.id}
          open={showGame}
          onClose={() => setShowGame(false)}
          onComplete={handleGameComplete}
        />
      )}
    </>,
    document.body
  );
};