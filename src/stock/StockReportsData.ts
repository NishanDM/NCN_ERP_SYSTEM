import {
  getActiveItemCount,
  getQuantityStatus,
  getTotalStockValue,
  type StockItemRecord,
} from "./StockItemsData"

// ---- Top-line summary -----------------------------------------------------------

export interface StockReportSummary {
  totalItems: number
  totalQuantity: number
  stockValueCost: number // Σ costPrice × quantity — what the inventory cost to acquire
  stockValueSell: number // Σ sellingPrice × quantity — what it's worth at full retail
  potentialProfit: number // stockValueSell − stockValueCost
  avgMarginPercent: number // potentialProfit as a % of stockValueCost (markup, not margin-on-sell)
  lowStockCount: number // in stock, but at/under reorder level
  outOfStockCount: number // quantity === 0 — mutually exclusive from lowStockCount
  activeCount: number
  inactiveCount: number
  discontinuedCount: number
}

export function calculateStockReportSummary(items: StockItemRecord[]): StockReportSummary {
  const totalItems = items.length
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)

  const stockValueCost = getTotalStockValue(items)
  const stockValueSell = items.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0)
  const potentialProfit = stockValueSell - stockValueCost
  const avgMarginPercent = stockValueCost > 0 ? (potentialProfit / stockValueCost) * 100 : 0

  const lowStockCount = items.filter((item) => getQuantityStatus(item) === "low_stock").length
  const outOfStockCount = items.filter((item) => getQuantityStatus(item) === "out_of_stock").length

  const activeCount = getActiveItemCount(items)
  const inactiveCount = totalItems - activeCount

  return {
    totalItems,
    totalQuantity,
    stockValueCost,
    stockValueSell,
    potentialProfit,
    avgMarginPercent,
    lowStockCount,
    outOfStockCount,
    activeCount,
    inactiveCount,
    discontinuedCount: 0,
  }
}

// ---- Value breakdowns  --------------------------------------

export interface CategoryValueBreakdown {
  categoryName: string
  value: number 
  units: number 
}

export interface SupplierValueBreakdown {
  supplierName: string
  value: number 
  itemCount: number 
}

export function calculateCategoryBreakdown(items: StockItemRecord[]): CategoryValueBreakdown[] {
  const byCategory = new Map<string, CategoryValueBreakdown>()

  for (const item of items) {
    const existing = byCategory.get(item.categoryName)
    const itemValue = item.costPrice * item.quantity

    if (existing) {
      existing.value += itemValue
      existing.units += item.quantity
    } else {
      byCategory.set(item.categoryName, {
        categoryName: item.categoryName,
        value: itemValue,
        units: item.quantity,
      })
    }
  }

  return Array.from(byCategory.values()).sort((a, b) => b.value - a.value)
}

export function calculateSupplierBreakdown(items: StockItemRecord[]): SupplierValueBreakdown[] {
  const bySupplier = new Map<string, SupplierValueBreakdown>()

  for (const item of items) {
    const existing = bySupplier.get(item.supplierName)
    const itemValue = item.costPrice * item.quantity

    if (existing) {
      existing.value += itemValue
      existing.itemCount += 1
    } else {
      bySupplier.set(item.supplierName, {
        supplierName: item.supplierName,
        value: itemValue,
        itemCount: 1,
      })
    }
  }

  return Array.from(bySupplier.values()).sort((a, b) => b.value - a.value)
}

// ---- Formatting -------------------------------------------------------------------

export const formatPercent = (value: number): string => `${value.toFixed(2)}%`

export const formatGeneratedTimestamp = (date: Date): string => date.toLocaleString("en-US")