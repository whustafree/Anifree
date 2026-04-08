import { useState } from 'react';
import { favorites, FavoriteAnime } from '../store';
import './FavoriteButton.css';

interface Props {
  anime: Omit<FavoriteAnime, 'addedAt'>;
  size?: 'sm' | 'md';
}

export default function FavoriteButton({ anime, size = 'md' }: Props) {
  const [isFav, setIsFav] = useState(() => favorites.has(anime.slug));

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const added = favorites.toggle(anime);
    setIsFav(added);
  };

  return (
    <button
      className={`fav-btn fav-btn--${size} ${isFav ? 'fav-btn--active' : ''}`}
      onClick={toggle}
      title={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      aria-label={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
    >
      <svg viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </button>
  );
}
