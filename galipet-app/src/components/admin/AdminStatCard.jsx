export default function AdminStatCard({ title, value, subtitle }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-black text-gray-900">{value}</p>
      {subtitle ? <p className="mt-1 text-xs text-gray-500">{subtitle}</p> : null}
    </div>
  )
}
