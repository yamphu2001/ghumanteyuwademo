"use client";
import { useEffect, useState, useRef } from 'react';
import maplibregl from 'maplibre-gl';

interface MissionProps {
  map: maplibregl.Map | null;
  playerPosition: [number, number];
}

const SPAWN_POINTS: [number, number][] = [
  [85.307247, 27.703646], [85.305949, 27.703854],
  [85.307694, 27.705185], [85.308333, 27.705221]
];

const getDistance = (p1: [number, number], p2: [number, number]) => {
  const dy = (p1[1] - p2[1]) * 111320;
  const dx = (p1[0] - p2[0]) * 40075000 * Math.cos(p1[1] * Math.PI / 180) / 360;
  return Math.sqrt(dx * dx + dy * dy);
};

const LemonzaaMission: React.FC<MissionProps> = ({ map, playerPosition }) => {
  const [missionState, setMissionState] = useState<'IDLE' | 'SPAWNING' | 'ACTIVE' | 'CLAIMED'>('IDLE');
  const [targetPos, setTargetPos] = useState<[number, number] | null>(null);
  const [isNear, setIsNear] = useState(false);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const handleSpawnTrigger = () => {
    setMissionState('SPAWNING');
    
    setTimeout(() => {
      if (!map) return;
      const spawnPos = SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)];
      setTargetPos(spawnPos);

      const el = document.createElement('div');
      el.className = "cursor-pointer";
      
      // Fixed: Using height: auto and width: 45px to prevent squishing
      // Added a 'float' animation style via CSS string
      el.innerHTML = `
        <style>
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
          .lemon-container {
            animation: float 2s ease-in-out infinite;
          }
        </style>
        <div class="relative lemon-container">
          <div class="absolute inset-0 w-16 h-16 -left-2 -top-2 bg-red-500/30 rounded-full animate-ping border-2 border-red-600"></div>
          <img src="/lemonzaa.png" style="width: 20px; height: auto; display: block; filter: drop-shadow(0px 0px 10px white);" />
        </div>
      `;

      markerRef.current = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat(spawnPos)
        .addTo(map);

      setMissionState('ACTIVE');
    }, 2000);
  };

  useEffect(() => {
    if (missionState === 'ACTIVE' && targetPos) {
      const dist = getDistance(playerPosition, targetPos);
      setIsNear(dist < 8);
    }
  }, [playerPosition, targetPos, missionState]);

  return (
    <>
      {/* 1. SPAWN BUTTON */}
      {missionState === 'IDLE' && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50">
          <button 
            onClick={handleSpawnTrigger}
            className="bg-red-600 text-white border-4 border-black px-10 py-5 font-black text-2xl italic uppercase shadow-[10px_10px_0px_0px_rgba(255,255,255,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
          >
            Spawn Nimbu Pani
          </button>
        </div>
      )}

      {/* 2. SPAWNING NOTIFICATION */}
      {missionState === 'SPAWNING' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-red-600/90">
           <h2 className="text-white text-6xl font-black italic uppercase text-center leading-none animate-pulse">
             REFRESHMENTS<br/>SPAWNING...
           </h2>
        </div>
      )}

      {/* 4. CLAIM BUTTON (When Near) */}
      {isNear && missionState === 'ACTIVE' && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50">
          <button 
            onClick={() => {
               setMissionState('CLAIMED');
               markerRef.current?.remove();
            }}
            className="bg-white text-black border-4 border-black px-12 py-6 font-black text-3xl italic uppercase shadow-[10px_10px_0px_0px_rgba(255,0,0,1)] animate-bounce"
          >
            CLAIM NOW
          </button>
        </div>
      )}

      {/* 5. SUCCESS POPUP */}
      {missionState === 'CLAIMED' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
          <div className="bg-white border-[8px] border-black p-10 text-center shadow-[15px_15px_0px_0px_rgba(255,0,0,1)] w-full max-w-lg">
            <h2 className="text-6xl font-black italic uppercase mb-4 text-red-600">GREAT!</h2>
            <p className="text-xl font-bold uppercase mb-8">You Earned Nimbu Pani!<br/>Claim it in the stall.</p>
            <button 
              onClick={() => setMissionState('IDLE')}
              className="bg-black text-white w-full py-4 font-black uppercase text-xl hover:bg-red-600 transition-colors"
            >
              MISSION COMPLETE
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default LemonzaaMission;