import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useFavoritesStore } from '@/store/favorites';
import { SearchResult } from '@/types/train';

async function fetchUserFavorites(): Promise<SearchResult[]> {
  const res = await fetch('/api/favorites', {
    method: 'GET',
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    return [];
  }
  return (data.favorites as SearchResult[]) || [];
}

export function useFavorites(userId?: string | null) {
  const { setFavorites } = useFavoritesStore();

  const query = useQuery({
    queryKey: ['favorites', userId],
    queryFn: fetchUserFavorites,
    enabled: !!userId,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (query.data && userId) {
      setFavorites(query.data);
    }
  }, [query.data, userId, setFavorites]);

  return query;
}
