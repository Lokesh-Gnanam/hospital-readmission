import React from 'react';

interface ScoreGaugeProps {
  probability: number; // e.g. 0.21 or 21
  cutoff?: number; // default 0.2562
  variant?: 'compact' | 'full';
  showDetails?: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  probability,
  cutoff = 0.2562,
  variant = 'compact',
  showDetails = true
}) => {
  // Normalize probability to 0.0 - 1.0 range
  const normalizedProb = probability > 1 ? probability / 100 : probability;
  const clampedProb = Math.min(1, Math.max(0, normalizedProb));
  const percentVal = Math.round(clampedProb * 100);
  const percentText = `${percentVal}%`;
  const cutoffText = `${(cutoff * 100).toFixed(1)}%`;

  // Determine Risk Tier & Colors based on backend logic/thresholds
  let tierLabel = 'Low Risk';
  let arcColor = '#38bdf8'; // Sky blue / Teal
  let badgeStyle = 'bg-[#1e293b] text-slate-200 border-slate-700';

  if (clampedProb >= 0.60) {
    tierLabel = 'High Risk';
    arcColor = '#ef4444'; // Red
    badgeStyle = 'bg-red-50 text-red-900 border-red-200';
  } else if (clampedProb >= cutoff) {
    tierLabel = 'Moderate Risk';
    arcColor = '#f59e0b'; // Amber / Orange
    badgeStyle = 'bg-amber-50 text-amber-900 border-amber-200';
  } else {
    tierLabel = 'Low Risk';
    arcColor = '#0d9488'; // Teal
    badgeStyle = 'bg-slate-100 text-slate-800 border-slate-200';
  }

  if (variant === 'compact') {
    // Semi-circular 48x28 SVG arc for Patient List rows
    const r = 18;
    const strokeWidth = 4;
    const cx = 24;
    const cy = 24;
    return (
      <div className="relative flex items-center justify-center w-12 h-12 shrink-0 group">
        <svg width="48" height="48" viewBox="0 0 48 48" className="transform -rotate-90 overflow-visible">
          {/* Background circle track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
          />
          {/* Foreground progress arc */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={arcColor}
            strokeWidth={strokeWidth}
            strokeDasharray={2 * Math.PI * r}
            strokeDashoffset={2 * Math.PI * r * (1 - clampedProb)}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <span className="absolute font-mono font-bold text-xs text-[#12213A] tracking-tighter">
          {percentText}
        </span>
      </div>
    );
  }

  // Full Variant (Matching Screenshot 1 Assessment Result Gauge)
  const width = 240;
  const height = 120;
  const cx = 120;
  const cy = 110;
  const r = 90;
  const strokeWidth = 14;
  const arcLength = Math.PI * r;
  const dashOffset = arcLength * (1 - clampedProb);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[280px] mx-auto p-4 bg-slate-50/50 rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="relative flex items-center justify-center w-[240px] h-[125px]">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          {/* Background semi-circular track */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Foreground colored arc */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke={arcColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={dashOffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Centered Readmission Risk Score */}
        <div className="absolute bottom-2 left-0 right-0 flex flex-col items-center justify-center text-center">
          <div className="font-mono font-extrabold text-3xl text-[#12213A] tracking-tight leading-none">
            {percentText}
          </div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mt-1">
            READMISSION RISK
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="flex items-center space-x-3 mt-4 pt-3 border-t border-slate-200/60 w-full justify-center">
          {/* Risk Tier Badge */}
          <span className={`px-3 py-1 rounded-md text-xs font-semibold border font-mono tracking-tight ${badgeStyle}`}>
            {tierLabel}
          </span>

          {/* Cutoff Reference Text */}
          <span className="text-xs font-mono font-medium text-slate-500">
            Cutoff: <strong className="text-slate-800 font-bold">{cutoffText}</strong>
          </span>
        </div>
      )}
    </div>
  );
};

export default ScoreGauge;
