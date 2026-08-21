export interface ExportColumn<T> {
  header: string
  key: string
  width?: number
  align?: "left" | "right" | "center"
  /** Excel-only cell number format, e.g. "#,##0.00". */
  numberFormat?: string
  accessor?: (row: T) => string | number
}