import { SiteHeader } from "@/components/site-header";

export default function ProductsLoading() {
  return (
    <main className="min-h-screen bg-[#fcfbfe]">
      <SiteHeader />
      <div className="container-shell py-8">
        <div className="skeleton h-3 w-28 rounded" />
        <div className="skeleton mt-4 h-9 w-64 rounded-lg" />
        <div className="skeleton mt-3 h-3 w-80 rounded" />
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-[240px_1fr]">
          <div className="skeleton hidden h-96 rounded-2xl lg:block" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-2xl border border-[#f0ecf6] bg-white">
                <div className="skeleton aspect-[4/4.6] w-full" />
                <div className="space-y-2 p-3">
                  <div className="skeleton h-2.5 w-16 rounded" />
                  <div className="skeleton h-3 w-full rounded" />
                  <div className="skeleton h-4 w-20 rounded" />
                  <div className="skeleton h-9 w-full rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <p role="status" className="sr-only">Loading products</p>
      </div>
    </main>
  );
}
