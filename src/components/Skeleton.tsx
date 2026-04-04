'use client';

export function FoodCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border animate-pulse">
      <div className="h-48 bg-input" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-input rounded w-3/4" />
        <div className="flex items-center justify-between">
          <div className="h-5 bg-input rounded w-1/3" />
          <div className="h-9 w-9 bg-input rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border animate-pulse text-center p-6">
      <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-input" />
      <div className="h-4 bg-input rounded w-2/3 mx-auto" />
    </div>
  );
}

export function FoodDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="h-80 bg-input rounded-2xl" />
        <div className="space-y-4">
          <div className="h-8 bg-input rounded w-3/4" />
          <div className="h-4 bg-input rounded w-full" />
          <div className="h-4 bg-input rounded w-2/3" />
          <div className="h-6 bg-input rounded w-1/3 mt-4" />
          <div className="h-12 bg-input rounded-xl w-full mt-6" />
        </div>
      </div>
    </div>
  );
}
