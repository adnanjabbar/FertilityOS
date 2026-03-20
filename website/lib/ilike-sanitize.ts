/** Escape % and _ for safe ILIKE patterns (Postgres). */
export function sanitizeIlikePattern(raw: string): string {
  return `%${raw.replace(/[%_\\]/g, "")}%`;
}
