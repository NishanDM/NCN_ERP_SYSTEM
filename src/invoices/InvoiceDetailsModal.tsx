import { useMemo } from "react"
import { XIcon, FileText, User, Calendar, CreditCard, TrendingUp, DollarSign, Package } from "lucide-react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  getInvoiceDetailItems,
  type InvoiceRecord,
} from "./AllInvoicesData"
import { getPaymentMethodLabel } from "./CreateNewInvoiceData"
import { formatAmount } from "../stock/StockItemsData"

interface InvoiceDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: InvoiceRecord | null
}

function InvoiceDetailsModal({
  open,
  onOpenChange,
  invoice,
}: InvoiceDetailsModalProps) {
  if (!invoice) return null

  // Generate 10 line items for this invoice
  const items = useMemo(() => getInvoiceDetailItems(invoice), [invoice])

  // Calculate totals from items
  const totalQtySold = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalRevenue = items.reduce((sum, item) => sum + item.totalSellingPrice, 0)
  const totalCost = items.reduce((sum, item) => sum + item.unitCostPrice * item.quantity, 0)
  const totalProfit = totalRevenue - totalCost

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Backdrop overlay with blur effect */}
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        />

        <DialogPrimitive.Popup
          className={cn(
            "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2",
            "max-h-[90vh] gap-4 overflow-hidden rounded-xl bg-popover p-6 text-sm text-popover-foreground",
            "shadow-2xl ring-1 ring-foreground/10 outline-none sm:max-w-3xl",
            "duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-border/60 pb-4 pr-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText className="size-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading text-lg font-bold tracking-tight text-foreground">
                    Invoice {invoice.invoiceNumber}
                  </h2>
                  <Badge variant="outline" className="font-mono text-xs uppercase">
                    {invoice.invoiceStatus}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Complete breakdown of items, quantities sold, prices, and profit
                </p>
              </div>
            </div>
          </div>

          {/* Close button */}
          <DialogPrimitive.Close
            render={
              <Button variant="ghost" size="icon-sm" className="absolute top-4 right-4" />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          {/* Meta Info Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <div className="rounded-lg border border-border/60 bg-card p-2.5">
              <span className="text-muted-foreground flex items-center gap-1 mb-1">
                <User className="size-3" /> Customer
              </span>
              <p className="font-semibold text-foreground truncate" title={invoice.customerName}>
                {invoice.customerName}
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-card p-2.5">
              <span className="text-muted-foreground flex items-center gap-1 mb-1">
                <Calendar className="size-3" /> Date
              </span>
              <p className="font-semibold text-foreground">{invoice.date}</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-card p-2.5">
              <span className="text-muted-foreground flex items-center gap-1 mb-1">
                <CreditCard className="size-3" /> Payment Method
              </span>
              <p className="font-semibold text-foreground">
                {getPaymentMethodLabel(invoice.paymentMethod)}
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-card p-2.5">
              <span className="text-muted-foreground flex items-center gap-1 mb-1">
                <Package className="size-3" /> Payment Status
              </span>
              <Badge
                variant={invoice.paymentStatus === "settled" ? "secondary" : "outline"}
                className={cn(
                  "text-[10px] capitalize",
                  invoice.paymentStatus === "settled"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                )}
              >
                {invoice.paymentStatus}
              </Badge>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-center">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <DollarSign className="size-3.5 text-foreground" /> Total Revenue
              </p>
              <p className="mt-1 text-base font-bold text-foreground">
                Rs. {formatAmount(totalRevenue)}
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-center">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Package className="size-3.5 text-muted-foreground" /> Total Cost
              </p>
              <p className="mt-1 text-base font-semibold text-muted-foreground">
                Rs. {formatAmount(totalCost)}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                <TrendingUp className="size-3.5 text-emerald-600" /> Total Profit
              </p>
              <p className="mt-1 text-base font-bold text-emerald-600 dark:text-emerald-400">
                + Rs. {formatAmount(totalProfit)}
              </p>
            </div>
          </div>

          {/* Scrollable Item Table */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs text-muted-foreground font-medium px-1">
              <span>Invoice Items List ({items.length} items)</span>
              <span>Total Qty Sold: <strong className="text-foreground">{totalQtySold} units</strong></span>
            </div>
            <div className="max-h-[280px] overflow-y-auto rounded-lg border border-border/60 bg-card [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 text-xs">
                    <TableHead className="w-10 text-center">#</TableHead>
                    <TableHead className="w-28">Part Code</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead className="w-24 text-center">Qty Sold</TableHead>
                    <TableHead className="w-28 text-right">Unit Price</TableHead>
                    <TableHead className="w-28 text-right">Selling Total</TableHead>
                    <TableHead className="w-28 text-right">Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={item.id} className="text-xs">
                      <TableCell className="text-center font-mono text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-mono font-medium">
                        {item.partNumber}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {item.itemName}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-primary">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        Rs. {formatAmount(item.unitSellingPrice)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-foreground">
                        Rs. {formatAmount(item.totalSellingPrice)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">
                        + Rs. {formatAmount(item.totalProfit)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Footer */}
          <div className="-mx-6 -mb-6 flex items-center justify-end gap-2 rounded-b-xl border-t bg-muted/50 p-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export default InvoiceDetailsModal
