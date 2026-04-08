import { useNavigate } from 'react-router-dom';
import FavoriteButton from './FavoriteButton';
import './AnimeCard.css';

interface Props {
  slug: string;
  title: string;
  coverUrl: string;
  type?: string;
  status?: string;
  rating?: number;
}

export default function AnimeCard({ slug, title, coverUrl, type, status, rating }: Props) {
  const navigate = useNavigate();

  return (
    <div className="anime-card" onClick={() => navigate(`/anime/${slug}`)}>
      <div className="anime-card__cover">
        <img
          src={coverUrl || '/placeholder.jpg'}
          alt={title}
          loading="lazy"
          onError={e => { (e.target as HTMLImageElement).src = '/placeholder.jpg'; }}
        />
        {type && <span className="anime-card__badge">{type}</span>}
        {rating && rating > 0 && (
          <span className="anime-card__rating">★ {rating.toFixed(1)}</span>
        )}
        <div className="anime-card__overlay">
          <span className="anime-card__play">▶</span>
        </div>
        {/* FavoriteButton en esquina superior derecha */}
        <div className="anime-card__fav" onClick={e => e.stopPropagation()}>
          <FavoriteButton
            anime={{ slug, title, coverUrl: coverUrl || '', type: type || 'TV', status: status || 'Finalizado' }}
            size="sm"
          />
        </div>
      </div>
      <div className="anime-card__info">
        <h3 className="anime-card__title">{title}</h3>
        {status && (
          <span className={`anime-card__status anime-card__status--${status === 'En emisión' ? 'airing' : 'done'}`}>
            {status}
          </span>
        )}
      </div>
    </div>
  );
}
