import { useState, useCallback } from 'react';

const DEFAULT_PROJECTS = [
  { id: 'project1', name: 'MH-Website' },
  { id: 'project2', name: 'MH-Voucher' },
  { id: 'project3', name: 'DSP' },
  { id: 'project4', name: 'DSP SSCI' },
];

const initialProjectState = () => ({
  fileName: null,
  rows: [],           // parsed Excel rows
  sprints: [],        // unique sprints (in sheet order)
  members: [],        // unique sorted members
  selectedSprints: [], // user-selected sprint filter (empty = all)
  error: null,
  loading: false,
});

export function useProjectStore() {
  const [projectNames, setProjectNames] = useState(
    Object.fromEntries(DEFAULT_PROJECTS.map((p) => [p.id, p.name]))
  );

  const [projectData, setProjectData] = useState(
    Object.fromEntries(DEFAULT_PROJECTS.map((p) => [p.id, initialProjectState()]))
  );

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
