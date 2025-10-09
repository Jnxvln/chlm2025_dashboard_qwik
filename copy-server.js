import { cpSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverDir = join(__dirname, 'server');
const distServerDir = join(__dirname, 'dist', 'server');

try {
  // Create server directory if it doesn't exist
  mkdirSync(serverDir, { recursive: true });

  // Copy dist/server/* to server/
  cpSync(distServerDir, serverDir, { recursive: true });

  console.log('✓ Server files copied successfully');
} catch (error) {
  console.error('Error copying server files:', error);
  process.exit(1);
}
