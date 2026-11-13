export function normalizeName(raw: string): string {
  return raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics left by NFKD
    .toLowerCase()
    .replace(/[\u2010-\u2015\u2212]/g, '-') // every dash variant -> '-'
    .replace(/\d+(\.\d+)?\s*%/g, '') // percentages
    .replace(/\be\s+(?=\d)/g, 'e') // "E 171" -> "e171"
    .replace(/\s+/g, ' ')
    .replace(/[\s*.]+$/, '') // trailing '*' and '.'
    .trim()
}
