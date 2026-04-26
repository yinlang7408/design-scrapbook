import { Router } from 'express';
import { db } from '../db/index.js';
import { notes } from '../db/schema.js';
import { and, eq } from 'drizzle-orm';

const router = Router();

// GET /api/notes?date=YYYY-MM-DD&uid=...
router.get('/', async (req, res) => {
  try {
    const { date, uid } = req.query as { date?: string; uid?: string };
    const userId = uid || (req.headers['x-user-id'] as string);
    if (!userId || !date) return res.status(400).json({ error: 'Missing date or uid' });

    const rows = await db.select().from(notes).where(and(eq(notes.userId, userId), eq(notes.date, date)));
    return res.json(rows[0] ?? { content: '' });
  } catch (e) {
    return res.status(500).json({ error: 'Failed' });
  }
});

// PUT /api/notes
router.put('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { date, content } = req.body as { date: string; content: string };
    if (!userId || !date) return res.status(400).json({ error: 'Missing fields' });

    const [note] = await db
      .insert(notes)
      .values({ userId, date, content: content ?? '' })
      .onConflictDoUpdate({
        target: [notes.userId, notes.date],
        set: { content: content ?? '', updatedAt: new Date() },
      })
      .returning();

    return res.json(note);
  } catch (e) {
    return res.status(500).json({ error: 'Failed' });
  }
});

export default router;
