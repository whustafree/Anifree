import { Router, Request, Response } from 'express';
import NodeCache from 'node-cache';
import {
  getTrendingAnimes, getLatestEpisodes, searchAnime,
  getAnimeDetail, getAnimeEpisodes, getEpisodeDetail,
  getAnimesByGenre, getAnimesBySeason,
} from '../scrapers/animeflv';

const router = Router();
const cache  = new NodeCache({ stdTTL: parseInt(process.env.CACHE_TTL || '300') });

async function withCache<T>(key: string, fetcher: () => Promise<T>, res: Response) {
  try {
    const cached = cache.get<T>(key);
    if (cached) return res.json({ data: cached, cached: true });
    const data = await fetcher();
    cache.set(key, data);
    res.json({ data, cached: false });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al obtener datos', message: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
}

router.get('/anime/trending',  (req, res) => withCache('trending',  getTrendingAnimes,  res));
router.get('/anime/latest',    (req, res) => withCache('latest',    getLatestEpisodes,  res));

router.get('/anime/search', (req: Request, res: Response) => {
  const q = req.query.q as string;
  if (!q || q.trim().length < 2)
    return res.status(400).json({ error: 'El parámetro q debe tener al menos 2 caracteres' });
  withCache(`search:${q.toLowerCase()}`, () => searchAnime(q), res);
});

router.get('/anime/genre/:genre', (req: Request, res: Response) => {
  const { genre } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  withCache(`genre:${genre}:${page}`, () => getAnimesByGenre(genre, page), res);
});

router.get('/anime/season/:year/:season', (req: Request, res: Response) => {
  const year   = parseInt(req.params.year);
  const season = req.params.season;
  if (isNaN(year) || year < 2000 || year > 2030)
    return res.status(400).json({ error: 'Año inválido' });
  withCache(`season:${year}:${season}`, () => getAnimesBySeason(year, season), res);
});

router.get('/anime/:slug/episodes', (req, res) => {
  const { slug } = req.params;
  withCache(`episodes:${slug}`, () => getAnimeEpisodes(slug), res);
});

router.get('/anime/:slug', (req, res) => {
  const { slug } = req.params;
  withCache(`anime:${slug}`, () => getAnimeDetail(slug), res);
});

router.get('/episode/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const lang = (req.query.lang as 'SUB' | 'LAT' | 'ESP') || 'SUB';
  // Episodios tienen cache más corto (5 min)
  const key = `episode:${slug}:${lang}`;
  withCache(key, () => getEpisodeDetail(slug, lang), res);
});

export default router;
