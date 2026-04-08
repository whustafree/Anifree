import { useState, useEffect } from 'react';
import { favorites, FavoriteAnime } from '../store';
import AnimeCard from '../components/AnimeCard';
import './FavoritesPage.css';

export default function FavoritesPage() {
  const [faves, setFaves] = useState<FavoriteAnime[]>([]);
  useEffect(() => { setFaves(favorites.getAll()); }, []);

  return (
    <main className="fav-page">
      <div className="container">
        <div className="fav-page__header">
          <h1 className="fav-page__title">Mi Lista</h1>
          <p className="fav-page__sub">{faves.length} anime{faves.length !== 1 ? 's' : ''} guardado{faves.length !== 1 ? 's' : ''}</p>
        </div>

        {faves.length === 0 ? (
          <div className="fav-page__empty">
            <span>🎌</span>
            <p>Aún no tienes favoritos.</p>
            <p>Toca el corazón en cualquier anime para agregarlo.</p>
          </div>
        ) : (
          <div className="fav-page__grid">
            {faves.map(f => (
              <AnimeCard key={f.slug} slug={f.slug} title={f.title} coverUrl={f.coverUrl} type={f.type} status={f.status} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
