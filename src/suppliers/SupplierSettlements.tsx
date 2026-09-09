import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Banknote, Check, ChevronsUpDown } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { cn } from "@/lib/utils"

//==========    COMPONENTS ===========================

import { INITIAL_SUPPLIERS, type SupplierRecord } from "./ViewAllSuppliersData"
import {
  allocateFifoPayment,
  formatCurrency,
  formatDisplayDate,
  getOutstandingGrnsForSupplier,
  getOutstandingTotalForSupplier,
  getTodayIso,
  INITIAL_SETTLEMENTS,
  PAYMENT_METHOD_OPTIONS,
  type GrnAllocation,
  type PaymentMethod,
  type SettlementRecord,
} from "./SupplierSettlementsData"

function SupplierSettlements() {
  // ---- Reference data  ---------------------------------
  const suppliers: SupplierRecord[] = INITIAL_SUPPLIERS

  const [, setSettlements] =
    useState<SettlementRecord[]>(INITIAL_SETTLEMENTS)

  // ---- Form state -------------------------------------------------------------------

  const [supplierPopoverOpen, setSupplierPopoverOpen] = useState(false)
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(
    null
  )
  const [paymentDate, setPaymentDate] = useState(getTodayIso())
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
  const [amountPaid, setAmountPaid] = useState("")
  const [remark, setRemark] = useState("")
  const [recordedBy, setRecordedBy] = useState("")

  // Cheque-only fields
  const [chequeNo, setChequeNo] = useState("")
  const [chequeDate, setChequeDate] = useState("")
  const [chequeFromBank, setChequeFromBank] = useState("")
  const [chequeToBank, setChequeToBank] = useState("")
  const [chequeBranch, setChequeBranch] = useState("")

  // Bank transfer-only fields
  const [transferReferenceNo, setTransferReferenceNo] = useState("")
  const [transferFromBank, setTransferFromBank] = useState("")
  const [transferToBank, setTransferToBank] = useState("")
  const [transferDate, setTransferDate] = useState("")

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.id === selectedSupplierId) ?? null,
    [suppliers, selectedSupplierId]
  )

  const selectedSupplierOutstanding = useMemo(
    () =>
      selectedSupplierId ? getOutstandingTotalForSupplier(selectedSupplierId) : 0,
    [selectedSupplierId]
  )

  const resetForm = () => {
    setSelectedSupplierId(null)
    setPaymentMethod("cash")
    setAmountPaid("")
    setPaymentDate(getTodayIso())
    setRemark("")
    setRecordedBy("")
    setChequeNo("")
    setChequeDate("")
    setChequeFromBank("")
    setChequeToBank("")
    setChequeBranch("")
    setTransferReferenceNo("")
    setTransferFromBank("")
    setTransferToBank("")
    setTransferDate("")
  }

  // ---- FIFO preview -----------------------------------------------------------------

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewAllocations, setPreviewAllocations] = useState<GrnAllocation[]
  >([])
  const [previewUnallocated, setPreviewUnallocated] = useState(0)

  const handlePreview = () => {
    if (!selectedSupplier) {
      toast.error("Select a supplier", {
        description: "Choose which supplier this payment is for.",
      })
      return
    }

    const amount = Number(amountPaid)
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount", {
        description: "Total amount paid must be greater than 0.",
      })
      return
    }

    if (!paymentDate) {
      toast.error("Payment date is required", {
        description: "Select the date this payment was made.",
      })
      return
    }

    if (paymentMethod === "cheque" && (!chequeNo.trim() || !chequeDate)) {
      toast.error("Cheque details incomplete", {
        description: "Enter the cheque number and cheque date.",
      })
      return
    }

    if (
      paymentMethod === "bank_transfer" &&
      (!transferReferenceNo.trim() || !transferDate)
    ) {
      toast.error("Transfer details incomplete", {
        description: "Enter the reference number and transfer date.",
      })
      return
    }

    if (!recordedBy.trim()) {
      toast.error("Recorded by is required", {
        description: "Enter the name of the staff member recording this payment.",
      })
      return
    }

    const outstandingGrns = getOutstandingGrnsForSupplier(selectedSupplier.id)
    if (outstandingGrns.length === 0) {
      toast.error("No outstanding GRNs", {
        description: `${selectedSupplier.supplierName} has no outstanding GRNs in this demo dataset.`,
      })
      return
    }

    const { allocations, unallocatedAmount } = allocateFifoPayment(
      outstandingGrns,
      amount
    )
    setPreviewAllocations(allocations)
    setPreviewUnallocated(unallocatedAmount)
    setPreviewOpen(true)
  }

  const handleConfirmSettlement = () => {
    if (!selectedSupplier) return
    const amount = Number(amountPaid)

    const newSettlement: SettlementRecord = {
      id: crypto.randomUUID(),
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.supplierName,
      paymentMethod,
      amountPaid: amount,
      paymentDate,
      remark: remark.trim(),
      recordedBy: recordedBy.trim(),
      grnsSettled: previewAllocations.length,
    }

    setSettlements((prev) => [newSettlement, ...prev])
    toast.success("Settlement recorded", {
      description: `${formatCurrency(amount)} allocated across ${previewAllocations.length} GRN(s) for ${selectedSupplier.supplierName}.`,
    })

    setPreviewOpen(false)
    resetForm()
  }

  return (
    <div className="w-full px-6 pb-6 lg:px-8 lg:pt-4 lg:pb-8">
      {/* ---- Header --------------------------------------------------------- */}
      <div className="-mt-4 mb-6 flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
          <Banknote className="size-5 text-muted-foreground" />
        </span>
        <div>
          <h1 className="text-xl font-semibold">Supplier Settlements</h1>
          <p className="text-sm text-muted-foreground">
            Pay one amount to a supplier and auto-settle their oldest
            outstanding GRNs first (FIFO).
          </p>
        </div>
      </div>

      {/* ---- Settlement form -------------------------------------------------- */}
      <div className="rounded-lg border border-border/60 bg-card/50 p-6">
        <FieldGroup>
          {/* ---- Supplier ------------------------------------------------------ */}
          <Field>
            <FieldLabel htmlFor="settlement-supplier">Supplier</FieldLabel>
            <Popover
              open={supplierPopoverOpen}
              onOpenChange={setSupplierPopoverOpen}
            >
              <PopoverTrigger
                render={(triggerProps) => (
                  <Button
                    id="settlement-supplier"
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={supplierPopoverOpen}
                    className="w-full justify-between font-normal"
                    {...triggerProps}
                  >
                    {selectedSupplier ? (
                      <span className="truncate">
                        {selectedSupplier.supplierName}{" "}
                        <span className="text-muted-foreground">
                          ({selectedSupplier.supplierCode})
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Search supplier name or code...
                      </span>
                    )}
                    <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                  </Button>
                )}
              />
              <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                align="start"
              >
                <Command>
                  <CommandInput placeholder="Search supplier name or code..." />
                  <CommandList>
                    <CommandEmpty>No supplier found.</CommandEmpty>
                    <CommandGroup>
                      {suppliers.map((s) => (
                        <CommandItem
                          key={s.id}
                          value={`${s.supplierName} ${s.supplierCode}`}
                          onSelect={() => {
                            setSelectedSupplierId(s.id)
                            setSupplierPopoverOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 size-4",
                              selectedSupplierId === s.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{s.supplierName}</span>
                            <span className="text-xs text-muted-foreground">
                              {s.supplierCode}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedSupplier && (
              <FieldDescription>
                Outstanding balance:{" "}
                <span className="font-medium text-foreground">
                  {formatCurrency(selectedSupplierOutstanding)}
                </span>
              </FieldDescription>
            )}
          </Field>

          {/* ---- Payment method -------------------------------------------------- */}
          <Field>
            <FieldLabel htmlFor="settlement-method">Payment Method</FieldLabel>
            <ToggleGroup
              id="settlement-method"
              value={[paymentMethod]}
              onValueChange={(value: string[]) => {
                const next = value.find((v) => v !== paymentMethod) ?? value[0]
                if (next) setPaymentMethod(next as PaymentMethod)
              }}
              className="w-full"
            >
              {PAYMENT_METHOD_OPTIONS.map((opt) => (
                <ToggleGroupItem
                  key={opt.value}
                  value={opt.value}
                  className="flex-1"
                >
                  {opt.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>

          {/* ---- Amount + date ----------------------------------------------------- */}
          <FieldGroup className="sm:flex-row sm:*:flex-1">
            <Field>
              <FieldLabel htmlFor="settlement-amount">
                Total Amount Paid (Rs.)
              </FieldLabel>
              <Input
                id="settlement-amount"
                type="number"
                min={0}
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="0.00"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="settlement-payment-date">
                Payment Date
              </FieldLabel>
              <Input
                id="settlement-payment-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </Field>
          </FieldGroup>

          {/* ---- Cheque details  ---------------------- */}
          {paymentMethod === "cheque" && (
            <div className="rounded-md border border-border/60 p-4">
              <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Cheque Details
              </p>
              <FieldGroup>
                <FieldGroup className="sm:flex-row sm:*:flex-1">
                  <Field>
                    <FieldLabel htmlFor="cheque-no">Cheque No.</FieldLabel>
                    <Input
                      id="cheque-no"
                      value={chequeNo}
                      onChange={(e) => setChequeNo(e.target.value)}
                      placeholder="e.g. 004521"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="cheque-date">Cheque Date</FieldLabel>
                    <Input
                      id="cheque-date"
                      type="date"
                      value={chequeDate}
                      onChange={(e) => setChequeDate(e.target.value)}
                    />
                  </Field>
                </FieldGroup>

                <FieldGroup className="sm:flex-row sm:*:flex-1">
                  <Field>
                    <FieldLabel htmlFor="cheque-from-bank">
                      From Bank
                    </FieldLabel>
                    <Input
                      id="cheque-from-bank"
                      value={chequeFromBank}
                      onChange={(e) => setChequeFromBank(e.target.value)}
                      placeholder="e.g. Commercial Bank"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="cheque-to-bank">To Bank</FieldLabel>
                    <Input
                      id="cheque-to-bank"
                      value={chequeToBank}
                      onChange={(e) => setChequeToBank(e.target.value)}
                      placeholder="e.g. Sampath Bank"
                    />
                  </Field>
                </FieldGroup>

                <Field>
                  <FieldLabel htmlFor="cheque-branch">Branch</FieldLabel>
                  <Input
                    id="cheque-branch"
                    value={chequeBranch}
                    onChange={(e) => setChequeBranch(e.target.value)}
                    placeholder="e.g. Homagama"
                  />
                </Field>
              </FieldGroup>
            </div>
          )}

          {/* ---- Transfer details ------------- */}
          {paymentMethod === "bank_transfer" && (
            <div className="rounded-md border border-border/60 p-4">
              <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Transfer Details
              </p>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="transfer-reference-no">
                    Reference No.
                  </FieldLabel>
                  <Input
                    id="transfer-reference-no"
                    value={transferReferenceNo}
                    onChange={(e) => setTransferReferenceNo(e.target.value)}
                    placeholder="e.g. TXN-88213"
                  />
                </Field>

                <FieldGroup className="sm:flex-row sm:*:flex-1">
                  <Field>
                    <FieldLabel htmlFor="transfer-from-bank">
                      From Bank
                    </FieldLabel>
                    <Input
                      id="transfer-from-bank"
                      value={transferFromBank}
                      onChange={(e) => setTransferFromBank(e.target.value)}
                      placeholder="e.g. HNB"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="transfer-to-bank">
                      To Bank
                    </FieldLabel>
                    <Input
                      id="transfer-to-bank"
                      value={transferToBank}
                      onChange={(e) => setTransferToBank(e.target.value)}
                      placeholder="e.g. BOC"
                    />
                  </Field>
                </FieldGroup>

                <Field>
                  <FieldLabel htmlFor="transfer-date">
                    Transfer Date
                  </FieldLabel>
                  <Input
                    id="transfer-date"
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                  />
                </Field>
              </FieldGroup>
            </div>
          )}

          {/* ---- Remark + recorded by ------------------------------------------------ */}
          <FieldGroup className="sm:flex-row sm:*:flex-1">
            <Field>
              <FieldLabel htmlFor="settlement-remark">Remark</FieldLabel>
              <Textarea
                id="settlement-remark"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Optional note..."
                rows={2}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="settlement-recorded-by">
                Recorded By
              </FieldLabel>
              <Input
                id="settlement-recorded-by"
                value={recordedBy}
                onChange={(e) => setRecordedBy(e.target.value)}
                placeholder="Staff name"
              />
            </Field>
          </FieldGroup>

          <Button type="button" className="w-full" onClick={handlePreview}>
            Preview FIFO Allocation
          </Button>
        </FieldGroup>
      </div>

      {/* ---- FIFO allocation preview dialog -------------------------------------- */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>FIFO Allocation Preview</DialogTitle>
            <DialogDescription>
              {selectedSupplier &&
                `${formatCurrency(Number(amountPaid))} for ${selectedSupplier.supplierName}, applied to the oldest outstanding GRNs first.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {previewAllocations.map((allocation) => (
              <div
                key={allocation.grnId}
                className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2.5 text-sm"
              >
                <div>
                  <p className="font-medium">{allocation.grnNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDisplayDate(allocation.grnDate)} · Outstanding{" "}
                    {formatCurrency(allocation.outstandingAmount)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">
                    {formatCurrency(allocation.amountApplied)}
                  </p>
                  <Badge
                    variant={
                      allocation.remainingAfter === 0
                        ? "secondary"
                        : "outline"
                    }
                    className="mt-1 font-normal"
                  >
                    {allocation.remainingAfter === 0
                      ? "Fully settled"
                      : `${formatCurrency(allocation.remainingAfter)} left`}
                  </Badge>
                </div>
              </div>
            ))}

            {previewUnallocated > 0 && (
              <div className="rounded-md border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground">
                {formatCurrency(previewUnallocated)} exceeds all outstanding
                GRNs for this supplier and will be recorded as an advance.
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="button" onClick={handleConfirmSettlement}>
              Confirm & Record Settlement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SupplierSettlements