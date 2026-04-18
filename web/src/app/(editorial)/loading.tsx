// Shared loading skeleton for the (editorial) route group
export default function EditorialLoading() {
  return (
    <div className="flex-1 px-8 py-8 max-w-[1400px] mx-auto animate-pulse">
      {/* Page title */}
      <div className="h-7 w-48 bg-slate-200 rounded-lg mb-2" />
      <div className="h-4 w-72 bg-slate-100 rounded mb-8" />

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 p-5 h-28" />
        ))}
      </div>

      {/* Content area */}
      <div className="bg-white rounded-xl border border-slate-100 h-96" />
    </div>
  );
}
