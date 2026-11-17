'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, TrainFront } from 'lucide-react';
import { Station } from '@/types/train';
import { addMinutesToTime } from '@/utils/format';
import { cn } from '@/utils/cn';

interface TimelineProps {
  stations: Station[];
  currentStationCode?: string;
  className?: string;
}

interface HaltSection {
  halt: Station;
  haltIndex: number;
  skipStations: Station[];
}

function buildHaltSections(stations: Station[]): HaltSection[] {
  if (!stations || stations.length === 0) return [];

  const sections: HaltSection[] = [];
  let currentSection: HaltSection | null = null;

  stations.forEach((st, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === stations.length - 1;
    // Station is halt if explicitly true or first/last or not explicitly false
    const isHalt = isFirst || isLast || st.isHalt !== false;

    if (isHalt) {
      currentSection = {
        halt: st,
        haltIndex: idx,
        skipStations: [],
      };
      sections.push(currentSection);
    } else {
      if (currentSection) {
        currentSection.skipStations.push(st);
      } else {
        currentSection = {
          halt: st,
          haltIndex: idx,
          skipStations: [],
        };
        sections.push(currentSection);
      }
    }
  });

  return sections;
}

export function Timeline({ stations, currentStationCode, className }: TimelineProps) {
  const [expandedHaltCodes, setExpandedHaltCodes] = useState<Record<string, boolean>>({});

  const haltSections = useMemo(() => buildHaltSections(stations), [stations]);

  // Determine current active station where train icon should appear
  const activeStation = useMemo(() => {
    return stations.find((s) => s.status === 'current' || s.code === currentStationCode);
  }, [stations, currentStationCode]);

  const lastPassedStation = useMemo(() => {
    return [...stations].reverse().find((s) => s.status === 'passed');
  }, [stations]);

  const activeCode = activeStation?.code || currentStationCode;

  // Auto-expand any halt section that contains the current active station (e.g. Chamagram)
  useEffect(() => {
    if (!activeCode) return;
    for (const sec of haltSections) {
      if (sec.skipStations.some((sk) => sk.code === activeCode || sk.status === 'current')) {
        setExpandedHaltCodes((prev) => ({ ...prev, [sec.halt.code]: true }));
        break;
      }
    }
  }, [activeCode, haltSections]);

  const toggleHalt = (code: string) => {
    setExpandedHaltCodes((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  };

  return (
    <div className={cn('glass-panel rounded-3xl p-4 sm:p-6 shadow-glass', className)}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Station Route Timeline
          </h3>
          <p className="text-[11px] text-slate-400">
            Click halt stations to show/hide intermediate skipped stations
          </p>
        </div>
        <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-bold text-sky-600 dark:text-sky-400 border border-sky-500/20">
          Live Tracking
        </span>
      </div>

      {/* 3-Column Header matching "Where is my train" reference */}
      <div className="grid grid-cols-[68px_1fr_68px] sm:grid-cols-[82px_1fr_82px] items-center text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 pb-2 mb-3 border-b border-slate-200/70 dark:border-slate-800/70">
        <div className="text-left">Arrival</div>
        <div className="text-center">Station & Track</div>
        <div className="text-right">Departure</div>
      </div>

      {/* Main Timeline List */}
      <div className="space-y-4">
        {haltSections.map((section, sIdx) => {
          const st = section.halt;
          const isFirst = section.haltIndex === 0;
          const isLast = section.haltIndex === stations.length - 1;
          const isPassed = st.status === 'passed';
          const isCurrent = st.status === 'current' || st.code === activeCode;
          const isDelayed = st.delayMinutes > 0;

          // Arrival calculation
          const schedArr = st.scheduledArrival && st.scheduledArrival !== '--:--' ? st.scheduledArrival : undefined;
          const delayedArr = st.actualArrival || (schedArr && isDelayed ? addMinutesToTime(schedArr, st.delayMinutes) : schedArr);

          // Departure calculation
          const schedDep = st.scheduledDeparture && st.scheduledDeparture !== '--:--' ? st.scheduledDeparture : undefined;
          const delayedDep = st.actualDeparture || (schedDep && isDelayed ? addMinutesToTime(schedDep, st.delayMinutes) : schedDep);

          const hasSkips = section.skipStations.length > 0;
          const isExpanded = !!expandedHaltCodes[st.code];
          const sectionDelay = st.delayMinutes || 0;

          return (
            <div key={st.code + sIdx} className="relative">
              {/* Halt Station Row */}
              <div className="grid grid-cols-[68px_1fr_68px] sm:grid-cols-[82px_1fr_82px] items-start gap-2">
                {/* 1. Left Column: Arrival */}
                <div className="text-left font-mono text-xs flex-shrink-0 pt-0.5">
                  {!isFirst && schedArr ? (
                    <div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                        {schedArr}
                      </div>
                      <div
                        className={cn(
                          'font-bold text-xs',
                          isDelayed
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        )}
                      >
                        {delayedArr || schedArr}
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-[11px]">---</div>
                  )}
                </div>

                {/* 2. Middle Column: Track, Train Icon & Station Details */}
                <div className="relative pl-7 min-w-0">
                  {/* Vertical Track Line */}
                  <div
                    className={cn(
                      'absolute left-2.5 top-1 bottom-0 w-1 -translate-x-1/2 rounded-full',
                      isPassed ? 'bg-sky-500' : 'bg-slate-200 dark:bg-slate-800'
                    )}
                  />

                  {/* Dot / Train Icon Marker */}
                  <div className="absolute left-2.5 top-0.5 -translate-x-1/2 z-10">
                    {isCurrent ? (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg shadow-sky-500/40 ring-4 ring-sky-500/25 animate-pulse">
                        <TrainFront className="h-4 w-4" />
                      </div>
                    ) : isPassed ? (
                      <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-sky-500 ring-2 ring-background">
                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      </div>
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-300 dark:border-slate-600 bg-background ring-2 ring-background" />
                    )}
                  </div>

                  {/* Station Name & Badges */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h4
                        onClick={() => hasSkips && toggleHalt(st.code)}
                        className={cn(
                          'font-bold transition-colors leading-tight',
                          hasSkips && 'cursor-pointer hover:text-sky-600 dark:hover:text-sky-400',
                          isCurrent
                            ? 'text-sky-600 dark:text-sky-400 text-sm sm:text-base font-extrabold'
                            : isPassed
                            ? 'text-slate-900 dark:text-slate-100 text-xs sm:text-sm'
                            : 'text-slate-600 dark:text-slate-400 text-xs sm:text-sm'
                        )}
                      >
                        {st.name}
                      </h4>

                      {isCurrent && (
                        <span className="rounded-md bg-sky-500/15 px-1.5 py-0.2 font-mono text-[9px] font-bold text-sky-600 dark:text-sky-400 border border-sky-500/30">
                          LIVE HERE
                        </span>
                      )}

                      {st.platform && (
                        <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.2 font-mono text-[9px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          Platform {st.platform}
                        </span>
                      )}

                      {/* Halt Delay Badge */}
                      {isDelayed ? (
                        <span className="rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.2 font-mono text-[9px] font-bold border border-rose-500/20">
                          Delayed by {st.delayMinutes}m
                        </span>
                      ) : (
                        <span className="rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 font-mono text-[9px] font-bold border border-emerald-500/20">
                          On Time
                        </span>
                      )}
                    </div>

                    {/* Sub-meta: Distance, Halt duration, Skipped toggle */}
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{st.distanceKm} km</span>
                      {st.haltMinutes !== undefined && st.haltMinutes > 0 && (
                        <span>• Halt: {st.haltMinutes}m</span>
                      )}

                      {/* Expand / Collapse skipped stations badge */}
                      {hasSkips && (
                        <button
                          type="button"
                          onClick={() => toggleHalt(st.code)}
                          className={cn(
                            'inline-flex items-center gap-0.5 rounded-full px-2 py-0.2 text-[10px] font-medium transition-colors border',
                            isExpanded
                              ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
                          )}
                          title={`${isExpanded ? 'Collapse' : 'Expand'} intermediate stations`}
                        >
                          <span>{section.skipStations.length} skipped</span>
                          {isExpanded ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Right Column: Departure */}
                <div className="text-right font-mono text-xs flex-shrink-0 pt-0.5">
                  {!isLast && schedDep ? (
                    <div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                        {schedDep}
                      </div>
                      <div
                        className={cn(
                          'font-bold text-xs',
                          isDelayed
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        )}
                      >
                        {delayedDep || schedDep}
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-[11px]">---</div>
                  )}
                </div>
              </div>

              {/* Intermediate Skipped Stations Section (Tinted Background matching reference) */}
              {isExpanded && hasSkips && (
                <div className="my-2.5 rounded-2xl border border-slate-200/60 bg-slate-100/60 p-2.5 sm:p-3 dark:border-slate-800/80 dark:bg-slate-900/60 space-y-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                    Intermediate Skipped Stations ({section.skipStations.length})
                  </div>

                  {section.skipStations.map((skipSt, skipIdx) => {
                    const isSkipPassed = skipSt.status === 'passed';
                    const isSkipCurrent = skipSt.status === 'current' || skipSt.code === activeCode;
                    
                    // Inherit delay from halt section if not explicitly defined on skip station
                    const effectiveSkipDelay = skipSt.delayMinutes > 0 ? skipSt.delayMinutes : (sectionDelay > 0 ? sectionDelay : 0);
                    const isSkipDelayed = effectiveSkipDelay > 0;

                    const skipSchedArr = skipSt.scheduledArrival !== '--:--' ? skipSt.scheduledArrival : undefined;
                    const skipDelayedArr = skipSt.actualArrival || (skipSchedArr && isSkipDelayed ? addMinutesToTime(skipSchedArr, effectiveSkipDelay) : skipSchedArr);

                    const skipSchedDep = skipSt.scheduledDeparture !== '--:--' ? skipSt.scheduledDeparture : undefined;
                    const skipDelayedDep = skipSt.actualDeparture || (skipSchedDep && isSkipDelayed ? addMinutesToTime(skipSchedDep, effectiveSkipDelay) : skipSchedDep);

                    return (
                      <div
                        key={skipSt.code + skipIdx}
                        className="grid grid-cols-[68px_1fr_68px] sm:grid-cols-[82px_1fr_82px] items-center gap-2"
                      >
                        {/* Skipped Arrival */}
                        <div className="text-left font-mono text-[11px] flex-shrink-0">
                          {skipSchedArr ? (
                            <div>
                              <div className="text-slate-400 text-[10px]">{skipSchedArr}</div>
                              <div
                                className={cn(
                                  'font-bold text-xs',
                                  isSkipDelayed
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                                )}
                              >
                                {skipDelayedArr || skipSchedArr}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px]">---</span>
                          )}
                        </div>

                        {/* Skipped Track & Station */}
                        <div className="relative pl-7 min-w-0">
                          {/* Sub-track line */}
                          <div
                            className={cn(
                              'absolute left-2.5 top-0 bottom-0 w-0.5 -translate-x-1/2',
                              isSkipPassed ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'
                            )}
                          />

                          {/* Marker: TrainFront Icon if train is at this station! */}
                          <div className="absolute left-2.5 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                            {isSkipCurrent ? (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-white shadow-md shadow-sky-500/40 ring-4 ring-sky-500/25 animate-pulse">
                                <TrainFront className="h-3.5 w-3.5" />
                              </div>
                            ) : isSkipPassed ? (
                              <div className="h-2 w-2 rounded-full bg-sky-500" />
                            ) : (
                              <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={cn(
                                  'truncate text-xs font-semibold',
                                  isSkipCurrent
                                    ? 'text-sky-600 dark:text-sky-400 font-bold'
                                    : isSkipPassed
                                    ? 'text-slate-900 dark:text-slate-100'
                                    : 'text-slate-700 dark:text-slate-300'
                                )}
                              >
                                {skipSt.name}
                              </span>
                              <span className="rounded bg-slate-200/70 dark:bg-slate-800 px-1 py-0.2 text-[8px] font-semibold text-slate-500 dark:text-slate-400">
                                Pass
                              </span>
                              {isSkipCurrent && (
                                <span className="rounded bg-sky-500/20 px-1.5 py-0.2 font-mono text-[8px] font-bold text-sky-600 dark:text-sky-400 border border-sky-500/30 animate-pulse">
                                  LIVE HERE
                                </span>
                              )}
                              {isSkipDelayed ? (
                                <span className="rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.2 font-mono text-[9px] font-bold border border-rose-500/20">
                                  +{effectiveSkipDelay}m delay
                                </span>
                              ) : (
                                <span className="rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 font-mono text-[9px] font-bold border border-emerald-500/20">
                                  On Time
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {skipSt.distanceKm} km
                            </span>
                          </div>
                        </div>

                        {/* Skipped Departure */}
                        <div className="text-right font-mono text-[11px] flex-shrink-0">
                          {skipSchedDep ? (
                            <div>
                              <div className="text-slate-400 text-[10px]">{skipSchedDep}</div>
                              <div
                                className={cn(
                                  'font-bold text-xs',
                                  isSkipDelayed
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                                )}
                              >
                                {skipDelayedDep || skipSchedDep}
                              </div>
                            </div>
                          ) : skipSchedArr ? (
                            <div>
                              <div className="text-slate-400 text-[10px]">{skipSchedArr}</div>
                              <div
                                className={cn(
                                  'font-bold text-xs',
                                  isSkipDelayed
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                                )}
                              >
                                {skipDelayedArr || skipSchedArr}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px]">---</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Where is the train right now status bar (matching reference) */}
      <div className="mt-6 pt-4 border-t border-slate-200/70 dark:border-slate-800/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/15 text-sky-500 flex-shrink-0">
            <TrainFront className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {activeStation ? (
                activeStation.actualDeparture
                  ? `Departed ${activeStation.name} at ${activeStation.actualDeparture}`
                  : activeStation.actualArrival
                  ? `Arrived ${activeStation.name} at ${activeStation.actualArrival}`
                  : `Currently at ${activeStation.name}`
              ) : lastPassedStation ? (
                `Departed ${lastPassedStation.name} at ${lastPassedStation.actualDeparture || lastPassedStation.scheduledDeparture}`
              ) : (
                'Train in Transit'
              )}
            </p>
            <p className="text-[10px] text-slate-400">
              Live tracking • Updated just now
            </p>
          </div>
        </div>

        {activeStation && (
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            {activeStation.distanceKm} km covered
          </span>
        )}
      </div>
    </div>
  );
}
