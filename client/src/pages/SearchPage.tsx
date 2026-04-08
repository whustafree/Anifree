import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { SearchResult } from '../types';
import AnimeCard from '../components/AnimeCard';
import './SearchPage.css';

export default function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get('q') || '';
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) return;
    setLoading(true);
    setSearched(false);

    api.search(query)
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => { setLoading(false); setSearched(true); });
  }, [query]);

  return (
    <main className="search-page">
      <div className="container">
        <div className="search-page__header">
          <h1 className="search-page__title">
            Resultados para <span>"{query}"</span>
          </h1>
          {searched && (
            <p className="search-page__count">
              {results.length === 0
                ? 'No se encontraron resultados'
                : `${results.length} anime${results.length !== 1 ? 's' : ''} encontrado${results.length !== 1 ? 's' : ''}`}
            </p>
          )}
        </div>

        {loading && (
          <div className="search-page__grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ aspectRatio: '3/4' }} />
            ))}
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="search-page__empty">
            <span>🔍</span>
            <p>No encontramos ningún anime con ese nombre.</p>
            <p>Prueba con otro término de búsqueda.</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="search-page__grid">
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
