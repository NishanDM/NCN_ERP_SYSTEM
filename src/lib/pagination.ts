/**
 * pagination.ts
 *
 * Shared pagination helpers. `StockItems.tsx` currently keeps its own local
 * copy of this exact function — it isn't touched here — but any *new*
 * paginated table (like the invoice item picker) should import from here
 * instead of pasting a third copy. Worth folding StockItems.tsx onto this
 * shared version in a later cleanup pass.
 */

/**
 * Builds a compact page-number sequence with ellipses for large page counts,
 * e.g. [1, "ellipsis", 6, 7, 8, "ellipsis", 42] — the same shape GitHub/
 * Google-style pagination uses.
 */
export function getPaginationRange(
  current: number,
  total: number
): (number | "ellipsis")[] {
  const delta = 1
  const range: (number | "ellipsis")[] = []

  const start = Math.max(2, current - delta)
  const end = Math.min(total - 1, current + delta)

  range.push(1)
  if (start > 2) range.push("ellipsis")
  for (let page = start; page <= end; page++) range.push(page)
  if (end < total - 1) range.push("ellipsis")
  if (total > 1) range.push(total)

  return range
}