import app from '../src/index.js';

// Vercel serverless function handler
export default async (req, res) => {
  return app(req, res);
};

