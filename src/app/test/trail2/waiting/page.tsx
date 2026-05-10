"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WaitingPage() {
  const router = useRouter();
  
  // Example Group Name from your 100+ backend list
  const groupName = "Mustang"; 
  const totalPlayers = 10;
  const joinedPlayers = 8; 
  const remainingPlayers = totalPlayers - joinedPlayers;

  const [isReady, setIsReady] = useState(false);

  const handleStart = () => {
    setIsReady(true);
    // Logic to sync the exact start time for the race
    router.push("/trialmap");
  };

  return (
    <div className="page">
      <div className="topo-overlay"></div>
      
      <div className="container">
        {/* The "Heat" or Group Identity */}
        <div className="race-header">
          <div className="flag-icon">🏁</div>
          <div className="group-info">
            <span className="label">CURRENT BATCH</span>
            <h2 className="group-name">GROUP {groupName.toUpperCase()}</h2>
          </div>
        </div>
        
        <div className="mascot-section">
          <img 
            src="/images/trail/waiting/wait.png" 
            alt="Mascot checking watch" 
            className="mascot-img"
          />
        </div>

        {/* The Starting Grid Card */}
        <div className="starting-grid-card">
          <div className="grid-status">
            <span className="live-pulse"></span>
            FORMING STARTING GRID
          </div>
          
          <div className="countdown-display">
            <div className="big-number">{remainingPlayers}</div>
            <p className="sub-text">MORE RACERS TO START</p>
          </div>

          {/* Visual slots for the 10 players */}
          <div className="player-slots">
            {[...Array(totalPlayers)].map((_, i) => (
              <div 
                key={i} 
                className={`slot ${i < joinedPlayers ? 'filled' : 'empty'}`}
              ></div>
            ))}
          </div>
          <p className="total-stat"><b>{joinedPlayers}</b> of <b>10</b> Explorers Ready</p>
        </div>

        {/* Pro-Tip for the Race */}
        <div className="race-tip">
          <p><strong>RACE RULE:</strong> Time starts when the flag waves. Time stops only when you <b>Scan the Finish QR</b> at the final landmark!</p>
        </div>

        <div className="action-zone">
          <button
            className={`launch-btn ${remainingPlayers === 0 ? 'fire-ready' : ''}`}
            disabled={remainingPlayers > 0 || isReady}
            onClick={handleStart}
          >
            {remainingPlayers > 0 ? "WAITING FOR GRID..." : "START THE RACE"}
          </button>
          
          <div className="help-footer" onClick={() => alert("Contacting Desk")}>
            Need gear help? <span>Talk to Front Desk</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .page { 
          min-height: 100vh; 
          display: flex; 
          justify-content: center; 
          align-items: center; 
          background: #fdfbf7; 
          position: relative;
          font-family: 'Inter', sans-serif;
        }

        .topo-overlay {
          position: absolute;
          inset: 0;
          opacity: 0.05;
          background-image: url("https://www.transparenttextures.com/patterns/topography.png");
          pointer-events: none;
        }

        .container { 
          width: 100%;
          max-width: 360px; 
          text-align: center; 
          z-index: 10; 
          padding: 20px;
        }

        .race-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          margin-bottom: 20px;
          background: white;
          padding: 10px 20px;
          border-radius: 20px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        .flag-icon { font-size: 24px; }
        .group-info { text-align: left; }
        .label { font-size: 10px; font-weight: 800; color: #aaa; letter-spacing: 1px; }
        .group-name { font-size: 18px; font-weight: 900; margin: 0; color: #1a1a1a; }

        .mascot-section { width: 140px; margin: 0 auto; }
        .mascot-img { width: 100%; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.1)); animation: float 3s ease-in-out infinite; }

        .starting-grid-card {
          background: white;
          border-radius: 35px;
          padding: 30px 20px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.08);
          margin: 20px 0;
          border: 1px solid #f0f0f0;
        }

        .grid-status {
          font-size: 11px;
          font-weight: 900;
          color: #ff2d2d;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-bottom: 15px;
        }
        .live-pulse { width: 6px; height: 6px; background: #ff2d2d; border-radius: 50%; animation: blink 1s infinite; }

        .big-number { font-size: 90px; font-weight: 950; color: #1a1a1a; line-height: 1; }
        .sub-text { font-size: 12px; font-weight: 700; color: #bbb; letter-spacing: 1.5px; }

        /* Player Grid Dots */
        .player-slots {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin: 25px 0 10px;
        }
        .slot {
          width: 12px;
          height: 12px;
          border-radius: 4px;
          background: #eee;
          transition: 0.3s;
        }
        .slot.filled {
          background: #ff2d2d;
          transform: scale(1.1);
          box-shadow: 0 0 10px rgba(255, 45, 45, 0.4);
        }

        .total-stat { font-size: 13px; color: #666; font-weight: 600; }

        .race-tip {
          background: #1a1a1a;
          color: rgba(255,255,255,0.8);
          padding: 15px;
          border-radius: 20px;
          font-size: 12px;
          line-height: 1.4;
          margin-bottom: 25px;
        }
        .race-tip b { color: #ff2d2d; }

        .launch-btn {
          width: 100%;
          padding: 22px;
          border-radius: 22px;
          border: none;
          background: #eee;
          color: #aaa;
          font-weight: 900;
          font-size: 16px;
          transition: 0.3s;
        }
        .launch-btn.fire-ready {
          background: #ff2d2d;
          color: white;
          cursor: pointer;
          box-shadow: 0 10px 20px rgba(255, 45, 45, 0.3);
          animation: pulse-grow 2s infinite;
        }

        .help-footer { margin-top: 15px; font-size: 12px; color: #999; cursor: pointer; }
        .help-footer span { color: #ff2d2d; font-weight: 700; text-decoration: underline; }

        @keyframes float { 50% { transform: translateY(-8px); } }
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes pulse-grow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
}