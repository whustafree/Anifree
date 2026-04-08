# 🎌 AnimeFree — Portal Geek

Portal web para explorar y ver anime gratis, con scraping de **AnimeFlv**.
Stack: **React 19 + TypeScript + Vite** (frontend) + **Node.js + Express** (backend).

---

## 🚀 Instalación rápida

```bash
# 1. Clonar el repositorio
git clone https://github.com/whustafree/Animefree.git
cd Animefree

# 2. Instalar todas las dependencias
npm run install:all

# 3. Configurar variables de entorno
cp server/.env.example server/.env

# 4. Arrancar en modo desarrollo
npm run dev
```

- **Frontend:** http://localhost:5173
- **API:**       http://localhost:3000

---

## 📁 Estructura del proyecto

```
animefree/
├── client/                     # Frontend React + TypeScript
│   ├── public/
│   │   ├── manifest.json       # PWA manifest
│   │   ├── sw.js               # Service Worker (cache + adblock)
│   │   └── icons/              # Íconos SVG para PWA
│   └── src/
│       ├── components/
│       │   ├── Navbar.tsx      # Navbar con búsqueda, AdBlock badge, instalar PWA
│       │   ├── AnimeCard.tsx   # Card de anime con hover
│       │   ├── EpisodeCard.tsx # Card de episodio con fallback de imagen
│       │   └── AdBlockBadge.tsx# Indicador visual del bloqueador
│       ├── hooks/
│       │   └── usePWA.ts       # Hook para estado PWA e instalación
│       ├── pages/
│       │   ├── Home.tsx        # Inicio: trending + últimos episodios
│       │   ├── AnimePage.tsx   # Detalle de anime + lista de episodios
│       │   ├── EpisodePage.tsx # Reproductor + lista lateral + nav prev/next
│       │   ├── SearchPage.tsx  # Resultados de búsqueda
│       │   └── BrowsePage.tsx  # Catálogo con filtros por género y tipo
│       ├── api/index.ts        # Funciones para llamar al backend
│       └── types/index.ts      # Tipos TypeScript compartidos
│
└── server/                     # Backend Express + TypeScript
    ├── .env.example
    └── src/
        ├── index.ts            # Express + CORS + rate limiting
        ├── routes/api.ts       # 6 endpoints con caché automático
        ├── scrapers/
        │   └── animeflv.ts     # Scraper completo de AnimeFlv
        └── types/index.ts
```

---

## 📜 Scripts

| Comando             | Descripción                                  |
|---------------------|----------------------------------------------|
| `npm run dev`       | Frontend + backend en paralelo               |
| `npm run dev:client`| Solo Vite (frontend)                         |
| `npm run dev:server`| Solo Express (backend)                       |
| `npm run build`     | Build de producción                          |
| `npm start`         | Servidor en producción                       |
| `npm run install:all`| Instala todas las dependencias              |

---

## 🌐 API Endpoints

| Método | Ruta                       | Descripción                   |
|--------|----------------------------|-------------------------------|
| GET    | `/api/anime/trending`      | Animes en tendencia           |
| GET    | `/api/anime/latest`        | Últimos episodios agregados   |
| GET    | `/api/anime/search?q=...`  | Búsqueda por nombre           |
| GET    | `/api/anime/:slug`         | Detalle de un anime           |
| GET    | `/api/anime/:slug/episodes`| Lista de episodios            |
| GET    | `/api/episode/:slug`       | Fuentes de video del episodio |
| GET    | `/health`                  | Estado del servidor           |

---

## 🛡️ Bloqueador de anuncios

El Service Worker (`public/sw.js`) intercepta todas las peticiones y bloquea
automáticamente anuncios, popups y trackers sin afectar el reproductor de video:

- **+30 dominios** bloqueados (DoubleClick, ExoClick, Propeller, Taboola, crypto miners...)
- **Patrones de URL** bloqueados (`/ads/`, `/popup/`, `/tracker/`...)
- Devuelve respuesta `200` vacía — el reproductor **no se rompe**
- Cache de imágenes (thumbnails y portadas) para carga más rápida
- Funciona offline para assets estáticos

---

## 📱 PWA — Instalar como app

La aplicación puede instalarse en cualquier dispositivo:

- **Android/Chrome**: botón "Instalar" en el navbar, o menú del navegador → "Instalar app"
- **iOS/Safari**: compartir → "Añadir a pantalla de inicio"
- **Windows/Mac/Linux (Chrome/Edge)**: ícono de instalación en la barra de URL
- **Smart TV**: acceder vía navegador del TV, funciona en modo landscape

---

## 📺 Soporte de dispositivos

| Dispositivo          | Soporte                                    |
|----------------------|--------------------------------------------|
| Móvil (< 480px)      | ✅ Navbar compacta, grids adaptados         |
| Tablet (768–1024px)  | ✅ 2 columnas de episodios                  |
| Desktop (1024–1920px)| ✅ Layout completo                          |
| TV / 4K (≥ 1920px)   | ✅ Textos grandes, áreas táctiles amplias   |
| Ultra-wide (≥ 2560px)| ✅ Container 2200px, grid expandido         |
| Landscape en móvil   | ✅ Player maximizado, UI compacta           |
| Notch / Dynamic Island| ✅ safe-area-inset                         |

---

## 🧱 Stack tecnológico

| Capa       | Tecnología                              |
|------------|-----------------------------------------|
| Frontend   | React 19 + TypeScript + React Router 6  |
| Bundler    | Vite 7                                  |
| Estilos    | CSS puro con variables + módulos        |
| Servidor   | Node.js + Express 4                     |
| Scraping   | Cheerio + Cloudscraper                  |
| Cache API  | node-cache (5 min TTL)                  |
| PWA        | Service Worker manual + Web App Manifest|

---

## ⚠️ Aviso legal

Este proyecto es de uso educativo y personal.
El contenido pertenece a sus respectivos dueños.

---

## 🚀 Deploy en producción

### Opción recomendada: Vercel (frontend) + Railway (backend)

#### 1. Servidor en Railway

1. Ve a [railway.app](https://railway.app) y crea un proyecto nuevo
2. Conecta tu repo de GitHub y selecciona la carpeta `server/`
3. Railway detecta el `Dockerfile` automáticamente
4. Configura las variables de entorno en Railway:

```env
PORT=3000
NODE_ENV=production
ANIMEFLV_BASE_URL=https://www3.animeflv.net
CORS_ORIGIN=https://tu-app.vercel.app
CACHE_TTL=300
```

5. Copia la URL pública que Railway genera (ej: `https://animefree.up.railway.app`)

#### 2. Cliente en Vercel

1. Ve a [vercel.com](https://vercel.com) y crea un proyecto nuevo
2. Conecta el mismo repo, selecciona la carpeta `client/`
3. Vercel detecta Vite automáticamente
4. Edita `client/vercel.json` — reemplaza `RAILWAY_URL` con la URL real del servidor
5. Agrega variable de entorno en Vercel:

```env
VITE_API_URL=https://animefree.up.railway.app
```

#### 3. CI/CD automático con GitHub Actions

El workflow `.github/workflows/deploy.yml` hace deploy automático en cada push a `main`.

Agrega estos secretos en tu repo de GitHub (`Settings → Secrets → Actions`):

| Secret | Dónde obtenerlo |
|--------|----------------|
| `RAILWAY_TOKEN` | Railway → Account Settings → Tokens |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel → `vercel link` en la terminal |
| `VERCEL_PROJECT_ID` | Vercel → `vercel link` en la terminal |

### Opción alternativa: Docker local

```bash
# Construir y correr el servidor con Docker
cd server
docker build -t animefree-server .
docker run -p 3000:3000 \
  -e CORS_ORIGIN=http://localhost:5173 \
  animefree-server
```

---

## 📂 Subir a GitHub

```bash
# Inicializar el repo (si no existe)
git init
git remote add origin https://github.com/TU_USUARIO/Animefree.git

# Primer commit limpio
git add .
git commit -m "feat: proyecto completo - PWA, adblock, favoritos, historial, temporadas"
git push -u origin main
```

> El `.gitignore` ya excluye `node_modules/`, `dist/` y `.env` — el repo quedará limpio.
