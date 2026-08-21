export const STALE_MONTHS = 12;

export function monthsSince(dateStr: string): number {
  const then = new Date(dateStr);
  const now = new Date();
  return (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth());
}

export function formatItemDetailAge(dateStr: string): string {
  const months = monthsSince(dateStr);
  return months >= STALE_MONTHS ? `${months} MONTHS OLD — REVIEW` : `${months} MONTHS OLD`;
}

export function formatDashboardAge(dateStr: string): string {
  return `${monthsSince(dateStr)} MO OLD`;
}
