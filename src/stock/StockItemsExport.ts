import { exportRowsToExcel } from "@/lib/exports/excelExport"
import { exportRowsToPdf } from "@/lib/exports/pdfExport"
import type { ExportColumn } from "@/lib/exports/types"
import {
  getActiveItemCount,
  getLowStockCount,
  getTotalStockValue,
  isLowStock,
  type StockItemRecord,
} from "./StockItemsData"

export type StockExportScope = "filtered" | "full"

// One column list drives both the Excel sheet and the PDF table, so
// adding/renaming/reordering a field only has to happen in one place.
const EXPORT_COLUMNS: ExportColumn<StockItemRecord>[] = [
  { header: "Item Code", key: "itemCode", width: 16 },
  { header: "Item Name", key: "itemName", width: 32 },
  { header: "Brand", key: "brand", width: 16 },
  { header: "SKU.", key: "stockKeepingUnit", width: 16 },
  { header: "Category", key: "categoryName", width: 18 },
  { header: "Sub-Category", key: "subCategoryName", width: 18 },
  { header: "Supplier", key: "supplierName", width: 20 },
  { header: "Quantity", key: "quantity", width: 10, align: "right" },
  {
    header: "Supplier Price (Rs.)",
    key: "supplierUnitPrice",
    width: 16,
    align: "right",
    numberFormat: "#,##0.00",
  },
  {
    header: "Cost Price (Rs.)",
    key: "costPrice",
    width: 14,
    align: "right",
    numberFormat: "#,##0.00",
  },
  {
    header: "Selling Price (Rs.)",
    key: "sellingPrice",
    width: 16,
    align: "right",
    numberFormat: "#,##0.00",
  },
  {
    header: "Status",
    key: "status",
    width: 12,
    accessor: (item) => (item.status === "active" ? "Active" : "Inactive"),
  },
  {
    header: "Stock Flag",
    key: "stockFlag",
    width: 12,
    accessor: (item) => (isLowStock(item) ? "Low Stock" : "OK"),
  },
]

function timestampForFileName(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(
    now.getMinutes()
  )}`
}

function buildGeneratedAtLabel(scope: StockExportScope, count: number): string {
  const scopeLabel = scope === "full" ? "Full stock" : "Filtered view"
  return `${scopeLabel} · ${count.toLocaleString()} item(s) · Generated ${new Date().toLocaleString()}`
}

export async function exportStockItemsToExcel(
  items: StockItemRecord[],
  scope: StockExportScope
): Promise<void> {
  await exportRowsToExcel({
    fileName: `stock-items-${scope}-${timestampForFileName()}.xlsx`,
    sheetName: "Stock Items",
    columns: EXPORT_COLUMNS,
    rows: items,
    generatedAtLabel: buildGeneratedAtLabel(scope, items.length),
  })
}

export async function exportStockItemsToPdf(
  items: StockItemRecord[],
  scope: StockExportScope
): Promise<void> {
  // NOTE (deliberately deferred): the "full" scope currently produces a
  // plain tabular report. The Stock Reports Dashboard design (KPI tiles,
  // status breakdown, per-category/supplier value bars) is a separate,
  // larger piece of work that will render into a PDF the same shape as
  // that dashboard — this just needs to be *a* complete report for now.
  const summaryLines =
    scope === "full"
      ? [
          `Total items: ${items.length.toLocaleString()}`,
          `Active items: ${getActiveItemCount(items).toLocaleString()}`,
          `Low stock items: ${getLowStockCount(items).toLocaleString()}`,
          `Total stock value (cost): Rs. ${getTotalStockValue(items).toLocaleString()}`,
        ]
      : [`Showing ${items.length.toLocaleString()} item(s) matching the current filters`]

  await exportRowsToPdf({
    fileName: `stock-items-${scope}-${timestampForFileName()}.pdf`,
    title: scope === "full" ? "Full Stock Report" : "Stock Items — Filtered Report",
    subtitle: "NCN ERP System",
    summaryLines,
    columns: EXPORT_COLUMNS,
    rows: items,
    orientation: "landscape",
  })
}