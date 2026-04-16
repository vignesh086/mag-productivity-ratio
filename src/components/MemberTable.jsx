import RatioGauge from './RatioGauge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

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

export default function MemberTable({ stats }) {
  if (!stats || stats.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Member</th>
            <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estimate (h)</th>
            <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Capacity (h)</th>
            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-48">Productivity Ratio</th>
            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((row) => (
            <tr key={row.member} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="py-2.5 px-3 font-medium text-gray-800">{row.member}</td>
              <td className="py-2.5 px-3 text-right text-gray-600">{row.totalEstimate.toFixed(1)}</td>
              <td className="py-2.5 px-3 text-right text-gray-600">{row.totalCapacity.toFixed(1)}</td>
              <td className="py-2.5 px-3">
                <RatioGauge ratio={row.ratio} />
              </td>
              <td className="py-2.5 px-3">
                <StatusBadge ratio={row.ratio} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
