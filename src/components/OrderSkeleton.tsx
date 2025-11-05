import { Skeleton } from "@/components/ui/skeleton";

export const OrderSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-accent/5 to-accent/10">
      <div className="h-20 bg-card border-b" />
      
      <main className="container mx-auto px-4 py-6 md:py-10">
        <div className="mb-10 space-y-8">
          <div className="max-w-2xl mx-auto">
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
          
          <div>
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="flex gap-4 overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-80 rounded-lg flex-shrink-0" />
              ))}
            </div>
          </div>
        </div>

        <div className="mb-16">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
