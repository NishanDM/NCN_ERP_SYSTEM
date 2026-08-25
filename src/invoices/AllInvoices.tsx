import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  AlertTriangle,
  Copy,
  Eye,
  FileEdit,
  FileText,
  MoreVertical,
  NotebookPen,
  PlayCircle,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { getPaginationRange } from "@/lib/pagination"

import {
  INITIAL_INVOICES,
  MOCK_INVOICE_CUSTOMERS,
  PAYMENT_STATUS_FILTER_OPTIONS,
  getPaymentStatusLabel,
  type InvoiceRecord,
  type PaymentStatusFilter,
} from "./AllInvoicesData"
import { getPaymentMethodLabel } from "./CreateNewInvoiceData"
import { formatAmount } from "../stock/StockItemsData"

import InvoiceDetailsModal from "./InvoiceDetailsModal"
import DeleteInvoiceModal from "./DeleteInvoiceModal"

const ALL_VALUE = "all"
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const
const TOTAL_COLUMN_COUNT = 13

const renderTruncatedLabel = (label: string) => (
  <span className="block truncate" title={label}>
    {label}
  </span>
)

const formatDisplayDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split("-")
  return `${month}/${day}/${year.slice(2)}`
}

function PaymentStatusBadge({ status }: { status: InvoiceRecord["paymentStatus"] }) {
  if (status === "settled") {
    return (
      <Badge className="gap-1.5 border-emerald-200 bg-emerald-50 font-normal whitespace-nowrap text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400">
        <span className="size-1.5 rounded-full bg-emerald-600" />
        Settled
      </Badge>
    )
  }
  return (
    <Badge className="gap-1.5 border-amber-200 bg-amber-50 font-normal whitespace-nowrap text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400">
      <span className="size-1.5 rounded-full bg-amber-600" />
      Pending
    </Badge>
  )
}

function InvoiceStatusBadge({ status }: { status: InvoiceRecord["invoiceStatus"] }) {
  if (status === "completed") {
    return (
      <Badge className="gap-1.5 border-emerald-200 bg-emerald-50 font-normal whitespace-nowrap text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400">
        <span className="size-1.5 rounded-full bg-emerald-600" />
        Completed
      </Badge>
    )
  }
  return (
    <Badge className="gap-1.5 border-orange-200 bg-orange-50 font-normal whitespace-nowrap text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-400">
      <span className="size-1.5 rounded-full bg-orange-600" />
      Draft
    </Badge>
  )
}

function AllInvoices() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(INITIAL_INVOICES)

  const [searchQuery, setSearchQuery] = useState("")
  const [customerFilter, setCustomerFilter] = useState(ALL_VALUE)
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>(ALL_VALUE)

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(10)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // View modal state
  const [viewingInvoice, setViewingInvoice] = useState<InvoiceRecord | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)

  // Delete modal state
  const [deletingInvoice, setDeletingInvoice] = useState<InvoiceRecord | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  // ---- Summary stats ------------------------------

  const summary = useMemo(() => {
    const settled = invoices.filter((inv) => inv.paymentStatus === "settled").length
    return {
      total: invoices.length,
      settled,
      pending: invoices.length - settled,
    }
  }, [invoices])

  // ---- Filtering ------------------------------------------------------------------

  const filteredInvoices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return invoices.filter((invoice) => {
      const matchesQuery =
        !query ||
        invoice.invoiceNumber.toLowerCase().includes(query) ||
        invoice.customerName.toLowerCase().includes(query)

      const matchesCustomer =
        customerFilter === ALL_VALUE || invoice.customerName === customerFilter
      const matchesStatus = statusFilter === ALL_VALUE || invoice.paymentStatus === statusFilter

      return matchesQuery && matchesCustomer && matchesStatus
    })
  }, [invoices, searchQuery, customerFilter, statusFilter])

  const hasActiveFilters =
    searchQuery.trim() !== "" || customerFilter !== ALL_VALUE || statusFilter !== ALL_VALUE

  // ---- Pagination  -----------------------------------

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedInvoices = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize
    return filteredInvoices.slice(start, start + pageSize)
  }, [filteredInvoices, safeCurrentPage, pageSize])

  const paginationRange = useMemo(
    () => getPaginationRange(safeCurrentPage, totalPages),
    [safeCurrentPage, totalPages]
  )

  const startIndex = filteredInvoices.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1
  const endIndex = Math.min(safeCurrentPage * pageSize, filteredInvoices.length)

  const isAllVisibleSelected =
    paginatedInvoices.length > 0 &&
    paginatedInvoices.every((invoice) => selectedIds.has(invoice.id))

  // The invoices currently checked, resolved back to full records 
  const selectedInvoices = useMemo(
    () => invoices.filter((invoice) => selectedIds.has(invoice.id)),
    [invoices, selectedIds]
  )

  // ---- Handlers -------------------------------------------------------------------

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleCustomerFilterChange = (value: string | null) => {
    setCustomerFilter(value ?? ALL_VALUE)
    setCurrentPage(1)
  }

  const handleStatusFilterChange = (value: string | null) => {
    setStatusFilter((value ?? ALL_VALUE) as PaymentStatusFilter)
    setCurrentPage(1)
  }

  const handlePageSizeChange = (value: string | null) => {
    setPageSize(Number(value ?? 10))
    setCurrentPage(1)
  }

  const handleRefresh = () => {
    setSearchQuery("")
    setCustomerFilter(ALL_VALUE)
    setStatusFilter(ALL_VALUE)
    setSelectedIds(new Set())
    setCurrentPage(1)
    toast("Invoices refreshed")
  }

  const clearFilters = () => {
    setSearchQuery("")
    setCustomerFilter(ALL_VALUE)
    setStatusFilter(ALL_VALUE)
    setCurrentPage(1)
  }

  const handleCopy = (value: string, label: string) => {
    navigator.clipboard.writeText(value)
    toast.success("Copied to clipboard", { description: `${label}: ${value}` })
  }

  const toggleRowSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const allSelected = paginatedInvoices.every((invoice) => next.has(invoice.id))
      paginatedInvoices.forEach((invoice) => {
        if (allSelected) next.delete(invoice.id)
        else next.add(invoice.id)
      })
      return next
    })
  }

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  // ---- Row actions -------------------------------

  const handleViewInvoice = (invoice: InvoiceRecord) => {
    setViewingInvoice(invoice)
    setViewModalOpen(true)
  }

  const handleEditInvoice = (invoice: InvoiceRecord) => {
    toast(`Edit ${invoice.invoiceNumber}`, { description: "Invoice editing is coming soon." })
  }

  const handleContinueInvoice = (invoice: InvoiceRecord) => {
    toast(`Continue ${invoice.invoiceNumber}`, {
      description: "Resuming this draft is coming soon.",
    })
  }

  const handleEmergencyInvoice = (invoice: InvoiceRecord) => {
    toast(`Emergency flag set on ${invoice.invoiceNumber}`, {
      description: "Emergency handling is coming soon.",
    })
  }

  const handleNotesInvoice = (invoice: InvoiceRecord) => {
    toast(`Notes for ${invoice.invoiceNumber}`, { description: "Notes editing is coming soon." })
  }

  const handleDeleteInvoice = (invoice: InvoiceRecord) => {
    setDeletingInvoice(invoice)
    setDeleteModalOpen(true)
  }

  // Deletion confirmation handler
  const handleConfirmDelete = (invoiceId: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(invoiceId)
      return next
    })
  }

  // ---- Bulk actions  -----------------------------

  const handleBulkView = () => {
    if (selectedInvoices.length !== 1) return
    handleViewInvoice(selectedInvoices[0])
  }

  const handleBulkEmergency = () => {
    if (selectedInvoices.length === 0) return
    toast(
      selectedInvoices.length === 1
        ? `Emergency flag set on ${selectedInvoices[0].invoiceNumber}`
        : `Emergency flag set on ${selectedInvoices.length} invoices`,
      { description: "Emergency handling is coming soon." }
    )
  }

  const handleBulkNotes = () => {
    if (selectedInvoices.length === 0) return
    toast(
      selectedInvoices.length === 1
        ? `Notes for ${selectedInvoices[0].invoiceNumber}`
        : `Notes for ${selectedInvoices.length} invoices`,
      { description: "Notes editing is coming soon." }
    )
  }

  const handleBulkDelete = () => {
    if (selectedInvoices.length === 0) return
    if (selectedInvoices.length === 1) {
      handleDeleteInvoice(selectedInvoices[0])
    } else {
      toast("Bulk delete", {
        description: "Please select 1 invoice at a time to verify invoice number for deletion.",
      })
    }
  }

  return (
    <div className="w-full px-6 pb-6 lg:px-8 lg:pt-4 lg:pb-8">
      {/* ---- Header --------------------------------------------------------- */}
      <div className="-mt-4 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <FileText className="size-5 text-muted-foreground" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">All Invoices</h1>
            <p className="text-sm text-muted-foreground">
              Review and manage every sales invoice
            </p>
          </div>
        </div>
      </div>

      {/* ---- Summary stat cards ------------------------------------------------ */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:max-w-xl sm:grid-cols-3">
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-xs font-medium text-primary">Total Invoices</p>
          <p className="mt-1 text-2xl font-semibold text-primary">{summary.total}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Settled</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700 dark:text-emerald-400">
            {summary.settled}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Pending</p>
          <p className="mt-1 text-2xl font-semibold text-amber-700 dark:text-amber-400">
            {summary.pending}
          </p>
        </div>
      </div>

      {/* ---- Toolbar: customer + search + status + refresh ------------------------ */}
      <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <Select value={customerFilter} onValueChange={handleCustomerFilterChange}>
          <SelectTrigger className="w-full min-w-0 sm:w-56">
            <SelectValue placeholder="Select customer...">
              {(value: string | null) =>
                renderTruncatedLabel(
                  !value || value === ALL_VALUE ? "Select customer..." : value
                )
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All Customers</SelectItem>
            {MOCK_INVOICE_CUSTOMERS.map((customer) => (
              <SelectItem key={customer} value={customer}>
                {renderTruncatedLabel(customer)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by invoice ID, customer name or phone..."
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              title="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-full min-w-0 sm:w-40">
            <SelectValue placeholder="All Status">
              {(value: string | null) => getPaymentStatusLabel(value)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_STATUS_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button type="button" variant="outline" onClick={handleRefresh}>
          <RefreshCw />
          Refresh
        </Button>
      </div>

      {/* ---- Selection bar: action set depends on how many rows are checked -------- */}
      {selectedIds.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
          <span className="mr-1 font-medium text-primary">
            {selectedIds.size} invoice{selectedIds.size === 1 ? "" : "s"} selected
          </span>

          {selectedIds.size === 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleBulkView}
            >
              <Eye className="size-3.5" />
              View
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleBulkEmergency}
          >
            <AlertTriangle className="size-3.5" />
            Emergency
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleBulkNotes}
          >
            <NotebookPen className="size-3.5" />
            Notes
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
            onClick={handleBulkDelete}
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto h-7 px-2 text-xs"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear selection
          </Button>
        </div>
      )}

      {/* ---- Table --------------------------------------------------------------- */}
      <TooltipProvider>
        <div className="overflow-x-auto rounded-lg border border-border/60 bg-card/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={isAllVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    disabled={paginatedInvoices.length === 0}
                    className="size-4 rounded border-input accent-primary"
                    aria-label="Select all invoices on this page"
                  />
                </TableHead>
                <TableHead className="w-10">#</TableHead>
                <TableHead className="whitespace-nowrap">Invoice ID</TableHead>
                <TableHead className="whitespace-nowrap">Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right whitespace-nowrap">Net Total</TableHead>
                <TableHead>Internal Notes</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="whitespace-nowrap">Payment Status</TableHead>
                <TableHead className="whitespace-nowrap">Invoice Status</TableHead>
                <TableHead className="text-right whitespace-nowrap">Profit</TableHead>
                <TableHead className="w-10 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={TOTAL_COLUMN_COUNT} className="h-28 text-center">
                    <p className="text-sm text-muted-foreground">
                      No invoices match{" "}
                      {hasActiveFilters ? "the current filters" : "your search"}.
                    </p>
                    {hasActiveFilters && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="mt-1"
                        onClick={clearFilters}
                      >
                        Clear filters
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInvoices.map((invoice, index) => {
                  const isSelected = selectedIds.has(invoice.id)

                  return (
                    <TableRow
                      key={invoice.id}
                      aria-selected={isSelected}
                      className={cn(isSelected && "bg-primary/5 hover:bg-primary/10")}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRowSelection(invoice.id)}
                          className="size-4 rounded border-input accent-primary"
                          aria-label={`Select invoice ${invoice.invoiceNumber}`}
                        />
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground tabular-nums">
                        {startIndex + index}
                      </TableCell>

                      <TableCell className="font-mono text-xs">
                        <button
                          type="button"
                          onClick={() => handleCopy(invoice.invoiceNumber, "Invoice ID")}
                          className="group inline-flex items-center gap-1.5 text-primary hover:text-foreground"
                          title="Copy invoice number"
                        >
                          {invoice.invoiceNumber}
                          <Copy className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </button>
                      </TableCell>

                      <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                        {formatDisplayDate(invoice.date)}
                      </TableCell>

                      <TableCell className="max-w-[200px]">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <span className="block truncate text-left">
                                {invoice.customerName}
                              </span>
                            }
                          />
                          <TooltipContent>
                            <p>{invoice.customerName}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>

                      <TableCell className="text-sm whitespace-nowrap">
                        {getPaymentMethodLabel(invoice.paymentMethod)}
                      </TableCell>

                      <TableCell className="text-right font-medium tabular-nums">
                        {formatAmount(invoice.netTotal)}
                      </TableCell>

                      <TableCell className="max-w-[140px] text-sm text-muted-foreground">
                        {renderTruncatedLabel(invoice.internalNotes ?? "-")}
                      </TableCell>

                      <TableCell className="max-w-[140px] text-sm text-muted-foreground">
                        {renderTruncatedLabel(invoice.notes ?? "-")}
                      </TableCell>

                      <TableCell>
                        <PaymentStatusBadge status={invoice.paymentStatus} />
                      </TableCell>

                      <TableCell>
                        <InvoiceStatusBadge status={invoice.invoiceStatus} />
                      </TableCell>

                      <TableCell className="text-right font-medium tabular-nums text-emerald-600">
                        {formatAmount(invoice.profit)}
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={(triggerProps) => (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-muted-foreground"
                                  {...triggerProps}
                                >
                                  <MoreVertical className="size-4" />
                                </Button>
                              )}
                            />
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewInvoice(invoice)}>
                                <Eye className="mr-2 size-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>
                                <FileEdit className="mr-2 size-4" />
                                Edit
                              </DropdownMenuItem>
                              {invoice.invoiceStatus === "draft" && (
                                <DropdownMenuItem onClick={() => handleContinueInvoice(invoice)}>
                                  <PlayCircle className="mr-2 size-4" />
                                  Continue
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleEmergencyInvoice(invoice)}>
                                <AlertTriangle className="mr-2 size-4" />
                                Emergency
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleNotesInvoice(invoice)}>
                                <NotebookPen className="mr-2 size-4" />
                                Notes
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => handleDeleteInvoice(invoice)}
                              >
                                <Trash2 className="mr-2 size-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </TooltipProvider>

      {/* ---- Pagination ------------------------------------------------------------ */}
      {filteredInvoices.length > 0 && (
        <div className="mt-3 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground">
              Showing {startIndex} to {endIndex} of {filteredInvoices.length.toLocaleString()}{" "}
              invoices
            </p>

            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger size="sm" className="w-fit min-w-0">
                <SelectValue>{() => <span>{pageSize} / page</span>}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {totalPages > 1 && (
            <Pagination className="mx-0 w-fit">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      goToPage(safeCurrentPage - 1)
                    }}
                    aria-disabled={safeCurrentPage === 1}
                    className={
                      safeCurrentPage === 1 ? "pointer-events-none opacity-50" : undefined
                    }
                  />
                </PaginationItem>

                {paginationRange.map((page, index) =>
                  page === "ellipsis" ? (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={page === safeCurrentPage}
                        onClick={(e) => {
                          e.preventDefault()
                          goToPage(page)
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      goToPage(safeCurrentPage + 1)
                    }}
                    aria-disabled={safeCurrentPage === totalPages}
                    className={
                      safeCurrentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}

      {/* View Invoice Details Modal */}
      <InvoiceDetailsModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        invoice={viewingInvoice}
      />

      {/* Delete Invoice Confirmation Modal */}
      <DeleteInvoiceModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        invoice={deletingInvoice}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  )
}

export default AllInvoices
