import type { ExportColumn } from "./types"

interface PdfExportOptions<T> {
  fileName: string
  title: string
  subtitle?: string
  summaryLines?: string[]
  columns: ExportColumn<T>[]
  rows: T[]
  orientation?: "portrait" | "landscape"
}

// jspdf + jspdf-autotable are dynamically imported for the same reason as
// exceljs above — no cost until an export actually happens.
export async function exportRowsToPdf<T>({
  fileName,
  title,
  subtitle,
  summaryLines = [],
  columns,
  rows,
  orientation = "landscape",
}: PdfExportOptions<T>): Promise<void> {
  const { jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")

  const doc = new jsPDF({ orientation, unit: "pt", format: "a4" })
  const marginX = 40
  let cursorY = 48

  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.setTextColor(17, 24, 39)
  doc.text(title, marginX, cursorY)

  cursorY += 18
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(107, 114, 128)
  const generatedAt = `Generated ${new Date().toLocaleString()}`
  doc.text(subtitle ? `${subtitle} · ${generatedAt}` : generatedAt, marginX, cursorY)

  if (summaryLines.length > 0) {
    cursorY += 18
    doc.setFontSize(10)
    doc.setTextColor(55, 65, 81)
    summaryLines.forEach((line) => {
      doc.text(line, marginX, cursorY)
      cursorY += 14
    })
  }

  cursorY += 10

  autoTable(doc, {
    startY: cursorY,
    margin: { left: marginX, right: marginX, bottom: 40 },
    head: [columns.map((col) => col.header)],
    body: rows.map((row) =>
      columns.map((col) => {
        const raw = col.accessor ? col.accessor(row) : (row as Record<string, unknown>)[col.key]
        return raw === undefined || raw === null ? "" : String(raw)
      })
    ),
    styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
    headStyles: { fillColor: [31, 41, 55], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: Object.fromEntries(
      columns.map((col, index) => [
        index,
        { halign: col.align ?? "left", cellWidth: col.width ? col.width * 2.2 : "auto" },
      ])
    ),
  })

  // Autotable can add pages while it's still drawing, so the page count
  // isn't reliable inside its own callbacks — stamp footers in a final
  // pass over the finished document instead.
  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page)
    const pageSize = doc.internal.pageSize
    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175)
    doc.text(`Page ${page} of ${pageCount}`, pageSize.getWidth() - marginX, pageSize.getHeight() - 20, {
      align: "right",
    })
  }

  doc.save(fileName)
}