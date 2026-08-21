export const STALE_MONTHS = 12;

export function monthsSince(dateStr: string): number {
  const parts = dateStr.split('-').map(Number);
  const year = parts[0]!;
  const month = parts[1]!;
  const now = new Date();
  return (now.getFullYear() - year) * 12 + (now.getMonth() - (month - 1));
}

export function formatItemDetailAge(dateStr: string): string {
  const months = monthsSince(dateStr);
  return months >= STALE_MONTHS ? `${months} MONTHS OLD — REVIEW` : `${months} MONTHS OLD`;
}

export function formatDashboardAge(dateStr: string): string {
  return `${monthsSince(dateStr)} MO OLD`;
}
