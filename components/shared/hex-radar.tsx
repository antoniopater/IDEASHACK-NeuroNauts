"use client";

type Dimension = { label: string; value: number; color?: string };

export function HexRadar({ data }: { data: Dimension[] }) {
  const cx = 110, cy = 110, r = 80;
  const n = data.length;
  const angles = data.map((_, i) => (i * (2 * Math.PI / n)) - Math.PI / 2);

  function pointAt(angle: number, dist: number) {
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  }

  function polyStr(pts: { x: number; y: number }[]) {
    return pts.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  }

  const gridLevels = [0.33, 0.67, 1];
  const dataPoints = data.map((d, i) => pointAt(angles[i], r * Math.max(0.04, d.value / 100)));
  const labelPts = angles.map((a, i) => {
    const extra = Math.abs(Math.cos(a)) < 0.15 ? 20 : 18;
    return { ...pointAt(a, r + extra), label: data[i].label, value: data[i].value };
  });

  return (
    <svg viewBox="0 0 220 220" className="w-full max-w-[260px] mx-auto select-none">
      <defs>
        <linearGradient id="hexfill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0.25" />
        </linearGradient>
      </defs>

      {gridLevels.map((level, li) => (
        <polygon
          key={li}
          points={polyStr(angles.map(a => pointAt(a, r * level)))}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={li === 2 ? 1.5 : 0.8}
          strokeDasharray={li === 2 ? undefined : "3 2"}
        />
      ))}

      {angles.map((a, i) => {
        const end = pointAt(a, r);
        return (
          <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="#e2e8f0" strokeWidth="1" />
        );
      })}

      <polygon
        points={polyStr(dataPoints)}
        fill="url(#hexfill)"
        stroke="#6366f1"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#6366f1" />
      ))}

      {labelPts.map((lp, i) => (
        <g key={i}>
          <text
            x={lp.x}
            y={lp.y - 4}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="7.5"
            fontWeight="600"
            fill="#374151"
            fontFamily="system-ui, sans-serif"
          >
            {lp.label}
          </text>
          <text
            x={lp.x}
            y={lp.y + 6}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="7"
            fill="#6366f1"
            fontFamily="system-ui, sans-serif"
          >
            {lp.value}%
          </text>
        </g>
      ))}
    </svg>
  );
}
