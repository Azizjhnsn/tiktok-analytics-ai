export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randomBetween(min: number, max: number): number {
  const low = Math.min(min, max);
  return low + Math.random() * Math.abs(max - min);
}
