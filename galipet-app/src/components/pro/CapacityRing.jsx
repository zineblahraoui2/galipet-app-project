/** Small SVG ring: 0–100% fill (capacity used). */
export default function CapacityRing({ percent, size = 20, stroke = 3 }) {
  const p = Math.min(100, Math.max(0, Number(percent) || 0))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = c * (1 - p / 100)
  const full = p >= 99
  return (
    <svg width={size} height={size} className="shrink-0" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={full ? '#EF4444' : '#E05C2A'}
        strokeWidth={stroke}
        strokeDasharray={`${c} ${c}`}
        strokeDashoffset={dash}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  )
}
