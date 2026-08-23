
// ---- Payment method ---------------------------------------------------------

export type PaymentMethod = "cash" | "card" | "bank_transfer" | "cheque" | "credit"

export interface PaymentMethodOption {
  value: PaymentMethod
  label: string
}

export const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "credit", label: "Credit" },
]

export const DEFAULT_PAYMENT_METHOD: PaymentMethod = "cash"

export const getPaymentMethodLabel = (value: string | null): string =>
  PAYMENT_METHOD_OPTIONS.find((opt) => opt.value === value)?.label ?? "Cash"

// ---- Invoice numbering & dates ----------------------------------------------

const INVOICE_NUMBER_PREFIX = "INV-SE"

const MOCK_INVOICE_SEQUENCE = 59

export function getNextInvoiceNumber(): string {
  return `${INVOICE_NUMBER_PREFIX}${String(MOCK_INVOICE_SEQUENCE).padStart(5, "0")}`
}

export function getTodayInputDate(): string {
  return new Date().toISOString().slice(0, 10)
}

// ---- Discount types -----------------------------------------------------------

export type DiscountType = "percentage" | "manual"

export interface DiscountTypeOption {
  value: DiscountType
  label: string
}

export const DISCOUNT_TYPE_OPTIONS: DiscountTypeOption[] = [
  { value: "percentage", label: "Percentage (%)" },
  { value: "manual", label: "Manual (Rs.)" },
]

// ---- Billing line item ----------------------------------------------------------

export interface BillingItem {
  /** Stable React key + lookup key. Same as itemId unless an item is added twice. */
  lineId: string
  itemId: string
  partNumber: string
  itemName: string
  categoryName: string
  availableStock: number
  costPrice: number
  /** "S.U.P" in the table — the default selling price snapshotted when added. */
  standardUnitPrice: number
  /** Editable "New Selling Price" set in the popup at add-time. */
  price: number
  quantity: number
  discountType: DiscountType | null
  discountAmount: number
}

export interface CreateBillingItemInput {
  quantity: number
  price: number
  discountType: DiscountType | null
  discountAmount: number
}

/** Minimal shape BillingItem needs from a StockItemRecord — keeps this file decoupled from the stock module's full type. */
export interface BillableStockItem {
  id: string
  itemCode: string
  itemName: string
  categoryName: string
  quantity: number
  costPrice: number
  sellingPrice: number
}

export function createBillingItem(
  stockItem: BillableStockItem,
  input: CreateBillingItemInput
): BillingItem {
  return {
    lineId: stockItem.id,
    itemId: stockItem.id,
    partNumber: stockItem.itemCode,
    itemName: stockItem.itemName,
    categoryName: stockItem.categoryName,
    availableStock: stockItem.quantity,
    costPrice: stockItem.costPrice,
    standardUnitPrice: stockItem.sellingPrice,
    price: input.price,
    quantity: input.quantity,
    discountType: input.discountType,
    discountAmount: input.discountAmount,
  }
}

// ---- Per-line calculations --------------------------------------------------

export function getUnitPriceAfterDiscount(item: BillingItem): number {
  if (!item.discountType || item.discountAmount <= 0) return item.price

  const discount =
    item.discountType === "percentage"
      ? (item.price * item.discountAmount) / 100
      : item.discountAmount

  return Math.max(0, item.price - discount)
}

