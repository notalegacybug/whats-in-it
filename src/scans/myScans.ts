import { withDb, type ScanRow } from '../products/db'

/** Records that this device scanned a product. One row per product; rescanning updates the date. */
export async function addScan(productId: string): Promise<void> {
  await withDb((db) => db.put('scans', { productId, scannedAt: new Date().toISOString() }))
}

/** Newest first. */
export async function listScans(): Promise<ScanRow[]> {
  const rows = await withDb((db) => db.getAll('scans'))
  return rows.sort((a, b) => b.scannedAt.localeCompare(a.scannedAt))
}
