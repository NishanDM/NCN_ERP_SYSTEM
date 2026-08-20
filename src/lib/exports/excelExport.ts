import { downloadBlob } from "./downloadBlob"
import type { ExportColumn } from "./types"

interface ExcelExportOptions<T> {
  fileName: string
  sheetName?: string
  columns: ExportColumn<T>[]
  rows: T[]
  generatedAtLabel?: string
}

const HEADER_FILL = {
  type: "pattern" as const,
  pattern: "solid" as const,
  fgColor: { argb: "FF1F2937" },
}

// exceljs is dynamically imported so its ~1MB isn't part of the initial
// bundle for a page that may never trigger an export.
export async function exportRowsToExcel<T>({
  fileName,
  sheetName = "Sheet1",
  columns,
  rows,
  generatedAtLabel,
}: ExcelExportOptions<T>): Promise<void> {
  const ExcelJS = (await import("exceljs")).default

  const workbook = new ExcelJS.Workbook()
  workbook.creator = "NCN ERP System"
  workbook.created = new Date()

  const sheet = workbook.addWorksheet(sheetName)
  sheet.columns = columns.map((col) => ({ key: col.key, width: col.width ?? 18 }))

  let headerRowNumber = 1

  if (generatedAtLabel) {
    const infoRow = sheet.addRow([generatedAtLabel])
    sheet.mergeCells(infoRow.number, 1, infoRow.number, columns.length)
    infoRow.getCell(1).font = { italic: true, size: 10, color: { argb: "FF6B7280" } }
    headerRowNumber = infoRow.number + 1
  }

  const headerRow = sheet.addRow(columns.map((col) => col.header))
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
    cell.fill = HEADER_FILL
    cell.alignment = { vertical: "middle" }
  })

  sheet.views = [{ state: "frozen", ySplit: headerRowNumber }]

  for (const row of rows) {
    const values = columns.map((col) => {
      const raw = col.accessor ? col.accessor(row) : (row as Record<string, unknown>)[col.key]
      return raw ?? ""
    })
    const addedRow = sheet.addRow(values)
    columns.forEach((col, index) => {
      const cell = addedRow.getCell(index + 1)
      if (col.numberFormat) cell.numFmt = col.numberFormat
      if (col.align) cell.alignment = { horizontal: col.align }
    })
  }

  sheet.autoFilter = {
    from: { row: headerRowNumber, column: 1 },
    to: { row: headerRowNumber, column: columns.length },
  }

  const buffer = await workbook.xlsx.writeBuffer()
  downloadBlob(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    fileName
  )
}