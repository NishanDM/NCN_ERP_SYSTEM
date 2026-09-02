import { useMemo, useState } from "react"
import {
  Check,
  ChevronsUpDown,
  ReceiptText,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion"
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
import { cn } from "@/lib/utils"

//==========    COMPONENTS ===========================

import { INITIAL_SUPPLIERS, type SupplierRecord } from "./ViewAllSuppliersData"
import {
  formatCurrency,
  formatDisplayDate,
  getPaymentMethodLabel,
  PAYMENT_METHOD_OPTIONS,
  type PaymentMethod,
} from "./SupplierSettlementsData"
import {
  CHEQUE_STATUS_OPTIONS,
  countActiveSupplierPaymentFilters,
  DEFAULT_SUPPLIER_PAYMENT_FILTERS,
  filterSupplierPayments,
  getChequeStatusLabel,
  INITIAL_SUPPLIER_PAYMENTS,
  type ChequeStatus,
  type SupplierPaymentFilters,
} from "./SupplierPaymentsData"
import { getPaginationRange } from "@/lib/pagination"

const PAGE_SIZE = 5

const METHOD_FILTER_OPTIONS: { value: PaymentMethod | "all"; label: string }[] =
  [{ value: "all", label: "All" }, ...PAYMENT_METHOD_OPTIONS]

function SupplierPayments() {
  // ---- Reference data  ---------------------------------
  const suppliers: SupplierRecord[] = INITIAL_SUPPLIERS
  const payments = INITIAL_SUPPLIER_PAYMENTS

  const supplierById = useMemo(() => {
    const map = new Map<string, SupplierRecord>()
    suppliers.forEach((supplier) => map.set(supplier.id, supplier))
    return map
  }, [suppliers])

  // ---- Filters ------------------------------------------------------------------

  const [filters, setFilters] = useState<SupplierPaymentFilters>(
    DEFAULT_SUPPLIER_PAYMENT_FILTERS
  )
  const [supplierPopoverOpen, setSupplierPopoverOpen] = useState(false)
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const updateFilters = (patch: Partial<SupplierPaymentFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }))
    setCurrentPage(1)
  }

  const toggleSupplierFilter = (supplierId: string) => {
    updateFilters({
      supplierIds: filters.supplierIds.includes(supplierId)
        ? filters.supplierIds.filter((id) => id !== supplierId)
        : [...filters.supplierIds, supplierId],
    })
  }

  const clearAllFilters = () => {
    setFilters(DEFAULT_SUPPLIER_PAYMENT_FILTERS)
    setCurrentPage(1)
  }
  // ---- Filtering + aggregates -----------------------------------------------------

  const filteredPayments = useMemo(
    () => filterSupplierPayments(payments, filters),
    [payments, filters]
  )

  const totalAmount = useMemo(
    () => filteredPayments.reduce((sum, payment) => sum + payment.amountPaid, 0),
    [filteredPayments]
  )

  const activeFilterCount = useMemo(
    () => countActiveSupplierPaymentFilters(filters),
    [filters]
  )

  const hasAnyActiveFilter =
    activeFilterCount > 0 || filters.searchQuery.trim().length > 0

  // ---- Pagination -----------------------------------------------------------------

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedPayments = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE
    return filteredPayments.slice(start, start + PAGE_SIZE)
  }, [filteredPayments, safeCurrentPage])

  const paginationRange = useMemo(
    () => getPaginationRange(safeCurrentPage, totalPages),
    [safeCurrentPage, totalPages]
  )

  const startIndex =
    filteredPayments.length === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1
  const endIndex = Math.min(safeCurrentPage * PAGE_SIZE, filteredPayments.length)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  return (
    <div className="w-full px-6 pb-6 lg:px-8 lg:pt-4 lg:pb-8">
      {/* ---- Header --------------------------------------------------------- */}
      <div className="-mt-4 mb-6 flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
          <ReceiptText className="size-5 text-muted-foreground" />
        </span>
        <div>
          <h1 className="text-xl font-semibold">Supplier Payments Tracker</h1>
          <p className="text-sm text-muted-foreground">
            Search and review every payment made to suppliers, across all
            methods.
          </p>
        </div>
      </div>

      {/* ---- Stat cards -------------------------------------------------------- */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border/60 bg-card/50 p-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Payments Matched
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {filteredPayments.length.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            based on current filters
          </p>
        </div>

        <div className="rounded-lg border border-border/60 bg-card/50 p-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Total Amount
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatCurrency(totalAmount)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            across matched payments
          </p>
        </div>

        <div className="rounded-lg border border-border/60 bg-card/50 p-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Active Filters
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {activeFilterCount}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {activeFilterCount === 0
              ? "showing all payments"
              : "tap Reset Filters to clear"}
          </p>
        </div>
      </div>

      {/* ---- Search + filters ---------------------------------------------------- */}
      <div className="rounded-lg border border-border/60 bg-card/50 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.searchQuery}
              onChange={(e) => updateFilters({ searchQuery: e.target.value })}
              placeholder="Search GRN #, invoice #, cheque #, reference #, remark..."
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Supplier filter */}
            <Popover
              open={supplierPopoverOpen}
              onOpenChange={setSupplierPopoverOpen}
            >
              <PopoverTrigger
                render={(triggerProps) => (
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={supplierPopoverOpen}
                    className="w-full justify-between font-normal lg:w-56"
                    {...triggerProps}
                  >
                    <span className="truncate text-muted-foreground">
                      {filters.supplierIds.length === 0
                        ? "Filter by supplier..."
                        : `${filters.supplierIds.length} supplier${
                            filters.supplierIds.length > 1 ? "s" : ""
                          } selected`}
                    </span>
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
                      {suppliers.map((supplier) => (
                        <CommandItem
                          key={supplier.id}
                          value={`${supplier.supplierName} ${supplier.supplierCode}`}
                          onSelect={() => toggleSupplierFilter(supplier.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 size-4",
                              filters.supplierIds.includes(supplier.id)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{supplier.supplierName}</span>
                            <span className="text-xs text-muted-foreground">
                              {supplier.supplierCode}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Payment method filter */}
            <ToggleGroup
              value={[filters.method]}
              onValueChange={(value: string[]) => {
                const next = value.find((v) => v !== filters.method) ?? value[0]
                if (next) updateFilters({ method: next as PaymentMethod | "all" })
              }}
            >
              {METHOD_FILTER_OPTIONS.map((opt) => (
                <ToggleGroupItem key={opt.value} value={opt.value}>
                  {opt.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            {/* More filters toggle */}
            <Button
              type="button"
              variant="outline"
              className="gap-2 font-normal"
              onClick={() => setMoreFiltersOpen((prev) => !prev)}
              aria-expanded={moreFiltersOpen}
            >
              <SlidersHorizontal className="size-4" />
              More Filters
            </Button>

            {hasAnyActiveFilter && (
              <Button
                type="button"
                variant="ghost"
                className="gap-1.5 font-normal text-muted-foreground hover:text-foreground"
                onClick={clearAllFilters}
              >
                <X className="size-4" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Selected supplier chips */}
        {filters.supplierIds.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {filters.supplierIds.map((id) => {
              const supplier = supplierById.get(id)
              if (!supplier) return null
              return (
                <Badge key={id} variant="secondary" className="gap-1 font-normal">
                  {supplier.supplierName}
                  <button
                    type="button"
                    onClick={() => toggleSupplierFilter(id)}
                    className="ml-1 rounded-full text-muted-foreground hover:text-foreground"
                    aria-label={`Remove ${supplier.supplierName} filter`}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              )
            })}
          </div>
        )}

        {/* More filters panel */}
        <Accordion
          value={moreFiltersOpen ? ["filters"] : []}
          onValueChange={(value: string[]) =>
            setMoreFiltersOpen(value.includes("filters"))
          }
        >
          <AccordionItem value="filters" className="border-none">
            <AccordionContent className="pt-4 pb-0">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-1.5">
                  <label
                    htmlFor="filter-date-from"
                    className="text-sm font-medium"
                  >
                    Date From
                  </label>
                  <Input
                    id="filter-date-from"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => updateFilters({ dateFrom: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="filter-date-to" className="text-sm font-medium">
                    Date To
                  </label>
                  <Input
                    id="filter-date-to"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => updateFilters({ dateTo: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="filter-min-amount"
                    className="text-sm font-medium"
                  >
                    Min Amount (Rs.)
                  </label>
                  <Input
                    id="filter-min-amount"
                    type="number"
                    min={0}
                    value={filters.minAmount}
                    onChange={(e) => updateFilters({ minAmount: e.target.value })}
                    placeholder="No limit"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="filter-max-amount"
                    className="text-sm font-medium"
                  >
                    Max Amount (Rs.)
                  </label>
                  <Input
                    id="filter-max-amount"
                    type="number"
                    min={0}
                    value={filters.maxAmount}
                    onChange={(e) => updateFilters({ maxAmount: e.target.value })}
                    placeholder="No limit"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="filter-cheque-status"
                    className="text-sm font-medium"
                  >
                    Cheque Status
                  </label>
                  <Select
                    value={filters.chequeStatus}
                    onValueChange={(value) =>
                      updateFilters({
                        chequeStatus: value as ChequeStatus | "all",
                      })
                    }
                  >
                    <SelectTrigger id="filter-cheque-status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {CHEQUE_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* ---- Results table -------------------------------------------------------- */}
      <div className="mt-6 overflow-x-auto rounded-lg border border-border/60 bg-card/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>GRN / Invoice</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Remark</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <p className="text-sm text-muted-foreground">
                    No payments match these filters.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              paginatedPayments.map((payment) => {
                const supplier = supplierById.get(payment.supplierId)
                const reference = payment.chequeNo ?? payment.referenceNo ?? "—"

                return (
                  <TableRow key={payment.id}>
                    <TableCell className="tabular-nums">
                      {formatDisplayDate(payment.paymentDate)}
                    </TableCell>

                    <TableCell className="max-w-[200px] font-medium">
                      <span
                        className="block truncate"
                        title={supplier?.supplierName}
                      >
                        {supplier?.supplierName ?? "—"}
                      </span>
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      <div className="flex flex-col">
                        <span className="text-foreground">
                          {payment.grnNumber}
                        </span>
                        <span className="text-xs">{payment.invoiceNumber}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {getPaymentMethodLabel(payment.paymentMethod)}
                      </Badge>
                    </TableCell>

                    <TableCell className="font-mono text-xs">
                      {reference}
                    </TableCell>

                    <TableCell>
                      {payment.chequeStatus ? (
                        <Badge variant="outline" className="font-normal">
                          {getChequeStatusLabel(payment.chequeStatus)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="max-w-[200px] text-muted-foreground">
                      <span className="block truncate" title={payment.remark}>
                        {payment.remark || "—"}
                      </span>
                    </TableCell>

                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(payment.amountPaid)}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ---- Pagination ------------------------------------------------------------ */}
      {filteredPayments.length > 0 && (
        <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex}-{endIndex} of{" "}
            {filteredPayments.length.toLocaleString()} payments
          </p>

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
                      safeCurrentPage === 1
                        ? "pointer-events-none opacity-50"
                        : undefined
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
    </div>
  )
}
export default SupplierPayments
