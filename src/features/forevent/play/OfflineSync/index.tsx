
'use client';

import { useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
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

  // On mount: check if this event is already cached and validate image cache
  useEffect(() => {
    const validateCache = async () => {
      const exists = await localforage.getItem(`boundary_${eventId}`);
      if (!exists) {
        setStatus('idle');
        return;
      }
      
      // Validate that the Mascot.png is properly cached
      try {
        const cache = await caches.open('offline-map-assets-v1');
        const cached = await cache.match('/Mascot.png');
        if (cached && cached.status === 200) {
          const blob = await cached.blob();
          if (blob.size > 0) {
            setStatus('done');
            return;
          }
        }
      } catch (error) {
        console.warn('[OfflineSync] Cache validation failed:', error);
      }
      
      // If image cache is invalid, reset to idle to force re-sync
      setStatus('idle');
    };
    
    validateCache();
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
      setProgress(15);

      // ── Step 2: Offline event markers and service data ──────────────────────
      const [serviceSnap, qrSnap, stallSnap] = await Promise.all([
        getDocs(collection(db, 'events', eventId, 'serviceboundaries')),
        getDocs(collection(db, 'events', eventId, 'qrcodemarkers')),
        getDocs(collection(db, 'events', eventId, 'ghumantestall')),
      ]);

      const serviceItems = serviceSnap.docs.map((doc) => ({ id: doc.id, ...JSON.parse(JSON.stringify(doc.data())) }));
      const qrItems = qrSnap.docs.map((doc) => ({ id: doc.id, ...JSON.parse(JSON.stringify(doc.data())) }));
      const stallItems = stallSnap.docs.map((doc) => ({ id: doc.id, ...JSON.parse(JSON.stringify(doc.data())) }));

      await Promise.all([
        localforage.setItem(`serviceboundaries_${eventId}`, serviceItems),
        localforage.setItem(`qrcodemarkers_${eventId}`, qrItems),
        localforage.setItem(`ghumantestall_${eventId}`, stallItems),
      ]);
      setProgress(35);

      // ── Step 3: Map style + sprites/fonts ─────────────────────────────────
      const cache = await caches.open('offline-map-assets-v1');

      const coreAssets = [
        'https://tiles.openfreemap.org/styles/bright',
        '/Mascot.png',
      ].filter(Boolean);

      // Helper to validate cached response
      const validateAndCacheAsset = async (asset: string, retries = 2) => {
        for (let attempt = 0; attempt < retries; attempt++) {
          try {
            const response = await fetch(asset);
            if (response.ok && response.status === 200) {
              const blob = await response.blob();
              if (blob.size > 0) {
                await cache.put(asset, new Response(blob));
                console.log(`[OfflineSync] Cached asset: ${asset}`);
                return true;
              }
            }
          } catch (error) {
            console.warn(`[OfflineSync] Attempt ${attempt + 1}/${retries} failed for ${asset}:`, error);
            if (attempt < retries - 1) {
              await new Promise(r => setTimeout(r, 500)); // Wait before retry
            }
          }
        }
        console.warn(`[OfflineSync] Failed to cache asset after ${retries} attempts: ${asset}`);
        return false;
      };

      for (const asset of coreAssets) {
        await validateAndCacheAsset(asset);
      }
      setProgress(50);

      // ── Step 4: Vector/raster tiles for the arena (derive from boundary)
      // If `tilePaths` was provided by caller, prefer it. Otherwise compute
      // a conservative set of tiles for zooms 14..16 covering the event bbox.
      const tilesSet = new Set<string>();
      const tiles = tilePaths.length > 0 ? tilePaths : [];

      // Helper: convert lon/lat to slippy tile numbers for a zoom
      const lon2tile = (lon: number, z: number) => Math.floor(((lon + 180) / 360) * Math.pow(2, z));
      const lat2tile = (lat: number, z: number) => {
        const latRad = (lat * Math.PI) / 180;
        return Math.floor(
          ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * Math.pow(2, z)
        );
      };

      if (tiles.length === 0) {
        try {
          const boundaryData = await localforage.getItem<[number, number][]>(`boundary_${eventId}`);
          if (boundaryData && boundaryData.length > 0) {
            // compute bbox
            const lons = boundaryData.map((p) => p[0]);
            const lats = boundaryData.map((p) => p[1]);
            const minLon = Math.min(...lons);
            const maxLon = Math.max(...lons);
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);

            const ZOOMS = [14, 15, 16];
            for (const z of ZOOMS) {
              const xMin = lon2tile(minLon, z);
              const xMax = lon2tile(maxLon, z);
              const yMin = lat2tile(maxLat, z); // note lat->y inverted
              const yMax = lat2tile(minLat, z);

              for (let x = xMin; x <= xMax; x++) {
                for (let y = yMin; y <= yMax; y++) {
                  const url = `https://tiles.openfreemap.org/styles/bright`;
                  tilesSet.add(url);
                }
              }
            }
          }
        } catch (err) {
          console.warn('[OfflineSync] Failed to compute tile list from boundary:', err);
        }
      } else {
        for (const t of tiles) tilesSet.add(t);
      }

      const tileList = Array.from(tilesSet);
      // Prevent runaway downloads: cap to 1000 tiles
      const capped = tileList.slice(0, 1000);

      const tileChunkSize = 10;
      for (let i = 0; i < capped.length; i += tileChunkSize) {
        const chunk = capped.slice(i, i + tileChunkSize);
        await Promise.allSettled(chunk.map((t) => cache.add(t)));
        const tileProgress = capped.length > 0 ? ((i + chunk.length) / capped.length) * 40 : 40;
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
    await Promise.all([
      localforage.removeItem(`serviceboundaries_${eventId}`),
      localforage.removeItem(`qrcodemarkers_${eventId}`),
      localforage.removeItem(`ghumantestall_${eventId}`),
    ]);
    try {
      // Delete both old and new cache versions
      await Promise.all([
        caches.delete('offline-map-assets'),
        caches.delete('offline-map-assets-v1'),
        caches.delete('offline-marker-images'),
        caches.delete('offline-marker-images-v1'),
      ]);
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
            // className="bg-white-600 hover:bg-red-600 border-2 border-black text-white px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-colors"
            // 🟢 FIXED TAILWIND STYLING:
className="bg-[#E13746] hover:bg-[#c92f3d] border-2 border-[#E13746] text-white px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-colors"
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