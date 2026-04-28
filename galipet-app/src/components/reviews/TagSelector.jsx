import { Check } from 'lucide-react'

export default function TagSelector({ options, selected, onToggle }) {
  const set = new Set(selected || [])
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(({ value, label }) => {
        const on = set.has(value)
        return (
          <button
            key={value}
            type="button"
            onClick={() => onToggle?.(value, !on)}
            className={[
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-left text-sm font-medium transition',
              on
                ? 'border-[#E05C2A] bg-[#FEF3EE] text-[#E05C2A]'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
            ].join(' ')}
          >
            {on ? <Check className="h-4 w-4 shrink-0 text-[#E05C2A]" strokeWidth={2.5} aria-hidden /> : null}
            {label}
          </button>
        )
      })}
    </div>
  )
}
