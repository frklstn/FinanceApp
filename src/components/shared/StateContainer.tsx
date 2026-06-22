import React from 'react';
import { AlertCircle, AlertTriangle, Inbox } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StateContainerProps {
  /** If true, renders the loading state */
  loading?: boolean;
  /** If provided, renders an error state with this message */
  error?: string | null;
  /** If true (and not loading/error), renders the empty state */
  isEmpty?: boolean;
  /** Title for the empty state */
  emptyTitle?: string;
  /** Description for the empty state */
  emptyDescription?: string;
  /** Optional action button for empty state (e.g., "Add New") */
  emptyAction?: React.ReactNode;
  /** Custom shimmer/loading component. If omitted, uses default cards */
  loadingFallback?: React.ReactNode;
  /** Optional retry function for error state */
  onRetry?: () => void;
  /** The actual content to render when data is ready */
  children: React.ReactNode;
  className?: string;
}

export function StateContainer({
  loading,
  error,
  isEmpty,
  emptyTitle = 'Tidak ada data',
  emptyDescription = 'Belum ada catatan yang ditambahkan.',
  emptyAction,
  loadingFallback,
  onRetry,
  children,
  className,
}: StateContainerProps) {
  if (loading) {
    return loadingFallback ? (
      <>{loadingFallback}</>
    ) : (
      <div className={cn("space-y-4 animate-pulse", className)}>
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-32 bg-white/5 border border-white/10 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card glass className={cn("p-6 border-rose-500/20 bg-rose-500/5", className)}>
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-3 bg-rose-500/10 rounded-full">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-rose-500 uppercase tracking-tight">Terjadi Kesalahan</h3>
            <p className="text-xs text-white/50">{error}</p>
          </div>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="text-xs uppercase tracking-wider">
              Coba Lagi
            </Button>
          )}
        </div>
      </Card>
    );
  }

  if (isEmpty) {
    return (
      <Card glass className={cn("p-12 border-dashed border-white/10 bg-white/[0.02]", className)}>
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-4 bg-white/5 rounded-full">
            <Inbox className="w-8 h-8 text-white/20" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">{emptyTitle}</h3>
            <p className="text-xs text-white/40">{emptyDescription}</p>
          </div>
          {emptyAction && <div className="pt-2">{emptyAction}</div>}
        </div>
      </Card>
    );
  }

  return <div className={className}>{children}</div>;
}