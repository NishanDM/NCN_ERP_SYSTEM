import {
  DEFAULT_CREDIT_PERIOD,
  type SupplierRecord,
} from "./ViewAllSuppliersData"
import { type PaymentMethod } from "./SupplierSettlementsData"
import { type ChequeStatus } from "./SupplierPaymentsData"

// ---- GRN outstanding status ---------------------------------------------------------

export type GrnOutstandingStatus = "pending" | "partial" | "paid" | "overdue"

export const GRN_STATUS_OPTIONS: {
  value: GrnOutstandingStatus
  label: string
}[] = [
  { value: "pending", label: "Pending" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
]

export const getGrnStatusLabel = (value: GrnOutstandingStatus): string =>
  GRN_STATUS_OPTIONS.find((opt) => opt.value === value)?.label ?? value

// ---- GRN bill -----------------

export interface GrnOutstanding {
  id: string
  grnNumber: string
  invoiceNumber: string
  supplierId: string
  /** ISO date (YYYY-MM-DD). */
  grnDate: string
  totalAmount: number
}

// ---- Payments recorded against a GRN -------------------------------------------------

export interface GrnPayment {
  id: string
  grnId: string
  paymentMethod: PaymentMethod
  amountPaid: number
  paymentDate: string
  remark: string
  recordedBy: string
  // Cheque-only
  chequeNo?: string
  chequeDate?: string
  chequeFromBank?: string
  chequeToBank?: string
  chequeBranch?: string
  chequeStatus?: ChequeStatus
  // Bank transfer-only
  referenceNo?: string
  transferFromBank?: string
  transferToBank?: string
  transferDate?: string
}

export function isPaymentEffective(payment: GrnPayment): boolean {
  if (payment.paymentMethod === "cheque") {
    return payment.chequeStatus === "cleared"
  }
  return true
}


function getTodayIso(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export const TODAY_ISO = getTodayIso()

// ---- Seed data ------------------------------------------------------------------------

export const INITIAL_GRN_OUTSTANDINGS: GrnOutstanding[] = [
  { id: "grnout-001", grnNumber: "GRN-2201", invoiceNumber: "INV-10050", supplierId: "sup-001", grnDate: "2026-08-09", totalAmount: 32900 },
  { id: "grnout-002", grnNumber: "GRN-2202", invoiceNumber: "INV-10051", supplierId: "sup-001", grnDate: "2026-08-09", totalAmount: 6237 },
  { id: "grnout-003", grnNumber: "GRN-2203", invoiceNumber: "INV-10052", supplierId: "sup-001", grnDate: "2026-08-08", totalAmount: 19460.7 },
  { id: "grnout-004", grnNumber: "GRN-2204", invoiceNumber: "INV-10053", supplierId: "sup-003", grnDate: "2026-08-08", totalAmount: 538860 },
  { id: "grnout-005", grnNumber: "GRN-2205", invoiceNumber: "INV-10054", supplierId: "sup-001", grnDate: "2026-08-06", totalAmount: 4095 },
  { id: "grnout-006", grnNumber: "GRN-2206", invoiceNumber: "INV-10055", supplierId: "sup-001", grnDate: "2026-08-06", totalAmount: 8371.25 },
  { id: "grnout-007", grnNumber: "GRN-2207", invoiceNumber: "INV-10056", supplierId: "sup-002", grnDate: "2026-07-28", totalAmount: 120000 },
  { id: "grnout-008", grnNumber: "GRN-2208", invoiceNumber: "INV-10057", supplierId: "sup-005", grnDate: "2026-07-20", totalAmount: 90000 },
  { id: "grnout-009", grnNumber: "GRN-2209", invoiceNumber: "INV-10058", supplierId: "sup-004", grnDate: "2026-07-15", totalAmount: 55000 },
  { id: "grnout-010", grnNumber: "GRN-2210", invoiceNumber: "INV-10059", supplierId: "sup-008", grnDate: "2026-06-25", totalAmount: 100000 },
  { id: "grnout-011", grnNumber: "GRN-2211", invoiceNumber: "INV-10060", supplierId: "sup-010", grnDate: "2026-06-10", totalAmount: 150000 },
  { id: "grnout-012", grnNumber: "GRN-2212", invoiceNumber: "INV-10061", supplierId: "sup-006", grnDate: "2026-05-18", totalAmount: 32000 },
]

export const INITIAL_GRN_PAYMENTS: GrnPayment[] = [
  {
    id: "grnpay-001",
    grnId: "grnout-004",
    paymentMethod: "cash",
    amountPaid: 538860,
    paymentDate: "2026-08-20",
    remark: "Paid in full on delivery day.",
    recordedBy: "S. Perera",
  },
  {
    id: "grnpay-002",
    grnId: "grnout-007",
    paymentMethod: "bank_transfer",
    amountPaid: 60000,
    paymentDate: "2026-08-05",
    remark: "Partial advance ahead of next delivery.",
    recordedBy: "N. Fernando",
    referenceNo: "TXN-88213",
    transferFromBank: "HNB",
    transferToBank: "Sampath Bank",
    transferDate: "2026-08-05",
  },
  {
    id: "grnpay-003",
    grnId: "grnout-008",
    paymentMethod: "cheque",
    amountPaid: 90000,
    paymentDate: "2026-07-25",
    remark: "",
    recordedBy: "S. Perera",
    chequeNo: "004521",
    chequeDate: "2026-07-25",
    chequeFromBank: "Commercial Bank",
    chequeToBank: "BOC",
    chequeBranch: "Homagama",
    chequeStatus: "cleared",
  },
  {
    id: "grnpay-004",
    grnId: "grnout-009",
    paymentMethod: "cheque",
    amountPaid: 20000,
    paymentDate: "2026-07-18",
    remark: "First installment, balance to follow.",
    recordedBy: "R. Jayasuriya",
    chequeNo: "004498",
    chequeDate: "2026-07-18",
    chequeFromBank: "Commercial Bank",
    chequeToBank: "Sampath Bank",
    chequeBranch: "Kandy",
    chequeStatus: "pending",
  },
  {
    id: "grnpay-005",
    grnId: "grnout-010",
    paymentMethod: "cheque",
    amountPaid: 100000,
    paymentDate: "2026-06-28",
    remark: "Cheque returned by bank, follow-up needed.",
    recordedBy: "S. Perera",
    chequeNo: "119872",
    chequeDate: "2026-06-28",
    chequeFromBank: "BOC",
    chequeToBank: "NDB",
    chequeBranch: "Balangoda",
    chequeStatus: "returned",
  },
  {
    id: "grnpay-006",
    grnId: "grnout-012",
    paymentMethod: "cheque",
    amountPaid: 32000,
    paymentDate: "2026-05-25",
    remark: "Insufficient funds, supplier notified.",
    recordedBy: "N. Fernando",
    chequeNo: "119801",
    chequeDate: "2026-05-25",
    chequeFromBank: "Sampath Bank",
    chequeToBank: "HNB",
    chequeBranch: "Kurunegala",
    chequeStatus: "bounced",
  },
]

// ---- Derivation (paid amount / balance / due date / status) -------------------------

export function getPaymentsForGrn(
  payments: GrnPayment[],
  grnId: string
): GrnPayment[] {
  return payments
    .filter((payment) => payment.grnId === grnId)
    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
}

export function getPaidAmountForGrn(
  payments: GrnPayment[],
  grnId: string
): number {
  return getPaymentsForGrn(payments, grnId)
    .filter(isPaymentEffective)
    .reduce((sum, payment) => sum + payment.amountPaid, 0)
}

export function computeDueDate(
  grnDate: string,
  creditPeriodDays: number
): string {
  const date = new Date(`${grnDate}T00:00:00`)
  date.setDate(date.getDate() + creditPeriodDays)
  return date.toISOString().slice(0, 10)
}

export function computeGrnStatus(
  totalAmount: number,
  paidAmount: number,
  dueDate: string,
  todayIso: string
): GrnOutstandingStatus {
  const balance = totalAmount - paidAmount
  if (balance <= 0.01) return "paid"
  if (dueDate < todayIso) return "overdue"
  return paidAmount > 0 ? "partial" : "pending"
}

export interface ResolvedGrnOutstanding {
  grn: GrnOutstanding
  supplier: SupplierRecord | undefined
  payments: GrnPayment[]
  paidAmount: number
  balance: number
  progress: number
  dueDate: string
  status: GrnOutstandingStatus
}

export function resolveGrnOutstandings(
  grns: GrnOutstanding[],
  payments: GrnPayment[],
  suppliers: SupplierRecord[],
  todayIso: string = TODAY_ISO
): ResolvedGrnOutstanding[] {
  const supplierById = new Map(suppliers.map((s) => [s.id, s]))

  return grns.map((grn) => {
    const supplier = supplierById.get(grn.supplierId)
    const grnPayments = getPaymentsForGrn(payments, grn.id)
    const paidAmount = getPaidAmountForGrn(payments, grn.id)
    const balance = Math.max(0, grn.totalAmount - paidAmount)
    const progress =
      grn.totalAmount > 0
        ? Math.min(100, Math.round((paidAmount / grn.totalAmount) * 100))
        : 0
    const dueDate = computeDueDate(
      grn.grnDate,
      supplier?.creditPeriodDays ?? DEFAULT_CREDIT_PERIOD
    )
    const status = computeGrnStatus(grn.totalAmount, paidAmount, dueDate, todayIso)

    return {
      grn,
      supplier,
      payments: grnPayments,
      paidAmount,
      balance,
      progress,
      dueDate,
      status,
    }
  })
}

// ---- GRN Outstandings tab: filtering ------------------------------------------------

export interface GrnOutstandingFilterOptions {
  supplierQuery: string
  search: string
  status: GrnOutstandingStatus | "all"
}

export function filterResolvedGrns(
  rows: ResolvedGrnOutstanding[],
  options: GrnOutstandingFilterOptions
): ResolvedGrnOutstanding[] {
  const supplierQuery = options.supplierQuery.trim().toLowerCase()
  const search = options.search.trim().toLowerCase()

  return rows.filter((row) => {
    if (supplierQuery && !matchesSupplierQuery(row.supplier, supplierQuery)) {
      return false
    }

    if (
      search &&
      !(
        row.grn.grnNumber.toLowerCase().includes(search) ||
        row.grn.invoiceNumber.toLowerCase().includes(search) ||
        matchesSupplierQuery(row.supplier, search)
      )
    ) {
      return false
    }

    if (options.status !== "all" && row.status !== options.status) {
      return false
    }

    return true
  })
}

function matchesSupplierQuery(
  supplier: SupplierRecord | undefined,
  query: string
): boolean {
  if (!supplier) return false
  return (
    supplier.supplierName.toLowerCase().includes(query) ||
    supplier.supplierCode.toLowerCase().includes(query)
  )
}

// ---- Cheque Tracker tab: resolving + filtering ---------------------------------------

export interface ResolvedChequePayment {
  payment: GrnPayment
  grn: GrnOutstanding | undefined
  supplier: SupplierRecord | undefined
}

export function resolveChequePayments(
  payments: GrnPayment[],
  grns: GrnOutstanding[],
  suppliers: SupplierRecord[]
): ResolvedChequePayment[] {
  const grnById = new Map(grns.map((g) => [g.id, g]))
  const supplierById = new Map(suppliers.map((s) => [s.id, s]))

  return payments
    .filter((payment) => payment.paymentMethod === "cheque")
    .map((payment) => {
      const grn = grnById.get(payment.grnId)
      const supplier = grn ? supplierById.get(grn.supplierId) : undefined
      return { payment, grn, supplier }
    })
    .sort((a, b) => b.payment.paymentDate.localeCompare(a.payment.paymentDate))
}

export interface ChequeFilterOptions {
  supplierQuery: string
  status: ChequeStatus | "all"
}

export function filterResolvedCheques(
  rows: ResolvedChequePayment[],
  options: ChequeFilterOptions
): ResolvedChequePayment[] {
  const supplierQuery = options.supplierQuery.trim().toLowerCase()

  return rows.filter((row) => {
    if (supplierQuery && !matchesSupplierQuery(row.supplier, supplierQuery)) {
      return false
    }

    if (options.status !== "all" && row.payment.chequeStatus !== options.status) {
      return false
    }

    return true
  })
}

// ---- Summary stats ---------------------------------------------------------------------

export interface OutstandingsSummary {
  totalGrns: number
  totalBilled: number
  totalPaid: number
  balanceDue: number
  pendingCheques: number
}

export function summarizeOutstandings(
  rows: ResolvedGrnOutstanding[],
  payments: GrnPayment[]
): OutstandingsSummary {
  const totalBilled = rows.reduce((sum, row) => sum + row.grn.totalAmount, 0)
  const totalPaid = rows.reduce((sum, row) => sum + row.paidAmount, 0)
  const grnIds = new Set(rows.map((row) => row.grn.id))
  const pendingCheques = payments.filter(
    (payment) =>
      grnIds.has(payment.grnId) &&
      payment.paymentMethod === "cheque" &&
      payment.chequeStatus === "pending"
  ).length

  return {
    totalGrns: rows.length,
    totalBilled,
    totalPaid,
    balanceDue: totalBilled - totalPaid,
    pendingCheques,
  }
}