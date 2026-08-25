import { useState, useEffect } from "react"
import { AlertTriangle, Trash2, XIcon } from "lucide-react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { InvoiceRecord } from "./AllInvoicesData"

interface DeleteInvoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: InvoiceRecord | null
  onConfirmDelete: (invoiceId: string) => void
}

function DeleteInvoiceModal({
  open,
  onOpenChange,
  invoice,
  onConfirmDelete,
}: DeleteInvoiceModalProps) {
  const [confirmInput, setConfirmInput] = useState("")

  // Reset confirmation input whenever modal opens or invoice changes
  useEffect(() => {
    if (open) {
      setConfirmInput("")
    }
  }, [open, invoice])

  if (!invoice) return null

  const isConfirmed = confirmInput.trim() === invoice.invoiceNumber

  const handleDelete = () => {
    if (!isConfirmed) return
    onConfirmDelete(invoice.id)
    toast.success("Invoice deleted successfully", {
      description: `${invoice.invoiceNumber} for ${invoice.customerName} has been deleted.`,
    })
    onOpenChange(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isConfirmed) {
      handleDelete()
    }
  }

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
            "gap-4 overflow-hidden rounded-xl bg-popover p-6 text-sm text-popover-foreground",
            "shadow-2xl ring-1 ring-foreground/10 outline-none sm:max-w-md",
            "duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
          )}
        >
          {/* Header with warning icon */}
          <div className="flex items-start gap-3 pr-6">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" />
            </span>
            <div className="space-y-1">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Delete Invoice Confirmation
              </h2>
              <p className="text-xs text-muted-foreground">
                This action is permanent and cannot be undone.
              </p>
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

          {/* Deletion Warning Box */}
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs space-y-1">
            <p className="font-medium text-destructive">Warning</p>
            <p className="text-muted-foreground">
              You are about to delete invoice <strong className="text-foreground font-mono">{invoice.invoiceNumber}</strong> issued for <strong className="text-foreground">{invoice.customerName}</strong>.
            </p>
          </div>

          {/* Invoice Number Verification Input */}
          <div className="space-y-2">
            <Label htmlFor="delete-confirm-input" className="text-xs">
              To confirm deletion, type <strong className="font-mono text-foreground">{invoice.invoiceNumber}</strong> below:
            </Label>
            <Input
              id="delete-confirm-input"
              type="text"
              placeholder={`Type ${invoice.invoiceNumber} here`}
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="font-mono text-sm"
            />
          </div>

          {/* Footer Actions */}
          <div className="-mx-6 -mb-6 flex items-center justify-end gap-2 rounded-b-xl border-t bg-muted/50 p-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!isConfirmed}
              className="gap-1.5"
            >
              <Trash2 className="size-4" />
              Delete Invoice
            </Button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export default DeleteInvoiceModal
