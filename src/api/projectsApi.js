/**
 * Thin fetch wrappers for the Vercel serverless API.
 * All functions fail silently so the UI degrades to localStorage-only
 * if the API is unavailable (e.g. local dev without env vars).
 */

const BASE = '/api';

/** Fetch all 4 projects + project names in one round-trip. */
export async function fetchAllProjects() {
  try {
    const res = await fetch(`${BASE}/projects`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Save a single project's data to the backend.
 * Only the persistent fields are sent (no loading/error state).
 */
export async function saveProjectToApi(projectId, data) {
  try {
    await fetch(`${BASE}/project?id=${projectId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName:        data.fileName,
        rows:            data.rows,
        sprints:         data.sprints,
        members:         data.members,
        selectedSprints: data.selectedSprints,
      }),
    });
  } catch {
    // fail silently — localStorage still has the data
  }
}

/** Remove a single project's data from the backend. */
export async function clearProjectFromApi(projectId) {
  try {
    await fetch(`${BASE}/project?id=${projectId}`, { method: 'DELETE' });
  } catch {
    // fail silently
  }
}

/** Save the project name map { project1: 'MH-Website', ... }. */
export async function saveProjectNamesToApi(names) {
  try {
    await fetch(`${BASE}/projectNames`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(names),
    });
  } catch {
    // fail silently
  }
}
