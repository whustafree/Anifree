import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import dotenv from 'dotenv';
import apiRouter from './routes/api';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(compression());
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', methods: ['GET'] }));

app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000, max: 100,
  message: { error: 'Demasiadas peticiones. Intenta más tarde.' },
}));

app.use('/api', apiRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((req, res) => res.status(404).json({ error: `Ruta ${req.path} no encontrada` }));

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Error interno', message: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

app.listen(PORT, () => {
  console.log(`\n🚀 AnimeFree API → http://localhost:${PORT}`);
});

export default app;
