export default function StatCard({ title, value, subtitle, Icon }) {
  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
          {subtitle ? <p className="mt-1 text-sm text-gray-600">{subtitle}</p> : null}
        </div>
        {Icon ? <Icon className="h-8 w-8 shrink-0 text-[#E05C2A]" aria-hidden /> : null}
      </div>
    </article>
  )
}
