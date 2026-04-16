import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import RatioGauge from './RatioGauge';
import StatCard from './StatCard';

function fmt(val, decimals = 1) {
  if (val === null || val === undefined || val === '') return '—';
  const n = parseFloat(val);
  return isNaN(n) ? '—' : n.toFixed(decimals);
}

function StatusBadge({ ratio }) {
  if (ratio >= 0.9 && ratio <= 1.1)
    return <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">Optimal</span>;
  if (ratio > 1.1 && ratio <= 1.3)
    return <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 font-medium">Over-loaded</span>;
  if (ratio > 1.3)
    return <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-medium">Critical</span>;
  if (ratio >= 0.7)
    return <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-medium">Under-loaded</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 font-medium">Low</span>;
}

export default function SprintDetailView({ rows, sprints }) {
  const [sprintIdx, setSprintIdx] = useState(0);

  const selectedSprint = sprints[sprintIdx] ?? sprints[0];

  const sprintRows = useMemo(
    () => rows.filter((r) => r.sprint === selectedSprint),
    [rows, selectedSprint]
  );

  // Determine which optional columns are present in this sprint's data
  const has = (field) => sprintRows.some((r) => r[field] !== null && r[field] !== undefined && r[field] !== '');

  const showTotalDays    = has('totalDays');
  const showPto          = has('pto');
  const showMeetings     = has('otherMeetings');
  const showFocus        = has('focusFactor');
  const showEffDays      = has('effectiveDays');
  const showHrsDay       = has('hoursPerDay');
  const showRole         = has('role');
  const showAllocPct     = has('projectAllocPct');

  const totalEstimate  = sprintRows.reduce((s, r) => s + r.originalEstimate, 0);
  const totalCapacity  = sprintRows.reduce((s, r) => s + r.availableCapacity, 0);
  const overallRatio   = totalCapacity > 0 ? totalEstimate / totalCapacity : 0;

  const prev = () => setSprintIdx((i) => Math.max(0, i - 1));
  const next = () => setSprintIdx((i) => Math.min(sprints.length - 1, i + 1));

  return (
    <div className="space-y-4">
      {/* Sprint navigator */}
      <div className="flex items-center gap-2">
        <button
          onClick={prev}
          disabled={sprintIdx === 0}
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        <select
          value={selectedSprint}
          onChange={(e) => setSprintIdx(sprints.indexOf(e.target.value))}
          className="flex-1 px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          {sprints.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <button
          onClick={next}
          disabled={sprintIdx === sprints.length - 1}
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>

        <span className="text-xs text-gray-400 whitespace-nowrap">
          {sprintIdx + 1} / {sprints.length}
        </span>
      </div>

      {/* Sprint summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Team Ratio"
          value={`${(overallRatio * 100).toFixed(1)}%`}
          sub="Estimate ÷ Capacity"
          color={overallRatio > 1.1 ? 'red' : overallRatio < 0.7 ? 'purple' : 'green'}
        />
        <StatCard
          label="Total Estimate"
          value={`${totalEstimate.toFixed(0)}h`}
          sub="Hours committed"
          color="blue"
        />
        <StatCard
          label="Total Capacity"
          value={`${totalCapacity.toFixed(0)}h`}
          sub="Hours available"
          color="blue"
        />
      </div>

      {/* Full sprint data table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide sticky left-0 bg-gray-50">Member</th>
              {showRole       && <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>}
              {showTotalDays  && <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sprint Days</th>}
              {showPto        && <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">PTO / AL</th>}
              {showMeetings   && <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Other (days)</th>}
              {showFocus      && <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Focus %</th>}
              {showEffDays    && <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Eff. Days</th>}
              {showHrsDay     && <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Hrs/Day</th>}
              <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Capacity (h)</th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estimate (h)</th>
              {showAllocPct   && <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Alloc %</th>}
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-32">Productivity</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody>
            {sprintRows.map((row, i) => {
              const ratio = row.availableCapacity > 0
                ? row.originalEstimate / row.availableCapacity
                : 0;
              return (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2.5 font-medium text-gray-800 sticky left-0 bg-white">{row.member}</td>
                  {showRole       && <td className="px-3 py-2.5 text-gray-500 text-xs">{row.role || '—'}</td>}
                  {showTotalDays  && <td className="px-3 py-2.5 text-right text-gray-600">{fmt(row.totalDays)}</td>}
                  {showPto        && <td className="px-3 py-2.5 text-right text-gray-600">{fmt(row.pto)}</td>}
                  {showMeetings   && <td className="px-3 py-2.5 text-right text-gray-600">{fmt(row.otherMeetings)}</td>}
                  {showFocus      && <td className="px-3 py-2.5 text-right text-gray-600">{fmt(row.focusFactor)}%</td>}
                  {showEffDays    && <td className="px-3 py-2.5 text-right text-gray-600">{fmt(row.effectiveDays)}</td>}
                  {showHrsDay     && <td className="px-3 py-2.5 text-right text-gray-600">{fmt(row.hoursPerDay)}</td>}
                  <td className="px-3 py-2.5 text-right text-gray-600">{fmt(row.availableCapacity)}</td>
                  <td className="px-3 py-2.5 text-right text-gray-600">{fmt(row.originalEstimate)}</td>
                  {showAllocPct   && <td className="px-3 py-2.5 text-right text-gray-600">{fmt(row.projectAllocPct)}%</td>}
                  <td className="px-3 py-2.5 min-w-32">
                    <RatioGauge ratio={ratio} />
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge ratio={ratio} />
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Totals row */}
          <tfoot>
            <tr className="bg-gray-50 border-t-2 border-gray-300 font-semibold">
              <td className="px-3 py-2.5 text-gray-700 sticky left-0 bg-gray-50">Total</td>
              {showRole       && <td />}
              {showTotalDays  && <td />}
              {showPto        && <td />}
              {showMeetings   && <td />}
              {showFocus      && <td />}
              {showEffDays    && <td />}
              {showHrsDay     && <td />}
              <td className="px-3 py-2.5 text-right text-gray-700">{totalCapacity.toFixed(1)}</td>
              <td className="px-3 py-2.5 text-right text-gray-700">{totalEstimate.toFixed(1)}</td>
              {showAllocPct   && <td />}
              <td className="px-3 py-2.5 min-w-32">
                <RatioGauge ratio={overallRatio} />
              </td>
              <td className="px-3 py-2.5">
                <StatusBadge ratio={overallRatio} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
