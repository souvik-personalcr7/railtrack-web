import { create } from 'zustand';
import { SearchResult } from '@/types/train';
import { useAuthStore } from '@/store/auth';

interface FavoritesState {
  favorites: SearchResult[];
  userId: string | null;
  isLoading: boolean;
  setUser: (userId: string | null) => void;
  setFavorites: (favorites: SearchResult[]) => void;
  clearFavorites: () => void;
  fetchFavorites: () => Promise<void>;
  addFavorite: (train: SearchResult) => Promise<void>;
  removeFavorite: (trainId: string) => Promise<void>;
  isFavorite: (trainId: string) => boolean;
  toggleFavorite: (train: SearchResult) => Promise<void>;
}

const GUEST_STORAGE_KEY = 'railgaadi-favorites_guest';

function getStoredFavorites(userId: string | null): SearchResult[] {
  if (typeof window === 'undefined') return [];
  const key = userId ? `railgaadi-favorites_${userId}` : GUEST_STORAGE_KEY;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to read favorites from localStorage:', e);
  }
  return [];
}

function persistFavorites(userId: string | null, favorites: SearchResult[]) {
  if (typeof window === 'undefined') return;
  const key = userId ? `railgaadi-favorites_${userId}` : GUEST_STORAGE_KEY;
  try {
    localStorage.setItem(key, JSON.stringify(favorites));
  } catch (e) {
    console.error('Failed to save favorites to localStorage:', e);
  }
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: typeof window !== 'undefined' ? getStoredFavorites(null) : [],
  userId: null,
  isLoading: false,

  setUser: (userId: string | null) => {
    if (!userId) {
      const guestFavs = getStoredFavorites(null);
      set({ userId: null, favorites: guestFavs });
      return;
    }

    const previousUserId = get().userId;
    const initialFavorites = getStoredFavorites(userId);
    const guestFavs = getStoredFavorites(null);

    // Merge guest favorites if any existed
    let mergedFavorites = [...initialFavorites];
    if (guestFavs.length > 0) {
      for (const g of guestFavs) {
        const gKey = String(g.id || g.number);
        const exists = mergedFavorites.some(
          (f) => String(f.id) === gKey || String(f.number) === gKey
        );
        if (!exists) {
          mergedFavorites.push(g);
        }
      }
      // Clear guest favorites now that they are merged
      try {
        localStorage.removeItem(GUEST_STORAGE_KEY);
      } catch (e) {
        // ignore
      }
    }

    if (previousUserId !== userId || guestFavs.length > 0) {
      set({ userId, favorites: mergedFavorites });
      persistFavorites(userId, mergedFavorites);
    } else {
      set({ userId });
    }

    // Sync fresh favorites from the database
    get().fetchFavorites();
  },

  setFavorites: (favorites: SearchResult[]) => {
    let { userId } = get();
    if (!userId) {
      userId = useAuthStore.getState().user?.id || null;
    }
    set({ favorites, userId });
    persistFavorites(userId, favorites);
  },

  clearFavorites: () => {
    set({ userId: null, favorites: [] });
  },

  fetchFavorites: async () => {
    let { userId } = get();
    if (!userId) {
      const authUser = useAuthStore.getState().user;
      if (authUser?.id) {
        userId = authUser.id;
        set({ userId });
      }
    }

    if (!userId) {
      const guestFavs = getStoredFavorites(null);
      set({ favorites: guestFavs });
      return;
    }

    set({ isLoading: true });
    try {
      const res = await fetch('/api/favorites', {
        method: 'GET',
        cache: 'no-store',
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.favorites)) {
        const localFavs = get().favorites;
        // Merge any local favorites not yet on server
        const merged = [...data.favorites];
        for (const local of localFavs) {
          const lKey = String(local.id || local.number);
          const existsOnServer = merged.some(
            (s) => String(s.id) === lKey || String(s.number) === lKey
          );
          if (!existsOnServer) {
            merged.push(local);
            // Proactively post to server
            fetch('/api/favorites', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ train: local }),
            }).catch(() => {});
          }
        }
        set({ favorites: merged });
        persistFavorites(userId, merged);
      } else if (res.status === 401) {
        set({ favorites: getStoredFavorites(null), userId: null });
      }
    } catch (error) {
      console.error('Failed to fetch favorites from server:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addFavorite: async (train: SearchResult) => {
    let { userId, favorites } = get();
    if (!userId) {
      const authUser = useAuthStore.getState().user;
      if (authUser?.id) {
        userId = authUser.id;
        set({ userId });
      }
    }

    const trainKey = String(train.id || train.number);
    const trainNum = String(train.number || train.id);

    const exists = favorites.some(
      (f) => String(f.id) === trainKey || String(f.number) === trainNum
    );
    if (exists) return;

    const newFavorites = [train, ...favorites];
    set({ favorites: newFavorites });
    persistFavorites(userId, newFavorites);

    if (userId) {
      try {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ train }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          // Rollback on server error
          set({ favorites });
          persistFavorites(userId, favorites);
        }
      } catch (error) {
        console.error('Failed to add favorite on server:', error);
        set({ favorites });
        persistFavorites(userId, favorites);
      }
    }
  },

  removeFavorite: async (trainId: string) => {
    let { userId, favorites } = get();
    if (!userId) {
      const authUser = useAuthStore.getState().user;
      if (authUser?.id) {
        userId = authUser.id;
        set({ userId });
      }
    }

    const trainKey = String(trainId);
    const previousFavorites = favorites;
    const newFavorites = favorites.filter(
      (f) => String(f.id) !== trainKey && String(f.number) !== trainKey
    );
    set({ favorites: newFavorites });
    persistFavorites(userId, newFavorites);

    if (userId) {
      try {
        const res = await fetch(`/api/favorites?trainId=${encodeURIComponent(trainKey)}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          // Rollback on server error
          set({ favorites: previousFavorites });
          persistFavorites(userId, previousFavorites);
        }
      } catch (error) {
        console.error('Failed to remove favorite on server:', error);
        set({ favorites: previousFavorites });
        persistFavorites(userId, previousFavorites);
      }
    }
  },

  isFavorite: (trainId: string) => {
    const { favorites } = get();
    const trainKey = String(trainId);
    return favorites.some(
      (f) => String(f.id) === trainKey || String(f.number) === trainKey
    );
  },

  toggleFavorite: async (train: SearchResult) => {
    const { isFavorite, removeFavorite, addFavorite } = get();
    const trainKey = String(train.id || train.number);
    const isFav = isFavorite(trainKey);
    if (isFav) {
      await removeFavorite(trainKey);
    } else {
      await addFavorite(train);
    }
  },
}));
