import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  AlertTriangle,
  Copy,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Loader2,
  Package,
  PackageCheck,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  Wallet,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

//==========    COMPONENTS ===========================

import StockItemPopup from "./StockItemViewEditPopup"
import { exportStockItemsToExcel, exportStockItemsToPdf } from "./StockItemsExport"
import {
  getActiveItemCount,
  getLowStockCount,
  getTotalStockValue,
  getQuantityStatus,
  isLowStock,
  formatCurrency,
  formatAmount,
  INITIAL_STOCK_ITEMS,
  type QuantityFilter,
  type StatusFilter,
  type StockItemRecord,
} from "./StockItemsData"

// ---- Helpers ------------------------------------------------------------------

const renderTruncatedLabel = (label: string) => (
  <span className="block truncate" title={label}>
    {label}
  </span>
)

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


const getQuantityFilterLabel = (value: string | null): string =>
  QUANTITY_FILTER_OPTIONS.find((opt) => opt.value === value)?.label ?? "All Quantity"

const getStatusFilterLabel = (value: string | null): string =>
  STATUS_FILTER_OPTIONS.find((opt) => opt.value === value)?.label ?? "All Status"

const ALL_VALUE = "all"

// ---- Pagination ---------------------------------------------------------------

const PAGE_SIZE = 10

// Builds a compact page-number sequence with ellipses for large page counts,
// e.g. [1, "ellipsis", 6, 7, 8, "ellipsis", 42] — the same shape GitHub/
// Google-style pagination uses. Pure function, no component state involved,
// so it's easy to unit-test on its own later if needed.
function getPaginationRange(current: number, total: number): (number | "ellipsis")[] {
  const delta = 1
  const range: (number | "ellipsis")[] = []

  const start = Math.max(2, current - delta)
  const end = Math.min(total - 1, current + delta)

  range.push(1)
  if (start > 2) range.push("ellipsis")
  for (let page = start; page <= end; page++) range.push(page)
  if (end < total - 1) range.push("ellipsis")
  if (total > 1) range.push(total)

  return range
}

// ---- Component --------------------------------------------------------------

function StockItems() {
  const [items, setItems] = useState<StockItemRecord[]>(INITIAL_STOCK_ITEMS)

  const [deletingItem, setDeletingItem] = useState<StockItemRecord | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")

  const [activeItem, setActiveItem] = useState<StockItemRecord | null>(null)
  const [popupMode, setPopupMode] = useState<"view" | "edit">("view")

  const [searchQuery, setSearchQuery] = useState("")
  const [supplierFilter, setSupplierFilter] = useState(ALL_VALUE)
  const [brandFilter, setBrandFilter] = useState(ALL_VALUE)
  const [categoryFilter, setCategoryFilter] = useState(ALL_VALUE)
  const [subCategoryFilter, setSubCategoryFilter] = useState(ALL_VALUE)
  const [quantityFilter, setQuantityFilter] = useState<QuantityFilter>(ALL_VALUE)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(ALL_VALUE)

  const [currentPage, setCurrentPage] = useState(1)

  // Independent loading flags per export button — each export is its own
  // async operation and shouldn't block or reflect the state of the others.
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingSpecialPdf, setIsExportingSpecialPdf] = useState(false)

  // ---- Filter option lists, derived from the current item list -----------------

  const suppliers = useMemo(
    () => Array.from(new Set(items.map((item) => item.supplierName))).sort(),
    [items]
  )
  const brands = useMemo(
    () => Array.from(new Set(items.map((item) => item.brand))).sort(),
    [items]
  )
  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.categoryName))).sort(),
    [items]
  )
  // Sub-category options narrow to the selected category, same way an
  // admin would expect a dependent dropdown to behave.
  const subCategories = useMemo(() => {
    const source =
      categoryFilter === ALL_VALUE
        ? items
        : items.filter((item) => item.categoryName === categoryFilter)
    return Array.from(new Set(source.map((item) => item.subCategoryName))).sort()
  }, [items, categoryFilter])

  // Unfiltered category -> sub-category map for the edit popup. Kept
  // separate from `subCategories` above, which narrows to whatever
  // categoryFilter the *page* has selected — the popup's own category
  // dropdown must not be constrained by that.
  const subCategoriesByCategory = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const item of items) {
      if (!map[item.categoryName]) map[item.categoryName] = []
      if (!map[item.categoryName].includes(item.subCategoryName)) {
        map[item.categoryName].push(item.subCategoryName)
      }
    }
    for (const list of Object.values(map)) list.sort()
    return map
  }, [items])

  // Every filter/search change also jumps back to page 1 — otherwise a user
  // could type a search query and land on a page that's now out of range or
  // silently empty. This project's Select (base-ui, not Radix) reports
  // `null` when nothing is selected, so each handler normalizes that back
  // to ALL_VALUE.

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleSupplierFilterChange = (value: string | null) => {
    setSupplierFilter(value ?? ALL_VALUE)
    setCurrentPage(1)
  }

  const handleBrandFilterChange = (value: string | null) => {
    setBrandFilter(value ?? ALL_VALUE)
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

      const matchesSupplier = supplierFilter === ALL_VALUE || item.supplierName === supplierFilter
      const matchesBrand = brandFilter === ALL_VALUE || item.brand === brandFilter
      const matchesCategory = categoryFilter === ALL_VALUE || item.categoryName === categoryFilter
      const matchesSubCategory =
        subCategoryFilter === ALL_VALUE || item.subCategoryName === subCategoryFilter
      const matchesQuantity =
        quantityFilter === ALL_VALUE || getQuantityStatus(item) === quantityFilter
      const matchesStatus = statusFilter === ALL_VALUE || item.status === statusFilter

      return (
        matchesQuery &&
        matchesSupplier &&
        matchesBrand &&
        matchesCategory &&
        matchesSubCategory &&
        matchesQuantity &&
        matchesStatus
      )
    })
  }, [
    items,
    searchQuery,
    supplierFilter,
    brandFilter,
    categoryFilter,
    subCategoryFilter,
    quantityFilter,
    statusFilter,
  ])

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    supplierFilter !== ALL_VALUE ||
    brandFilter !== ALL_VALUE ||
    categoryFilter !== ALL_VALUE ||
    subCategoryFilter !== ALL_VALUE ||
    quantityFilter !== ALL_VALUE ||
    statusFilter !== ALL_VALUE

  const clearFilters = () => {
    setSearchQuery("")
    setSupplierFilter(ALL_VALUE)
    setBrandFilter(ALL_VALUE)
    setCategoryFilter(ALL_VALUE)
    setSubCategoryFilter(ALL_VALUE)
    setQuantityFilter(ALL_VALUE)
    setStatusFilter(ALL_VALUE)
    setCurrentPage(1)
  }

  const handleRefresh = () => {
    setItems(INITIAL_STOCK_ITEMS)
    clearFilters()
    toast("Stock items refreshed", {
      description: "The item list and filters have been reset to their defaults.",
    })
  }

  // ---- Pagination (derived from filteredItems) -----------------------------------

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))

  // Clamped rather than trusted as-is: if filtering/deleting shrinks the
  // result set, `currentPage` could point past the last real page. Clamping
  // here means the UI can never render a blank "page 7 of 3" — a second,
  // independent safeguard on top of the setCurrentPage(1) resets above.
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedItems = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE
    return filteredItems.slice(start, start + PAGE_SIZE)
  }, [filteredItems, safeCurrentPage])

  const paginationRange = useMemo(
    () => getPaginationRange(safeCurrentPage, totalPages),
    [safeCurrentPage, totalPages]
  )

  const startIndex = filteredItems.length === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1
  const endIndex = Math.min(safeCurrentPage * PAGE_SIZE, filteredItems.length)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  // ---- KPI summary (always over the full list, not the filtered view) -----------

  const totalItemCount = items.length
  const activeItemCount = useMemo(() => getActiveItemCount(items), [items])
  const lowStockCount = useMemo(() => getLowStockCount(items), [items])
  const stockValue = useMemo(() => getTotalStockValue(items), [items])
  const stockValueLabel = formatCurrency(stockValue)

  // ---- Row actions ----------------------------------------------------------------

  const handleCopy = (value: string, label: string) => {
    navigator.clipboard.writeText(value)
    toast.success("Copied to clipboard", { description: `${label}: ${value}` })
  }

  const handleView = (item: StockItemRecord) => {
    setActiveItem(item)
    setPopupMode("view")
  }

  const handleEdit = (item: StockItemRecord) => {
    setActiveItem(item)
    setPopupMode("edit")
  }

  const handleEditSubmit = (updated: StockItemRecord) => {
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
  }

  // ---- Delete flow ----------------------------------------------------------------

  const requestDeleteItem = (item: StockItemRecord) => {
    setDeletingItem(item)
    setDeleteConfirmText("")
  }

  const closeDeleteDialog = () => {
    setDeletingItem(null)
    setDeleteConfirmText("")
  }

  const isDeleteConfirmed =
    deletingItem !== null && deleteConfirmText.trim() === deletingItem.itemCode

  const confirmDeleteItem = () => {
    if (!deletingItem) return

    if (deleteConfirmText.trim() !== deletingItem.itemCode) {
      toast.error("Item code doesn't match", {
        description: "Type the exact item code to confirm deletion.",
      })
      return
    }

    setItems((prev) => prev.filter((item) => item.id !== deletingItem.id))
    toast.success("Item deleted", {
      description: `"${deletingItem.itemName}" was removed from stock.`,
    })
    closeDeleteDialog()
  }

  // ---- Export actions ---------------------------------------------------------------
  // Excel and PDF both export the *currently filtered* view — what the
  // user sees is what they get. Special PDF exports the full, unfiltered
  // stock as a complete report regardless of any filters applied on screen.

  const handleExportExcel = async () => {
    if (filteredItems.length === 0) {
      toast.error("Nothing to export", { description: "No items match the current filters." })
      return
    }

    setIsExportingExcel(true)
    try {
      await exportStockItemsToExcel(filteredItems, "filtered")
      toast.success("Excel file downloaded", {
        description: `Exported ${filteredItems.length.toLocaleString()} item(s).`,
      })
    } catch (error) {
      console.error("Excel export failed", error)
      toast.error("Excel export failed", { description: "Please try again." })
    } finally {
      setIsExportingExcel(false)
    }
  }

  const handleExportPdf = async () => {
    if (filteredItems.length === 0) {
      toast.error("Nothing to export", { description: "No items match the current filters." })
      return
    }

    setIsExportingPdf(true)
    try {
      await exportStockItemsToPdf(filteredItems, "filtered")
      toast.success("PDF downloaded", {
        description: `Exported ${filteredItems.length.toLocaleString()} item(s).`,
      })
    } catch (error) {
      console.error("PDF export failed", error)
      toast.error("PDF export failed", { description: "Please try again." })
    } finally {
      setIsExportingPdf(false)
    }
  }

  const handleDownloadSpecialPdf = async () => {
    setIsExportingSpecialPdf(true)
    try {
      await exportStockItemsToPdf(items, "full")
      toast.success("Special PDF downloaded", {
        description: `Full stock report with ${items.length.toLocaleString()} item(s).`,
      })
    } catch (error) {
      console.error("Special PDF export failed", error)
      toast.error("Special PDF export failed", { description: "Please try again." })
    } finally {
      setIsExportingSpecialPdf(false)
    }
  }

  return (
    <div className="w-full px-6 pb-6 lg:px-8 lg:pt-4 lg:pb-8">
      {/* ---- Header --------------------------------------------------------- */}
      <div className="-mt-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <Package className="size-5 text-muted-foreground" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">Stock Items</h1>
            <p className="text-sm text-muted-foreground">
              {totalItemCount.toLocaleString()} items across your stock
            </p>
          </div>
        </div>

        <Button variant="outline" size="icon" onClick={handleRefresh} title="Refresh stock items">
          <RefreshCw className="size-4" />
        </Button>
      </div>

      {/* ---- KPI summary row -------------------------------------------------- */}
      <TooltipProvider>
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Button
            type="button"
            variant="default"
            onClick={handleDownloadSpecialPdf}
            disabled={isExportingSpecialPdf}
            className="h-auto flex-col items-start gap-1 rounded-xl px-4 py-4 text-left whitespace-normal"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              {isExportingSpecialPdf ? (
                <Loader2 className="size-4 shrink-0 animate-spin" />
              ) : (
                <Download className="size-4 shrink-0" />
              )}
              {isExportingSpecialPdf ? "Generating report..." : "Download PDF"}
            </span>
            <span className="text-xs font-normal opacity-80">Full stock report</span>
          </Button>

          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Package className="size-4 text-muted-foreground" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Total Items</p>
              <p className="text-lg font-semibold tabular-nums">
                {totalItemCount.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <PackageCheck className="size-4 text-muted-foreground" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Active Items</p>
              <p className="text-lg font-semibold tabular-nums">
                {activeItemCount.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <AlertTriangle className="size-4 text-destructive" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Low Stock</p>
              <p className="text-lg font-semibold tabular-nums text-destructive">
                {lowStockCount.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Wallet className="size-4 text-muted-foreground" />
            </span>
            {/* min-w-0 is what lets the truncate below actually clip instead
                of stretching the tile — flex children default to a min
                width equal to their content otherwise. */}
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Stock Value</p>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <p className="truncate text-lg font-semibold tabular-nums">
                      {stockValueLabel}
                    </p>
                  }
                />
                <TooltipContent>
                  <p>{stockValueLabel}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </TooltipProvider>

      {/* ---- Toolbar: search, filters, export --------------------------------- */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search name, code, brand, SKU.."
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              title="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
         
          <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            <Select value={supplierFilter} onValueChange={handleSupplierFilterChange}>
              <SelectTrigger className="w-full min-w-0">
                <SelectValue placeholder="All Suppliers">
                  {(value: string | null) =>
                    renderTruncatedLabel(!value || value === ALL_VALUE ? "All Suppliers" : value)
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All Suppliers</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier} value={supplier}>
                    {renderTruncatedLabel(supplier)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={brandFilter} onValueChange={handleBrandFilterChange}>
              <SelectTrigger className="w-full min-w-0">
                <SelectValue placeholder="All Brands">
                  {(value: string | null) =>
                    renderTruncatedLabel(!value || value === ALL_VALUE ? "All Brands" : value)
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All Brands</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {renderTruncatedLabel(brand)}
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

            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-full min-w-0">
                <SelectValue placeholder="All Status">
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

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleExportExcel}
              disabled={isExportingExcel}
            >
              {isExportingExcel ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />}
              Excel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
            >
              {isExportingPdf ? <Loader2 className="animate-spin" /> : <FileText />}
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* ---- Table -------------------------------------------------------------- */}
      <div className="overflow-x-auto rounded-lg border border-border/60 bg-card/50">
        <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Code</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Sub-Category</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="whitespace-nowrap text-right">
                  Supplier Price (Rs.)
                </TableHead>
                <TableHead className="whitespace-nowrap text-right">Cost Price (Rs.)</TableHead>
                <TableHead className="whitespace-nowrap text-right">Selling Price (Rs.)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="h-32 text-center">
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
                  const lowStock = isLowStock(item)

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">
                        <button
                          type="button"
                          onClick={() => handleCopy(item.itemCode, "Item Code")}
                          className="group inline-flex items-center gap-1.5 hover:text-foreground"
                          title="Copy item code"
                        >
                          {item.itemCode}
                          <Copy className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </button>
                      </TableCell>

                      <TableCell className="max-w-[220px]">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <span className="block truncate text-left">
                                {item.itemName}
                              </span>
                            }
                          />
                          <TooltipContent>
                            <p>{item.itemName}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>

                      <TableCell className="max-w-[140px] text-muted-foreground">
                        {renderTruncatedLabel(item.brand)}
                      </TableCell>

                      <TableCell className="font-mono text-xs">
                        <button
                          type="button"
                          onClick={() => handleCopy(item.stockKeepingUnit, "SKU")}
                          className="group inline-flex items-center gap-1.5 hover:text-foreground"
                          title="Copy part number"
                        >
                          {item.stockKeepingUnit}
                          <Copy className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </button>
                      </TableCell>

                      <TableCell className="max-w-[140px]">
                        <Badge
                          variant="secondary"
                          className="max-w-full font-normal"
                          title={item.categoryName}
                        >
                          <span className="truncate">{item.categoryName}</span>
                        </Badge>
                      </TableCell>

                      <TableCell className="max-w-[140px]">
                        <Badge
                          variant="outline"
                          className="max-w-full font-normal"
                          title={item.subCategoryName}
                        >
                          <span className="truncate">{item.subCategoryName}</span>
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <span
                          className={
                            lowStock
                              ? "inline-flex items-center gap-1 font-medium tabular-nums text-destructive"
                              : "tabular-nums"
                          }
                        >
                          {lowStock && <AlertTriangle className="size-3" />}
                          {item.quantity}
                        </span>
                      </TableCell>

                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {formatAmount(item.supplierUnitPrice)}
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

                      <TableCell>
                        <div className="flex items-center justify-end gap-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground"
                            title="View item"
                            onClick={() => handleView(item)}
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground"
                            title="Edit item"
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            title="Delete item"
                            onClick={() => requestDeleteItem(item)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TooltipProvider>
      </div>

      {/* ---- Pagination ---------------------------------------------------------- */}
      {filteredItems.length > 0 && (
        <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex}-{endIndex} of {filteredItems.length.toLocaleString()} items
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

      {/* ---- View / Edit item ------------------------------------------------------ */}
      <StockItemPopup
        open={Boolean(activeItem)}
        onOpenChange={(open) => !open && setActiveItem(null)}
        item={activeItem}
        mode={popupMode}
        onSwitchToEdit={() => setPopupMode("edit")}
        categories={categories}
        subCategoriesByCategory={subCategoriesByCategory}
        brands={brands}
        suppliers={suppliers}
        onSubmit={handleEditSubmit}
      />

      {/* ---- Delete item confirmation --------------------------------------------- */}
      <AlertDialog
        open={Boolean(deletingItem)}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deletingItem?.itemName}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent and can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm">
              <p className="font-medium text-destructive">This will permanently remove:</p>
              <ul className="mt-1.5 space-y-0.5 text-muted-foreground">
                <li>
                  Item code <span className="font-mono">{deletingItem?.itemCode}</span>
                </li>
                <li>{deletingItem?.quantity ?? 0} unit(s) from current stock</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="delete-item-confirm-input" className="text-sm font-medium">
                Type <span className="font-mono font-semibold">"{deletingItem?.itemCode}" </span>
                to confirm
              </label>
              <Input
                id="delete-item-confirm-input"
                autoFocus
                autoComplete="off"
                spellCheck={false}
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={deletingItem?.itemCode}
                aria-invalid={deleteConfirmText.length > 0 && !isDeleteConfirmed}
                className={
                  deleteConfirmText.length > 0 && !isDeleteConfirmed
                    ? "border-destructive focus-visible:ring-destructive"
                    : undefined
                }
              />
              <p className="text-xs text-muted-foreground">This is case sensitive.</p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!isDeleteConfirmed}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-50"
              onClick={confirmDeleteItem}
            >
              Delete Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default StockItems