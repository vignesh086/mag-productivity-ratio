/**
 * /api/projectNames
 *
 * POST → saves the project names map { project1: 'MH-Website', ... }
 */
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await redis.set('mag:projectNames', req.body);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('POST /api/projectNames error:', err);
    return res.status(500).json({ error: 'Storage error' });
  }
}
