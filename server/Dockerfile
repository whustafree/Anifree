FROM node:20-alpine

# Instalar dependencias de sistema necesarias para cloudscraper
RUN apk add --no-cache python3 make g++ chromium

WORKDIR /app

# Copiar e instalar dependencias
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fuente y compilar
COPY . .
RUN npm run build

# Variables de entorno por defecto
ENV PORT=3000
ENV NODE_ENV=production
ENV ANIMEFLV_BASE_URL=https://www3.animeflv.net
ENV CACHE_TTL=300
ENV SCRAPER_TIMEOUT=15000

EXPOSE 3000

CMD ["node", "dist/index.js"]
