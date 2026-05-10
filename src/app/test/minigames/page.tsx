import fs from 'fs';
import path from 'path';
import ClientGameLoader from './ClientGameLoader';

export default function MinigameAutoPage() {
  // Path to THIS specific folder
  const currentDir = path.join(process.cwd(), 'src/app/test/minigames');
  
  // Get all subdirectories (these are your games)
  const folders = fs.readdirSync(currentDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  return (
    <main className="p-10">
      <h1 className="text-2xl font-bold mb-6">Local Sandbox</h1>
      {/* Send only the folder names to the client */}
      <ClientGameLoader folders={folders} />
    </main>
  );
}