import { type PaymentMethod } from "./SupplierSettlementsData"

// ---- Cheque status ------------------------------------------------------------------

export type ChequeStatus =
  | "pending"
  | "cleared"
  | "returned"
  | "bounced"
  | "cancelled"

export const CHEQUE_STATUS_OPTIONS: {
  value: ChequeStatus
  label: string
}[] = [
  { value: "pending", label: "Pending" },
  { value: "cleared", label: "Cleared" },
  { value: "returned", label: "Returned" },
  { value: "bounced", label: "Bounced" },
  { value: "cancelled", label: "Cancelled" },
]

export const getChequeStatusLabel = (value: ChequeStatus): string =>
  CHEQUE_STATUS_OPTIONS.find((opt) => opt.value === value)?.label ?? value

// ---- Supplier payment record ---------------------------------------------------------

export interface SupplierPayment {
  id: string
  supplierId: string
  paymentMethod: PaymentMethod
  amountPaid: number
  /** ISO date (YYYY-MM-DD). */
  paymentDate: string
  grnNumber: string
  invoiceNumber: string
  /** Cheque payments only. */
  chequeNo?: string
  chequeStatus?: ChequeStatus
  /** Bank transfer payments only. */
  referenceNo?: string
  remark: string
}

// ---- Seed data --------------------------------------------------------------------

export const INITIAL_SUPPLIER_PAYMENTS: SupplierPayment[] = [
  { id: "pay-001", supplierId: "sup-001", paymentMethod: "cash", amountPaid: 45000, paymentDate: "2026-08-05", grnNumber: "GRN-2031", invoiceNumber: "INV-10012", remark: "Settled GRN-2031 in full." },
  { id: "pay-002", supplierId: "sup-002", paymentMethod: "bank_transfer", amountPaid: 120000, paymentDate: "2026-08-04", grnNumber: "GRN-1987", invoiceNumber: "INV-10008", referenceNo: "TXN-88213", remark: "Cleared oldest outstanding GRN." },
  { id: "pay-003", supplierId: "sup-005", paymentMethod: "cheque", amountPaid: 90000, paymentDate: "2026-08-02", grnNumber: "GRN-1955", invoiceNumber: "INV-10005", chequeNo: "004521", chequeStatus: "cleared", remark: "" },
  { id: "pay-004", supplierId: "sup-004", paymentMethod: "cash", amountPaid: 55000, paymentDate: "2026-07-30", grnNumber: "GRN-2077", invoiceNumber: "INV-10021", remark: "Paid in full on delivery day." },
  { id: "pay-005", supplierId: "sup-003", paymentMethod: "bank_transfer", amountPaid: 25000, paymentDate: "2026-07-28", grnNumber: "GRN-2011", invoiceNumber: "INV-10017", referenceNo: "TXN-87990", remark: "" },
  { id: "pay-006", supplierId: "sup-001", paymentMethod: "cheque", amountPaid: 60000, paymentDate: "2026-07-20", grnNumber: "GRN-2065", invoiceNumber: "INV-10014", chequeNo: "004498", chequeStatus: "pending", remark: "Cheque handed over, awaiting clearance." },
  { id: "pay-007", supplierId: "sup-002", paymentMethod: "cash", amountPaid: 80000, paymentDate: "2026-07-15", grnNumber: "GRN-2044", invoiceNumber: "INV-10009", remark: "" },
  { id: "pay-008", supplierId: "sup-005", paymentMethod: "bank_transfer", amountPaid: 70000, paymentDate: "2026-07-10", grnNumber: "GRN-2003", invoiceNumber: "INV-10006", referenceNo: "TXN-87650", remark: "Partial advance ahead of next delivery." },
  { id: "pay-009", supplierId: "sup-008", paymentMethod: "cheque", amountPaid: 100000, paymentDate: "2026-07-05", grnNumber: "GRN-2140", invoiceNumber: "INV-10029", chequeNo: "119872", chequeStatus: "returned", remark: "Cheque returned by bank, follow-up needed." },
  { id: "pay-010", supplierId: "sup-010", paymentMethod: "cheque", amountPaid: 150000, paymentDate: "2026-06-28", grnNumber: "GRN-2155", invoiceNumber: "INV-10033", chequeNo: "119855", chequeStatus: "cleared", remark: "Festive season stock settlement." },
  { id: "pay-011", supplierId: "sup-004", paymentMethod: "bank_transfer", amountPaid: 40000, paymentDate: "2026-06-20", grnNumber: "GRN-2119", invoiceNumber: "INV-10022", referenceNo: "TXN-86410", remark: "" },
  { id: "pay-012", supplierId: "sup-009", paymentMethod: "cash", amountPaid: 62000, paymentDate: "2026-06-12", grnNumber: "GRN-2166", invoiceNumber: "INV-10037", remark: "New supplier's first settlement." },
  { id: "pay-013", supplierId: "sup-006", paymentMethod: "cheque", amountPaid: 32000, paymentDate: "2026-06-08", grnNumber: "GRN-2172", invoiceNumber: "INV-10039", chequeNo: "119801", chequeStatus: "bounced", remark: "Insufficient funds, supplier notified." },
  { id: "pay-014", supplierId: "sup-007", paymentMethod: "bank_transfer", amountPaid: 48000, paymentDate: "2026-06-01", grnNumber: "GRN-2180", invoiceNumber: "INV-10041", referenceNo: "TXN-85990", remark: "" },
  { id: "pay-015", supplierId: "sup-003", paymentMethod: "cheque", amountPaid: 18000, paymentDate: "2026-05-22", grnNumber: "GRN-2188", invoiceNumber: "INV-10044", chequeNo: "119776", chequeStatus: "cancelled", remark: "Cancelled and reissued as bank transfer." },
]

// ---- Filtering --------------------------------------------------------------------

export interface SupplierPaymentFilters {
  searchQuery: string
  supplierIds: string[]
  method: PaymentMethod | "all"
  dateFrom: string
  dateTo: string
  minAmount: string
  maxAmount: string
  chequeStatus: ChequeStatus | "all"
}

export const DEFAULT_SUPPLIER_PAYMENT_FILTERS: SupplierPaymentFilters = {
  searchQuery: "",
  supplierIds: [],
  method: "all",
  dateFrom: "",
  dateTo: "",
  minAmount: "",
  maxAmount: "",
  chequeStatus: "all",
}

export function filterSupplierPayments(
  payments: SupplierPayment[],
  filters: SupplierPaymentFilters
): SupplierPayment[] {
  const query = filters.searchQuery.trim().toLowerCase()

  return payments.filter((payment) => {
    if (
      query &&
      !(
        payment.grnNumber.toLowerCase().includes(query) ||
        payment.invoiceNumber.toLowerCase().includes(query) ||
        payment.chequeNo?.toLowerCase().includes(query) ||
        payment.referenceNo?.toLowerCase().includes(query) ||
        payment.remark.toLowerCase().includes(query)
      )
    ) {
      return false
    }

    if (
      filters.supplierIds.length > 0 &&
      !filters.supplierIds.includes(payment.supplierId)
    ) {
      return false
    }

    if (filters.method !== "all" && payment.paymentMethod !== filters.method) {
      return false
    }

    if (filters.dateFrom && payment.paymentDate < filters.dateFrom) {
      return false
    }

    if (filters.dateTo && payment.paymentDate > filters.dateTo) {
      return false
    }

    if (filters.minAmount) {
      const min = Number(filters.minAmount)
      if (!Number.isNaN(min) && payment.amountPaid < min) return false
    }

    if (filters.maxAmount) {
      const max = Number(filters.maxAmount)
      if (!Number.isNaN(max) && payment.amountPaid > max) return false
    }

    if (
      filters.chequeStatus !== "all" &&
      payment.chequeStatus !== filters.chequeStatus
    ) {
      return false
    }

    return true
  })
}

export function countActiveSupplierPaymentFilters(
  filters: SupplierPaymentFilters
): number {
  let count = 0
  if (filters.supplierIds.length > 0) count += 1
  if (filters.method !== "all") count += 1
  if (filters.dateFrom) count += 1
  if (filters.dateTo) count += 1
  if (filters.minAmount) count += 1
  if (filters.maxAmount) count += 1
  if (filters.chequeStatus !== "all") count += 1
  return count
}