const SHAPE = /^\d{2,7}-\d{2}-\d$/

/**
 * A CAS number's last digit is a checksum: the other digits, weighted 1, 2, 3...
 * from right to left, sum to a value whose last digit equals it. Checking it
 * rejects typos and the placeholders some lists use instead of a number.
 */
function checkDigitOk(cas: string): boolean {
  const digits = cas.replaceAll('-', '')
  const check = Number(digits.at(-1))
  let sum = 0
  for (let i = digits.length - 2, weight = 1; i >= 0; i--, weight++) sum += Number(digits[i]) * weight
  return sum % 10 === check
}

/** Valid, check-digit-verified CAS numbers in a cell (any of `;` `,` or whitespace between them), de-duplicated. */
export function parseCas(cell: string): string[] {
  const out: string[] = []
  for (const token of cell.split(/[\s;,]+/)) {
    if (SHAPE.test(token) && checkDigitOk(token) && !out.includes(token)) out.push(token)
  }
  return out
}
