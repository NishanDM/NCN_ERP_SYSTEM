import { useState } from "react"
import { Search, Trash2, Plus, Minus, Edit2, ShoppingCart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getUnitPriceAfterDiscount,
  type BillingItem,
} from "./CreateNewInvoiceData"
import { formatAmount } from "../stock/StockItemsData"

interface BillingItemsTableProps {
  items: BillingItem[]
  onRemoveItem: (itemId: string) => void
  onUpdateQuantity: (itemId: string, newQuantity: number) => void
  onEditItem?: (item: BillingItem) => void
}

function BillingItemsTable({
  items,
  onRemoveItem,
  onUpdateQuantity,
  onEditItem,
}: BillingItemsTableProps) {
  const [filterQuery, setFilterQuery] = useState("")

  // Filter items by part number, item name, or category
  const filteredItems = items.filter((item) => {
    const q = filterQuery.toLowerCase().trim()
    if (!q) return true
    return (
      item.itemName.toLowerCase().includes(q) ||
      item.partNumber.toLowerCase().includes(q) ||
      item.categoryName.toLowerCase().includes(q)
    )
  })

  // Calculate totals
  const totalItemsCount = items.length
  const totalQuantitySum = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotalSum = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )
  const grandTotalSum = items.reduce(
    (sum, item) => sum + getUnitPriceAfterDiscount(item) * item.quantity,
    0
  )
  const totalDiscountSum = Math.max(0, subtotalSum - grandTotalSum)

  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <ShoppingCart className="size-4 text-primary" />
            Billing Items Table
          </h3>
          <p className="text-xs text-muted-foreground">
            Review, adjust quantities, and manage items in this invoice
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="rounded-md bg-muted px-2.5 py-1 font-medium">
            Total Lines: <strong className="text-foreground">{totalItemsCount}</strong>
          </span>
          <span className="rounded-md bg-primary/10 px-2.5 py-1 font-medium text-primary">
            Total Qty: <strong className="text-primary">{totalQuantitySum}</strong>
          </span>
        </div>
      </div>

      {/* Toolbar filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter by Part Number, Item Name, or Category..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table container */}
      <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
        {items.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <ShoppingCart className="mx-auto mb-2 size-10 opacity-30" />
            <p className="text-sm font-medium">No items added to billing table yet</p>
            <p className="text-xs text-muted-foreground">
              Select items from the stock table above to add them to this invoice.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-xs">
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead className="w-32">Part Number</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead className="w-28">Category</TableHead>
                <TableHead className="w-28 text-right">Selling Price</TableHead>
                <TableHead className="w-28 text-center">Discount</TableHead>
                <TableHead className="w-32 text-right">Unit Price</TableHead>
                <TableHead className="w-36 text-center">Quantity</TableHead>
                <TableHead className="w-36 text-right">Line Total</TableHead>
                <TableHead className="w-24 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-muted-foreground text-xs">
                    No items matching "{filterQuery}"
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item, index) => {
                  const unitPriceAfterDiscount = getUnitPriceAfterDiscount(item)
                  const lineTotal = unitPriceAfterDiscount * item.quantity

                  return (
                    <TableRow key={item.lineId} className="text-xs">
                      <TableCell className="text-center font-mono text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-mono font-medium">
                        {item.partNumber}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {item.itemName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {item.categoryName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        Rs. {formatAmount(item.price)}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.discountType ? (
                          <Badge variant="secondary" className="text-[10px]">
                            {item.discountType === "percentage"
                              ? `${item.discountAmount}%`
                              : `Rs. ${formatAmount(item.discountAmount)}`}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        Rs. {formatAmount(unitPriceAfterDiscount)}
                      </TableCell>
                      {/* Quantity column with interactive controls */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-xs"
                            onClick={() =>
                              onUpdateQuantity(item.itemId, Math.max(1, item.quantity - 1))
                            }
                            disabled={item.quantity <= 1}
                            title="Decrease Quantity"
                          >
                            <Minus className="size-3" />
                          </Button>
                          <Input
                            type="number"
                            min={1}
                            max={item.availableStock}
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10)
                              if (!isNaN(val) && val >= 1) {
                                onUpdateQuantity(
                                  item.itemId,
                                  Math.min(val, item.availableStock)
                                )
                              }
                            }}
                            className="h-7 w-14 text-center text-xs font-semibold px-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-xs"
                            onClick={() =>
                              onUpdateQuantity(
                                item.itemId,
                                Math.min(item.availableStock, item.quantity + 1)
                              )
                            }
                            disabled={item.quantity >= item.availableStock}
                            title="Increase Quantity"
                          >
                            <Plus className="size-3" />
                          </Button>
                        </div>
                      </TableCell>
                      {/* Line total */}
                      <TableCell className="text-right font-semibold text-primary">
                        Rs. {formatAmount(lineTotal)}
                      </TableCell>
                      {/* Actions */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {onEditItem && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => onEditItem(item)}
                              title="Edit Item Details"
                            >
                              <Edit2 className="size-3.5 text-muted-foreground hover:text-foreground" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => onRemoveItem(item.itemId)}
                            title="Remove Item"
                          >
                            <Trash2 className="size-3.5 text-destructive hover:text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Footer Invoice Summary */}
      {items.length > 0 && (
        <div className="flex flex-col items-end gap-1.5 pt-2 border-t border-border/60 text-xs">
          <div className="flex justify-between w-64 text-muted-foreground">
            <span>Subtotal:</span>
            <span className="font-medium text-foreground">Rs. {formatAmount(subtotalSum)}</span>
          </div>
          {totalDiscountSum > 0 && (
            <div className="flex justify-between w-64 text-destructive">
              <span>Total Discount:</span>
              <span className="font-medium">- Rs. {formatAmount(totalDiscountSum)}</span>
            </div>
          )}
          <div className="flex justify-between w-64 text-sm font-bold border-t border-border/60 pt-1.5 text-primary">
            <span>Grand Total:</span>
            <span>Rs. {formatAmount(grandTotalSum)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default BillingItemsTable
