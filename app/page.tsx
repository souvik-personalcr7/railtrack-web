'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Train,
  ArrowRight,
  Sparkles,
  Clock,
  History,
  MapPin,
  Zap,
  Search,
  Loader2,
  AlertCircle,
  X,
  Compass,
} from 'lucide-react';
import { useTrainSearch } from '@/hooks/useTrainSearch';
import { useSearchStore } from '@/store/search';
import { FavoriteButton } from '@/features/favorites/FavoriteButton';
import { SearchResult } from '@/types/train';
import { cn } from '@/utils/cn';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function HomePage() {
  const router = useRouter();
  const { recentSearches, addRecentSearch, clearRecentSearches, openSearch } = useSearchStore();
  const [inputValue, setInputValue] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const debouncedQuery = useDebounce(inputValue, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: searchResults, isLoading, isError } = useTrainSearch(debouncedQuery);

  // ⌘K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
        inputRef.current?.focus();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (train: SearchResult) => {
    addRecentSearch(train);
    setIsSearchOpen(false);
    setInputValue('');
    setSubmittedQuery('');
    router.push(`/train/${train.number}`);
  };

  const handleSearchSubmit = () => {
    const q = inputValue.trim();
    if (!q) return;
    setSubmittedQuery(q);
    setIsSearchOpen(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    }
    if (e.key === 'Escape') {
      setIsSearchOpen(false);
      inputRef.current?.blur();
    }
  };

  const showDropdown = isSearchOpen && (inputValue || debouncedQuery);

  // Search results for submitted query or active typing
  const activeResults = searchResults || [];
  const isDirectNumber = submittedQuery && /^\d{4,5}$/.test(submittedQuery);

  return (
    <div className="space-y-10 py-4">
      {/* ─── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative overflow-visible rounded-3xl bg-gradient-to-b from-sky-500/10 via-background to-background p-6 sm:p-8 md:p-14 text-center border border-sky-500/20 shadow-glass">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl"
        >
          <div className="w-full sm:w-auto flex sm:inline-flex items-center justify-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1.5 text-xs font-semibold text-rail-blue backdrop-blur-md mb-6 mx-0 sm:mx-auto">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>Real-time Indian Railways Intelligence Powered by RailRadar</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Track Any Train in <span className="text-rail-blue">Real-time</span>
          </h1>

          <p className="mt-4 text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
            Search any train number or name to track live journey status, view route maps, and save your favorites.
          </p>

          {/* ─── Search Input ─── */}
          <div className="mt-8 relative max-w-xl mx-auto text-left">
            {/* Input box */}
            <div
              className={cn(
                'glass-panel flex items-center gap-2 rounded-2xl p-2 pl-4 shadow-glass transition-all duration-300',
                isSearchOpen ? 'border-rail-blue/50 shadow-glow ring-1 ring-rail-blue/20' : ''
              )}
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                onKeyDown={handleInputKeyDown}
                placeholder="Enter train number or name"
                className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder-slate-400 outline-none dark:text-white dark:placeholder-slate-500"
              />

              {inputValue && (
                <button
                  type="button"
                  onClick={() => {
                    setInputValue('');
                    setSubmittedQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex-shrink-0 mr-1"
                  title="Clear input"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Clickable Search Button */}
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="flex items-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl bg-rail-blue px-2.5 py-1.5 sm:px-4 sm:py-2.5 text-[11px] sm:text-xs font-bold text-white shadow-glow transition-all hover:bg-sky-600 active:scale-95 flex-shrink-0 cursor-pointer"
                title="Search Train"
              >
                {isLoading && inputValue ? (
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                ) : (
                  <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
                <span>Search</span>
              </button>
            </div>

            {/* Search Dropdown */}
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  ref={dropdownRef}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full mt-2 z-[100] max-h-[360px] overflow-y-auto rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-3 shadow-2xl border border-slate-200 dark:border-slate-800"
                >
                  {/* Error state */}
                  {isError && (
                    <div className="flex items-center gap-2 py-4 text-center justify-center text-xs text-rose-500">
                      <AlertCircle className="h-4 w-4" />
                      <span>Error loading trains. Please try again.</span>
                    </div>
                  )}

                  {/* No results */}
                  {!isLoading && !isError && searchResults && searchResults.length === 0 && (
                    <div className="py-6 text-center text-xs text-slate-500">
                      No trains found matching &quot;<strong>{inputValue}</strong>&quot;.
                      {/^\d{4,5}$/.test(inputValue.trim()) && (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => {
                              setIsSearchOpen(false);
                              router.push(`/train/${inputValue.trim()}`);
                            }}
                            className="inline-flex items-center gap-2 rounded-xl bg-rail-blue px-4 py-2 text-xs font-semibold text-white shadow-glow hover:bg-sky-600 transition-all"
                          >
                            <Train className="h-4 w-4" />
                            Track train #{inputValue.trim()} directly →
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Direct number search option */}
                  {inputValue && /^\d{4,5}$/.test(inputValue.trim()) && (
                    <div className="w-full flex items-center justify-between gap-3 rounded-xl p-3 mb-2 bg-rail-blue/10 border border-rail-blue/30 text-rail-blue text-xs font-bold hover:bg-rail-blue hover:text-white transition-all group">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSearchOpen(false);
                          router.push(`/train/${inputValue.trim()}`);
                        }}
                        className="flex items-center gap-2.5 flex-1 text-left"
                      >
                        <Train className="h-4 w-4" />
                        <span>Track train #{inputValue.trim()} live →</span>
                      </button>
                      <FavoriteButton
                        train={{
                          id: inputValue.trim(),
                          number: inputValue.trim(),
                          name: `Train #${inputValue.trim()}`,
                          origin: { code: '', name: '' },
                          destination: { code: '', name: '' },
                        }}
                        size="sm"
                      />
                    </div>
                  )}

                  {/* Results List */}
                  {searchResults && searchResults.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between px-1 pb-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          {inputValue ? 'Matching Trains' : 'Popular Trains'}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          Click ❤️ to favorite
                        </span>
                      </div>
                      {searchResults.map((train) => (
                        <div
                          key={train.id || train.number}
                          className="w-full glass-panel group flex items-center justify-between rounded-xl p-2.5 sm:p-3 transition-all duration-150 hover:bg-rail-blue/10 hover:border-rail-blue/40"
                        >
                          <button
                            type="button"
                            onClick={() => handleSelect(train)}
                            className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                          >
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-rail-blue/10 text-rail-blue group-hover:bg-rail-blue group-hover:text-white transition-colors">
                              <Train className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="rounded-md bg-rail-blue/15 px-2 py-0.5 font-mono text-xs font-bold text-rail-blue dark:bg-rail-blue/25 flex-shrink-0">
                                  #{train.number}
                                </span>
                                <span className="font-bold text-slate-900 dark:text-white text-sm truncate">
                                  {train.name}
                                </span>
                              </div>
                              {(train.origin.name || train.destination.name) && (
                                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                                  <span>{train.origin.name} ({train.origin.code})</span>
                                  <ArrowRight className="h-3 w-3 flex-shrink-0 text-slate-400" />
                                  <span>{train.destination.name} ({train.destination.code})</span>
                                </div>
                              )}
                            </div>
                          </button>

                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            <FavoriteButton train={train} size="sm" />
                            <button
                              type="button"
                              onClick={() => handleSelect(train)}
                              className="p-1 text-slate-400 group-hover:text-rail-blue hover:scale-110 transition-transform"
                              title="Track Live"
                            >
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Chips */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Popular:</span>
            {['12951', '22436', '12301', '12621', '12001'].map((num) => (
              <button
                key={num}
                onClick={() => {
                  setInputValue(num);
                  setIsSearchOpen(true);
                  inputRef.current?.focus();
                }}
                className="rounded-lg bg-slate-200/70 dark:bg-slate-800/70 px-2.5 py-1 font-mono font-semibold text-slate-700 dark:text-slate-300 hover:bg-rail-blue hover:text-white transition-colors cursor-pointer"
              >
                #{num}
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ─── Submitted Search Results View (If Search was performed) ─────── */}
      {submittedQuery && (
        <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rail-blue/10 text-rail-blue font-bold">
                <Search className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Search Results for &quot;{submittedQuery}&quot;
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activeResults.length} train{activeResults.length !== 1 ? 's' : ''} found. Click ❤️ to favorite any train.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setSubmittedQuery('');
                setInputValue('');
              }}
              className="text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              Clear Results
            </button>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeResults.map((train) => (
              <motion.div
                key={train.id || train.number}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel group relative flex flex-col justify-between rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glass-hover"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rail-blue/10 text-rail-blue group-hover:bg-rail-blue group-hover:text-white transition-colors">
                        <Train className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-mono text-xs font-bold text-rail-blue block">
                          #{train.number}
                        </span>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">
                          {train.name}
                        </h3>
                      </div>
                    </div>

                    <FavoriteButton train={train} size="md" />
                  </div>

                  {(train.origin?.name || train.destination?.name) && (
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 rounded-xl bg-slate-100/60 dark:bg-slate-800/60 p-2.5">
                      <div className="min-w-0 pr-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">From</span>
                        <span className="font-semibold truncate block">{train.origin.name} ({train.origin.code})</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 flex-shrink-0 mx-1" />
                      <div className="min-w-0 pl-1 text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">To</span>
                        <span className="font-semibold truncate block">{train.destination.name} ({train.destination.code})</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400">Live GPS & Route</span>
                  <Link
                    href={`/train/${train.number}`}
                    onClick={() => addRecentSearch(train)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rail-blue px-3.5 py-1.5 text-xs font-bold text-white shadow-glow hover:bg-sky-600 transition-all active:scale-95"
                  >
                    <span>Track Live</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </motion.div>
            ))}

            {/* Direct match card if train number wasn't in static database */}
            {isDirectNumber && !activeResults.some((t) => t.number === submittedQuery) && (
              <div className="glass-panel group relative flex flex-col justify-between rounded-2xl p-4 border border-rail-blue/30">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rail-blue text-white shadow-glow">
                      <Train className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="font-mono text-xs font-bold text-rail-blue block">
                        #{submittedQuery}
                      </span>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                        Track Train #{submittedQuery}
                      </h3>
                    </div>
                  </div>

                  <FavoriteButton
                    train={{
                      id: submittedQuery,
                      number: submittedQuery,
                      name: `Train #${submittedQuery}`,
                      origin: { code: '', name: '' },
                      destination: { code: '', name: '' },
                    }}
                    size="md"
                  />
                </div>

                <p className="text-xs text-slate-500 mt-3">
                  Query live schedule, current location, and delay metrics directly from RailRadar.
                </p>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-end">
                  <Link
                    href={`/train/${submittedQuery}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rail-blue px-4 py-2 text-xs font-bold text-white shadow-glow hover:bg-sky-600 transition-all active:scale-95"
                  >
                    <span>Track Train #{submittedQuery} Live</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── Recent Searches ───────────────────────────────────────────────── */}
      {recentSearches.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-white">
              <History className="h-5 w-5 text-rail-blue" />
              <span>Recent Searches</span>
            </div>
            <button
              onClick={clearRecentSearches}
              className="text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentSearches.map((train) => (
              <div
                key={train.id || train.number}
                className="glass-panel group flex items-center justify-between rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glass-hover"
              >
                <Link
                  href={`/train/${train.number}`}
                  className="flex items-center gap-3 min-w-0 flex-1 pr-2 cursor-pointer"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rail-blue/10 text-rail-blue group-hover:bg-rail-blue group-hover:text-white transition-colors flex-shrink-0">
                    <Train className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-mono text-[11px] font-bold text-rail-blue block">
                      #{train.number}
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                      {train.name}
                    </h4>
                    {train.origin?.name && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="truncate">{train.origin.name}</span>
                        <ArrowRight className="h-2.5 w-2.5 flex-shrink-0" />
                        <span className="truncate">{train.destination.name}</span>
                      </div>
                    )}
                  </div>
                </Link>

                <div className="flex items-center gap-2 flex-shrink-0 ml-1">
                  <FavoriteButton train={train} size="sm" />
                  <Link
                    href={`/train/${train.number}`}
                    className="p-1 text-slate-400 group-hover:text-rail-blue hover:scale-110 transition-transform"
                    title="Track Live"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Feature Grid ──────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          {
            icon: <MapPin className="h-6 w-6" />,
            color: 'bg-sky-500/10 text-rail-blue',
            title: 'Vector Map Tracking',
            desc: 'MapTiler dark vector tiles with animated live train marker, route glow, and follow camera.',
          },
          {
            icon: <Zap className="h-6 w-6" />,
            color: 'bg-emerald-500/10 text-emerald-600',
            title: 'Live 30s Auto-Refresh',
            desc: 'TanStack Query polls RailRadar every 30 seconds for position, delay, and ETA updates.',
          },
          {
            icon: <Clock className="h-6 w-6" />,
            color: 'bg-amber-500/10 text-amber-600',
            title: 'OpenWeather & Terrain',
            desc: 'Per-station live weather and OpenTopography SRTM elevation profiles along the route.',
          },
        ].map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 * i }}
            className="glass-panel rounded-3xl p-6 space-y-3"
          >
            <div className={cn('h-12 w-12 rounded-2xl flex items-center justify-center', f.color)}>
              {f.icon}
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{f.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
