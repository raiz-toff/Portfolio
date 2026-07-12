export function postDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'string' && value) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

export function readingMinutes(text: string): number {
  return Math.max(1, Math.round(text.split(/\s+/).length / 220));
}
