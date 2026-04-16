import { useState, useCallback } from 'react';

const PROJECTS = [
  { id: 'project1', name: 'Project 1' },
  { id: 'project2', name: 'Project 2' },
  { id: 'project3', name: 'Project 3' },
];

const initialProjectState = () => ({
  fileName: null,
  rows: [],          // parsed Excel rows
  sprints: [],       // unique sorted sprints
  members: [],       // unique sorted members
  selectedSprints: [], // user-selected sprint filter (empty = all)
  error: null,
  loading: false,
});

export function useProjectStore() {
  const [projectNames, setProjectNames] = useState({
    project1: 'Project 1',
    project2: 'Project 2',
    project3: 'Project 3',
  });

  const [projectData, setProjectData] = useState({
    project1: initialProjectState(),
    project2: initialProjectState(),
    project3: initialProjectState(),
  });

  const updateProject = useCallback((projectId, patch) => {
    setProjectData((prev) => ({
      ...prev,
      [projectId]: { ...prev[projectId], ...patch },
    }));
  }, []);

  const renameProject = useCallback((projectId, name) => {
    setProjectNames((prev) => ({ ...prev, [projectId]: name }));
  }, []);

  const projects = PROJECTS.map((p) => ({
    ...p,
    name: projectNames[p.id],
    data: projectData[p.id],
  }));

  return { projects, updateProject, renameProject };
}
