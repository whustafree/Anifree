import { useEffect, useState } from 'react';
import { api } from '../api';
import { SearchResult } from '../types';
import AnimeCard from '../components/AnimeCard';
import './SeasonsPage.css';

const SEASONS = ['invierno','primavera','verano','otoño'] as const;
type Season = typeof SEASONS[number];

const SEASON_LABELS: Record<Season, string> = {
  invierno: '❄️ Invierno',
  primavera: '🌸 Primavera',
  verano: '☀️ Verano',
  otoño: '🍂 Otoño',
};

function getCurrentSeason(): Season {
  const m = new Date().getMonth();
  if (m <= 2)  return 'invierno';
  if (m <= 5)  return 'primavera';
  if (m <= 8)  return 'verano';
  return 'otoño';
}

const YEAR = new Date().getFullYear();
const YEARS = [YEAR, YEAR - 1, YEAR - 2];

export default function SeasonsPage() {
  const [season, setSeason] = useState<Season>(getCurrentSeason());
  const [year, setYear]     = useState(YEAR);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setResults([]);
    api.getBySeason(year, season)
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [season, year]);

  return (
    <main className="seasons-page">
      <div className="container">
        <div className="seasons-page__header">
          <h1 className="seasons-page__title">Temporadas</h1>
          <p className="seasons-page__sub">Anime por temporada y año</p>
        </div>

        {/* Filtros */}
        <div className="seasons-page__filters">
          <div className="seasons-filter__group">
            <span className="seasons-filter__label">Temporada</span>
            <div className="seasons-filter__chips">
              {SEASONS.map(s => (
                <button
                  key={s}
                  className={`chip ${season === s ? 'chip--active' : ''}`}
                  onClick={() => setSeason(s)}
                >
                  {SEASON_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
          <div className="seasons-filter__group">
            <span className="seasons-filter__label">Año</span>
            <div className="seasons-filter__chips">
              {YEARS.map(y => (
                <button
                  key={y}
                  className={`chip ${year === y ? 'chip--active' : ''}`}
                  onClick={() => setYear(y)}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Título de sección activa */}
        <div className="seasons-page__active">
          <h2 className="section-title">
            {SEASON_LABELS[season]} {year}
          </h2>
          {!loading && results.length > 0 && (
            <span className="seasons-page__count">{results.length} animes</span>
          )}
        </div>

        {loading && (
          <div className="seasons-page__grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ aspectRatio: '3/4' }} />
            ))}
          </div>
        )}

        {!loading && results.length === 0 && (
          <div className="seasons-page__empty">
            <span>🔍</span>
            <p>No encontramos animes para esta temporada.</p>
            <p>Prueba con otra combinación de temporada y año.</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="seasons-page__grid">
            {results.map(r => (
              <AnimeCard
                key={r.slug}
                slug={r.slug}
                title={r.title}
                coverUrl={r.coverUrl}
                type={r.type}
                status={r.status}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
