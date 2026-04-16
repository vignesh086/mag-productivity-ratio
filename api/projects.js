/**
 * GET /api/projects
 * Returns all project data + project names from Redis.
 * { project1: { fileName, rows, sprints, members, selectedSprints } | null,
 *   project2: ..., project3: ..., project4: ...,
 *   _names: { project1: 'MH-Website', ... } }
 */
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const PROJECT_IDS = ['project1', 'project2', 'project3', 'project4'];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const keys = [
      ...PROJECT_IDS.map((id) => `mag:project:${id}`),
      'mag:projectNames',
    ];

    const values = await redis.mget(...keys);

    const result = {};
    PROJECT_IDS.forEach((id, i) => {
      result[id] = values[i] ?? null;
    });
    result._names = values[PROJECT_IDS.length] ?? null;

    return res.status(200).json(result);
  } catch (err) {
    console.error('GET /api/projects error:', err);
    return res.status(500).json({ error: 'Failed to fetch projects' });
  }
}
