const SHAPE = /^\d{2,7}-\d{2}-\d$/

// The last digit is a checksum, so typos and placeholder values are rejected.
function checkDigitOk(cas: string): boolean {
  const digits = cas.replaceAll('-', '')
  const check = Number(digits.at(-1))
  let sum = 0
  for (let i = digits.length - 2, weight = 1; i >= 0; i--, weight++) sum += Number(digits[i]) * weight
  return sum % 10 === check
}

export function parseCas(cell: string): string[] {
  const out: string[] = []
  for (const token of cell.split(/[\s;,]+/)) {
    if (SHAPE.test(token) && checkDigitOk(token) && !out.includes(token)) out.push(token)
  }
  return out
}
