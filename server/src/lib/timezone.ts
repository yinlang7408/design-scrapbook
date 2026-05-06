export const APP_TIMEZONE =
  process.env.APP_TIMEZONE ??
  Intl.DateTimeFormat().resolvedOptions().timeZone ??
  'UTC';

export function dateInTimeZone(date = new Date(), timeZone = APP_TIMEZONE): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const values = parts.reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});

  return `${values.year}-${values.month}-${values.day}`;
}
