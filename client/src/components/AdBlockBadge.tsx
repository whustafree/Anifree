import './AdBlockBadge.css';

interface Props {
  active: boolean;
}

export default function AdBlockBadge({ active }: Props) {
  return (
    <div
      className={`adblock-badge ${active ? 'adblock-badge--on' : 'adblock-badge--off'}`}
      title={active ? 'Bloqueador de anuncios activo' : 'Iniciando bloqueador...'}
    >
      <span className="adblock-badge__dot" />
      <span className="adblock-badge__label">{active ? 'AdBlock ✓' : 'AdBlock'}</span>
    </div>
  );
}
