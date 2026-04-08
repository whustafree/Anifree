import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './EpisodeCard.css';

interface Props {
  slug: string;
  animeSlug: string;
  number: number;
  thumbnailUrl?: string;
  title?: string;
}

/** Genera URLs de fallback para la miniatura en orden de prioridad */
function getThumbnailFallbacks(thumbnailUrl: string | undefined, animeSlug: string, number: number): string[] {
  const BASE = 'https://www3.animeflv.net';
  const urls: string[] = [];

  if (thumbnailUrl && thumbnailUrl.startsWith('http')) urls.push(thumbnailUrl);

  // Patrones conocidos de AnimeFlv
  urls.push(`${BASE}/uploads/episodios/${animeSlug}/${number}/th_1.jpg`);
  urls.push(`${BASE}/uploads/episodios/${animeSlug}/${number}/th.jpg`);
  urls.push(`${BASE}/uploads/animes/covers/${animeSlug}.jpg`);

  return urls;
}

export default function EpisodeCard({ slug, animeSlug, number, thumbnailUrl, title }: Props) {
  const navigate = useNavigate();
  const fallbacks = getThumbnailFallbacks(thumbnailUrl, animeSlug, number);
  const [imgIndex, setImgIndex] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);

  const handleImgError = () => {
    const next = imgIndex + 1;
    if (next < fallbacks.length) {
      setImgIndex(next);
    } else {
      setImgFailed(true);
    }
  };

  return (
    <div className="ep-card" onClick={() => navigate(`/ver/${slug}`)}>
      <div className="ep-card__thumb">
        {imgFailed ? (
          <div className="ep-card__thumb-placeholder">
            <span>▶</span>
          </div>
        ) : (
          <img
            src={fallbacks[imgIndex]}
            alt={`Episodio ${number}`}
            loading="lazy"
            onError={handleImgError}
          />
        )}
        <div className="ep-card__play-overlay">
          <span>▶</span>
        </div>
        <span className="ep-card__num">EP {number}</span>
      </div>
      <div className="ep-card__info">
        <p className="ep-card__anime">{animeSlug.replace(/-/g, ' ')}</p>
        <p className="ep-card__title">{title || `Episodio ${number}`}</p>
      </div>
    </div>
  );
}
