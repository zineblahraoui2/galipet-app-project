export default function ToolCard({ Icon, title, value }) {
  return (
    <article className="rounded-2xl border border-gray-100 bg-[#F8F3EE] p-4 text-center shadow-sm transition hover:shadow-md">
      {Icon ? (
        <div className="flex justify-center" aria-hidden>
          <Icon className="h-8 w-8 text-[#E05C2A]" />
        </div>
      ) : null}
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600">{title}</p>
    </article>
  )
}
