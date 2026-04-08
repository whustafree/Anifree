import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { EpisodeDetail, Episode } from '../types';
import { history, config } from '../store';
import RatingStars from '../components/RatingStars';
import './EpisodePage.css';

export default function EpisodePage() {
  const { slug }    = useParams<{ slug: string }>();
  const navigate    = useNavigate();
  const [episode, setEpisode]       = useState<EpisodeDetail | null>(null);
  const [allEpisodes, setAllEps]    = useState<Episode[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [activeSource, setActive]   = useState(0);
  const [lang, setLang]             = useState<'SUB'|'LAT'|'ESP'>(config.getLang());
  const [animeInfo, setAnimeInfo]   = useState<{title:string; coverUrl:string} | null>(null);
  const epListRef                   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true); setActive(0); setError(null); setEpisode(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    api.getEpisode(slug).then(ep => {
      setEpisode(ep);

      // Cargar info del anime para el historial
      api.getAnime(ep.animeSlug)
        .then(a => {
          setAnimeInfo({ title: a.title, coverUrl: a.coverUrl });
          // Registrar en historial
          history.add({
            epSlug: ep.slug,
            animeSlug: ep.animeSlug,
            animeTitle: a.title,
            coverUrl: a.coverUrl,
            epNumber: ep.number,
            progress: 0,
          });
        }).catch(() => {});

      // Cargar lista de episodios si cambia el anime
      setAllEps(prev => {
        const sameAnime = prev.length > 0 && prev[0].animeSlug === ep.animeSlug;
        if (!sameAnime) {
          api.getEpisodes(ep.animeSlug)
            .then(eps => setAllEps([...eps].sort((a, b) => b.number - a.number)))
            .catch(() => {});
        }
        return sameAnime ? prev : [];
      });
    })
    .catch(() => setError('No se pudo cargar este episodio.'))
    .finally(() => setLoading(false));
  }, [slug]);

  // Scroll al ep activo en sidebar
  useEffect(() => {
    if (!epListRef.current || !episode) return;
    const el = epListRef.current.querySelector('.ep-list__item--active') as HTMLElement;
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [episode, allEpisodes]);

  const changeLang = (l: 'SUB'|'LAT'|'ESP') => {
    config.setLang(l);
    setLang(l);
  };

  const currentSource = episode?.videoSources[activeSource];

  if (loading) return (
    <div className="ep-page">
      <div className="container">
        <div className="skeleton ep-page__player-skeleton" />
        <div style={{ display:'flex', gap:16, marginTop:16 }}>
          <div className="skeleton" style={{ height:44, flex:1 }} />
          <div className="skeleton" style={{ height:44, flex:1 }} />
        </div>
      </div>
    </div>
  );

  if (error || !episode) return (
    <div className="ep-page">
      <div className="container ep-page__error">
        <p>⚠️ {error || 'Episodio no encontrado'}</p>
        <button onClick={() => navigate(-1)}>← Volver</button>
      </div>
    </div>
  );

  return (
    <main className="ep-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="ep-page__breadcrumb">
          <Link to="/">Inicio</Link><span>/</span>
          <Link to={`/anime/${episode.animeSlug}`}>{episode.animeSlug.replace(/-/g,' ')}</Link>
          <span>/</span><span>Episodio {episode.number}</span>
        </nav>

        <div className="ep-page__layout">
          {/* Columna principal */}
          <div className="ep-page__main">
            {/* Player */}
            <div className="ep-page__player-wrap">
              {currentSource ? (
                <iframe key={currentSource.url} src={currentSource.url} className="ep-page__player"
                  allowFullScreen allow="autoplay; fullscreen"
                  title={`${episode.animeSlug} Episodio ${episode.number}`}
                />
              ) : (
                <div className="ep-page__no-sources">
                  <span>😢</span>
                  <p>No se encontraron fuentes de video.</p>
                </div>
              )}
            </div>

            {/* Título */}
            <div className="ep-page__title-bar">
              <h1 className="ep-page__title">
                <span className="ep-page__anime-name">{episode.animeSlug.replace(/-/g,' ')}</span>
                <span className="ep-page__ep-num">Episodio {episode.number}</span>
              </h1>
            </div>

            {/* Nav prev/next */}
            <div className="ep-page__nav">
              {episode.prevEpisode
                ? <button className="ep-page__nav-btn" onClick={() => navigate(`/ver/${episode.prevEpisode}`)}>← Ep. {episode.number - 1}</button>
                : <span className="ep-page__nav-disabled">Primer episodio</span>}
              <Link to={`/anime/${episode.animeSlug}`} className="ep-page__anime-link">📋 Ver todos</Link>
              {episode.nextEpisode
                ? <button className="ep-page__nav-btn ep-page__nav-btn--next" onClick={() => navigate(`/ver/${episode.nextEpisode}`)}>Ep. {episode.number + 1} →</button>
                : <span className="ep-page__nav-disabled">Último episodio</span>}
            </div>

            {/* Selector idioma + Servidores */}
            {episode.videoSources.length > 0 && (
              <div className="ep-page__servers">
                <div className="ep-page__servers-top">
                  <p className="ep-page__servers-label">Servidores ({episode.videoSources.length})</p>
                  {/* Selector de idioma */}
                  <div className="ep-page__lang">
                    {(['SUB','LAT','ESP'] as const).map(l => (
                      <button key={l} className={`ep-page__lang-btn ${lang === l ? 'ep-page__lang-btn--active' : ''}`} onClick={() => changeLang(l)}>{l}</button>
                    ))}
                  </div>
                </div>
                <div className="ep-page__servers-list">
                  {episode.videoSources.map((src, i) => (
                    <button key={i} className={`ep-page__server-btn ${i === activeSource ? 'ep-page__server-btn--active' : ''}`} onClick={() => setActive(i)}>
                      {src.server}
                      {src.quality && <span className="ep-page__quality">{src.quality}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Calificación del episodio */}
            <div style={{ marginTop: 16 }}>
              <RatingStars slug={slug!} label="¿Qué te pareció este episodio?" />
            </div>
          </div>

          {/* Sidebar: lista de episodios */}
          {allEpisodes.length > 0 && (
            <aside className="ep-page__sidebar">
              <div className="ep-page__sidebar-header">
                <span>Episodios</span>
                <span className="ep-page__sidebar-count">{allEpisodes.length}</span>
              </div>
              <div className="ep-list" ref={epListRef}>
                {allEpisodes.map(ep => (
                  <button
                    key={ep.id}
                    className={`ep-list__item ${ep.number === episode.number ? 'ep-list__item--active' : ''}`}
                    onClick={() => navigate(`/ver/${ep.slug}`)}
                  >
                    <span className="ep-list__num">EP {ep.number}</span>
                    {ep.number === episode.number && <span className="ep-list__playing">▶ Viendo</span>}
                  </button>
                ))}
              </div>
            </aside>
          )}
        </div>
      </div>
    </main>
  );
}
