export default function DashboardLoading() {
  return (
    <div aria-label="页面加载中" role="status" className="space-y-5">
      <span className="sr-only">正在加载页面内容...</span>
      <div className="h-7 w-40 animate-pulse rounded-lg bg-slate-100" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="rounded-2xl border border-slate-100 bg-white px-3 py-4 shadow-sm">
            <div className="mx-auto h-3 w-20 animate-pulse rounded bg-slate-100" />
            <div className="mx-auto mt-3 h-8 w-14 animate-pulse rounded bg-slate-100" />
            <div className="mx-auto mt-2 h-2 w-24 animate-pulse rounded bg-slate-50" />
          </div>
        ))}
      </div>
      <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4">
        <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-slate-50" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-slate-50" />
        <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}
