const NUMERALS: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]

export function toRoman(n: number): string {
  let out = ''
  for (const [value, symbol] of NUMERALS) while (n >= value) { out += symbol; n -= value }
  return out
}
