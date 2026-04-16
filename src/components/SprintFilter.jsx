export default function SprintFilter({ sprints, selectedSprints, onChange }) {
  const allSelected = selectedSprints.length === 0;

  const toggle = (sprint) => {
    if (selectedSprints.includes(sprint)) {
      const next = selectedSprints.filter((s) => s !== sprint);
      onChange(next);
    } else {
      onChange([...selectedSprints, sprint]);
    }
  };

  const selectAll = () => onChange([]);

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mr-1">Sprints:</span>
      <button
        onClick={selectAll}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border
          ${allSelected
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}
      >
        All
      </button>
      {sprints.map((sprint) => {
        const active = selectedSprints.includes(sprint);
        return (
          <button
            key={sprint}
            onClick={() => toggle(sprint)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border
              ${active
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}
          >
            {sprint}
          </button>
        );
      })}
    </div>
  );
}
