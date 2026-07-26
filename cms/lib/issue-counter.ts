export function issueNumberFor(date: Date): { issue: number; week: number } {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const ms = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(ms / 86_400_000) + 1;
  const week = Math.ceil(dayOfYear / 7);
  return { issue: week, week };
}
