import React from 'react';
import { Navigation } from 'lucide-react';
import { NextHaltETA } from '@/types/train';
import { cn } from '@/utils/cn';

interface ETAChipProps {
  eta?: string;
  nextHaltETA?: NextHaltETA;
  className?: string;
}

export function ETAChip({ eta, nextHaltETA, className }: ETAChipProps) {
  if (nextHaltETA && nextHaltETA.delayStatus !== 'unavailable') {
    const isDelayed = nextHaltETA.delayMinutes > 0;

    return (
      <div
        className={cn(
          'glass-panel flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl px-3.5 py-2 text-xs shadow-sm transition-all',
          className
        )}
      >
        <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
          <Navigation className="h-3.5 w-3.5 text-rail-blue animate-pulse flex-shrink-0" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Next Halt</span>
          <span className="font-bold text-slate-900 dark:text-white">{nextHaltETA.stationName}</span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            Sch: <span className="font-semibold text-slate-700 dark:text-slate-300">{nextHaltETA.scheduledArrival}</span>
          </span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="font-bold text-rail-blue">
            ETA: {nextHaltETA.estimatedArrival}
          </span>
          <span
            className={cn(
              'rounded-md px-1.5 py-0.5 text-[10px] font-bold font-sans tracking-tight border',
              isDelayed
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
            )}
          >
            {nextHaltETA.delayText}
          </span>
        </div>
      </div>
    );
  }

  // Unavailable or generic fallback
  const displayEta = eta && eta !== 'Calculating...' ? eta : 'ETA unavailable';

  return (
    <div
      className={cn(
        'glass-panel inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300',
        className
      )}
    >
      <Navigation className="h-3.5 w-3.5 text-rail-blue animate-pulse" />
      <span>{displayEta.startsWith('ETA:') ? displayEta : `ETA: ${displayEta}`}</span>
    </div>
  );
}
