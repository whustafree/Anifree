import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Anime, Episode, SearchResult } from '../types';
import { history } from '../store';
import EpisodeCard from '../components/EpisodeCard';
import FavoriteButton from '../components/FavoriteButton';
import AnimeCard from '../components/AnimeCard';
import { useNotifications } from '../hooks/useNotifications';
import './AnimePage.css';

const PAGE_SIZE = 24;

export default function AnimePage() {
  const { slug }    = useParams<{ slug: string }>();
  const navigate    = useNavigate();
  const [anime, setAnime]       = useState<Anime | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [visibleEps, setVisible] = useState<Episode[]>([]);
  const [page, setPage]          = useState(1);
  const [similar, setSimilar]    = useState<SearchResult[]>([]);
  const [loading, setLoading]    = useState(true);
  const [error, setError]        = useState<string | null>(null);
  const sentinelRef              = useRef<HTMLDivElement>(null);
  const { isSubscribed, toggle: toggleNotif } = useNotifications();
  const [notified, setNotified]  = useState(false);

  // Cargar datos principales
  useEffect(() => {
    if (!slug) return;
    setAnime(null); setEpisodes([]); setVisible([]); setPage(1); setSimilar([]);
    setLoading(true); setError(null);

    Promise.all([api.getAnime(slug), api.getEpisodes(slug)])
      .then(([animeData, epsData]) => {
        setAnime(animeData);
        const sorted = [...epsData].sort((a, b) => b.number - a.number);
        setEpisodes(sorted);
        setVisible(sorted.slice(0, PAGE_SIZE));
        setNotified(isSubscribed(slug));

        // Cargar similares en segundo plano
        if (animeData.genres.length > 0) {
          api.getSimilar(animeData.genres)
            .then(res => setSimilar(res.filter(r => r.slug !== slug).slice(0, 12)))
            .catch(() => {});
        }
      })
      .catch(err => setError(`No se pudo cargar este anime. ${err.message}`))
      .finally(() => setLoading(false));
  }, [slug]);

  // Scroll infinito en la lista de episodios
  const loadMore = useCallback(() => {
    const next = page + 1;
    setVisible(episodes.slice(0, next * PAGE_SIZE));
    setPage(next);
  }, [page, episodes]);

  useEffect(() => {
    if (!sentinelRef.current || visibleEps.length >= episodes.length) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) loadMore(); }, { rootMargin: '200px' });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [sentinelRef, visibleEps.length, episodes.length, loadMore]);

  const handleNotif = async () => {
    if (!anime) return;
    const sub = await toggleNotif(slug!, anime.title);
    setNotified(sub);
  };

  if (loading) return (
    <div className="anime-page">
      <div className="container">
        <div className="anime-page__skeleton">
          <div className="skeleton" style={{ width: 200, height: 290, borderRadius: 8 }} />
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12 }}>
            <div className="skeleton" style={{ height:36, width:'60%' }} />
            <div className="skeleton" style={{ height:16, width:'40%' }} />
            <div className="skeleton" style={{ height:80, width:'100%' }} />
          </div>
        </div>
      </div>
    </div>
  );

  if (error || !anime) return (
    <div className="anime-page">
      <div className="container anime-page__error">
        <p>⚠️ {error || 'Anime no encontrado'}</p>
        <button onClick={() => navigate(-1)}>← Volver</button>
      </div>
    </div>
  );

  const lastWatched = history.getLastEpisode(slug!);
  const ep1 = [...episodes].sort((a, b) => a.number - b.number)[0];

  return (
    <main className="anime-page">
      <div className="anime-page__banner">
        <img src={anime.coverUrl} alt="" aria-hidden />
      </div>
      <div className="container">
        {/* Header */}
        <div className="anime-page__header">
          <div className="anime-page__cover">
            <img src={anime.coverUrl} alt={anime.title} />
          </div>
          <div className="anime-page__meta">
            <div className="anime-page__badges">
              <span className="badge badge--type">{anime.type}</span>
              <span className={`badge badge--status ${anime.status === 'En emisión' ? 'badge--airing' : ''}`}>{anime.status}</span>
              {anime.rating > 0 && <span className="badge badge--rating">★ {anime.rating.toFixed(1)}</span>}
            </div>

            <h1 className="anime-page__title">{anime.title}</h1>

            {anime.genres.length > 0 && (
              <div className="anime-page__genres">
                {anime.genres.map(g => <span key={g} className="genre-tag">{g}</span>)}
              </div>
            )}

            {anime.synopsis && <p className="anime-page__synopsis">{anime.synopsis}</p>}

            {anime.episodeCount > 0 && (
              <div className="anime-page__stats">
                <div className="stat">
                  <span className="stat__label">Episodios</span>
                  <span className="stat__value">{anime.episodeCount}</span>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="anime-page__actions">
              {lastWatched ? (
                <button className="anime-page__watch-btn" onClick={() => navigate(`/ver/${lastWatched.epSlug}`)}>
                  ▶ Continuar — Ep. {lastWatched.epNumber}
                </button>
              ) : ep1 && (
                <button className="anime-page__watch-btn" onClick={() => navigate(`/ver/${ep1.slug}`)}>
                  ▶ Ver desde el Episodio 1
                </button>
              )}

              <FavoriteButton
                anime={{ slug: anime.slug, title: anime.title, coverUrl: anime.coverUrl, type: anime.type, status: anime.status }}
                size="md"
              />

              <button
                className={`anime-page__notif-btn ${notified ? 'anime-page__notif-btn--active' : ''}`}
                onClick={handleNotif}
                title={notified ? 'Desactivar notificaciones' : 'Notificarme de nuevos episodios'}
              >
                {notified ? '🔔' : '🔕'}
              </button>
            </div>
          </div>
        </div>

        {/* Episodios con scroll infinito */}
        {episodes.length > 0 && (
          <section className="anime-page__episodes">
            <h2 className="section-title">
              Episodios <span>({episodes.length})</span>
            </h2>
            <div className="anime-page__ep-list">
              {visibleEps.map(ep => (
                <EpisodeCard key={ep.id} {...ep} />
              ))}
            </div>
            {visibleEps.length < episodes.length && (
              <div ref={sentinelRef} className="anime-page__load-more">
                <div className="skeleton" style={{ height:40, borderRadius:4, width:120, margin:'0 auto' }} />
              </div>
            )}
          </section>
        )}

        {/* Animes similares */}
        {similar.length > 0 && (
          <section className="anime-page__similar">
            <h2 className="section-title">Animes similares</h2>
            <div className="anime-page__similar-grid">
              {similar.map(r => (
                <AnimeCard key={r.slug} slug={r.slug} title={r.title} coverUrl={r.coverUrl} type={r.type} status={r.status} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
