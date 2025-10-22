import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UnifiedInboxItem } from '@/lib/types';

interface InboxStats {
  total: number;
  leads: number;
  pending_approval: number;
  unanswered: number;
  answered: number;
}

interface InboxCache {
  items: UnifiedInboxItem[];
  stats: InboxStats;
  lastFetched: number; // Timestamp
  userId: string;
}

interface InboxStore {
  // Cache data
  cache: Record<string, InboxCache>; // Keyed by userId

  // Actions
  getCachedInbox: (userId: string) => InboxCache | null;
  setCachedInbox: (userId: string, items: UnifiedInboxItem[], stats: InboxStats) => void;
  isCacheValid: (userId: string, maxAgeMs?: number) => boolean;
  invalidateCache: (userId: string) => void;
  clearAllCache: () => void;

  // Update individual items (for optimistic updates)
  updateItem: (userId: string, itemId: string, updates: Partial<UnifiedInboxItem>) => void;
  removeItem: (userId: string, itemId: string) => void;
  addItems: (userId: string, newItems: UnifiedInboxItem[]) => void;
}

// Default cache validity: 5 minutes
const DEFAULT_CACHE_MAX_AGE_MS = 5 * 60 * 1000;

export const useInboxStore = create<InboxStore>()(
  persist(
    (set, get) => ({
      cache: {},

      getCachedInbox: (userId: string) => {
        const cached = get().cache[userId];
        if (!cached) return null;

        return cached;
      },

      setCachedInbox: (userId: string, items: UnifiedInboxItem[], stats: InboxStats) => {
        set((state) => ({
          cache: {
            ...state.cache,
            [userId]: {
              items,
              stats,
              lastFetched: Date.now(),
              userId,
            },
          },
        }));
      },

      isCacheValid: (userId: string, maxAgeMs: number = DEFAULT_CACHE_MAX_AGE_MS) => {
        const cached = get().cache[userId];
        if (!cached) return false;

        const age = Date.now() - cached.lastFetched;
        return age < maxAgeMs;
      },

      invalidateCache: (userId: string) => {
        set((state) => {
          const newCache = { ...state.cache };
          delete newCache[userId];
          return { cache: newCache };
        });
      },

      clearAllCache: () => {
        set({ cache: {} });
      },

      // Optimistic update for individual item
      updateItem: (userId: string, itemId: string, updates: Partial<UnifiedInboxItem>) => {
        set((state) => {
          const cached = state.cache[userId];
          if (!cached) return state;

          const updatedItems = cached.items.map((item) =>
            item.id === itemId ? { ...item, ...updates } : item
          );

          return {
            cache: {
              ...state.cache,
              [userId]: {
                ...cached,
                items: updatedItems,
              },
            },
          };
        });
      },

      // Remove item from cache (e.g., after deletion or reply)
      removeItem: (userId: string, itemId: string) => {
        set((state) => {
          const cached = state.cache[userId];
          if (!cached) return state;

          const updatedItems = cached.items.filter((item) => item.id !== itemId);

          // Recalculate stats
          const newStats = {
            total: updatedItems.length,
            leads: updatedItems.filter((i) => i.lead_info.isLead).length,
            pending_approval: updatedItems.filter((i) => i.type === 'pending_approval').length,
            unanswered: updatedItems.filter((i) => !i.replied_at).length,
            answered: updatedItems.filter((i) => i.replied_at).length,
          };

          return {
            cache: {
              ...state.cache,
              [userId]: {
                ...cached,
                items: updatedItems,
                stats: newStats,
              },
            },
          };
        });
      },

      // Add new items to cache (e.g., after sync)
      addItems: (userId: string, newItems: UnifiedInboxItem[]) => {
        set((state) => {
          const cached = state.cache[userId];
          if (!cached) return state;

          // Merge new items, avoiding duplicates by ID
          const existingIds = new Set(cached.items.map((i) => i.id));
          const itemsToAdd = newItems.filter((item) => !existingIds.has(item.id));

          const updatedItems = [...itemsToAdd, ...cached.items];

          // Recalculate stats
          const newStats = {
            total: updatedItems.length,
            leads: updatedItems.filter((i) => i.lead_info.isLead).length,
            pending_approval: updatedItems.filter((i) => i.type === 'pending_approval').length,
            unanswered: updatedItems.filter((i) => !i.replied_at).length,
            answered: updatedItems.filter((i) => i.replied_at).length,
          };

          return {
            cache: {
              ...state.cache,
              [userId]: {
                ...cached,
                items: updatedItems,
                stats: newStats,
                lastFetched: Date.now(), // Update timestamp since we have new data
              },
            },
          };
        });
      },
    }),
    {
      name: 'viloai-inbox-cache', // LocalStorage key
      storage: createJSONStorage(() => localStorage),
      // Only persist the cache, not temporary state
      partialize: (state) => ({ cache: state.cache }),
    }
  )
);
