import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db/index.js';
import { images, terms } from '../db/schema.js';
import { eq, and, gte, lte } from 'drizzle-orm';
import { upload } from '../middleware/upload.js';
import { generateTerms } from '../services/claude.js';
import { checkDailyQuota, checkUserQuota } from '../services/quota.js';
import { dateInTimeZone } from '../lib/timezone.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, '../../uploads');

// POST /api/images/upload
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) return res.status(400).json({ error: 'Missing X-User-ID header' });
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    // Quota checks
    const { allowed: dailyOk } = await checkDailyQuota();
    if (!dailyOk) {
      fs.unlinkSync(req.file.path);
      return res.status(429).json({ error: 'daily_limit', message: '今日额度已用完，明天再来' });
    }

    const { allowed: userOk } = await checkUserQuota(userId);
    if (!userOk) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: 'user_limit', message: '已达 200 张上限，删除旧图片后继续' });
    }

    const dateStr = (req.body.date as string) || dateInTimeZone();
    const relativePath = path.relative(uploadsDir, req.file.path);

    // Save image record
    const [image] = await db.insert(images).values({
      userId,
      date: dateStr,
      filePath: relativePath,
      mimeType: req.file.mimetype,
    }).returning();

    // Generate terms async — we return the image immediately, terms come via a second response shape
    let generatedTerms: { id: string; termEn: string; termZh: string; position: number }[] = [];
    let termsError: string | null = null;

    try {
      const imageBuffer = fs.readFileSync(req.file.path);
      const raw = await generateTerms(imageBuffer);

      if (raw.length > 0) {
        const inserted = await db.insert(terms).values(
          raw.map((t, i) => ({
            imageId: image.id,
            termEn: t.en,
            termZh: t.zh,
            position: i,
          }))
        ).returning();
        generatedTerms = inserted;
      }
    } catch (e) {
      termsError = e instanceof Error ? e.message : 'Term generation failed';
    }

    return res.json({ image, terms: generatedTerms, termsError });
  } catch (e) {
    console.error('Upload error:', e);
    return res.status(500).json({ error: 'Upload failed' });
  }
});

// GET /api/images?start=YYYY-MM-DD&end=YYYY-MM-DD&uid=...
router.get('/', async (req, res) => {
  try {
    const { start, end, uid } = req.query as { start?: string; end?: string; uid?: string };
    const userId = uid || (req.headers['x-user-id'] as string);
    if (!userId) return res.status(400).json({ error: 'Missing uid' });

    let query = db
      .select({
        image: images,
        term: terms,
      })
      .from(images)
      .leftJoin(terms, eq(terms.imageId, images.id))
      .where(
        and(
          eq(images.userId, userId),
          start ? gte(images.date, start) : undefined,
          end ? lte(images.date, end) : undefined
        )
      );

    const rows = await query;

    // Group by image
    const map = new Map<string, { image: typeof images.$inferSelect; terms: typeof terms.$inferSelect[] }>();
    for (const row of rows) {
      if (!map.has(row.image.id)) {
        map.set(row.image.id, { image: row.image, terms: [] });
      }
      if (row.term) map.get(row.image.id)!.terms.push(row.term);
    }

    const result = Array.from(map.values()).map(v => ({
      ...v.image,
      terms: v.terms.sort((a, b) => a.position - b.position),
    }));

    return res.json(result);
  } catch (e) {
    console.error('List error:', e);
    return res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// DELETE /api/images/:id
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    const [img] = await db.select().from(images).where(and(eq(images.id, id), eq(images.userId, userId)));
    if (!img) return res.status(404).json({ error: 'Not found' });

    // Delete file
    const filePath = path.join(uploadsDir, img.filePath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    // Cascade deletes terms via FK
    await db.delete(images).where(eq(images.id, id));

    return res.json({ ok: true });
  } catch (e) {
    console.error('Delete error:', e);
    return res.status(500).json({ error: 'Delete failed' });
  }
});

// DELETE /api/images/:id/terms/:tid
router.delete('/:id/terms/:tid', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id, tid } = req.params;

    // Verify ownership
    const [img] = await db.select().from(images).where(and(eq(images.id, id), eq(images.userId, userId)));
    if (!img) return res.status(404).json({ error: 'Not found' });

    await db.delete(terms).where(and(eq(terms.id, tid), eq(terms.imageId, id)));
    return res.json({ ok: true });
  } catch (e) {
    console.error('Term delete error:', e);
    return res.status(500).json({ error: 'Failed to delete term' });
  }
});

// POST /api/images/:id/retry-terms
router.post('/:id/retry-terms', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    const { allowed: dailyOk } = await checkDailyQuota();
    if (!dailyOk) return res.status(429).json({ error: 'daily_limit', message: '今日额度已用完，明天再来' });

    const [img] = await db.select().from(images).where(and(eq(images.id, id), eq(images.userId, userId)));
    if (!img) return res.status(404).json({ error: 'Not found' });

    const filePath = path.join(uploadsDir, img.filePath);
    const imageBuffer = fs.readFileSync(filePath);
    const raw = await generateTerms(imageBuffer);

    await db.delete(terms).where(eq(terms.imageId, id));

    let inserted: typeof terms.$inferSelect[] = [];
    if (raw.length > 0) {
      inserted = await db.insert(terms).values(
        raw.map((t, i) => ({ imageId: id, termEn: t.en, termZh: t.zh, position: i }))
      ).returning();
    }

    return res.json({ terms: inserted });
  } catch (e) {
    console.error('Retry error:', e);
    return res.status(500).json({ error: 'Retry failed' });
  }
});

export default router;
