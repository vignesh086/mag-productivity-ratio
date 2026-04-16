import { useState, useCallback, useEffect } from 'react';
import {
  fetchAllProjects,
  saveProjectToApi,
  clearProjectFromApi,
  saveProjectNamesToApi,
} from '../api/projectsApi';

const DEFAULT_PROJECTS = [
  { id: 'project1', name: 'MH-Website' },
  { id: 'project2', name: 'MH-Voucher' },
  { id: 'project3', name: 'DSP' },
  { id: 'project4', name: 'DSP SSCI' },
];

const STORAGE_KEY = 'mag-dashboard-v1';

// ─── helpers ──────────────────────────────────────────────────────────────────

const initialProjectState = () => ({
  fileName:        null,
  rows:            [],
  sprints:         [],
  members:         [],
  selectedSprints: [],
  error:           null,
  loading:         false,
});

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToStorage(projectNames, projectData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      projectNames,
      projectData: Object.fromEntries(
        Object.entries(projectData).map(([id, d]) => [id, {
          fileName:        d.fileName,
          rows:            d.rows,
          sprints:         d.sprints,
          members:         d.members,
          selectedSprints: d.selectedSprints,
        }])
      ),
    }));
  } catch {
    // localStorage may be full or disabled
  }
}

function buildInitialNames(saved) {
  const defaults = Object.fromEntries(DEFAULT_PROJECTS.map((p) => [p.id, p.name]));
  return saved?.projectNames ? { ...defaults, ...saved.projectNames } : defaults;
}

function buildInitialData(saved) {
  return Object.fromEntries(
    DEFAULT_PROJECTS.map((p) => {
      const persisted = saved?.projectData?.[p.id];
      return [p.id, persisted ? { ...initialProjectState(), ...persisted } : initialProjectState()];
    })
  );
}

// ─── store ────────────────────────────────────────────────────────────────────

export function useProjectStore() {
  // 1. Seed from localStorage immediately → instant first render
  const cached = loadFromStorage();
  const [projectNames, setProjectNames] = useState(() => buildInitialNames(cached));
  const [projectData,  setProjectData]  = useState(() => buildInitialData(cached));
  const [apiReady,     setApiReady]     = useState(false); // true once initial API fetch is done

  // 2. On mount: fetch from the backend (authoritative source of truth)
  //    Merge server data on top of the cached state.
  useEffect(() => {
    fetchAllProjects().then((result) => {
      if (!result) return; // API unavailable → keep localStorage data

      setProjectData((prev) => {
        const merged = { ...prev };
        DEFAULT_PROJECTS.forEach(({ id }) => {
          if (result[id]) {
            merged[id] = { ...initialProjectState(), ...result[id] };
          }
        });
        return merged;
      });

      if (result._names) {
        setProjectNames((prev) => ({ ...prev, ...result._names }));
      }
    }).finally(() => setApiReady(true));
  }, []);

  // 3. Keep localStorage in sync whenever state changes
  useEffect(() => {
    saveToStorage(projectNames, projectData);
  }, [projectNames, projectData]);

  // ─── actions ──────────────────────────────────────────────────────────────

  const updateProject = useCallback((projectId, patch) => {
    setProjectData((prev) => {
      const updated = { ...prev, [projectId]: { ...prev[projectId], ...patch } };
      const next = updated[projectId];

      // Sync to backend:
      // • New file uploaded (rows present) → save
      // • File removed (fileName null, rows empty) → delete
      if (patch.rows?.length > 0) {
        saveProjectToApi(projectId, next);
      } else if (patch.fileName === null && Array.isArray(patch.rows) && patch.rows.length === 0) {
        clearProjectFromApi(projectId);
      }

      return updated;
    });
  }, []);

  const renameProject = useCallback((projectId, name) => {
    setProjectNames((prev) => {
      const updated = { ...prev, [projectId]: name };
      saveProjectNamesToApi(updated);
      return updated;
    });
  }, []);

  const projects = DEFAULT_PROJECTS.map((p) => ({
    ...p,
    name: projectNames[p.id],
    data: projectData[p.id],
  }));

  return { projects, updateProject, renameProject, apiReady };
}
