// Import from src using absolute path resolution
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Dynamically import the Express app
const { default: app } = await import(join(__dirname, '..', 'src', 'index.js'));

// Vercel serverless function handler
export default app;

