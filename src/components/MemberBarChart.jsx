import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const { totalEstimate, totalCapacity, ratioPercent } = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <div className="space-y-0.5">
        <p className="text-gray-600">Estimate: <span className="font-semibold">{totalEstimate}h</span></p>
        <p className="text-gray-600">Capacity: <span className="font-semibold">{totalCapacity}h</span></p>
        <p className="text-gray-800">Ratio: <span className="font-semibold">{ratioPercent}%</span></p>
      </div>
    </div>
  );
};

function getBarColor(ratio) {
  if (ratio >= 0.9 && ratio <= 1.1) return '#10b981';
  if (ratio > 1.1 && ratio <= 1.3) return '#f59e0b';
  if (ratio > 1.3) return '#ef4444';
  if (ratio >= 0.7) return '#3b82f6';
  return '#9ca3af';
}

export default function MemberBarChart({ stats }) {
  if (!stats?.length) return null;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={stats} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="member"
          tick={{ fontSize: 11 }}
          angle={-30}
          textAnchor="end"
          interval={0}
        />
        <YAxis
          tickFormatter={(v) => `${v}%`}
          domain={[0, 'auto']}
          tick={{ fontSize: 11 }}
          width={45}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={100} stroke="#10b981" strokeDasharray="4 4" label={{ value: '100%', position: 'right', fontSize: 10, fill: '#10b981' }} />
        <Bar dataKey="ratioPercent" name="Ratio %" radius={[4, 4, 0, 0]}>
          {stats.map((entry) => (
            <Cell key={entry.member} fill={getBarColor(entry.ratio)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
