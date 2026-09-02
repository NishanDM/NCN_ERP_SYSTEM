export type PaymentMethod = "cash" | "cheque" | "bank_transfer"

export const PAYMENT_METHOD_OPTIONS: {
  value: PaymentMethod
  label: string
}[] = [
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "bank_transfer", label: "Bank Transfer" },
]

export const getPaymentMethodLabel = (value: PaymentMethod): string =>
  PAYMENT_METHOD_OPTIONS.find((opt) => opt.value === value)?.label ?? value

// ---- Outstanding GRNs  --------------------------------

export interface OutstandingGrn {
  id: string
  grnNumber: string
  supplierId: string
  /** ISO date (YYYY-MM-DD) — used to sort oldest-first for FIFO. */
  grnDate: string
  outstandingAmount: number
}

export const OUTSTANDING_GRNS: OutstandingGrn[] = [
  // MIHIRI MOTORS (sup-001)
  { id: "grn-001", grnNumber: "GRN-2031", supplierId: "sup-001", grnDate: "2026-06-10", outstandingAmount: 45000 },
  { id: "grn-002", grnNumber: "GRN-2065", supplierId: "sup-001", grnDate: "2026-07-02", outstandingAmount: 60000 },
  { id: "grn-003", grnNumber: "GRN-2102", supplierId: "sup-001", grnDate: "2026-07-25", outstandingAmount: 30000 },

  // ONAYA ENTERPRISES (sup-002)
  { id: "grn-004", grnNumber: "GRN-1987", supplierId: "sup-002", grnDate: "2026-05-18", outstandingAmount: 120000 },
  { id: "grn-005", grnNumber: "GRN-2044", supplierId: "sup-002", grnDate: "2026-06-22", outstandingAmount: 80000 },

  // EXIM HOUSE (sup-003)
  { id: "grn-006", grnNumber: "GRN-2011", supplierId: "sup-003", grnDate: "2026-06-01", outstandingAmount: 25000 },

  // KANDY ELECTRO TRADERS (sup-004)
  { id: "grn-007", grnNumber: "GRN-2077", supplierId: "sup-004", grnDate: "2026-07-10", outstandingAmount: 55000 },
  { id: "grn-008", grnNumber: "GRN-2119", supplierId: "sup-004", grnDate: "2026-08-05", outstandingAmount: 40000 },

  // SOUTHERN APPLIANCE HOUSE (sup-005)
  { id: "grn-009", grnNumber: "GRN-1955", supplierId: "sup-005", grnDate: "2026-05-02", outstandingAmount: 90000 },
  { id: "grn-010", grnNumber: "GRN-2003", supplierId: "sup-005", grnDate: "2026-05-29", outstandingAmount: 70000 },
  { id: "grn-011", grnNumber: "GRN-2088", supplierId: "sup-005", grnDate: "2026-07-15", outstandingAmount: 50000 },
]

export const getOutstandingGrnsForSupplier = (
  supplierId: string
): OutstandingGrn[] =>
  OUTSTANDING_GRNS.filter((grn) => grn.supplierId === supplierId)

export const getOutstandingTotalForSupplier = (supplierId: string): number =>
  getOutstandingGrnsForSupplier(supplierId).reduce(
    (sum, grn) => sum + grn.outstandingAmount,
    0
  )

// ---- FIFO allocation --------------------------------------------------------------

export interface GrnAllocation {
  grnId: string
  grnNumber: string
  grnDate: string
  outstandingAmount: number
  amountApplied: number
  remainingAfter: number
}

export interface FifoAllocationResult {
  allocations: GrnAllocation[]
  unallocatedAmount: number
}

export function allocateFifoPayment(
  grns: OutstandingGrn[],
  amountPaid: number
): FifoAllocationResult {
  const oldestFirst = [...grns].sort((a, b) =>
    a.grnDate.localeCompare(b.grnDate)
  )

  let remaining = amountPaid
  const allocations: GrnAllocation[] = []

  for (const grn of oldestFirst) {
    if (remaining <= 0) break

    const amountApplied = Math.min(grn.outstandingAmount, remaining)
    if (amountApplied <= 0) continue

    allocations.push({
      grnId: grn.id,
      grnNumber: grn.grnNumber,
      grnDate: grn.grnDate,
      outstandingAmount: grn.outstandingAmount,
      amountApplied,
      remainingAfter: grn.outstandingAmount - amountApplied,
    })

    remaining -= amountApplied
  }

  return { allocations, unallocatedAmount: Math.max(0, remaining) }
}

// ---- Settlement record  -------------------------

export interface SettlementRecord {
  id: string
  supplierId: string
  supplierName: string
  paymentMethod: PaymentMethod
  amountPaid: number
  /** ISO date (YYYY-MM-DD). */
  paymentDate: string
  remark: string
  recordedBy: string
  grnsSettled: number
}

export const INITIAL_SETTLEMENTS: SettlementRecord[] = [
  { id: "stl-001", supplierId: "sup-001", supplierName: "MIHIRI MOTORS (PVT) LTD", paymentMethod: "cash", amountPaid: 45000, paymentDate: "2026-08-05", remark: "Settled GRN-2031 in full.", recordedBy: "S. Perera", grnsSettled: 1 },
  { id: "stl-002", supplierId: "sup-002", supplierName: "ONAYA ENTERPRISES", paymentMethod: "bank_transfer", amountPaid: 120000, paymentDate: "2026-08-04", remark: "Cleared oldest outstanding GRN.", recordedBy: "N. Fernando", grnsSettled: 1 },
  { id: "stl-003", supplierId: "sup-005", supplierName: "SOUTHERN APPLIANCE HOUSE", paymentMethod: "cheque", amountPaid: 90000, paymentDate: "2026-08-02", remark: "", recordedBy: "S. Perera", grnsSettled: 1 },
  { id: "stl-004", supplierId: "sup-004", supplierName: "KANDY ELECTRO TRADERS", paymentMethod: "cash", amountPaid: 55000, paymentDate: "2026-07-30", remark: "Paid in full on delivery day.", recordedBy: "R. Jayasuriya", grnsSettled: 1 },
  { id: "stl-005", supplierId: "sup-003", supplierName: "EXIM HOUSE (PVT) LTD", paymentMethod: "bank_transfer", amountPaid: 25000, paymentDate: "2026-07-28", remark: "", recordedBy: "N. Fernando", grnsSettled: 1 },
  { id: "stl-006", supplierId: "sup-001", supplierName: "MIHIRI MOTORS (PVT) LTD", paymentMethod: "cheque", amountPaid: 60000, paymentDate: "2026-07-20", remark: "Cheque cleared next business day.", recordedBy: "S. Perera", grnsSettled: 1 },
  { id: "stl-007", supplierId: "sup-002", supplierName: "ONAYA ENTERPRISES", paymentMethod: "cash", amountPaid: 80000, paymentDate: "2026-07-15", remark: "", recordedBy: "R. Jayasuriya", grnsSettled: 1 },
  { id: "stl-008", supplierId: "sup-005", supplierName: "SOUTHERN APPLIANCE HOUSE", paymentMethod: "bank_transfer", amountPaid: 70000, paymentDate: "2026-07-10", remark: "Partial advance ahead of next delivery.", recordedBy: "N. Fernando", grnsSettled: 1 },
  { id: "stl-009", supplierId: "sup-008", supplierName: "BALANGODA TRADE CENTRE", paymentMethod: "cash", amountPaid: 100000, paymentDate: "2026-07-05", remark: "", recordedBy: "S. Perera", grnsSettled: 2 },
  { id: "stl-010", supplierId: "sup-010", supplierName: "BADULLA HOME SYSTEMS", paymentMethod: "cheque", amountPaid: 150000, paymentDate: "2026-06-28", remark: "Festive season stock settlement.", recordedBy: "R. Jayasuriya", grnsSettled: 3 },
  { id: "stl-011", supplierId: "sup-004", supplierName: "KANDY ELECTRO TRADERS", paymentMethod: "bank_transfer", amountPaid: 40000, paymentDate: "2026-06-20", remark: "", recordedBy: "N. Fernando", grnsSettled: 1 },
  { id: "stl-012", supplierId: "sup-009", supplierName: "MATARA DIGITAL SUPPLIES", paymentMethod: "cash", amountPaid: 62000, paymentDate: "2026-06-12", remark: "New supplier's first settlement.", recordedBy: "S. Perera", grnsSettled: 1 },
]

// ---- Formatting helpers -------------------------------------------------------------

export const formatCurrency = (value: number): string =>
  `Rs. ${value.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const formatDisplayDate = (isoDate: string): string => {
  if (!isoDate) return "—"
  const parsed = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return isoDate
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export const getTodayIso = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}