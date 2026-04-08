import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Anime, Episode } from '../types';
import { history, WatchHistoryEntry } from '../store';
import AnimeCard from '../components/AnimeCard';
import EpisodeCard from '../components/EpisodeCard';
import './Home.css';

export default function Home() {
  const [trending, setTrending]   = useState<Partial<Anime>[]>([]);
  const [latest, setLatest]       = useState<Episode[]>([]);
  const [continuar, setContinuar] = useState<WatchHistoryEntry[]>([]);
  const [loadingT, setLoadingT]   = useState(true);
  const [loadingL, setLoadingL]   = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const navigate                  = useNavigate();

  useEffect(() => {
    // Cargar historial desde localStorage
    const hist = history.getAll().slice(0, 6);
    setContinuar(hist);

    api.getTrending()
      .then(setTrending)
      .catch(() => setError('Error al cargar animes. Verifica que el servidor esté activo.'))
      .finally(() => setLoadingT(false));

    api.getLatest()
      .then(setLatest)
      .catch(() => {})
      .finally(() => setLoadingL(false));
  }, []);

  return (
    <main className="home">
      {/* Hero */}
      <div className="home__hero">
        <div className="home__hero-bg" />
        <div className="container home__hero-content">
          <p className="home__hero-sub">Portal Geek · AnimeFree</p>
          <h1 className="home__hero-title">
            Anime<br /><span>Sin Límites</span>
          </h1>
          <p className="home__hero-desc">
            Miles de series en español — gratis, sin registros, sin anuncios.
          </p>
          <div className="home__hero-actions">
            <button className="home__hero-btn home__hero-btn--primary" onClick={() => navigate('/browse')}>
              Explorar catálogo
            </button>
            <button className="home__hero-btn home__hero-btn--secondary" onClick={() => navigate('/temporadas')}>
              Temporada actual
            </button>
          </div>
        </div>
      </div>

      <div className="container home__content">
        {error && <div className="home__error">⚠️ {error}</div>}

        {/* Continuar viendo */}
        {continuar.length > 0 && (
          <section className="home__section">
            <h2 className="section-title">Continuar viendo</h2>
            <div className="home__continue-grid">
              {continuar.map(e => (
                <div key={e.epSlug} className="continue-card" onClick={() => navigate(`/ver/${e.epSlug}`)}>
                  <div className="continue-card__cover" style={{ backgroundImage: `url(${e.coverUrl})` }}>
                    <div className="continue-card__overlay">▶</div>
                  </div>
                  <div className="continue-card__bar">
                    <div className="continue-card__progress" style={{ width: `${e.progress}%` }} />
                  </div>
                  <div className="continue-card__info">
                    <p className="continue-card__title">{e.animeTitle}</p>
                    <p className="continue-card__ep">Episodio {e.epNumber}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Últimos episodios */}
        <section className="home__section">
          <h2 className="section-title">Últimos Episodios</h2>
          {loadingL ? (
            <div className="home__ep-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 80 }} />
              ))}
            </div>
          ) : (
            <div className="home__ep-grid">
              {latest.map(ep => <EpisodeCard key={ep.id} {...ep} />)}
            </div>
          )}
        </section>

        {/* En tendencia */}
        <section className="home__section">
          <h2 className="section-title">En Tendencia</h2>
          {loadingT ? (
            <div className="home__anime-grid">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ aspectRatio: '3/4' }} />
              ))}
            </div>
          ) : (
            <div className="home__anime-grid">
              {trending.map(a => (
                <AnimeCard
                  key={a.slug}
                  slug={a.slug!}
                  title={a.title!}
                  coverUrl={a.coverUrl!}
                  type={a.type}
                  status={a.status}
                  rating={a.rating}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
