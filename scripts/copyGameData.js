import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Copy gameData.js from src/data to src/public/js/modules
const sourcePath = path.join(__dirname, '../src/data/gameData.js');
const destPath = path.join(__dirname, '../src/public/js/modules/gameData.js');

try {
  const gameData = fs.readFileSync(sourcePath, 'utf8');
  fs.writeFileSync(destPath, gameData);
} catch (error) {
  // Error copying game data
}
