/**
 * AnimeFree Store — utilidades de localStorage
 * Gestiona favoritos, historial, progreso y configuración
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface FavoriteAnime {
  slug: string;
  title: string;
  coverUrl: string;
  type: string;
  status: string;
  addedAt: number;
}

export interface WatchHistoryEntry {
  epSlug: string;
  animeSlug: string;
  animeTitle: string;
  coverUrl: string;
  epNumber: number;
  watchedAt: number;
  progress: number; // 0-100
}

export interface UserRating {
  slug: string;    // epSlug
  rating: number;  // 1-5
  comment: string;
  date: number;
}

export interface UserConfig {
  theme: 'dark' | 'light';
  lang: 'SUB' | 'LAT' | 'ESP';
  notificationsEnabled: boolean;
  notifiedAnimes: string[]; // slugs con notificación activada
}

// ─── Keys ─────────────────────────────────────────────────────────────────────
const KEYS = {
  favorites:  'af_favorites',
  history:    'af_history',
  ratings:    'af_ratings',
  config:     'af_config',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
  catch { return fallback; }
}

function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage lleno */ }
}

// ─── Favoritos ────────────────────────────────────────────────────────────────
export const favorites = {
  getAll: (): FavoriteAnime[] => load(KEYS.favorites, []),
  has: (slug: string): boolean => favorites.getAll().some(f => f.slug === slug),
  add: (anime: Omit<FavoriteAnime, 'addedAt'>) => {
    const all = favorites.getAll();
    if (!all.find(f => f.slug === anime.slug))
      save(KEYS.favorites, [{ ...anime, addedAt: Date.now() }, ...all]);
  },
  remove: (slug: string) => save(KEYS.favorites, favorites.getAll().filter(f => f.slug !== slug)),
  toggle: (anime: Omit<FavoriteAnime, 'addedAt'>): boolean => {
    if (favorites.has(anime.slug)) { favorites.remove(anime.slug); return false; }
    favorites.add(anime); return true;
  },
};

// ─── Historial ────────────────────────────────────────────────────────────────
export const history = {
  getAll: (): WatchHistoryEntry[] => load(KEYS.history, []),
  getAnime: (animeSlug: string): WatchHistoryEntry[] =>
    history.getAll().filter(e => e.animeSlug === animeSlug),
  getLastEpisode: (animeSlug: string): WatchHistoryEntry | undefined =>
    history.getAll().filter(e => e.animeSlug === animeSlug).sort((a, b) => b.watchedAt - a.watchedAt)[0],
  isWatched: (epSlug: string): boolean => history.getAll().some(e => e.epSlug === epSlug && e.progress >= 90),
  getProgress: (epSlug: string): number => history.getAll().find(e => e.epSlug === epSlug)?.progress || 0,
  add: (entry: Omit<WatchHistoryEntry, 'watchedAt'>) => {
    const all = history.getAll().filter(e => e.epSlug !== entry.epSlug);
    save(KEYS.history, [{ ...entry, watchedAt: Date.now() }, ...all].slice(0, 200));
  },
  updateProgress: (epSlug: string, progress: number) => {
    const all = history.getAll();
    const idx = all.findIndex(e => e.epSlug === epSlug);
    if (idx !== -1) { all[idx].progress = progress; save(KEYS.history, all); }
  },
  clear: () => save(KEYS.history, []),
};

// ─── Calificaciones ───────────────────────────────────────────────────────────
export const ratings = {
  getAll: (): UserRating[] => load(KEYS.ratings, []),
  get: (slug: string): UserRating | undefined => ratings.getAll().find(r => r.slug === slug),
  set: (slug: string, rating: number, comment: string) => {
    const all = ratings.getAll().filter(r => r.slug !== slug);
    save(KEYS.ratings, [{ slug, rating, comment, date: Date.now() }, ...all]);
  },
  remove: (slug: string) => save(KEYS.ratings, ratings.getAll().filter(r => r.slug !== slug)),
};

// ─── Configuración ────────────────────────────────────────────────────────────
const DEFAULT_CONFIG: UserConfig = {
  theme: 'dark',
  lang: 'SUB',
  notificationsEnabled: false,
  notifiedAnimes: [],
};

export const config = {
  get: (): UserConfig => ({ ...DEFAULT_CONFIG, ...load(KEYS.config, {}) }),
  set: (partial: Partial<UserConfig>) => save(KEYS.config, { ...config.get(), ...partial }),
  getLang: (): 'SUB' | 'LAT' | 'ESP' => config.get().lang,
  setLang: (lang: 'SUB' | 'LAT' | 'ESP') => config.set({ lang }),
  getTheme: (): 'dark' | 'light' => config.get().theme,
  setTheme: (theme: 'dark' | 'light') => config.set({ theme }),
  toggleNotification: (slug: string): boolean => {
    const cfg = config.get();
    const has = cfg.notifiedAnimes.includes(slug);
    config.set({ notifiedAnimes: has ? cfg.notifiedAnimes.filter(s => s !== slug) : [...cfg.notifiedAnimes, slug] });
    return !has;
  },
};
