import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import imagesRouter from '../server/src/routes/images.js';
import notesRouter from '../server/src/routes/notes.js';
import quotaRouter from '../server/src/routes/quota.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.resolve(__dirname, '../server/uploads')));

app.use('/api/images', imagesRouter);
app.use('/api/notes', notesRouter);
app.use('/api/quota', quotaRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'file_too_large', message: '图片不能超过 20MB' });
    }
    return res.status(400).json({ error: 'upload_error', message: err.message });
  }
  if (err.message === 'Only image files allowed') {
    return res.status(400).json({ error: 'invalid_file_type', message: '只能上传图片文件' });
  }
  console.error('Unhandled server error:', err);
  return res.status(500).json({ error: 'internal_error', message: '服务器开小差了，请稍后再试' });
});

export default app;
