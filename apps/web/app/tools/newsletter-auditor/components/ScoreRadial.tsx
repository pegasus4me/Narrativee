"use client";

interface ScoreRadialProps {
  /** Score value (0–100) */
  readonly score: number;
  /** Size in pixels (default 160) */
  readonly size?: number;
  /** Label text below the score */
  readonly label?: string;
}

/** Returns color classes based on score thresholds */
function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

/** Returns hex stroke color for the SVG arc */
function getStrokeHex(score: number): string {
  if (score >= 80) return "#34d399";
  if (score >= 60) return "#fbbf24";
  return "#f87171";
}

/** Returns a grade label for the score */
function getGradeLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Strong";
  if (score >= 70) return "Good";
  if (score >= 60) return "Needs Work";
  if (score >= 45) return "Weak";
  return "Critical";
}

/**
 * Animated SVG radial gauge that displays a 0–100 score.
 * Used for the main overall score and individual category scores.
 */
export default function ScoreRadial({ score, size = 160, label }: ScoreRadialProps) {
  const center = size / 2;
  const radius = (size / 2) - 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * score) / 100;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            className="stroke-zinc-800/60 print:stroke-zinc-200"
            strokeWidth="8"
            fill="transparent"
          />
          {/* Score arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={getStrokeHex(score)}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-extrabold font-display ${getScoreColor(score)} print:text-black`}>
            {score}
          </span>
          <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold mt-0.5">
            / 100
          </span>
        </div>
      </div>

      {/* Grade badge */}
      <div
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide border ${
          score >= 80
            ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5"
            : score >= 60
              ? "text-amber-400 border-amber-500/20 bg-amber-500/5"
              : "text-red-400 border-red-500/20 bg-red-500/5"
        }`}
      >
        {getGradeLabel(score)}
      </div>

      {label && (
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
          {label}
        </span>
      )}
    </div>
  );
}
