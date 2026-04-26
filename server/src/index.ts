import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import imagesRouter from './routes/images.js';
import notesRouter from './routes/notes.js';
import quotaRouter from './routes/quota.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());

// Serve uploaded images
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

app.use('/api/images', imagesRouter);
app.use('/api/notes', notesRouter);
app.use('/api/quota', quotaRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
