import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { history, WatchHistoryEntry } from '../store';
import './HistoryPage.css';

export default function HistoryPage() {
  const [entries, setEntries] = useState<WatchHistoryEntry[]>([]);
  const navigate = useNavigate();

  useEffect(() => { setEntries(history.getAll()); }, []);

  const clear = () => { history.clear(); setEntries([]); };

  return (
    <main className="hist-page">
      <div className="container">
        <div className="hist-page__header">
          <div>
            <h1 className="hist-page__title">Historial</h1>
            <p className="hist-page__sub">{entries.length} episodio{entries.length !== 1 ? 's' : ''} visto{entries.length !== 1 ? 's' : ''}</p>
          </div>
          {entries.length > 0 && <button className="hist-page__clear" onClick={clear}>Limpiar historial</button>}
        </div>

        {entries.length === 0 ? (
          <div className="hist-page__empty">
            <span>📺</span>
            <p>Aún no has visto ningún episodio.</p>
          </div>
        ) : (
          <div className="hist-page__list">
            {entries.map(e => (
              <div key={e.epSlug} className="hist-item" onClick={() => navigate(`/ver/${e.epSlug}`)}>
                <div className="hist-item__cover" style={{ backgroundImage: `url(${e.coverUrl})` }} />
                <div className="hist-item__info">
                  <p className="hist-item__title">{e.animeTitle}</p>
                  <p className="hist-item__ep">Episodio {e.epNumber}</p>
                  <div className="hist-item__bar">
                    <div className="hist-item__progress" style={{ width: `${e.progress}%` }} />
                  </div>
                </div>
                <span className="hist-item__date">{new Date(e.watchedAt).toLocaleDateString('es')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
