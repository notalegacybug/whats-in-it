// A renamed column or 0 records would silently drop a source's listings, so the build stops.
export function checkSourceFile(
  label: string,
  file: string,
  headers: readonly string[],
  columns: Readonly<Record<string, string>>,
  recordCount: number,
): void {
  const missing = Object.values(columns).filter((column) => !headers.includes(column))
  if (missing.length) {
    throw new Error(
      `${label}: ${file} is missing header(s) ${missing.map((m) => `"${m}"`).join(', ')}. ` +
        `Headers found: ${headers.join(', ') || '(none)'}. ` +
        'Compare with the adapter COLUMNS constant and fix whichever is wrong.',
    )
  }
  if (recordCount === 0) {
    throw new Error(`${label}: ${file} produced 0 records. The file is empty or its cell formats are not what the adapter expects.`)
  }
}
