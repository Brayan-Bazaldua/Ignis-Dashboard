export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-8 w-2/3 max-w-xl" />
      <div className="skeleton h-4 w-full max-w-3xl" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="glass-panel rounded-lg p-4">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton mt-4 h-8 w-16" />
            <div className="skeleton mt-2 h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass-panel rounded-lg p-5 lg:col-span-2">
          <div className="skeleton h-5 w-40" />
          <div className="skeleton mt-4 h-64 w-full" />
        </div>
        <div className="glass-panel rounded-lg p-5">
          <div className="skeleton h-5 w-32" />
          <div className="skeleton mt-4 h-64 w-full" />
        </div>
      </div>
    </div>
  );
}
