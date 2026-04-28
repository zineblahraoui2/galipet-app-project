import { CRITERIA_LABELS } from './reviewConfig.js'
import { CriteriaIcon } from './criteriaIcons.jsx'
import StarRating from './StarRating.jsx'

export default function CriteriaRating({ value, onChange }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {CRITERIA_LABELS.map(({ key, label }) => (
        <div key={key} className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white px-3 py-3">
          <p className="flex items-center gap-2 text-sm font-medium text-gray-800">
            <CriteriaIcon criterionKey={key} />
            {label}
          </p>
          <StarRating
            value={value[key] || 0}
            onChange={(n) => onChange?.({ ...value, [key]: n })}
            size="sm"
          />
        </div>
      ))}
    </div>
  )
}
