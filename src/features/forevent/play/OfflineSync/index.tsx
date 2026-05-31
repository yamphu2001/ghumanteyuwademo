// 'use client';

// import { useState } from 'react';
// import localforage from 'localforage';

// export default function OfflineSync({ eventId }: { eventId: string }) {
//   const [status, setStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');

//   const downloadAssetsForOffline = async () => {
//     setStatus('syncing');
//     try {
//       // 1. Open the browser's Cache Storage
//       const cache = await caches.open('offline-map-assets');
      
//       // 2. Add structural layout assets to cache
//       await cache.addAll([
//         '/map-style.json',
//         // Add paths to your local fonts and sprites here if you have them
//       ]);

//       // 3. Define the critical tile coordinates for your event boundary
//       // Note: Replace these example strings with an array of actual file paths matching your local public/tiles folder
//       const tilesToCache = [
//         '/tiles/14/1234/5678.pbf',
//         '/tiles/14/1234/5679.pbf',
//       ];
//       await cache.addAll(tilesToCache);

//       setStatus('done');
//     } catch (err) {
//       console.error('Offline download failed:', err);
//       setStatus('error');
//     }
//   };

//   return (
//     <div className="p-4 bg-slate-900 text-white rounded-lg shadow-md my-2">
//       <h4>Offline Map Access</h4>
//       {status === 'idle' && (
//         <button 
//           onClick={downloadAssetsForOffline}
//           className="mt-2 bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-sm font-medium"
//         >
//           Prepare Offline Mode
//         </button>
//       )}
//       {status === 'syncing' && <p className="text-sm text-yellow-400 mt-2">Downloading map elements...</p>}
//       {status === 'done' && <p className="text-sm text-green-400 mt-2">✓ Game map is ready to play offline!</p>}
//       {status === 'error' && <p className="text-sm text-red-400 mt-2">⚠️ Failed downloading offline data.</p>}
//     </div>
//   );
// }



'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import localforage from 'localforage';

interface OfflineSyncProps {
  eventId: string;
  /** Tile paths for this event's arena. Generate these from your boundary bbox. */
  tilePaths?: string[];
}

type SyncStatus = 'idle' | 'checking' | 'syncing' | 'done' | 'error';

export default function OfflineSync({ eventId, tilePaths = [] }: OfflineSyncProps) {
  const [status, setStatus] = useState<SyncStatus>('checking');
  const [progress, setProgress] = useState(0); // 0–100

  // On mount: check if this event is already cached
  useEffect(() => {
    localforage.getItem(`boundary_${eventId}`).then((exists) => {
      setStatus(exists ? 'done' : 'idle');
    });
  }, [eventId]);

  const download = async () => {
    setStatus('syncing');
    setProgress(0);

    try {
      // ── Step 1: Boundary coordinates ──────────────────────────────────────
      const snap = await getDoc(doc(db, 'events', eventId, 'boundary', 'data'));
      if (snap.exists()) {
        const data = snap.data();
        if (data.boundaryCoords) {
          const boundary = data.boundaryCoords.map((p: { lat: number; lng: number }) => [p.lng, p.lat]);
          await localforage.setItem(`boundary_${eventId}`, boundary);
        }
      }
      setProgress(25);

      // ── Step 2: Map style + sprites/fonts ─────────────────────────────────
      const cache = await caches.open('offline-map-assets');

      const coreAssets = [
        '/map-style.json',
        '/Mascot.png',
      ].filter(Boolean);

      // Fetch one by one so failed assets don't abort the whole batch
      for (const asset of coreAssets) {
        try {
          await cache.add(asset);
        } catch {
          console.warn(`[OfflineSync] Skipped asset (not found): ${asset}`);
        }
      }
      setProgress(50);

      // ── Step 3: Vector tiles for the arena ────────────────────────────────
      const tiles = tilePaths.length > 0 ? tilePaths : [];
      const tileChunkSize = 10;

      for (let i = 0; i < tiles.length; i += tileChunkSize) {
        const chunk = tiles.slice(i, i + tileChunkSize);
        await Promise.allSettled(chunk.map((t) => cache.add(t)));
        const tileProgress = tiles.length > 0 ? ((i + chunk.length) / tiles.length) * 40 : 40;
        setProgress(50 + Math.round(tileProgress));
      }

      setProgress(100);
      setStatus('done');
    } catch (err) {
      console.error('[OfflineSync] Download failed:', err);
      setStatus('error');
    }
  };

  const clear = async () => {
    await localforage.removeItem(`boundary_${eventId}`);
    try {
      await caches.delete('offline-map-assets');
    } catch {/* cache API not available */}
    setStatus('idle');
    setProgress(0);
  };

  if (status === 'checking') return null;

  return (
    <div className="border-t border-gray-100 pt-5 mt-2 mb-6">
      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
        Offline Access
      </h4>

      {status === 'idle' && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 max-w-[200px]">
            Download map data to play without internet.
          </p>
          <button
            onClick={download}
            className="bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-colors"
          >
            Download
          </button>
        </div>
      )}

      {status === 'syncing' && (
        <div className="mt-1 space-y-2">
          <div className="flex items-center gap-2 text-xs text-yellow-600 font-medium">
            <div className="w-3 h-3 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            <span>Downloading… {progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-400 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {status === 'done' && (
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-100 rounded-xl">
            <span className="text-xs text-green-700 font-medium">✓ Ready for offline play</span>
          </div>
          <button
            onClick={clear}
            className="text-[10px] text-gray-400 underline hover:text-gray-600 transition-colors ml-3"
          >
            Clear
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-red-500 font-medium">⚠️ Download failed.</span>
          <button
            onClick={download}
            className="text-xs font-bold text-blue-600 underline"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}