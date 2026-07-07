'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function LoadingSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-2xl bg-neutral-900/60 border border-neutral-800/40 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-neutral-800/20 before:to-transparent',
        className,
      )}
      {...props}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-neutral-950/40 border border-neutral-900 rounded-3xl p-4 space-y-4">
      <LoadingSkeleton className="aspect-square w-full rounded-2xl" />
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <LoadingSkeleton className="h-5 w-16" />
          <LoadingSkeleton className="h-5 w-10" />
        </div>
        <LoadingSkeleton className="h-6 w-3/4" />
        <LoadingSkeleton className="h-4 w-full" />
        <LoadingSkeleton className="h-4 w-5/6" />
        <div className="flex justify-between items-center pt-2">
          <LoadingSkeleton className="h-6 w-20" />
          <LoadingSkeleton className="h-10 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
