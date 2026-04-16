/**
 * /api/project?id=project1
 *
 * GET    → returns project data or null
 * POST   → saves project data (body: { fileName, rows, sprints, members, selectedSprints })
 * DELETE → clears project data
 */
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const VALID_IDS = new Set(['project1', 'project2', 'project3', 'project4']);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;

  if (!id || !VALID_IDS.has(id)) {
    return res.status(400).json({ error: 'Invalid or missing project id' });
  }

  const key = `mag:project:${id}`;

  try {
    if (req.method === 'GET') {
      const data = await redis.get(key);
      return res.status(200).json(data ?? null);
    }

    if (req.method === 'POST') {
      const { fileName, rows, sprints, members, selectedSprints } = req.body;
      await redis.set(key, { fileName, rows, sprints, members, selectedSprints });
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      await redis.del(key);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(`/api/project?id=${id} error:`, err);
    return res.status(500).json({ error: 'Storage error' });
  }
}
