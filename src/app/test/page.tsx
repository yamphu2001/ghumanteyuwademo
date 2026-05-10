import fs from 'fs';
import path from 'path';
import Link from 'next/link';

export default function TestDirectoryNavigator() {
  const targetDir = path.join(process.cwd(), "src", "app", "test");
  let folders: string[] = [];

  try {
    if (fs.existsSync(targetDir)) {
      const items = fs.readdirSync(targetDir, { withFileTypes: true });
      folders = items
        .filter((item) => {
          const hasPage = fs.existsSync(path.join(targetDir, item.name, "page.tsx"));
          return item.isDirectory() && !item.name.startsWith('.') && hasPage;
        })
        .map((item) => item.name);
    }
  } catch (error) {
    console.error("Error reading directory:", error);
  }

  return (
    <main className="min-h-screen bg-[#F3F4F6] p-10 font-sans">
      {/* Header Section */}
      <header className="mb-12 border-l-[12px] border-red-600 pl-6">
        <h1 className="text-6xl font-black uppercase italic tracking-tighter text-black leading-none">
          LAB <span className="text-red-600">TEST</span>
        </h1>
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">
          Directory Navigator // Pilot 4.0
        </p>
      </header>
      
      {/* Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {folders.length > 0 ? (
          folders.map((folder) => (
            <Link
              key={folder}
              href={`/test/${folder}`}
              className="group relative bg-white border-[4px] border-black p-6 transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_rgba(220,38,38,1)] active:translate-x-0 active:translate-y-0 active:shadow-none"
            >
              {/* Folder Icon/Label */}
              <div className="flex justify-between items-start mb-4">
                <span className="bg-black text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">
                  Module
                </span>
                <span className="text-red-600 opacity-0 group-hover:opacity-100 transition-opacity font-black text-xl">
                  →
                </span>
              </div>
              
              <h2 className="text-2xl font-black uppercase italic tracking-tight text-black break-words">
                {folder}
              </h2>
              
              <div className="mt-4 h-1 w-8 bg-gray-200 group-hover:w-full group-hover:bg-red-600 transition-all duration-300" />
            </Link>
          ))
        ) : (
          <div className="col-span-full p-10 border-4 border-dashed border-gray-300 rounded-3xl text-center">
            <p className="text-gray-500 font-bold uppercase italic">No active test modules detected.</p>
          </div>
        )}
      </div>

      {/* System Path Footer */}
      <footer className="mt-20 border-t-2 border-gray-200 pt-6">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">
            Scanning: <span className="text-black">{targetDir}</span>
          </p>
        </div>
      </footer>
    </main>
  );
}