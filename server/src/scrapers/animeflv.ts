import cloudscraper from 'cloudscraper';
import * as cheerio from 'cheerio';
import { Anime, Episode, EpisodeDetail, SearchResult, VideoSource } from '../types';

const BASE_URL = process.env.ANIMEFLV_BASE_URL || 'https://www3.animeflv.net';
const TIMEOUT  = parseInt(process.env.SCRAPER_TIMEOUT || '15000');

async function fetchPage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudscraper.get({
      uri: url, timeout: TIMEOUT,
      headers: {
        'Accept-Language': 'es-ES,es;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    }, (error: any, response: any, body: string) => {
      if (error) return reject(new Error(`Error al conectar: ${error.message}`));
      if (response.statusCode !== 200)
        return reject(new Error(`Status ${response.statusCode}`));
      resolve(body);
    });
  });
}

function epNumFromSlug(slug: string): number {
  const m = slug.match(/-(\d+)$/);
  return m ? parseInt(m[1]) : 0;
}

function animeSlugFromEpSlug(epSlug: string): string {
  return epSlug.replace(/-\d+$/, '');
}

function buildThumbnailUrl(rawSrc: string, animeSlug: string, epNum: number): string {
  if (rawSrc && rawSrc.startsWith('http') && !rawSrc.includes('undefined')) return rawSrc;
  if (rawSrc && rawSrc.startsWith('/')) return `${BASE_URL}${rawSrc}`;
  if (animeSlug) return `${BASE_URL}/uploads/episodios/${animeSlug}/${epNum}/th_1.jpg`;
  return '';
}

/**
 * Normaliza el status desde cualquier variante de texto que use AnimeFlv.
 * En las páginas de detalle usa: "En emision", "Finalizado", "Próximamente"
 * IMPORTANTE: las cards de lista NO tienen status directamente en el DOM —
 * hay que extraerlo del script inline var anime_info.
 */
function normalizeStatus(raw: string): Anime['status'] {
  if (!raw) return 'Finalizado';
  const s = raw.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  if (s.includes('emis') || s.includes('air') || s.includes('on_air') || s === '1')
    return 'En emisión';
  if (s.includes('proxi') || s.includes('upcoming') || s === '3')
    return 'Próximamente';
  return 'Finalizado'; // "finalizado", "2", o cualquier otro valor
}

/**
 * AnimeFlv embebe en la homepage y en browse un script con todos los datos
 * de los animes de la lista en formato JSON:
 *
 *   var anime_list = [
 *     [id, title, slug, cover, synopsis, rating, type, status, ...],
 *     ...
 *   ];
 *
 * Los índices varían por versión, pero los campos críticos son constantes.
 * type:   1=TV, 2=Película, 3=Especial, 4=OVA
 * status: 1=En emisión, 2=Finalizado, 3=Próximamente
 */
function parseAnimeListFromScript(html: string): Map<string, { status: Anime['status']; episodeCount: number }> {
  const map = new Map<string, { status: Anime['status']; episodeCount: number }>();

  // Intentar extraer anime_list del script inline
  // El array tiene: [id, title, slug, cover, synopsis, rating, type, status, episodes?, ...]
  const m = html.match(/var anime_list\s*=\s*(\[[\s\S]*?\]);\s*(?:var|<\/script>)/);
  if (!m) return map;

  try {
    const list: any[][] = JSON.parse(m[1]);
    for (const item of list) {
      // item[2] = slug, item[7] = status (1/2/3), item[8] puede ser episodeCount
      const slug        = String(item[2] || '');
      const statusCode  = String(item[7] || '2');
      const epCount     = typeof item[8] === 'number' ? item[8] : 0;
      if (slug) {
        map.set(slug, {
          status: normalizeStatus(statusCode),
          episodeCount: epCount,
        });
      }
    }
  } catch { /* HTML cambió, ignorar */ }

  return map;
}

/**
 * Parsea la lista de episodios desde el script inline var episodes = [[num,...],...]
 * presente en la página de detalle de cada anime.
 */
function parseEpisodesFromScript(html: string, animeSlug: string): Episode[] {
  const m = html.match(/var episodes\s*=\s*(\[[\s\S]*?\]);/);
  if (!m) return [];
  try {
    const raw: number[][] = JSON.parse(m[1]);
    return raw.map(item => {
      const num    = item[0];
      const epSlug = `${animeSlug}-${num}`;
      return { id: epSlug, animeSlug, number: num, slug: epSlug };
    }).sort((a, b) => a.number - b.number);
  } catch { return []; }
}

function parseAnimeCard(el: cheerio.Element, $: cheerio.CheerioAPI, extraData?: { status: Anime['status']; episodeCount: number }): Partial<Anime> {
  const $el      = $(el);
  const title    = $el.find('h3.Title').text().trim();
  const href     = $el.find('a').first().attr('href') || '';
  const slug     = href.replace('/anime/', '').replace(/\/$/, '');
  const coverUrl = $el.find('img').attr('src') || $el.find('img').attr('data-src') || '';
  const typeText = $el.find('.Type').first().text().trim();

  const typeMap: Record<string, Anime['type']> = {
    'tv': 'TV', 'anime': 'TV',
    'pelicula': 'Película', 'movie': 'Película', 'película': 'Película',
    'ova': 'OVA',
    'especial': 'Especial', 'special': 'Especial',
  };
  const type = typeMap[typeText.toLowerCase()] || (typeText as Anime['type']) || 'TV';

  return {
    title, slug, id: slug,
    coverUrl: coverUrl.startsWith('http') ? coverUrl : `${BASE_URL}${coverUrl}`,
    type,
    // Usar datos del script si están disponibles, sino marcar como desconocido
    status: extraData?.status ?? 'Finalizado',
    episodeCount: extraData?.episodeCount ?? 0,
  };
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export async function getTrendingAnimes(): Promise<Partial<Anime>[]> {
  const html = await fetchPage(BASE_URL);
  const $    = cheerio.load(html);

  // Extraer metadatos reales (status, episodeCount) del script inline
  const scriptData = parseAnimeListFromScript(html);

  const animes: Partial<Anime>[] = [];
  $('ul.ListAnimes article.Anime').each((_, el) => {
    const card = parseAnimeCard(el, $);
    if (!card.slug) return;
    // Enriquecer con datos del script si existen
    const extra = scriptData.get(card.slug);
    if (extra) {
      card.status       = extra.status;
      card.episodeCount = extra.episodeCount;
    }
    animes.push(card);
  });

  return animes.filter(a => a.slug).slice(0, 24);
}

export async function getLatestEpisodes(): Promise<Episode[]> {
  const html = await fetchPage(BASE_URL);
  const $    = cheerio.load(html);
  const episodes: Episode[] = [];

  $('ul.ListEpisodios li').each((_, el) => {
    const $el      = $(el);
    const href     = $el.find('a').attr('href') || '';
    const slug     = href.replace('/ver/', '').replace(/\/$/, '');
    if (!slug) return;
    const img      = $el.find('img');
    const rawSrc   = img.attr('src') || img.attr('data-src') || img.attr('data-lazy') || '';
    const epNum    = parseInt($el.find('.Capi').text().replace(/\D/g, '')) || epNumFromSlug(slug);
    const animeSlug = animeSlugFromEpSlug(slug);
    episodes.push({ id: slug, animeSlug, number: epNum, slug, thumbnailUrl: buildThumbnailUrl(rawSrc, animeSlug, epNum) });
  });

  return episodes.slice(0, 18);
}

export async function searchAnime(query: string): Promise<SearchResult[]> {
  const urls = [
    `${BASE_URL}/browse?q=${encodeURIComponent(query)}`,
    `${BASE_URL}/browse?search=${encodeURIComponent(query)}`,
  ];
  let html = '';
  for (const url of urls) {
    try { html = await fetchPage(url); break; } catch { /* siguiente */ }
  }
  if (!html) throw new Error('No se pudo acceder a AnimeFlv');

  const $          = cheerio.load(html);
  const scriptData = parseAnimeListFromScript(html);
  const results: SearchResult[] = [];

  $('ul.ListAnimes article.Anime').each((_, el) => {
    const card = parseAnimeCard(el, $);
    if (!card.title || !card.slug) return;
    const extra = scriptData.get(card.slug);
    results.push({
      title:    card.title,
      slug:     card.slug,
      coverUrl: card.coverUrl || '',
      type:     card.type     || 'TV',
      status:   extra?.status ?? card.status ?? 'Finalizado',
    });
  });

  return results;
}

export async function getAnimesByGenre(genre: string, page = 1): Promise<SearchResult[]> {
  const url  = `${BASE_URL}/browse?genre[]=${encodeURIComponent(genre)}&page=${page}`;
  const html = await fetchPage(url);
  const $    = cheerio.load(html);
  const scriptData = parseAnimeListFromScript(html);
  const results: SearchResult[] = [];

  $('ul.ListAnimes article.Anime').each((_, el) => {
    const card = parseAnimeCard(el, $);
    if (!card.title || !card.slug) return;
    const extra = scriptData.get(card.slug);
    results.push({ title: card.title, slug: card.slug, coverUrl: card.coverUrl || '', type: card.type || 'TV', status: extra?.status ?? card.status ?? 'Finalizado' });
  });

  return results;
}

export async function getAnimesBySeason(year: number, season: string): Promise<SearchResult[]> {
  const seasonMap: Record<string, number> = { invierno: 1, primavera: 2, verano: 3, otoño: 4 };
  const seasonNum = seasonMap[season.toLowerCase()] || 1;
  const url  = `${BASE_URL}/browse?year=${year}&season=${seasonNum}`;
  const html = await fetchPage(url);
  const $    = cheerio.load(html);
  const scriptData = parseAnimeListFromScript(html);
  const results: SearchResult[] = [];

  $('ul.ListAnimes article.Anime').each((_, el) => {
    const card = parseAnimeCard(el, $);
    if (!card.title || !card.slug) return;
    const extra = scriptData.get(card.slug);
    results.push({ title: card.title, slug: card.slug, coverUrl: card.coverUrl || '', type: card.type || 'TV', status: extra?.status ?? card.status ?? 'Finalizado' });
  });

  return results;
}

export async function getAnimeDetail(slug: string): Promise<Anime> {
  const url  = `${BASE_URL}/anime/${slug}`;
  const html = await fetchPage(url);
  const $    = cheerio.load(html);

  const title    = $('h1.Title').text().trim();
  const synopsis = $('div.Description p').first().text().trim();
  const rawCover = $('div.AnimeCover img, .cover-image img').first().attr('src') || '';
  const coverUrl = rawCover.startsWith('http') ? rawCover : `${BASE_URL}${rawCover}`;
  const rating   = parseFloat($('span#votes_prmd, #rating').text()) || 0;
  const type     = $('span.Type').first().text().trim() as Anime['type'];
  const genres: string[] = [];
  $('nav.Nvgnrs a, .genres a').each((_, el) => genres.push($(el).text().trim()));

  // Status desde el DOM de la página de detalle
  // AnimeFlv usa <p class="AnmStts"><span>En emision</span></p>
  const rawStatus = $('p.AnmStts span, span.AnmStts, .anime-status').first().text().trim();

  // Episodios desde script inline (más completo y exacto)
  const episodes     = parseEpisodesFromScript(html, slug);
  const episodeCount = episodes.length;

  return {
    id: slug, title, slug, synopsis, coverUrl, rating,
    status: normalizeStatus(rawStatus),
    type: type || 'TV',
    genres,
    episodeCount,
  };
}

export async function getAnimeEpisodes(slug: string): Promise<Episode[]> {
  const html       = await fetchPage(`${BASE_URL}/anime/${slug}`);
  const fromScript = parseEpisodesFromScript(html, slug);
  if (fromScript.length > 0) return fromScript;

  // Fallback DOM
  const $ = cheerio.load(html);
  const episodes: Episode[] = [];
  $('ul#episodeList li, .episodes-list li').each((_, el) => {
    const $el    = $(el);
    const href   = $el.find('a').attr('href') || '';
    const epSlug = href.replace('/ver/', '').replace(/\/$/, '');
    if (!epSlug) return;
    const epNum  = parseInt($el.find('.Capi, .episode-number').text().replace(/\D/g, '')) || epNumFromSlug(epSlug);
    episodes.push({ id: epSlug, animeSlug: slug, number: epNum, slug: epSlug });
  });
  return episodes.sort((a, b) => a.number - b.number);
}

export async function getEpisodeDetail(slug: string, lang: 'SUB' | 'LAT' | 'ESP' = 'SUB'): Promise<EpisodeDetail> {
  const url  = `${BASE_URL}/ver/${slug}`;
  const html = await fetchPage(url);
  const $    = cheerio.load(html);
  const videoSources: VideoSource[] = [];

  $('script').each((_, el) => {
    const content  = $(el).html() || '';
    const matchObj = content.match(/var\s+videos\s*=\s*(\{[\s\S]*?\});/);
    if (!matchObj) return;
    try {
      const videos   = JSON.parse(matchObj[1]);
      const preferred: any[] = videos[lang]  || [];
      const fallback: any[]  = Object.entries(videos)
        .filter(([k]) => k !== lang)
        .flatMap(([, v]) => v as any[]);
      [...preferred, ...fallback].forEach((s: any) => {
        const serverUrl = s.code || s.url || s.file || '';
        if (!serverUrl) return;
        videoSources.push({
          server:  s.title || s.servidor || s.name || 'Servidor',
          url:     serverUrl,
          quality: s.quality || s.res || undefined,
        });
      });
    } catch { /* ignorar JSON malformado */ }
  });

  const epNum     = epNumFromSlug(slug);
  const animeSlug = animeSlugFromEpSlug(slug);
  const prevHref  = $('a.PrevEpisode, .prev-episode a').first().attr('href') || '';
  const nextHref  = $('a.NextEpisode, .next-episode a').first().attr('href') || '';
  const prevFromDom = prevHref ? prevHref.replace('/ver/', '').replace(/\/$/, '') : undefined;
  const nextFromDom = nextHref ? nextHref.replace('/ver/', '').replace(/\/$/, '') : undefined;

  let prevFromScript: string | undefined;
  let nextFromScript: string | undefined;
  const allEpsMatch = html.match(/var episodes\s*=\s*(\[[\s\S]*?\]);/);
  if (allEpsMatch) {
    try {
      const nums = (JSON.parse(allEpsMatch[1]) as number[][])
        .map(e => e[0]).sort((a, b) => a - b);
      const idx  = nums.indexOf(epNum);
      if (idx > 0)                             prevFromScript = `${animeSlug}-${nums[idx - 1]}`;
      if (idx !== -1 && idx < nums.length - 1) nextFromScript = `${animeSlug}-${nums[idx + 1]}`;
    } catch { /* ignorar */ }
  }

  return {
    id: slug, animeSlug, number: epNum, slug, videoSources,
    prevEpisode: prevFromDom || prevFromScript || (epNum > 1 ? `${animeSlug}-${epNum - 1}` : undefined),
    nextEpisode: nextFromDom || nextFromScript,
  };
}
