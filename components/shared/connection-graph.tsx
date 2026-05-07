"use client";

const COMPANIES = [
  { id: "c1", label: "QuantumLeap\nRobotics", x: 80, y: 70, color: "#6366f1" },
  { id: "c2", label: "BioNova\nResearch", x: 80, y: 180, color: "#8b5cf6" },
  { id: "c3", label: "GreenAxis\nEnergy", x: 80, y: 290, color: "#06b6d4" },
  { id: "c4", label: "MedVision\nLabs", x: 80, y: 400, color: "#ec4899" },
];

const RESEARCHERS = [
  { id: "r1", label: "AI &\nML", x: 420, y: 50, color: "#f59e0b" },
  { id: "r2", label: "Biomed\nEng.", x: 420, y: 145, color: "#10b981" },
  { id: "r3", label: "Renew.\nEnergy", x: 420, y: 240, color: "#06b6d4" },
  { id: "r4", label: "Comb.\nOptim.", x: 420, y: 335, color: "#f59e0b" },
  { id: "r5", label: "New\nmaterials", x: 420, y: 430, color: "#8b5cf6" },
];

const EDGES = [
  { from: "c1", to: "r1" }, { from: "c1", to: "r4" },
  { from: "c2", to: "r2" }, { from: "c2", to: "r5" },
  { from: "c3", to: "r3" }, { from: "c3", to: "r1" },
  { from: "c4", to: "r2" }, { from: "c4", to: "r3" },
  { from: "c1", to: "r2" }, { from: "c3", to: "r5" },
];

function getPos(id: string) {
  const c = COMPANIES.find(n => n.id === id);
  if (c) return { x: c.x + 36, y: c.y };
  const r = RESEARCHERS.find(n => n.id === id);
  if (r) return { x: r.x - 36, y: r.y };
  return { x: 0, y: 0 };
}

export function ConnectionGraph() {
  return (
    <svg
      viewBox="0 0 500 480"
      className="w-full max-w-2xl mx-auto"
      aria-label="Graph of connections between companies and researchers"
    >
      <defs>
        {EDGES.map((e, i) => (
          <linearGradient key={i} id={`eg${i}`} gradientUnits="userSpaceOnUse"
            x1={getPos(e.from).x} y1={getPos(e.from).y}
            x2={getPos(e.to).x} y2={getPos(e.to).y}
          >
            <stop offset="0%" stopColor="#7c8cff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.22" />
          </linearGradient>
        ))}
      </defs>

      {EDGES.map((e, i) => {
        const from = getPos(e.from);
        const to = getPos(e.to);
        const mx = (from.x + to.x) / 2;
        return (
          <path
            key={i}
            d={`M ${from.x} ${from.y} C ${mx} ${from.y}, ${mx} ${to.y}, ${to.x} ${to.y}`}
            stroke={`url(#eg${i})`}
            strokeWidth="1.8"
            fill="none"
            opacity="0.75"
          />
        );
      })}

      {COMPANIES.map((c) => (
        <g key={c.id}>
          <rect
            x={c.x - 36} y={c.y - 28}
            width={72} height={56}
            rx={12}
            fill={c.color}
            fillOpacity="0.12"
            stroke={c.color}
            strokeWidth="1.5"
            strokeOpacity="0.75"
          />
          {c.label.split("\n").map((line, li) => (
            <text
              key={li}
              x={c.x}
              y={c.y + (li - 0.3) * 11}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="8.5"
              fontWeight="600"
              fill="#c7d2fe"
              fontFamily="system-ui, sans-serif"
            >
              {line}
            </text>
          ))}
        </g>
      ))}

      <text x={80} y={16} textAnchor="middle" fontSize="9" fontWeight="700" fill="#94a3b8" fontFamily="system-ui">COMPANIES</text>
      <text x={420} y={16} textAnchor="middle" fontSize="9" fontWeight="700" fill="#94a3b8" fontFamily="system-ui">RESEARCHERS</text>

      {RESEARCHERS.map((r) => (
        <g key={r.id}>
          <circle cx={r.x} cy={r.y} r={34} fill={r.color} fillOpacity="0.1" stroke={r.color} strokeWidth="1.6" strokeOpacity="0.75" />
          {r.label.split("\n").map((line, li) => (
            <text
              key={li}
              x={r.x}
              y={r.y + (li - 0.3) * 11}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="8.5"
              fontWeight="600"
              fill="#bae6fd"
              fontFamily="system-ui, sans-serif"
            >
              {line}
            </text>
          ))}
        </g>
      ))}
    </svg>
  );
}
