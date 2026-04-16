import { useState, useMemo } from 'react';
import { BarChart2, TrendingUp, Users, Info } from 'lucide-react';
import FileUpload from './FileUpload';
import SprintFilter from './SprintFilter';
import StatCard from './StatCard';
import MemberTable from './MemberTable';
import MemberBarChart from './MemberBarChart';
import TrendChart from './TrendChart';
import AnalysisSummary from './AnalysisSummary';
import {
  computeMemberStats,
  computeSprintTrend,
  computeSprintMemberTrend,
} from '../utils/excelParser';

const VIEWS = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'trend', label: 'Sprint Trend', icon: TrendingUp },
  { id: 'members', label: 'Member Breakdown', icon: Users },
];

const CHART_TABS = [
  { id: 'overall', label: 'Overall' },
  { id: 'members', label: 'Per Member' },
  { id: 'bar', label: 'Bar' },
];

export default function ProjectPanel({ project, onUpdate }) {
  const { id, data } = project;
  const { rows, sprints, members, selectedSprints, fileName } = data;

  const [activeView, setActiveView] = useState('overview');
  const [chartTab, setChartTab] = useState('overall');

  const filteredRows = useMemo(() => {
    if (!selectedSprints.length) return rows;
    return rows.filter((r) => selectedSprints.includes(r.sprint));
  }, [rows, selectedSprints]);

  const activeSprints = useMemo(() => {
    if (!selectedSprints.length) return sprints;
    return sprints.filter((s) => selectedSprints.includes(s));
  }, [sprints, selectedSprints]);

  const memberStats = useMemo(() => computeMemberStats(filteredRows), [filteredRows]);
  const sprintTrend = useMemo(() => computeSprintTrend(rows, sprints), [rows, sprints]);
  const memberTrend = useMemo(
    () => computeSprintMemberTrend(rows, sprints, members),
    [rows, sprints, members]
  );

  const totalEstimate = filteredRows.reduce((s, r) => s + r.originalEstimate, 0);
  const totalCapacity = filteredRows.reduce((s, r) => s + r.availableCapacity, 0);
  const overallRatio = totalCapacity > 0 ? totalEstimate / totalCapacity : 0;

  const hasData = rows.length > 0;

  return (
    <div className="space-y-5">
      {/* File upload */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Data Source
        </label>
        <FileUpload projectId={id} projectData={data} onUpdate={onUpdate} />
      </div>

      {/* Template hint */}
      {!hasData && (
        <div className="flex gap-2 items-start p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Info size={15} className="text-blue-500 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700 space-y-1.5">
            <p className="font-medium">Expected Excel format:</p>
            <p>Each <span className="font-semibold">sheet tab = one sprint</span> (the tab name becomes the sprint label).</p>
            <p>Required columns:</p>
            <p>
              <code className="bg-blue-100 px-1 rounded">Team Member</code>{' '}
              <code className="bg-blue-100 px-1 rounded">Role</code>{' '}
              <code className="bg-blue-100 px-1 rounded">Total Hours Available</code>{' '}
              <code className="bg-blue-100 px-1 rounded">Total Hours Committed /Total Original Estimate</code>
            </p>
            <p className="text-blue-600">
              Optional: Total Days in Sprint · Vacation/PTO · Other Meetings · Focus Factor (%) · Effective Days · Hours/Day · MH Website (%) · Project · Notes
            </p>
          </div>
        </div>
      )}

      {hasData && (
        <>
          {/* Sprint filter */}
          <div>
            <SprintFilter
              sprints={sprints}
              selectedSprints={selectedSprints}
              onChange={(val) => onUpdate(id, { selectedSprints: val })}
            />
          </div>

          {/* View tabs */}
          <div className="flex gap-1 border-b border-gray-200">
            {VIEWS.map(({ id: vid, label, icon: Icon }) => (
              <button
                key={vid}
                onClick={() => setActiveView(vid)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px
                  ${activeView === vid
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* OVERVIEW */}
          {activeView === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  label="Overall Ratio"
                  value={`${(overallRatio * 100).toFixed(1)}%`}
                  sub="Estimate / Capacity"
                  color={overallRatio > 1.1 ? 'red' : overallRatio < 0.7 ? 'purple' : 'green'}
                />
                <StatCard
                  label="Total Estimate"
                  value={`${totalEstimate.toFixed(0)}h`}
                  sub="Original estimates"
                  color="blue"
                />
                <StatCard
                  label="Total Capacity"
                  value={`${totalCapacity.toFixed(0)}h`}
                  sub="Available capacity"
                  color="blue"
                />
                <StatCard
                  label="Team Size"
                  value={members.length}
                  sub={`${activeSprints.length} sprint${activeSprints.length !== 1 ? 's' : ''}`}
                  color="purple"
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Member Productivity</h3>
                <MemberBarChart stats={memberStats} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Analysis</h3>
                <AnalysisSummary stats={memberStats} sprintTrend={sprintTrend} />
              </div>
            </div>
          )}

          {/* SPRINT TREND */}
          {activeView === 'trend' && (
            <div className="space-y-4">
              <div className="flex gap-1">
                {CHART_TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setChartTab(t.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                      ${chartTab === t.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <TrendChart
                sprintTrend={sprintTrend}
                memberTrend={memberTrend}
                members={members}
                view={chartTab}
              />
              <div className="text-xs text-gray-400 text-center">
                Dashed green line = 100% target (Estimate = Capacity)
              </div>
            </div>
          )}

          {/* MEMBER BREAKDOWN */}
          {activeView === 'members' && (
            <div className="space-y-4">
              <MemberTable stats={memberStats} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
