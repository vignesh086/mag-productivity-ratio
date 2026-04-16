import { useMemo } from 'react';
import { computeMemberStats } from '../utils/excelParser';
import CrossProjectChart from './CrossProjectChart';
import StatCard from './StatCard';

export default function CrossProjectOverview({ projects }) {
  const projectsWithData = projects.filter((p) => p.data.rows.length > 0);

  const crossData = useMemo(() => {
    if (!projectsWithData.length) return [];

    // Collect all unique members across all projects
    const allMembers = new Set();
    projectsWithData.forEach((p) => p.data.members.forEach((m) => allMembers.add(m)));

    return [...allMembers].sort().map((member) => {
      const entry = { member };
      projectsWithData.forEach((p) => {
        const rows = p.data.rows.filter((r) => r.member === member);
        if (!rows.length) {
          entry[p.name] = 0;
          return;
        }
        const totalEstimate = rows.reduce((s, r) => s + r.originalEstimate, 0);
        const totalCapacity = rows.reduce((s, r) => s + r.availableCapacity, 0);
        entry[p.name] = totalCapacity > 0 ? +(totalEstimate / totalCapacity * 100).toFixed(1) : 0;
      });
      return entry;
    });
  }, [projectsWithData]);

  const projectSummaries = useMemo(() => {
    return projectsWithData.map((p) => {
      const rows = p.data.rows;
      const totalEstimate = rows.reduce((s, r) => s + r.originalEstimate, 0);
      const totalCapacity = rows.reduce((s, r) => s + r.availableCapacity, 0);
      const ratio = totalCapacity > 0 ? totalEstimate / totalCapacity : 0;
      return { ...p, ratio, totalEstimate, totalCapacity };
    });
  }, [projectsWithData]);

  if (!projectsWithData.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <p className="text-lg font-medium mb-1">No data yet</p>
        <p className="text-sm">Upload Excel files to projects to see the cross-project overview.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {projectSummaries.map((p) => (
          <StatCard
            key={p.id}
            label={p.name}
            value={`${(p.ratio * 100).toFixed(1)}%`}
            sub={`${p.data.members.length} members · ${p.data.sprints.length} sprints`}
            color={p.ratio > 1.1 ? 'red' : p.ratio < 0.7 ? 'purple' : 'green'}
          />
        ))}
      </div>

      {/* Cross-project member comparison */}
      {crossData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Productivity Ratio by Member – All Projects
          </h3>
          <CrossProjectChart
            data={crossData}
            projectNames={projectsWithData.map((p) => p.name)}
          />
          <p className="text-xs text-gray-400 text-center mt-2">
            Dashed green line = 100% target · Members present in at least one project
          </p>
        </div>
      )}

      {/* Project detail table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Project</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estimate (h)</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Capacity (h)</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ratio</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Members</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sprints</th>
            </tr>
          </thead>
          <tbody>
            {projectSummaries.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                <td className="px-4 py-3 text-right text-gray-600">{p.totalEstimate.toFixed(1)}</td>
                <td className="px-4 py-3 text-right text-gray-600">{p.totalCapacity.toFixed(1)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-semibold ${p.ratio > 1.1 ? 'text-red-600' : p.ratio < 0.7 ? 'text-purple-600' : 'text-green-600'}`}>
                    {(p.ratio * 100).toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-600">{p.data.members.length}</td>
                <td className="px-4 py-3 text-right text-gray-600">{p.data.sprints.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
