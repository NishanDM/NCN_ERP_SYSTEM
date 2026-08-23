import type { PaymentMethod } from "./CreateNewInvoiceData"

// ---- Status enums ---------------------------------------------------------------

export type PaymentStatus = "pending" | "settled"
export type InvoiceStatus = "draft" | "completed"

export interface InvoiceStatusOption {
  value: PaymentStatus
  label: string
}

export const PAYMENT_STATUS_FILTER_OPTIONS: {
  value: "all" | PaymentStatus
  label: string
}[] = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "settled", label: "Settled" },
]

export type PaymentStatusFilter = (typeof PAYMENT_STATUS_FILTER_OPTIONS)[number]["value"]

export const getPaymentStatusLabel = (value: string | null): string =>
  PAYMENT_STATUS_FILTER_OPTIONS.find((opt) => opt.value === value)?.label ?? "All Status"

// ---- Invoice record ---------------------------------------------------------------

export interface InvoiceRecord {
  id: string
  invoiceNumber: string
  date: string
  customerName: string
  paymentMethod: PaymentMethod
  netTotal: number
  internalNotes: string | null
  notes: string | null
  paymentStatus: PaymentStatus
  invoiceStatus: InvoiceStatus
  profit: number
}

// ---- Mock data --------------------------------------------------------------------

export const MOCK_INVOICE_CUSTOMERS: string[] = [
  "Kandy Auto Traders",
  "Perera Hardware (Pvt) Ltd",
  "Galle Road Motors",
  "Nimal Engineering Works",
  "Silva Spare Parts",
  "Colombo Bike Point",
  "Fernando & Sons",
]

const INVOICE_NUMBER_PREFIX = "INV-SE"
const TOTAL_MOCK_INVOICES = 58
const SETTLED_MOCK_COUNT = 7

const PAYMENT_METHOD_CYCLE: PaymentMethod[] = ["credit", "credit", "cash", "credit"]

interface MockNoteOverride {
  internalNotes?: string
  notes?: string
}

const MOCK_NOTES_BY_INDEX: Record<number, MockNoteOverride> = {
  0: {
    internalNotes: "Customer requested delivery before end of month.",
  },
  1: {
    notes: "Please call before delivery - gate code changes weekly.",
  },
  2: {
    internalNotes: "Price matched against competitor quote, approved by manager.",
    notes: "Partial payment expected next visit.",
  },
}

function buildInvoiceNumber(sequence: number): string {
  return `${INVOICE_NUMBER_PREFIX}${String(sequence).padStart(5, "0")}`
}

function generateMockInvoices(count: number): InvoiceRecord[] {
  const invoices: InvoiceRecord[] = []

  for (let i = 0; i < count; i++) {
    const sequence = count - i 
    const customerName = MOCK_INVOICE_CUSTOMERS[i % MOCK_INVOICE_CUSTOMERS.length]
    const paymentMethod = PAYMENT_METHOD_CYCLE[i % PAYMENT_METHOD_CYCLE.length]
    const isSettled = i < SETTLED_MOCK_COUNT
    const isDraft = !isSettled && i % 9 === 0

    const netTotal = 1200 + ((i * 3671) % 174000)
    const profit = Math.round(netTotal * (0.05 + ((i * 7) % 15) / 100))

    const day = 1 + ((sequence - 1) % 27)
    const month = 7 + Math.floor((sequence - 1) / 27) // rolls from July into September
    const date = `2026-${String(Math.min(month, 12)).padStart(2, "0")}-${String(day).padStart(2, "0")}`

    const overrides = MOCK_NOTES_BY_INDEX[i]

    invoices.push({
      id: buildInvoiceNumber(sequence),
      invoiceNumber: buildInvoiceNumber(sequence),
      date,
      customerName,
      paymentMethod,
      netTotal,
      internalNotes: overrides?.internalNotes ?? null,
      notes: overrides?.notes ?? null,
      paymentStatus: isSettled ? "settled" : "pending",
      invoiceStatus: isDraft ? "draft" : "completed",
      profit,
    })
  }

  return invoices
}

export const INITIAL_INVOICES: InvoiceRecord[] = generateMockInvoices(TOTAL_MOCK_INVOICES)
