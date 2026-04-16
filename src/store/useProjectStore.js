import { useState, useCallback, useEffect } from 'react';

const DEFAULT_PROJECTS = [
  { id: 'project1', name: 'MH-Website' },
  { id: 'project2', name: 'MH-Voucher' },
  { id: 'project3', name: 'DSP' },
  { id: 'project4', name: 'DSP SSCI' },
];

const STORAGE_KEY = 'mag-dashboard-v1';

const initialProjectState = () => ({
  fileName: null,
  rows: [],
  sprints: [],
  members: [],
  selectedSprints: [],
  error: null,
  loading: false,
});

/** Read persisted state from localStorage. Returns null if nothing saved. */
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Write only the fields we want to persist (skip transient loading/error). */
function saveToStorage(projectNames, projectData) {
  try {
    const payload = {
      projectNames,
      projectData: Object.fromEntries(
        Object.entries(projectData).map(([id, d]) => [
          id,
          {
            fileName:        d.fileName,
            rows:            d.rows,
            sprints:         d.sprints,
            members:         d.members,
            selectedSprints: d.selectedSprints,
          },
        ])
      ),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    // localStorage can be full or disabled — fail silently
    console.warn('MAG Dashboard: could not save to localStorage', err);
  }
}

/** Merge saved state onto the default project state skeleton. */
function buildInitialData(saved) {
  return Object.fromEntries(
    DEFAULT_PROJECTS.map((p) => {
      const persisted = saved?.projectData?.[p.id];
      return [
        p.id,
        persisted
          ? { ...initialProjectState(), ...persisted }
          : initialProjectState(),
      ];
    })
  );
}

function buildInitialNames(saved) {
  const defaults = Object.fromEntries(DEFAULT_PROJECTS.map((p) => [p.id, p.name]));
  return saved?.projectNames ? { ...defaults, ...saved.projectNames } : defaults;
}

export function useProjectStore() {
  const saved = loadFromStorage();

  const [projectNames, setProjectNames] = useState(() => buildInitialNames(saved));
  const [projectData,  setProjectData]  = useState(() => buildInitialData(saved));

  // Persist to localStorage whenever state changes
  useEffect(() => {
    saveToStorage(projectNames, projectData);
  }, [projectNames, projectData]);

  const updateProject = useCallback((projectId, patch) => {
    setProjectData((prev) => ({
      ...prev,
      [projectId]: { ...prev[projectId], ...patch },
    }));
  }, []);

  const renameProject = useCallback((projectId, name) => {
    setProjectNames((prev) => ({ ...prev, [projectId]: name }));
  }, []);

  const projects = DEFAULT_PROJECTS.map((p) => ({
    ...p,
    name: projectNames[p.id],
    data: projectData[p.id],
  }));

  return { projects, updateProject, renameProject };
}
