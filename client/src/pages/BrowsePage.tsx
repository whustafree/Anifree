import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { SearchResult } from '../types';
import AnimeCard from '../components/AnimeCard';
import './BrowsePage.css';

const GENRES = ['Acción','Aventura','Comedia','Drama','Ecchi','Fantasía','Magia','Mecha','Misterio','Psicológico','Romance','Sci-Fi','Seinen','Shounen','Slice of Life','Sobrenatural','Terror','Deportes'];
const TYPES  = ['TV','Película','OVA','Especial'];
const PAGE_SIZE = 20;

export default function BrowsePage() {
  const [params, setParams]   = useSearchParams();
  const [all, setAll]         = useState<SearchResult[]>([]);
  const [visible, setVisible] = useState<SearchResult[]>([]);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const sentinelRef           = useRef<HTMLDivElement>(null);

  const query = params.get('q') || '';
  const genre = params.get('genre') || '';
  const type  = params.get('type') || '';

  useEffect(() => {
    const term = query || genre || 'anime';
    setLoading(true); setSearched(false); setPage(1);
    const fetcher = genre && !query
      ? api.getByGenre(genre)
      : api.search(term);

    fetcher
      .then(res => {
        let filtered = res;
        if (type) filtered = filtered.filter(r => r.type === type);
        setAll(filtered);
        setVisible(filtered.slice(0, PAGE_SIZE));
      })
      .catch(() => setAll([]))
      .finally(() => { setLoading(false); setSearched(true); });
  }, [query, genre, type]);

  // Scroll infinito
  const loadMore = useCallback(() => {
    const next = page + 1;
    setVisible(all.slice(0, next * PAGE_SIZE));
    setPage(next);
  }, [page, all]);

  useEffect(() => {
    if (!sentinelRef.current || visible.length >= all.length) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) loadMore(); }, { rootMargin: '300px' });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [sentinelRef, visible.length, all.length, loadMore]);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next);
  };

  return (
    <main className="browse-page">
      <div className="container">
        <div className="browse-page__header">
          <h1 className="browse-page__title">Catálogo</h1>
          <p className="browse-page__sub">Explora el catálogo completo de anime</p>
        </div>

        <div className="browse-page__filters">
          <div className="browse-filter__search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" placeholder="Buscar anime..." value={query} onChange={e => setFilter('q', e.target.value)} />
          </div>
          <div className="browse-filter__row">
            <div className="browse-filter__group">
              <span className="browse-filter__label">Tipo</span>
              <div className="browse-filter__chips">
                <button className={`chip ${!type ? 'chip--active':''}`} onClick={() => setFilter('type','')}>Todos</button>
                {TYPES.map(t => (
                  <button key={t} className={`chip ${type===t?'chip--active':''}`} onClick={() => setFilter('type', type===t?'':t)}>{t}</button>
                ))}
              </div>
            </div>
            <div className="browse-filter__group">
              <span className="browse-filter__label">Género</span>
              <div className="browse-filter__chips">
                <button className={`chip ${!genre?'chip--active':''}`} onClick={() => setFilter('genre','')}>Todos</button>
                {GENRES.map(g => (
                  <button key={g} className={`chip ${genre===g?'chip--active':''}`} onClick={() => setFilter('genre', genre===g?'':g)}>{g}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="browse-page__grid">
            {Array.from({ length: 12 }).map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio:'3/4' }} />)}
          </div>
        )}

        {!loading && searched && all.length === 0 && (
          <div className="browse-page__empty"><span>🔍</span><p>No encontramos animes con esos filtros.</p></div>
        )}

        {!loading && visible.length > 0 && (
          <>
            <p className="browse-page__count">{all.length} resultados{visible.length < all.length ? ` · mostrando ${visible.length}`:''}</p>
            <div className="browse-page__grid">
              {visible.map(r => <AnimeCard key={r.slug} slug={r.slug} title={r.title} coverUrl={r.coverUrl} type={r.type} status={r.status} />)}
            </div>
            {visible.length < all.length && (
              <div ref={sentinelRef} style={{ height:40 }} />
            )}
          </>
        )}
      </div>
    </main>
  );
}
