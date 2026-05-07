import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db/index.js';
import { images, terms } from '../db/schema.js';
import { eq, and, gte, lte, asc } from 'drizzle-orm';
import { upload } from '../middleware/upload.js';
import { generateTerms } from '../services/claude.js';
import { generateDesignSkill } from '../services/generateDesignSkill.js';
import { checkDailyQuota, checkUserQuota } from '../services/quota.js';
import { dateInTimeZone } from '../lib/timezone.js';
import { put, del } from '@vercel/blob';

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
      return res.status(429).json({ error: 'daily_limit', message: '今日额度已用完，明天再来' });
    }

    const { allowed: userOk } = await checkUserQuota(userId);
    if (!userOk) {
      return res.status(403).json({ error: 'user_limit', message: '已达 200 张上限，删除旧图片后继续' });
    }

    const dateStr = (req.body.date as string) || dateInTimeZone();
    const ext = path.extname(req.file.originalname) || '.jpg';
    const filename = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

    // Upload to Vercel Blob
    const blob = await put(filename, req.file.buffer, {
      access: 'public',
      contentType: req.file.mimetype,
    });

    // Save image record
    const [image] = await db.insert(images).values({
      userId,
      date: dateStr,
      filePath: blob.url,
      mimeType: req.file.mimetype,
    }).returning();

    // Generate terms
    let generatedTerms: { id: string; termEn: string; termZh: string; position: number }[] = [];
    let termsError: string | null = null;

    try {
      const raw = await generateTerms(req.file.buffer);

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

// GET /api/images?start=YYYY-MM-DD&end=YYYY-MM-DD&all=1
router.get('/', async (req, res) => {
  try {
    const { start, end, uid, all } = req.query as { start?: string; end?: string; uid?: string; all?: string };
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
          all === '1' ? undefined : (start ? gte(images.date, start) : undefined),
          all === '1' ? undefined : (end ? lte(images.date, end) : undefined)
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

    // Delete from Blob (if it's a blob URL)
    if (img.filePath.startsWith('https://')) {
      try { await del(img.filePath); } catch { /* best effort */ }
    } else {
      // Fallback: local file
      const filePath = path.join(uploadsDir, img.filePath);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

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

    const imageBuffer = await fetchImageBuffer(img.filePath);
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

async function fetchImageBuffer(filePath: string): Promise<Buffer> {
  if (filePath.startsWith('https://')) {
    const res = await fetch(filePath);
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
  const localPath = path.join(uploadsDir, filePath);
  return fs.readFileSync(localPath);
}

// POST /api/images/generate-skill
router.post('/generate-skill', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) return res.status(400).json({ error: 'Missing X-User-ID header' });

    const { imageIds } = req.body as { imageIds?: string[] };
    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({ error: 'Missing or empty imageIds array' });
    }

    if (imageIds.length > 20) {
      return res.status(400).json({ error: 'Maximum 20 images allowed' });
    }

    const { allowed: dailyOk } = await checkDailyQuota();
    if (!dailyOk) return res.status(429).json({ error: 'daily_limit', message: '今日额度已用完，明天再来' });

    const imageBuffers: Buffer[] = [];
    const termsContext: string[] = [];

    for (const id of imageIds) {
      const [img] = await db.select().from(images)
        .where(and(eq(images.id, id), eq(images.userId, userId)));
      if (!img) return res.status(403).json({ error: `Image ${id} not found or not owned` });

      const imgTerms = await db.select().from(terms)
        .where(eq(terms.imageId, id))
        .orderBy(asc(terms.position));

      const buffer = await fetchImageBuffer(img.filePath);
      imageBuffers.push(buffer);
      termsContext.push(imgTerms.map(t => t.termEn).join(', ') || 'No tags');
    }

    const markdown = await generateDesignSkill(imageBuffers, termsContext);
    return res.json({ markdown });
  } catch (e) {
    console.error('Generate skill error:', e);
    return res.status(500).json({ error: 'Failed to generate design skill' });
  }
});

export default router;
