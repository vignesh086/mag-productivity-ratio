import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts';

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-1.5 py-0.5">
          <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-semibold text-gray-800">{p.value}%</span>
        </div>
      ))}
    </div>
  );
};

/**
 * sprintTrend: [{ sprint, ratioPercent }]   – overall line
 * memberTrend: [{ sprint, [member]: ratioPercent }]  – per-member lines
 * members: string[]
 */
export default function TrendChart({ sprintTrend, memberTrend, members, view = 'overall' }) {
  if (view === 'overall') {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={sprintTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="sprint" tick={{ fontSize: 11 }} />
          <YAxis
            tickFormatter={(v) => `${v}%`}
            domain={[0, 'auto']}
            tick={{ fontSize: 11 }}
            width={45}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={100} stroke="#10b981" strokeDasharray="4 4" label={{ value: '100%', position: 'right', fontSize: 10, fill: '#10b981' }} />
          <Line
            type="monotone"
            dataKey="ratioPercent"
            name="Productivity"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (view === 'members') {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={memberTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="sprint" tick={{ fontSize: 11 }} />
          <YAxis
            tickFormatter={(v) => `${v}%`}
            domain={[0, 'auto']}
            tick={{ fontSize: 11 }}
            width={45}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine y={100} stroke="#10b981" strokeDasharray="4 4" />
          {members.map((member, i) => (
            <Line
              key={member}
              type="monotone"
              dataKey={member}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (view === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={sprintTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="sprint" tick={{ fontSize: 11 }} />
          <YAxis
            tickFormatter={(v) => `${v}%`}
            domain={[0, 'auto']}
            tick={{ fontSize: 11 }}
            width={45}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={100} stroke="#10b981" strokeDasharray="4 4" />
          <Bar dataKey="ratioPercent" name="Productivity" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return null;
}
