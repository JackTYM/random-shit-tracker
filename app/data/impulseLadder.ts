export const IMPULSE_LADDER = ['1/2A', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];

export function orderImpulseClasses(present: string[]): string[] {
  const known = IMPULSE_LADDER.filter((cls) => present.includes(cls));
  const unknown = present.filter((cls) => !IMPULSE_LADDER.includes(cls)).sort();
  return [...known, ...unknown];
}
