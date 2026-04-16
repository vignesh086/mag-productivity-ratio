import { TrendingUp, TrendingDown, Users, AlertTriangle, CheckCircle } from 'lucide-react';

function getInsights(stats, sprintTrend) {
  const insights = [];

  if (!stats.length) return insights;

  const overloaded = stats.filter((s) => s.ratio > 1.1);
  const critical = stats.filter((s) => s.ratio > 1.3);
  const underloaded = stats.filter((s) => s.ratio < 0.7);
  const optimal = stats.filter((s) => s.ratio >= 0.9 && s.ratio <= 1.1);
  const top = stats[0];
  const bottom = stats[stats.length - 1];

  if (critical.length > 0) {
    insights.push({
      type: 'danger',
      icon: AlertTriangle,
      text: `${critical.map((s) => s.member).join(', ')} ${critical.length > 1 ? 'are' : 'is'} critically over-loaded (ratio > 130%).`,
    });
  }

  if (overloaded.length > 0 && critical.length === 0) {
    insights.push({
      type: 'warning',
      icon: TrendingUp,
      text: `${overloaded.map((s) => s.member).join(', ')} ${overloaded.length > 1 ? 'are' : 'is'} over-loaded (ratio > 110%).`,
    });
  }

  if (underloaded.length > 0) {
    insights.push({
      type: 'info',
      icon: TrendingDown,
      text: `${underloaded.map((s) => s.member).join(', ')} ${underloaded.length > 1 ? 'have' : 'has'} low utilisation (ratio < 70%).`,
    });
  }

  if (optimal.length === stats.length) {
    insights.push({
      type: 'success',
      icon: CheckCircle,
      text: 'All team members are within the optimal productivity range (90–110%).',
    });
  }

  // Sprint trend direction
  if (sprintTrend.length >= 2) {
    const last = sprintTrend[sprintTrend.length - 1].ratioPercent;
    const secondLast = sprintTrend[sprintTrend.length - 2].ratioPercent;
    const delta = last - secondLast;
    if (Math.abs(delta) >= 5) {
      insights.push({
        type: delta > 0 ? 'warning' : 'info',
        icon: delta > 0 ? TrendingUp : TrendingDown,
        text: `Overall productivity ${delta > 0 ? 'increased' : 'decreased'} by ${Math.abs(delta).toFixed(1)}% from the previous sprint.`,
      });
    }
  }

  // Highest and lowest
  if (stats.length > 1) {
    insights.push({
      type: 'neutral',
      icon: Users,
      text: `Highest ratio: ${top.member} (${top.ratioPercent}%). Lowest: ${bottom.member} (${bottom.ratioPercent}%).`,
    });
  }

  return insights;
}

const styleMap = {
  danger: 'bg-red-50 border-red-200 text-red-700',
  warning: 'bg-amber-50 border-amber-200 text-amber-700',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
  success: 'bg-green-50 border-green-200 text-green-700',
  neutral: 'bg-gray-50 border-gray-200 text-gray-700',
};

const iconColorMap = {
  danger: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
  success: 'text-green-500',
  neutral: 'text-gray-500',
};

export default function AnalysisSummary({ stats, sprintTrend }) {
  const insights = getInsights(stats, sprintTrend);
  if (!insights.length) return null;

  return (
    <div className="space-y-2">
      {insights.map((ins, i) => {
        const Icon = ins.icon;
        return (
          <div key={i} className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-sm ${styleMap[ins.type]}`}>
            <Icon size={15} className={`shrink-0 mt-0.5 ${iconColorMap[ins.type]}`} />
            <p>{ins.text}</p>
          </div>
        );
      })}
    </div>
  );
}
