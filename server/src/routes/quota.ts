import { Router } from 'express';
import { getDailyUsage, checkUserQuota } from '../services/quota.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const [usage, userQuota] = await Promise.all([
      getDailyUsage(),
      userId ? checkUserQuota(userId) : Promise.resolve({ allowed: true, count: 0 }),
    ]);

    return res.json({
      daily: {
        costCents: usage.costCents,
        callCount: usage.callCount,
        limitCents: 80,
        remaining: Math.max(0, 80 - usage.costCents),
      },
      user: {
        count: userQuota.count,
        limit: 200,
        allowed: userQuota.allowed,
      },
    });
  } catch (e) {
    return res.status(500).json({ error: 'Failed' });
  }
});

export default router;
