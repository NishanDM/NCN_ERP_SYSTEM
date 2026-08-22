import { useMemo, useState } from "react"
import { RefreshCw, Search, X } from "lucide-react"
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
import { cn } from "@/lib/utils"
import { getPaginationRange } from "@/lib/pagination"

import {
  getQuantityStatus,
  formatAmount,
  INITIAL_STOCK_ITEMS,
  type QuantityFilter,
  type StatusFilter,
  type StockItemRecord,
} from "../stock/StockItemsData"

const ALL_VALUE = "all"

const QUANTITY_FILTER_OPTIONS: { value: QuantityFilter; label: string }[] = [
  { value: "all", label: "All Quantity" },
  { value: "in_stock", label: "In Stock" },
  { value: "low_stock", label: "Low Stock" },
  { value: "out_of_stock", label: "Out of Stock" },
]

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
]

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50] as const

const getQuantityFilterLabel = (value: string | null): string =>
  QUANTITY_FILTER_OPTIONS.find((opt) => opt.value === value)?.label ?? "All Quantity"

const getStatusFilterLabel = (value: string | null): string =>
  STATUS_FILTER_OPTIONS.find((opt) => opt.value === value)?.label ?? "All Status"

const renderTruncatedLabel = (label: string) => (
  <span className="block truncate" title={label}>
    {label}
  </span>
)

// ---- Props --------------------------------------------------------------------

interface StockTableForNewInvoiceProps {
  selectedItemIds: Set<string>
  onToggleItem: (item: StockItemRecord) => void
}

function StockTableForNewInvoice({
  selectedItemIds,
  onToggleItem,
}: StockTableForNewInvoiceProps) {
  const [items] = useState<StockItemRecord[]>(INITIAL_STOCK_ITEMS)

  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState(ALL_VALUE)
  const [subCategoryFilter, setSubCategoryFilter] = useState(ALL_VALUE)
  const [quantityFilter, setQuantityFilter] = useState<QuantityFilter>(ALL_VALUE)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active")

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(5)

  // ---- Filter option lists, derived from the current item list ----------------

  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.categoryName))).sort(),
    [items]
  )

  const subCategories = useMemo(() => {
    const source =
      categoryFilter === ALL_VALUE
        ? items
        : items.filter((item) => item.categoryName === categoryFilter)
    return Array.from(new Set(source.map((item) => item.subCategoryName))).sort()
  }, [items, categoryFilter])


  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleCategoryFilterChange = (value: string | null) => {
    setCategoryFilter(value ?? ALL_VALUE)
    setSubCategoryFilter(ALL_VALUE)
    setCurrentPage(1)
  }

  const handleSubCategoryFilterChange = (value: string | null) => {
    setSubCategoryFilter(value ?? ALL_VALUE)
    setCurrentPage(1)
  }

  const handleQuantityFilterChange = (value: string | null) => {
    setQuantityFilter((value ?? ALL_VALUE) as QuantityFilter)
    setCurrentPage(1)
  }

  const handleStatusFilterChange = (value: string | null) => {
    setStatusFilter((value ?? ALL_VALUE) as StatusFilter)
    setCurrentPage(1)
  }

  const handlePageSizeChange = (value: string | null) => {
    setPageSize(Number(value ?? 5))
    setCurrentPage(1)
  }

  const handleRefresh = () => {
    setSearchQuery("")
    setCategoryFilter(ALL_VALUE)
    setSubCategoryFilter(ALL_VALUE)
    setQuantityFilter(ALL_VALUE)
    setStatusFilter("active")
    setCurrentPage(1)
  }

  // ---- Filtering ----------------------------------------------------------------

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return items.filter((item) => {
      const matchesQuery =
        !query ||
        item.itemCode.toLowerCase().includes(query) ||
        item.itemName.toLowerCase().includes(query) ||
        item.brand.toLowerCase().includes(query) ||
        item.stockKeepingUnit.toLowerCase().includes(query)

      const matchesCategory = categoryFilter === ALL_VALUE || item.categoryName === categoryFilter
      const matchesSubCategory =
        subCategoryFilter === ALL_VALUE || item.subCategoryName === subCategoryFilter
      const matchesQuantity =
        quantityFilter === ALL_VALUE || getQuantityStatus(item) === quantityFilter
      const matchesStatus = statusFilter === ALL_VALUE || item.status === statusFilter

      return matchesQuery && matchesCategory && matchesSubCategory && matchesQuantity && matchesStatus
    })
  }, [items, searchQuery, categoryFilter, subCategoryFilter, quantityFilter, statusFilter])

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    categoryFilter !== ALL_VALUE ||
    subCategoryFilter !== ALL_VALUE ||
    quantityFilter !== ALL_VALUE ||
    statusFilter !== "active"

  const clearFilters = () => {
    setSearchQuery("")
    setCategoryFilter(ALL_VALUE)
    setSubCategoryFilter(ALL_VALUE)
    setQuantityFilter(ALL_VALUE)
    setStatusFilter("active")
    setCurrentPage(1)
  }

  // ---- Pagination (derived from filteredItems) -----------------------------------

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedItems = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize
    return filteredItems.slice(start, start + pageSize)
  }, [filteredItems, safeCurrentPage, pageSize])

  const paginationRange = useMemo(
    () => getPaginationRange(safeCurrentPage, totalPages),
    [safeCurrentPage, totalPages]
  )

  const startIndex = filteredItems.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1
  const endIndex = Math.min(safeCurrentPage * pageSize, filteredItems.length)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-4">
      {/* ---- Header ------------------------------------------------------------ */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Select Item for Invoice</h3>
          <p className="text-xs text-muted-foreground">
            {filteredItems.length.toLocaleString()} items available
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          title="Reset search & filters"
        >
          <RefreshCw className="size-4" />
        </Button>
      </div>

      {/* ---- Toolbar: search + filters ------------------------------------------ */}
      <div className="mb-3 flex flex-col gap-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search name, code, brand, part no..."
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

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Select value={quantityFilter} onValueChange={handleQuantityFilterChange}>
            <SelectTrigger className="w-full min-w-0">
              <SelectValue placeholder="All Quantity">
                {(value: string | null) => renderTruncatedLabel(getQuantityFilterLabel(value))}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {QUANTITY_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={handleCategoryFilterChange}>
            <SelectTrigger className="w-full min-w-0">
              <SelectValue placeholder="All Categories">
                {(value: string | null) =>
                  renderTruncatedLabel(!value || value === ALL_VALUE ? "All Categories" : value)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {renderTruncatedLabel(category)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={subCategoryFilter} onValueChange={handleSubCategoryFilterChange}>
            <SelectTrigger className="w-full min-w-0">
              <SelectValue placeholder="All Sub-categories">
                {(value: string | null) =>
                  renderTruncatedLabel(
                    !value || value === ALL_VALUE ? "All Sub-categories" : value
                  )
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All Sub-categories</SelectItem>
              {subCategories.map((subCategory) => (
                <SelectItem key={subCategory} value={subCategory}>
                  {renderTruncatedLabel(subCategory)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-full min-w-0">
              <SelectValue placeholder="Active">
                {(value: string | null) => renderTruncatedLabel(getStatusFilterLabel(value))}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ---- Table --------------------------------------------------------------- */}
      <div className="overflow-x-auto rounded-lg border border-border/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Code</TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead className="text-right">Supplier Unit Price</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Cost Price</TableHead>
              <TableHead className="text-right">Selling Price</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-28 text-center">
                  <p className="text-sm text-muted-foreground">
                    No items match {hasActiveFilters ? "the current filters" : "your stock"}.
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
              paginatedItems.map((item) => {
                const isSelected = selectedItemIds.has(item.id)

                return (
                  <TableRow
                    key={item.id}
                    onClick={() => onToggleItem(item)}
                    aria-selected={isSelected}
                    className={cn(
                      "cursor-pointer",
                      isSelected && "bg-primary/5 hover:bg-primary/10"
                    )}
                  >
                    <TableCell className="font-mono text-xs text-primary">
                      {item.itemCode}
                    </TableCell>

                    <TableCell className="max-w-[280px]">
                      <span
                        className={cn(
                          "block truncate",
                          isSelected && "font-medium"
                        )}
                        title={item.itemName}
                      >
                        {item.itemName}
                      </span>
                    </TableCell>

                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatAmount(item.supplierUnitPrice)}
                    </TableCell>

                    <TableCell className="text-right tabular-nums">
                      {item.quantity}{" "}
                      <span className="text-muted-foreground">/{item.reorderLevel}</span>
                    </TableCell>

                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatAmount(item.costPrice)}
                    </TableCell>

                    <TableCell className="text-right font-medium tabular-nums">
                      {formatAmount(item.sellingPrice)}
                    </TableCell>

                    <TableCell>
                      {item.status === "active" ? (
                        <Badge variant="secondary" className="gap-1.5 font-normal">
                          <span className="size-1.5 rounded-full bg-foreground/70" />
                          Active
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="gap-1.5 font-normal text-muted-foreground"
                        >
                          <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ---- Pagination ------------------------------------------------------------ */}
      {filteredItems.length > 0 && (
        <div className="mt-3 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground">
              Showing {startIndex}-{endIndex} of {filteredItems.length.toLocaleString()}
            </p>

            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger size="sm" className="w-fit min-w-0">
                <SelectValue>
                  {() => <span>{pageSize} / page</span>}
                </SelectValue>
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
    </div>
  )
}

export default StockTableForNewInvoice