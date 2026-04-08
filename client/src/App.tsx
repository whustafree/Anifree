import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import ToastContainer from './components/Toast';
import Home from './pages/Home';
import AnimePage from './pages/AnimePage';
import EpisodePage from './pages/EpisodePage';
import SearchPage from './pages/SearchPage';
import BrowsePage from './pages/BrowsePage';
import FavoritesPage from './pages/FavoritesPage';
import HistoryPage from './pages/HistoryPage';
import SeasonsPage from './pages/SeasonsPage';
import { config } from './store';
import './index.css';

function NotFound() {
  return (
    <div style={{ padding:'100px 20px', textAlign:'center', color:'var(--text-muted)' }}>
      <div style={{ fontSize:64, marginBottom:16 }}>404</div>
      <p style={{ fontFamily:'var(--font-display)', fontSize:20, marginBottom:20 }}>Página no encontrada</p>
      <Link to="/" style={{ color:'var(--accent)', borderBottom:'1px solid var(--accent)', paddingBottom:2 }}>
        Volver al inicio
      </Link>
    </div>
  );
}

export default function App() {
  // Aplicar tema guardado al arrancar
  useEffect(() => {
    const theme = config.getTheme();
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/anime/:slug" element={<AnimePage />} />
        <Route path="/ver/:slug"   element={<EpisodePage />} />
        <Route path="/search"      element={<SearchPage />} />
        <Route path="/browse"      element={<BrowsePage />} />
        <Route path="/favoritos"   element={<FavoritesPage />} />
        <Route path="/historial"   element={<HistoryPage />} />
        <Route path="/temporadas"  element={<SeasonsPage />} />
        <Route path="*"            element={<NotFound />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}
