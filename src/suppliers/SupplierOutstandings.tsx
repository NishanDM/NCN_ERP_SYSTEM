import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  ChevronDown,
  RefreshCw,
  Search,
  Wallet2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

//==========    COMPONENTS ===========================

import { INITIAL_SUPPLIERS } from "./ViewAllSuppliersData"
import {
  formatCurrency,
  formatDisplayDate,
  getPaymentMethodLabel,
  PAYMENT_METHOD_OPTIONS,
  type PaymentMethod,
} from "./SupplierSettlementsData"
import {
  CHEQUE_STATUS_OPTIONS,
  getChequeStatusLabel,
  type ChequeStatus,
} from "./SupplierPaymentsData"
import {
  filterResolvedCheques,
  filterResolvedGrns,
  getGrnStatusLabel,
  GRN_STATUS_OPTIONS,
  INITIAL_GRN_OUTSTANDINGS,
  INITIAL_GRN_PAYMENTS,
  resolveChequePayments,
  resolveGrnOutstandings,
  summarizeOutstandings,
  TODAY_ISO,
  type GrnOutstandingStatus,
  type GrnPayment,
  type ResolvedGrnOutstanding,
} from "./SupplierOutstandingsData"

const GRN_STATUS_FILTER_OPTIONS: { value: GrnOutstandingStatus | "all"; label: string }[] =
  [{ value: "all", label: "All" }, ...GRN_STATUS_OPTIONS]

const CHEQUE_STATUS_FILTER_OPTIONS: { value: ChequeStatus | "all"; label: string }[] =
  [{ value: "all", label: "All" }, ...CHEQUE_STATUS_OPTIONS]

const GRN_STATUS_BADGE_VARIANT: Record<
  GrnOutstandingStatus,
  "outline" | "secondary" | "destructive"
> = {
  pending: "outline",
  partial: "secondary",
  paid: "secondary",
  overdue: "destructive",
}

const CHEQUE_STATUS_BADGE_VARIANT: Record<
  ChequeStatus,
  "outline" | "secondary" | "destructive"
> = {
  pending: "outline",
  cleared: "secondary",
  returned: "destructive",
  bounced: "destructive",
  cancelled: "outline",
}

function TruncatedWithTooltip({
  value,
  className,
}: {
  value: string | undefined
  className?: string
}) {
  if (!value) return <span className="text-muted-foreground">—</span>

  return (
    <Tooltip>
      <TooltipTrigger
        render={(triggerProps) => (
          <span
            {...triggerProps}
            className={cn("block truncate", className)}
          >
            {value}
          </span>
        )}
      />
      <TooltipContent>{value}</TooltipContent>
    </Tooltip>
  )
}

function SupplierOutstandings() {
  // ---- Reference data  ---------------------------------
  const suppliers = INITIAL_SUPPLIERS
  const grns = INITIAL_GRN_OUTSTANDINGS

  const [payments, setPayments] = useState<GrnPayment[]>(INITIAL_GRN_PAYMENTS)

  const resolvedGrns = useMemo(
    () => resolveGrnOutstandings(grns, payments, suppliers, TODAY_ISO),
    [grns, payments, suppliers]
  )

  // ---- Top-level supplier filter -----------------------

  const [supplierQuery, setSupplierQuery] = useState("")

  const scopedGrns = useMemo(() => {
    if (!supplierQuery.trim()) return resolvedGrns
    const query = supplierQuery.trim().toLowerCase()
    return resolvedGrns.filter(
      (row) =>
        row.supplier?.supplierName.toLowerCase().includes(query) ||
        row.supplier?.supplierCode.toLowerCase().includes(query)
    )
  }, [resolvedGrns, supplierQuery])

  const summary = useMemo(
    () => summarizeOutstandings(scopedGrns, payments),
    [scopedGrns, payments]
  )

  // ---- GRN Outstandings tab ---------------------------------------------------------

  const [grnSearch, setGrnSearch] = useState("")
  const [grnStatusFilter, setGrnStatusFilter] = useState<GrnOutstandingStatus | "all">(
    "all"
  )
  const [expandedGrnIds, setExpandedGrnIds] = useState<Set<string>>(new Set())

  const filteredGrns = useMemo(
    () =>
      filterResolvedGrns(scopedGrns, {
        supplierQuery: "",
        search: grnSearch,
        status: grnStatusFilter,
      }),
    [scopedGrns, grnSearch, grnStatusFilter]
  )

  const toggleExpandGrn = (grnId: string) => {
    setExpandedGrnIds((prev) => {
      const next = new Set(prev)
      if (next.has(grnId)) {
        next.delete(grnId)
      } else {
        next.add(grnId)
      }
      return next
    })
  }

  // ---- Cheque Tracker tab -----------------------------------------------------------

  const [chequeStatusFilter, setChequeStatusFilter] = useState<ChequeStatus | "all">(
    "all"
  )

  const resolvedCheques = useMemo(
    () => resolveChequePayments(payments, grns, suppliers),
    [payments, grns, suppliers]
  )

  const filteredCheques = useMemo(
    () =>
      filterResolvedCheques(resolvedCheques, {
        supplierQuery,
        status: chequeStatusFilter,
      }),
    [resolvedCheques, supplierQuery, chequeStatusFilter]
  )

  // ---- Sync from GRNs (frontend-only demo action) -----------------------------------

  const handleSyncFromGrns = () => {
    toast("Synced from GRNs", {
      description: "Outstanding balances are up to date.",
    })
  }

  // ---- Record Payment dialog ---------------------------------------------------------

  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [payingGrnId, setPayingGrnId] = useState<string | null>(null)
  const [payMethod, setPayMethod] = useState<PaymentMethod>("cash")
  const [payAmount, setPayAmount] = useState("")
  const [payDate, setPayDate] = useState(TODAY_ISO)
  const [payRemark, setPayRemark] = useState("")
  const [payRecordedBy, setPayRecordedBy] = useState("")

  // Cheque-only fields
  const [payChequeNo, setPayChequeNo] = useState("")
  const [payChequeDate, setPayChequeDate] = useState("")
  const [payChequeFromBank, setPayChequeFromBank] = useState("")
  const [payChequeToBank, setPayChequeToBank] = useState("")
  const [payChequeBranch, setPayChequeBranch] = useState("")

  // Bank transfer-only fields
  const [payReferenceNo, setPayReferenceNo] = useState("")
  const [payTransferFromBank, setPayTransferFromBank] = useState("")
  const [payTransferToBank, setPayTransferToBank] = useState("")
  const [payTransferDate, setPayTransferDate] = useState("")

  const payingRow: ResolvedGrnOutstanding | undefined = useMemo(
    () => resolvedGrns.find((row) => row.grn.id === payingGrnId),
    [resolvedGrns, payingGrnId]
  )

  const openPayDialog = (row: ResolvedGrnOutstanding) => {
    setPayingGrnId(row.grn.id)
    setPayMethod("cash")
    setPayAmount(row.balance > 0 ? String(row.balance) : "")
    setPayDate(TODAY_ISO)
    setPayRemark("")
    setPayRecordedBy("")
    setPayChequeNo("")
    setPayChequeDate("")
    setPayChequeFromBank("")
    setPayChequeToBank("")
    setPayChequeBranch("")
    setPayReferenceNo("")
    setPayTransferFromBank("")
    setPayTransferToBank("")
    setPayTransferDate("")
    setPayDialogOpen(true)
  }

  const closePayDialog = () => {
    setPayDialogOpen(false)
    setPayingGrnId(null)
  }

  function formatAmount(value: number): string {
  return value.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

  const handleConfirmPayment = () => {
    if (!payingRow) return

    const amount = Number(payAmount)
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount", {
        description: "Payment amount must be greater than 0.",
      })
      return
    }

    if (!payDate) {
      toast.error("Payment date is required", {
        description: "Select the date this payment was made.",
      })
      return
    }

    if (payMethod === "cheque" && (!payChequeNo.trim() || !payChequeDate)) {
      toast.error("Cheque details incomplete", {
        description: "Enter the cheque number and cheque date.",
      })
      return
    }

    if (
      payMethod === "bank_transfer" &&
      (!payReferenceNo.trim() || !payTransferDate)
    ) {
      toast.error("Transfer details incomplete", {
        description: "Enter the reference number and transfer date.",
      })
      return
    }

    if (!payRecordedBy.trim()) {
      toast.error("Recorded by is required", {
        description: "Enter the name of the staff member recording this payment.",
      })
      return
    }

    const newPayment: GrnPayment = {
      id: crypto.randomUUID(),
      grnId: payingRow.grn.id,
      paymentMethod: payMethod,
      amountPaid: amount,
      paymentDate: payDate,
      remark: payRemark.trim(),
      recordedBy: payRecordedBy.trim(),
      ...(payMethod === "cheque"
        ? {
            chequeNo: payChequeNo.trim(),
            chequeDate: payChequeDate,
            chequeFromBank: payChequeFromBank.trim(),
            chequeToBank: payChequeToBank.trim(),
            chequeBranch: payChequeBranch.trim(),
            chequeStatus: "pending" as const,
          }
        : {}),
      ...(payMethod === "bank_transfer"
        ? {
            referenceNo: payReferenceNo.trim(),
            transferFromBank: payTransferFromBank.trim(),
            transferToBank: payTransferToBank.trim(),
            transferDate: payTransferDate,
          }
        : {}),
    }

    setPayments((prev) => [newPayment, ...prev])
    setExpandedGrnIds((prev) => new Set(prev).add(payingRow.grn.id))
    toast.success("Payment recorded", {
      description: `${formatCurrency(amount)} recorded against ${payingRow.grn.grnNumber}.`,
    })

    closePayDialog()
  }

  return (
    <TooltipProvider>
      <div className="w-full px-6 pb-6 lg:px-8 lg:pt-4 lg:pb-8">
        {/* ---- Header --------------------------------------------------------- */}
        <div className="-mt-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <Wallet2 className="size-5 text-muted-foreground" />
            </span>
            <div>
              <h1 className="text-xl font-semibold">Supplier Outstandings</h1>
              <p className="text-sm text-muted-foreground">
                Payments due to suppliers track, pay, manage cheques.
              </p>
            </div>
          </div>

          <Button type="button" onClick={handleSyncFromGrns}>
            <RefreshCw />
            Sync from GRNs
          </Button>
        </div>

        {/* ---- Filter by supplier --------------------------------------------------- */}
        <div className="mb-4 rounded-lg border border-border/60 bg-card/50 p-4">
          <label
            htmlFor="outstandings-supplier-filter"
            className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
          >
            Filter by Supplier
          </label>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="outstandings-supplier-filter"
              value={supplierQuery}
              onChange={(e) => setSupplierQuery(e.target.value)}
              placeholder="Search supplier name or code... "
              className="pl-9"
            />
          </div>
        </div>

        {/* ---- Stat cards -------------------------------------------------------- */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg border border-border/60 bg-card/50 p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Total GRNs
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {summary.totalGrns.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              based on current filter
            </p>
          </div>

          <div className="rounded-lg border border-border/60 bg-card/50 p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Total Billed
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
               {formatAmount(summary.totalBilled)}
            </p>
          </div>

          <div className="rounded-lg border border-border/60 bg-card/50 p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Total Paid
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {formatCurrency(summary.totalPaid)}
            </p>
          </div>

          <div className="rounded-lg border border-border/60 bg-card/50 p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Balance Due
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {formatCurrency(summary.balanceDue)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">outstanding to pay</p>
          </div>

          <div className="rounded-lg border border-border/60 bg-card/50 p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Pending Cheques
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {summary.pendingCheques.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              cheques not yet cleared
            </p>
          </div>
        </div>

        {/* ---- Tabs -------------------------------------------------------------- */}
        <Tabs defaultValue="grn">
          <TabsList>
            <TabsTrigger value="grn">GRN Outstandings</TabsTrigger>
            <TabsTrigger value="cheque">Cheque Tracker</TabsTrigger>
          </TabsList>

          {/* ---- GRN Outstandings tab ------------------------------------------------ */}
          <TabsContent value="grn" className="mt-4">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={grnSearch}
                  onChange={(e) => setGrnSearch(e.target.value)}
                  placeholder="Search GRN number, invoice number, supplier..."
                  className="pl-9"
                />
              </div>

              <ToggleGroup
                value={[grnStatusFilter]}
                onValueChange={(value: string[]) => {
                  const next = value.find((v) => v !== grnStatusFilter) ?? value[0]
                  if (next) setGrnStatusFilter(next as GrnOutstandingStatus | "all")
                }}
              >
                {GRN_STATUS_FILTER_OPTIONS.map((opt) => (
                  <ToggleGroupItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="rounded-lg border border-border/60 bg-card/50">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[9%]">GRN #</TableHead>
                    <TableHead className="w-[9%]">Invoice #</TableHead>
                    <TableHead className="w-[15%]">Supplier</TableHead>
                    <TableHead className="w-[10%]">GRN Date</TableHead>
                    <TableHead className="w-[10%]">Total (Rs.)</TableHead>
                    <TableHead className="w-[10%]">Paid (Rs.)</TableHead>
                    <TableHead className="w-[10%]">Balance (Rs.)</TableHead>
                    <TableHead className="w-[7%]">Progress</TableHead>
                    <TableHead className="w-[4%]">Status</TableHead>
                    <TableHead className="w-[15%] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGrns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-40 text-center">
                        <p className="text-sm text-muted-foreground">
                          No outstandings found.
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Use "Sync from GRNs" to generate outstanding invoices.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredGrns.map((row) => {
                      const isExpanded = expandedGrnIds.has(row.grn.id)
                      return (
                        <>
                          <TableRow key={row.grn.id}>
                            <TableCell className="truncate font-mono text-xs text-primary">
                              {row.grn.grnNumber}
                            </TableCell>
                            <TableCell className="truncate font-mono text-xs text-muted-foreground">
                              {row.grn.invoiceNumber}
                            </TableCell>
                            <TableCell className="font-medium">
                              <TruncatedWithTooltip
                                value={row.supplier?.supplierName}
                              />
                              <span className="block truncate text-xs text-muted-foreground">
                                {row.supplier?.supplierCode}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs tabular-nums">
                              {formatDisplayDate(row.grn.grnDate)}
                            </TableCell>
                            <TableCell className="text-xs tabular-nums">
                              {formatAmount(row.grn.totalAmount)}
                            </TableCell>
                            <TableCell className="text-xs tabular-nums">
                              {formatAmount(row.paidAmount)}
                            </TableCell>
                            <TableCell className="text-xs font-medium tabular-nums">
                              {formatAmount(row.balance)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <Progress value={row.progress} className="h-1.5" />
                                <span className="text-xs text-muted-foreground tabular-nums">
                                  {row.progress}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={GRN_STATUS_BADGE_VARIANT[row.status]}
                                className="font-normal"
                              >
                                {getGrnStatusLabel(row.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-nowrap items-center justify-end gap-1">
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={row.balance <= 0}
                                  onClick={() => openPayDialog(row)}
                                  className="h-7 shrink-0 px-2.5 text-xs"
                                >
                                  Pay
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 shrink-0 gap-1 px-2 text-xs"
                                  onClick={() => toggleExpandGrn(row.grn.id)}
                                  aria-expanded={isExpanded}
                                  aria-label={`Toggle payment history for ${row.grn.grnNumber}`}
                                >
                                  <ChevronDown
                                    className={cn(
                                      "size-3.5 transition-transform",
                                      isExpanded && "rotate-180"
                                    )}
                                  />
                                  {row.payments.length}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>

                          {isExpanded && (
                            <TableRow key={`${row.grn.id}-history`}>
                              <TableCell colSpan={10} className="bg-muted/30 p-4">
                                <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                  Payment History — {row.grn.grnNumber}
                                </p>
                                {row.payments.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">
                                    No payments recorded yet.
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {row.payments.map((payment) => (
                                      <div
                                        key={payment.id}
                                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 bg-card px-3 py-2 text-sm"
                                      >
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="tabular-nums text-muted-foreground">
                                            {formatDisplayDate(payment.paymentDate)}
                                          </span>
                                          <Badge variant="secondary" className="font-normal">
                                            {getPaymentMethodLabel(payment.paymentMethod)}
                                          </Badge>
                                          {payment.chequeStatus && (
                                            <Badge
                                              variant={
                                                CHEQUE_STATUS_BADGE_VARIANT[
                                                  payment.chequeStatus
                                                ]
                                              }
                                              className="font-normal"
                                            >
                                              {getChequeStatusLabel(payment.chequeStatus)}
                                            </Badge>
                                          )}
                                          {payment.remark && (
                                            <span className="text-xs text-muted-foreground">
                                              {payment.remark}
                                            </span>
                                          )}
                                        </div>
                                        <span className="font-medium tabular-nums">
                                          {formatCurrency(payment.amountPaid)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {filteredGrns.length > 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                {filteredGrns.length.toLocaleString()} outstanding
                {filteredGrns.length === 1 ? "" : "s"}
              </p>
            )}
          </TabsContent>

          {/* ---- Cheque Tracker tab ---------------------------------------------------- */}
          <TabsContent value="cheque" className="mt-4">
            <div className="mb-4">
              <ToggleGroup
                value={[chequeStatusFilter]}
                onValueChange={(value: string[]) => {
                  const next = value.find((v) => v !== chequeStatusFilter) ?? value[0]
                  if (next) setChequeStatusFilter(next as ChequeStatus | "all")
                }}
              >
                {CHEQUE_STATUS_FILTER_OPTIONS.map((opt) => (
                  <ToggleGroupItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="rounded-lg border border-border/60 bg-card/50">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[12%]">Cheque No.</TableHead>
                    <TableHead className="w-[14%]">GRN / Invoice</TableHead>
                    <TableHead className="w-[19%]">Supplier</TableHead>
                    <TableHead className="w-[11%]">Cheque Date</TableHead>
                    <TableHead className="w-[12%]">Amount</TableHead>
                    <TableHead className="w-[20%]">From Bank → To Bank</TableHead>
                    <TableHead className="w-[12%]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCheques.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-40 text-center">
                        <p className="text-sm text-muted-foreground">
                          No cheque payments found.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCheques.map(({ payment, grn, supplier }) => (
                      <TableRow key={payment.id}>
                        <TableCell className="truncate font-mono text-xs">
                          {payment.chequeNo ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex flex-col">
                            <span className="truncate text-foreground">
                              {grn?.grnNumber ?? "—"}
                            </span>
                            <span className="truncate text-xs">
                              {grn?.invoiceNumber}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <TruncatedWithTooltip value={supplier?.supplierName} />
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {formatDisplayDate(payment.chequeDate ?? payment.paymentDate)}
                        </TableCell>
                        <TableCell className="font-medium tabular-nums">
                          {formatCurrency(payment.amountPaid)}
                        </TableCell>
                        <TableCell className="truncate text-muted-foreground">
                          {payment.chequeFromBank} → {payment.chequeToBank}
                        </TableCell>
                        <TableCell>
                          {payment.chequeStatus && (
                            <Badge
                              variant={CHEQUE_STATUS_BADGE_VARIANT[payment.chequeStatus]}
                              className="font-normal"
                            >
                              {getChequeStatusLabel(payment.chequeStatus)}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {filteredCheques.length > 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                {filteredCheques.length.toLocaleString()} cheque payment
                {filteredCheques.length === 1 ? "" : "s"}
              </p>
            )}
          </TabsContent>
        </Tabs>

        {/* ---- Record Payment dialog -------------------------------------------------- */}
        <Dialog
          open={payDialogOpen}
          onOpenChange={(nextOpen) => !nextOpen && closePayDialog()}
        >
          <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-lg">
            <DialogHeader className="shrink-0 border-b border-border/60 p-6 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <DialogTitle>Record Payment</DialogTitle>
                  <DialogDescription>
                    {payingRow &&
                      `${payingRow.grn.grnNumber} · Invoice ${payingRow.grn.invoiceNumber}`}
                  </DialogDescription>
                </div>
                <DialogClose
                  render={(closeProps) => (
                    <Button
                      {...closeProps}
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="-mt-1 -mr-1 shrink-0"
                      aria-label="Close"
                    >
                     
                    </Button>
                  )}
                />
              </div>
            </DialogHeader>

            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              {payingRow && (
                <div className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-3 py-2.5">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Outstanding Balance
                    </p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(payingRow.balance)}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>Total: {formatCurrency(payingRow.grn.totalAmount)}</p>
                    <p>Paid: {formatCurrency(payingRow.paidAmount)}</p>
                  </div>
                </div>
              )}

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="pay-method">Payment Method</FieldLabel>
                  <ToggleGroup
                    id="pay-method"
                    value={[payMethod]}
                    onValueChange={(value: string[]) => {
                      const next = value.find((v) => v !== payMethod) ?? value[0]
                      if (next) setPayMethod(next as PaymentMethod)
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

                <FieldGroup className="sm:flex-row sm:*:flex-1">
                  <Field>
                    <FieldLabel htmlFor="pay-amount">Amount (Rs.)</FieldLabel>
                    <Input
                      id="pay-amount"
                      type="number"
                      min={0}
                      step="0.01"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="pay-date">Payment Date</FieldLabel>
                    <Input
                      id="pay-date"
                      type="date"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                    />
                  </Field>
                </FieldGroup>

                {payMethod === "cheque" && (
                  <div className="rounded-md border border-border/60 p-4">
                    <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Cheque Details
                    </p>
                    <FieldGroup>
                      <FieldGroup className="sm:flex-row sm:*:flex-1">
                        <Field>
                          <FieldLabel htmlFor="pay-cheque-no">Cheque No.</FieldLabel>
                          <Input
                            id="pay-cheque-no"
                            value={payChequeNo}
                            onChange={(e) => setPayChequeNo(e.target.value)}
                            placeholder="e.g. 004521"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="pay-cheque-date">Cheque Date</FieldLabel>
                          <Input
                            id="pay-cheque-date"
                            type="date"
                            value={payChequeDate}
                            onChange={(e) => setPayChequeDate(e.target.value)}
                          />
                        </Field>
                      </FieldGroup>

                      <FieldGroup className="sm:flex-row sm:*:flex-1">
                        <Field>
                          <FieldLabel htmlFor="pay-cheque-from-bank">
                            From Bank
                          </FieldLabel>
                          <Input
                            id="pay-cheque-from-bank"
                            value={payChequeFromBank}
                            onChange={(e) => setPayChequeFromBank(e.target.value)}
                            placeholder="e.g. Commercial Bank"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="pay-cheque-to-bank">To Bank</FieldLabel>
                          <Input
                            id="pay-cheque-to-bank"
                            value={payChequeToBank}
                            onChange={(e) => setPayChequeToBank(e.target.value)}
                            placeholder="e.g. BOC"
                          />
                        </Field>
                      </FieldGroup>

                      <Field>
                        <FieldLabel htmlFor="pay-cheque-branch">Branch</FieldLabel>
                        <Input
                          id="pay-cheque-branch"
                          value={payChequeBranch}
                          onChange={(e) => setPayChequeBranch(e.target.value)}
                          placeholder="e.g. Homagama"
                        />
                      </Field>
                    </FieldGroup>
                  </div>
                )}

                {payMethod === "bank_transfer" && (
                  <div className="rounded-md border border-border/60 p-4">
                    <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Transfer Details
                    </p>
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="pay-reference-no">
                          Reference No.
                        </FieldLabel>
                        <Input
                          id="pay-reference-no"
                          value={payReferenceNo}
                          onChange={(e) => setPayReferenceNo(e.target.value)}
                          placeholder="e.g. TXN-88213"
                        />
                      </Field>

                      <FieldGroup className="sm:flex-row sm:*:flex-1">
                        <Field>
                          <FieldLabel htmlFor="pay-transfer-from-bank">
                            From Bank
                          </FieldLabel>
                          <Input
                            id="pay-transfer-from-bank"
                            value={payTransferFromBank}
                            onChange={(e) => setPayTransferFromBank(e.target.value)}
                            placeholder="e.g. HNB"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="pay-transfer-to-bank">
                            To Bank
                          </FieldLabel>
                          <Input
                            id="pay-transfer-to-bank"
                            value={payTransferToBank}
                            onChange={(e) => setPayTransferToBank(e.target.value)}
                            placeholder="e.g. BOC"
                          />
                        </Field>
                      </FieldGroup>

                      <Field>
                        <FieldLabel htmlFor="pay-transfer-date">
                          Transfer Date
                        </FieldLabel>
                        <Input
                          id="pay-transfer-date"
                          type="date"
                          value={payTransferDate}
                          onChange={(e) => setPayTransferDate(e.target.value)}
                        />
                      </Field>
                    </FieldGroup>
                  </div>
                )}

                <FieldGroup className="sm:flex-row sm:*:flex-1">
                  <Field>
                    <FieldLabel htmlFor="pay-remark">Remark</FieldLabel>
                    <Textarea
                      id="pay-remark"
                      value={payRemark}
                      onChange={(e) => setPayRemark(e.target.value)}
                      placeholder="Optional note..."
                      rows={2}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="pay-recorded-by">Recorded By</FieldLabel>
                    <Input
                      id="pay-recorded-by"
                      value={payRecordedBy}
                      onChange={(e) => setPayRecordedBy(e.target.value)}
                      placeholder="Your name"
                    />
                  </Field>
                </FieldGroup>
              </FieldGroup>
            </div>

            <DialogFooter className="shrink-0 border-t border-border/60 p-6 pt-4">
              <DialogClose render={<Button type="button" variant="outline" />}>
                Cancel
              </DialogClose>
              <Button type="button" onClick={handleConfirmPayment}>
                Confirm Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}

export default SupplierOutstandings