

// "use client";

// import React, { useEffect, useState } from "react";
// import styles from "./Popup.module.css";

// export interface PopupData {
//   id: string;
//   name: string;
//   image: string;
//   popupImage?: string;
//   description?: string;
//   points?: number;
//   isUnlocked: boolean;
// }

// export default function Popup({
//   popup,
//   onClose,
// }: {
//   popup: PopupData | null;
//   onClose: () => void;
// }) {
//   const [countdown, setCountdown] = useState(60);

//   useEffect(() => {
//     if (!popup?.isUnlocked) return;
//     setCountdown(60);

//     const interval = setInterval(() => {
//       setCountdown((prev) => {
//         if (prev <= 1) {
//           clearInterval(interval);
//           // FIX: Wrap in setTimeout to prevent React state conflict
//           setTimeout(() => {
//             onClose();
//           }, 0);
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [popup, onClose]); // Added onClose to dependencies

//   if (!popup) return null;

//   const progress = (60 - countdown) / 60;
//   const R = 10;
//   const circ = 2 * Math.PI * R;
//   const offset = circ - progress * circ;

//   return (
//     <div className={styles.overlay} onClick={onClose}>
//       <div className={styles.popupContent} onClick={(e) => e.stopPropagation()}>
//         <button className={styles.closeBtn} onClick={onClose}>✕</button>

//         {!popup.isUnlocked ? (
//           <div className={styles.lockedView}>
//             <div className={styles.lockIconWrap}>
//               <svg viewBox="0 0 24 24" className={styles.lockIcon} fill="none" stroke="currentColor" strokeWidth="2">
//                 <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
//                 <path d="M7 11V7a5 5 0 0 1 10 0v4" />
//               </svg>
//             </div>
//             <h3 className={styles.lockedTitle}>{popup.name}</h3>
//             <p className={styles.lockedMsg}>You're too far away. Move closer to unlock this location.</p>
//             <div className={styles.lockedBadge}>📍 Out of range</div>
//           </div>
//         ) : (
//           <div className={styles.unlockedView}>
//             <div className={styles.heroWrap}>
//               {popup.popupImage ? (
//                 <img src={popup.popupImage} className={styles.heroImage} alt={popup.name} />
//               ) : (
//                 <div className={styles.heroFallback}>
//                   <img src={popup.image} className={styles.heroFallbackIcon} alt="" />
//                 </div>
//               )}
//               <div className={styles.heroBadge}>
//                 <span className={styles.heroBadgeDot} />
//                 Unlocked
//               </div>
//             </div>

//             <div className={styles.unlockedBody}>
//               <h2 className={styles.unlockedTitle}>{popup.name}</h2>
//               <p className={styles.unlockedDesc}>
//                 {popup.description || "You've successfully unlocked this location!"}
//               </p>
//               {popup.points != null && popup.points > 0 && (
//                 <div className={styles.pointsBadge}>
//                   <span className={styles.pointsStar}>⭐</span>
//                   <span className={styles.pointsValue}>+{popup.points}</span>
//                   <span className={styles.pointsLabel}>points earned</span>
//                 </div>
//               )}
//             </div>

//             <div className={styles.actionRow}>
//               <div className={styles.skipTimerGroup}>
//                 <button className={styles.skipBtn} onClick={onClose}>
//                   Skip
//                 </button>
//                 <div className={styles.countdownWrap} title={`Auto-closes in ${countdown}s`}>
//                   <svg viewBox="0 0 24 24" className={styles.countdownRing}>
//                     <circle cx="12" cy="12" r={R} className={styles.countdownTrack} />
//                     <circle
//                       cx="12" cy="12" r={R}
//                       className={styles.countdownFill}
//                       strokeDasharray={circ}
//                       strokeDashoffset={offset}
//                     />
//                   </svg>
//                   <span className={styles.countdownNum}>{countdown}</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }


"use client";

import React, { useEffect, useState } from "react";
import styles from "./Popup.module.css";

export interface PopupData {
  id: string;
  name: string;
  image: string;
  popupImage?: string;
  description?: string;
  points?: number;
  isUnlocked: boolean;
}

export default function Popup({
  popup,
  onClose,
}: {
  popup: PopupData | null;
  onClose: () => void;
}) {
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!popup?.isUnlocked) {
      setCountdown(60);
      return;
    }

    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [popup?.id, popup?.isUnlocked, onClose]);

  if (!popup) return null;

  const progress = (60 - countdown) / 60;
  const R = 10;
  const circ = 2 * Math.PI * R;
  const offset = circ - progress * circ;

  return (
    <div 
      className={styles.overlay} 
      onPointerDown={(e) => e.stopPropagation()} 
      onClick={onClose}
    >
      <div className={styles.popupContent} onClick={(e) => e.stopPropagation()}>
        {/* CLOSE BUTTON */}
        <button 
          className={styles.closeBtn} 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
        >
          ✕
        </button>

        {!popup.isUnlocked ? (
          <div className={styles.lockedView}>
            <div className={styles.lockIconWrap}>
              <svg viewBox="0 0 24 24" className={styles.lockIcon} fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 className={styles.lockedTitle}>{popup.name}</h3>
            <p className={styles.lockedMsg}>You're too far away. Move closer to unlock this location.</p>
            <div className={styles.lockedBadge}>📍 Out of range</div>
          </div>
        ) : (
          <div className={styles.unlockedView}>
            <div className={styles.heroWrap}>
              {popup.popupImage ? (
                <img src={popup.popupImage} className={styles.heroImage} alt={popup.name} />
              ) : (
                <div className={styles.heroFallback}>
                  <img src={popup.image} className={styles.heroFallbackIcon} alt="" />
                </div>
              )}
              <div className={styles.heroBadge}>
                <span className={styles.heroBadgeDot} />
                Unlocked
              </div>
            </div>

            <div className={styles.unlockedBody}>
              <h2 className={styles.unlockedTitle}>{popup.name}</h2>
              <p className={styles.unlockedDesc}>
                {popup.description || "You've successfully unlocked this location!"}
              </p>
              {popup.points != null && popup.points > 0 && (
                <div className={styles.pointsBadge}>
                  <span className={styles.pointsStar}>⭐</span>
                  <span className={styles.pointsValue}>+{popup.points}</span>
                  <span className={styles.pointsLabel}>points earned</span>
                </div>
              )}
            </div>

            <div className={styles.actionRow}>
              <div className={styles.skipTimerGroup}>
                {/* SKIP BUTTON */}
                <button 
                  className={styles.skipBtn} 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose();
                  }}
                >
                  Skip
                </button>
                <div className={styles.countdownWrap}>
                  <svg viewBox="0 0 24 24" className={styles.countdownRing}>
                    <circle cx="12" cy="12" r={R} className={styles.countdownTrack} />
                    <circle
                      cx="12" cy="12" r={R}
                      className={styles.countdownFill}
                      strokeDasharray={circ}
                      strokeDashoffset={offset}
                    />
                  </svg>
                  <span className={styles.countdownNum}>{countdown}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}