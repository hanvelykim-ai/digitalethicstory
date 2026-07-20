import { STAGES, PART_COLORS } from '../constants';

// y-position per stage (0 = top/peak, 1 = bottom) so dots trace 발단→위기→절정→결말 as a hill
const HEIGHTS = [0.85, 0.78, 0.6, 0.5, 0.32, 0.18, 0.02, 0.28, 0.55];

export default function ArcProgress({ current, filled, onSelect }) {
  const W = 640;
  const H = 130;
  const points = STAGES.map((s, i) => ({
    x: (W / (STAGES.length - 1)) * i + 10,
    y: 12 + HEIGHTS[i] * (H - 40),
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg className="arc-progress" viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
      <path d={pathD} fill="none" stroke="#d8d0ba" strokeWidth="3" strokeDasharray="1 8" strokeLinecap="round" />
      {points.map((p, i) => {
        const stage = STAGES[i];
        const isFilled = filled[i];
        const isCurrent = current === i;
        return (
          <g
            key={stage.n}
            transform={`translate(${p.x}, ${p.y})`}
            onClick={() => onSelect(i)}
            style={{ cursor: 'pointer' }}
          >
            <circle
              r={isCurrent ? 13 : 9}
              fill={isFilled ? PART_COLORS[stage.part] : '#fff'}
              stroke="#2c2a4a"
              strokeWidth={isCurrent ? 3 : 2}
            />
            <text y="-16" textAnchor="middle" fontSize="11" fontWeight="800" fill="#2c2a4a">
              {stage.n}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
