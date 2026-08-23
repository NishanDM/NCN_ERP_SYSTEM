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