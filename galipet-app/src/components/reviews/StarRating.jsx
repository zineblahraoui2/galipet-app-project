import { useState } from 'react'
import { Star } from 'lucide-react'

const GAP = {
  lg: 'gap-1',
  sm: 'gap-0.5',
}

const ICON = {
  lg: 'h-8 w-8',
  sm: 'h-4 w-4',
}

export default function StarRating({ value, onChange, size = 'lg', readonly = false }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0))
  const gap = GAP[size] || GAP.lg
  const icon = ICON[size] || ICON.lg
  const [hover, setHover] = useState(0)
  const display = readonly ? v : hover || v

  return (
    <div
      className={`flex flex-row items-center ${gap}`}
      role={readonly ? undefined : 'radiogroup'}
      aria-label="Rating"
      onMouseLeave={readonly ? undefined : () => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(display)
        return (
          <button
            key={n}
            type="button"
            disabled={readonly}
            tabIndex={readonly ? -1 : 0}
            onMouseEnter={readonly ? undefined : () => setHover(n)}
            onClick={() => !readonly && onChange?.(n)}
            className={[
              'flex items-center justify-center rounded p-0.5 transition',
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110',
            ].join(' ')}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
          >
            <Star
              className={[
                icon,
                'shrink-0 transition-colors',
                filled ? 'fill-[#E05C2A] text-[#E05C2A]' : 'fill-gray-200 text-gray-200',
              ].join(' ')}
              strokeWidth={filled ? 0 : 1.25}
              aria-hidden
            />
          </button>
        )
      })}
    </div>
  )
}
