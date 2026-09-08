export default function Gauge({ value }) {
  const color = value >= 70 ? 'var(--emerald)' : value >= 40 ? 'var(--medium)' : 'var(--critical)'
  const angle = (Math.min(Math.max(value, 0), 100) / 100) * 180 - 90
  const rad = (angle * Math.PI) / 180
  const cx = 110
  const cy = 100
  const r = 78
  const nx = cx + r * Math.cos(rad)
  const ny = cy + r * Math.sin(rad)

  return (
    <div className="gauge">
      <svg viewBox="0 0 220 120" width="100%">
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="rgba(148,163,184,0.15)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray={`${value} 100`}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth="2.5" />
        <circle cx={cx} cy={cy} r="5" fill={color} />
        <text x={cx} y={cy - 18} textAnchor="middle" className="gauge-number" fill={color}>
          {value}%
        </text>
      </svg>
    </div>
  )
}
