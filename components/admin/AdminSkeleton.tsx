import React from 'react';

export const AdminSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 bg-white/10 rounded w-64"></div>
        <div className="flex gap-4">
          <div className="h-10 bg-white/10 rounded w-32"></div>
          <div className="h-10 bg-white/10 rounded w-32"></div>
        </div>
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-glass-card p-6 rounded-3xl border border-white/5">
            <div className="h-4 bg-white/10 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-white/10 rounded w-3/4"></div>
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-glass-card rounded-3xl border border-white/5 overflow-hidden">
        <div className="border-b border-white/5 p-6">
          <div className="h-6 bg-white/10 rounded w-48"></div>
        </div>
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-white/10 rounded-full"></div>
                <div>
                  <div className="h-4 bg-white/10 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-white/10 rounded w-24"></div>
                </div>
              </div>
              <div className="h-8 bg-white/10 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Individual skeleton components
export const BookingCardSkeleton: React.FC = () => (
  <div className="p-4 border border-white/5 rounded-2xl bg-glass-card animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-4 bg-white/10 rounded w-32"></div>
        <div className="h-3 bg-white/10 rounded w-24"></div>
      </div>
      <div className="h-8 bg-white/10 rounded w-20"></div>
    </div>
  </div>
);

export const StatCardSkeleton: React.FC = () => (
  <div className="bg-glass-card p-6 rounded-3xl border border-white/5 animate-pulse">
    <div className="h-4 bg-white/10 rounded w-1/2 mb-4"></div>
    <div className="h-8 bg-white/10 rounded w-3/4"></div>
  </div>
);