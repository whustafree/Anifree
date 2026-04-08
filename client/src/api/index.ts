import { Anime, Episode, EpisodeDetail, SearchResult, ApiResponse } from '../types';
import { config } from '../store';

const BASE = '/api';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  const json: ApiResponse<T> = await res.json();
  return json.data;
}

export const api = {
  getTrending:  ()           => get<Partial<Anime>[]>('/anime/trending'),
  getLatest:    ()           => get<Episode[]>('/anime/latest'),
  search:       (q: string)  => get<SearchResult[]>(`/anime/search?q=${encodeURIComponent(q)}`),
  getAnime:     (slug: string) => get<Anime>(`/anime/${slug}`),
  getEpisodes:  (slug: string) => get<Episode[]>(`/anime/${slug}/episodes`),
  getEpisode:   (slug: string) => {
    const lang = config.getLang();
    return get<EpisodeDetail>(`/episode/${slug}?lang=${lang}`);
  },
  getByGenre:   (genre: string, page = 1) => get<SearchResult[]>(`/anime/genre/${encodeURIComponent(genre)}?page=${page}`),
  getBySeason:  (year: number, season: string) => get<SearchResult[]>(`/anime/season/${year}/${encodeURIComponent(season)}`),
  getSimilar:   (genres: string[]) => {
    const genre = genres[0] || 'Acción';
    return get<SearchResult[]>(`/anime/genre/${encodeURIComponent(genre)}`);
  },
};
