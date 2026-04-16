import { useState } from 'react';
import { BarChart2, Pencil, Check, X } from 'lucide-react';
import { useProjectStore } from './store/useProjectStore';
import ProjectPanel from './components/ProjectPanel';
import CrossProjectOverview from './components/CrossProjectOverview';
import './index.css';

function EditableName({ name, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed) onSave(trimmed);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(name);
    setEditing(false);
  };

  if (editing) {
    return (
      <span className="flex items-center gap-1">
        <input
          className="border border-blue-400 rounded px-2 py-0.5 text-sm font-semibold w-36 focus:outline-none focus:ring-2 focus:ring-blue-300"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') cancel();
          }}
          autoFocus
        />
        <button onClick={commit} className="text-green-600 hover:text-green-800">
          <Check size={14} />
        </button>
        <button onClick={cancel} className="text-gray-400 hover:text-gray-600">
          <X size={14} />
        </button>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 group">
      <span>{name}</span>
      <button
        onClick={() => {
          setDraft(name);
          setEditing(true);
        }}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-700 transition-opacity"
        title="Rename project"
      >
        <Pencil size={12} />
      </button>
    </span>
  );
}

export default function App() {
  const { projects, updateProject, renameProject } = useProjectStore();
  const [activeTab, setActiveTab] = useState(1); // default to Project 1

  const dataCount = projects.filter((p) => p.data.rows.length > 0).length;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <BarChart2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-none">
              MAG Productivity Ratio Dashboard
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Original Estimate ÷ Available Capacity
            </p>
          </div>
          {dataCount > 0 && (
            <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              {dataCount} / 3 projects loaded
            </span>
          )}
        </div>

        {/* Tab bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto">
          {projects.map((project, i) => {
            const tabIdx = i + 1;
            const isActive = activeTab === tabIdx;
            const hasData = project.data.rows.length > 0;
            return (
              <button
                key={project.id}
                onClick={() => setActiveTab(tabIdx)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
                  ${isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <EditableName
                  name={project.name}
                  onSave={(n) => renameProject(project.id, n)}
                />
                {hasData && (
                  <span
                    className="w-2 h-2 rounded-full bg-green-500 shrink-0"
                    title="Data loaded"
                  />
                )}
              </button>
            );
          })}
          <button
            onClick={() => setActiveTab(0)}
            className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
              ${activeTab === 0
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Cross-Project
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 0 ? (
          <CrossProjectOverview projects={projects} />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <ProjectPanel
              project={projects[activeTab - 1]}
              onUpdate={updateProject}
            />
          </div>
        )}
      </main>
    </div>
  );
}
