import { db } from '../db/index.js';
import { dailyUsage, images } from '../db/schema.js';
import { eq, sql, count } from 'drizzle-orm';

const DAILY_LIMIT_CENTS = 80;
const USER_IMAGE_LIMIT = 200;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function checkDailyQuota(): Promise<{ allowed: boolean; usedCents: number }> {
  const today = todayStr();
  const rows = await db.select().from(dailyUsage).where(eq(dailyUsage.date, today));
  const used = rows[0]?.costCents ?? 0;
  return { allowed: used < DAILY_LIMIT_CENTS, usedCents: used };
}

export async function checkUserQuota(userId: string): Promise<{ allowed: boolean; count: number }> {
  const rows = await db
    .select({ cnt: count() })
    .from(images)
    .where(eq(images.userId, userId));
  const cnt = Number(rows[0]?.cnt ?? 0);
  return { allowed: cnt < USER_IMAGE_LIMIT, count: cnt };
}

export async function recordUsage(costCents: number): Promise<void> {
  const today = todayStr();
  await db
    .insert(dailyUsage)
    .values({ date: today, costCents, callCount: 1 })
    .onConflictDoUpdate({
      target: dailyUsage.date,
      set: {
        costCents: sql`${dailyUsage.costCents} + ${costCents}`,
        callCount: sql`${dailyUsage.callCount} + 1`,
      },
    });
}

export async function getDailyUsage(): Promise<{ costCents: number; callCount: number }> {
  const today = todayStr();
  const rows = await db.select().from(dailyUsage).where(eq(dailyUsage.date, today));
  return { costCents: rows[0]?.costCents ?? 0, callCount: rows[0]?.callCount ?? 0 };
}
