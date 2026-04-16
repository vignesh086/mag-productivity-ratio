import { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, X, AlertCircle } from 'lucide-react';
import { parseProductivityExcel, extractSprints, extractMembers } from '../utils/excelParser';

export default function FileUpload({ projectId, projectData, onUpdate }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const processFile = async (file) => {
    if (!file) return;

    const isExcel =
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls') ||
      file.name.endsWith('.csv');

    if (!isExcel) {
      onUpdate(projectId, { error: 'Please upload an Excel (.xlsx, .xls) or CSV file.' });
      return;
    }

    onUpdate(projectId, { loading: true, error: null });

    try {
      const rows = await parseProductivityExcel(file);
      const sprints = extractSprints(rows);
      const members = extractMembers(rows);
      onUpdate(projectId, {
        fileName: file.name,
        rows,
        sprints,
        members,
        selectedSprints: [],
        loading: false,
        error: null,
      });
    } catch (err) {
      onUpdate(projectId, { loading: false, error: err.message });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
    e.target.value = '';
  };

  const clearFile = () => {
    onUpdate(projectId, {
      fileName: null,
      rows: [],
      sprints: [],
      members: [],
      selectedSprints: [],
      error: null,
      loading: false,
    });
  };

  const { fileName, loading, error } = projectData;

  if (fileName) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
        <FileSpreadsheet className="text-green-600 shrink-0" size={20} />
        <span className="text-sm text-green-800 font-medium flex-1 truncate">{fileName}</span>
        <button
          onClick={clearFile}
          className="text-green-600 hover:text-green-800 transition-colors"
          title="Remove file"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`
          flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors
          ${dragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'}
        `}
      >
        {loading ? (
          <div className="text-sm text-gray-500 animate-pulse">Parsing file…</div>
        ) : (
          <>
            <Upload size={24} className="text-gray-400" />
            <p className="text-sm text-gray-600 text-center">
              <span className="font-medium text-blue-600">Click to upload</span> or drag &amp; drop
            </p>
            <p className="text-xs text-gray-400">.xlsx, .xls, .csv</p>
          </>
        )}
      </div>

      {error && (
        <div className="flex gap-2 items-start p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 whitespace-pre-line">{error}</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
