'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';

interface ClientGameLoaderProps {
  folders: string[];
}

export default function ClientGameLoader({ folders }: { folders: string[] }) {
  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  // useMemo ensures we don't try to re-import on every render
  const GameComponent = useMemo(() => {
    if (!activeFolder) return null;

    // We use the @ alias so Turbopack knows exactly where to start scanning.
    // We include the full path to your minigames directory.
    return dynamic(() => import(`@/app/test/minigames/${activeFolder}/page`), {
      loading: () => (
        <div className="p-10 text-center animate-pulse">
          Mounting {activeFolder.replace(/-/g, ' ')}...
        </div>
      ),
      ssr: false, // Prevents "window is not defined" errors in minigames
    });
  }, [activeFolder]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {folders.map((folder) => (
          <button
            key={folder}
            onClick={() => setActiveFolder(folder)}
            className={`px-4 py-2 rounded-lg text-sm font-mono transition-all border ${
              activeFolder === folder
                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:bg-blue-50'
            }`}
          >
            {folder.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="relative border-2 border-dashed border-gray-100 rounded-2xl min-h-[500px] bg-white shadow-sm overflow-hidden">
        {GameComponent ? (
          <div className="w-full h-full">
            <GameComponent />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[500px] text-gray-400">
            <p className="text-lg">Sandbox Ready</p>
            <p className="text-sm">Select a local folder to execute the game module</p>
          </div>
        )}
      </div>
    </div>
  );
}