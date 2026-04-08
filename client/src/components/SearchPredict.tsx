import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { SearchResult } from '../types';
import './SearchPredict.css';

interface Props { onClose: () => void; }

export default function SearchPredict({ onClose }: Props) {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState<SearchResult[]>([]);
  const [loading, setLoading]   = useState(false);
  const [cursor, setCursor]     = useState(-1);
  const inputRef                = useRef<HTMLInputElement>(null);
  const timerRef                = useRef<ReturnType<typeof setTimeout>>();
  const navigate                = useNavigate();

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (query.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await api.search(query);
        setResults(res.slice(0, 6));
      } catch { setResults([]); }
      setLoading(false);
      setCursor(-1);
    }, 400);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  const go = (slug: string) => { navigate(`/anime/${slug}`); onClose(); };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c+1, results.length-1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c-1, -1)); }
    if (e.key === 'Enter') {
      if (cursor >= 0 && results[cursor]) go(results[cursor].slug);
      else if (query.trim().length >= 2) { navigate(`/search?q=${encodeURIComponent(query)}`); onClose(); }
    }
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="sp-overlay" onClick={onClose}>
      <div className="sp-box" onClick={e => e.stopPropagation()}>
        <div className="sp-input-row">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Buscar anime..."
            autoComplete="off"
          />
          {loading && <span className="sp-spinner" />}
        </div>

        {results.length > 0 && (
          <ul className="sp-results">
            {results.map((r, i) => (
              <li
                key={r.slug}
                className={`sp-result ${i === cursor ? 'sp-result--active' : ''}`}
                onClick={() => go(r.slug)}
                onMouseEnter={() => setCursor(i)}
              >
                <img src={r.coverUrl} alt={r.title} loading="lazy" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                <div className="sp-result__info">
                  <span className="sp-result__title">{r.title}</span>
                  <span className="sp-result__meta">{r.type} · {r.status}</span>
                </div>
              </li>
            ))}
            {query.length >= 2 && (
              <li className="sp-result sp-result--more" onClick={() => { navigate(`/search?q=${encodeURIComponent(query)}`); onClose(); }}>
                Ver todos los resultados de "{query}" →
              </li>
            )}
          </ul>
        )}

        {query.length >= 2 && !loading && results.length === 0 && (
          <div className="sp-empty">No se encontraron resultados para "{query}"</div>
        )}
      </div>
    </div>
  );
}
