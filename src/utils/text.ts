export function truncate(text: string | null, max: number): string {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
