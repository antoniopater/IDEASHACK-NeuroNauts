"use client";

import { useEffect, useState } from "react";

function scoreColor(score: number) {
  if (score >= 70) return "#10b981"; // emerald
  if (score >= 50) return "#6366f1"; // indigo
  if (score >= 30) return "#f59e0b"; // amber
  return "#ef4444";                  // red
}

export function ScoreRing({
  score,
  size = 72,
  strokeWidth = 6,
  label,
  animate = true,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  animate?: boolean;
}) {
  const [displayed, setDisplayed] = useState(animate ? 0 : score);
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (displayed / 100) * circ;
  const color = scoreColor(score);

  useEffect(() => {
    if (!animate) return;
    const t = setTimeout(() => setDisplayed(score), 120);
    return () => clearTimeout(t);
  }, [score, animate]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "50% 50%",
              transition: animate ? "stroke-dashoffset 0.9s cubic-bezier(0.34,1.1,0.64,1)" : undefined,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className="font-bold text-gray-900" style={{ fontSize: size * 0.22 }}>
            {score}
          </span>
          <span className="text-gray-400" style={{ fontSize: size * 0.13 }}>/100</span>
        </div>
      </div>
      {label ? <p className="text-[10px] text-gray-500 text-center max-w-[80px]">{label}</p> : null}
    </div>
  );
}
