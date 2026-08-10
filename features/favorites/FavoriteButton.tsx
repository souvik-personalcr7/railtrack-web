'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFavoritesStore } from '@/store/favorites';
import { SearchResult } from '@/types/train';
import { cn } from '@/utils/cn';

interface FavoriteButtonProps {
  train: SearchResult;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function FavoriteButton({
  train,
  className,
  size = 'md',
  showLabel = false,
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const trainKey = train.id || train.number;
  const isFav = isFavorite(trainKey);

  const iconSizes = {
    xs: 12,
    sm: 14,
    md: 18,
    lg: 20,
  };

  const buttonSizes = {
    xs: 'h-7 w-7 rounded-lg',
    sm: 'h-8 w-8 rounded-xl',
    md: 'h-10 w-10 rounded-xl',
    lg: 'h-11 px-4 rounded-2xl gap-2',
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(train);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isFav ? `Remove ${train.name || train.number} from favorites` : `Add ${train.name || train.number} to favorites`}
      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
      className={cn(
        'relative inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-90 cursor-pointer select-none flex-shrink-0 z-10',
        buttonSizes[size],
        isFav
          ? 'bg-rose-500/15 text-rose-500 hover:bg-rose-500/25 dark:bg-rose-500/20 dark:hover:bg-rose-500/30'
          : 'bg-slate-200/70 dark:bg-slate-800/70 text-slate-400 hover:bg-rose-500/15 hover:text-rose-500 dark:hover:bg-rose-500/20 dark:hover:text-rose-400',
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isFav ? 'fav' : 'unfav'}
          initial={{ scale: 0.6, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0.6, rotate: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="flex items-center justify-center"
        >
          <Heart
            className={cn(
              isFav ? 'fill-current text-rose-500' : 'text-current transition-colors'
            )}
            style={{ width: iconSizes[size], height: iconSizes[size] }}
          />
        </motion.div>
      </AnimatePresence>

      {showLabel && (
        <span className={cn('text-xs font-semibold', isFav ? 'text-rose-500' : 'text-slate-600 dark:text-slate-300')}>
          {isFav ? 'Saved' : 'Favorite'}
        </span>
      )}
    </button>
  );
}
