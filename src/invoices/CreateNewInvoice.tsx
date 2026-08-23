import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  ChevronDown,
  ChevronUp,
  FilePlus2,
  MoreHorizontal,
  Printer,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

//==========    COMPONENTS ===========================

import StockTableForNewInvoice from "./StockTableForNewInvoice"
import SelectedItemPopup from "./SelectedItemPopup"
import BillingItemsTable from "./BillingItemsTable"
import {
  DEFAULT_PAYMENT_METHOD,
  PAYMENT_METHOD_OPTIONS,
  getNextInvoiceNumber,
  getPaymentMethodLabel,
  getTodayInputDate,
  type BillingItem,
  type PaymentMethod,
} from "./CreateNewInvoiceData"
import type { StockItemRecord } from "../stock/StockItemsData"

function CreateNewInvoice() {
  // ---- Invoice meta ------------------------------------------------------------

  const invoiceNumber = useMemo(() => getNextInvoiceNumber(), [])
  const [invoiceDate, setInvoiceDate] = useState(getTodayInputDate())
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    DEFAULT_PAYMENT_METHOD
  )

  const [isTableOpen, setIsTableOpen] = useState(true)

  const [billingItems, setBillingItems] = useState<BillingItem[]>([])
  const [selectionVersion, setSelectionVersion] = useState(0)

  const [popupOpen, setPopupOpen] = useState(false)
  const [popupStockItem, setPopupStockItem] = useState<StockItemRecord | null>(null)



  const billingItemIds = useMemo(
    () => new Set(billingItems.map((item) => item.itemId)),
    [billingItems]
  )

  const existingLineForPopup = useMemo(
    () =>
      popupStockItem
        ? (billingItems.find((line) => line.itemId === popupStockItem.id) ?? null)
        : null,
    [billingItems, popupStockItem]
  )

  // Clicking a row in the stock table opens the "Enter Quantity" 
  const handleRowClicked = (item: StockItemRecord) => {
    setPopupStockItem(item)
    setPopupOpen(true)
  }

  const handlePopupConfirm = (billingItem: BillingItem) => {
    setBillingItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.itemId === billingItem.itemId)
      if (existingIndex === -1) return [...prev, billingItem]
      const next = [...prev]
      next[existingIndex] = billingItem
      return next
    })
  }


  const handleClearItems = () => {
    setBillingItems((prev) => (prev.length === 0 ? prev : []))
    setSelectionVersion((v) => v + 1)
    toast("Selected items cleared", {
      description: "All items were removed from this invoice.",
    })
  }

  // ---- "More" actions ------------------------------------------------------------

  const handleImportItems = () => {
    toast("Import items", { description: "Bulk import is coming soon." })
  }

  const handleSaveAsDraft = () => {
    toast.success("Saved as draft", {
      description: `${invoiceNumber} was saved with ${billingItems.length} item(s).`,
    })
  }

  const handlePrintPreview = () => {
    toast("Print preview", { description: "Print preview is coming soon." })
  }

  const handleResetForm = () => {
    setInvoiceDate(getTodayInputDate())
    setPaymentMethod(DEFAULT_PAYMENT_METHOD)
    setBillingItems([])
    setSelectionVersion((v) => v + 1)
    toast("Form reset", { description: "All fields were reset to their defaults." })
  }

  return (
    <div className="w-full px-6 pb-6 lg:px-8 lg:pt-4 lg:pb-8">
      {/* ---- Header --------------------------------------------------------- */}
      <div className="-mt-4 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <FilePlus2 className="size-5 text-muted-foreground" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">New Invoice</h1>
            <p className="text-sm text-muted-foreground">Create a new sales invoice</p>
          </div>
        </div>
      </div>

      {/* ---- Invoice No. ------------------------------------------------------ */}
      <div className="mb-6 inline-flex flex-col gap-1 rounded-lg border border-border/60 bg-card/50 px-4 py-2.5">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Invoice No.
        </p>
        <p className="font-mono text-base font-semibold text-primary">{invoiceNumber}</p>
      </div>

      {/* ---- Invoice meta form ------------------------------------------------ */}
      <div className="mb-6 rounded-xl border border-border/60 bg-card/50 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="invoice-date">Invoice Date</Label>
            <Input
              id="invoice-date"
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="invoice-payment-method">Payment Method</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) =>
                setPaymentMethod((value as PaymentMethod) ?? DEFAULT_PAYMENT_METHOD)
              }
            >
              <SelectTrigger id="invoice-payment-method" className="w-full min-w-0">
                <SelectValue placeholder="Cash">
                  {(value: string | null) => getPaymentMethodLabel(value)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHOD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ---- Item picker toolbar + collapsible table -------------------------- */}
      <Collapsible open={isTableOpen} onOpenChange={setIsTableOpen}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Button type="button" onClick={() => setIsTableOpen((prev) => !prev)}>
            {isTableOpen ? <ChevronUp /> : <ChevronDown />}
            {isTableOpen ? "Hide Item Table" : "Show Item Table"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={(triggerProps) => (
                <Button type="button" variant="secondary" {...triggerProps}>
                  <MoreHorizontal />
                  More
                </Button>
              )}
            />
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={handleImportItems}>
                <Upload className="mr-2 size-4" />
                Import Items
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSaveAsDraft}>
                <Save className="mr-2 size-4" />
                Save as Draft
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrintPreview}>
                <Printer className="mr-2 size-4" />
                Print Preview
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleResetForm}>
                <RotateCcw className="mr-2 size-4" />
                Reset Form
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            type="button"
            variant="outline"
            disabled={billingItems.length === 0}
            onClick={handleClearItems}
          >
            <Trash2 />
            Clear Items
            {billingItems.length > 0 && (
              <span className="ml-0.5 rounded-full bg-muted px-1.5 text-xs text-muted-foreground">
                {billingItems.length}
              </span>
            )}
          </Button>
        </div>

        <CollapsibleContent>
          <StockTableForNewInvoice
            key={selectionVersion}
            selectedItemIds={billingItemIds}
            onToggleItem={handleRowClicked}
          />
        </CollapsibleContent>
      </Collapsible>

      {/* ---- Billing items table ------------------------------------- */}
      <div className="mt-6">
        <BillingItemsTable/>
      </div>

      {/* ---- Quantity / discount popup  ------------------------------- */}
      <SelectedItemPopup
        open={popupOpen}
        onOpenChange={setPopupOpen}
        item={popupStockItem}
        existingItem={existingLineForPopup}
        onConfirm={handlePopupConfirm}
      />
    </div>
  )
}

export default CreateNewInvoice