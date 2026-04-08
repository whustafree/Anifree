import { useState } from 'react';
import { ratings } from '../store';
import './RatingStars.css';

interface Props {
  slug: string;
  label?: string;
}

export default function RatingStars({ slug, label = 'Tu calificación' }: Props) {
  const saved = ratings.get(slug);
  const [hover, setHover]     = useState(0);
  const [selected, setSelected] = useState(saved?.rating || 0);
  const [comment, setComment]   = useState(saved?.comment || '');
  const [saved_, setSaved_]     = useState(!!saved);

  const save = () => {
    if (!selected) return;
    ratings.set(slug, selected, comment);
    setSaved_(true);
    setTimeout(() => setSaved_(false), 2000);
  };

  return (
    <div className="rating">
      <p className="rating__label">{label}</p>
      <div className="rating__stars">
        {[1,2,3,4,5].map(n => (
          <button
            key={n}
            className={`rating__star ${n <= (hover || selected) ? 'rating__star--on' : ''}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setSelected(n)}
          >★</button>
        ))}
        {selected > 0 && <span className="rating__value">{selected}/5</span>}
      </div>
      <div className="rating__comment">
        <input
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Escribe un comentario (opcional)..."
          maxLength={200}
        />
        <button className="rating__save" onClick={save} disabled={!selected}>
          {saved_ ? '✓ Guardado' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}
