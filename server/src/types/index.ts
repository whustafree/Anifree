export interface Anime {
  id: string;
  title: string;
  slug: string;
  coverUrl: string;
  synopsis: string;
  genres: string[];
  rating: number;
  status: 'En emisión' | 'Finalizado' | 'Próximamente';
  type: 'TV' | 'OVA' | 'Película' | 'Especial';
  episodeCount: number;
}

export interface Episode {
  id: string;
  animeSlug: string;
  number: number;
  title?: string;
  slug: string;
  thumbnailUrl?: string;
}

export interface VideoSource {
  server: string;
  url: string;
  quality?: string;
}

export interface EpisodeDetail extends Episode {
  videoSources: VideoSource[];
  nextEpisode?: string;
  prevEpisode?: string;
}

export interface SearchResult {
  title: string;
  slug: string;
  coverUrl: string;
  type: string;
  status: string;
}

export interface ApiResponse<T> {
  data: T;
  total?: number;
  page?: number;
  hasMore?: boolean;
  cached?: boolean;
}

export interface ApiError {
  error: string;
  message?: string;
  statusCode: number;
}
