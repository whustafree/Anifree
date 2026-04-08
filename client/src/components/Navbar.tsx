import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePWA } from '../hooks/usePWA';
import { useTheme } from '../hooks/useTheme';
import { config } from '../store';
import AdBlockBadge from './AdBlockBadge';
import SearchPredict from './SearchPredict';
import './Navbar.css';

export default function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { adBlockActive, canInstall, install } = usePWA();
  const { theme, toggle: toggleTheme } = useTheme();
  const [lang, setLangState] = useState(config.getLang());

  const setLang = (l: 'SUB' | 'LAT' | 'ESP') => {
    config.setLang(l);
    setLangState(l);
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar__inner container">
          <Link to="/" className="navbar__logo">
            <span className="navbar__logo-icon">🎌</span>
            <span className="navbar__logo-text">Anime<strong>Free</strong></span>
          </Link>

          <div className="navbar__links">
            <Link to="/"           className="navbar__link">Inicio</Link>
            <Link to="/browse"     className="navbar__link">Catálogo</Link>
            <Link to="/temporadas" className="navbar__link">Temporadas</Link>
            <Link to="/favoritos"  className="navbar__link">Favoritos</Link>
            <Link to="/historial"  className="navbar__link navbar__link--hist">Historial</Link>
          </div>

          <div className="navbar__right">
            <AdBlockBadge active={adBlockActive} />

            {/* Selector de idioma */}
            <div className="navbar__lang">
              {(['SUB','LAT','ESP'] as const).map(l => (
                <button
                  key={l}
                  className={`navbar__lang-btn ${lang === l ? 'navbar__lang-btn--active' : ''}`}
                  onClick={() => setLang(l)}
                >{l}</button>
              ))}
            </div>

            {/* Toggle tema */}
            <button className="navbar__icon-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
              {theme === 'dark'
                ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              }
            </button>

            {canInstall && (
              <button className="navbar__install-btn" onClick={install} title="Instalar AnimeFree">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span>Instalar</span>
              </button>
            )}

            <button className="navbar__search-btn" onClick={() => setSearchOpen(true)} aria-label="Buscar">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <span className="navbar__search-hint">Buscar<kbd>/</kbd></span>
            </button>
          </div>
        </div>
      </nav>

      {searchOpen && <SearchPredict onClose={() => setSearchOpen(false)} />}
    </>
  );
}
