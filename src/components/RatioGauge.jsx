/**
 * A simple horizontal ratio bar showing productivity % with a colour
 * that transitions green → amber → red based on thresholds.
 */
export default function RatioGauge({ ratio }) {
  const pct = Math.min(ratio * 100, 150); // cap display at 150%

  const getColor = (r) => {
    if (r >= 0.9 && r <= 1.1) return { bar: 'bg-green-500', text: 'text-green-700' };
    if (r > 1.1 && r <= 1.3) return { bar: 'bg-amber-400', text: 'text-amber-700' };
    if (r > 1.3) return { bar: 'bg-red-500', text: 'text-red-700' };
    if (r >= 0.7) return { bar: 'bg-blue-400', text: 'text-blue-700' };
    return { bar: 'bg-gray-400', text: 'text-gray-600' };
  };

  const { bar, text } = getColor(ratio);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${bar}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className={`text-xs font-semibold w-12 text-right ${text}`}>
        {(ratio * 100).toFixed(1)}%
      </span>
    </div>
  );
}
