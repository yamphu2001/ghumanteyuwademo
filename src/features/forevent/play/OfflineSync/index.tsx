'use client';

import { useState } from 'react';
import localforage from 'localforage';

export default function OfflineSync({ eventId }: { eventId: string }) {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');

  const downloadAssetsForOffline = async () => {
    setStatus('syncing');
    try {
      // 1. Open the browser's Cache Storage
      const cache = await caches.open('offline-map-assets');
      
      // 2. Add structural layout assets to cache
      await cache.addAll([
        '/map-style.json',
        // Add paths to your local fonts and sprites here if you have them
      ]);

      // 3. Define the critical tile coordinates for your event boundary
      // Note: Replace these example strings with an array of actual file paths matching your local public/tiles folder
      const tilesToCache = [
        '/tiles/14/1234/5678.pbf',
        '/tiles/14/1234/5679.pbf',
      ];
      await cache.addAll(tilesToCache);

      setStatus('done');
    } catch (err) {
      console.error('Offline download failed:', err);
      setStatus('error');
    }
  };

  return (
    <div className="p-4 bg-slate-900 text-white rounded-lg shadow-md my-2">
      <h4>Offline Map Access</h4>
      {status === 'idle' && (
        <button 
          onClick={downloadAssetsForOffline}
          className="mt-2 bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-sm font-medium"
        >
          Prepare Offline Mode
        </button>
      )}
      {status === 'syncing' && <p className="text-sm text-yellow-400 mt-2">Downloading map elements...</p>}
      {status === 'done' && <p className="text-sm text-green-400 mt-2">✓ Game map is ready to play offline!</p>}
      {status === 'error' && <p className="text-sm text-red-400 mt-2">⚠️ Failed downloading offline data.</p>}
    </div>
  );
}